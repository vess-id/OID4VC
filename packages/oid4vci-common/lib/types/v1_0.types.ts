import { JWK } from '@vess-id/oid4vc-common'

import { ExperimentalSubjectIssuance } from '../experimental/holder-vci'

import { ProofOfPossession } from './CredentialIssuance.types'
import {
  AlgValue,
  CredentialDataSupplierInput,
  CredentialOfferMode,
  CredentialsSupportedDisplay,
  CredentialSupplierConfig,
  EncValue,
  Grant,
  IssuerCredentialSubject,
  MetadataDisplay,
  OID4VCICredentialFormat,
  ProofTypesSupported,
  ResponseEncryption,
  StatusListOpts,
  ZipValue,
} from './Generic.types'
import { QRCodeOpts } from './QRCode.types'
import { AuthorizationServerMetadata, AuthorizationServerType, EndpointMetadata } from './ServerMetadata'

/**
 * OID4VCI 1.0 (Draft 17) Types
 *
 * Key changes from v1.0.15 (Draft 15):
 * - signed_metadata removed from metadata (new signed metadata mechanism)
 * - claims and display moved into credential_metadata
 * - ldp_vp renamed to di_vp (Data Integrity VP)
 * - keyattestation+jwt renamed to key-attestation+jwt
 * - Credential Request/Response encryption support added
 * - New error codes: unknown_credential_configuration, unknown_credential_identifier
 * - Removed error codes: unsupported_credential_type, unsupported_credential_format
 *
 * Draft 17 changes:
 * - transaction_id is now required in Deferred Credential Response when pending
 * - Various clarifications and security considerations
 */

// ============================================================================
// Issuer Metadata (v1.0 - Draft 17)
// ============================================================================

export interface IssuerMetadataV1_0 {
  credential_configurations_supported: Record<string, CredentialConfigurationSupportedV1_0> // REQUIRED. A JSON object containing a list of key value pairs, where the key is a string serving as an abstract identifier of the Credential.
  credential_issuer: string // REQUIRED. A Credential Issuer is identified by a case sensitive URL using the https scheme that contains scheme, host and, optionally, port number and path components, but no query or fragment components.
  credential_endpoint: string // REQUIRED. URL of the OP's Credential Endpoint. This URL MUST use the https scheme and MAY contain port, path and query parameter components.
  nonce_endpoint?: string // OPTIONAL. URL of the Credential Issuer's Nonce Endpoint, as defined in Section 7. This URL MUST use the https scheme and MAY contain port, path, and query parameter components. If omitted, the Credential Issuer does not support the Nonce Endpoint.
  authorization_servers?: string[] // OPTIONAL. Array of strings that identify the OAuth 2.0 Authorization Servers (as defined in [RFC8414]) the Credential Issuer relies on for authorization. MUST be non-empty if present.
  deferred_credential_endpoint?: string // OPTIONAL. URL of the Credential Issuer's Deferred Credential Endpoint, as defined in Section 9. This URL MUST use the https scheme and MAY contain port, path, and query parameter components.
  notification_endpoint?: string // OPTIONAL. URL of the Credential Issuer's Notification Endpoint, as defined in Section 10. This URL MUST use the https scheme and MAY contain port, path, and query parameter components.
  credential_request_encryption?: CredentialRequestEncryptionV1_0 // OPTIONAL. Object containing information about whether the Credential Issuer supports encryption of the Credential Request.
  credential_response_encryption?: ResponseEncryption // OPTIONAL. Object containing information about whether the Credential Issuer supports encryption of the Credential Response on top of TLS.
  batch_credential_issuance?: BatchCredentialIssuanceV1_0 // OPTIONAL. Object containing information about the Credential Issuer's supports for batch issuance of Credentials on the Credential Endpoint.
  token_endpoint?: string // OPTIONAL. URL of the token endpoint.
  display?: MetadataDisplay[] // OPTIONAL. An array of objects, where each object contains display properties of a Credential Issuer for a certain language. MUST be non-empty if present.
  authorization_challenge_endpoint?: string // OPTIONAL. URL of the Credential Issuer's Authorization Challenge Endpoint.
  // NOTE: signed_metadata removed in v1.0 (Draft 17) - new signed metadata mechanism introduced

