# OID4VC SDK Codebase Exploration Summary

## Executive Summary
The OID4VCI SDK is a monorepo implementing the OpenID for Verifiable Credential Issuance specification at **draft 15 (v1.0.15)** level. The codebase follows a clear separation between common types, client implementation, and issuer implementation packages. Version-specific code is managed through a V1_0_15 naming convention, with strong typing to ensure spec compliance.

---

## 1. Current Implementation Version and Draft Support

### Version Enum Definition
**File**: `packages/oid4vci-common/lib/types/OpenID4VCIVersions.types.ts`

```typescript
export enum OpenId4VCIVersion {
  VER_1_0_15 = 1015,  // Draft 15 - Currently Supported
  VER_UNKNOWN = Number.MAX_VALUE,
}
```

### Draft 15 Designation
- **Current Version**: Draft 15 (v1.0.15)
- **Status**: Main supported version across entire SDK
- **Earlier Versions**: Explicitly NOT supported - versions below v1.0.15 are rejected
- **Code Pattern**: All major types and classes use `V1_0_15` suffix for version clarity

### Key Version Indicators
- Workspace version: 0.18.0
- Package versions: 0.20.0 (client and issuer)
- Source scope changed to: `@vess-id` (from `@sphereon` for OID4VCI 1.0 migration)

### README Statement
From main README:
> "IMPORTANT the packages are still in an early development stage, which means that breaking changes are to be expected The current branch only supports OID4VCI draft v15, for draft v13 and lower use branch archive/draft-v13-support"

---

## 2. Main Types and Interfaces (oid4vci-common Package)

### Core Type Files Location
`packages/oid4vci-common/lib/types/`

### Primary Type Files
1. **v1_0_15.types.ts** - All Draft 15 specific types
2. **CredentialIssuance.types.ts** - Generic credential issuance types
3. **Generic.types.ts** - Shared credential and metadata structures
4. **Authorization.types.ts** - Authorization request/response types
5. **ServerMetadata.ts** - Metadata structures for issuers and AS
6. **Token.types.ts** - Token-related types

### Key Type Definitions (v1_0_15)

#### Issuer Metadata Types
```typescript
interface IssuerMetadataV1_0_15 {
  credential_configurations_supported: Record<string, CredentialConfigurationSupportedV1_0_15>
  credential_issuer: string
  credential_endpoint: string
  nonce_endpoint?: string  // NEW IN V15
  authorization_servers?: string[]
  deferred_credential_endpoint?: string
  notification_endpoint?: string
  credential_response_encryption?: ResponseEncryption
  batch_credential_issuance?: BatchCredentialIssuance  // Changed from endpoint to metadata
  authorization_challenge_endpoint?: string
  signed_metadata?: string
  display?: MetadataDisplay[]
  [x: string]: unknown
}
```

#### Credential Configuration Types (Format-Specific)
Four main credential configuration types:
1. **CredentialConfigurationSupportedJwtVcJsonV1_0_15**
   - format: 'jwt_vc_json' | 'jwt_vc'
   - credential_definition: CredentialDefinitionJwtVcJsonV1_0_15

2. **CredentialConfigurationSupportedJwtVcJsonLdAndLdpVcV1_0_15**
   - format: 'ldp_vc' | 'jwt_vc_json-ld'
   - credential_definition with @context

3. **CredentialConfigurationSupportedSdJwtVcV1_0_15**
   - format: 'dc+sd-jwt'
   - vct: string (Verifiable Credential Type)
   - claims?: ClaimsDescriptionV1_0_15[]

4. **CredentialConfigurationSupportedMsoMdocV1_0_15**
   - format: 'mso_mdoc'
   - doctype: string
   - claims?: ClaimsDescriptionV1_0_15[]

#### Common Credential Configuration Base
```typescript
type CredentialConfigurationSupportedCommonV1_0_15 = {
  format: OID4VCICredentialFormat | string
  scope?: string
  cryptographic_binding_methods_supported?: string[]
  credential_signing_alg_values_supported?: string[]
  proof_types_supported?: ProofTypesSupported
  display?: CredentialsSupportedDisplay[]
}
```

