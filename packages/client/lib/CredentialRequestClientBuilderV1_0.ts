import {
  AccessTokenResponse,
  CredentialRequestResponseEncryptionV1_0,
  determineSpecVersionFromOffer,
  EndpointMetadataResultV1_0,
  ExperimentalSubjectIssuance,
  getIssuerFromCredentialOfferPayload,
  OpenId4VCIVersion,
  UniformCredentialOfferRequest,
} from '@sphereon/oid4vci-common'

import { CredentialOfferClient } from './CredentialOfferClient'
import { CredentialRequestClient } from './CredentialRequestClient'

/**
 * Credential Request Client Builder for OID4VCI 1.0 (Draft 16)
 *
 * Key changes from v1.0.15:
 * - proof parameter replaced with proofs parameter (plural)
 * - format parameter removed from credential requests
 * - credential_response_encryption support
 * - notification_endpoint support
 */
export class CredentialRequestClientBuilderV1_0 {
  credentialEndpoint?: string
  deferredCredentialEndpoint?: string
  nonceEndpoint?: string
  notificationEndpoint?: string // NEW in v1.0
  deferredCredentialAwait = false
  deferredCredentialIntervalInMS = 5000
  credentialIdentifier?: string // Used when credential_identifiers was returned from Token Response
  credentialConfigurationId?: string // Used when scope was used and no credential_identifiers returned
  credentialTypes?: string[] = [] // Legacy support
  token?: string
  version?: OpenId4VCIVersion
  subjectIssuance?: ExperimentalSubjectIssuance
  issuerState?: string
  credentialResponseEncryption?: CredentialRequestResponseEncryptionV1_0 // NEW in v1.0

  // NOTE: format parameter removed in v1.0 - credential requests no longer include format parameter

  public static fromCredentialIssuer({
    credentialIssuer,
    metadata,
    version,
    credentialIdentifier,
    credentialConfigurationId,
    credentialTypes,
  }: {
    credentialIssuer: string
    metadata?: EndpointMetadataResultV1_0
    version?: OpenId4VCIVersion
    credentialIdentifier?: string
    credentialConfigurationId?: string
    credentialTypes?: string | string[]
  }): CredentialRequestClientBuilderV1_0 {
    const issuer = credentialIssuer
    const builder = new CredentialRequestClientBuilderV1_0()
    builder.withVersion(version ?? OpenId4VCIVersion.VER_1_0)
    builder.withCredentialEndpoint(metadata?.credential_endpoint ?? (issuer.endsWith('/') ? `${issuer}credential` : `${issuer}/credential`))

    if (metadata?.deferred_credential_endpoint) {
      builder.withDeferredCredentialEndpoint(metadata.deferred_credential_endpoint)
    }

    // Support for nonce endpoint
    if (metadata?.credentialIssuerMetadataFieldNamesV1_0?.nonce_endpoint) {
      builder.withNonceEndpoint(metadata.credentialIssuerMetadataFieldNamesV1_0.nonce_endpoint)
    }

    // NEW in v1.0: Support for notification endpoint
    if (metadata?.credentialIssuerMetadataFieldNamesV1_0?.notification_endpoint) {
      builder.withNotificationEndpoint(metadata.credentialIssuerMetadataFieldNamesV1_0.notification_endpoint)
    }

    if (credentialIdentifier) {
      builder.withCredentialIdentifier(credentialIdentifier)
    }
    if (credentialConfigurationId) {
      builder.withCredentialConfigurationId(credentialConfigurationId)
    }
    if (credentialTypes) {
      builder.withCredentialType(credentialTypes)
    }
    return builder
  }

  public static async fromURI({
    uri,
    metadata,
  }: {
    uri: string
    metadata?: EndpointMetadataResultV1_0
  }): Promise<CredentialRequestClientBuilderV1_0> {
    const offer = await CredentialOfferClient.fromURI(uri)
    return CredentialRequestClientBuilderV1_0.fromCredentialOfferRequest({
      request: offer,
      ...offer,
      metadata,
      version: offer.version,
    })
  }

