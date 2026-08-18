import {
  ClaimsDescriptionV1_0,
  CredentialConfigurationSupportedV1_0,
  CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0,
  CredentialDefinitionJwtVcJsonV1_0,
  CredentialMetadataV1_0,
  CredentialsSupportedDisplay,
  OID4VCICredentialFormat,
  ProofTypeV1_0,
  ProofTypesV1_0,
  validateClaimsArray,
  validateDisplayArray,
  validateProofSigningAlgValues,
} from '@vess-id/oid4vci-common'

/**
 * Builder for OID4VCI 1.0 (Draft 16) Credential Configuration
 *
 * Key changes from v1.0.15:
 * - claims and display moved into credential_metadata
 * - Arrays must be non-empty if present
 * - Format-specific credential_signing_alg_values_supported
 */
export class CredentialSupportedBuilderV1_0 {
  format?: OID4VCICredentialFormat
  scope?: string
  credentialName?: string
  credentialDefinition?: CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0 | CredentialDefinitionJwtVcJsonV1_0
  cryptographicBindingMethodsSupported?: ('jwk' | 'cose_key' | 'did' | string)[]
  credentialSigningAlgValuesSupported?: string[]
  proofTypesSupported?: ProofTypesV1_0
  credentialMetadata?: CredentialMetadataV1_0 // NEW in v1.0: claims and display moved here
  vct?: string // For dc+sd-jwt format
  doctype?: string // For mso_mdoc format
  order?: string[] // For credential display order

  withFormat(credentialFormat: OID4VCICredentialFormat): CredentialSupportedBuilderV1_0 {
    this.format = credentialFormat
    return this
  }

  withCredentialName(credentialName: string): CredentialSupportedBuilderV1_0 {
    this.credentialName = credentialName
    return this
  }

  withCredentialDefinition(
    credentialDefinition: CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0 | CredentialDefinitionJwtVcJsonV1_0,
  ): CredentialSupportedBuilderV1_0 {
    if (!credentialDefinition.type || credentialDefinition.type.length === 0) {
      throw new Error('credentialDefinition.type must be a non-empty array (OID4VCI 1.0 requirement)')
    }
    this.credentialDefinition = credentialDefinition
    return this
  }

  withScope(scope: string): CredentialSupportedBuilderV1_0 {
    this.scope = scope
    return this
  }

  withVct(vct: string): CredentialSupportedBuilderV1_0 {
    this.vct = vct
    return this
  }

  withDoctype(doctype: string): CredentialSupportedBuilderV1_0 {
    this.doctype = doctype
    return this
  }

  withOrder(order: string[]): CredentialSupportedBuilderV1_0 {
    if (order.length === 0) {
      throw new Error('order must be a non-empty array if provided (OID4VCI 1.0 requirement)')
    }
    this.order = order
    return this
  }

  // NEW in v1.0: credential_metadata with claims and display
  withCredentialMetadata(credentialMetadata: CredentialMetadataV1_0): CredentialSupportedBuilderV1_0 {
    // Validate arrays are non-empty if present
    if (credentialMetadata.claims && !validateClaimsArray(credentialMetadata.claims, 'credential_metadata')) {
      throw new Error('credential_metadata.claims must be a non-empty array if provided (OID4VCI 1.0 requirement)')
    }
    if (credentialMetadata.display && !validateDisplayArray(credentialMetadata.display, 'credential_metadata')) {
      throw new Error('credential_metadata.display must be a non-empty array if provided (OID4VCI 1.0 requirement)')
    }
    this.credentialMetadata = credentialMetadata
    return this
  }

  // Helper: Add claims to credential_metadata
  withClaims(claims: ClaimsDescriptionV1_0[]): CredentialSupportedBuilderV1_0 {
    if (!validateClaimsArray(claims, 'credential')) {
      throw new Error('claims must be a non-empty array (OID4VCI 1.0 requirement)')
    }
    if (!this.credentialMetadata) {
      this.credentialMetadata = {}
    }
    this.credentialMetadata.claims = claims
    return this
  }

  // Helper: Add display to credential_metadata
  withDisplay(display: CredentialsSupportedDisplay[]): CredentialSupportedBuilderV1_0 {
    if (!validateDisplayArray(display, 'credential')) {
      throw new Error('display must be a non-empty array (OID4VCI 1.0 requirement)')
    }
    if (!this.credentialMetadata) {
      this.credentialMetadata = {}
    }
    this.credentialMetadata.display = display
    return this
  }

  addCryptographicBindingMethod(method: string | string[]): CredentialSupportedBuilderV1_0 {
    if (!Array.isArray(method)) {
      this.cryptographicBindingMethodsSupported = this.cryptographicBindingMethodsSupported
        ? [...this.cryptographicBindingMethodsSupported, method]
        : [method]
    } else {
      this.cryptographicBindingMethodsSupported = this.cryptographicBindingMethodsSupported
        ? [...this.cryptographicBindingMethodsSupported, ...method]
        : method
    }
    return this
  }

