# 記事の自動投稿バッチ

毎朝7時JSTに、収集→採用→執筆→検証→公開までを人の手を介さずに回す。

## 実装
- [x] `scripts/topic.ts`: 同一話題の判定を collect から切り出して共通化
- [x] `scripts/pick.ts`: 「候補」から自動で「採用」を決める（スコア2以上／21日以内／ツール検知を除外／既出の話題を除外）
- [x] `scripts/generate.ts`: `--publish` で draft:false 出力。`validate()` で記事の型を検査し、外れた出力は捨てて候補を「却下」に
- [x] `.github/workflows/daily-articles.yml`: collect→pick→generate --publish→typecheck+build→main へ push
- [x] `npm run pick` を package.json に追加
- [x] README / CLAUDE.md を更新
- [x] 既存16記事が `validate()` を通ることを確認（基準が厳しすぎないかの検証）

## 残り（GitHubの設定。リポジトリ管理者の作業）
- [ ] Settings > Secrets and variables > Actions に `ANTHROPIC_API_KEY`
- [ ] Settings > Actions > General > Workflow permissions を **Read and write permissions** に
- [ ] main にブランチ保護をかけている場合は github-actions[bot] の push を許可する（かけていなければ不要）
- [ ] 初回は Actions から `workflow_dispatch`（draft: true）で試し、出力を見てから自動公開に任せる

## 運用メモ
- 止めるとき: Actions画面で daily-articles を Disable
- 記事数を変えるとき: workflow の `inputs.count` の default（現在2）
- 採用基準を変えるとき: `scripts/pick.ts` の `MAX_AGE_DAYS` / `MIN_SCORE` / `eligible()`
- ビルドが落ちた日は何も公開されず、候補の状態変更もコミットされない（次回に再挑戦）
