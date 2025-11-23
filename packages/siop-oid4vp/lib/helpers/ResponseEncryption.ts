/**
 * Response Encryption utilities for OID4VP 1.0
 *
 * Supports encrypted responses using JWE (JSON Web Encryption)
 * as defined in OID4VP 1.0 specification.
 */

import { ResponseEncryptionMetadataV1_0 } from '../types/V1_0.types'
import { JWK } from '@sphereon/oid4vc-common'

/**
 * Default encryption algorithms supported
 */
export const DEFAULT_ENC_VALUES = ['A256GCM', 'A128GCM', 'A256CBC-HS512', 'A128CBC-HS256'] as const
export const DEFAULT_ALG_VALUES = ['ECDH-ES', 'ECDH-ES+A256KW', 'ECDH-ES+A128KW', 'RSA-OAEP', 'RSA-OAEP-256'] as const

/**
 * Validates response encryption metadata for OID4VP 1.0 compliance
 *
 * @param metadata - Response encryption metadata to validate
 * @returns true if valid, throws error otherwise
 */
export function validateResponseEncryptionMetadata(metadata: ResponseEncryptionMetadataV1_0): boolean {
  // At least one of jwks or jwks_uri must be present
  if (!metadata.jwks && !metadata.jwks_uri) {
    throw new Error('ResponseEncryptionMetadata must have either jwks or jwks_uri')
  }

  // If jwks is present, it must be a non-empty array
  if (metadata.jwks && (!Array.isArray(metadata.jwks) || metadata.jwks.length === 0)) {
    throw new Error('ResponseEncryptionMetadata.jwks must be a non-empty array if present')
  }

  // If jwks_uri is present, it must be a valid string
  if (metadata.jwks_uri && (typeof metadata.jwks_uri !== 'string' || metadata.jwks_uri.trim().length === 0)) {
    throw new Error('ResponseEncryptionMetadata.jwks_uri must be a non-empty string if present')
  }

  // Validate encryption algorithms if present
  if (metadata.encrypted_response_enc_values_supported) {
    if (
      !Array.isArray(metadata.encrypted_response_enc_values_supported) ||
      metadata.encrypted_response_enc_values_supported.length === 0
    ) {
      throw new Error('encrypted_response_enc_values_supported must be a non-empty array if present')
    }
  }

  if (metadata.encrypted_response_alg_values_supported) {
    if (
      !Array.isArray(metadata.encrypted_response_alg_values_supported) ||
      metadata.encrypted_response_alg_values_supported.length === 0
    ) {
      throw new Error('encrypted_response_alg_values_supported must be a non-empty array if present')
    }
  }

  return true
}

/**
 * Creates response encryption metadata with default values
 *
 * @param jwks - JWKS containing encryption keys
 * @param jwks_uri - URI to fetch JWKS (alternative to jwks)
 * @param encValues - Supported encryption algorithms (defaults to standard set)
 * @param algValues - Supported key encryption algorithms (defaults to standard set)
 * @returns ResponseEncryptionMetadata
 */
export function createResponseEncryptionMetadata(
  jwks?: JWK[],
  jwks_uri?: string,
  encValues?: string[],
  algValues?: string[]
): ResponseEncryptionMetadataV1_0 {
  if (!jwks && !jwks_uri) {
    throw new Error('Either jwks or jwks_uri must be provided')
  }

  const metadata: ResponseEncryptionMetadataV1_0 = {
    encrypted_response_enc_values_supported: (encValues || [...DEFAULT_ENC_VALUES]) as any,
    encrypted_response_alg_values_supported: (algValues || [...DEFAULT_ALG_VALUES]) as any,
  }

  if (jwks && jwks.length > 0) {
    metadata.jwks = jwks
  }

  if (jwks_uri) {
    metadata.jwks_uri = jwks_uri
  }

  return metadata
}

/**
 * Checks if a response mode requires JWT encoding
 *
 * @param responseMode - The response mode to check
 * @returns true if JWT encoding is required
 */
export function isJwtResponseMode(responseMode: string): boolean {
  return (
    responseMode === 'direct_post.jwt' ||
    responseMode === 'query.jwt' ||
    responseMode === 'fragment.jwt' ||
    responseMode === 'dc_api.jwt'
  )
}

/**
 * Checks if a response mode is for Digital Credentials API
 *
 * @param responseMode - The response mode to check
 * @returns true if DC API mode
 */
export function isDCAPIResponseMode(responseMode: string): boolean {
  return responseMode === 'dc_api' || responseMode === 'dc_api.jwt'
}

/**
 * Gets the base response mode (without .jwt suffix)
 *
 * @param responseMode - The response mode
 * @returns Base response mode
 */
