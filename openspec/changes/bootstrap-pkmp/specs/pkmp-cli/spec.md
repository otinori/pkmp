## ADDED Requirements

### Requirement: Execute Verification Suite
システムは、プロジェクト内の全モデルおよびレジストリに対し、一括バリデーション（検証）を実行するコマンドを提供しなければならない。

#### Scenario: Verification Success
- **WHEN** プロジェクト全体がスキーマおよびレジストリ検証をパスする
- **THEN** コマンドは終了コード 0 を返す

#### Scenario: Verification Fail
- **WHEN** いずれかのファイルでスキーマ違反やレジストリ不整合が存在する
- **THEN** コマンドは終了コード 1 とともに詳細な違反エラーを出力する

### Requirement: Execute Regeneration Suite
システムは、全モデルからMarkdownビューを再生成し、最新状態へ同期するコマンドを提供しなければならない。

#### Scenario: Regeneration Sync
- **WHEN** 再生成コマンドが実行され、検証がすべてパスする
- **THEN** 既存のすべてのMarkdownビュー（`docs/*.md`, `records/*.md` など）がYAMLモデルの最新内容に上書きされて同期される