  [x: string]: unknown
}

export interface BatchCredentialIssuanceV1_0 {
  batch_size: number // REQUIRED. Integer value specifying the maximum array size for the proofs parameter in a Credential Request.
}

// ============================================================================
// Credential Request/Response Encryption (NEW in v1.0)
// ============================================================================

export interface CredentialRequestEncryptionV1_0 {
  jwks?: JWK[] // OPTIONAL. Array containing the Credential Issuer's public keys for encryption
  enc_values_supported: EncValue[] // REQUIRED. Array of supported JWE encryption methods. MUST be non-empty.
  zip_values_supported?: ZipValue[] // OPTIONAL. Array of supported compression algorithms
  encryption_required: boolean // REQUIRED. Boolean indicating whether encryption is required
}

// ============================================================================
// Credential Configuration (v1.0 - Draft 17)
// ============================================================================

export type CredentialDefinitionJwtVcJsonV1_0 = {
  type: string[] // REQUIRED. JSON array designating the types a certain credential type supports. MUST be non-empty.
  credentialSubject?: IssuerCredentialSubject // OPTIONAL. A JSON object containing a list of key value pairs, where the key identifies the claim offered in the Credential.
}

export type CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0 = {
  '@context': string[] // REQUIRED. JSON array as defined in [VC_DATA], Section 4.1. MUST be non-empty.
  type: string[] // REQUIRED. JSON array designating the types a certain credential type supports. MUST be non-empty.
  credentialSubject?: IssuerCredentialSubject // OPTIONAL. A JSON object containing a list of key value pairs, where the key identifies the claim offered in the Credential.
}

// Credential Metadata (NEW structure in v1.0 - claims and display moved here)
export interface CredentialMetadataV1_0 {
  display?: CredentialsSupportedDisplay[] // OPTIONAL. Array of objects, where each object contains the display properties of the supported credential for a certain language. MUST be non-empty if present.
  claims?: ClaimsDescriptionV1_0[] // OPTIONAL. Array of claims description objects using claims path pointers. MUST be non-empty if present.
}

export type CredentialConfigurationSupportedV1_0 = CredentialConfigurationSupportedCommonV1_0 &
  (
    | CredentialConfigurationSupportedSdJwtVcV1_0
    | CredentialConfigurationSupportedJwtVcJsonV1_0
    | CredentialConfigurationSupportedJwtVcJsonLdAndLdpVcV1_0
    | CredentialConfigurationSupportedMsoMdocV1_0
  )

export type CredentialConfigurationSupportedCommonV1_0 = {
  format: OID4VCICredentialFormat | string // REQUIRED. A JSON string identifying the format of this credential, e.g. jwt_vc_json or ldp_vc.
  scope?: string // OPTIONAL. A JSON string identifying the scope value that this Credential Issuer supports for this particular Credential.
  cryptographic_binding_methods_supported?: string[] // OPTIONAL. Array of case sensitive strings that identify how the Credential is bound to the identifier of the End-User who possesses the Credential. Renamed from "Cryptographic Holder Binding" to "Cryptographic Key Binding" in v1.0.
  credential_signing_alg_values_supported?: string[] // OPTIONAL. Array of case sensitive strings that identify the algorithms that the Issuer uses to sign the issued Credential. Format-specific in v1.0.
  proof_types_supported?: ProofTypesSupported // OPTIONAL. Object that describes specifics of the key proof(s) that the Credential Issuer supports.
  credential_metadata?: CredentialMetadataV1_0 // OPTIONAL. Object containing credential metadata (NEW in v1.0 - claims and display moved here)
  [x: string]: unknown
}

