/**
 * mdoc Session Transcript utilities for OID4VP 1.0
 *
 * Based on ISO 18013-5 Section 9.1.5.1
 * Supports redirect-based OID4VP flow and Digital Credentials API flow
 *
 * Session Transcript structure:
 * SessionTranscript = [
 *   DeviceEngagementBytes,  // null for OID4VP
 *   EReaderKeyBytes,        // null for OID4VP
 *   Handover                // OpenID4VPHandover or OpenID4VPDCAPIHandover
 * ]
 */

import {
  SessionTranscriptV1_0,
  OpenID4VPHandoverV1_0,
  OpenID4VPDCAPIHandoverV1_0,
  OpenID4VPDCAPIHandoverInfoV1_0,
} from '../types/V1_0.types'

/**
 * Handover type identifiers
 */
export const HANDOVER_TYPE_REDIRECT = 'OpenID4VPHandover'
export const HANDOVER_TYPE_DCAPI = 'OpenID4VPDCAPIHandover'

/**
 * Creates an OpenID4VPHandover for redirect-based OID4VP flow
 *
 * @param nonce - The nonce from the authorization request
 * @param verifierPublicKey - JWK thumbprint as bytes (SHA-256 hash of JWK)
 * @returns OpenID4VPHandover structure
 */
export function createOpenID4VPHandover(nonce: string, verifierPublicKey: Uint8Array): OpenID4VPHandoverV1_0 {
  return {
    handoverType: HANDOVER_TYPE_REDIRECT,
    nonce,
    verifierPublicKey,
  }
}

/**
 * Creates OpenID4VPDCAPIHandoverInfo for Digital Credentials API flow
 *
 * @param origin - Origin without "origin:" prefix
 * @param nonce - Nonce value
 * @param jwkThumbprint - JWK thumbprint (null if Response Mode is dc_api, not dc_api.jwt)
 * @returns OpenID4VPDCAPIHandoverInfo structure
 */
export function createOpenID4VPDCAPIHandoverInfo(
  origin: string,
  nonce: string,
  jwkThumbprint: Uint8Array | null
): OpenID4VPDCAPIHandoverInfoV1_0 {
  return {
    origin,
    nonce,
    jwkThumbprint,
  }
}

/**
 * Creates an OpenID4VPDCAPIHandover for Digital Credentials API flow
 *
 * @param handoverInfoHash - SHA-256 hash of OpenID4VPDCAPIHandoverInfo
 * @returns OpenID4VPDCAPIHandover structure
 */
export function createOpenID4VPDCAPIHandover(handoverInfoHash: Uint8Array): OpenID4VPDCAPIHandoverV1_0 {
  return {
    handoverType: HANDOVER_TYPE_DCAPI,
    handoverInfoHash,
  }
}

/**
 * Creates a SessionTranscript for redirect-based OID4VP flow
 *
 * @param nonce - The nonce from the authorization request
 * @param verifierPublicKey - JWK thumbprint as bytes
 * @returns SessionTranscript structure
 */
export function createSessionTranscriptForRedirect(nonce: string, verifierPublicKey: Uint8Array): SessionTranscriptV1_0 {
  return {
    DeviceEngagementBytes: null,
    EReaderKeyBytes: null,
    Handover: createOpenID4VPHandover(nonce, verifierPublicKey),
  }
}

/**
 * Creates a SessionTranscript for Digital Credentials API flow
 *
 * @param origin - Origin without "origin:" prefix
 * @param nonce - Nonce value
 * @param jwkThumbprint - JWK thumbprint (null if Response Mode is dc_api)
 * @param hashFunction - Hash function to use (defaults to SHA-256)
 * @returns SessionTranscript structure
 */
export async function createSessionTranscriptForDCAPI(
  origin: string,
  nonce: string,
  jwkThumbprint: Uint8Array | null,
  hashFunction: (data: Uint8Array) => Promise<Uint8Array> = sha256Hash
): Promise<SessionTranscriptV1_0> {
  // Create HandoverInfo
  const handoverInfo = createOpenID4VPDCAPIHandoverInfo(origin, nonce, jwkThumbprint)

  // Encode HandoverInfo to CBOR
  const handoverInfoCbor = encodeHandoverInfo(handoverInfo)

  // Hash the CBOR-encoded HandoverInfo
  const handoverInfoHash = await hashFunction(handoverInfoCbor)

  // Create Handover
  const handover = createOpenID4VPDCAPIHandover(handoverInfoHash)

  return {
    DeviceEngagementBytes: null,
    EReaderKeyBytes: null,
    Handover: handover,
  }
}

/**
 * Encodes a SessionTranscript to CBOR bytes
 *
 * NOTE: This is a placeholder implementation.
 * For production use, this should use a proper CBOR library like cbor-x or @vess-id/mdl
 *
 * @param sessionTranscript - The SessionTranscript to encode
 * @returns CBOR-encoded bytes
 */
export function encodeSessionTranscript(sessionTranscript: SessionTranscriptV1_0): Uint8Array {
  // TODO: Implement using cbor-x or @vess-id/mdl
  // This is a placeholder that will throw an error until properly implemented
  throw new Error(
    'SessionTranscript CBOR encoding not yet implemented. ' +
      'Please add cbor-x or @vess-id/mdl dependency and implement this function.'
  )
}

