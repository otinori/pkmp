## ADDED Requirements

### Requirement: Validate Model against Schema
システムは、YAML形式のモデルファイルが `knowledge/schemas/` にある対応スキーマに準拠しているか検証しなければならない。

#### Scenario: Schema Validation Success
- **WHEN** 正しいフォーマットのYAMLモデルを検証する
- **THEN** バリデータは検証パス（エラーなし）の結果を返却する

#### Scenario: Schema Validation Failure
- **WHEN** 必須フィールドが欠落した不正なYAMLモデルを検証する
- **THEN** バリデータはエラーを検出し、違反したフィールドとエラー内容を出力する

### Requirement: Validate Registry Consistency
システムは、`registry/` 配下の構成インデックス情報と、実際のファイルシステムの構成（ディレクトリ構造、登録対象ファイル）が一致しているかを検証しなければならない。

#### Scenario: Registry Check
- **WHEN** レジストリ整合性検証が実行される
- **THEN** 未登録のYAMLファイルや、レジストリ上は存在するがファイルシステム上存在しないファイルの有無を確認して結果を出力する