export interface CredentialConfigurationSupportedSdJwtVcV1_0 extends CredentialConfigurationSupportedCommonV1_0 {
  format: 'dc+sd-jwt' // REQUIRED. Format identifier for SD-JWT VC
  vct: string // REQUIRED. String designating the type of a Credential, as defined in [I-D.ietf-oauth-sd-jwt-vc].
  order?: string[] // OPTIONAL. An array of claims.display.name values that lists them in the order they should be displayed by the Wallet.
}

export interface CredentialConfigurationSupportedMsoMdocV1_0 extends CredentialConfigurationSupportedCommonV1_0 {
  format: 'mso_mdoc' // REQUIRED. Format identifier for ISO mdoc credentials (renamed from mDL in v1.0)
  doctype: string // REQUIRED. String identifying the Credential type, as defined in [ISO.18013-5].
  order?: string[] // OPTIONAL. An array of claims.display.name values that lists them in the order they should be displayed by the Wallet.
  credential_signing_alg_values_supported?: string[] // OPTIONAL. For mdocs, uses COSE algorithm values
}

export interface CredentialConfigurationSupportedJwtVcJsonV1_0 extends CredentialConfigurationSupportedCommonV1_0 {
  format: 'jwt_vc_json' | 'jwt_vc' // REQUIRED. jwt_vc added for backward compat
  credential_definition: CredentialDefinitionJwtVcJsonV1_0 // REQUIRED. Object containing the detailed description of the Credential type.
  order?: string[] // OPTIONAL. An array of claims.display.name values that lists them in the order they should be displayed by the Wallet.
}

export interface CredentialConfigurationSupportedJwtVcJsonLdAndLdpVcV1_0 extends CredentialConfigurationSupportedCommonV1_0 {
  format: 'ldp_vc' | 'jwt_vc_json-ld' // REQUIRED. Format identifier for JSON-LD based credentials
  credential_definition: CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0 // REQUIRED. Object containing the detailed description of the Credential type.
  order?: string[] // OPTIONAL. An array of claims.display.name values that lists them in the order they should be displayed by the Wallet.
}

// Claims description using path pointers (aligned for JSON-based and ISO mdocs in v1.0)
export interface ClaimsDescriptionV1_0 {
  path: (string | number | null)[] // REQUIRED. The value MUST be a non-empty array representing a claims path pointer. MUST be non-empty.
  mandatory?: boolean // OPTIONAL. Boolean which, when set to true, indicates that the Credential Issuer will always include this claim in the issued Credential. Default is false.
  display?: CredentialsSupportedDisplay[] // OPTIONAL. Array of objects, where each object contains display properties of a certain claim in the Credential for a certain language. MUST be non-empty if present.
}

// ============================================================================
// Credential Request (v1.0 - Draft 17)
// ============================================================================

export type CredentialRequestResponseEncryptionV1_0 = {
  jwk: JWK // REQUIRED. JWK containing the key material for encryption
  alg: AlgValue // REQUIRED. JWE algorithm for encryption
  enc: EncValue // REQUIRED. JWE encryption method
  zip?: ZipValue // OPTIONAL. Compression algorithm (NEW in v1.0)
}

export interface CredentialRequestCommonV1_0 extends ExperimentalSubjectIssuance {
  credential_response_encryption?: CredentialRequestResponseEncryptionV1_0 // OPTIONAL. Object containing information for encrypting the Credential Response.
  proof?: ProofOfPossession // DEPRECATED in v1.0. Use proofs parameter instead. MUST NOT be present if proofs parameter is used.
  proofs?: ProofOfPossessionMapV1_0 // OPTIONAL. Object providing one or more proof of possessions of the cryptographic key material. MUST NOT be present if proof parameter is used.
  issuer_state?: string // OPTIONAL. Issuer state from credential offer
}

