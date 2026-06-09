# OID4VCI SDK Codebase Exploration - Documentation Index

## Overview

This directory contains comprehensive documentation from an in-depth exploration of the OID4VCI SDK codebase. The exploration was conducted to understand the current implementation version, architecture, and code patterns in preparation for potential v1.0 compliance upgrades.

## Documents Included

### 1. OID4VCI_CODEBASE_EXPLORATION.md (Primary Document)

**Size**: 980 lines | 29 KB
**Purpose**: Comprehensive technical analysis

This is the main documentation file containing a complete analysis of the OID4VCI SDK codebase.

**Contents**:
1. **Executive Summary** - Overview of the SDK structure and version support
2. **Version Support** - Current draft 15 implementation details and enum definitions
3. **Main Types & Interfaces** - Detailed breakdown of 30+ type definitions
4. **Key Client Implementation Classes** - 8+ client classes with complete signatures
5. **Key Issuer Implementation Classes** - Issuer architecture and builders
6. **Metadata Handling Structures** - Metadata discovery and validation flows
7. **Proof Types and Credential Request Handling** - Proof mechanisms and JWT structures
8. **Version-Specific Code Patterns** - V1_0_15 naming conventions and detection logic
9. **Architecture Overview** - Package structure and data flows
10. **Key Statistics** - Code metrics and feature summary

**When to Use**: 
- Need comprehensive technical reference
- Understanding complete type hierarchy
- Learning architectural patterns
- Preparing for version upgrades
- Code review and analysis

### 2. QUICK_REFERENCE.md (Lookup Guide)

**Size**: 287 lines | 8 KB
**Purpose**: Fast lookup and practical coding reference

Condensed guide for developers needing quick answers.

**Contents**:
- Version Status and Constants
- File Locations by Component
- Key Import Statements (Copy-Paste Ready)
- Critical Type Structure Examples
- Common Usage Patterns
- New/Removed Features in v1.0.15
- Package Structure Overview
- Supported Formats and Proof Types
- Common Utility Functions
- Endpoint Reference
- Testing and Documentation Links

**When to Use**:
- Need quick API lookups
- Copy-paste import statements
- Quick type reference
- Understanding file organization
- Finding specific functionality

---

## Key Information at a Glance

### Current Implementation
- **Version**: Draft 15 (v1.0.15)
- **Enum**: `OpenId4VCIVersion.VER_1_0_15 = 1015`
- **Status**: Only version currently supported
- **Earlier Versions**: Explicitly rejected

### Architecture
- **Type Definitions**: `packages/oid4vci-common/lib/types/`
- **Client Code**: `packages/client/lib/`
- **Issuer Code**: `packages/issuer/lib/`
- **Total Code**: ~40KB TypeScript

### Main Components

#### Client (for wallets/holders)
- `OpenID4VCIClientV1_0_15` - State-based client
- `MetadataClientV1_0_15` - Metadata discovery
- `CredentialRequestClientBuilderV1_0_15` - Request building
- `NonceClient` - Nonce endpoint support

#### Issuer (for credential issuers)
- `VcIssuer` - Core issuer state management
- `VcIssuerBuilder` - Configuration builder
- `IssuerMetadataBuilderV1_15` - Metadata construction
- `CredentialSupportedBuilderV1_15` - Credential configs

#### Common Types
- `IssuerMetadataV1_0_15` - Issuer metadata structure
- `CredentialRequestV1_0_15` - Credential request (format removed)
- `CredentialResponseV1_0_15` - Credential response (array format)
- `ProofTypesV1_0_15` - Proof type definitions
- `KeyAttestationJWT` - Key attestation format (NEW)
- `WalletAttestationJWT` - Wallet attestation format (NEW)

### Key Changes in v1.0.15
1. Dedicated Nonce Endpoint (no c_nonce in token response)
2. Batch issuance with `proofs` parameter
3. Credential identifiers in token response
4. Key/Wallet attestations support
5. Removed `format` from credential requests
6. Claims use path pointer notation
7. Simplified error responses

---

## How to Navigate This Documentation

### For Understanding the Codebase
1. Start with **QUICK_REFERENCE.md** for file locations
2. Jump to specific sections in **OID4VCI_CODEBASE_EXPLORATION.md**
3. Reference the quick import statements from QUICK_REFERENCE

### For Implementation Work
1. Check QUICK_REFERENCE for the type you need
2. Get copy-paste imports from QUICK_REFERENCE
3. Refer to OID4VCI_CODEBASE_EXPLORATION for detailed signatures
4. Use code examples from both documents

