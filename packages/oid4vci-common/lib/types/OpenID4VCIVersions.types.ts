export enum OpenId4VCIVersion {
  VER_1_0_15 = 1015,
  VER_1_0 = 10000, // OID4VCI 1.0 (Draft 16)
  VER_UNKNOWN = Number.MAX_VALUE,
}

export enum DefaultURISchemes {
  INITIATE_ISSUANCE = 'openid-initiate-issuance',
  CREDENTIAL_OFFER = 'openid-credential-offer',
}
