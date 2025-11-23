import {
  BatchCredentialIssuanceV1_0,
  CredentialConfigurationSupportedV1_0,
  CredentialRequestEncryptionV1_0,
  IssuerMetadataV1_0,
  MetadataDisplay,
  ResponseEncryption,
  validateAuthorizationServersArray,
  validateDisplayArray,
} from '@sphereon/oid4vci-common'

import { CredentialSupportedBuilderV1_0 } from './CredentialSupportedBuilderV1_0'
import { DisplayBuilder } from './DisplayBuilder'

/**
 * Builder for OID4VCI 1.0 (Draft 16) Issuer Metadata
 *
 * Key changes from v1.0.15:
 * - signed_metadata removed (new signed metadata mechanism)
 * - credential_request_encryption added
 * - Arrays must be non-empty if present
 */
export class IssuerMetadataBuilderV1_0 {
  credentialEndpoint?: string
  nonceEndpoint?: string
  credentialIssuer?: string
  supportedBuilders: CredentialSupportedBuilderV1_0[] = []
  credentialConfigurationsSupported: Record<string, CredentialConfigurationSupportedV1_0> = {}
  displayBuilders: DisplayBuilder[] = []
  display: MetadataDisplay[] = []
  batchCredentialIssuance?: BatchCredentialIssuanceV1_0
  authorizationServers?: string[]
  tokenEndpoint?: string
  authorizationChallengeEndpoint?: string
  credentialRequestEncryption?: CredentialRequestEncryptionV1_0 // NEW in v1.0
  credentialResponseEncryption?: ResponseEncryption
  credentialIdentifiersSupported?: boolean
  deferredCredentialEndpoint?: string
  notificationEndpoint?: string

  // NEW in v1.0: Credential Request Encryption support
  public withCredentialRequestEncryption(credentialRequestEncryption: CredentialRequestEncryptionV1_0): IssuerMetadataBuilderV1_0 {
    this.credentialRequestEncryption = credentialRequestEncryption
    return this
  }

  public withBatchCredentialIssuance(batchCredentialIssuance: BatchCredentialIssuanceV1_0): IssuerMetadataBuilderV1_0 {
    this.batchCredentialIssuance = batchCredentialIssuance
    return this
  }

  public withAuthorizationServers(authorizationServers: string[]): IssuerMetadataBuilderV1_0 {
    // Validate non-empty array requirement for v1.0
    if (!validateAuthorizationServersArray(authorizationServers)) {
      throw new Error('authorization_servers must be a non-empty array if provided (OID4VCI 1.0 requirement)')
    }
    this.authorizationServers = authorizationServers
    return this
  }

  public withAuthorizationServer(authorizationServer: string): IssuerMetadataBuilderV1_0 {
    if (this.authorizationServers === undefined) {
      this.authorizationServers = []
    }
    this.authorizationServers.push(authorizationServer)
    return this
  }

  public withAuthorizationChallengeEndpoint(authorizationChallengeEndpoint: string): IssuerMetadataBuilderV1_0 {
    this.authorizationChallengeEndpoint = authorizationChallengeEndpoint
    return this
  }

  public withTokenEndpoint(tokenEndpoint: string): IssuerMetadataBuilderV1_0 {
    this.tokenEndpoint = tokenEndpoint
    return this
  }

  public withCredentialEndpoint(credentialEndpoint: string): IssuerMetadataBuilderV1_0 {
    this.credentialEndpoint = credentialEndpoint
    return this
  }

  public withNonceEndpoint(nonceEndpoint: string): IssuerMetadataBuilderV1_0 {
    this.nonceEndpoint = nonceEndpoint
    return this
  }

  public withDeferredCredentialEndpoint(deferredCredentialEndpoint: string): IssuerMetadataBuilderV1_0 {
    this.deferredCredentialEndpoint = deferredCredentialEndpoint
    return this
  }

  public withNotificationEndpoint(notificationEndpoint: string): IssuerMetadataBuilderV1_0 {
    this.notificationEndpoint = notificationEndpoint
    return this
  }

  public withCredentialIssuer(credentialIssuer: string): IssuerMetadataBuilderV1_0 {
    this.credentialIssuer = credentialIssuer
    return this
  }

  public withCredentialResponseEncryption(credentialResponseEncryption: ResponseEncryption): IssuerMetadataBuilderV1_0 {
    this.credentialResponseEncryption = credentialResponseEncryption
    return this
  }

  // NOTE: signed_metadata removed in v1.0 - new signed metadata mechanism with media type application/openidvci-issuer-metadata+jwt

  public withCredentialIdentifiersSupported(credentialIdentifiersSupported: boolean): IssuerMetadataBuilderV1_0 {
    this.credentialIdentifiersSupported = credentialIdentifiersSupported
    return this
  }

