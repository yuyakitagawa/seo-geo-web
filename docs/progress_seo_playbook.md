# 進捗: SEO/GEOプレイブックの取り込み

外部プレイブック（kujira-watchで実証済みの施策集）を現状実装と突き合わせ、
「実装済み」と「本当のギャップ」に切り分けて、後者だけを実装する。

## 突き合わせ結果（実装済みなので触らない）
- site.ts集約 / metadataBase / titleテンプレ（固有名が先頭）/ canonical / OGP / Twitter Card
- robots の `max-image-preview:large` `max-snippet:-1` `max-video-preview:-1`
- 動的sitemap + robots.txtからの参照、記事lastmodは `updated`
- OGP画像（サイト・記事ごとに実PNG生成）、favicon.ico
- JSON-LD: Organization（alternateName・contactPoint）/ WebSite / Article（citation）/ BreadcrumbList（記事）/ ItemList（/tools）
- llms.txt、出典ブロックの定型化、URLは連番（日本語を含まない）
- 生成側の足切り `validate()`、全ページ静的生成（`generateStaticParams` + `dynamicParams=false`）
- GA4 / Vercel Analytics / Speed Insights、関連記事・カテゴリ・タグの内部リンク

## ギャップ（今回やること）
- [x] 1. アイコン一式が無い（icon / apple-icon / manifest.webmanifest）
- [x] 2. 記事の「## よくある質問」を FAQPage JSON-LD にしていない（可視テキストと同一ソースで出す）
- [x] 3. パンくずが記事ページだけ。一覧・固定ページに無い（UIとJSON-LDを共通コンポーネント化）
- [x] 4. 一覧ページに包括クエリへの直答段落（件数・期間）と ItemList/CollectionPage JSON-LD が無い
- [x] 5. タグページの足切りが無い（1記事だけの薄いタグもsitemapに載る）→ 表示側noindexと生成側除外を同一しきい値で
- [x] 6. sitemapのカテゴリ/タグ lastmod が全ページ同じ日付
- [x] 7. /about に一次情報源（収集元）の外部リンクとFAQが無い
- [x] 8. /about の記事制作プロセスの記述が実装（自動公開）と食い違っていた → 実態に修正
- [x] 9. llms.txt にデータソース・記事の作り方・免責が無い
- [x] 10. 生成プロンプトに「直答1文目」「FAQ回答は自己完結」の指示が無い

## 見送り（理由を残す）
- タグURLの日本語（`/tag/店舗集客`）のASCII化: 308リダイレクトと衝突管理が必要でコスト大。
  まずは薄いタグの足切りで様子を見る。記事数が増えてタグが定着してから再検討する。
- 週次/月次まとめページ: 記事16本では中身が薄くなる。カテゴリページのハブ化を先に効かせる。

## 検証（2026-08-29）
- `npm run typecheck && npm run build` 通過。全ページ静的（`llms.txt`/`feed.xml`/`ads.txt` も `force-static` に変更）
- 記事16本すべてから FAQ 3問を抽出できることを確認（`extractFaq`）
- `/tag/Promptwatch`（記事1本）= `noindex, follow` かつ sitemap 非掲載、`/tag/GEO` は掲載。sitemapのタグは54→10件
- カテゴリの lastmod がカテゴリごとに別の日付になることを確認（seo:08-23 / geo:08-24 / news:08-24）
- `/manifest.webmanifest` から `/icon-192.png` `/icon-512.png` が解決できることを確認

## 次にやること（効果測定）
1. GSCにベースラインを記録（sitemap総URL数35・記事16・クリック・表示・CTR・平均順位）
2. 数週間後に前後比較。特に「クロール済み - インデックス未登録」のタグページ件数が減るか
3. リッチリザルトテストで FAQPage / BreadcrumbList / CollectionPage の警告が無いか確認
