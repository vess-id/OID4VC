# OID4VCI SDK - Quick Reference Guide

## Version Status
- **Current Version**: Draft 15 (v1.0.15)
- **Enum Value**: `OpenId4VCIVersion.VER_1_0_15 = 1015`
- **Earlier Versions**: NOT supported

## Core File Locations

### Type Definitions
```
packages/oid4vci-common/lib/types/
├── v1_0_15.types.ts          (ALL v15 types - 374 lines)
├── CredentialIssuance.types.ts
├── Generic.types.ts
├── Authorization.types.ts
├── ServerMetadata.ts
└── OpenID4VCIVersions.types.ts
```

### Client Classes
```
packages/client/lib/
├── OpenID4VCIClientV1_0_15.ts         (Main client)
├── CredentialRequestClientBuilderV1_0_15.ts
├── MetadataClientV1_0_15.ts
├── CredentialOfferClientV1_0_15.ts
├── NonceClient.ts                      (NEW V15)
├── ProofOfPossessionBuilder.ts
├── AccessTokenClient.ts
└── functions/
    ├── AccessTokenUtil.ts
    ├── CredentialOfferCommons.ts
    └── notifications.ts
```

### Issuer Classes
```
packages/issuer/lib/
├── VcIssuer.ts                         (Core issuer)
├── builder/
│   ├── VcIssuerBuilder.ts
│   ├── IssuerMetadataBuilderV1_15.ts
│   ├── CredentialSupportedBuilderV1_15.ts
│   └── AuthorizationServerMetadataBuilder.ts
└── state-manager/
    ├── MemoryStates.ts
    ├── LookupStateManager.ts
    └── CredentialOfferStateBuilder.ts
```

## Key Type Imports

```typescript
// Main v15 types
import {
  IssuerMetadataV1_0_15,
  CredentialRequestV1_0_15,
  CredentialResponseV1_0_15,
  CredentialOfferPayloadV1_0_15,
  NonceResponseV1_0_15,
  ProofTypesV1_0_15,
  KeyAttestationJWT,
  WalletAttestationJWT,
  ClaimsDescriptionV1_0_15,
} from '@sphereon/oid4vci-common'

// Credential configuration types
import {
  CredentialConfigurationSupportedJwtVcJsonV1_0_15,
  CredentialConfigurationSupportedJwtVcJsonLdAndLdpVcV1_0_15,
  CredentialConfigurationSupportedSdJwtVcV1_0_15,
  CredentialConfigurationSupportedMsoMdocV1_0_15,
} from '@sphereon/oid4vci-common'

// Client classes
import {
  OpenID4VCIClientV1_0_15,
  CredentialRequestClientBuilderV1_0_15,
  MetadataClientV1_0_15,
} from '@sphereon/oid4vci-client'

// Issuer classes
import {
  VcIssuer,
  VcIssuerBuilder,
  IssuerMetadataBuilderV1_15,
  CredentialSupportedBuilderV1_15,
} from '@vess-id/oid4vci-issuer'
```

## Critical Type Structures

### Issuer Metadata
```typescript
interface IssuerMetadataV1_0_15 {
  credential_issuer: string                  // REQUIRED
  credential_endpoint: string                // REQUIRED
  credential_configurations_supported: Record<string, CredentialConfigurationSupportedV1_0_15>
  nonce_endpoint?: string                    // NEW V15
  batch_credential_issuance?: {batch_size: number}
  credential_identifiers_supported?: boolean
  signed_metadata?: string
}
```

### Credential Request
```typescript
interface CredentialRequestV1_0_15Common {
  credential_configuration_id?: string  // OR credential_identifier
  credential_identifier?: string        // OR credential_configuration_id
  proof?: ProofOfPossession            // Single
  proofs?: ProofOfPossessionMap        // Batch (mutually exclusive)
  credential_response_encryption?: {jwk: JWK, alg: string, enc: string}
}
// Note: format parameter REMOVED
```

### Credential Response
```typescript
interface CredentialResponseV1_0_15 {
  credentials?: CredentialResponseCredentialV1_0_15[]  // Array (NEW)
  transaction_id?: string
  notification_id?: string
}
```

### Nonce Endpoint (NEW)
```typescript
interface NonceResponseV1_0_15 {
  c_nonce: string  // REQUIRED
  // c_nonce_expires_in: REMOVED
}
```

## Key Patterns

### Version Detection
```typescript
// Detect version from metadata
if ('credential_configurations_supported' in metadata) {
  version = OpenId4VCIVersion.VER_1_0_15
}

// Detect from credential offer
const version = determineSpecVersionFromUffer(offer)
if (version < OpenId4VCIVersion.VER_1_0_15) {
  throw new Error('Versions below v1.0.15 are not supported')
}
```