#### Credential Request Types
```typescript
// v15 REMOVES format parameter from credential requests
interface CredentialRequestV1_0_15Common {
  credential_response_encryption?: CredentialRequestV1_0_15ResponseEncryption
  proof?: ProofOfPossession  // Single proof
  proofs?: ProofOfPossessionMap  // Multiple proofs for batch issuance
  issuer_state?: string
}

// Two mutually exclusive identifier types:
interface CredentialRequestV1_0_15CredentialIdentifier {
  credential_identifier: string  // Used with authorization_details
  credential_configuration_id?: undefined
}

interface CredentialRequestV1_0_15CredentialConfigurationId {
  credential_configuration_id: string  // Used with scopes
  credential_identifier?: undefined
}
```

#### Credential Response Types
```typescript
interface CredentialResponseV1_0_15 {
  credentials?: CredentialResponseCredentialV1_0_15[]  // Array format (NEW)
  transaction_id?: string  // For deferred issuance
  notification_id?: string
}

interface CredentialResponseCredentialV1_0_15 {
  credential: string | object  // Format-dependent
}

interface DeferredCredentialResponseV1_0_15 {
  credentials: CredentialResponseCredentialV1_0_15[]  // Always array
  notification_id?: string
}
```

#### Nonce Endpoint Types (NEW IN V15)
```typescript
interface NonceRequestV1_0_15 {
  // Empty request body
}

interface NonceResponseV1_0_15 {
  c_nonce: string  // Required
  // c_nonce_expires_in REMOVED - no longer in response
}
```

#### Proof Types (v15 Updates)
```typescript
interface ProofTypesV1_0_15 {
  jwt?: ProofTypeV1_0_15
  ldp_vp?: ProofTypeV1_0_15
  attestation?: ProofTypeV1_0_15  // NEW attestation proof type
}

interface ProofTypeV1_0_15 {
  proof_signing_alg_values_supported: string[]  // REQUIRED
  key_attestations_required?: KeyAttestationsRequiredV1_0_15
}

interface KeyAttestationsRequiredV1_0_15 {
  key_storage?: string[]
  user_authentication?: string[]
}
```

#### Key Attestation JWT (NEW IN V15)
```typescript
interface KeyAttestationJWT {
  alg: string
  typ: 'keyattestation+jwt'  // REQUIRED type
  kid?: string
  x5c?: string[]
  trust_chain?: string[]
  iss?: string
  iat: number
  exp?: number
  attested_keys: JWK[]
  key_storage?: string[]
  user_authentication?: string[]
  certification?: string
  nonce?: string
  status?: object
}
```

#### Wallet Attestation JWT (NEW IN V15)
```typescript
interface WalletAttestationJWT {
  typ: 'oauth-client-attestation+jwt'
  alg: string
  iss: string
  sub: string
  wallet_name?: string
  wallet_link?: string
  nbf?: number
  exp?: number
  cnf: { jwk: JWK }
  status?: object
}
```

#### Claims Description (Path Pointer Based - NEW IN V15)
```typescript
interface ClaimsDescriptionV1_0_15 {
  path: (string | number | null)[]  // Claims path pointer (Appendix C)
  mandatory?: boolean
  display?: CredentialsSupportedDisplay[]
}
```

#### Token Response (v15 Updates)
```typescript
interface TokenResponseV1_0_15 {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  authorization_details?: AuthorizationDetailsV1_0_15[]
  // REMOVED: c_nonce and c_nonce_expires_in (now from Nonce Endpoint)
}
```

#### Authorization Details (v15 Updates)
```typescript
interface AuthorizationDetailsV1_0_15 {
  type: 'openid_credential'
  credential_configuration_id?: string
  credential_identifiers?: string[]  // NEW - for credential_identifiers support
  locations?: string[]
  [x: string]: unknown
}
```

#### Error Response (v15 Updates)
```typescript
interface CredentialErrorResponseV1_0_15 {
  error: string
  error_description?: string
  error_uri?: string
  // REMOVED: c_nonce and c_nonce_expires_in
}
```

