import { parseJWT } from '@vess-id/oid4vc-common'
import { Dcql } from '../authorization-response'
import { decodeUriAsJson, encodeJsonAsURI, fetchByReferenceOrUseByValue } from '../helpers'
import { assertValidRequestObjectPayload, RequestObject } from '../request-object'
import { AuthorizationRequest } from './AuthorizationRequest'
import { assertValidRPRegistrationMedataPayload } from './Payload'
import {
  AuthorizationRequestPayload,
  AuthorizationRequestURI,
  ObjectBy,
  PassBy,
  RequestObjectJwt,
  RequestObjectPayload,
  RPRegistrationMetadataPayload,
  SIOPErrors,
  SupportedVersion,
  UrlEncodingFormat,
} from '../types'
import { CreateAuthorizationRequestOpts } from './types'

export class URI implements AuthorizationRequestURI {
  private readonly _scheme: string
  private readonly _requestObjectJwt: RequestObjectJwt | undefined
  private readonly _authorizationRequestPayload: AuthorizationRequestPayload
  private readonly _encodedUri: string // The encoded URI
  private readonly _encodingFormat: UrlEncodingFormat

  private _registrationMetadataPayload: RPRegistrationMetadataPayload | undefined

  private constructor({ scheme, encodedUri, encodingFormat, authorizationRequestPayload, requestObjectJwt }: Partial<AuthorizationRequestURI>) {
    this._scheme = scheme
    this._encodedUri = encodedUri
    this._encodingFormat = encodingFormat
    this._authorizationRequestPayload = authorizationRequestPayload
    this._requestObjectJwt = requestObjectJwt
  }

  public static async fromUri(uri: string): Promise<URI> {
    if (!uri) {
      throw Error(SIOPErrors.BAD_PARAMS)
    }
    const { scheme, requestObjectJwt, authorizationRequestPayload, registrationMetadata } = await URI.parseAndResolve(uri)
    const requestObjectPayload = requestObjectJwt ? (parseJWT(requestObjectJwt).payload as RequestObjectPayload) : undefined
    if (requestObjectPayload) {
      assertValidRequestObjectPayload(requestObjectPayload)
    }

    const result = new URI({
      scheme,
      encodingFormat: UrlEncodingFormat.FORM_URL_ENCODED,
      encodedUri: uri,
      authorizationRequestPayload,
      requestObjectJwt,
    })
    result._registrationMetadataPayload = registrationMetadata
    return result
  }

  /**
   * Create a signed URL encoded URI with a signed SIOP request token on RP side
   *
   * @param opts Request input data to build a  SIOP Request Token
   * @remarks This method is used to generate a SIOP request with info provided by the RP.
   * First it generates the request payload and then it creates the signed JWT, which is returned as a URI
   *
   * Normally you will want to use this method to create the request.
   */
  public static async fromOpts(opts: CreateAuthorizationRequestOpts): Promise<URI> {
    if (!opts) {
      throw Error(SIOPErrors.BAD_PARAMS)
    }
    const authorizationRequest = await AuthorizationRequest.fromOpts(opts)
    return await URI.fromAuthorizationRequest(authorizationRequest)
  }

  public async toAuthorizationRequest(): Promise<AuthorizationRequest> {
    return await AuthorizationRequest.fromUriOrJwt(this)
  }

  get requestObjectBy(): ObjectBy {
    if (!this.requestObjectJwt) {
      return { passBy: PassBy.NONE }
    }
    if (this.authorizationRequestPayload.request_uri) {
      return { passBy: PassBy.REFERENCE, reference_uri: this.authorizationRequestPayload.request_uri }
    }
    return { passBy: PassBy.VALUE }
  }

  get metadataObjectBy(): ObjectBy {
    if (!this.authorizationRequestPayload.registration_uri && !this.authorizationRequestPayload.registration) {
      return { passBy: PassBy.NONE }
    }
    if (this.authorizationRequestPayload.registration_uri) {
      return { passBy: PassBy.REFERENCE, reference_uri: this.authorizationRequestPayload.registration_uri }
    }
    return { passBy: PassBy.VALUE }
  }

  /**
   * Create a URI from the request object, typically you will want to use the createURI version!
   *
   * @remarks This method is used to generate a SIOP request Object with info provided by the RP.
   * First it generates the request object payload, and then it creates the signed JWT.
   *
   * Please note that the createURI method allows you to differentiate between OAuth2 and OpenID parameters that become
   * part of the URI and which become part of the Request Object. If you generate a URI based upon the result of this method,
   * the URI will be constructed based on the Request Object only!
   */
  static async fromRequestObject(requestObject: RequestObject): Promise<URI> {
    if (!requestObject) {
      throw Error(SIOPErrors.BAD_PARAMS)
    }
    return await URI.fromAuthorizationRequestPayload(requestObject.options, await AuthorizationRequest.fromUriOrJwt(await requestObject.toJwt()))
  }

