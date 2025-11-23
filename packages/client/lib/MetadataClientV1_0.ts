import {
  AuthorizationServerMetadata,
  AuthorizationServerType,
  CredentialIssuerMetadataV1_0,
  CredentialOfferPayloadV1_0,
  CredentialOfferRequestWithBaseUrl,
  EndpointMetadataResultV1_0,
  getIssuerFromCredentialOfferPayload,
  IssuerMetadataV1_0,
  OpenIDResponse,
  validateAuthorizationServersArray,
  validateDisplayArray,
  WellKnownEndpoints,
} from '@sphereon/oid4vci-common'
import { Loggers } from '@sphereon/ssi-types'

import { retrieveWellknown } from './functions'

const logger = Loggers.DEFAULT.get('sphereon:oid4vci:metadata')

/**
 * Metadata Client for OID4VCI 1.0 (Draft 16)
 *
 * Key changes from v1.0.15:
 * - credential_request_encryption support
 * - Signed metadata with new format (application/openidvci-issuer-metadata+jwt)
 * - Stricter validation for non-empty arrays
 */
export class MetadataClientV1_0 {
  /**
   * Retrieve metadata using the Credential Offer obtained from a previous step
   *
   * @param credentialOffer
   */
  public static async retrieveAllMetadataFromCredentialOffer(
    credentialOffer: CredentialOfferRequestWithBaseUrl,
  ): Promise<EndpointMetadataResultV1_0> {
    return MetadataClientV1_0.retrieveAllMetadataFromCredentialOfferRequest(credentialOffer.credential_offer as CredentialOfferPayloadV1_0)
  }

  /**
   * Retrieve the metadata using the credential offer request obtained from a previous step
   * @param request
   */
  public static async retrieveAllMetadataFromCredentialOfferRequest(request: CredentialOfferPayloadV1_0): Promise<EndpointMetadataResultV1_0> {
    const issuer = getIssuerFromCredentialOfferPayload(request)
    if (issuer) {
      return MetadataClientV1_0.retrieveAllMetadata(issuer)
    }
    throw new Error("can't retrieve metadata from CredentialOfferRequest. No issuer field is present")
  }