#### Notification Types (v15)
```typescript
interface NotificationResponseV1_0_15 {
  // Success: typically 204 No Content
}

interface NotificationErrorResponseV1_0_15 {
  error: 'invalid_notification_id' | 'invalid_notification_request'
  error_description?: string
}
```

#### Batch Credential Issuance
```typescript
interface BatchCredentialIssuance {
  batch_size: number  // Maximum array size for proofs parameter
}
```

---

## 3. Key Client Implementation Classes

### File Locations
`packages/client/lib/`

### Primary Client Classes

#### OpenID4VCIClientV1_0_15
**File**: `OpenID4VCIClientV1_0_15.ts`

Main client class managing the full issuance flow.

**State Interface**:
```typescript
interface OpenID4VCIClientStateV1_0_15 {
  credentialIssuer: string
  credentialOffer?: CredentialOfferRequestWithBaseUrl
  clientId?: string
  kid?: string
  jwk?: JWK
  alg?: Alg | string
  endpointMetadata?: EndpointMetadataResultV1_0_15
  accessTokenResponse?: AccessTokenResponse
  dpopResponseParams?: DPoPResponseParams
  authorizationRequestOpts?: AuthorizationRequestOpts
  authorizationCodeResponse?: AuthorizationResponse | AuthorizationChallengeCodeResponse
  pkce: PKCEOpts
  accessToken?: string
  authorizationURL?: string
  cachedCNonce?: string  // NEW IN V15: Caches nonce from Nonce Endpoint
  keyAttestation?: string  // NEW IN V15: JWT format key attestation
}
```

**Key Methods**:
- Flow orchestration (pre-auth, auth code)
- Metadata retrieval
- Token acquisition
- Credential requests/responses
- Notification handling

#### CredentialRequestClientBuilderV1_0_15
**File**: `CredentialRequestClientBuilderV1_0_15.ts`

Builder for configuring credential requests.

**Key Properties**:
```typescript
class CredentialRequestClientBuilderV1_0_15 {
  credentialEndpoint?: string
  deferredCredentialEndpoint?: string
  nonceEndpoint?: string  // NEW IN V15
  credentialIdentifier?: string  // NEW IN V15
  credentialConfigurationId?: string
  token?: string
  version?: OpenId4VCIVersion
  // Note: format REMOVED from v15
}
```

**Builder Methods**:
- Static factories from issuer, URI, or credential offer
- Version validation (rejects < v1.0.15)
- Endpoint configuration

#### MetadataClientV1_0_15
**File**: `MetadataClientV1_0_15.ts`

Handles metadata discovery and retrieval.

**Key Methods**:
- `retrieveAllMetadata(issuer)` - Gets issuer and AS metadata
- `retrieveAllMetadataFromCredentialOffer(offer)` - Metadata from offer
- OpenID4VCI metadata endpoint retrieval
- Authorization server metadata discovery

#### CredentialOfferClientV1_0_15
**File**: `CredentialOfferClientV1_0_15.ts`

Handles credential offer parsing and validation.

**Key Methods**:
- `fromUri(uri)` - Parse credential offer from URI
- Supports both inline and reference modes
- Version detection

#### NonceClient
**File**: `NonceClient.ts`

NEW functionality for v1.0.15 - Nonce Endpoint support.

```typescript
interface NonceSuccessBodyV1_0_15 {
  c_nonce: string
}

export const sendNonceRequest = async (
  nonceEndpointUrl: string,
  opts?: { headers?: Record<string, string> },
): Promise<OpenIDResponse<NonceSuccessBodyV1_0_15>>

export const acquireNonceFromAuthorizationServer = async (opts: {
  metadata?: EndpointMetadataResultV1_0_15
  issuerOpts?: IssuerOpts
  headers?: Record<string, string>
}): Promise<OpenIDResponse<NonceSuccessBodyV1_0_15>>
```

#### ProofOfPossessionBuilder
**File**: `ProofOfPossessionBuilder.ts`