  static async fromAuthorizationRequest(authorizationRequest: AuthorizationRequest): Promise<URI> {
    if (!authorizationRequest) {
      throw Error(SIOPErrors.BAD_PARAMS)
    }
    return await URI.fromAuthorizationRequestPayload(
      {
        ...authorizationRequest.options.requestObject,
        version: authorizationRequest.options.version,
        uriScheme: authorizationRequest.options.uriScheme,
      },
      authorizationRequest.payload,
      authorizationRequest.requestObject,
    )
  }

  /**
   * Creates an URI Request
   * @param opts Options to define the Uri Request
   * @param authorizationRequestPayload
   * @param requestObject
   */
  private static async fromAuthorizationRequestPayload(
    opts: { uriScheme?: string; passBy: PassBy; reference_uri?: string; version?: SupportedVersion },
    authorizationRequestPayload: AuthorizationRequestPayload,
    requestObject?: RequestObject,
  ): Promise<URI> {
    if (!authorizationRequestPayload) {
      if (!requestObject || !requestObject.getPayload()) {
        throw Error(SIOPErrors.BAD_PARAMS)
      }
      authorizationRequestPayload = {} // No auth request payload, so the eventual URI will contain a `request_uri` or `request` value only
    }

    const isJwt = typeof authorizationRequestPayload === 'string'
    // OID4VP 1.0: For PassBy.NONE (redirect_uri scheme), skip JWT generation
    const requestObjectJwt =
      opts.passBy === PassBy.NONE
        ? undefined
        : requestObject
          ? await requestObject.toJwt()
          : typeof authorizationRequestPayload === 'string'
            ? authorizationRequestPayload
            : authorizationRequestPayload.request

    if (isJwt && (!requestObjectJwt || !requestObjectJwt.startsWith('ey'))) {
      throw Error(SIOPErrors.NO_JWT)
    }
    // OID4VP 1.0: For PassBy.NONE, use request object payload directly without JWT
    const requestObjectPayload: RequestObjectPayload =
      opts.passBy === PassBy.NONE && requestObject
        ? await requestObject.getPayload()
        : requestObjectJwt
          ? (parseJWT(requestObjectJwt).payload as RequestObjectPayload)
          : undefined

    if (requestObjectPayload) {
      // Only used to validate if the request object contains presentation definition(s) | a dcql query
      await Dcql.findValidDcqlQuery({ ...authorizationRequestPayload, ...requestObjectPayload }, opts.version)

      assertValidRequestObjectPayload(requestObjectPayload)
      if (requestObjectPayload.registration) {
        assertValidRPRegistrationMedataPayload(requestObjectPayload.registration)
      }
    }
    const uniformAuthorizationRequestPayload: AuthorizationRequestPayload =
      typeof authorizationRequestPayload === 'string' ? (requestObjectPayload as AuthorizationRequestPayload) : authorizationRequestPayload
    if (!uniformAuthorizationRequestPayload) {
      throw Error(SIOPErrors.BAD_PARAMS)
    }
    const type = opts.passBy
    if (!type) {
      throw new Error(SIOPErrors.REQUEST_OBJECT_TYPE_NOT_SET)
    }

    let scheme
    if (opts.uriScheme) {
      scheme = opts.uriScheme.endsWith('://') ? opts.uriScheme : `${opts.uriScheme}://`
    } else {
      scheme = 'openid4vp://'
    }

    if (type === PassBy.REFERENCE) {
      if (!opts.reference_uri) {
        throw new Error(SIOPErrors.NO_REFERENCE_URI)
      }
      // OID4VP 1.0: When using Request by Reference, only request_uri and client_id should be in the URI
      // All other parameters (including dcql_query) should be in the Request Object JWT
      const client_id = requestObjectPayload.client_id
      Object.keys(uniformAuthorizationRequestPayload).forEach(key => {
        delete uniformAuthorizationRequestPayload[key]
      })
      uniformAuthorizationRequestPayload.request_uri = opts.reference_uri
      uniformAuthorizationRequestPayload.client_id = client_id
    } else if (type === PassBy.VALUE) {
      uniformAuthorizationRequestPayload.request = requestObjectJwt
      delete uniformAuthorizationRequestPayload.request_uri
    } else if (type === PassBy.NONE) {
      // OID4VP 1.0: For redirect_uri scheme, send all parameters as plain query parameters (no JWT)
      // Debug: Log before merge
      console.log('[URI.fromOpts] PassBy.NONE BEFORE merge:')
      console.log('  - uniformAuthorizationRequestPayload keys:', Object.keys(uniformAuthorizationRequestPayload))
      console.log('  - requestObjectPayload keys:', requestObjectPayload ? Object.keys(requestObjectPayload) : 'undefined')
      console.log('  - requestObjectPayload:', requestObjectPayload)

      // Merge request object payload into authorization request payload
      if (requestObjectPayload) {
        Object.assign(uniformAuthorizationRequestPayload, requestObjectPayload)
      }

      console.log('[URI.fromOpts] PassBy.NONE AFTER merge:')
      console.log('  - uniformAuthorizationRequestPayload keys:', Object.keys(uniformAuthorizationRequestPayload))

      // OID4VP 1.0: Set client_id for redirect_uri scheme
      // For redirect_uri scheme, client_id must be the response_uri with "redirect_uri:" prefix
      const responseUri = uniformAuthorizationRequestPayload.response_uri || uniformAuthorizationRequestPayload.redirect_uri
      if (responseUri) {
        uniformAuthorizationRequestPayload.client_id = `redirect_uri:${responseUri}`
        uniformAuthorizationRequestPayload.client_id_scheme = 'redirect_uri'
      }

      // Ensure no request or request_uri parameters
      delete uniformAuthorizationRequestPayload.request
      delete uniformAuthorizationRequestPayload.request_uri
      // Remove JWT-specific fields that shouldn't be in query parameters
      delete uniformAuthorizationRequestPayload.iss
      delete uniformAuthorizationRequestPayload.sub
      delete uniformAuthorizationRequestPayload.aud
      delete uniformAuthorizationRequestPayload.iat
      delete uniformAuthorizationRequestPayload.exp
      delete uniformAuthorizationRequestPayload.nbf
      delete uniformAuthorizationRequestPayload.jti

      // Debug: Log final payload for PassBy.NONE
      console.log('[URI.fromOpts] PassBy.NONE final payload keys:', Object.keys(uniformAuthorizationRequestPayload))
      console.log('[URI.fromOpts] PassBy.NONE payload:', JSON.stringify(uniformAuthorizationRequestPayload, null, 2))
    }
    return new URI({
      scheme,
      encodedUri: `${scheme}?${encodeJsonAsURI(uniformAuthorizationRequestPayload)}`,
      encodingFormat: UrlEncodingFormat.FORM_URL_ENCODED,
      authorizationRequestPayload: uniformAuthorizationRequestPayload,
      requestObjectJwt: requestObjectJwt,
    })
  }

