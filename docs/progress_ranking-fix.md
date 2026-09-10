# 進捗: 順位が上がらない件への対処

2026-09-09 開始。「seo順位が全然上がらない」への調査から。

## 調査でわかったこと（2026-09-09）

技術面は壊れていない（sitemap 200 / 157URL、Googlebot許可、noindexの取りこぼし無し）。
問題は3つ。

1. **公開から17日**（初コミット 2026-08-23）。記事のdateは2026-07-15まで遡るがバックフィルなので、
   Googleが実際に見たのは8月下旬以降。新規ドメインの評価期間で、順位を見ても情報が無い。
2. **測っていない**。`data/gsc/` が空。インデックスされていないのか圏外なのか20位付近なのかで打ち手が変わる。
3. **勝てない土俵に7割を張っている**。73本中26本が Search Engine Journal 出典の日本語要約で、
   同じクエリに SEJ本体・海外SEO情報ブログ・SEO Japan が既にいる。17日のドメインでは勝てない。
   さらに news型はフロー記事なので、上がらないまま古くなる。
   資産になっているのは `original: true` の6本と howto 17本と `/learn` の14レッスンだけ。

補足の実測:
- 本文内に内部リンクが1本も無い記事が **62/73本**。記事→記事のリンクは全サイトで14本のみ。
  原因は `scripts/prompt.ts` に内部リンクの指示が1行も無いこと（関連記事コンポーネントはあるので
  クロール経路自体は繋がっている）。
- 候補は1097件残っており、うちスコア7以上が718件。**MIN_SCORE を上げても本数は減らない**。
  絞るべきは点数ではなく「記事の型」。

## 決めたこと（2026-09-09、運営者）

1. GSCの現在地を確定させる（実測データを入れる）
2. 毎朝の自動生成を news中心から howto / original 中心へ振り替える
3. 内部リンクの欠落を埋める

## ステップ

### 1. GSC
- [ ] 1-1. GSCの実データを入れる（Chrome拡張で `search.google.com` を許可、または CSV を `data/gsc/` に置く）
- [ ] 1-2. `npm run gsc` で現在地（インデックス数・クエリ・平均掲載順位）を出す

### 2. 生成の型を振り替える
- [x] 2-1. `scripts/pick.ts`: 日次の基本件数を 2→1、MAX_LIMIT を 4→3
- [x] 2-2. `.github/workflows/daily-articles.yml`: count の既定を 2→1、
      HOW TO の生成ステップを追加（`content/howto-topics.csv` に「採用」があるときだけ動く）
- [x] 2-3. `content/howto-topics.csv`: 候補テーマを追加（statusは「候補」のまま。採用は人が付ける）
- [x] 2-4. CLAUDE.md / README を更新（HOW TOの自動実行しないという記述を変える）

### 3. 内部リンク
- [x] 3-1. `scripts/prompt.ts`: 内部リンクの指示を共通ルールに追加
- [x] 3-2. `scripts/generate.ts` / `generate-howto.ts`: リンク候補の一覧をプロンプトに渡す
- [x] 3-3. `scripts/internal-links.ts`: 既存記事の本文に、**既に本文にある語だけ**をリンク化する
      （文言は1字も変えない。報告が既定、`--write` で書き込み）
- [x] 3-4. 62本に適用し、差分を確認
- [x] 3-5. テスト

### 4. 検査
- [x] 4-1. `npm run typecheck && npm test && npm run lint && npm run verify:api && npm run build`

## 結果（2026-09-09）

### 2. 生成の型
- `scripts/pick.ts`: 日次の基本件数 2→1、`MAX_LIMIT` 4→3
- `.github/workflows/daily-articles.yml`: count の既定を 1 に、`generate-howto.ts 1` のステップを追加
  （「採用」が無い日は何もせず正常終了するので無条件に置いた）
- `content/howto-topics.csv`: 候補を6件追加（14候補になった）。**status は「候補」のまま**なので、
  採用を付けるまで自動では動かない。出典URLは全件 HTTP 200 を確認済み（存在しないパスは404が返ることも確認）
  - インデックス登録されない原因の切り分け / canonical / 検索トラフィックの減少 /
    手動による対策と再審査 / 内部リンクの張り方 / サイト移転と301

### 3. 内部リンク
- 生成側: `scripts/prompt.ts` に `INTERNAL_LINK_RULES` とリンク先一覧（`linkTargets` / `linkTargetList`）を追加。
  一覧は userPrompt で渡す（SYSTEM_PROMPT のキャッシュを壊さないため）。レビューのチェックリストに15番を追加
- 既存記事: `src/lib/internalLinks.ts`（純関数）＋ `scripts/internal-links.ts`（入出力）＋テスト13本
- 適用結果: **本文にリンクが無い記事 62本 → 6本**。65本に107本を差し込んだ（レッスン52 / 用語集55）
  - 残る6本は、対象語が「## 結論」の1段落目か見出しにしか出ておらず、規則どおり見送った
  - 文言は1字も変えていない（`[語](/path)` で包んだだけ。差分は108行の +/- のみ）
- 検査: typecheck / test 75本 / lint / verify:api / build すべて通過

## 残り
- 1-1 / 1-2（GSC）は運営者の作業待ち。Chrome拡張のサイト権限で `search.google.com` を許可するか、
  CSVを `data/gsc/` に置く。**ここが埋まるまで、2と3の効果は測れない**
