/**
 * OID4VP 1.0 (Final) Type Definitions
 *
 * Based on OpenID for Verifiable Presentations 1.0
 * Key changes from Draft 28:
 * - verifier_attestations renamed to verifier_info (Draft 29)
 * - DCQL meta parameter is now REQUIRED
 * - Non-empty arrays are explicitly required
 * - mdoc Session Transcript support for redirect-based flow
 */

import { JWK } from '@vess-id/oid4vc-common'
import { DcqlQuery } from 'dcql'
import { NonEmptyArray } from './SIOP.types'

/**
 * OID4VP Version identifier for 1.0
 */
export const OID4VP_VERSION_1_0 = '1.0'
export const OID4VP_VERSION_1_0_NUMERIC = 10000

/**
 * DCQL Query for OID4VP 1.0
 * The meta parameter is REQUIRED in v1.0
 */
export interface DcqlQueryV1_0 {
  credentials: NonEmptyArray<DcqlCredentialQueryV1_0>
  credential_sets?: DcqlCredentialSetV1_0[]
}

export interface DcqlCredentialQueryV1_0 {
  id: string
  format: string
  meta: Record<string, any> // REQUIRED in v1.0 (was optional in earlier drafts)
  claims?: NonEmptyArray<DcqlClaimV1_0>
  claim_sets?: NonEmptyArray<string[]>
}

export interface DcqlClaimV1_0 {
  id?: string
  path: NonEmptyArray<string>
  values?: any[]
  intent_to_retain?: boolean // For mdoc format
}

export interface DcqlCredentialSetV1_0 {
  required?: boolean
  options: NonEmptyArray<NonEmptyArray<string>>
  purpose?: string
}

/**
 * Verifier Information (renamed from verifier_attestations in Draft 29)
 */
export interface VerifierInfoV1_0 {
  format: string // REQUIRED. Identifies the format of the attestation
  data: string // REQUIRED. The attestation data (e.g., a JWT)
  credential_ids?: NonEmptyArray<string>
}

/**
 * Transaction Data for OID4VP 1.0
 */
export interface TransactionDataRequestV1_0 {
  type: string
  credential_ids: NonEmptyArray<string>
  transaction_data_hashes_alg?: NonEmptyArray<string> // Default: ["sha-256"]
  [x: string]: any
}

export interface TransactionDataResponseV1_0 {
  transaction_data_hashes: NonEmptyArray<string>
  transaction_data_hashes_alg?: string
}

/**
 * Response Encryption Metadata for OID4VP 1.0
 */
export interface ResponseEncryptionMetadataV1_0 {
  encrypted_response_enc_values_supported?: NonEmptyArray<string>
  encrypted_response_alg_values_supported?: NonEmptyArray<string>
  jwks?: JWK[]
  jwks_uri?: string
}

/**
 * mdoc Session Transcript structures for redirect-based OID4VP flow
 * Based on ISO 18013-5 Section 9.1.5.1
 */
export interface SessionTranscriptV1_0 {
  DeviceEngagementBytes: null // MUST be null for OID4VP
  EReaderKeyBytes: null // MUST be null for OID4VP
  Handover: OpenID4VPHandoverV1_0 | OpenID4VPDCAPIHandoverV1_0
}

/**
 * OpenID4VPHandover for redirect-based flow
 * CBOR structure: ["OpenID4VPHandover", nonce, verifierPublicKey]
 */
export interface OpenID4VPHandoverV1_0 {
  handoverType: 'OpenID4VPHandover'
  nonce: string // The nonce from the authorization request
  verifierPublicKey: Uint8Array // JWK thumbprint as bytes
}

/**
 * OpenID4VPDCAPIHandover for Digital Credentials API flow
 * CBOR structure: ["OpenID4VPDCAPIHandover", handoverInfoHash]
 */
export interface OpenID4VPDCAPIHandoverV1_0 {
  handoverType: 'OpenID4VPDCAPIHandover'
  handoverInfoHash: Uint8Array // sha-256 hash of OpenID4VPDCAPIHandoverInfo
}

/**
 * OpenID4VPDCAPIHandoverInfo
 * CBOR structure: [origin, nonce, jwkThumbprint]
 */
export interface OpenID4VPDCAPIHandoverInfoV1_0 {
  origin: string // Origin without "origin:" prefix
  nonce: string
  jwkThumbprint: Uint8Array | null // null if Response Mode is dc_api (not dc_api.jwt)
}

/**
 * Authorization Request Payload for OID4VP 1.0
 * Unified type that replaces both D28 and V1 variants
 */
export interface AuthorizationRequestPayloadV1_0 {
  // Core OAuth/OIDC parameters
  scope?: string
  response_type?: string
  client_id?: string
  redirect_uri?: string
  response_uri?: string // Preferred over redirect_uri since OID4VP v18
  state?: string
  nonce?: string
  response_mode?: string

  // OID4VP specific parameters
  dcql_query?: DcqlQuery | Record<string, any>
  verifier_info?: NonEmptyArray<VerifierInfoV1_0> // Renamed from verifier_attestations in Draft 29
  transaction_data?: NonEmptyArray<TransactionDataRequestV1_0>
  request_uri_method?: 'get' | 'post' // Added in Draft 26
  wallet_nonce?: string
  expected_origins?: NonEmptyArray<string>