export interface ProofOfPossessionMapV1_0 {
  [proofType: string]: ProofOfPossession[] // Array of proofs for each proof type - proofs object contains exactly one parameter named as the proof type. MUST be non-empty.
}

// Main credential request type for v1.0 - format parameter removed from authorization_details in Authorization Request
export type CredentialRequestV1_0 = CredentialRequestCommonV1_0 &
  (CredentialRequestCredentialIdentifierV1_0 | CredentialRequestCredentialConfigurationIdV1_0)

export interface CredentialRequestCredentialIdentifierV1_0 extends CredentialRequestCommonV1_0 {
  credential_identifier: string // REQUIRED when credential_identifiers were returned from Token Response. MUST NOT be used otherwise.
  credential_configuration_id?: undefined // MUST NOT be present when credential_identifier is used.
}

export interface CredentialRequestCredentialConfigurationIdV1_0 extends CredentialRequestCommonV1_0 {
  credential_configuration_id: string // REQUIRED if credential_identifiers were not returned from Token Response. MUST NOT be used otherwise.
  credential_identifier?: undefined // MUST NOT be present when credential_configuration_id is used.
}

// ============================================================================
// Credential Offer (v1.0 - Draft 17)
// ============================================================================

export interface CredentialOfferV1_0 {
  credential_offer?: CredentialOfferPayloadV1_0 // OPTIONAL. Object with the Credential Offer parameters. MUST NOT be present when credential_offer_uri is present.
  credential_offer_uri?: string // OPTIONAL. String that is a URL using the https scheme. MUST NOT be present when credential_offer parameter is present.
}

export interface CredentialOfferRESTRequestV1_0 extends Partial<CredentialOfferPayloadV1_0> {
  redirectUri?: string
  baseUri?: string
  scheme?: string
  correlationId?: string
  sessionLifeTimeInSec?: number
  pinLength?: number
  qrCodeOpts?: QRCodeOpts
  client_id?: string
  credentialDataSupplierInput?: CredentialDataSupplierInput
  statusListOpts?: Array<StatusListOpts>
  offerMode?: CredentialOfferMode
}

export interface CredentialOfferPayloadV1_0 {
  credential_issuer: string // REQUIRED. The URL of the Credential Issuer
  credential_configuration_ids: string[] // REQUIRED. Array of unique strings that each identify one of the keys in credential_configurations_supported. MUST be non-empty.
  grants?: Grant // OPTIONAL. Object indicating to the Wallet the Grant Types the Credential Issuer's Authorization Server is prepared to process
  client_id?: string // OPTIONAL. Some implementations might include a client_id in the offer
}

// ============================================================================
// Credential Response (v1.0 - Draft 17)
// ============================================================================

// Credential Response reworked in v1.0:
// - Immediate issuance returns HTTP 200 (fixed)
// - issuance_pending moved from Error Response to Deferred Response
// - interval parameter moved from Error Response to Credential Response
export interface CredentialResponseV1_0 extends ExperimentalSubjectIssuance {
  credentials?: CredentialResponseCredentialV1_0[] // OPTIONAL. Array of one or more issued Credentials. MUST NOT be used if transaction_id is present. MUST be non-empty if present.
  transaction_id?: string // OPTIONAL. String identifying a Deferred Issuance transaction. MUST NOT be used if credentials parameter is present.
  notification_id?: string // OPTIONAL. String identifying one or more Credentials issued in one Credential Response. MUST NOT be present if credentials parameter is not present.
  interval?: number // OPTIONAL (NEW in v1.0). Number of seconds the Wallet should wait before making another request to the Deferred Credential Endpoint. Moved from Error Response in v1.0.
}

export interface CredentialResponseCredentialV1_0 {
  credential: string | object // REQUIRED. Contains one issued Credential. MAY be a string or an object, depending on the Credential Format.
}

