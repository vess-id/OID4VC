import { JWK } from '@sphereon/oid4vc-common'
import {
  AccessTokenResponse,
  Alg,
  AuthorizationChallengeCodeResponse,
  AuthorizationRequestOpts,
  AuthorizationResponse,
  CodeChallengeMethod,
  CredentialOfferRequestWithBaseUrl,
  DPoPResponseParams,
  EndpointMetadataResultV1_0,
  getClientIdFromCredentialOfferPayload,
  getIssuerFromCredentialOfferPayload,
  PKCEOpts,
} from '@vess-id/oid4vci-common'
import { Loggers } from '@sphereon/ssi-types'

import { CredentialOfferClientV1_0 } from './CredentialOfferClientV1_0'
import { MetadataClientV1_0 } from './MetadataClientV1_0'

const logger = Loggers.DEFAULT.get('sphereon:oid4vci:v1.0')

/**
 * OpenID4VCI Client State for OID4VCI 1.0 (Draft 16)
 *
 * Key changes from v1.0.15:
 * - Uses EndpointMetadataResultV1_0
 * - Uses CredentialResponseV1_0
 * - Uses CredentialOfferPayloadV1_0
 */
export interface OpenID4VCIClientStateV1_0 {
  credentialIssuer: string
  credentialOffer?: CredentialOfferRequestWithBaseUrl
  clientId?: string
  kid?: string
  jwk?: JWK
  alg?: Alg | string
  endpointMetadata?: EndpointMetadataResultV1_0
  accessTokenResponse?: AccessTokenResponse
  dpopResponseParams?: DPoPResponseParams
  authorizationRequestOpts?: AuthorizationRequestOpts
  authorizationCodeResponse?: AuthorizationResponse | AuthorizationChallengeCodeResponse
  pkce: PKCEOpts
  accessToken?: string
  authorizationURL?: string
  cachedCNonce?: string
  keyAttestation?: string // JWT format key attestation
}

/**
 * OpenID4VCI Client for OID4VCI 1.0 (Draft 16)
 *
 * Key changes from v1.0.15:
 * - proof parameter replaced with proofs parameter (plural)
 * - format parameter removed from credential requests
 * - credential_response_encryption support
 * - notification_endpoint support
 */
export class OpenID4VCIClientV1_0 {
  private readonly _state: OpenID4VCIClientStateV1_0

  private constructor({
    credentialOffer,
    clientId,
    kid,
    alg,
    credentialIssuer,
    pkce,
    authorizationRequest,
    jwk,
    endpointMetadata,
    accessTokenResponse,
    authorizationRequestOpts,
    authorizationCodeResponse,
    authorizationURL,
    keyAttestation,
  }: {
    credentialOffer?: CredentialOfferRequestWithBaseUrl
    kid?: string
    alg?: Alg | string
    clientId?: string
    credentialIssuer?: string
    pkce?: PKCEOpts
    authorizationRequest?: AuthorizationRequestOpts
    jwk?: JWK
    endpointMetadata?: EndpointMetadataResultV1_0
    accessTokenResponse?: AccessTokenResponse
    authorizationRequestOpts?: AuthorizationRequestOpts
    authorizationCodeResponse?: AuthorizationResponse | AuthorizationChallengeCodeResponse
    authorizationURL?: string
    keyAttestation?: string
  }) {
    const issuer = credentialIssuer ?? (credentialOffer ? getIssuerFromCredentialOfferPayload(credentialOffer.credential_offer) : undefined)
    if (!issuer) {
      throw Error('No credential issuer supplied or deduced from offer')
    }
    this._state = {
      credentialOffer,
      credentialIssuer: issuer,
      kid,
      alg,
      clientId: clientId ?? (credentialOffer && getClientIdFromCredentialOfferPayload(credentialOffer.credential_offer)) ?? kid?.split('#')[0],
      pkce: { disabled: false, codeChallengeMethod: CodeChallengeMethod.S256, ...pkce },
      authorizationRequestOpts,
      authorizationCodeResponse,
      jwk,
      endpointMetadata,
      accessTokenResponse,
      authorizationURL,
      keyAttestation,
    }

    if (!this._state.authorizationRequestOpts) {
      this._state.authorizationRequestOpts = this.syncAuthorizationRequestOpts(authorizationRequest)
    }
    logger.debug(`Authorization req options: ${JSON.stringify(this._state.authorizationRequestOpts, null, 2)}`)
  }

