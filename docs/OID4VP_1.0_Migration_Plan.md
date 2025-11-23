# OID4VP 1.0 対応計画書

## 現状分析

### 現在のSDK対応バージョン
- **メインバージョン**: Draft 28 (D28) - `SIOPv2_OID4VP_D28 = 280`
- **一部対応**: v1 (1.0) - `OID4VP_v1 = 1000` (型定義は存在)
- **パッケージ名**: `@vess-id/did-auth-siop@0.20.0`

### 確認されたDraft 28サポートの証拠
1. `AuthorizationRequestPayloadD28` 型定義
2. `SupportedVersion.SIOPv2_OID4VP_D28 = 280`
3. コメント: "REQUIRED before OID4VP v18, now optional because of response_uri"

## Draft 29 → 1.0 への主要な変更点

### 1. **mdoc Session Transcript (重要度: 高)**
- **変更内容**: redirect-based OID4VP flowのためのmdoc session transcript定義
- **影響範囲**: ISO mdoc関連の処理、SessionTranscript構造
- **対応**: mdoc session transcript処理ロジックの実装

### 2. **パラメータ名変更 (重要度: 高)**
- **変更内容**: `verifier_attestations` → `verifier_info`
- **影響範囲**:
  - `AuthorizationRequestPayloadD28.verifier_attestations`
  - `AuthorizationRequestPayloadV1.verifier_info`
- **対応**: 型定義の統一、下位互換性の維持

### 3. **DCQLのmeta必須化 (重要度: 中)**
- **変更内容**: DCQL queryの`meta`パラメータが必須に
- **影響範囲**: DCQL処理、バリデーション
- **対応**: バリデーションロジックの追加

### 4. **非空配列の明示化 (重要度: 中)**
- **変更内容**: 各種配列が非空である必要があることを明示的に記載
- **影響範囲**: すべての配列パラメータのバリデーション
- **対応**: バリデーション関数の追加/強化

### 5. **暗号化キー取得の明確化 (重要度: 低)**
- **変更内容**: 暗号化キーの取得方法に関するテキストの明確化
- **影響範囲**: ドキュメント、実装ガイド
- **対応**: コメント・ドキュメントの更新

### 6. **transaction_data_hashesのハッシュ処理明確化 (重要度: 中)**
- **変更内容**: transaction_data_hashesでのハッシュ処理方法の明確化
- **影響範囲**: Transaction Data処理
- **対応**: ハッシュ処理実装の検証・修正

### 7. **プライバシー考慮事項の拡充 (重要度: 低)**
- **変更内容**: プライバシー考慮事項セクションの再構成と拡張
- **影響範囲**: ドキュメント
- **対応**: ドキュメント追加

### 8. **用語の大文字化統一 (重要度: 低)**
- **変更内容**: 定義された用語の大文字使用の一貫性向上
- **影響範囲**: ドキュメント、コメント
- **対応**: ドキュメント修正

### 9. **署名検証要件の緩和 (重要度: 中)**
- **変更内容**: Walletが常に署名検証を実行する必要がある言語を緩和
- **影響範囲**: 検証ロジック
- **対応**: 検証ロジックの柔軟性向上

### 10. **direct_post.jwtの明確化 (重要度: 中)**
- **変更内容**: direct_post.jwtがdirect_postの上に構築されることを明確化
- **影響範囲**: Response Mode処理
- **対応**: ドキュメント・実装の明確化

### 11. **IANA考慮事項の追加 (重要度: 低)**
- **変更内容**: `encrypted_response_enc_values_supported`のIANA考慮事項追加
- **影響範囲**: メタデータ定義
- **対応**: メタデータ型定義の確認

### 12. **Response暗号化の例追加 (重要度: 低)**
- **変更内容**: Response暗号化の例を追加
- **影響範囲**: ドキュメント、テスト
- **対応**: サンプルコード・テストの追加

### 13. **クロスデバイスフロー図の注記 (重要度: 低)**
- **変更内容**: クロスデバイスフロー図がすべてのパラメータを表示していないことの注記
- **影響範囲**: ドキュメント
- **対応**: ドキュメント更新

---

## Draft 28 → Draft 29 の主要変更 (参考)

### Draft 28での主要変更:
1. **アルゴリズム名変更**: `issuer_signed_alg_values`と`device_signed_alg_values`のリネーム、HMAC variantsサポート追加
2. **JWE暗号化パラメータ**: JARMの`authorization_encrypted_response_enc`を新しい`encrypted_response_enc_values_supported`に置換

---

## 既存のv1対応状況