  withCryptographicBindingMethod(method: string | string[]): CredentialSupportedBuilderV1_0 {
    const methods = Array.isArray(method) ? method : [method]
    if (methods.length === 0) {
      throw new Error('cryptographic_binding_methods_supported must be non-empty if provided (OID4VCI 1.0 requirement)')
    }
    this.cryptographicBindingMethodsSupported = methods
    return this
  }

  addCredentialSigningAlgValuesSupported(algValues: string | string[]): CredentialSupportedBuilderV1_0 {
    if (!Array.isArray(algValues)) {
      this.credentialSigningAlgValuesSupported = this.credentialSigningAlgValuesSupported
        ? [...this.credentialSigningAlgValuesSupported, algValues]
        : [algValues]
    } else {
      this.credentialSigningAlgValuesSupported = this.credentialSigningAlgValuesSupported
        ? [...this.credentialSigningAlgValuesSupported, ...algValues]
        : algValues
    }
    return this
  }

  withCredentialSigningAlgValuesSupported(algValues: string | string[]): CredentialSupportedBuilderV1_0 {
    const algs = Array.isArray(algValues) ? algValues : [algValues]
    if (algs.length === 0) {
      throw new Error('credential_signing_alg_values_supported must be non-empty if provided (OID4VCI 1.0 requirement)')
    }
    this.credentialSigningAlgValuesSupported = algs
    return this
  }

  addProofTypesSupported(keyProofType: keyof ProofTypesV1_0, proofType: ProofTypeV1_0): CredentialSupportedBuilderV1_0 {
    if (!this.proofTypesSupported) {
      this.proofTypesSupported = {}
    }
    this.proofTypesSupported[keyProofType] = proofType
    return this
  }

  withProofTypesSupported(proofTypesSupported: ProofTypesV1_0): CredentialSupportedBuilderV1_0 {
    this.proofTypesSupported = proofTypesSupported
    return this
  }

  build(): Record<string, CredentialConfigurationSupportedV1_0> {
    if (!this.format) {
      throw Error('No format supplied')
    }
    if (!this.credentialName) {
      throw Error('No credential name supplied')
    }

    // Validate arrays are non-empty
    if (this.cryptographicBindingMethodsSupported && this.cryptographicBindingMethodsSupported.length === 0) {
      throw new Error('cryptographic_binding_methods_supported must be non-empty if provided (OID4VCI 1.0 requirement)')
    }
    if (this.credentialSigningAlgValuesSupported && this.credentialSigningAlgValuesSupported.length === 0) {
      throw new Error('credential_signing_alg_values_supported must be non-empty if provided (OID4VCI 1.0 requirement)')
    }

    const credentialSupported: any = {
      format: this.format,
    }

    if (this.scope) {
      credentialSupported.scope = this.scope
    }

    if (this.cryptographicBindingMethodsSupported && this.cryptographicBindingMethodsSupported.length > 0) {
      credentialSupported.cryptographic_binding_methods_supported = this.cryptographicBindingMethodsSupported
    }

    if (this.credentialSigningAlgValuesSupported && this.credentialSigningAlgValuesSupported.length > 0) {
      credentialSupported.credential_signing_alg_values_supported = this.credentialSigningAlgValuesSupported
    }

    // 空オブジェクトはキー不在と同義に正規化する。OID4VCI では「キー不在 = proof を要求しない」だが
    // proof_types_supported: {} は「対応する proof type がゼロ」とも読めるため、広告しない。
    if (this.proofTypesSupported && Object.keys(this.proofTypesSupported).length > 0) {
      for (const [keyProofType, proofType] of Object.entries(this.proofTypesSupported)) {
        if (!validateProofSigningAlgValues(proofType?.proof_signing_alg_values_supported, keyProofType)) {
          throw new Error(`proof_types_supported.${keyProofType}.proof_signing_alg_values_supported must be non-empty (OID4VCI 1.0 requirement)`)
        }
      }
      // 検証を通した値が build() 後に呼び出し側から書き換えられないよう、深いコピーを出力する。
      credentialSupported.proof_types_supported = structuredClone(this.proofTypesSupported)
    }

    // NEW in v1.0: credential_metadata
    if (this.credentialMetadata) {
      credentialSupported.credential_metadata = this.credentialMetadata
    }

    if (this.order) {
      credentialSupported.order = this.order
    }

    // Format-specific properties
    if (this.format === 'dc+sd-jwt') {
      if (!this.vct) {
        throw Error('VCT is required for dc+sd-jwt format')
      }
      credentialSupported.vct = this.vct
    } else if (this.format === 'mso_mdoc') {
      if (!this.doctype) {
        throw Error('Doctype is required for mso_mdoc format')
      }
      credentialSupported.doctype = this.doctype
    } else if (this.format === 'jwt_vc_json' || this.format === 'jwt_vc' || this.format === 'ldp_vc' || this.format === 'jwt_vc_json-ld') {
      if (!this.credentialDefinition) {
        throw Error('Credential definition is required for W3C credential formats')
      }
      credentialSupported.credential_definition = this.credentialDefinition
    }

    return { [this.credentialName]: credentialSupported }
  }
}