### Client Flow
```typescript
const client = new OpenID4VCIClientV1_0_15({credentialIssuer, pkce})
const metadata = await MetadataClientV1_0_15.retrieveAllMetadata(issuer)
const nonce = await NonceClient.acquireNonceFromAuthorizationServer({metadata})
const builder = CredentialRequestClientBuilderV1_0_15.fromCredentialOffer({offer})
const request = builder.build()
const response = await client.requestCredential(request)
```

### Issuer Setup
```typescript
const metadataBuilder = new IssuerMetadataBuilderV1_15()
  .withCredentialEndpoint(endpoint)
  .withNonceEndpoint(nonceUrl)
  .withBatchCredentialIssuance({batch_size: 10})

const credentialBuilder = metadataBuilder.newSupportedCredentialBuilder()
  .withFormat('jwt_vc_json')
  .withCredentialDefinition({type: ['VerifiableCredential', 'MyType']})

const issuer = new VcIssuerBuilder()
  .withIssuerMetadataBuilder(metadataBuilder)
  .withCredentialSignerCallback(signer)
  .build()
```

## New in v1.0.15

1. **Nonce Endpoint** - Dedicated endpoint to get fresh nonce
2. **Batch Issuance** - Multiple proofs: `proofs` vs single `proof`
3. **Credential Identifiers** - Token response can return specific IDs
4. **Key Attestations** - `KeyAttestationJWT` format support
5. **Wallet Attestations** - `WalletAttestationJWT` format
6. **Claims Path Pointers** - Structured `ClaimsDescriptionV1_0_15`
7. **Format Removal** - No format in credential requests
8. **Signed Metadata** - Issuer metadata signing support
9. **Batch Metadata** - `batch_credential_issuance` instead of endpoint
10. **Simplified Errors** - c_nonce removed from error responses

## Removed in v1.0.15

- `format` parameter from credential request
- `c_nonce` from token response (moved to Nonce Endpoint)
- `c_nonce_expires_in` from all responses
- Error codes: `authorization_pending`, `slow_down`

## Package Structure
```
@sphereon/oid4vci-common    - Type definitions & utilities
@sphereon/oid4vci-client    - Wallet/Client implementation
@vess-id/oid4vci-issuer     - Issuer implementation (scope migrated)
```

## Supported Credential Formats
1. `jwt_vc_json` - JWT VC JSON format
2. `jwt_vc_json-ld` - JWT VC JSON-LD format
3. `ldp_vc` - Linked Data Proof VC
4. `dc+sd-jwt` - SD-JWT format
5. `vc+sd-jwt` - VC with SD-JWT
6. `mso_mdoc` - ISO mDL format

## Supported Proof Types
- `jwt` - JWT proof type
- `ldp_vp` - Linked Data VP proof
- `attestation` - Key/Wallet attestation (NEW V15)

## State Management
```typescript
// Three state managers in issuer:
_credentialOfferSessions: IStateManager<CredentialOfferSession>
_cNonces: IStateManager<CNonceState>
_uris: IStateManager<URIState>
```

## Metadata Endpoints
```
GET /
  -> Returns metadata with credential_configurations_supported

GET /.well-known/openid-credential-issuer
  -> OpenID4VCI metadata

GET /nonce (POST)
  -> Returns {c_nonce: string}

POST /credential
  -> Accepts CredentialRequestV1_0_15

POST /credential?transaction_id=X
  -> Deferred credential retrieval

POST /notification
  -> Notification callback
```

## Common Utilities

```typescript
// Version detection
determineVersionsFromIssuerMetadata(metadata)
determineSpecVersionFromURI(uri)
determineSpecVersionFromOffer(offer)

// Credential filtering
getSupportedCredentials(opts?: {issuerMetadata, version, types, format})
getSupportedCredential(opts)

// Type extraction
getTypesFromObject(config)
getTypesFromAuthorizationDetails(authDetails)
getTypesFromCredentialSupported(credentialSupported)

// Metadata utilities
getIssuerDisplays(metadata, opts?)
```

## Important Constants
```typescript
OpenId4VCIVersion.VER_1_0_15 = 1015
OpenId4VCIVersion.VER_UNKNOWN = Number.MAX_VALUE

DefaultURISchemes.INITIATE_ISSUANCE = 'openid-initiate-issuance'
DefaultURISchemes.CREDENTIAL_OFFER = 'openid-credential-offer'
```

## Testing
- Location: `packages/*/lib/__tests__/`
- Runner: Vitest
- Command: `pnpm test:vitest`

## Documentation
- Main README: `README.md`
- Client README: `packages/client/README.md`
- Issuer README: `packages/issuer/README.md`
- Spec: https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html