Creates JWT-based proofs of possession for credential requests.

#### AccessTokenClient
**File**: `AccessTokenClient.ts`

Handles OAuth 2.0 token endpoint interactions.

#### AuthorizationCodeClient
**File**: `AuthorizationCodeClient.ts`

Manages authorization code flow and challenges.

### Client Utility Functions
`packages/client/lib/functions/`

- **AccessTokenUtil.ts** - Token request/response handling
- **CredentialOfferCommons.ts** - Credential offer utilities
- **dpopUtil.ts** - DPoP (Demonstration of Proof-of-Possession) support
- **notifications.ts** - Notification handling
- **OpenIDUtils.ts** - General OpenID utilities

---

## 4. Key Issuer Implementation Classes

### File Locations
`packages/issuer/lib/`

### Primary Issuer Classes

#### VcIssuer
**File**: `VcIssuer.ts`

Core issuer class for credential issuance management.

**State Management**:
```typescript
class VcIssuer {
  private readonly _issuerMetadata: CredentialIssuerMetadataOptsV1_0_15
  private readonly _authorizationServerMetadata: AuthorizationServerMetadata
  private readonly _credentialOfferSessions: IStateManager<CredentialOfferSession>
  private readonly _cNonces: IStateManager<CNonceState>
  private readonly _uris: IStateManager<URIState>
  private readonly _cNonceExpiresIn: number
  private readonly _credentialSignerCallback?: CredentialSignerCallback
  private readonly _jwtVerifyCallback?: JWTVerifyCallback
  private readonly _credentialDataSupplier?: CredentialDataSupplier
}
```

**Key Methods**:
- `getCredentialOfferSessionById()` - Session retrieval with lookups
- `deleteCredentialOfferSessionById()` - Session cleanup
- `processNotification()` - Handle notification requests
- Credential offer management
- Token validation
- Credential issuance coordination

#### VcIssuerBuilder
**File**: `builder/VcIssuerBuilder.ts`

Fluent builder for issuer configuration.

**Key Configuration Methods**:
```typescript
class VcIssuerBuilder {
  issuerMetadataBuilder?: IssuerMetadataBuilderV1_15
  issuerMetadata: Partial<CredentialIssuerMetadataOptsV1_0_15>
  authorizationServerMetadata: Partial<AuthorizationServerMetadata>
  asClientOpts?: ClientMetadata
  txCode?: TxCode
  defaultCredentialOfferBaseUri?: string
  cNonceExpiresIn?: number
  credentialOfferStateManager?: IStateManager<CredentialOfferSession>
  credentialOfferURIManager?: IStateManager<URIState>
  cNonceStateManager?: IStateManager<CNonceState>
  credentialSignerCallback?: CredentialSignerCallback
  jwtVerifyCallback?: JWTVerifyCallback
  credentialDataSupplier?: CredentialDataSupplier
}
```

**Builder Methods**:
- `withIssuerMetadata()` - Validates v1_0_15 structure
- `withCredentialEndpoint()`
- `withNonceEndpoint()` - NEW IN V15
- `withAuthorizationMetadata()`
- `withTokenEndpoint()`
- State manager configuration

#### IssuerMetadataBuilderV1_15
**File**: `builder/IssuerMetadataBuilderV1_15.ts`

Constructs issuer metadata.

**Key Properties & Methods**:
```typescript
class IssuerMetadataBuilderV1_15 {
  credentialEndpoint?: string
  nonceEndpoint?: string  // NEW IN V15
  credentialIssuer?: string
  batchCredentialIssuance?: BatchCredentialIssuance  // Changed from endpoint
  credentialResponseEncryption?: ResponseEncryption
  signedMetadata?: string  // NEW IN V15
  credentialIdentifiersSupported?: boolean  // NEW IN V15
  
  // Builder methods
  withNonceEndpoint(url)
  withBatchCredentialIssuance(config)
  withCredentialResponseEncryption(encryption)
  withSignedMetadata(jwt)
  withCredentialIdentifiersSupported(boolean)
}
```

