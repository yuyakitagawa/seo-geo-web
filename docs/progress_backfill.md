# 過去記事のバックフィル（半年分）

既存の最古記事は 2026-07-15。その手前の **2026-03-02〜2026-07-14** を **月4〜5本・合計25〜30本** で埋める。

## 前提と制約

- **実行環境**: Google News・Search Engine Land 等への外部アクセスと `ANTHROPIC_API_KEY` が必要。Claude Code のリモート実行環境（Web/クラウド）は外部ドメインが遮断されているため、**ローカルで実行する**。
- **日次の自動公開と混ぜない**: 「採用」が残ったまま翌朝7時のActionsが動くと、`pick` は `need = 件数 - 採用済み` が0以下で新規採用せず、`generate` がバックフィル分を3本ずつ消費する。その日のニュースが出なくなるので、**collect → pick → generate を一度に流し切ってからコミットする**。
- **日付は過去のまま**（`date` = 出典の公開日）。記事一覧・RSS・`datePublished` は過去日で出るが、Googleの初回クロールは全記事が同日になる。まとめて公開するとその点は隠せない。気になる場合は数日〜数週に分けて `--per-month=1` ずつ回す。
- **コスト概算**: sonnet 2段階生成で1本あたり $0.15〜0.3。25〜30本で **$4〜9**。

## 手順

- [ ] 1. 収集（月ごとの日付窓で Google News を掘る＋WordPressフィードのページ送り）
  ```
  npm run collect -- --since=2026-03-02 --until=2026-07-14
  ```
  Google Newsの暗号化URLを1件ずつ元記事URLに復号するため、数分〜十数分かかる。
  追加された候補は `content/candidates.csv` の note が「バックフィル」。

- [ ] 2. 候補を目視で確認（`content/candidates.csv`）
  明らかに題材にならない行は status を「却下」にしておく。PR配信のツール発表は note が「ツール検知」になり、自動で対象外。

- [ ] 3. 採用（各月から上位5本）
  ```
  npm run pick -- --since=2026-03-02 --until=2026-07-14 --per-month=5
  ```
  月ごとの採用数がログに出る。0件の月があれば、その月だけ検索語を足して 1. からやり直す（`scripts/sources.ts` の `BACKFILL_QUERIES`）。

- [ ] 4. 生成（下書きとして書き出す。`--publish` は付けない）
  ```
  npm run generate -- 30
  ```
  1本ずつweb_fetchで元記事を読むので30〜60分かかる。取得できなかった候補は「却下」になり、記事は作られない。

- [ ] 5. 目視レビュー
  半年前の記事は、その後に前提が変わっている可能性がある（撤回された機能・数値の更新）。
  古い内容がそのまま残る記事は `draft: true` のまま捨てるか、続報を `supersedes` で紐づける。
  ```
  npm run dupes   # 既存記事と同じ話題になっていないか
  ```

- [ ] 6. 公開（draft を外す）
  ```
  grep -l 'draft: true' content/articles/*.mdx | xargs sed -i '' 's/^draft: true$/draft: false/'   # macOS
  ```

- [ ] 7. 検証してコミット
  ```
  npm run typecheck && npm run build
  ```
  `content/articles/*.mdx` と `content/candidates.csv` を同じコミットに入れる。

## 実装メモ（2026-09-02）

- `scripts/sources.ts`: `FeedSource.paged`（WordPressの `?paged=N` で遡れるソース）、`googleNewsSearch(query, lang)`、`BACKFILL_QUERIES`（日本語4・英語4）を追加。
- `scripts/collect.ts`: `--since` / `--until` を追加。あるときだけ `collectBackfill()` に切り替える。窓は `monthWindows()` が暦月に刻む。ページ送りは「記事0件」「1ページ目と同じ内容が返った」「窓より古い記事に到達」のどれかで打ち切る（上限15ページ）。
- `scripts/pick.ts`: `--since` / `--until` / `--per-month` を追加。
  - スコア下限は 2→1。`rescore` の「3日以内+1」を過去記事は誰も取れないため、下限を1つ下げて釣り合わせる。
  - 同一話題の除外は「語が重なる **かつ** 日付が14日以内（`BACKFILL_DEDUPE_DAYS`）」に限定。半年分を一度に選ぶと、3月と6月のコアアップデートが `sameTopic` で同一視され、後半の月が0件になるため。
- 日次モード（`--since` なし）の出力は変更前と一致することを、実データ（`content/candidates.csv` 213行）で確認済み。
