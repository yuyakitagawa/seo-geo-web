# 進捗: HOW TO記事（ストック型）の追加

## 背景
現状の記事はすべてRSS起点＝ニュース（フロー）で、検索でもAI検索でも寿命が短い。
AI検索に引用されるのは定義・手順・比較表を持つストックページなので、
「HOW TO記事」を記事の第2の型として追加する。

サイト構成は既存のテーマ軸（SEO / GEO / ニュース / ツール）を変えない。
「記事」「HOW TO」を並列のセクションにすると分類軸が混ざり、URLも深くなるため、
記事の型を frontmatter の `type` で区別し、一覧の見せ方で分ける。

※ SEO対策・GEO対策の説明ページ（/seo, /geo 相当）は別セッションで作成中のため、ここでは触らない。

## やること
- [x] 1. frontmatter に `type: news | howto` を追加（未指定は news）。`src/lib/content.ts`
- [x] 2. 記事カード・記事ページに型バッジ（解説／ニュース）
- [x] 3. カテゴリページで HOW TO を上部に分離（ストックを先に見せる）
- [x] 4. HOW TOのテーマ表 `content/howto-topics.csv`（人が採用を付ける）
- [x] 5. `scripts/generate-howto.ts`（HOW TO専用プロンプト＋validate）と `npm run generate:howto`
- [x] 6. 既存記事の `category` のクォート表記ゆれを統一
- [x] 7. README / CLAUDE.md 更新

## 検証
- [x] `npm run typecheck && npm run build`（2026-08-30 通過。/seo /geo を含む全ページ静的生成）

## 初回生成（2026-08-30）
テーマ表の「採用」2件を `npm run generate:howto -- 1` で1本ずつ生成した。どちらも1回目で検査を通過（レビュー改稿なし）。

| id | カテゴリ | タイトル | 出典 |
| --- | --- | --- | --- |
| 26 | geo | GEOとは何か。SEOとの違いとGoogle公式が示すAI検索に載る条件 | AI features and your website / Succeeding in AI search |
| 27 | seo | SEOの始め方。Google公式SEOスターターガイドが示す最初の5項目 | SEO スターターガイド / Maintaining your website's SEO |

一次情報との突き合わせで確認した点:
- 引用文2本は原文と一言一句一致。ブログ側の日付（2025年5月21日）と著者（John Mueller, Google Search Relations）も原文どおり。
- 「モバイル利用60%超」は出典に "over 60 percent of the global internet population" として存在する（数字ではなく英単語で書かれているため、機械的なgrepでは拾えない）。

## 初回生成で見つかった不具合と対応
- **FigureQuote の属性名を間違えても検査を通っていた**（`quote` / `cite` と書かれ、本文が空で描画されていた）。
  - `scripts/prompt.ts` に FigureQuote と FigureBars のシグネチャを追記し、「属性名は上のとおりに書く」と明記。
  - `scripts/article.ts` の `validate()` に図解の必須属性チェックを追加（未定義の図解名も落とす）。ケーステスト済み。
- **英語のまま書かれる語が多かった**（classic Search / site owner / Performance report など）。
  文体ルールに「英語のまま書かない。原文引用は FigureQuote の中だけに置き、直後に日本語で意味を書く」を追加。
  記事26は手で日本語に直した（27は追加ルール適用後の生成で問題なし）。

## 運用メモ
- HOW TO記事は数が少ないので、公開前に**数値と固有名詞を出典で1件ずつ確認する**。
  機械検査（`validate()`）は構造しか見ないため、事実の裏取りは代替できない。