#### CredentialSupportedBuilderV1_15
**File**: `builder/CredentialSupportedBuilderV1_15.ts`

Builds credential configuration objects.

**Key Properties**:
```typescript
class CredentialSupportedBuilderV1_15 {
  format?: OID4VCICredentialFormat
  scope?: string
  credentialName?: string
  credentialDefinition?: CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0_15 | CredentialDefinitionJwtVcJsonV1_0_15
  cryptographicBindingMethodsSupported?: string[]
  credentialSigningAlgValuesSupported?: string[]
  proofTypesSupported?: ProofTypesSupported
  display?: CredentialsSupportedDisplay[]
  claims?: ClaimsDescriptionV1_0_15[]  // Changed to path pointers
  vct?: string  // For dc+sd-jwt
  doctype?: string  // For mso_mdoc
}
```

**Key Methods**:
- `withFormat()`
- `withVct()` - NEW IN V15
- `withDoctype()` - NEW IN V15
- `withCredentialDefinition()`
- `addProofTypesSupported()`

#### AuthorizationServerMetadataBuilder
**File**: `builder/AuthorizationServerMetadataBuilder.ts`

Builds authorization server metadata.

### Issuer State Management
`packages/issuer/lib/state-manager/`

- **MemoryStates.ts** - In-memory state storage
- **LookupStateManager.ts** - Multi-key lookup wrapper
- **CredentialOfferStateBuilder.ts** - Session building

### Issuer Utility Functions
`packages/issuer/lib/functions/`

- **CredentialOfferUtils.ts** - Offer generation and utilities
- **ASOidcClient.ts** - Authorization server OIDC client

---

## 5. Metadata Handling Structures

### Metadata Type Hierarchy

```
AuthorizationServerMetadata (from ServerMetadata.ts)
├── OAuth 2.0 endpoints (authorization_endpoint, token_endpoint, etc.)
├── OpenID Connect specific fields
├── Revocation endpoints
├── PKCE support
├── DPoP signing algorithms
└── pre-authorized_grant_anonymous_access_supported (NEW IN V15)

CredentialIssuerMetadata (from Generic.types.ts)
├── credential_issuer (REQUIRED)
├── credential_endpoint (REQUIRED)
├── authorization_servers?
├── token_endpoint?
└── credentials_supported (legacy)

CredentialIssuerMetadataV1_0_15 (from v1_0_15.types.ts)
├── credential_issuer (REQUIRED)
├── credential_endpoint (REQUIRED)
├── credential_configurations_supported (REQUIRED)  // NEW structure
├── nonce_endpoint? (NEW IN V15)
├── deferred_credential_endpoint?
├── notification_endpoint?
├── authorization_servers?
├── credential_response_encryption?
├── batch_credential_issuance? (NEW IN V15)
├── credential_identifiers_supported? (NEW IN V15)
├── token_endpoint?
├── display?
├── authorization_challenge_endpoint?
└── signed_metadata?
```

### Metadata Discovery

**MetadataClientV1_0_15 Process**:
1. Queries OpenID4VCI metadata endpoint (issuer/.well-known/openid-credential-issuer)
2. Falls back to authorization server metadata
3. Merges both metadata sources
4. Validates required fields
5. Returns `EndpointMetadataResultV1_0_15`

### Key Metadata Utilities

**IssuerMetadataUtils.ts** Functions:
- `determineVersionsFromIssuerMetadata()` - Detects supported version from structure
- `getSupportedCredentials()` - Filters credentials by format/types
- `getSupportedCredential()` - Single credential lookup
- `getIssuerDisplays()` - Locale-aware display filtering

**Version Detection Logic**:
```typescript
function determineVersionsFromIssuerMetadata(metadata) {
  if ('credential_configurations_supported' in metadata) {
    return [OpenId4VCIVersion.VER_1_0_15]  // Only one version currently
  }
  return [OpenId4VCIVersion.VER_UNKNOWN]
}
```

---

## 6. Proof Types and Credential Request Handling

### Proof of Possession Structure