### 既に実装済みの機能:
1. ✅ `SupportedVersion.OID4VP_v1 = 1000` 定義
2. ✅ `AuthorizationRequestPayloadV1` 型定義
3. ✅ `response_uri` パラメータサポート
4. ✅ `dcql_query` パラメータサポート
5. ✅ `request_uri_method` パラメータサポート (Draft 26で追加)
6. ✅ `verifier_info` パラメータ (Draft 29で`verifier_attestations`から改名)

### 未対応・要確認の機能:
1. ❌ mdoc session transcript for redirect-based flow
2. ⚠️ `verifier_attestations` → `verifier_info` の完全移行
3. ⚠️ DCQL `meta`パラメータの必須化バリデーション
4. ⚠️ 非空配列の厳格なバリデーション
5. ❌ transaction_data_hashesのハッシュ処理検証
6. ⚠️ Response暗号化の完全実装

---

## 対応フェーズ計画

### Phase 1: 型定義の完全移行 (優先度: 高)
**目標**: Draft 29 → 1.0の型定義を完全に実装

1. **verifier_attestations → verifier_info 移行**
   - `AuthorizationRequestPayloadD28`の非推奨化
   - `AuthorizationRequestPayloadV1`への統一
   - 下位互換性のための型ガード実装

2. **非空配列型の定義**
   - `NonEmptyArray<T>` 型の全面適用
   - 配列パラメータのバリデーション強化

3. **バージョン検出ロジックの更新**
   - `SupportedVersion.OID4VP_v1`の完全サポート
   - バージョン判定ロジックの見直し

**成果物**:
- `types/SIOP.types.ts` 更新
- `types/V1_0.types.ts` 新規作成 (v1.0専用型)
- バリデーション関数群

**推定工数**: 2-3日

---

### Phase 2: DCQL処理の強化 (優先度: 高)
**目標**: DCQLのmeta必須化と配列バリデーション

1. **meta必須化**
   - DCQL queryバリデーションの更新
   - エラーハンドリング強化

2. **非空配列バリデーション**
   - `credentials` 配列の非空チェック
   - `claims` 配列の非空チェック
   - `credential_sets` の options 配列チェック

3. **DCQL処理ロジックの検証**
   - 既存の処理ロジックがDraft 29/1.0に準拠しているか確認

**成果物**:
- `helpers/DcqlUtils.ts` 更新
- バリデーション関数追加

**推定工数**: 1-2日

---

### Phase 3: mdoc Session Transcript対応 (優先度: 高)
**目標**: redirect-based flowのmdoc session transcript実装

1. **SessionTranscript構造の実装**
   - CBOR encoding/decoding
   - OpenID4VPHandover構造
   - DeviceEngagement/EReaderKeyの処理

2. **mdoc関連処理の更新**
   - ISO 18013-5 準拠の確認
   - Session transcript生成・検証ロジック

**成果物**:
- `helpers/MdocSessionTranscript.ts` 新規作成
- mdoc処理関連の更新

**推定工数**: 3-4日

---

### Phase 4: Response処理の強化 (優先度: 中)
**目標**: Response Mode、暗号化、署名検証の最適化

1. **direct_post.jwt 処理**
   - direct_postとの関係明確化
   - 実装の検証

2. **Response暗号化**
   - `encrypted_response_enc_values_supported`対応
   - JWE処理の検証

3. **署名検証の柔軟化**
   - 必須検証と任意検証の分離
   - 検証オプションの追加

**成果物**:
- `authorization-response/` 配下の更新
- Response処理テストの追加

**推定工数**: 2-3日

---

### Phase 5: Transaction Data処理 (優先度: 中)
**目標**: transaction_data_hashes のハッシュ処理検証

1. **ハッシュアルゴリズム処理**
   - sha-256デフォルト対応
   - `transaction_data_hashes_alg`パラメータ処理

2. **KB-JWT処理**
   - Key Binding JWTの`transaction_data_hashes`含有
   - ハッシュ検証ロジック

**成果物**:
- Transaction Data処理関数
- テストケース追加

**推定工数**: 1-2日

---

### Phase 6: パッケージ移行 (優先度: 高)
**目標**: @vess-id スコープへの移行とバージョンアップ

1. **パッケージ名変更**
   - `@vess-id/did-auth-siop` → `@vess-id/siop-oid4vp@1.0.0`

2. **依存関係更新**
   - 他パッケージからの参照更新

3. **バージョン管理**
   - 1.0.0 としてリリース準備

**成果物**:
- `package.json` 更新
- 依存関係の整合性確認

**推定工数**: 0.5日

---

### Phase 7: テスト・ドキュメント (優先度: 中)
**目標**: 包括的テストとドキュメント整備

1. **テストケース追加**
   - Draft 29/1.0 固有機能のテスト
   - 下位互換性テスト
   - E2Eテスト