  public static fromCredentialOfferRequest(opts: {
    request: UniformCredentialOfferRequest
    scheme?: string
    baseUrl?: string
    version?: OpenId4VCIVersion
    metadata?: EndpointMetadataResultV1_0
  }): CredentialRequestClientBuilderV1_0 {
    const { request, metadata } = opts
    const version = opts.version ?? request.version ?? determineSpecVersionFromOffer(request.original_credential_offer)
    if (version < OpenId4VCIVersion.VER_1_0) {
      throw new Error('Versions below v1.0 (draft 16) are not supported.')
    }
    const builder = new CredentialRequestClientBuilderV1_0()
    const issuer = getIssuerFromCredentialOfferPayload(request.credential_offer) ?? (metadata ? (metadata.issuer as string) : undefined)

    if (!issuer) {
      throw Error('Could not determine credential issuer from offer or metadata')
    }

    builder.withVersion(version)
    builder.withCredentialEndpoint(
      metadata?.credential_endpoint ?? (issuer.endsWith('/') ? `${issuer}credential` : `${issuer}/credential`),
    )

    if (metadata?.deferred_credential_endpoint) {
      builder.withDeferredCredentialEndpoint(metadata.deferred_credential_endpoint)
    }

    // Support for nonce endpoint
    if (metadata?.credentialIssuerMetadataFieldNamesV1_0?.nonce_endpoint) {
      builder.withNonceEndpoint(metadata.credentialIssuerMetadataFieldNamesV1_0.nonce_endpoint)
    }

    // NEW in v1.0: Support for notification endpoint
    if (metadata?.credentialIssuerMetadataFieldNamesV1_0?.notification_endpoint) {
      builder.withNotificationEndpoint(metadata.credentialIssuerMetadataFieldNamesV1_0.notification_endpoint)
    }

    return builder
  }

  public withCredentialEndpoint(credentialEndpoint: string): CredentialRequestClientBuilderV1_0 {
    this.credentialEndpoint = credentialEndpoint
    return this
  }

  public withDeferredCredentialEndpoint(deferredCredentialEndpoint: string): CredentialRequestClientBuilderV1_0 {
    this.deferredCredentialEndpoint = deferredCredentialEndpoint
    return this
  }

  public withNonceEndpoint(nonceEndpoint: string): CredentialRequestClientBuilderV1_0 {
    this.nonceEndpoint = nonceEndpoint
    return this
  }

  // NEW in v1.0
  public withNotificationEndpoint(notificationEndpoint: string): CredentialRequestClientBuilderV1_0 {
    this.notificationEndpoint = notificationEndpoint
    return this
  }

  public withDeferredCredentialAwait(deferredCredentialAwait: boolean, deferredCredentialIntervalInMS?: number): CredentialRequestClientBuilderV1_0 {
    this.deferredCredentialAwait = deferredCredentialAwait
    if (deferredCredentialIntervalInMS) {
      this.deferredCredentialIntervalInMS = deferredCredentialIntervalInMS
    }
    return this
  }

  public withCredentialIdentifier(credentialIdentifier: string | string[]): CredentialRequestClientBuilderV1_0 {
    if (Array.isArray(credentialIdentifier)) {
      if (credentialIdentifier.length !== 1) {
        throw new Error('Only one credential identifier is supported in v1.0')
      }
      this.credentialIdentifier = credentialIdentifier[0]
    } else {
      this.credentialIdentifier = credentialIdentifier
    }
    return this
  }

  public withCredentialConfigurationId(credentialConfigurationId: string): CredentialRequestClientBuilderV1_0 {
    this.credentialConfigurationId = credentialConfigurationId
    return this
  }

  public withCredentialType(credentialTypes: string | string[]): CredentialRequestClientBuilderV1_0 {
    this.credentialTypes = Array.isArray(credentialTypes) ? credentialTypes : [credentialTypes]
    return this
  }

  public withToken(token: string): CredentialRequestClientBuilderV1_0 {
    this.token = token
    return this
  }

  public withTokenFromResponse(response: AccessTokenResponse): CredentialRequestClientBuilderV1_0 {
    this.token = response.access_token
    return this
  }

  public withVersion(version: OpenId4VCIVersion): CredentialRequestClientBuilderV1_0 {
    this.version = version
    return this
  }

  public withSubjectIssuance(subjectIssuance: ExperimentalSubjectIssuance): CredentialRequestClientBuilderV1_0 {
    this.subjectIssuance = subjectIssuance
    return this
  }

  public withIssuerState(issuerState: string): CredentialRequestClientBuilderV1_0 {
    this.issuerState = issuerState
    return this
  }

  // NEW in v1.0: Support for credential response encryption
  public withCredentialResponseEncryption(encryption: CredentialRequestResponseEncryptionV1_0): CredentialRequestClientBuilderV1_0 {
    this.credentialResponseEncryption = encryption
    return this
  }

  public build(): CredentialRequestClient {
    if (!this.credentialEndpoint) {
      throw Error('No credential endpoint supplied')
    }
    if (!this.token) {
      throw Error('No token supplied')
    }
    if (!this.credentialIdentifier && !this.credentialConfigurationId && (!this.credentialTypes || this.credentialTypes.length === 0)) {
      throw Error('Either credentialIdentifier, credentialConfigurationId, or credentialTypes must be supplied')
    }

    // Cast to any to avoid type mismatch with v1.0.15 builder
    return new CredentialRequestClient(this as any)
  }
}
