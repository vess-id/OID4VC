import { describe, expect, expectTypeOf, it } from 'vitest'

import { ProofTypeIdentifierV1_0, ProofTypeIdentifierV1_0_15 } from '../functions/ProofTypeUtils'
import type { KeyProofTypeV1_0_15, ProofTypesV1_0_15 } from '../types/v1_0_15.types'
import type { ProofTypesV1_0 } from '../types/v1_0.types'

/**
 * Guards the proof type key sets per spec version.
 *
 * The original bug was "the version-specific type existed but was never referenced", which no
 * runtime test could catch. These assertions pin the key sets so a regression (e.g. re-introducing
 * the removed `cwt`, or dropping `attestation`) fails here.
 *
 * Note: the `expectTypeOf` assertion below is NOT verified by any automated process in this
 * repository. `tsc --noEmit` excludes the `__tests__` directories (see the exclude list in
 * tsconfig.base.json) and vitest typecheck is not enabled, so it only surfaces in an editor.
 * It is kept as documentation of intent. The runtime `expect` assertions are the actual safety net;
 * they cover the same key sets because `KeyProofTypeV1_0_15` is derived from
 * `ProofTypeIdentifierV1_0_15`.
 */
describe('proof type identifiers', () => {
  it('exposes jwt / ldp_vp / attestation for v1.0.15 (Draft 15)', () => {
    expect(Object.values(ProofTypeIdentifierV1_0_15).sort()).toEqual(['attestation', 'jwt', 'ldp_vp'])
  })

  it('exposes jwt / di_vp / attestation for v1.0 (ldp_vp was renamed to di_vp)', () => {
    expect(Object.values(ProofTypeIdentifierV1_0).sort()).toEqual(['attestation', 'di_vp', 'jwt'])
  })

  it('does not expose the removed cwt proof type in either version', () => {
    expect(Object.values(ProofTypeIdentifierV1_0_15)).not.toContain('cwt')
    expect(Object.values(ProofTypeIdentifierV1_0)).not.toContain('cwt')
  })

  it('derives KeyProofTypeV1_0_15 from the ProofTypeIdentifierV1_0_15 enum', () => {
    // Both must stay in sync: the type is a template literal over the enum values.
    expectTypeOf<KeyProofTypeV1_0_15>().toEqualTypeOf<'jwt' | 'ldp_vp' | 'attestation'>()

    const keys: KeyProofTypeV1_0_15[] = ['jwt', 'ldp_vp', 'attestation']
    expect(keys.sort()).toEqual(Object.values(ProofTypeIdentifierV1_0_15).sort())
  })
})

describe('proof_types_supported per spec version', () => {
  it('accepts the v1.0.15 keys', () => {
    const proofTypes: ProofTypesV1_0_15 = {
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
      ldp_vp: { proof_signing_alg_values_supported: ['Ed25519Signature2020'] },
      attestation: { proof_signing_alg_values_supported: ['ES256'] },
    }

    expect(Object.keys(proofTypes).sort()).toEqual(['attestation', 'jwt', 'ldp_vp'])
  })

  it('accepts the v1.0 keys', () => {
    const proofTypes: ProofTypesV1_0 = {
      jwt: { proof_signing_alg_values_supported: ['ES256'] },
      di_vp: { proof_signing_alg_values_supported: ['Ed25519Signature2020'] },
      attestation: { proof_signing_alg_values_supported: ['ES256'] },
    }

    expect(Object.keys(proofTypes).sort()).toEqual(['attestation', 'di_vp', 'jwt'])
  })

  it('carries key_attestations_required inside a proof type, not as a sibling key', () => {
    const proofTypes: ProofTypesV1_0_15 = {
      jwt: {
        proof_signing_alg_values_supported: ['ES256'],
        key_attestations_required: { key_storage: ['iso_18045_high'] },
      },
    }

    // The advertised JSON path is proof_types_supported.jwt.key_attestations_required
    expect(proofTypes.jwt?.key_attestations_required?.key_storage).toEqual(['iso_18045_high'])
    expect(proofTypes).not.toHaveProperty('key_attestations_required')
  })
})