2. **ドキュメント更新**
   - README更新
   - Migration Guide作成
   - API ドキュメント更新

**成果物**:
- テストスイート
- ドキュメント一式

**推定工数**: 2-3日

---

## 詳細変更マッピング

### ファイル別対応内容

#### 1. `lib/types/SIOP.types.ts`
```typescript
// 【現状】
export interface AuthorizationRequestPayloadD28 {
  verifier_attestations?: RelyingPartyAttestation[]
}

export interface AuthorizationRequestPayloadV1 {
  verifier_info?: RelyingPartyAttestation[]
}

export enum SupportedVersion {
  SIOPv2_OID4VP_D28 = 280,
  OID4VP_v1 = 1000,
}

// 【変更後】
// D28を非推奨化、V1に統一
export interface AuthorizationRequestPayloadV1_0 {
  verifier_info?: RelyingPartyAttestation[] // Renamed from verifier_attestations in Draft 29
  dcql_query: Record<string, any> // meta now REQUIRED in DCQL
  request_uri_method?: RequestUriMethod
  transaction_data?: string[]
}

// 下位互換のため残す
/** @deprecated Use AuthorizationRequestPayloadV1_0 instead */
export interface AuthorizationRequestPayloadD28 extends AuthorizationRequestPayloadV1_0 {
  /** @deprecated Use verifier_info instead */
  verifier_attestations?: RelyingPartyAttestation[]
}

export enum SupportedVersion {
  /** @deprecated Use OID4VP_v1_0 instead */
  SIOPv2_OID4VP_D28 = 280,
  OID4VP_v1_0 = 10000, // 1.0.0 in numeric form
}
```

#### 2. `lib/types/V1_0.types.ts` (新規作成)
```typescript
/**
 * OID4VP 1.0 (Final) 専用型定義
 */

// Non-empty array helper
export type NonEmptyArray<T> = [T, ...T[]]

// DCQL Query with mandatory meta
export interface DcqlQueryV1_0 {
  credentials: NonEmptyArray<DcqlCredentialQuery>
  credential_sets?: DcqlCredentialSet[]
}

export interface DcqlCredentialQuery {
  id: string
  format: string
  meta: Record<string, any> // REQUIRED in v1.0
  claims?: NonEmptyArray<DcqlClaim>
  claim_sets?: NonEmptyArray<string[]>
}

// mdoc Session Transcript
export interface MdocSessionTranscript {
  DeviceEngagementBytes: null
  EReaderKeyBytes: null
  Handover: OpenID4VPHandover
}

export interface OpenID4VPHandover {
  handoverType: 'OpenID4VPHandover'
  nonce: string
  verifierPublicKey: string // JWK thumbprint or key material
}

// Response encryption
export interface EncryptedResponseMetadata {
  encrypted_response_enc_values_supported?: NonEmptyArray<string>
  encrypted_response_alg_values_supported?: NonEmptyArray<string>
}

// Transaction Data
export interface TransactionDataRequest {
  type: string
  credential_ids: NonEmptyArray<string>
  transaction_data_hashes_alg?: NonEmptyArray<string> // Default: ["sha-256"]
}

export interface TransactionDataResponse {
  transaction_data_hashes: NonEmptyArray<string>
  transaction_data_hashes_alg?: string
}
```

#### 3. `lib/helpers/ValidationUtils.ts` (新規作成)
```typescript
/**
 * OID4VP 1.0 Validation Utilities
 */

export function isNonEmptyArray<T>(arr: T[] | undefined, fieldName: string): arr is [T, ...T[]] {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    throw new Error(`${fieldName} must be a non-empty array (OID4VP 1.0 requirement)`)
  }
  return true
}

export function validateDcqlQuery(query: any): boolean {
  // meta is REQUIRED in v1.0
  if (!query.credentials || !Array.isArray(query.credentials)) {
    throw new Error('credentials must be a non-empty array')
  }

  for (const cred of query.credentials) {
    if (!cred.meta) {
      throw new Error(`meta parameter is REQUIRED in DCQL credential query (OID4VP 1.0 requirement)`)
    }

    if (cred.claims && !isNonEmptyArray(cred.claims, 'claims')) {
      return false
    }
  }

  return true
}

export function validateVerifierInfo(verifierInfo: any[]): boolean {
  return isNonEmptyArray(verifierInfo, 'verifier_info')
}

export function validateTransactionData(txData: any): boolean {
  if (!txData.credential_ids || !isNonEmptyArray(txData.credential_ids, 'credential_ids')) {
    return false
  }
  return true
}
```