export function getBaseResponseMode(responseMode: string): string {
  if (responseMode.endsWith('.jwt')) {
    return responseMode.slice(0, -4)
  }
  return responseMode
}

/**
 * Validates that required encryption keys are present in JWKS
 *
 * @param jwks - JWKS to validate
 * @returns true if valid encryption keys are present
 */
export function hasValidEncryptionKeys(jwks: JWK[]): boolean {
  if (!jwks || jwks.length === 0) {
    return false
  }

  // Check for at least one key suitable for encryption
  return jwks.some((jwk) => {
    // Key must have 'enc' use or no use specified (in which case it can be used for encryption)
    const hasEncUse = !jwk.use || jwk.use === 'enc'

    // Key must have 'encrypt' in key_ops or no key_ops specified
    const hasEncOps = !jwk.key_ops || jwk.key_ops.includes('encrypt') || jwk.key_ops.includes('wrapKey')

    // Key type should be suitable for encryption (RSA, EC, OKP)
    const hasSuitableKty = jwk.kty === 'RSA' || jwk.kty === 'EC' || jwk.kty === 'OKP'

    return hasEncUse && hasEncOps && hasSuitableKty
  })
}

/**
 * Selects the best encryption algorithm based on supported values
 *
 * @param supportedEnc - Supported content encryption algorithms
 * @param supportedAlg - Supported key encryption algorithms
 * @returns Object with selected alg and enc
 */
export function selectEncryptionAlgorithms(
  supportedEnc: string[],
  supportedAlg: string[]
): { alg: string; enc: string } {
  // Prefer ECDH-ES for key agreement (better for ephemeral keys)
  let alg = 'ECDH-ES'
  if (supportedAlg.includes('ECDH-ES')) {
    alg = 'ECDH-ES'
  } else if (supportedAlg.includes('ECDH-ES+A256KW')) {
    alg = 'ECDH-ES+A256KW'
  } else if (supportedAlg.includes('ECDH-ES+A128KW')) {
    alg = 'ECDH-ES+A128KW'
  } else if (supportedAlg.includes('RSA-OAEP-256')) {
    alg = 'RSA-OAEP-256'
  } else if (supportedAlg.includes('RSA-OAEP')) {
    alg = 'RSA-OAEP'
  } else {
    alg = supportedAlg[0]
  }

  // Prefer A256GCM for content encryption (better security)
  let enc = 'A256GCM'
  if (supportedEnc.includes('A256GCM')) {
    enc = 'A256GCM'
  } else if (supportedEnc.includes('A128GCM')) {
    enc = 'A128GCM'
  } else if (supportedEnc.includes('A256CBC-HS512')) {
    enc = 'A256CBC-HS512'
  } else if (supportedEnc.includes('A128CBC-HS256')) {
    enc = 'A128CBC-HS256'
  } else {
    enc = supportedEnc[0]
  }

  return { alg, enc }
}

/**
 * Extracts encryption metadata from client metadata or authorization request
 *
 * @param metadata - Client metadata or authorization request payload
 * @returns ResponseEncryptionMetadata if available
 */
export function extractResponseEncryptionMetadata(metadata: any): ResponseEncryptionMetadataV1_0 | undefined {
  if (!metadata) {
    return undefined
  }

  // Check if encryption metadata is present
  const hasEncAlg =
    metadata.encrypted_response_alg_values_supported || metadata.authorization_encrypted_response_alg_values_supported

  const hasEncEnc =
    metadata.encrypted_response_enc_values_supported || metadata.authorization_encrypted_response_enc_values_supported

  const hasJwks = metadata.jwks
  const hasJwksUri = metadata.jwks_uri

  if (!hasEncAlg && !hasEncEnc && !hasJwks && !hasJwksUri) {
    return undefined
  }

  return {
    encrypted_response_alg_values_supported:
      metadata.encrypted_response_alg_values_supported ||
      metadata.authorization_encrypted_response_alg_values_supported,
    encrypted_response_enc_values_supported:
      metadata.encrypted_response_enc_values_supported ||
      metadata.authorization_encrypted_response_enc_values_supported,
    jwks: metadata.jwks,
    jwks_uri: metadata.jwks_uri,
  }
}

/**
 * Checks if encryption is required based on response mode
 *
 * @param responseMode - The response mode
 * @returns true if encryption is recommended or required
 */
export function shouldEncryptResponse(responseMode: string): boolean {
  // JWT response modes typically use encryption for sensitive data
  if (isJwtResponseMode(responseMode)) {
    return true
  }

  // DC API modes should use encryption
  if (isDCAPIResponseMode(responseMode)) {
    return true
  }

  // For other modes, encryption is optional but recommended
  return false
}
