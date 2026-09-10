# 進捗: 記事 → 教科書・ツールの還流

毎朝の記事生成（collect → pick → generate）は動いていたが、その成果が
**教科書（/learn）と /tools に流れ込む経路が1本も無かった**。記事は `/learn` へリンクする
（`src/components/ArticleNextStep.tsx`）が、逆向き（教科書が最新記事を知る）は無し。
放っておくと手書きの教科書だけが古くなる。

## 設計
- 教科書は「仕組み」を固定して書き、**動く部分は記事側に持たせる**。両方に同じことを書かない。
- **記事の大半は教科書に入れるべきではない**。毎朝の記事はフロー情報で、数ヶ月後にも通じる
  手順・判断基準を含むものは一部しかない。全部を流すと教科書が記事一覧の劣化コピーになる。
- そこで2段階に分ける。混ぜないこと。
  1. **候補を絞る**（`matchesLesson`）… 語の一致だけ。外部APIを使わない。**採否ではない**。画面に出ない。
  2. **採否を決める**（`npm run knowhow`）… Claudeが1本ずつ4条件で判定する。画面に出るのはこれを通った行だけ。
- 採用の4条件（すべて満たすときだけ採用）: 数ヶ月後も通じる / 読者が実行できる /
  候補レッスンにまだ書かれていない / 一次情報の裏付けがある。
- **記事もレッスン本文も自動では書き換えない**。台帳（`content/knowhow.csv`）に積むだけ。

## ステップ
- [x] `src/lib/curriculum.ts` の `Lesson` に `topics: string[]` を追加し、14レッスン全部に記入
- [x] `src/lib/knowhow.ts`（採否台帳の型・読み込み・反映先の検査）
- [x] `content/knowhow.csv`（status / articleId / target / knowhow / where / reason / judged）
- [x] `src/lib/lessonFeed.ts`（候補を絞る `matchesLesson` と、採用行を返す `lessonKnowhow` を分ける）
- [x] `scripts/knowhow.ts` / `npm run knowhow`（Claudeに4条件で判定させ、台帳に積む）
- [x] `LessonUpdates`（`src/components/lesson.tsx`）— 1行のノウハウを主役にし、記事は出典として添える
- [x] `scripts/learn-gap.ts` / `npm run learn-gap`（未判定の候補記事と、取り入れ済みの件数を報告）
- [x] `scripts/tools-gap.ts` / `npm run tools-gap`（/tools に無いツール候補＋確認が古いツール）
- [x] `src/lib/lessonFeed.test.ts`（**判定していない記事がレッスンに出ないこと**と、台帳の壊れた行を落とす）
- [x] csv-parse を devDependencies から dependencies へ（`src/lib` がビルド時に読むため）
- [x] README 更新
- [x] `npm run typecheck && npm test && npm run lint && npm run verify:api && npm run build`

## 初回の判定（2026-09-10 / Claudeが19本を判定。採用8 / 却下11）
候補として挙がった19本を実際に読んで4条件に当てた。

採用（8本）:
- 37 → technical: サイトマップの並び順ではクロール順が決まらない（実ログ19万件）
- 38 → geo-implementation: llms.txtは読まれない前提で置く（実ログ29日分）
- 63 → search-intent: 1ページ内で隣り合う複数の意図に見出し単位で答える（Google公式のfan-out定義）
- 64 → updates-risk: 回復は数ヶ月。数週間の変動を対策の効果と読まない
- 67 → measurement: 名前・推奨・引用を分けた出現率で、2〜4週間の期間どうしを比べる
- 68 → measurement: ClarityのCitationsで引用ページと grounding query の組み合わせを見る
- 70 → snippet: ChatGPTはmeta descriptionを使わず本文先頭200字を切り出す（実測383件）
- 71 → brand-entity: 計測は条件を足した質問でも行う（候補ブランドが入れ替わる）

却下の内訳: 実行できる手順が無い4本（30 / 40 / 41 / 66）、既存の到達チェックと重複3本（33 / 36 / 61）、
一次情報の裏付けが無い2本（35 / 65）、単発の不具合で数ヶ月後に通じない1本（69）、
他の採用記事と重複1本（73）。

結果、7レッスンに「記事から取り入れたこと」が出るようになった（残り7レッスンは採用0本なので節ごと出ない）。

## レビュー指摘の反映（2026-09-10 / Codex）
- `scripts/tools-gap.ts`: ツール名・ベンダー名を4文字以上の語に分割していたため、`google` `brand`
  `insight` `tracker` のような一般語が手がかりになり、それを含むだけの候補が全部「収録済み」に落ちていた
  （未収録の「AI検索くん」が消えていた）。**完全な識別子だけ**で照合するよう直し、法人格を落とす正規化を足した。
  ベンダー名が `Google` `Microsoft` の2社は見出しにほぼ必ず出るので、ツール名の完全一致だけで拾う。
  結果、未収録の候補が34件→91件になり、「AI検索くん」「順一くん」「AIOGeoScan」が拾えるようになった。
- `src/lib/lessonFeed.ts`: `getAllArticles()` が下書きを外すのは `NODE_ENV=production` のときだけで、
  `npm run learn-gap` とテストでは下書きが混ざっていた（実際に `draft: true` の記事1本が候補に入っていた）。
  `feedArticles()` で明示的に落とし、`src/lib/lessonFeed.test.ts` で見張る。
- 「更新後の記事N本」の件数が表示上限4に頭打ちになる指摘は、判定ベースへの作り直しでその表示自体が無くなった。

## 残り（このPRには入れていない）
- ページ診断（`src/lib/audit.ts`）と `src/lib/crawlers.ts` の判定基準は、まだ記事から更新されない。
  `target: tool:page-audit` の行は台帳に書けるが、コードへの反映は人の作業のまま。
- 採用したノウハウをレッスン本文へ書き込む（status を「反映済」にする）作業は手動。
- `knowhow` / `learn-gap` / `tools-gap` は手動実行。毎朝のActionsに挟むかは、判定の精度を数週間見てから決める。