  public newSupportedCredentialBuilder(): CredentialSupportedBuilderV1_0 {
    const builder = new CredentialSupportedBuilderV1_0()
    this.addSupportedCredentialBuilder(builder)
    return builder
  }

  public addSupportedCredentialBuilder(supportedCredentialBuilder: CredentialSupportedBuilderV1_0): IssuerMetadataBuilderV1_0 {
    this.supportedBuilders.push(supportedCredentialBuilder)
    return this
  }

  public addCredentialConfigurationsSupported(
    id: string,
    supportedCredential: CredentialConfigurationSupportedV1_0,
  ): IssuerMetadataBuilderV1_0 {
    this.credentialConfigurationsSupported[id] = supportedCredential
    return this
  }

  public withIssuerDisplay(issuerDisplay: MetadataDisplay[] | MetadataDisplay): IssuerMetadataBuilderV1_0 {
    const displayArray = Array.isArray(issuerDisplay) ? issuerDisplay : [issuerDisplay]
    // Validate non-empty array requirement for v1.0
    if (!validateDisplayArray(displayArray, 'issuer')) {
      throw new Error('display must be a non-empty array if provided (OID4VCI 1.0 requirement)')
    }
    this.display = displayArray
    return this
  }

  public addDisplay(display: MetadataDisplay): IssuerMetadataBuilderV1_0 {
    this.display.push(display)
    return this
  }

  public addDisplayBuilder(displayBuilder: DisplayBuilder): IssuerMetadataBuilderV1_0 {
    this.displayBuilders.push(displayBuilder)
    return this
  }

  public newDisplayBuilder(): DisplayBuilder {
    const builder = new DisplayBuilder()
    this.addDisplayBuilder(builder)
    return builder
  }

  public build(): IssuerMetadataV1_0 {
    if (!this.credentialIssuer) {
      throw Error('No credential issuer supplied')
    } else if (!this.credentialEndpoint) {
      throw Error('No credential endpoint supplied')
    }

    const credential_configurations_supported: Record<string, CredentialConfigurationSupportedV1_0> = this.credentialConfigurationsSupported
    const configurationsEntryList: Record<string, CredentialConfigurationSupportedV1_0>[] = this.supportedBuilders.map((builder) =>
      builder.build(),
    )
    configurationsEntryList.forEach((configRecord) => {
      Object.keys(configRecord).forEach((key) => {
        credential_configurations_supported[key] = configRecord[key]
      })
    })
    if (Object.keys(credential_configurations_supported).length === 0) {
      throw Error('No supported credentials supplied')
    }

    const display: MetadataDisplay[] = []
    display.push(...this.display)
    display.push(...this.displayBuilders.map((builder) => builder.build()))

    // Validate display array is non-empty if present
    if (display.length > 0 && !validateDisplayArray(display, 'issuer')) {
      throw new Error('display must be a non-empty array (OID4VCI 1.0 requirement)')
    }

    // Validate authorization_servers array is non-empty if present
    if (this.authorizationServers && !validateAuthorizationServersArray(this.authorizationServers)) {
      throw new Error('authorization_servers must be a non-empty array (OID4VCI 1.0 requirement)')
    }

    const issuerMetadata: IssuerMetadataV1_0 = {
      credential_issuer: this.credentialIssuer,
      credential_endpoint: this.credentialEndpoint,
      credential_configurations_supported,
    }

    if (this.nonceEndpoint) {
      issuerMetadata.nonce_endpoint = this.nonceEndpoint
    }
    if (this.deferredCredentialEndpoint) {
      issuerMetadata.deferred_credential_endpoint = this.deferredCredentialEndpoint
    }
    if (this.notificationEndpoint) {
      issuerMetadata.notification_endpoint = this.notificationEndpoint
    }
    if (this.batchCredentialIssuance) {
      issuerMetadata.batch_credential_issuance = this.batchCredentialIssuance
    }
    if (this.authorizationServers && this.authorizationServers.length > 0) {
      issuerMetadata.authorization_servers = this.authorizationServers
    }
    if (this.tokenEndpoint) {
      issuerMetadata.token_endpoint = this.tokenEndpoint
    }
    if (display.length > 0) {
      issuerMetadata.display = display
    }
    if (this.authorizationChallengeEndpoint) {
      issuerMetadata.authorization_challenge_endpoint = this.authorizationChallengeEndpoint
    }
    if (this.credentialRequestEncryption) {
      // NEW in v1.0
      issuerMetadata.credential_request_encryption = this.credentialRequestEncryption
    }
    if (this.credentialResponseEncryption) {
      issuerMetadata.credential_response_encryption = this.credentialResponseEncryption
    }
    // NOTE: signed_metadata removed in v1.0

    return issuerMetadata
  }
}
