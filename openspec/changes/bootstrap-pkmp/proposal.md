## Why

PKMP (Project Knowledge Modeling Platform) は、AIと人間が協調してプロジェクト知識を長期間維持するためのプラットフォームです。本変更は、PKMP設計仕様（v1.0）に従って、自己記述型のPKMPリポジトリの初期ディレクトリ構造、メタレベルのスキーマ群、初期モデル群、および最小限の実行可能機能（マークダウンレンダラー、スキーマバリデータ、レジストリバリデータ、CLI）を実装し、リポジトリが自己再生成・自己検証可能なセルフホスティング状態（Phase 3）に到達することを目的とします。

## What Changes

- **初期ディレクトリ構造の構築**: PKMP仕様のトップレベルホワイトリストに従い、`knowledge/`（情報モデルとスキーマ）、`docs/`、`records/`、`capabilities/`、`views/`、`registry/`、`provenance/` ディレクトリを作成。
- **メタ情報および初期モデルの定義 (Phase 0)**: Document, Record (Decision Record), Capability, Registry のYAMLスキーマを作成し、初期モデル（設計仕様書、DC-001/DC-002、レジストリ定義等）をYAMLで配置。
- **マークダウンレンダラーの実実装 (Phase 1)**: YAMLモデルを読み込んでMarkdownビュー（`docs/*.md`, `records/*.md`）を生成する `renderer.markdown` Capability を実装。
- **バリデータの実実装 (Phase 2)**: YAMLモデルのスキーマ検証を行う `validator.schema` およびファイル配置のレジストリ整合性検証を行う `validator.registry` Capability を実装。
- **セルフホスティングCLIツールの実装 (Phase 3)**: 上記のバリデータとレンダラーを統合して実行する、プロジェクト内のコマンドラインツール（検証、再生成機能）の実装。

## Capabilities

### New Capabilities

- `pkmp-bootstrap`: PKMPリポジトリの初期ディレクトリ構造、スキーマ、初期モデルを生成するジェネレータ。
- `pkmp-renderer-markdown`: YAML形式のモデル（Document/Record）からMarkdownビューを生成・更新するレンダラー。
- `pkmp-validator`: モデルのスキーマ整合性（YAML検証）およびレジストリとファイルの対応（レジストリ検証）を行うバリデータ。
- `pkmp-cli`: 開発セッションの最後に実行し、検証、再生成、Draft Packageの構築などを自動化するコマンドラインインターフェース。

### Modified Capabilities

<!-- 既存のCapabilityはないため空のままにします -->

## Impact

新規プロジェクトとしての立ち上げであるため、既存のソースコードやシステムへの影響はありません。本変更により、リファレンスプロジェクト（SRMなど）やPKMP自身の今後の設計変更を管理するための、堅牢で検証可能な知識モデリング基盤が提供されます。
