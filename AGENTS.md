# PKMP — Project Knowledge Modeling Platform

汎用 AI エージェント向けのリポジトリ作法（AntiGravity / Codex / その他 AI ツール共通）。
Claude Code を使う場合は `CLAUDE.md` を参照。

## ミッション

開発活動を通じてノウハウを蓄積し、その再利用によって設計・製造・テストを簡単かつ効率的にする**自己改善ループ**を実現する。

詳細: `docs/pkmp-charter.yaml`

---

## リポジトリの性質

このリポジトリはPKMP自身がPKMPを使って管理されている（自己試行）。
`dist/` が配布物、それ以外はPKMP開発プロジェクト自身のナレッジ資産。

---

## AIのアクセスルール

| パターン | 場所 | AIの操作 |
|---|---|---|
| A1 — ルール・制約 | `registry/lifecycles.yaml` `registry/workflows.yaml` `registry/schemas.yaml` `registry/capabilities.yaml` `registry/repository.yaml` `.pkmp/` `CLAUDE.md` `AGENTS.md` `README.md` | 読むだけ |
| A2 — データレジストリ | `registry/documents.yaml` `registry/records.yaml` | 登録・状態更新のみ（削除不可） |
| B — Canonical | `docs/*.yaml` `records/*.yaml` | 判断して作成・更新する |
| C — Export/View | `views/**/*.md` | 生成するだけ。絶対に手動編集しない |
| D — 人間からの入力 | `inbox/` | 読んで処理する。処理後は `inbox/processed/` へ移動 |
| E — 追記専用 | `provenance/` | 追記のみ。既存内容を変更しない |

**Canonical（B）を変更したら必ず `pkmp-regenerate` スキルでView（C）を再生成する。**

---

## レジストリが唯一の入口

すべてのPKMP管理対象は `registry/` に登録されている。

```
registry/documents.yaml   — ドキュメント（docs/*.yaml）の一覧
registry/records.yaml     — レコード（records/*.yaml）の一覧
registry/capabilities.yaml — 使用するツール・プロバイダー設定
registry/lifecycles.yaml  — アーティファクトの状態遷移ルール
registry/workflows.yaml   — いつ・何を・どうやって作るかのルール
registry/schemas.yaml     — スキーマ定義の一覧
registry/repository.yaml  — プロジェクト基本情報
```

新しいファイルを `docs/` や `records/` に作成したら、必ず対応するレジストリに登録する。
レジストリにないファイルはPKMPの管理外となる。

---

## スキルの使いどき

スキル定義は `.agent/skills/pkmp-*/SKILL.md` にある。
各ツールの呼び出し構文はツールのドキュメントを参照。

| トリガー | 使うスキル |
|---|---|
| `inbox/` にファイルがある | `pkmp-process-inbox` |
| SDD作業を始める前にSPECが必要 | `pkmp-spec-assist` |
| 設計・技術的な判断が生まれた | `pkmp-capture-decision` |
| SDDのChangeがアーカイブされた | `pkmp-capture-learnings` |
| Canonical YAMLを変更した | `pkmp-regenerate` |
| コミット前・整合性確認 | `pkmp-verify` |
| 新規プロジェクトにセットアップ | `pkmp-init` |
| 承認済みのPIレコードがある | `pkmp-apply-process-improvement` |
| PKMPスキル・コードの品質向上を自律的に進めたいとき | `pkmp-simulate` |

ワークフローの詳細（ステップ・成果物）は `registry/workflows.yaml` を参照。
ライフサイクルルール（状態遷移）は `registry/lifecycles.yaml` を参照。

---

## エコシステム連携

PKMPは単独ではなく専門ツールと連携する。使用するプロバイダーは `registry/capabilities.yaml` で設定されている。

| 機能 | プロバイダー | フォールバック |
|---|---|---|
| 設計判断の記録 | **UDR** (`.udr/`) | pkmp-builtin (`records/DC-*.yaml`) |
| SPEC要件の多視点審議 | **Conclave** (`.conclave/`) | pkmp-builtin（単一AI下書き） |
| 実装タスク管理 | **OpenSpec** (`openspec/`) | PKMPが補完 |

各スキルは `registry/capabilities.yaml` を読んでプロバイダーを自動決定する。

---

## ライフサイクル

| アーティファクト | 初期状態 | 承認者 |
|---|---|---|
| Document | Draft → InReview → Published | **Human**のみPublished可 |
| Record | Draft → Published | AI可（レビュー不要） |
| Spec | Draft → Reviewed → Approved → Implemented | **Human**のみApproved可 |

---

## 絶対にしてはいけないこと

- `views/` 配下のファイルを手動編集する（再生成で上書きされる）
- `registry/` に登録せずに `docs/` や `records/` にファイルを作る
- Document や Spec を人間の承認なしに `Published` / `Approved` にする
- `provenance/` の既存ファイルを変更する（追記専用）
- `pkmp-verify` が失敗した状態でコミットする
- PKMP設定（workflows.yaml, lifecycles.yaml, schemas）を人間の承認なしに変更する
