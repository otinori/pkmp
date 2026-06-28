## ADDED Requirements

### Requirement: Scaffold Directory Structure
システムは、PKMP仕様に従い、リポジトリの初期ディレクトリ構造を作成または補完しなければならない。

#### Scenario: Verify Directory Creation
- **WHEN** ブートストラップ処理が実行される
- **THEN** リポジトリルートに `knowledge/information-model/`, `knowledge/schemas/`, `docs/`, `records/`, `capabilities/`, `views/`, `registry/`, `provenance/` が存在する

### Requirement: Initial Schema and Model Deploy
システムは、Phase 0に必要なメタスキーマ、初期モデルYAML、およびレジストリファイルを規定のパスに生成または配備しなければならない。

#### Scenario: Verify File Deployment
- **WHEN** ブートストラップ処理が完了した状態
- **THEN** `knowledge/schemas/` に `document.schema.yaml` や `record.schema.yaml` が作成され、`registry/` に `repository.yaml` や `documents.yaml` が存在する

### Requirement: Save Provenance Documents
システムは、設計の源泉となった元のドキュメントを `provenance/` 配下にコピーし、変更不可の履歴（退避履歴）として保存しなければならない。

#### Scenario: Provenance Preservation
- **WHEN** ブートストラップ処理が実行される
- **THEN** `provenance/` に `PKMP_DESIGN_v1.md` などの元のファイルが未変更のまま保存される
