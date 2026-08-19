import { describe, expect, it } from 'vitest'

import { CredentialSupportedBuilderV1_0 } from '..'

// 期待値は常にリテラルで書き、builder への入力と共有しない。
// 共有すると同一インスタンス同士の比較になり、build() が入力を破壊しても検出できない。
const baseBuilder = () =>
  new CredentialSupportedBuilderV1_0()
    .withFormat('jwt_vc_json')
    .withCredentialName('UniversityDegree_JWT')
    .withScope('openid_credential')
    .withCryptographicBindingMethod('did')
    .withCredentialSigningAlgValuesSupported('ES256')
    .withCredentialDefinition({
      type: ['VerifiableCredential', 'UniversityDegree_JWT'],
    })

describe('CredentialSupportedBuilderV1_0', () => {
  it('addProofTypesSupported で di_vp を設定でき、出力に含まれること', () => {
    const configuration = baseBuilder()
      .addProofTypesSupported('di_vp', { proof_signing_alg_values_supported: ['Ed25519Signature2020'] })
      .build()

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      di_vp: { proof_signing_alg_values_supported: ['Ed25519Signature2020'] },
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

  it('addProofTypesSupported を異なるキーで複数回呼ぶと上書きせずマージすること', () => {
    const configuration = baseBuilder()
      .addProofTypesSupported('jwt', { proof_signing_alg_values_supported: ['ES256'] })
      .addProofTypesSupported('di_vp', { proof_signing_alg_values_supported: ['Ed25519Signature2020'] })
      .build()

    expect(configuration['UniversityDegree_JWT'].proof_types_supported).toEqual({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
      di_vp: { proof_signing_alg_values_supported: ['Ed25519Signature2020'] },
    })
  })

  it('proof_signing_alg_values_supported が空配列の場合はエラーになること', () => {
    const builder = baseBuilder().withProofTypesSupported({ jwt: { proof_signing_alg_values_supported: [] } })

    expect(() => builder.build()).toThrow('proof_types_supported.jwt.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)')
  })

  it('proof_signing_alg_values_supported が未設定の場合はエラーになること', () => {
    const builder = baseBuilder().withProofTypesSupported({ jwt: {} } as never)

    expect(() => builder.build()).toThrow('proof_types_supported.jwt.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)')
  })

  it('proof type の値自体が undefined の場合もエラーになること', () => {
    const builder = baseBuilder().withProofTypesSupported({ jwt: undefined } as never)

    expect(() => builder.build()).toThrow('proof_types_supported.jwt.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)')
  })

  it('複数キーのうち一方だけが空配列の場合も該当キー名を含むエラーになること', () => {
    const builder = baseBuilder().withProofTypesSupported({
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
      di_vp: { proof_signing_alg_values_supported: [] },
    })

    expect(() => builder.build()).toThrow(
      'proof_types_supported.di_vp.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)',
    )
  })

  it('空オブジェクトを設定した場合は proof_types_supported のキー自体を出力しないこと', () => {
    const configuration = baseBuilder().withProofTypesSupported({}).build()

    expect(configuration['UniversityDegree_JWT']).not.toHaveProperty('proof_types_supported')
  })

  it('未設定の場合は proof_types_supported のキー自体を出力しないこと', () => {
    const configuration = baseBuilder().build()

    expect(configuration['UniversityDegree_JWT']).not.toHaveProperty('proof_types_supported')
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

  it('型としても不正なキーを受け付けないこと (spec を型検査する構成でのみ評価される)', () => {
    // @ts-expect-error cwt は OID4VCI 1.0 の proof type ではないため、キー型として受け付けない
    baseBuilder().addProofTypesSupported('cwt', { proof_signing_alg_values_supported: ['ES256'] })
    // @ts-expect-error ldp_vp は v1.0.15 の名称であり、OID4VCI 1.0 では di_vp に改称されたため受け付けない
    baseBuilder().addProofTypesSupported('ldp_vp', { proof_signing_alg_values_supported: ['Ed25519Signature2020'] })
    // @ts-expect-error cwt はオブジェクトリテラルのキーとしても受け付けない
    baseBuilder().withProofTypesSupported({ cwt: { proof_signing_alg_values_supported: ['ES256'] } })
    // @ts-expect-error ldp_vp はオブジェクトリテラルのキーとしても受け付けない
    baseBuilder().withProofTypesSupported({ ldp_vp: { proof_signing_alg_values_supported: ['Ed25519Signature2020'] } })
  })
})
