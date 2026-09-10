# 進捗: 記事 → 教科書・ツールの還流

毎朝の記事生成（collect → pick → generate）は動いていたが、その成果が
**教科書（/learn）と /tools に流れ込む経路が1本も無かった**。記事は `/learn` へリンクする
（`src/components/ArticleNextStep.tsx`）が、逆向き（教科書が最新記事を知る）は無し。
放っておくと手書きの教科書だけが古くなる。

## 設計
- 教科書は「仕組み」を固定して書き、**動く部分は記事側に持たせる**。両方に同じことを書かない。
- つなぎは語の一致だけ（外部APIを使わない）。レッスンに `topics`（手がかり語）を持たせ、
  記事の title / description / tags と突き合わせる。
- 記事が本文の記述を**否定しているか**は機械では分からないので、書き換えの判断は人。
  スクリプトは「読み直す順番」を出すだけ（`dupes` / `prompt-gap` と同じ流儀）。

## ステップ
- [x] `src/lib/curriculum.ts` の `Lesson` に `topics: string[]` を追加し、14レッスン全部に記入
- [x] `src/lib/lessonFeed.ts`（突き合わせ本体。`matchesLesson` / `lessonArticles` / `lessonGaps`）
- [x] `LessonUpdates`（`src/components/lesson.tsx`）をレッスン末尾・出典の前に。TOCにも連動
- [x] `scripts/learn-gap.ts` / `npm run learn-gap`（本文の更新日より後の記事を多い順に報告）
- [x] `scripts/tools-gap.ts` / `npm run tools-gap`（/tools に無いツール候補＋確認が古いツール）
- [x] `src/lib/lessonFeed.test.ts`（topics の書き忘れ・広すぎる語・取りこぼしを落とす）
- [x] README 更新
- [x] `npm run typecheck && npm test && npm run lint && npm run build`

## 実行結果（2026-09-10 / 公開記事74本）
- 該当記事が0本のレッスンは無し。更新日より後の記事があるレッスンは11本。
- 最も遅れているのは 12「実例：強いサイトがやったこと」と 01「スターターガイド」。
- `tools-gap`: 直近90日の「ツール検知」候補149件のうち34件が /tools のどの名前とも一致しない
  （「順一くん」「AIOGeoScan」など、実際に未収録のものが混じる）。確認から180日たったツールはまだ無い。

## 残り（このPRには入れていない）
- ページ診断（`src/lib/audit.ts`）と `src/lib/crawlers.ts` の判定基準は、まだ記事から更新されない。
  クローラーの `verified` が古びても気づけないので、同じ形の鮮度チェックが要る。
- `learn-gap` / `tools-gap` は手動実行。毎朝のActionsに読み取り専用で挟むかは、実行結果を数週間見てから決める。