  /**
   * Create a Authentication Request Payload from a URI string
   *
   * @param uri
   */
  public static parse(uri: string): { scheme: string; authorizationRequestPayload: AuthorizationRequestPayload } {
    if (!uri) {
      throw Error(SIOPErrors.BAD_PARAMS)
    }
    // We strip the uri scheme before passing it to the decode function
    const scheme: string = uri.match(/^([a-zA-Z][a-zA-Z0-9-_]*:\/\/)/g)[0]
    const authorizationRequestPayload = decodeUriAsJson(uri) as AuthorizationRequestPayload
    return { scheme, authorizationRequestPayload }
  }

  public static async parseAndResolve(uri: string, rpRegistrationMetadata?: RPRegistrationMetadataPayload) {
    if (!uri) {
      throw Error(SIOPErrors.BAD_PARAMS)
    }
    const { authorizationRequestPayload, scheme } = this.parse(uri)

    const requestObjectJwt = await fetchByReferenceOrUseByValue(authorizationRequestPayload.request_uri, authorizationRequestPayload.request, true)
    let registrationMetadata: RPRegistrationMetadataPayload
    if (rpRegistrationMetadata !== undefined && rpRegistrationMetadata !== null) {
      registrationMetadata = rpRegistrationMetadata
    } else {
      registrationMetadata = await fetchByReferenceOrUseByValue(
        authorizationRequestPayload['registration_uri'],
        authorizationRequestPayload['client_metadata'] ?? authorizationRequestPayload['registration'],
      )
    }
    assertValidRPRegistrationMedataPayload(registrationMetadata)
    return { scheme, authorizationRequestPayload, requestObjectJwt, registrationMetadata }
  }

  get encodingFormat(): UrlEncodingFormat {
    return this._encodingFormat
  }

  get encodedUri(): string {
    return this._encodedUri
  }

  get authorizationRequestPayload(): AuthorizationRequestPayload {
    return this._authorizationRequestPayload
  }

  get requestObjectJwt(): RequestObjectJwt | undefined {
    return this._requestObjectJwt
  }

  get scheme(): string {
    return this._scheme
  }

  get registrationMetadataPayload(): RPRegistrationMetadataPayload {
    return this._registrationMetadataPayload
  }
}
