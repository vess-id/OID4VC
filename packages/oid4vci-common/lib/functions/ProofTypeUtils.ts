/**
 * Proof Type utilities for OID4VCI 1.0 (Draft 16)
 *
 * Key changes in v1.0:
 * - ldp_vp renamed to di_vp (Data Integrity VP)
 * - keyattestation+jwt renamed to key-attestation+jwt (with hyphen)
 * - proof_signing_alg_values_supported is proof type specific
 */

import { ProofTypesV1_0 } from '../types/v1_0.types'
import { VCI_LOG_COMMON } from '../index'

/**
 * Supported proof types in OID4VCI 1.0
 */
export enum ProofTypeIdentifierV1_0 {
  JWT = 'jwt',
  DI_VP = 'di_vp', // Renamed from ldp_vp in v1.0
  ATTESTATION = 'attestation',
}

/**
 * Proof types from v1.0.15 (for backward compatibility)
 */
export enum ProofTypeIdentifierV1_0_15 {
  JWT = 'jwt',
  LDP_VP = 'ldp_vp', // Old name
  ATTESTATION = 'attestation',
}

/**
 * Checks if a proof type is supported in v1.0
 */
export function isSupportedProofTypeV1_0(proofType: string): proofType is ProofTypeIdentifierV1_0 {
  return Object.values(ProofTypeIdentifierV1_0).includes(proofType as ProofTypeIdentifierV1_0)
}

/**
 * Converts v1.0.15 proof type to v1.0 proof type
 * @param proofType - Proof type from v1.0.15
 * @returns Equivalent v1.0 proof type
 */
export function convertProofTypeToV1_0(proofType: string): string {
  if (proofType === ProofTypeIdentifierV1_0_15.LDP_VP) {
    return ProofTypeIdentifierV1_0.DI_VP
  }
  return proofType
}

/**
 * Converts v1.0 proof type to v1.0.15 proof type (for backward compatibility)
 * @param proofType - Proof type from v1.0
 * @returns Equivalent v1.0.15 proof type
 */
export function convertProofTypeToV1_0_15(proofType: string): string {
  if (proofType === ProofTypeIdentifierV1_0.DI_VP) {
    return ProofTypeIdentifierV1_0_15.LDP_VP
  }
  return proofType
}

/**
 * Validates proof types supported metadata for v1.0
 * Ensures proof_signing_alg_values_supported is non-empty for each proof type
 */
export function validateProofTypesSupported(proofTypes: ProofTypesV1_0 | undefined): boolean {
  if (!proofTypes) {
    return true // Optional field
  }

  let isValid = true

  // Validate JWT proof type
  if (proofTypes.jwt) {
    if (!proofTypes.jwt.proof_signing_alg_values_supported || proofTypes.jwt.proof_signing_alg_values_supported.length === 0) {
      VCI_LOG_COMMON.warning('proof_types_supported.jwt.proof_signing_alg_values_supported must be non-empty')
      isValid = false
    }
  }

  // Validate DI VP proof type (v1.0 - renamed from ldp_vp)
  if (proofTypes.di_vp) {
    if (
      !proofTypes.di_vp.proof_signing_alg_values_supported ||
      proofTypes.di_vp.proof_signing_alg_values_supported.length === 0
    ) {
      VCI_LOG_COMMON.warning('proof_types_supported.di_vp.proof_signing_alg_values_supported must be non-empty')
      isValid = false
    }
  }

  // Validate Attestation proof type
  if (proofTypes.attestation) {
    if (
      !proofTypes.attestation.proof_signing_alg_values_supported ||
      proofTypes.attestation.proof_signing_alg_values_supported.length === 0
    ) {
      VCI_LOG_COMMON.warning('proof_types_supported.attestation.proof_signing_alg_values_supported must be non-empty')
      isValid = false
    }
  }

  return isValid
}

/**
 * Gets the media type for key attestation JWT
 * In v1.0, it's "key-attestation+jwt" (with hyphen)
 * In v1.0.15, it was "keyattestation+jwt" (without hyphen)
 */
export function getKeyAttestationMediaType(version: '1.0' | '1.0.15'): string {
  return version === '1.0' ? 'key-attestation+jwt' : 'keyattestation+jwt'
}

/**
 * Checks if a JWT type header indicates a key attestation
 * Supports both v1.0 and v1.0.15 formats
 */
export function isKeyAttestationJWT(typ: string | undefined): boolean {
  if (!typ) {
    return false
  }
  return typ === 'key-attestation+jwt' || typ === 'keyattestation+jwt'
}

/**
 * Gets proof type identifier for metadata
 * Ensures correct naming based on version
 */
export function getProofTypeIdentifier(proofType: string, targetVersion: '1.0' | '1.0.15'): string {
  if (targetVersion === '1.0') {
    return convertProofTypeToV1_0(proofType)
  } else {
    return convertProofTypeToV1_0_15(proofType)
  }
}
