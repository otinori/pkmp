# PKMP Usage Guide

## スキルで使う（推奨）

PKMPはClaudeマーケットプレイスのSkillとして配布されます。
スキルをインストール済みであれば以下で操作できます。

| 操作 | Claude Code | AntiGravity |
|---|---|---|
| 初期化 | `/pkmp:init` | `pkmp-init` |
| 検証 | `/pkmp:verify` | `pkmp-verify` |
| 再生成 | `/pkmp:regenerate` | `pkmp-regenerate` |
| inbox処理 | `/pkmp:process-inbox` | `pkmp-process-inbox` |
| SPEC作成 | `/pkmp:spec-assist` | `pkmp-spec-assist` |
| 判断記録 | `/pkmp:capture-decision` | `pkmp-capture-decision` |
| ノウハウ蓄積 | `/pkmp:capture-learnings` | `pkmp-capture-learnings` |

各スキルの詳細は `.agent/skills/pkmp-*/SKILL.md` を参照。

---

## CLIで使う（PKMP開発者向け）

```bash
npm install
```

### verify — 検証

```bash
node .pkmp/bin/pkmp.js verify
# または
npm run verify
```

チェック内容:
1. **スキーマ検証** — 全Canonical YAMLを対応スキーマで検証
2. **レジストリ検証** — 登録ファイルの存在確認・登録漏れチェック

```
=== PKMP Verify ===

--- Schema Validation ---
  All schemas valid.

--- Registry Validation ---
  Registry is consistent with file system.

=== All checks passed. ===
```

### regenerate — 再生成

```bash
node .pkmp/bin/pkmp.js regenerate
# または
npm run regenerate
```

生成内容:
1. `docs/*.yaml` → `views/docs/*.md`
2. `records/*.yaml` → `views/records/*.md`
3. `views/all-decision-records.md`（Decision Recordインデックス）

---

## 開発ワークフロー

### 新しいDocumentを追加する

1. `docs/<id>.yaml` を作成（スキーマ: `.pkmp/schemas/document.schema.yaml`）
2. `registry/documents.yaml` にエントリを追加（`views: [views/docs/<id>.md]`）
3. `npm run verify` で検証
4. `npm run regenerate` でMarkdownビューを生成

### 新しいDecision Recordを追加する

1. `records/<id>.yaml` を作成（スキーマ: `.pkmp/schemas/record.schema.yaml`）
2. `registry/records.yaml` にエントリを追加（`views: [views/records/<id>.md]`）
3. `npm run verify` で検証
4. `npm run regenerate` でビューと横断インデックスを再生成

---

## ファイルロール早見表

| 場所 | パターン | AIの操作 |
|---|---|---|
| `registry/` `.pkmp/` | A — ルール | 読むだけ |
| `docs/*.yaml` `records/*.yaml` | B — Canonical | 判断して作成・更新 |
| `views/**/*.md` | C — Export | 生成のみ。手動編集不可 |
| `inbox/` | D — 人間入力 | 読んで処理 |
| `provenance/` | E — 追記専用 | 追記のみ |
