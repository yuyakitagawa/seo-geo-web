# 進捗: kujira-watch から未移植の機能を取り込む

`docs/progress_seo_playbook.md` で一度移植した分を除き、kujira-watch（`~/stock-alert/kujira-watch`）に
あってこちらに無いものを洗い出して入れる。目的はサイトの品質向上。

関連: `docs/progress_brushup.md`（計測のオーナー作業が未完）、`docs/progress_ga_supabase_logging.md`（生ログは保留中）。

---

## A. すぐ効く実装（コードだけで完結）

- [x] A-1. Organization に `logo`、記事の Article JSON-LD に `image`
- [x] A-2. sitemap から `changefreq` / `priority` を落とす
- [x] A-3. 一覧・固定ページの公開日/更新日を機械可読にする（`WebPage` + 可視 `<time>`）
- [x] A-4. 回遊導線（記事の途中に次の一手／一覧ページ末尾に兄弟ページ）
- [x] A-5. 共有ボタン

## B. インデックス品質

- [x] B-1. 同一話題のカニバリ対策（`supersedes` frontmatter ＋ 検知スクリプト）
- [x] B-2. インデックス判定を1ファイルに集約する

## C. 計測・運用

- [ ] C-1. AIクローラーのアクセスログ（**オーナー判断待ち**）
- [x] C-2. クリック計測（GA4）
- [ ] C-3. 運用レポート（GSC / GA4 / GEO）

## D. コンテンツ資産（今回の範囲外。別途）

サイト共通の `/faq`、用語集ページ、日本語コピースキル。

---

## 記録

### B-1 の方針を変えた理由（2026-08-31）

kujira-watch は `supersededArticleIds()` で「同一（銘柄×提出者）の最新1本だけをindex」にしている。
同じ提出者が同じ銘柄について変更報告書を何度も出す＝**機械的にほぼ同一の記事**が積み上がる構造だから成立する。

こちらで同じことを `sameTopic()`（`src/lib/topic.ts`、collect/pick と共用）でやれるか、
公開中の news 記事24本に当てて実測した:

```
■ 最新: 5  2026-08-23 Google AI Modeの質問は通常検索の3倍長い。店舗ページは冒頭3行で答えを書く
   └ 14 2026-07-29 Google AI Modeが外出・店探しの5つの使い方を公開。店舗はビジネスプロフィールの空欄を埋める
■ 最新: 10 2026-08-20 Googleがトップページの「Google検索」ボタンをAI Modeボタンに置き換えるテストを開始
   └ 16 2026-07-15 Google画像検索25周年。LensとAI Modeで「写真で聞く検索」が入口になり、商品画像の撮り方が順位を決める
```

2件目は**別の出来事**（画像検索25周年 と AI Modeボタンの置換テスト）で、共有語は google / ai / mode / 検索 だけ。
`sameTopic()` は RSS の見出し重複を弾くための基準（shared>=3 か Jaccard>=0.34）なので、
記事タイトルに当てると誤検知する。自動でこれを noindex にすると**実在の記事を消す**。

そこで、判定は推測ではなく **frontmatter の `supersedes: <記事id>`** で明示する方式にした。
続報が前の記事を置き換えるケースは人（または生成側）が指定する。
代わりに `npm run dupes` で類似クラスタを**報告だけ**して、指定漏れに気づけるようにする。

### 検証（2026-08-31）

- `npm run typecheck && npm run build` 通過。全ページ静的のまま（ルート構成は変わっていない）。
- sitemap が loc + lastmod だけになったことを本番ビルドの `sitemap.xml` で確認（`changefreq` / `priority` は0件）。
- JSON-LD を本番ビルドのHTMLで確認: Organization に `logo`（`/icon-512.png`）、記事の Article に `image`
  （`/articles/1/opengraph-image`）、`/news` `/tools` `/privacy` に `WebPage` の datePublished / dateModified。
  参照先URLはどちらも実体があることを確認（`curl` で 200 / image/png）。
- ブラウザ実機で `<time datetime="2026-07-15">` として出ること、`/news` に「次に読む」セクションが出ることを確認。
  コンソールエラーなし。
- `npm run dupes` の候補2件はいずれも別の出来事だったので `supersedes` は付けていない
  （＝カニバリ対策は仕込んだが現時点で発動しない、が正しい状態）。

### 残り

- C-1（AIクローラーのアクセスログ）: Supabase相乗りの可否がオーナー判断待ち。
- C-3（運用レポート3本）: GSC / GA4 のAPI設定（サービスアカウント登録）が先。
  `docs/progress_brushup.md` のオーナー作業A・Bが終わってから。
- D（サイト共通 `/faq`・用語集・コピースキル）: 未着手。