#### Basic Proof Type
```typescript
interface ProofOfPossession {
  proof_type: 'jwt'
  jwt: string
  [x: string]: unknown  // For extensions
}
```

#### Batch Proofs (v15)
```typescript
interface ProofOfPossessionMap {
  [proofType: string]: ProofOfPossession[]
}
```

### Proof Request in Credential Request
```typescript
// MUTUALLY EXCLUSIVE in v1.0.15:
proof?: ProofOfPossession  // Single credential request
proofs?: ProofOfPossessionMap  // Batch issuance (when batch_size set)
```

### JWT Header Parameters for Proofs
```typescript
interface JoseHeaderParameters {
  kid?: string  // For DID binding - MUST NOT be present if jwk or x5c
  x5c?: string[]  // Certificate chain (key attestation) - MUST NOT if kid/jwk
  x5u?: string
  jku?: string
  jwk?: BaseJWK  // Key material - MUST NOT if kid or x5c
  typ?: string
  cty?: string
}

interface JWTHeaderParameters extends CompactJWSHeaderParameters {
  alg: string  // REQUIRED
  b64?: true
}
```

### JWT Payload for Proofs
```typescript
interface JWTPayload {
  iss?: string  // Issuer (client_id)
  aud?: string | string[]  // Audience (issuer URL)
  iat?: number  // Issued at time (REQUIRED)
  nonce?: string  // REQUIRED - c_nonce from issuer
  jti?: string  // Nonce chosen by wallet (replay prevention)
  exp?: number  // Expiration (not longer than 5 minutes)
  client_id?: string  // Client identifier
  [s: string]: unknown
}
```

### Proof Creation Process

**File**: `ProofUtil.ts`

```typescript
export const createProofOfPossession = async <DIDDoc extends object = never>(
  popMode: PoPMode,  // 'pop' or 'JWT'
  callbacks: ProofOfPossessionCallbacks,
  jwtProps?: JwtProps,
  existingJwt?: Jwt,
): Promise<ProofOfPossession>
```

**Process**:
1. Invoke sign callback with JWT payload
2. Partially validate JWS structure
3. Call optional verify callback
4. Return proof object with JWT

### Proof Types Supported (v15)
```typescript
type KeyProofType = 'jwt' | 'cwt' | 'ldp_vp'  // Generic support

interface ProofTypesV1_0_15 {
  jwt?: ProofTypeV1_0_15
  ldp_vp?: ProofTypeV1_0_15  
  attestation?: ProofTypeV1_0_15  // NEW
}

interface ProofTypeV1_0_15 {
  proof_signing_alg_values_supported: string[]  // REQUIRED
  key_attestations_required?: KeyAttestationsRequiredV1_0_15
}
```

### Credential Request Building

