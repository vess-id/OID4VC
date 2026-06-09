/**
 * Transaction Data utilities for OID4VP 1.0
 *
 * Provides hash-based binding between authorization requests and responses
 * using transaction_data parameter.
 */

import { TransactionDataRequestV1_0, TransactionDataResponseV1_0 } from '../types/V1_0.types'
import { NonEmptyArray } from '../types/SIOP.types'

/**
 * Default hash algorithm (SHA-256)
 */
export const DEFAULT_HASH_ALGORITHM = 'sha-256'

/**
 * Supported hash algorithms
 */
export const SUPPORTED_HASH_ALGORITHMS = ['sha-256', 'sha-384', 'sha-512'] as const

export type HashAlgorithm = (typeof SUPPORTED_HASH_ALGORITHMS)[number]

/**
 * Computes a hash of the given data using the specified algorithm
 *
 * @param data - Data to hash (string or Uint8Array)
 * @param algorithm - Hash algorithm to use (default: sha-256)
 * @returns Hash as hex string
 */
export async function computeHash(data: string | Uint8Array, algorithm: HashAlgorithm = 'sha-256'): Promise<string> {
  const encoder = new TextEncoder()
  const dataBytes = typeof data === 'string' ? encoder.encode(data) : data

  // Map algorithm names to Web Crypto API algorithm names
  const algoMap: Record<HashAlgorithm, string> = {
    'sha-256': 'SHA-256',
    'sha-384': 'SHA-384',
    'sha-512': 'SHA-512',
  }

  const cryptoAlgo = algoMap[algorithm]

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Browser or Node.js with Web Crypto API
    const hashBuffer = await crypto.subtle.digest(cryptoAlgo, dataBytes)
    return bufferToHex(new Uint8Array(hashBuffer))
  } else {
    // Fallback for Node.js without Web Crypto API
    try {
      const { createHash } = await import('crypto')
      const hash = createHash(algorithm)
      hash.update(dataBytes)
      return hash.digest('hex')
    } catch (error) {
      throw new Error(`Hash algorithm ${algorithm} not available. Please provide Web Crypto API or Node.js crypto module.`)
    }
  }
}

/**
 * Converts a buffer to hex string
 *
 * @param buffer - Buffer to convert
 * @returns Hex string
 */
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Creates a transaction data request
 *
 * @param type - Type of transaction data
 * @param credentialIds - Credential IDs to bind
 * @param hashAlgorithms - Supported hash algorithms (defaults to ["sha-256"])
 * @param additionalData - Additional type-specific data
 * @returns TransactionDataRequest
 */
export function createTransactionDataRequest(
  type: string,
  credentialIds: NonEmptyArray<string>,
  hashAlgorithms?: NonEmptyArray<string>,
  additionalData?: Record<string, any>
): TransactionDataRequestV1_0 {
  return {
    type,
    credential_ids: credentialIds,
    transaction_data_hashes_alg: hashAlgorithms || ([DEFAULT_HASH_ALGORITHM] as NonEmptyArray<string>),
    ...additionalData,
  }
}

/**
 * Computes transaction data hashes for multiple data items
 *
 * @param transactionData - Array of transaction data items (strings or objects)
 * @param algorithm - Hash algorithm to use (default: sha-256)
 * @returns Array of hashes as hex strings
 */
export async function computeTransactionDataHashes(
  transactionData: (string | Record<string, any>)[],
  algorithm: HashAlgorithm = 'sha-256'
): Promise<NonEmptyArray<string>> {
  if (transactionData.length === 0) {
    throw new Error('Transaction data array must be non-empty')
  }

  const hashes = await Promise.all(
    transactionData.map(async (item) => {
      // Convert object to canonical JSON if needed
      const dataString = typeof item === 'string' ? item : JSON.stringify(item)
      return computeHash(dataString, algorithm)
    })
  )

  return hashes as NonEmptyArray<string>
}

/**
 * Creates a transaction data response with computed hashes
 *
 * @param transactionData - Array of transaction data items
 * @param algorithm - Hash algorithm used (default: sha-256)
 * @returns TransactionDataResponse with computed hashes
 */
export async function createTransactionDataResponse(
  transactionData: (string | Record<string, any>)[],
  algorithm: HashAlgorithm = 'sha-256'
): Promise<TransactionDataResponseV1_0> {
  const hashes = await computeTransactionDataHashes(transactionData, algorithm)

  return {
    transaction_data_hashes: hashes,
    transaction_data_hashes_alg: algorithm,
  }
}

/**
 * Verifies transaction data hashes match the provided data
 *
 * @param transactionData - Array of transaction data items
 * @param expectedHashes - Expected hashes
 * @param algorithm - Hash algorithm to use (default: sha-256)
 * @returns true if all hashes match
 */
