# @vess-id/jarm

JWT Secured Authorization Response Mode (JARM) implementation.

> **Note**: This is a @vess-id implementation. Original by [Sphereon](https://github.com/Sphereon-Opensource).

## Version 1.0.0

Implementation of [JWT Secured Authorization Response Mode for OAuth 2.0 (JARM)](https://openid.net/specs/oauth-v2-jarm.html).

## Features

- JWT-secured authorization responses
- Response encryption support
- Metadata validation
- Server and client metadata handling

## Installation

```bash
npm install @vess-id/jarm
# or
pnpm add @vess-id/jarm
# or
yarn add @vess-id/jarm
```

## Usage

```typescript
import {
  jarmAuthResponseSend,
  jarmMetadataValidate,
  JarmClientMetadata,
  JarmServerMetadata
} from '@vess-id/jarm'

// Send JARM response
await jarmAuthResponseSend({
  // ... configuration
})

// Validate metadata
jarmMetadataValidate(clientMetadata)
```

## Supported Response Modes

- `query.jwt`
- `fragment.jwt`
- `form_post.jwt`
- `jwt` (POST to redirect_uri)

## License

Apache-2.0