// Deferred Credential Response for v1.0 (Draft 17)
// When credentials are ready: returns credentials with HTTP 200
// When still pending: returns transaction_id and interval with HTTP 202
// Draft 17: transaction_id is now required when issuance is still pending
export interface DeferredCredentialResponseV1_0 {
  credentials?: CredentialResponseCredentialV1_0[] // OPTIONAL. Array of issued credentials. MUST be non-empty if present. MUST NOT be used if transaction_id is present.
  transaction_id?: string // REQUIRED when still pending (HTTP 202). String identifying a Deferred Issuance transaction. MUST be same value as in the request.
  interval?: number // REQUIRED when transaction_id is present. Number of seconds the Wallet should wait before making another request.
  notification_id?: string // OPTIONAL. String identifying one or more Credentials issued in one Credential Response.
}

// ============================================================================
// Token Response (v1.0 - Draft 17)
// ============================================================================

// Token Response with credential_identifiers support
// - When scopes are used, credential_identifiers are returned inside authorization_details (clarified in v1.0)
export interface TokenResponseV1_0 {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  authorization_details?: AuthorizationDetailsV1_0[]
  // Note: c_nonce and c_nonce_expires_in removed from Token Response (now obtained from Nonce Endpoint)
}

export interface AuthorizationDetailsV1_0 {
  type: 'openid_credential' // REQUIRED. MUST be set to openid_credential
  credential_configuration_id?: string // OPTIONAL. String specifying a unique identifier of the Credential Configuration
  credential_identifiers?: string[] // REQUIRED when authorization_details is used to request issuance. Array of strings uniquely identifying Credential Datasets. MUST be non-empty if present.
  locations?: string[] // OPTIONAL. If Credential Issuer metadata contains authorization_server parameter, locations MUST be set to Credential Issuer Identifier value.
  // NOTE: format parameter removed from authorization_details in Authorization Request in v1.0
  [x: string]: unknown
}

// ============================================================================
// Nonce Endpoint (v1.0 - Draft 17)
// ============================================================================

// Nonce Endpoint added in v1.0.15, enhanced in v1.0:
// - DPoP Nonce can be returned from Nonce Endpoint
// - Access token is NOT required at nonce endpoint (clarified in v1.0)
export interface NonceRequestV1_0 {
  // Empty request body - POST request to nonce_endpoint
}

export interface NonceResponseV1_0 {
  c_nonce: string // REQUIRED. String containing a nonce to be used when creating a proof of possession
  dpop_nonce?: string // OPTIONAL (NEW in v1.0). DPoP nonce value
  // Note: c_nonce_expires_in removed from Nonce Endpoint response
}

// ============================================================================
// Error Responses (v1.0 - Draft 17)
// ============================================================================

// Error responses updated for v1.0:
// - NEW errors: unknown_credential_configuration, unknown_credential_identifier
// - REMOVED errors: unsupported_credential_type, unsupported_credential_format
// - credential_request_denied should be treated as non-recoverable (clarified in v1.0)
// - issuance_pending moved to Deferred Credential Response
// - interval moved to Credential Response
export interface CredentialErrorResponseV1_0 {
  error: CredentialErrorCodeV1_0 // REQUIRED. The error parameter SHOULD be a single ASCII error code
  error_description?: string // OPTIONAL. Human-readable ASCII text providing additional information
  error_uri?: string // OPTIONAL. A URI identifying a human-readable web page with information about the error
  // Note: c_nonce, c_nonce_expires_in, issuance_pending, interval removed from error response
}

export type CredentialErrorCodeV1_0 =
  | 'invalid_request'
  | 'invalid_token'
  | 'insufficient_scope'
  | 'credential_request_denied' // Should be treated as non-recoverable, do not retry
  | 'unknown_credential_configuration' // NEW in v1.0
  | 'unknown_credential_identifier' // NEW in v1.0
  // REMOVED in v1.0: unsupported_credential_type, unsupported_credential_format