  /**
   * Retrieve all metadata from an issuer
   * @param issuer The issuer URL
   * @param opts
   */
  public static async retrieveAllMetadata(
    issuer: string,
    opts?: {
      errorOnNotFound: boolean
    },
  ): Promise<EndpointMetadataResultV1_0> {
    let token_endpoint: string | undefined
    let credential_endpoint: string | undefined
    let nonce_endpoint: string | undefined
    let deferred_credential_endpoint: string | undefined
    let notification_endpoint: string | undefined
    let authorization_endpoint: string | undefined
    let authorization_challenge_endpoint: string | undefined
    let authorizationServerType: AuthorizationServerType = 'OID4VCI'
    let authorization_servers: string[] = [issuer]

    const oid4vciResponse = await MetadataClientV1_0.retrieveOpenID4VCIServerMetadata(issuer, { errorOnNotFound: false })
    let credentialIssuerMetadata = oid4vciResponse?.successBody
    if (credentialIssuerMetadata) {
      logger.debug(`Issuer ${issuer} OID4VCI well-known server metadata\r\n${JSON.stringify(credentialIssuerMetadata)}`)
      credential_endpoint = credentialIssuerMetadata.credential_endpoint
      nonce_endpoint = credentialIssuerMetadata.nonce_endpoint
      deferred_credential_endpoint = credentialIssuerMetadata.deferred_credential_endpoint
      notification_endpoint = credentialIssuerMetadata.notification_endpoint // NEW in v1.0

      if (credentialIssuerMetadata.token_endpoint) {
        token_endpoint = credentialIssuerMetadata.token_endpoint
      }
      authorization_challenge_endpoint = credentialIssuerMetadata.authorization_challenge_endpoint

      // Validate authorization_servers array is non-empty if present (OID4VCI 1.0 requirement)
      if (credentialIssuerMetadata.authorization_servers) {
        if (!validateAuthorizationServersArray(credentialIssuerMetadata.authorization_servers)) {
          logger.warning('authorization_servers must be a non-empty array (OID4VCI 1.0 requirement)')
        } else {
          authorization_servers = credentialIssuerMetadata.authorization_servers
        }
      }

      // Validate display array is non-empty if present (OID4VCI 1.0 requirement)
      if (credentialIssuerMetadata.display && !validateDisplayArray(credentialIssuerMetadata.display, 'issuer')) {
        logger.warning('display must be a non-empty array if provided (OID4VCI 1.0 requirement)')
      }

      // Log credential_request_encryption if present (NEW in v1.0)
      if (credentialIssuerMetadata.credential_request_encryption) {
        logger.debug(`Issuer ${issuer} supports credential request encryption: ${JSON.stringify(credentialIssuerMetadata.credential_request_encryption)}`)
      }

      // Log credential_response_encryption if present
      if (credentialIssuerMetadata.credential_response_encryption) {
        logger.debug(`Issuer ${issuer} supports credential response encryption: ${JSON.stringify(credentialIssuerMetadata.credential_response_encryption)}`)
      }
    }

    // Try to retrieve Authorization Server metadata
    // TODO: for now we're taking just the first authorization server
    let response: OpenIDResponse<AuthorizationServerMetadata> = await retrieveWellknown(
      authorization_servers[0],
      WellKnownEndpoints.OPENID_CONFIGURATION,
      { errorOnNotFound: false },
    )
    let authMetadata = response.successBody
    if (authMetadata) {
      logger.debug(`Issuer ${issuer} has OpenID Connect Server metadata in well-known location`)
      authorizationServerType = 'OIDC'
    } else {
      // Try OAuth2 AS metadata
      response = await retrieveWellknown(authorization_servers[0], WellKnownEndpoints.OAUTH_AS, { errorOnNotFound: false })
      authMetadata = response.successBody
    }

    if (!authMetadata) {
      // We will always throw an error if there's a separate authorization server but no metadata
      if (!authorization_servers.includes(issuer)) {
        throw Error(`Issuer ${issuer} provided a separate authorization server ${authorization_servers}, but that server did not provide metadata`)
      }
    } else {
      logger.debug(`Issuer ${issuer} has ${authorizationServerType} Server metadata in well-known location`)

      if (!authMetadata.authorization_endpoint) {
        console.warn(
          `Issuer ${issuer} of type ${authorizationServerType} has no authorization_endpoint! Will use ${authorization_endpoint}. This only works for pre-authorized flows`,
        )
      } else if (authorization_endpoint && authMetadata.authorization_endpoint !== authorization_endpoint) {
        throw Error(
          `Credential issuer has a different authorization_endpoint (${authorization_endpoint}) from the Authorization Server (${authMetadata.authorization_endpoint})`,
        )
      }
      authorization_endpoint = authMetadata.authorization_endpoint

      if (authorization_challenge_endpoint && authMetadata.authorization_challenge_endpoint !== authorization_challenge_endpoint) {
        throw Error(
          `Credential issuer has a different authorization_challenge_endpoint (${authorization_challenge_endpoint}) from the Authorization Server (${authMetadata.authorization_challenge_endpoint})`,
        )
      }
      authorization_challenge_endpoint = authMetadata.authorization_challenge_endpoint

      if (!authMetadata.token_endpoint) {
        throw Error(`Authorization Server ${authorization_servers} did not provide a token_endpoint`)
      } else if (token_endpoint && authMetadata.token_endpoint !== token_endpoint) {
        throw Error(
          `Credential issuer has a different token_endpoint (${token_endpoint}) from the Authorization Server (${authMetadata.token_endpoint})`,
        )
      }
      token_endpoint = authMetadata.token_endpoint

      if (authMetadata.credential_endpoint) {
        if (credential_endpoint && authMetadata.credential_endpoint !== credential_endpoint) {
          logger.debug(
            `Credential issuer has a different credential_endpoint (${credential_endpoint}) from the Authorization Server (${authMetadata.credential_endpoint}). Will use the issuer value`,
          )
        } else {
          credential_endpoint = authMetadata.credential_endpoint
        }
      }

      if (authMetadata.deferred_credential_endpoint) {
        if (deferred_credential_endpoint && authMetadata.deferred_credential_endpoint !== deferred_credential_endpoint) {
          logger.debug(
            `Credential issuer has a different deferred_credential_endpoint (${deferred_credential_endpoint}) from the Authorization Server (${authMetadata.deferred_credential_endpoint}). Will use the issuer value`,
          )
        } else {
          deferred_credential_endpoint = authMetadata.deferred_credential_endpoint
        }
      }
    }

    if (!authorization_endpoint) {
      logger.debug(`Issuer ${issuer} does not expose authorization_endpoint, so only pre-auth will be supported`)
    }
    if (!token_endpoint) {
      logger.debug(`Issuer ${issuer} does not have a token_endpoint listed in well-known locations!`)
      if (opts?.errorOnNotFound) {
        throw Error(`Could not deduce the token_endpoint for ${issuer}`)
      } else {
        token_endpoint = `${issuer}${issuer.endsWith('/') ? 'token' : '/token'}`
      }
    }
    if (!credential_endpoint) {
      logger.debug(`Issuer ${issuer} does not have a credential_endpoint listed in well-known locations!`)
      if (opts?.errorOnNotFound) {
        throw Error(`Could not deduce the credential endpoint for ${issuer}`)
      } else {
        credential_endpoint = `${issuer}${issuer.endsWith('/') ? 'credential' : '/credential'}`
      }
    }

    if (!credentialIssuerMetadata && authMetadata) {
      // Issuer is exposing everything in OAuth2/OIDC well-knowns
      credentialIssuerMetadata = authMetadata as CredentialIssuerMetadataV1_0
    }

    // Construct v1.0 credential issuer metadata
    const ci = (credentialIssuerMetadata ?? {}) as Partial<CredentialIssuerMetadataV1_0>
    const ciAuthorizationServers =
      Array.isArray(ci.authorization_servers) && ci.authorization_servers.length > 0 ? ci.authorization_servers : authorization_servers

    const v1_0CredentialIssuerMetadata: CredentialIssuerMetadataV1_0 = {
      credential_issuer: ci.credential_issuer ?? issuer,
      credential_endpoint: credential_endpoint as string,
      authorization_servers: ciAuthorizationServers,
      credential_configurations_supported: ci.credential_configurations_supported ?? {},
      display: ci.display ?? [],
      ...(nonce_endpoint && { nonce_endpoint }),
      ...(deferred_credential_endpoint && { deferred_credential_endpoint }),
      ...(notification_endpoint && { notification_endpoint }), // NEW in v1.0
      ...(ci.credential_request_encryption && { credential_request_encryption: ci.credential_request_encryption }), // NEW in v1.0
      ...(ci.credential_response_encryption && { credential_response_encryption: ci.credential_response_encryption }),
      ...(ci.batch_credential_issuance && { batch_credential_issuance: ci.batch_credential_issuance }),
      ...(ci.credential_identifiers_supported !== undefined && { credential_identifiers_supported: ci.credential_identifiers_supported }),
    }

    logger.debug(`Issuer ${issuer} token endpoint ${token_endpoint}, credential endpoint ${credential_endpoint}`)

    // Return v1.0 result structure
    return {
      issuer,
      token_endpoint,
      credential_endpoint,
      authorization_challenge_endpoint,
      authorizationServerType,
      credentialIssuerMetadataFieldNamesV1_0: v1_0CredentialIssuerMetadata,
      authorizationServerMetadata: authMetadata,
    }
  }

  /**
   * Retrieve only the OID4VCI metadata for the issuer. So no OIDC/OAuth2 metadata
   *
   * @param issuerHost The issuer hostname
   * @param opts
   */
  public static async retrieveOpenID4VCIServerMetadata(
    issuerHost: string,
    opts?: {
      errorOnNotFound?: boolean
    },
  ): Promise<OpenIDResponse<IssuerMetadataV1_0> | undefined> {
    return retrieveWellknown(issuerHost, WellKnownEndpoints.OPENID4VCI_ISSUER, {
      errorOnNotFound: opts?.errorOnNotFound === undefined ? true : opts.errorOnNotFound,
    })
  }
}