#### 4. `lib/helpers/MdocSessionTranscript.ts` (新規作成)
```typescript
/**
 * ISO mdoc Session Transcript for redirect-based OID4VP flow
 * Based on ISO 18013-5 and OID4VP 1.0 Draft 29
 */

import { encode, decode } from 'cbor'

export interface SessionTranscriptParams {
  nonce: string
  verifierPublicKeyThumbprint: string
}

export function createOpenID4VPHandover(params: SessionTranscriptParams): Buffer {
  // OpenID4VPHandover = [
  //   "OpenID4VPHandover",
  //   nonce,
  //   verifierPublicKeyThumbprint
  // ]
  const handover = [
    'OpenID4VPHandover',
    params.nonce,
    Buffer.from(params.verifierPublicKeyThumbprint, 'base64url')
  ]

  return encode(handover)
}

export function createSessionTranscript(handover: Buffer): Buffer {
  // SessionTranscript = [
  //   DeviceEngagementBytes,  // null for OID4VP
  //   EReaderKeyBytes,        // null for OID4VP
  //   Handover
  // ]
  const sessionTranscript = [
    null,  // DeviceEngagementBytes
    null,  // EReaderKeyBytes
    decode(handover)
  ]

  return encode(sessionTranscript)
}

export function verifySessionTranscript(
  sessionTranscriptBytes: Buffer,
  expectedNonce: string,
  expectedThumbprint: string
): boolean {
  try {
    const sessionTranscript = decode(sessionTranscriptBytes)

    if (!Array.isArray(sessionTranscript) || sessionTranscript.length !== 3) {
      return false
    }

    const [deviceEngagement, eReaderKey, handover] = sessionTranscript

    // For OID4VP, first two elements must be null
    if (deviceEngagement !== null || eReaderKey !== null) {
      return false
    }

    if (!Array.isArray(handover) || handover.length !== 3) {
      return false
    }

    const [type, nonce, thumbprint] = handover

    if (type !== 'OpenID4VPHandover') {
      return false
    }

    if (nonce !== expectedNonce) {
      return false
    }

    const thumbprintStr = Buffer.from(thumbprint).toString('base64url')
    if (thumbprintStr !== expectedThumbprint) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}
```

---

## リスク評価

### 高リスク
1. **下位互換性の破壊**: Draft 28クライアントとの互換性維持が必要
   - **対策**: 型ガード、バージョン検出ロジックの維持

2. **mdoc Session Transcript実装の複雑さ**: CBOR処理、ISO標準準拠
   - **対策**: 既存のCBORライブラリ活用、段階的実装

### 中リスク
1. **DCQL meta必須化**: 既存クエリの破壊的変更
   - **対策**: バリデーションオプション、マイグレーションガイド

2. **テストカバレッジ**: 88ファイルの広範な変更
   - **対策**: 段階的テスト、E2Eテスト強化

### 低リスク
1. **パッケージ名変更**: npm公開への影響
   - **対策**: @vess-idスコープで新規公開、移行ガイド提供

---

## 成功基準

### 必須要件
1. ✅ すべてのDraft 29/1.0の主要変更が実装されている
2. ✅ 既存のDraft 28クライアントとの下位互換性が維持されている
3. ✅ すべてのビルドが成功する
4. ✅ 既存テストがすべてパスする
5. ✅ @vess-idスコープでnpm公開可能

### 推奨要件
1. ⭐ 新規テストケースでカバレッジ80%以上
2. ⭐ Migration Guideが提供されている
3. ⭐ サンプルコードが1.0に更新されている
4. ⭐ E2Eテストが成功する

---

## 総工数見積もり

| フェーズ | 推定工数 | 優先度 |
|---------|---------|--------|
| Phase 1: 型定義移行 | 2-3日 | 高 |
| Phase 2: DCQL強化 | 1-2日 | 高 |
| Phase 3: mdoc Session Transcript | 3-4日 | 高 |
| Phase 4: Response処理 | 2-3日 | 中 |
| Phase 5: Transaction Data | 1-2日 | 中 |
| Phase 6: パッケージ移行 | 0.5日 | 高 |
| Phase 7: テスト・ドキュメント | 2-3日 | 中 |
| **合計** | **12-17日** | - |

---

## 次のステップ

1. ✅ 本計画書のレビュー・承認
2. ⏭️ Phase 1の実装開始
3. ⏭️ 各フェーズ完了後のコミット・プッシュ
4. ⏭️ 最終的な統合テスト
5. ⏭️ npm公開準備

---

## 参考資料

- OpenID for Verifiable Presentations 1.0 Final Specification
- Draft 29 Document History
- ISO 18013-5 (mdoc)
- Sphereon OID4VP SDK (fork元)
- OID4VCI 1.0対応実績 (本プロジェクト)