// ============================================================================
// Proof Types (v1.0 - Draft 17)
// ============================================================================

// Proof types for v1.0:
// - ldp_vp renamed to di_vp (Data Integrity VP)
// - key-attestation+jwt (hyphen added in v1.0)
// - proof_signing_alg_values_supported is proof type specific (clarified in v1.0)
// - x5c, kid, jwk in JWT proof type are mutually exclusive (clarified in v1.0)
export interface ProofTypesV1_0 {
  jwt?: ProofTypeV1_0 // OPTIONAL. JWT proof type support
  di_vp?: ProofTypeV1_0 // OPTIONAL. Data Integrity VP support (renamed from ldp_vp in v1.0)
  attestation?: ProofTypeV1_0 // OPTIONAL. Attestation proof type for key attestation
}

export interface ProofTypeV1_0 {
  proof_signing_alg_values_supported: string[] // REQUIRED. Array of case sensitive strings that identify the algorithms that the Issuer supports for this proof type. MUST match key proof algorithms. MUST be non-empty.
  key_attestations_required?: KeyAttestationsRequiredV1_0 // OPTIONAL. Object that describes the requirement for key attestations
}

export interface KeyAttestationsRequiredV1_0 {
  key_storage?: string[] // OPTIONAL. Array defining values for key storage attack potential resistance. MUST be non-empty if present.
  user_authentication?: string[] // OPTIONAL. Array defining values for user authentication attack potential resistance. MUST be non-empty if present.
}

// Key Attestation JWT format
// - typ renamed from keyattestation+jwt to key-attestation+jwt in v1.0
// - nonce set to c_nonce value for proof types with key attestations (clarified in v1.0)
export interface KeyAttestationJWTV1_0 {
  // JOSE Header
  alg: string // REQUIRED. Digital signature algorithm identifier
  typ: 'key-attestation+jwt' // REQUIRED. MUST be key-attestation+jwt (hyphen added in v1.0)
  kid?: string // OPTIONAL. Key identifier
  x5c?: string[] // OPTIONAL. Certificate chain corresponding to the key used to sign the JWT
  trust_chain?: string[] // OPTIONAL. Trust chain for validation

  // JWT Claims
  iss?: string // OPTIONAL. Issuer of the key attestation
  iat: number // REQUIRED. Integer for the time at which the key attestation was issued
  exp?: number // OPTIONAL. Integer for the time at which the key attestation expires
  attested_keys: JWK[] // REQUIRED. Array of attested keys from the same key storage component. MUST be non-empty.
  key_storage?: string[] // OPTIONAL. Array of case sensitive strings that assert the attack potential resistance of the key storage component
  user_authentication?: string[] // OPTIONAL. Array of case sensitive strings that assert the attack potential resistance of user authentication
  certification?: string // OPTIONAL. A String that contains a URL that links to the certification of the key storage component
  nonce?: string // OPTIONAL. String representing a nonce (set to c_nonce value in v1.0)
  status?: object // OPTIONAL. JSON Object representing the supported revocation check mechanisms
}

// Wallet Attestation format
// - Privacy considerations for client_id used with wallet attestations added in v1.0
export interface WalletAttestationJWTV1_0 {
  // JOSE Header
  typ: 'oauth-client-attestation+jwt' // REQUIRED. Type header for wallet attestation
  alg: string // REQUIRED. Signature algorithm
  kid?: string // OPTIONAL. Key identifier

  // JWT Claims
  iss: string // REQUIRED. Issuer of the wallet attestation
  sub: string // REQUIRED. Subject (wallet identifier)
  wallet_name?: string // OPTIONAL. String containing a human-readable name of the Wallet
  wallet_link?: string // OPTIONAL. String containing a URL to get further information about the Wallet
  nbf?: number // OPTIONAL. Not before time
  exp?: number // OPTIONAL. Expiration time
  cnf: {
    jwk: JWK // REQUIRED. Confirmation key for proof of possession
  }
  status?: object // OPTIONAL. Status mechanism for the Wallet Attestation
}