  public static async fromCredentialIssuer({
    kid,
    alg,
    retrieveServerMetadata,
    clientId,
    credentialIssuer,
    pkce,
    authorizationRequest,
    createAuthorizationRequestURL,
    keyAttestation,
  }: {
    credentialIssuer: string
    kid?: string
    alg?: Alg | string
    retrieveServerMetadata?: boolean
    clientId?: string
    createAuthorizationRequestURL?: boolean
    authorizationRequest?: AuthorizationRequestOpts
    pkce?: PKCEOpts
    keyAttestation?: string
  }) {
    const client = new OpenID4VCIClientV1_0({
      kid,
      alg,
      credentialIssuer,
      clientId,
      pkce,
      authorizationRequest,
      keyAttestation,
    })
    if (retrieveServerMetadata) {
      await client.retrieveServerMetadata()
    }
    if (createAuthorizationRequestURL) {
      await client.createAuthorizationRequestUrl()
    }
    return client
  }

  public static async fromURI({
    uri,
    kid,
    alg,
    clientId,
    retrieveServerMetadata,
    createAuthorizationRequestURL,
    authorizationRequest,
    pkce,
    keyAttestation,
  }: {
    uri: string
    kid?: string
    alg?: Alg | string
    clientId?: string
    retrieveServerMetadata?: boolean
    createAuthorizationRequestURL?: boolean
    authorizationRequest?: AuthorizationRequestOpts
    pkce?: PKCEOpts
    keyAttestation?: string
  }): Promise<OpenID4VCIClientV1_0> {
    const credentialOffer = await CredentialOfferClientV1_0.fromURI(uri)
    return await OpenID4VCIClientV1_0.fromCredentialOffer({
      credentialOffer,
      kid,
      alg,
      clientId,
      retrieveServerMetadata,
      createAuthorizationRequestURL,
      authorizationRequest,
      pkce,
      keyAttestation,
    })
  }

  public static async fromCredentialOffer({
    credentialOffer,
    kid,
    alg,
    clientId,
    retrieveServerMetadata,
    createAuthorizationRequestURL,
    authorizationRequest,
    pkce,
    keyAttestation,
  }: {
    credentialOffer: CredentialOfferRequestWithBaseUrl
    kid?: string
    alg?: Alg | string
    clientId?: string
    retrieveServerMetadata?: boolean
    createAuthorizationRequestURL?: boolean
    authorizationRequest?: AuthorizationRequestOpts
    pkce?: PKCEOpts
    keyAttestation?: string
  }): Promise<OpenID4VCIClientV1_0> {
    const client = new OpenID4VCIClientV1_0({
      credentialOffer,
      kid,
      alg,
      clientId,
      pkce,
      authorizationRequest,
      keyAttestation,
    })
    if (retrieveServerMetadata) {
      await client.retrieveServerMetadata()
    }
    if (createAuthorizationRequestURL) {
      await client.createAuthorizationRequestUrl()
    }
    return client
  }

  // Placeholder methods - full implementation would mirror v1.0.15 with v1.0 types
  private syncAuthorizationRequestOpts(opts?: AuthorizationRequestOpts): AuthorizationRequestOpts | undefined {
    // Implementation similar to v1.0.15
    return opts
  }

  public async retrieveServerMetadata(): Promise<EndpointMetadataResultV1_0> {
    logger.debug(`Retrieving server metadata for ${this._state.credentialIssuer}`)
    const metadata = await MetadataClientV1_0.retrieveAllMetadata(this._state.credentialIssuer)
    this._state.endpointMetadata = metadata
    return metadata
  }

  public async createAuthorizationRequestUrl(opts?: {
    authorizationRequest?: AuthorizationRequestOpts
    pkce?: PKCEOpts
    endpointMetadata?: EndpointMetadataResultV1_0
  }): Promise<string> {
    // Implementation similar to v1.0.15
    throw new Error('Not yet implemented')
  }

  public get credentialOffer(): CredentialOfferRequestWithBaseUrl | undefined {
    return this._state.credentialOffer
  }

  public get endpointMetadata(): EndpointMetadataResultV1_0 | undefined {
    return this._state.endpointMetadata
  }

  public get accessTokenResponse(): AccessTokenResponse | undefined {
    return this._state.accessTokenResponse
  }

  public get credentialIssuer(): string {
    return this._state.credentialIssuer
  }

  // Additional methods would be implemented here following v1.0.15 pattern
}
