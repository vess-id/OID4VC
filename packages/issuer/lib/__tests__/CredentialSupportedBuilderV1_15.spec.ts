import { describe, expect, it } from 'vitest'

import { CredentialSupportedBuilderV1_15, IssuerMetadataBuilderV1_15 } from '..'

// 期待値は常にリテラルで書き、builder への入力と共有しない。
// 共有すると同一インスタンス同士の比較になり、build() が入力を破壊しても検出できない。
const baseBuilder = () =>
  new CredentialSupportedBuilderV1_15()
    .withFormat('jwt_vc_json')
    .withCredentialName('UniversityDegree_JWT')
    .withScope('openid_credential')
    .withCryptographicBindingMethod('did')
    .withCredentialSigningAlgValuesSupported('ES256')
    .withCredentialDefinition({
      type: ['VerifiableCredential', 'UniversityDegree_JWT'],
    })

describe('CredentialSupportedBuilderV1_15', () => {
  it('withProofTypesSupported で設定した proof_types_supported を出力すること', () => {
    const configuration = baseBuilder()
      .withProofTypesSupported({ jwt: { proof_signing_alg_values_supported: ['ES256', 'EdDSA'] } })
      .build()

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256', 'EdDSA'] },
    })
  })

  it('addProofTypesSupported で設定した proof_types_supported を出力すること', () => {
    const configuration = baseBuilder()
      .addProofTypesSupported('jwt', { proof_signing_alg_values_supported: ['ES256'] })
      .build()

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
    })
  })

  it('addProofTypesSupported を異なるキーで複数回呼ぶと上書きせずマージすること', () => {
    const configuration = baseBuilder()
      .addProofTypesSupported('jwt', { proof_signing_alg_values_supported: ['ES256'] })
      .addProofTypesSupported('ldp_vp', { proof_signing_alg_values_supported: ['Ed25519Signature2020'] })
      .build()

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
      ldp_vp: { proof_signing_alg_values_supported: ['Ed25519Signature2020'] },
    })
  })

  it('未設定の場合は proof_types_supported のキー自体を出力しないこと', () => {
    const configuration = baseBuilder().build()

    expect(configuration['UniversityDegree_JWT']).not.toHaveProperty('proof_types_supported')
  })

  it('空オブジェクトを設定した場合は proof_types_supported のキー自体を出力しないこと', () => {
    const configuration = baseBuilder().withProofTypesSupported({}).build()

    expect(configuration['UniversityDegree_JWT']).not.toHaveProperty('proof_types_supported')
  })

  it('proof_signing_alg_values_supported が空配列の場合はエラーになること', () => {
    const builder = baseBuilder().withProofTypesSupported({ jwt: { proof_signing_alg_values_supported: [] } })

    expect(() => builder.build()).toThrow('proof_types_supported.jwt.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)')
  })

  it('proof_signing_alg_values_supported が未設定の場合はエラーになること', () => {
    const builder = baseBuilder().withProofTypesSupported({ jwt: {} } as never)

    expect(() => builder.build()).toThrow('proof_types_supported.jwt.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)')
  })

  it('複数キーのうち一方だけが空配列の場合も該当キー名を含むエラーになること', () => {
    const builder = baseBuilder().withProofTypesSupported({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
      ldp_vp: { proof_signing_alg_values_supported: [] },
    })

    expect(() => builder.build()).toThrow(
      'proof_types_supported.ldp_vp.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)',
    )
  })

  it('build() 後に入力オブジェクトを書き換えても出力が変化しないこと', () => {
    const input = { jwt: { proof_signing_alg_values_supported: ['ES256'] } }
    const configuration = baseBuilder().withProofTypesSupported(input).build()

    // 検証を通過した後に呼び出し側が壊しても、出力済みのメタデータは影響を受けない
    input.jwt.proof_signing_alg_values_supported.length = 0
    input.jwt = { proof_signing_alg_values_supported: ['RS256'] }

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
    })
  })

  it('dc+sd-jwt でも proof_types_supported を出力すること', () => {
    const configuration = new CredentialSupportedBuilderV1_15()
      .withFormat('dc+sd-jwt')
      .withCredentialName('VESSSdJwtCredential')
      .withVct('VESSSdJwtCredential')
      .withProofTypesSupported({ jwt: { proof_signing_alg_values_supported: ['ES256', 'EdDSA'] } })
      .build()

    expect(configuration['VESSSdJwtCredential'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256', 'EdDSA'] },
    })
  })

  it('mso_mdoc でも proof_types_supported を出力すること', () => {
    const configuration = new CredentialSupportedBuilderV1_15()
      .withFormat('mso_mdoc')
      .withCredentialName('org.iso.18013.5.1.mDL')
      .withDoctype('org.iso.18013.5.1.mDL')
      .withProofTypesSupported({ jwt: { proof_signing_alg_values_supported: ['ES256'] } })
      .build()

    expect(configuration['org.iso.18013.5.1.mDL'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
    })
  })

  it('proof_types_supported 以外のフィールドを壊さないこと', () => {
    const configuration = baseBuilder()
      .withProofTypesSupported({ jwt: { proof_signing_alg_values_supported: ['ES256', 'EdDSA'] } })
      .build()

    expect(configuration['UniversityDegree_JWT']).toEqual({
      format: 'jwt_vc_json',
      scope: 'openid_credential',
      cryptographic_binding_methods_supported: ['did'],
      credential_signing_alg_values_supported: ['ES256'],
      proof_types_supported: { jwt: { proof_signing_alg_values_supported: ['ES256', 'EdDSA'] } },
      credential_definition: {
        type: ['VerifiableCredential', 'UniversityDegree_JWT'],
      },
    })
  })

  it('addProofTypesSupported で attestation を設定でき、出力に含まれること', () => {
    const configuration = baseBuilder()
      .addProofTypesSupported('attestation', { proof_signing_alg_values_supported: ['ES256'] })
      .build()

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      attestation: { proof_signing_alg_values_supported: ['ES256'] },
    })
  })

  it('key_attestations_required を設定でき、出力に含まれること', () => {
    const configuration = baseBuilder()
      .addProofTypesSupported('jwt', {
        proof_signing_alg_values_supported: ['ES256'],
        key_attestations_required: { key_storage: ['iso_18045_high'], user_authentication: ['iso_18045_moderate'] },
      })
      .build()

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      jwt: {
        proof_signing_alg_values_supported: ['ES256'],
        key_attestations_required: { key_storage: ['iso_18045_high'], user_authentication: ['iso_18045_moderate'] },
      },
    })
  })

  it('attestation の proof_signing_alg_values_supported が空配列の場合はエラーになること', () => {
    const builder = baseBuilder().addProofTypesSupported('attestation', { proof_signing_alg_values_supported: [] })

    expect(() => builder.build()).toThrow(
      'proof_types_supported.attestation.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)',
    )
  })

  it('型としても不正なキーを受け付けないこと (spec を型検査する構成でのみ評価される)', () => {
    // addProofTypesSupported のキー型は KeyProofTypeV1_0_15 (enum 由来) なので cwt を受け付けない
    // @ts-expect-error cwt は v1.0.15 の proof type ではないため、キー型として受け付けない
    baseBuilder().addProofTypesSupported('cwt', { proof_signing_alg_values_supported: ['ES256'] })
    // withProofTypesSupported の引数型は ProofTypesV1_0_15 (interface) なので、
    // オブジェクトリテラルに対する余剰プロパティ検査でのみ弾かれる (変数経由では型検査をすり抜ける)
    // @ts-expect-error cwt は v1.0.15 の proof type ではないため、オブジェクトリテラルのキーとしても受け付けない
    baseBuilder().withProofTypesSupported({ cwt: { proof_signing_alg_values_supported: ['ES256'] } })
  })

  it('IssuerMetadataBuilderV1_15 経由で credential_configurations_supported に載ること', () => {
    const metadata = new IssuerMetadataBuilderV1_15()
      .withCredentialIssuer('https://credential-issuer')
      .withCredentialEndpoint('https://credential-issuer/credentials')
      .addSupportedCredentialBuilder(baseBuilder().withProofTypesSupported({ jwt: { proof_signing_alg_values_supported: ['ES256'] } }))
      .build()

    expect(metadata.credential_configurations_supported['UniversityDegree_JWT'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
    })
  })
})
