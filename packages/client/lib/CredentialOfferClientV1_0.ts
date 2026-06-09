import {
  convertJsonToURI,
  convertURIToJsonObject,
  CredentialOffer,
  CredentialOfferRequestWithBaseUrl,
  CredentialOfferV1_0,
  determineSpecVersionFromURI,
  JsonURIMode,
  OpenId4VCIVersion,
  PRE_AUTH_GRANT_LITERAL,
  toUniformCredentialOfferRequest,
} from '@vess-id/oid4vci-common'
import { Loggers } from '@sphereon/ssi-types'

import { constructBaseResponse, handleCredentialOfferUri } from './functions'

const logger = Loggers.DEFAULT.get('sphereon:oid4vci:offer')

/**
 * Credential Offer Client for OID4VCI 1.0 (Draft 16)
 *
 * Key changes from v1.0.15:
 * - Same structure as v1.0.15 but uses CredentialOfferV1_0 types
 * - tx_code parameter for user PIN requirement (replacing user_pin_required)
 */
export class CredentialOfferClientV1_0 {
  public static async fromURI(uri: string, opts?: { resolve?: boolean }): Promise<CredentialOfferRequestWithBaseUrl> {
    logger.debug(`Credential Offer URI: ${uri}`)
    if (!uri.includes('?') || !uri.includes('://')) {
      logger.debug(`Invalid Credential Offer URI: ${uri}`)
      return Promise.reject(Error(`Invalid Credential Offer Request`))
    }
    const scheme = uri.split('://')[0]
    const baseUrl = uri.split('?')[0]
    const version = determineSpecVersionFromURI(uri)
    let credentialOffer: CredentialOffer

    if (uri.includes('credential_offer_uri')) {
      credentialOffer = (await handleCredentialOfferUri(uri)) as CredentialOfferV1_0
    } else {
      credentialOffer = convertURIToJsonObject(uri, {
        // It must have the '=' sign after credential_offer otherwise the uri will get split at openid_credential_offer
        arrayTypeProperties: uri.includes('credential_offer_uri=')
          ? ['credential_configuration_ids', 'credential_offer_uri=']
          : ['credential_configuration_ids', 'credential_offer='],
        requiredProperties: uri.includes('credential_offer_uri=') ? ['credential_offer_uri='] : ['credential_offer='],
      }) as CredentialOfferV1_0
    }

    if (credentialOffer?.credential_offer_uri === undefined && !credentialOffer?.credential_offer) {
      return Promise.reject(Error('Either a credential_offer or credential_offer_uri should be present in ' + uri))
    }

    const request = await toUniformCredentialOfferRequest(credentialOffer, {
      ...opts,
      version,
    })

    return {
      ...constructBaseResponse(request, scheme, baseUrl),
      userPinRequired: !!(request.credential_offer?.grants?.[PRE_AUTH_GRANT_LITERAL]?.tx_code ?? false),
    }
  }

  public static toURI(
    requestWithBaseUrl: CredentialOfferRequestWithBaseUrl,
    opts?: {
      version?: OpenId4VCIVersion
    },
  ): string {
    logger.debug(`Credential Offer Request with base URL: ${JSON.stringify(requestWithBaseUrl)}`)
    const version = opts?.version ?? requestWithBaseUrl.version
    let baseUrl = requestWithBaseUrl.baseUrl.includes(requestWithBaseUrl.scheme)
      ? requestWithBaseUrl.baseUrl
      : `${requestWithBaseUrl.scheme.replace('://', '')}://${requestWithBaseUrl.baseUrl}`

    const isUri = requestWithBaseUrl.credential_offer_uri !== undefined

    if (isUri) {
      return convertJsonToURI(
        { credential_offer_uri: requestWithBaseUrl.credential_offer_uri },
        {
          baseUrl,
          uriTypeProperties: ['credential_offer_uri'],
          param: 'credential_offer_uri',
          version,
        },
      )
    } else {
      return convertJsonToURI(requestWithBaseUrl.original_credential_offer, {
        baseUrl,
        param: 'credential_offer',
        mode: JsonURIMode.JSON_STRINGIFY,
        version,
      })
    }
  }
}