export async function verifyTransactionDataHashes(
  transactionData: (string | Record<string, any>)[],
  expectedHashes: string[],
  algorithm: HashAlgorithm = 'sha-256'
): Promise<boolean> {
  if (transactionData.length !== expectedHashes.length) {
    return false
  }

  const computedHashes = await computeTransactionDataHashes(transactionData, algorithm)

  // Constant-time comparison to prevent timing attacks
  for (let i = 0; i < computedHashes.length; i++) {
    if (computedHashes[i] !== expectedHashes[i]) {
      return false
    }
  }

  return true
}

/**
 * Validates transaction data request structure
 *
 * @param request - Transaction data request to validate
 * @returns true if valid, throws error otherwise
 */
export function validateTransactionDataRequest(request: TransactionDataRequestV1_0): boolean {
  if (!request.type || typeof request.type !== 'string') {
    throw new Error('Transaction data request must have a type')
  }

  if (!request.credential_ids || !Array.isArray(request.credential_ids) || request.credential_ids.length === 0) {
    throw new Error('Transaction data request must have non-empty credential_ids array')
  }

  // transaction_data_hashes_alg is optional, defaults to ["sha-256"]
  if (request.transaction_data_hashes_alg) {
    if (!Array.isArray(request.transaction_data_hashes_alg) || request.transaction_data_hashes_alg.length === 0) {
      throw new Error('transaction_data_hashes_alg must be a non-empty array if present')
    }

    // Validate algorithm names
    for (const alg of request.transaction_data_hashes_alg) {
      if (typeof alg !== 'string' || alg.trim().length === 0) {
        throw new Error(`Invalid hash algorithm: ${alg}`)
      }
    }
  }

  return true
}

/**
 * Validates transaction data response structure
 *
 * @param response - Transaction data response to validate
 * @returns true if valid, throws error otherwise
 */
export function validateTransactionDataResponse(response: TransactionDataResponseV1_0): boolean {
  if (!response.transaction_data_hashes || !Array.isArray(response.transaction_data_hashes)) {
    throw new Error('Transaction data response must have transaction_data_hashes array')
  }

  if (response.transaction_data_hashes.length === 0) {
    throw new Error('transaction_data_hashes must be non-empty')
  }

  // Validate all hashes are strings
  for (const hash of response.transaction_data_hashes) {
    if (typeof hash !== 'string' || hash.trim().length === 0) {
      throw new Error('All transaction_data_hashes must be non-empty strings')
    }

    // Validate hex format (optional but recommended)
    if (!/^[0-9a-f]+$/i.test(hash)) {
      throw new Error(`Invalid hash format (expected hex): ${hash}`)
    }
  }

  // Validate algorithm if present
  if (response.transaction_data_hashes_alg) {
    if (typeof response.transaction_data_hashes_alg !== 'string') {
      throw new Error('transaction_data_hashes_alg must be a string')
    }
  }

  return true
}

/**
 * Selects the best hash algorithm from supported algorithms
 *
 * @param supportedAlgorithms - Algorithms supported by the verifier
 * @param preferredAlgorithm - Preferred algorithm (optional)
 * @returns Selected algorithm
 */
export function selectHashAlgorithm(
  supportedAlgorithms: string[],
  preferredAlgorithm?: HashAlgorithm
): HashAlgorithm {
  if (supportedAlgorithms.length === 0) {
    return DEFAULT_HASH_ALGORITHM
  }

  // Use preferred algorithm if supported
  if (preferredAlgorithm && supportedAlgorithms.includes(preferredAlgorithm)) {
    return preferredAlgorithm
  }

  // Prefer stronger algorithms
  if (supportedAlgorithms.includes('sha-512')) {
    return 'sha-512'
  }
  if (supportedAlgorithms.includes('sha-384')) {
    return 'sha-384'
  }
  if (supportedAlgorithms.includes('sha-256')) {
    return 'sha-256'
  }

  // Fallback to first supported algorithm
  const firstAlg = supportedAlgorithms[0].toLowerCase()
  if (SUPPORTED_HASH_ALGORITHMS.includes(firstAlg as HashAlgorithm)) {
    return firstAlg as HashAlgorithm
  }

  // Fallback to default
  return DEFAULT_HASH_ALGORITHM
}

/**
 * Extracts transaction data from authorization request
 *
 * @param request - Authorization request payload
 * @returns Array of transaction data requests, or undefined
 */
export function extractTransactionData(request: any): TransactionDataRequestV1_0[] | undefined {
  if (!request || !request.transaction_data) {
    return undefined
  }

  if (!Array.isArray(request.transaction_data)) {
    return undefined
  }

  return request.transaction_data
}

/**
 * Checks if a credential ID is included in transaction data
 *
 * @param credentialId - Credential ID to check
 * @param transactionData - Array of transaction data requests
 * @returns true if credential is bound to transaction data
 */
export function isCredentialBoundToTransaction(credentialId: string, transactionData: TransactionDataRequestV1_0[]): boolean {
  if (!transactionData || transactionData.length === 0) {
    return false
  }

  return transactionData.some((td) => td.credential_ids.includes(credentialId))
}
