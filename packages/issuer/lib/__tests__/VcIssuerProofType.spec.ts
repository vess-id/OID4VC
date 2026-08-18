import { IProofPurpose, IProofType } from '@sphereon/ssi-types'
import { CredentialConfigurationSupportedV1_0_15, ProofOfPossessionMap } from '@vess-id/oid4vci-common'
import { beforeEach, describe, expect, it, vitest } from 'vitest'

import { AuthorizationServerMetadataBuilder, CredentialSupportedBuilderV1_15, VcIssuer, VcIssuerBuilder } from '..'

const ISSUER_URL = 'https://issuer.research.identiproof.io'

const authorizationServerMetadata = new AuthorizationServerMetadataBuilder()
  .withIssuer(ISSUER_URL)
  .withCredentialEndpoint('https://credential-endpoint')
  .withTokenEndpoint('https://token-endpoint')
  .withAuthorizationEndpoint('https://token-endpoint/authorize')
  .withTokenEndpointAuthMethodsSupported(['none'])
  .withResponseTypesSupported(['code'])
  .withScopesSupported(['openid'])
  .build()

/**
 * Covers the error reported when a credential request carries a proof type this package cannot
 * verify. Only jwt proofs are verifiable here; ldp_vp / attestation are representable in the
 * request types but have no verification implementation, so the request used to fail with
 * "no proof value present", which reads as "the wallet sent nothing".
 */
