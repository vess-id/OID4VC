import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    // issuer-rest (@sphereon/oid4vci-issuer-server) is excluded: not migrated to OID4VCI 1.0
    // and unused. Keep in sync with the exclusion in pnpm-workspace.yaml.
    workspace: ['packages/*', '!packages/issuer-rest'],
    coverage: {
      provider: 'v8',
    },
  },
})
