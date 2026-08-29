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