### For Architecture Understanding
1. Read Executive Summary in OID4VCI_CODEBASE_EXPLORATION
2. Review Architecture Overview section
3. Check Data Flow diagrams
4. Examine Package Structure in QUICK_REFERENCE

### For Version Upgrade Planning
1. Review Version-Specific Code Patterns section
2. Study the V1_0_15 naming conventions
3. Understand version detection logic
4. Review Recommendations section

---

## Cross-Reference Guide

### By Topic

**Types and Interfaces**
- See: OID4VCI_CODEBASE_EXPLORATION.md - Section 2
- Quick Ref: QUICK_REFERENCE.md - Key Type Imports

**Client Implementation**
- See: OID4VCI_CODEBASE_EXPLORATION.md - Section 3
- Code Examples: QUICK_REFERENCE.md - Client Flow pattern

**Issuer Implementation**
- See: OID4VCI_CODEBASE_EXPLORATION.md - Section 4
- Code Examples: QUICK_REFERENCE.md - Issuer Setup pattern

**Metadata Handling**
- See: OID4VCI_CODEBASE_EXPLORATION.md - Section 5
- Quick Ref: QUICK_REFERENCE.md - Metadata Endpoints

**Proof and Credentials**
- See: OID4VCI_CODEBASE_EXPLORATION.md - Section 6
- Types: QUICK_REFERENCE.md - Supported Proof Types

**Version Management**
- See: OID4VCI_CODEBASE_EXPLORATION.md - Section 7
- Patterns: QUICK_REFERENCE.md - Version Status

### By File Location

**packages/oid4vci-common/lib/types/**
- v1_0_15.types.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 2
- Generic.types.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 2
- OpenID4VCIVersions.types.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 1

**packages/client/lib/**
- OpenID4VCIClientV1_0_15.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 3
- CredentialRequestClientBuilderV1_0_15.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 3
- MetadataClientV1_0_15.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 3
- NonceClient.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 3

**packages/issuer/lib/**
- VcIssuer.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 4
- VcIssuerBuilder.ts - OID4VCI_CODEBASE_EXPLORATION.md Section 4
- builder/ - OID4VCI_CODEBASE_EXPLORATION.md Section 4

---

## Key Statistics

- **Total Documentation**: 1,267 lines across 2 files
- **Type Definitions Covered**: 30+
- **Client Classes**: 8+
- **Issuer Classes**: 6+
- **Code Examples**: 15+
- **Architecture Diagrams**: 2+

---

## Useful Commands

```bash
# View the comprehensive analysis
cat OID4VCI_CODEBASE_EXPLORATION.md | less

# View the quick reference
cat QUICK_REFERENCE.md | less

# Search for a specific type
grep -n "CredentialRequestV1_0_15" OID4VCI_CODEBASE_EXPLORATION.md

# Find all v1.0.15 specific patterns
grep -i "new in v15\|removed in v15" OID4VCI_CODEBASE_EXPLORATION.md

# Search for a class definition
grep -n "class.*V1_0_15" OID4VCI_CODEBASE_EXPLORATION.md
```

---

## For Reference: Original Exploration Scope

The exploration covered:
1. Current implementation version and draft support
2. Main types and interfaces (oid4vci-common package)
3. Key client implementation classes
4. Key issuer implementation classes
5. Metadata handling structures
6. Proof types and credential request handling
7. Version-specific code patterns and naming conventions
8. Architecture and package structure
9. Statistics and feature summary

All findings have been documented in the two reference documents.

---

## Notes

- These documents provide a snapshot of the codebase as of November 23, 2025
- The SDK currently only supports v1.0.15 (Draft 15)
- Earlier versions (v1.0.13, v1.0.11) are not supported
- Code uses consistent V1_0_15 naming for all version-specific components
- The @vess-id scope was introduced for OID4VCI 1.0 migration

---

## Next Steps

For v1.0 compliance work:
1. Review the Recommendations section in OID4VCI_CODEBASE_EXPLORATION.md
2. Plan new V1_0 enum and types
3. Create parallel v1_0.types.ts
4. Extend builder pattern to new version
5. Update version detection logic
6. Test version negotiation

The existing V1_0_15 patterns provide an excellent foundation for this work.

---

*Generated: November 23, 2025*
*Location: /Users/kantarofujimori/workspace/vess/v2/backend/sdk/OID4VC/*
