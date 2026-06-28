## ADDED Requirements

### Requirement: Generate Markdown View from Model
システムは、YAML形式のモデルファイルを読み込み、同じディレクトリに同名のMarkdownファイル（ビュー）を自動生成しなければならない。

#### Scenario: Successful Markdown Generation
- **WHEN** 指定された `docs/some-doc.yaml` からMarkdownがレンダリングされる
- **THEN** 対応する `docs/some-doc.md` が生成され、YAML内の情報がMarkdown形式で出力される

### Requirement: Generate Aggregate Index Views
システムは、レジストリ情報（`registry/records.yaml` など）を参照して、全Decision Recordのメタ情報などのインデックス一覧を `views/` ディレクトリ配下にMarkdownで生成しなければならない。

#### Scenario: Verify Index Creation
- **WHEN** 横断的なインデックス生成処理が実行される
- **THEN** `views/` 配下に最新の意思決定記録一覧等を含むMarkdownドキュメントが生成される