  // Client metadata
  client_metadata?: Record<string, any>
  client_metadata_uri?: string

  // Request object parameters
  request?: string
  request_uri?: string

  // ID Token parameters (for SIOP)
  id_token_type?: string
  id_token_hint?: string
  claims?: Record<string, any>

  // JWT standard claims (when used as request object)
  iss?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string

  [x: string]: any
}

/**
 * VP Token structure for OID4VP 1.0
 */
export type VpTokenV1_0 = string | Record<string, NonEmptyArray<string | Record<string, any>>>

/**
 * Authorization Response Payload for OID4VP 1.0
 */
export interface AuthorizationResponsePayloadV1_0 {
  vp_token?: VpTokenV1_0
  presentation_submission?: Record<string, any>
  state?: string
  id_token?: string
  error?: string
  error_description?: string
  error_uri?: string

  [x: string]: any
}

/**
 * Client Metadata for OID4VP 1.0
 */
export interface ClientMetadataV1_0 {
  vp_formats_supported?: Record<string, VpFormatMetadataV1_0>
  encrypted_response_enc_values_supported?: NonEmptyArray<string>
  encrypted_response_alg_values_supported?: NonEmptyArray<string>
  jwks?: JWK[]
  jwks_uri?: string

  // OAuth/OIDC standard metadata
  client_name?: string
  logo_uri?: string
  client_uri?: string
  policy_uri?: string
  tos_uri?: string

  [x: string]: any
}

/**
 * VP Format Metadata (format-specific)
 */
export interface VpFormatMetadataV1_0 {
  alg_values_supported?: NonEmptyArray<string>

  // Format-specific fields
  // For dc+sd-jwt
  'sd-jwt_alg_values'?: NonEmptyArray<string>
  'kb-jwt_alg_values'?: NonEmptyArray<string>

  // For mso_mdoc
  issuer_signed_alg_values?: NonEmptyArray<string>
  device_signed_alg_values?: NonEmptyArray<string>

  // For jwt_vc_json, ldp_vc, etc.
  proof_type?: NonEmptyArray<string>

  [x: string]: any
}

/**
 * Wallet Metadata for OID4VP 1.0
 */
export interface WalletMetadataV1_0 {
  vp_formats_supported?: Record<string, VpFormatMetadataV1_0>
  client_id_prefixes_supported?: NonEmptyArray<string>

  [x: string]: any
}

/**
 * Request URI Method values
 */
export type RequestUriMethodV1_0 = 'get' | 'post'

/**
 * Client Identifier Prefix values for OID4VP 1.0
 */
export enum ClientIdentifierPrefixV1_0 {
  REDIRECT_URI = 'redirect_uri',
  OPENID_FEDERATION = 'openid_federation',
  DECENTRALIZED_IDENTIFIER = 'decentralized_identifier',
  VERIFIER_ATTESTATION = 'verifier_attestation',
  X509_SAN_DNS = 'x509_san_dns',
  X509_HASH = 'x509_hash',
  ORIGIN = 'origin',
}

/**
 * Response Mode values for OID4VP 1.0
 */
export enum ResponseModeV1_0 {
  FRAGMENT = 'fragment',
  QUERY = 'query',
  DIRECT_POST = 'direct_post',
  DIRECT_POST_JWT = 'direct_post.jwt',
  DC_API = 'dc_api',
  DC_API_JWT = 'dc_api.jwt',
}

/**
 * Error codes specific to OID4VP 1.0
 */
export enum OID4VPErrorV1_0 {
  VP_FORMATS_NOT_SUPPORTED = 'vp_formats_not_supported',
  INVALID_REQUEST_URI_METHOD = 'invalid_request_uri_method',
  WALLET_UNAVAILABLE = 'wallet_unavailable',
}

/**
 * Type guard to check if a query is a valid DCQL v1.0 query
 */
export function isDcqlQueryV1_0(query: any): query is DcqlQueryV1_0 {
  if (!query || typeof query !== 'object') {
    return false
  }

  if (!Array.isArray(query.credentials) || query.credentials.length === 0) {
    return false
  }

  // Check that all credentials have the required meta parameter
  for (const cred of query.credentials) {
    if (!cred.meta || typeof cred.meta !== 'object') {
      return false
    }
  }

  return true
}

/**
 * Type guard to check if verifier_info is valid
 */
export function isValidVerifierInfo(info: any): info is NonEmptyArray<VerifierInfoV1_0> {
  if (!Array.isArray(info) || info.length === 0) {
    return false
  }

  for (const item of info) {
    if (!item.format || typeof item.format !== 'string') {
      return false
    }
    if (!item.data || typeof item.data !== 'string') {
      return false
    }
  }

  return true
}

/**
 * Type guard to check if an array is non-empty
 */
export function isNonEmptyArray<T>(arr: T[] | undefined): arr is NonEmptyArray<T> {
  return Array.isArray(arr) && arr.length > 0
}
