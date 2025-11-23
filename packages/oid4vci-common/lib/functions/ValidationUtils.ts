/**
 * Validation utilities for OID4VCI 1.0 (Draft 16)
 *
 * Draft 16 explicitly states that various arrays in metadata/requests must be non-empty
 */

import { VCI_LOG_COMMON } from '../index'

/**
 * Validates that an array is non-empty as required by OID4VCI 1.0
 * @param arr - The array to validate
 * @param fieldName - Name of the field for error messages
 * @returns true if valid (non-empty), false otherwise
 */
export function isNonEmptyArray<T>(arr: T[] | undefined, fieldName: string): arr is T[] {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    VCI_LOG_COMMON.debug(`Validation failed: ${fieldName} must be a non-empty array`)
    return false
  }
  return true
}

/**
 * Asserts that an array is non-empty, throws error if not
 * @param arr - The array to validate
 * @param fieldName - Name of the field for error messages
 * @throws Error if array is empty or undefined
 */
export function assertNonEmptyArray<T>(arr: T[] | undefined, fieldName: string): asserts arr is T[] {
  if (!isNonEmptyArray(arr, fieldName)) {
    throw new Error(`${fieldName} must be a non-empty array (OID4VCI 1.0 requirement)`)
  }
}

/**
 * Validates credential metadata claims array for OID4VCI 1.0
 * In v1.0, claims are located in credential_metadata and must be non-empty if present
 */
export function validateClaimsArray(claims: unknown[] | undefined, context: string): boolean {
  if (claims === undefined) {
    return true // Optional field
  }
  return isNonEmptyArray(claims, `${context}.claims`)
}

/**
 * Validates display array for OID4VCI 1.0
 * Must be non-empty if present
 */
export function validateDisplayArray(display: unknown[] | undefined, context: string): boolean {
  if (display === undefined) {
    return true // Optional field
  }
  return isNonEmptyArray(display, `${context}.display`)
}

/**
 * Validates authorization_servers array for OID4VCI 1.0
 * Must be non-empty if present
 */
export function validateAuthorizationServersArray(authServers: string[] | undefined): boolean {
  if (authServers === undefined) {
    return true // Optional field
  }
  return isNonEmptyArray(authServers, 'authorization_servers')
}

/**
 * Validates credential_configuration_ids array in Credential Offer
 * REQUIRED field, must be non-empty
 */
export function validateCredentialConfigurationIds(ids: string[] | undefined): boolean {
  if (!ids) {
    VCI_LOG_COMMON.warning('credential_configuration_ids is required in Credential Offer')
    return false
  }
  return isNonEmptyArray(ids, 'credential_configuration_ids')
}

/**
 * Validates proof_signing_alg_values_supported array
 * REQUIRED field in ProofType, must be non-empty
 */
export function validateProofSigningAlgValues(algs: string[] | undefined, proofType: string): boolean {
  if (!algs) {
    VCI_LOG_COMMON.warning(`proof_signing_alg_values_supported is required for proof type ${proofType}`)
    return false
  }
  return isNonEmptyArray(algs, `proof_signing_alg_values_supported (${proofType})`)
}

/**
 * Validates that path array in ClaimsDescription is non-empty
 * REQUIRED field, must be non-empty
 */
export function validateClaimsPath(path: (string | number | null)[] | undefined, claimIndex: number): boolean {
  if (!path) {
    VCI_LOG_COMMON.warning(`claims[${claimIndex}].path is required`)
    return false
  }
  return isNonEmptyArray(path, `claims[${claimIndex}].path`)
}