/**
 * Encodes OpenID4VPDCAPIHandoverInfo to CBOR bytes
 *
 * Structure: [origin, nonce, jwkThumbprint]
 *
 * NOTE: This is a placeholder implementation.
 *
 * @param handoverInfo - The HandoverInfo to encode
 * @returns CBOR-encoded bytes
 */
export function encodeHandoverInfo(handoverInfo: OpenID4VPDCAPIHandoverInfoV1_0): Uint8Array {
  // TODO: Implement using cbor-x or @vess-id/mdl
  // CBOR array encoding: [origin, nonce, jwkThumbprint]
  throw new Error(
    'HandoverInfo CBOR encoding not yet implemented. ' +
      'Please add cbor-x or @vess-id/mdl dependency and implement this function.'
  )
}

/**
 * Decodes a CBOR-encoded SessionTranscript
 *
 * NOTE: This is a placeholder implementation.
 *
 * @param cborBytes - CBOR-encoded SessionTranscript
 * @returns Decoded SessionTranscript
 */
export function decodeSessionTranscript(cborBytes: Uint8Array): SessionTranscriptV1_0 {
  // TODO: Implement using cbor-x or @vess-id/mdl
  throw new Error(
    'SessionTranscript CBOR decoding not yet implemented. ' +
      'Please add cbor-x or @vess-id/mdl dependency and implement this function.'
  )
}

/**
 * Default SHA-256 hash function using Web Crypto API
 *
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export async function sha256Hash(data: Uint8Array): Promise<Uint8Array> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Browser or Node.js with Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return new Uint8Array(hashBuffer)
  } else {
    // Fallback for Node.js without Web Crypto API
    try {
      const { createHash } = await import('crypto')
      const hash = createHash('sha256')
      hash.update(data)
      return new Uint8Array(hash.digest())
    } catch (error) {
      throw new Error('SHA-256 hash not available. Please provide a custom hash function.')
    }
  }
}

/**
 * Computes JWK thumbprint (SHA-256 hash of JWK in canonical form)
 *
 * See RFC 7638: JSON Web Key (JWK) Thumbprint
 *
 * @param jwk - The JWK to compute thumbprint for
 * @returns JWK thumbprint as bytes
 */
export async function computeJwkThumbprint(jwk: any): Promise<Uint8Array> {
  // Extract required members based on key type
  const thumbprintData: any = {}

  if (jwk.kty === 'RSA') {
    thumbprintData.e = jwk.e
    thumbprintData.kty = jwk.kty
    thumbprintData.n = jwk.n
  } else if (jwk.kty === 'EC') {
    thumbprintData.crv = jwk.crv
    thumbprintData.kty = jwk.kty
    thumbprintData.x = jwk.x
    thumbprintData.y = jwk.y
  } else if (jwk.kty === 'OKP') {
    thumbprintData.crv = jwk.crv
    thumbprintData.kty = jwk.kty
    thumbprintData.x = jwk.x
  } else {
    throw new Error(`Unsupported JWK key type: ${jwk.kty}`)
  }

  // Create canonical JSON (keys in lexicographic order, no whitespace)
  const canonicalJson = JSON.stringify(thumbprintData, Object.keys(thumbprintData).sort())

  // Hash the canonical JSON
  const encoder = new TextEncoder()
  const jsonBytes = encoder.encode(canonicalJson)

  return sha256Hash(jsonBytes)
}

/**
 * Validates a SessionTranscript structure
 *
 * @param sessionTranscript - The SessionTranscript to validate
 * @returns true if valid, throws error otherwise
 */
export function validateSessionTranscript(sessionTranscript: SessionTranscriptV1_0): boolean {
  // DeviceEngagementBytes must be null for OID4VP
  if (sessionTranscript.DeviceEngagementBytes !== null) {
    throw new Error('SessionTranscript.DeviceEngagementBytes must be null for OID4VP')
  }

  // EReaderKeyBytes must be null for OID4VP
  if (sessionTranscript.EReaderKeyBytes !== null) {
    throw new Error('SessionTranscript.EReaderKeyBytes must be null for OID4VP')
  }

  // Handover must be present
  if (!sessionTranscript.Handover) {
    throw new Error('SessionTranscript.Handover is required')
  }

  // Validate Handover based on type
  const handover = sessionTranscript.Handover

  if (!('handoverType' in handover)) {
    throw new Error('Handover.handoverType is required')
  }

  if (handover.handoverType === HANDOVER_TYPE_REDIRECT) {
    // OpenID4VPHandover
    const redirectHandover = handover as OpenID4VPHandoverV1_0
    if (!redirectHandover.nonce || typeof redirectHandover.nonce !== 'string') {
      throw new Error('OpenID4VPHandover.nonce is required and must be a string')
    }
    if (!(redirectHandover.verifierPublicKey instanceof Uint8Array)) {
      throw new Error('OpenID4VPHandover.verifierPublicKey must be a Uint8Array')
    }
  } else if (handover.handoverType === HANDOVER_TYPE_DCAPI) {
    // OpenID4VPDCAPIHandover
    const dcapiHandover = handover as OpenID4VPDCAPIHandoverV1_0
    if (!(dcapiHandover.handoverInfoHash instanceof Uint8Array)) {
      throw new Error('OpenID4VPDCAPIHandover.handoverInfoHash must be a Uint8Array')
    }
  } else {
    throw new Error(`Unknown handover type: ${(handover as any).handoverType}`)
  }

  return true
}