**CredentialRequestClientBuilderV1_0_15** orchestrates:
1. Format removal (v15 doesn't include format in request)
2. Identifier selection (credential_identifier vs credential_configuration_id)
3. Proof building via ProofOfPossessionBuilder
4. Response encryption setup
5. Deferred handling

### Key Differences from Previous Versions

**v1.0.15 Specific**:
- Format removed from credential request
- Credential requests use credential_configuration_id (from scope) OR credential_identifier (from authorization_details)
- Proofs parameter for batch issuance
- Nonce obtained from dedicated Nonce Endpoint (not in token response)
- Key attestations support
- Wallet attestations support
- Claims use path pointer notation

---

## 7. Version-Specific Code Patterns Found

### Naming Convention

All v1.0.15 specific implementations use **V1_0_15** suffix:

**Type Files**:
- `v1_0_15.types.ts` - All v15 type definitions
- Types: `IssuerMetadataV1_0_15`, `CredentialResponseV1_0_15`, etc.

**Client Classes**:
- `OpenID4VCIClientV1_0_15` - Main client for v15
- `CredentialRequestClientBuilderV1_0_15` - Request builder
- `MetadataClientV1_0_15` - Metadata handling
- `CredentialOfferClientV1_0_15` - Offer parsing

**Issuer Builders**:
- `IssuerMetadataBuilderV1_15` - Metadata construction
- `CredentialSupportedBuilderV1_15` - Credential config building

### Version Checking Patterns

**File**: `CredentialOfferUtil.ts`
```typescript
export function determineSpecVersionFromURI(uri: string): OpenId4VCIVersion {
  let version = determineSpecVersionFromScheme(uri, OpenId4VCIVersion.VER_UNKNOWN)
  if (version === OpenId4VCIVersion.VER_UNKNOWN) {
    version = OpenId4VCIVersion.VER_1_0_15  // Default to v15
  }
  return version
}

function determineSpecVersionFromScheme(uri: string, defaultVersion) {
  // Checks for credential_offer or credential_offer_uri query params
  // Sniffs offer JSON keys
  // Returns VER_1_0_15 or VER_UNKNOWN
}
```

**File**: `IssuerMetadataUtils.ts`
```typescript
export function determineVersionsFromIssuerMetadata(
  issuerMetadata
): Array<OpenId4VCIVersion> {
  const versions = new Set<OpenId4VCIVersion>()
  if ('credential_configurations_supported' in issuerMetadata) {
    versions.add(OpenId4VCIVersion.VER_1_0_15)
  }
  if (versions.size === 0) {
    versions.add(OpenId4VCIVersion.VER_UNKNOWN)
  }
  return Array.from(versions).sort().reverse()
}
```

**File**: `CredentialRequestClientBuilderV1_0_15.ts`
```typescript
const version = opts.version ?? request.version ?? determineSpecVersionFromOffer(request)
if (version < OpenId4VCIVersion.VER_1_0_15) {
  throw new Error('Versions below v1.0.15 (draft 15) are not supported.')
}
```

### Legacy Version Remnants

**File**: `Generic.types.ts`
```typescript
// Legacy credential support (pre-v13)
export interface CredentialIssuerMetadataOpts {
  credentials_supported: CredentialsSupportedLegacy[]  // Legacy array format
  // ...
}

// Current v15 structure
export interface CredentialIssuerMetadata extends CredentialIssuerMetadataOpts {
  credential_configurations_supported: Record<string, CredentialConfigurationSupportedV1_0_15>
}
```

**File**: `TypeConversionUtils.ts`
```typescript
function filterMatchingConfig(config) {
  // Handles both old (array) and new (record) formats
  // Checks credential_definition.type, type array, types array, vct, doctype
  // For backward compat, assigns id if not present (for versions < 13)
}
```

### Feature Flags

**Nonce Endpoint Support**:
```typescript
// In IssuerMetadataBuilderV1_15
if (metadata?.credentialIssuerMetadata?.nonce_endpoint) {
  builder.withNonceEndpoint(metadata.credentialIssuerMetadata?.nonce_endpoint)
}
```

**Batch Issuance Support**:
```typescript
// In metadata
batch_credential_issuance?: {
  batch_size: number  // Max proofs array size
}
```

**Credential Identifiers Support**:
```typescript
// In metadata
credential_identifiers_supported?: boolean  // Default false
```

**Response Encryption**:
```typescript
// In credential request
credential_response_encryption?: {
  jwk: JWK
  alg: AlgValue
  enc: EncValue
}
```

### Error Codes

**Removed in v15** (from earlier versions):
- `authorization_pending`
- `slow_down`

**Error Response Structure** (simplified):
```typescript
interface CredentialErrorResponseV1_0_15 {
  error: string
  error_description?: string
  error_uri?: string
  // Note: c_nonce removed from error responses
}
```

---

## 8. Architecture Overview

### Package Structure

```
OID4VC (monorepo)
├── packages/oid4vci-common/  (39KB+ source code)
│   ├── lib/types/             (type definitions)
│   ├── lib/functions/         (utilities)
│   └── lib/experimental/      (holder-vci)
│
├── packages/client/           (client implementation)
│   ├── lib/
│   │   ├── OpenID4VCIClientV1_0_15.ts
│   │   ├── CredentialRequestClientBuilderV1_0_15.ts
│   │   ├── MetadataClientV1_0_15.ts
│   │   ├── CredentialOfferClientV1_0_15.ts
│   │   ├── NonceClient.ts        (NEW V15)
│   │   ├── ProofOfPossessionBuilder.ts
│   │   ├── AccessTokenClient.ts
│   │   ├── AuthorizationCodeClient.ts
│   │   └── functions/
│   └── ...
│
├── packages/issuer/           (issuer implementation)
│   ├── lib/
│   │   ├── VcIssuer.ts
│   │   ├── builder/
│   │   │   ├── VcIssuerBuilder.ts
│   │   │   ├── IssuerMetadataBuilderV1_15.ts
│   │   │   ├── CredentialSupportedBuilderV1_15.ts
│   │   │   └── AuthorizationServerMetadataBuilder.ts
│   │   ├── state-manager/     (session management)
│   │   ├── functions/
│   │   └── types/
│   └── ...
│
├── packages/common/           (shared utilities)
├── packages/issuer-rest/      (REST API wrapper)
├── packages/siop-oid4vp/      (Presentation flows)
└── packages/callback-example/ (usage examples)
```

### Data Flow

**Client Flow (Pre-Auth)**:
```
Credential Offer URI
    ↓
CredentialOfferClientV1_0_15 (parse)
    ↓
MetadataClientV1_0_15 (discover endpoints)
    ↓
NonceClient (get c_nonce from Nonce Endpoint) [NEW V15]
    ↓
ProofOfPossessionBuilder (sign proof)
    ↓
CredentialRequestClient (send request with proof)
    ↓
Parse CredentialResponseV1_0_15 (credentials array) [NEW FORMAT]
```

**Issuer Flow**:
```
VcIssuerBuilder (configuration)
    ↓
IssuerMetadataBuilderV1_15 (build metadata)
    ↓
CredentialSupportedBuilderV1_15 (per credential type)
    ↓
Create metadata (with nonce_endpoint, batch_credential_issuance, etc.)
    ↓
Handle credential requests (validate proofs, issue credentials)
    ↓
Return CredentialResponseV1_0_15 (array format)
```

---

## 9. Key Statistics

- **Total Source Files**: ~40KB of TypeScript code across packages
- **Version-Specific Files**: 11+ files with V1_0_15/V1_15 in name
- **Common Types**: 30+ interface definitions in v1_0_15.types.ts
- **Supported Formats**: 6 credential formats (jwt_vc_json, jwt_vc_json-ld, ldp_vc, dc+sd-jwt, vc+sd-jwt, mso_mdoc)
- **Supported Proof Types**: 3 types (jwt, ldp_vp, attestation in v15)
- **OAuth 2.0 Flows**: 2 (authorization code, pre-authorized code)

---

## 10. Notable v1.0.15 Enhancements

1. **Nonce Endpoint**: Dedicated endpoint for obtaining fresh c_nonce values
2. **Batch Issuance**: Support for multiple proofs in single credential request
3. **Credential Identifiers**: Token response can return specific credential identifiers
4. **Key Attestations**: Support for key attestation information in proofs
5. **Wallet Attestations**: Client attestation JWT format
6. **Signed Metadata**: Issuer metadata can be signed
7. **Claims Path Pointers**: Structured claim descriptions using path pointers (Appendix C)
8. **Format Removal**: Credential requests no longer include format parameter
9. **Response Encryption**: Per-request response encryption parameters
10. **Simplified Error Responses**: Removed c_nonce from error responses

---

## Conclusion

The OID4VCI SDK is a comprehensive, version-specific implementation targeting Draft 15 (v1.0.15) of the OpenID4VCI specification. The codebase demonstrates excellent separation of concerns with clear type definitions, builder patterns for configuration, and strong version control through naming conventions. The architecture supports both client (wallet) and issuer implementations with extensive metadata handling and proof-of-possession mechanisms.

For v1.0 compliance upgrades, the existing V1_0_15 patterns can be extended with a V1_0 enum, type aliases, and conditional builders while maintaining backward compatibility where needed.