describe('VcIssuer credential request proof types', () => {
  let vcIssuer: VcIssuer

  // Resolves just enough for validateCredentialRequestProof to continue past the callback, so the
  // tests can tell "the jwt proof was picked up" apart from "the proof was rejected up front"
  const jwtVerifyCallback = vitest.fn().mockResolvedValue({ jwt: { header: {}, payload: {} } })

  beforeEach(() => {
    vitest.clearAllMocks()

    const credentialsSupported: Record<string, CredentialConfigurationSupportedV1_0_15> = new CredentialSupportedBuilderV1_15()
      .withFormat('jwt_vc_json')
      .withCredentialName('UniversityDegree_JWT')
      .withCredentialSigningAlgValuesSupported('ES256')
      .withCryptographicBindingMethod('did')
      .withCredentialDefinition({ type: ['VerifiableCredential', 'UniversityDegree_JWT'] })
      .build()

    vcIssuer = new VcIssuerBuilder()
      .withAuthorizationServers('https://authorization-server')
      .withCredentialEndpoint('https://credential-endpoint')
      .withCredentialIssuer(ISSUER_URL)
      .withAuthorizationMetadata(authorizationServerMetadata)
      .withIssuerDisplay({ name: 'example issuer', locale: 'en-US' })
      .withCredentialConfigurationsSupported(credentialsSupported)
      .withInMemoryCredentialOfferState()
      .withInMemoryCNonceState()
      .withInMemoryCredentialOfferURIState()
      .withCredentialSignerCallback(() =>
        Promise.resolve({
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential'],
          issuer: 'did:key:test',
          issuanceDate: new Date().toISOString(),
          credentialSubject: {},
          proof: {
            type: IProofType.JwtProof2020,
            jwt: 'ye.ye.ye',
            created: new Date().toISOString(),
            proofPurpose: IProofPurpose.assertionMethod,
            verificationMethod: 'did:key:test#key-1',
          },
        }),
      )
      .withJWTVerifyCallback(jwtVerifyCallback)
      .build()
  })

  const issueWithProofs = (proofs: ProofOfPossessionMap) =>
    vcIssuer.issueCredential({
      credentialRequest: {
        credential_configuration_id: 'UniversityDegree_JWT',
        proofs,
      },
      issuerCorrelation: { preAuthorizedCode: 'test-pre-authorized-code' },
    })

  // The assertions below inspect the whole message, not only a substring of it, because part of what
  // is under test is what the message must NOT contain
  const errorMessageOf = async (proofs: ProofOfPossessionMap): Promise<string> => {
    try {
      await issueWithProofs(proofs)
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
    throw new Error('Expected the credential request to be rejected, but it resolved')
  }

  it('reports the proof type as unsupported when only ldp_vp proofs are sent', async () => {
    await expect(issueWithProofs({ ldp_vp: [{ type: 'DataIntegrityProof' }] })).rejects.toThrow(
      'Unsupported proof type(s) in credential request: "ldp_vp". This issuer implementation only verifies jwt proofs',
    )
    expect(jwtVerifyCallback).not.toHaveBeenCalled()
  })

  it('lists every unsupported proof type that was sent, in the order they were sent', async () => {
    await expect(issueWithProofs({ ldp_vp: [{ type: 'DataIntegrityProof' }], attestation: [{ foo: 'bar' }] })).rejects.toThrow(
      'Unsupported proof type(s) in credential request: "ldp_vp", "attestation". This issuer implementation only verifies jwt proofs',
    )
  })

  // The spec puts no constraint on the character set of a proof type name, so a URN- or URL-shaped
  // private identifier must survive the sanitiser intact rather than being reported as "?????"
  it('leaves a URN- or URL-shaped private proof type identifier unchanged', async () => {
    await expect(issueWithProofs({ 'urn:example:my_proof': [{ foo: 'bar' }] } as never)).rejects.toThrow(
      'Unsupported proof type(s) in credential request: "urn:example:my_proof". This issuer implementation only verifies jwt proofs',
    )
    await expect(issueWithProofs({ 'https://example.com/proofs#v1': [{ foo: 'bar' }] } as never)).rejects.toThrow(
      'Unsupported proof type(s) in credential request: "https://example.com/proofs#v1". This issuer implementation only verifies jwt proofs',
    )
  })

  it('keeps the original error when no proof was sent at all', async () => {
    await expect(issueWithProofs({})).rejects.toThrow('Proof of possession is required. No proof value present in credential request')
  })

  it('keeps the original error when the jwt proof array is empty', async () => {
    await expect(issueWithProofs({ jwt: [] })).rejects.toThrow('Proof of possession is required. No proof value present in credential request')
  })

  // An empty array carries no proof value, so there is nothing unsupported to report: this is the
  // "wallet sent nothing" case, not the "wallet sent something we cannot verify" case
  it('keeps the original error when a non-jwt proof type is present but its array is empty', async () => {
    await expect(issueWithProofs({ ldp_vp: [] })).rejects.toThrow('Proof of possession is required. No proof value present in credential request')
  })

  // A wire payload can put anything under a proof type. A non-array value carries no proof value
  // either, so it belongs to the "wallet sent nothing" case and must not be dereferenced as an array
  it('keeps the original error when a proof value is not an array', async () => {
    await expect(issueWithProofs({ ldp_vp: null as never })).rejects.toThrow(
      'Proof of possession is required. No proof value present in credential request',
    )
  })

  // A wire payload can put anything under a proof type. A string has a .length but is not an array,
  // so it carries no proof value either and must not be reported as an unsupported proof type
  it('keeps the original error when a proof value is a string', async () => {
    await expect(issueWithProofs({ ldp_vp: 'abc' as never })).rejects.toThrow(
      'Proof of possession is required. No proof value present in credential request',
    )
  })

  // The message is returned as error_description and is persisted on the session, so a request must
  // not be able to grow it without bound
  it('truncates an over-long proof type name in the message', async () => {
    const longProofTypeName = 'x'.repeat(4096)

    await expect(issueWithProofs({ [longProofTypeName]: [{ foo: 'bar' }] } as never)).rejects.toThrow(
      `Unsupported proof type(s) in credential request: "${'x'.repeat(32)}...". This issuer implementation only verifies jwt proofs`,
    )
  })

  // Replaced one-for-one rather than dropped: dropping would render "ldp\r\n_vp" as the legitimate
  // "ldp_vp", hiding which proof type the request actually carried
  it('replaces control characters in a proof type name with a marker instead of dropping them', async () => {
    await expect(issueWithProofs({ 'ldp\r\n_vp': [{ foo: 'bar' }] } as never)).rejects.toThrow(
      'Unsupported proof type(s) in credential request: "ldp??_vp". This issuer implementation only verifies jwt proofs',
    )
  })

  it('lists at most three proof type names and reports the rest as a count', async () => {
    const proofs = Object.fromEntries(['a', 'b', 'c', 'd', 'e'].map((proofType) => [proofType, [{ foo: 'bar' }]]))

    await expect(issueWithProofs(proofs as never)).rejects.toThrow(
      'Unsupported proof type(s) in credential request: "a", "b", "c" (and 2 more). This issuer implementation only verifies jwt proofs',
    )
  })

  it('does not report a count when the number of proof types is exactly the listing limit', async () => {
    const proofs = Object.fromEntries(['a', 'b', 'c'].map((proofType) => [proofType, [{ foo: 'bar' }]]))

    await expect(issueWithProofs(proofs as never)).rejects.toThrow(
      'Unsupported proof type(s) in credential request: "a", "b", "c". This issuer implementation only verifies jwt proofs',
    )
  })

  // U+2028 / U+2029 are line terminators in JavaScript and are rendered as line breaks by many log
  // viewers, yet they are neither control (Cc) nor format (Cf) characters, so a sanitiser built on
  // those Unicode categories lets them straight through and a name can forge a log line
  it('does not let a proof type name emit a raw line terminator', async () => {
    const message = await errorMessageOf({ 'ldp\u2028_vp\u2029x': [{ foo: 'bar' }] } as never)

    expect(message).not.toContain('\u2028')
    expect(message).not.toContain('\u2029')
    expect(message).not.toMatch(/[\r\n]/)
    expect(message).toBe('Unsupported proof type(s) in credential request: "ldp?_vp?x". This issuer implementation only verifies jwt proofs')
  })

  // Dropping unsafe characters would make an invisible-character variant indistinguishable from the
  // real proof type name, which defeats the point of naming the proof type at all
  it('does not render a proof type name padded with invisible characters as the legitimate ldp_vp', async () => {
    const disguised = await errorMessageOf({ 'ldp\u200b_vp': [{ foo: 'bar' }] } as never)
    const legitimate = await errorMessageOf({ ldp_vp: [{ type: 'DataIntegrityProof' }] })

    expect(disguised).not.toEqual(legitimate)
    expect(disguised).toContain('"ldp?_vp"')
    expect(legitimate).toContain('"ldp_vp"')
  })

  // A name that renders to nothing must still occupy a visible position, otherwise the message reads
  // as a formatting bug ("credential request: . This issuer ...") rather than as a hostile name
  it('keeps the name position visible when a proof type name renders to nothing', async () => {
    const controlOnly = await errorMessageOf({ '\u0000\u0001\u2028': [{ foo: 'bar' }] } as never)
    const emptyName = await errorMessageOf({ '': [{ foo: 'bar' }] } as never)

    expect(controlOnly).toBe('Unsupported proof type(s) in credential request: "???". This issuer implementation only verifies jwt proofs')
    expect(emptyName).toBe('Unsupported proof type(s) in credential request: "". This issuer implementation only verifies jwt proofs')
  })

  // The separator and the "(and N more)" suffix are part of the message's own structure, so a name
  // must not be able to reproduce them and make one proof type look like several
  it('does not let a proof type name forge the separator or the omitted count', async () => {
    const message = await errorMessageOf({ 'a, b, c (and 99 more)': [{ foo: 'bar' }] } as never)

    expect(message).toBe(
      'Unsupported proof type(s) in credential request: "a??b??c??and?99?more?". This issuer implementation only verifies jwt proofs',
    )
    expect(message).not.toContain(', "b"')
    expect(message).not.toContain('more)')
  })

  // Astral characters, combining marks and lone surrogates all have to leave the sanitiser as plain
  // ASCII, so that neither the truncation nor the JSON quoting can be broken by the input
  it('renders astral, combining and lone surrogate characters as plain markers', async () => {
    const message = await errorMessageOf({ 'a\u{1f600}e\u0301\ud800b': [{ foo: 'bar' }] } as never)

    expect(message).toBe('Unsupported proof type(s) in credential request: "a?e??b". This issuer implementation only verifies jwt proofs')
    expect(message).toMatch(/^[\x20-\x7e]*$/)
  })

  // The allowlist is ASCII-only on purpose: a Cyrillic or fullwidth homoglyph reads as the
  // legitimate name in a log viewer, so it has to be replaced rather than passed through
  it('renders homoglyph characters as markers instead of letting them through', async () => {
    const cyrillic = await errorMessageOf({ 'ldp_v\u0440': [{ foo: 'bar' }] } as never)
    const fullwidth = await errorMessageOf({ '\uff4c\uff44\uff50\uff3f\uff56\uff50': [{ foo: 'bar' }] } as never)

    expect(cyrillic).toBe('Unsupported proof type(s) in credential request: "ldp_v?". This issuer implementation only verifies jwt proofs')
    expect(fullwidth).toBe('Unsupported proof type(s) in credential request: "??????". This issuer implementation only verifies jwt proofs')
  })

  it('still verifies the jwt proof when an unsupported proof type is sent alongside it', async () => {
    // The request still fails further downstream, but not at the proof type gate: only "the gate let
    // the request through and the jwt was used" is asserted here, not which later check rejected it
    const issuance = issueWithProofs({ ldp_vp: [{ type: 'DataIntegrityProof' }], jwt: ['ey.j.w'] })
    await expect(issuance).rejects.toThrow()
    await expect(issuance).rejects.not.toThrow('Unsupported proof type')
    expect(jwtVerifyCallback).toHaveBeenCalledWith({ jwt: 'ey.j.w' })
  })
})
