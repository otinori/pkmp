# PKMP — Project Knowledge Modeling Platform

> **Beta — 検証公開中**
> このリポジトリは現在 **ベータ版** です。AI-native 開発における再利用可能なナレッジ管理アセットとして機能するかを検証するために公開しています。実運用での試行を通じてフィードバックを収集し、改善を続けます。API・構造・スキーマは予告なく変更される可能性があります。

開発活動を通じてノウハウを蓄積し、その再利用によって設計・製造・テストを簡単かつ効率的にする**自己改善ループ**を実現するプラットフォーム。

## 何をするものか

PKMPは**開発知識をYAMLモデルで管理**し、Markdownビューを自動生成します。

```
YAML Canonical (docs/*.yaml, records/*.yaml)
  └─ pkmp-regenerate
       └─ Markdown View (views/**/*.md)
```

- **YAMLが唯一の正（Canonical）** — Markdownは生成物であり編集しない
- **Registryが唯一の入口** — `registry/` を読めばリポジトリ構造がすべてわかる
- **SDD非依存** — OpenSpec / Conclave / UDR など任意のツールと連携

## ディレクトリ構造

```
pkmp/
├── CLAUDE.md / AGENTS.md        ← AIへのブートインストラクション
├── dist/                        ← pkmp-init でコピーされる配布テンプレート
│   ├── registry/                ← 配布用ビルトイン定義（lifecycle/workflow/schema/capability）
│   └── inbox/
│
├── .pkmp/                       ← PKMPツール（開発者向け）
│   ├── bin/pkmp.js              ← CLI（verify / regenerate）
│   ├── lib/                     ← バリデータ・レンダラー実装
│   └── schemas/                 ← スキーマ定義
│
├── skills/                      ← プラグイン用スキルエントリポイント（symlink）
├── .agent/skills/pkmp-*/        ← PKMPスキル定義実体（AgentSkills標準ロケーション）
│
├── registry/                    ← リポジトリ自己記述メタデータ（唯一の入口）
│   ├── documents.yaml           ← ドキュメント一覧
│   ├── records.yaml             ← レコード一覧
│   ├── capabilities.yaml        ← ツール・プロバイダー設定
│   ├── lifecycles.yaml          ← 状態遷移ルール
│   ├── workflows.yaml           ← いつ・何を・どうやって作るかのルール
│   ├── schemas.yaml             ← スキーマ定義一覧
│   └── repository.yaml          ← プロジェクト基本情報
│
├── docs/                        ← ドキュメントモデル（Canonical YAML）
├── records/                     ← レコードモデル（Canonical YAML）
├── views/                       ← 生成ビュー（編集不可）
│   ├── docs/                    ← ドキュメントのMarkdownビュー
│   ├── records/                 ← レコードのMarkdownビュー
│   └── all-records.md           ← 全レコードインデックス
│
├── inbox/                       ← 人間→AIへの入力（要件・承認等）
└── provenance/                  ← 源泉ドキュメント（追記のみ）
```

## インストール

### Claude Code プラグインとして（推奨）

```bash
# マーケットプレイスを登録（初回1回）
claude plugin marketplace add https://github.com/otinori/pkmp

# プラグインをインストール
/plugin install pkmp@pkmp
```

インストール後は `/pkmp:<スキル名>` の形式でスキルを呼び出せます。

### 手動セットアップ

1. `.pkmp/` ディレクトリをターゲットリポジトリにコピー
2. `dist/` の内容をターゲットリポジトリのルートにコピー
3. `.agent/skills/pkmp-*/` をコピーしてスキルを配置
4. Claude Code で `/pkmp:init` を実行し、プロジェクト情報を入力

## クイックスタート

```
# 新規プロジェクトへのセットアップ
/pkmp:init

# リポジトリ全体を検証
/pkmp:verify

# 全Markdownビューを再生成
/pkmp:regenerate
```

CLIで直接実行する場合（PKMP開発者向け）:

```bash
npm install
node .pkmp/bin/pkmp.js verify
node .pkmp/bin/pkmp.js regenerate
```

## スキル一覧

| スキル（プラグイン形式） | トリガー |
|---|---|
| `/pkmp:init` | 新規プロジェクトにセットアップ |
| `/pkmp:verify` | コミット前・整合性確認 |
| `/pkmp:regenerate` | Canonical YAML変更後 |
| `/pkmp:process-inbox` | `inbox/` にファイルが来たとき |
| `/pkmp:spec-assist` | SDD作業前にSPEC作成 |
| `/pkmp:capture-decision` | 設計判断が生まれたとき |
| `/pkmp:capture-learnings` | SDD Changeアーカイブ後 |
| `/pkmp:apply-process-improvement` | 承認済みのPIレコードがあるとき |
| `/pkmp:simulate` | PKMPのスキル品質を自律的に改善したいとき |

## エコシステム

| 機能 | ツール |
|---|---|
| 設計判断の記録 | [UDR](https://github.com/otinori/UDR) |
| SPEC要件の多視点審議 | [Conclave](https://github.com/otinori/conclave) |
| 実装タスク管理 | OpenSpec等SDD |

## 基本原則

| 原則 | 内容 |
|---|---|
| Knowledge First | 知識が唯一の成果物。ファイルは派生物 |
| YAML Canonical | YAMLが正。Markdownは生成物で編集しない |
| Self-Describing | `registry/` だけでリポジトリ構造が完全に説明できる |
| SDD Agnostic | どのSDDを使っても知識資産は継続して利用できる |
| Capability Exchangeable | プロバイダーはregistryで宣言ベースに差し替え可能 |
