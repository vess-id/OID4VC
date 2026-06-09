# @vess-id/oid4vc-common

Common utilities and types for OpenID for Verifiable Credentials (OID4VC) implementations.

> **Note**: This is a @vess-id implementation. Original by [Sphereon](https://github.com/Sphereon-Opensource).

## Version 1.0.0

This package provides shared functionality for:
- OpenID for Verifiable Credential Issuance (OID4VCI) 1.0
- OpenID for Verifiable Presentations (OID4VP) 1.0

## Features

- JWT utilities
- Common type definitions
- Logging support
- Shared validation logic

## Installation

```bash
npm install @vess-id/oid4vc-common
# or
pnpm add @vess-id/oid4vc-common
# or
yarn add @vess-id/oid4vc-common
```

## Usage

```typescript
import { parseJWT, isJwe, isJws } from '@vess-id/oid4vc-common'

// Parse JWT
const payload = parseJWT('eyJ...')

// Check JWT type
if (isJws(token)) {
  // Handle JWS
}

if (isJwe(token)) {
  // Handle JWE
}
```

## License

Apache-2.0
