## Context

PKMP (Project Knowledge Modeling Platform) の設計仕様（v1.0）に従って、プロジェクト知識を管理するための自己記述型リポジトリを新規構築します。
既存の会話履歴に依存せず、YAMLモデル、スキーマ、レジストリによって構成される「セルフホスティング」可能な環境（Phase 3）を構築する必要があります。

## Goals / Non-Goals

**Goals:**
- PKMP仕様 §7 に準拠するディレクトリ構造を初期作成する。
- メタスキーマ（Document, Record, Capability, Registry）および初期モデル（設計仕様書、DC-001/DC-002、レジストリ）をYAMLで作成する。
- 実行可能な Capability（マークダウンレンダラー、スキーマバリデータ、レジストリバリデータ）を実装する。
- バリデーションとMarkdownビュー生成を一括実行できる `pkmp` コマンドライン（CLI）ツールを実装する。
- バリデーションエラーがない状態で、すべてのMarkdownビューがYAMLモデルから正しく再生成されることを実証する（セルフホスティング Phase 3 の達成）。

**Non-Goals:**
- HTML, PDF, Wiki レンダラーの実装（これらは将来のフェーズで対応）。
- `extractor.knowledge`（会話からの自動抽出機能）の実装（DC-002にて保留決定）。
- Web-UI（ダッシュボード）やエディタ拡張の実装。

## Decisions

### Decision 1: 実装言語および実行環境
- **決定**: Node.js (ES Modules, JavaScript) を使用する。
- **理由**:
  - AIおよび人間にとって読み書きしやすく、JSONやYAMLのパーサー、バリデータライブラリ（`jsonschema` や `yaml`）が充実しているため。
  - プロジェクトに `package.json` を導入し、依存パッケージ（`jsonschema`, `yaml`）を管理する。
- **代替案**:
  - Python: YAMLやJSON Schemaのサポートは良いが、Node.jsの方が将来のWebダッシュボードやエディタ拡張（VSCode等）への拡張性が高いため見送り。

### Decision 2: YAML/JSON Schema のバリデーション
- **決定**: 標準的な `jsonschema` ライブラリ（Node.js）を使用し、YAMLモデルをJSONオブジェクトにパースしてからJSON Schemaに対して検証を行う。
- **理由**:
  - YAMLはJSONと構造的に互換性があり、既存の強力なJSON Schemaバリデータを利用できるため。

### Decision 3: レジストリ整合性検証の仕様
- **決定**: レジストリファイル（`registry/*.yaml`）に定義されたパス一覧と、実際の `docs/`、`records/`、`capabilities/` 内のYAMLファイルの存在を双方向でスキャンして検証する。
- **理由**:
  - 「未登録のモデルファイルが存在しないこと」および「登録されているが実ファイルが存在しないこと」の両方を検出し、自己記述性を担保するため。

## Risks / Trade-offs

- **[Risk] YAMLの記述難易度** → [Mitigation] スキーマ定義を明確にし、エディタでのバリデーション（YAML LSP等）と `pkmp verify` コマンドによって迅速にエラーを検知できるようにする。
- **[Risk] ビューの手動修正の衝突** → [Mitigation] Markdownファイルに `<!-- GENERATED VIEW - DO NOT EDIT -->` という警告ヘッダーを挿入し、開発者がMarkdownを直接修正するのを防ぐ。
