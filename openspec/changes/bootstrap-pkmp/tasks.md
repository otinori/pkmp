## 1. Phase 0 — Scaffold and Data Initialization

- [x] 1.1 PKMPリポジトリのディレクトリ構造（`knowledge/`, `docs/`, `records/`, `capabilities/`, `views/`, `registry/`, `provenance/`）を作成する
- [x] 1.2 Node.jsプロジェクト環境の設定（`package.json` の作成と、`yaml`, `jsonschema` などの依存モジュールのインストール）を行う
- [x] 1.3 `knowledge/schemas/` 配下に、Document, Record (Decision Record含む), Capability, RegistryのYAML Schemaファイルを作成する
- [x] 1.4 設計仕様書（`docs/pkmp-design-v1.yaml`）、DC-001/DC-002（`records/DC-001.yaml`, `records/DC-002.yaml`）、レジストリファイル（`registry/*.yaml`）の初期YAMLモデルを作成する
- [x] 1.5 源泉ドキュメント（`require/PKMP_DESIGN_v1.md`、`require/samples/work.md`、`require/samples/PKMP_PROJECT_KNOWLEDGE_v1.0.md`）を `provenance/` 配下に配置する

## 2. Phase 1 — Markdown Renderer Implementation

- [x] 2.1 YAMLモデルをパースし、対応するMarkdownビュー（`docs/*.md`, `records/*.md`）を自動生成するマークダウンレンダラー（`renderer.markdown`）を `lib/renderers/markdown.js` に実装する
- [x] 2.2 `registry/records.yaml` などのメタファイルから横断インデックス（`views/all-decision-records.md` など）を自動生成するインデックスレンダラーを実装する

## 3. Phase 2 — Validator Implementation

- [x] 3.1 YAMLモデルファイルを対応するJSON Schemaで検証するスキーマバリデータ（`validator.schema`）を `lib/validators/schema.js` に実装する
- [ ] 3.2 ファイルシステムの配置と `registry/` 内の定義が一致しているかを検証するレジストリバリデータ（`validator.registry`）を `lib/validators/registry.js` に実装する

## 4. Phase 3 — Integration and CLI Setup

- [ ] 4.1 検証（verify）と再生成（regenerate）のコマンドを提供する CLI ツールを `bin/pkmp.js` に実装する
- [ ] 4.2 リポジトリ全体で検証と再生成を実行し、エラーが発生せず、すべてのMarkdownビューがYAMLから自己再生成されることを検証する