// ============================================================================
// Credential Issuer Metadata Options (v1.0 - Draft 17)
// ============================================================================

export interface CredentialIssuerMetadataOptsV1_0 {
  credential_endpoint: string // REQUIRED. URL of the Credential Issuer's Credential Endpoint
  nonce_endpoint?: string // OPTIONAL. URL of the Credential Issuer's Nonce Endpoint
  deferred_credential_endpoint?: string // OPTIONAL. URL of the Credential Issuer's Deferred Credential Endpoint
  notification_endpoint?: string // OPTIONAL. URL of the Credential Issuer's Notification Endpoint
  credential_request_encryption?: CredentialRequestEncryptionV1_0 // OPTIONAL (NEW in v1.0). Request encryption support
  credential_response_encryption?: ResponseEncryption // OPTIONAL. Response encryption support. Request encryption is required when response encryption is used (v1.0).
  batch_credential_issuance?: BatchCredentialIssuanceV1_0 // OPTIONAL. Batch credential issuance support (renamed from "Multiple credential issuance" in v1.0)
  credential_identifiers_supported?: boolean // OPTIONAL. Boolean indicating support for credential_identifiers in Token Response
  credential_configurations_supported: Record<string, CredentialConfigurationSupportedV1_0> // REQUIRED. Object describing supported Credentials
  credential_issuer: string // REQUIRED. The Credential Issuer's identifier. MUST be validated (v1.0).
  authorization_servers?: string[] // OPTIONAL. Array of OAuth 2.0 Authorization Server identifiers. MUST be non-empty if present.
  display?: MetadataDisplay[] // OPTIONAL. Array of display properties for different languages. MUST be non-empty if present.
  authorization_challenge_endpoint?: string // OPTIONAL. URL of the Authorization Challenge Endpoint
  token_endpoint?: string // OPTIONAL. URL of the token endpoint
  credential_supplier_config?: CredentialSupplierConfig // OPTIONAL. Configuration for credential suppliers
  // NOTE: signed_metadata removed in v1.0 - new signed metadata mechanism with media type application/openidvci-issuer-metadata+jwt
}

export const credentialIssuerMetadataFieldNamesV1_0: Array<keyof CredentialIssuerMetadataOptsV1_0> = [
  'credential_issuer',
  'credential_configurations_supported',
  'credential_endpoint',
  'nonce_endpoint',
  'deferred_credential_endpoint',
  'notification_endpoint',
  'credential_request_encryption',
  'credential_response_encryption',
  'batch_credential_issuance',
  'authorization_servers',
  'token_endpoint',
  'display',
  'credential_supplier_config',
  'credential_identifiers_supported',
  'authorization_challenge_endpoint',
] as const

export interface EndpointMetadataResultV1_0 extends EndpointMetadata {
  authorizationServerType: AuthorizationServerType
  authorizationServerMetadata?: AuthorizationServerMetadata
  credentialIssuerMetadataFieldNamesV1_0?: Partial<AuthorizationServerMetadata> & IssuerMetadataV1_0
}

export interface CredentialIssuerMetadataV1_0 extends CredentialIssuerMetadataOptsV1_0, Partial<AuthorizationServerMetadata> {
  authorization_servers?: string[] // OPTIONAL. Array of strings that identify the OAuth 2.0 Authorization Servers the Credential Issuer relies on for authorization.
  credential_endpoint: string // REQUIRED. URL of the Credential Issuer's Credential Endpoint.
  credential_configurations_supported: Record<string, CredentialConfigurationSupportedV1_0> // REQUIRED. Supported credential configurations.
  credential_issuer: string // REQUIRED. The Credential Issuer's identifier. MUST be validated (v1.0).
  [x: string]: unknown
}
