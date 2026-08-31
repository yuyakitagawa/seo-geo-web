# 進捗: ブラッシュアップ（器と計測）

記事の中身は触らない。**改善のループが回る状態**にするのが目的。
「課金の関門 → 計測 → 窓口 → 記事ページの完成度」の順に埋める。

関連: `docs/progress_setup.md`（GA4 / Search Console / OGP が未完のまま残っていた）、
`~/stock-alert/docs/progress_seo_traffic.md`（**先に測れるようにするのがボトルネック**、という結論）。

---

## 0. 作業ツリーの整理
- [x] 未コミットだった17ファイル＋未追跡3件の中身を確認
- [x] すべて完成済みの作業だったのでコミット（`8c8c4fe`）。捨てるものは無し
      （実験コード・デバッグ出力・コメントアウトの残骸は無く、eslint も通る状態だった）
      - `/learn` 教科書10レッスン（`progress_learn-curriculum.md` が全ステップ完了）
      - `/seo` `/geo` の図解と `#bots`（`progress_seo_figures.md` が全ステップ完了）
      - `scripts/format-html.ts`（`npm run html`）
      - README / CLAUDE.md の該当行が3件で混ざっていてファイル単位に分割できないため、1コミットにまとめた
- [x] `npm run typecheck && npm run build` が通ることを確認してからコミット

---

## 1. 課金の前に関門を置く（`11f6625`）

### 何が起きていたか（実測）
`gh run list` で確認したところ、**3便が同じ理由で失敗**していた。

| 実行 | 結果 | 落ちた場所 |
|---|---|---|
| 2026-08-28 05:59 UTC | failure | 「本番ビルドで検証」（generate の**後**） |
| 2026-08-29 03:33 UTC | failure | 同上 |
| 2026-08-29 23:55 UTC | failure | 同上 |

最後の便のログ:
```
wrote content/articles/0026-2026-08-20-dkr4qg.mdx  (in=453 cached=131860 out=9021)
wrote content/articles/0027-2026-08-20-3cu1f4.mdx  (in=396 cached=198009 out=10360)
...
src/app/sitemap.ts(3,27): error TS2307: Cannot find module '@/lib/apps'
```
記事2本を生成しきってから落ちている。**課金だけ残って成果物は捨てられた。**

**原因**: `src/lib/apps.ts` が main に入ったのは 2026-08-30 10:20 JST（`a5d6714`、PR #7 経由）。
失敗した便は 08:55 JST で、main は `sitemap.ts` が存在しないモジュールを import している状態だった。
記事の内容とは無関係な、main 側の不整合。

### 直したこと
- [x] `npm ci` の直後に `npm run typecheck` を追加。TS2307 はここで確実に出るので、**1円も使わずに終われる**
- [x] 置き場所は collect / pick より前。候補の状態（`candidates.csv`）も動かさずに終わる
- [x] generate 後の `typecheck && build`（生成物の検証）はそのまま残した
- [x] main が現時点で typecheck を通ることを worktree で確認済み（次便は通る見込み）

### 気づく手段（LINE通知）
- [x] `if: failure()` でLINEにpush通知するステップを追加。
      認証情報が無ければ黙ってスキップするので、Secrets 未設定のうちは何も起きない
- [x] 構文チェックと、送信するJSONの中身をローカルで確認済み

**GitHubのメール通知ではなくLINEにした理由**: kujira-watch は同じ問題（無言で止まり丸一日気づかない）を
踏んでLINEに移しており、ワークフロー側のコメントにも「ワークフローの赤は誰も見ていないという前提で運用する」と
書かれている。ここも毎朝の無人実行で、失敗すると課金だけが進む種類の処理なので同じ扱いにした。
GitHubのメール通知は設定が要らないぶん、LINEを設定するまでの間の保険として併用でよい。

### → オーナー作業
1. **LINE通知を有効にする**（任意。設定しなければ通知が飛ばないだけ）
   stock-alert で使っている LINE Messaging API チャネルの値をそのまま流用できる。
   GitHub → リポジトリ → Settings → Secrets and variables → Actions → New repository secret
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_USER_ID`
2. **GitHubのメール通知**（保険。1分で終わる）
   github.com → 右上アイコン → Settings → Notifications → Actions →
   「Send notifications for: **Failed workflows only**」にして Email にチェック。

---

## 2. 計測を入れる

コード側は**すでに入っている**。`src/app/layout.tsx` が `NEXT_PUBLIC_GA_ID` があるときだけ
`@next/third-parties` の `GoogleAnalytics` を出す。**環境変数を入れるだけで動く。**

着手時点（2026-08-30）の本番には計測タグが1つも入っていなかった:
```
$ curl -s https://seo-geo-lab.com/ | grep -c gtag
0
```
→ **2026-08-31 に解消**（オーナーが `NEXT_PUBLIC_GA_ID` を設定）:
```
$ curl -s https://seo-geo-lab.com/ | grep -c googletagmanager
1
```

### → オーナー作業A: GA4
1. https://analytics.google.com/ → 管理 → プロパティを作成
   - プロパティ名: `SEO GEO Lab` / 国: 日本 / 通貨: 円
   - 業種・規模は任意
2. データストリーム → **ウェブ** → URL に `https://seo-geo-lab.com`、ストリーム名は任意
3. 表示される **測定ID `G-XXXXXXXXXX`** をコピー
4. Vercel → プロジェクト `seo-geo-web` → Settings → Environment Variables
   - Key: `NEXT_PUBLIC_GA_ID` / Value: `G-XXXXXXXXXX`
   - **Environments は Production にチェック**（`NEXT_PUBLIC_` は静的ビルドに埋め込まれるので再デプロイが必要）
5. Deployments → 最新のものを **Redeploy**
6. 確認: 自分のスマホ等でサイトを開き、GA4 の「レポート → リアルタイム」に1が出ればOK。
   コマンドでも確認できる: `curl -s https://seo-geo-lab.com/ | grep -c googletagmanager` が 1 以上になる

### → オーナー作業B: Search Console
1. https://search.google.com/search-console/ → プロパティを追加
2. **「ドメイン」** を選ぶ（`seo-geo-lab.com`）。www / http / https をまとめて見られる
3. 表示される TXT レコードを **お名前.com のDNS設定**に追加
   （お名前.com Navi → ドメイン → DNS → DNSレコード設定。ホスト名は空欄、TYPE は TXT、VALUE に貼る）
   - DNSの反映に数分〜1時間。反映後に「確認」を押す
   - ※ DNS を触りたくない場合は「URLプレフィックス」で `https://seo-geo-lab.com` を選び、
     GA4 を先に入れておけば **Google アナリティクス** の方法で所有権確認できる
4. 左メニュー **サイトマップ** → `sitemap.xml` を入力して送信
5. 「ページ」レポートでインデックス済みURL数を確認（反映まで数日かかる）

### ベースライン

計測が入る前に、こちら側で測れるものだけ記録しておく。

**2026-08-30（GA4・Search Console 導入前 / 本番実測）**

| 指標 | 値 | 取得方法 |
|---|---|---|
| 公開記事数 | 27本 | `/news` の表示 |
| sitemap 掲載URL数 | 55 | `curl -s https://seo-geo-lab.com/sitemap.xml \| grep -c "<loc>"` |
| 内訳 | 記事27 / タグ18 / ツール3 / 解説2（seo・geo）/ 固定4 / トップ1 | 同上 |
| GA4 | 未導入（タグ0件）→ **2026-08-31 に導入済み** | `curl -s https://seo-geo-lab.com/ \| grep -c googletagmanager` |
| Search Console | 未登録 | — |
| クリック / 表示 / CTR / 平均順位 | **未計測** | GSC登録後に記入 |
| インデックス済みURL数 | **未計測** | GSC登録後に記入 |

※ その後 PR #8 で main にマージし、`/learn` の11URL（目次1＋レッスン10）が加わって sitemap は **66** になった（2026-08-31 本番実測）。

- [x] コード側の準備（`NEXT_PUBLIC_GA_ID` を入れるだけで動く状態）を確認
- [x] 導入前ベースラインを記録
- [x] **オーナー作業A**: GA4 導入済み（2026-08-31 確認）。本番にタグが入っていることを実測:
      `curl -s https://seo-geo-lab.com/ | grep -c googletagmanager` → **1**
- [ ] **オーナー作業B**: Search Console 登録 → sitemap 送信
      （外部からは確認できないので、済んでいればここに日付を入れる）
- [ ] GSC のデータが溜まったら（登録から2〜3日後）下の表に記入する

**GSCベースライン（記入待ち。登録から数日後の28日間で取る）**

| 指標 | 値 | 取得日 |
|---|---|---|
| クリック | | |
| 表示回数 | | |
| CTR | | |
| 平均掲載順位 | | |
| インデックス済みURL数 | | |

---

## 3. /contact を生かす

`/contact` のページ自体は**完成している**（`src/app/contact/page.tsx`）。
`HAS_CONTACT`（`src/lib/site.ts`）が false の間は `notFound()` で404にし、フッターにも出さない作りで、
窓口が1つでも設定されれば自動的に公開され、フッター・sitemap・Organization の `contactPoint` にも載る。

本番の現状: `curl -o /dev/null -w "%{http_code}" https://seo-geo-lab.com/contact` → **404**

窓口が無いのは AdSense 審査（サイトの信頼性）でも検索評価（E-E-A-T）でも不利なので、1つ用意する。
**実名は不要**。次のどちらか片方でよい。

### → オーナー作業（どちらか1つ）

**案A: サイト専用のメールアドレス（おすすめ）**
1. Gmail で新規アカウントを作る（例: `seogeolab.contact@gmail.com`）。個人用とは分ける
2. Vercel → Settings → Environment Variables → Production
   - `NEXT_PUBLIC_CONTACT_EMAIL` = そのアドレス
3. Redeploy

**案B: Googleフォーム**
1. https://forms.google.com/ で「お問い合わせ」フォームを作る（項目: 種別 / 内容 / 返信用メール）
   - 回答は自分のGmailに通知させる（フォーム → 設定 → 新しい回答についてのメール通知）
2. 「送信」→ リンクのURLをコピー
3. Vercel → Environment Variables → Production
   - `NEXT_PUBLIC_CONTACT_FORM_URL` = そのURL
4. Redeploy

どちらでも、設定して再デプロイすれば `/contact` が200になり、フッターに「お問い合わせ」が出る。
確認: `curl -o /dev/null -w "%{http_code}" https://seo-geo-lab.com/contact` が **200** になればOK。

- [x] 何を用意すればよいかを手順化（コード変更は不要）
- [ ] **オーナー作業**: 窓口を1つ用意して env に設定 → 再デプロイ → 200 を確認
      （2026-08-31 時点でまだ404。ここだけが1〜3で唯一残っている作業）

---

## 4. 記事ページの完成度（`bb9437c`）

### 目次（TOC）
- [x] `src/lib/toc.ts` … MDX本文から見出しを拾い、**rehype-slug と同じidを再現**する。
      同じ文言の見出しに付く `-1` `-2` の採番をそろえるため、目次に出さない見出しも
      出現順に github-slugger へ通す（ずらすとアンカーが外れる）。コードフェンス内は無視
- [x] `src/components/Toc.tsx` … Key Points の下、本文の上に置く
- [x] `##` だけを載せる。`###` は「よくある質問」配下の質問文が中心で1記事に3〜10個あり、
      全部載せると目次が本文と同じ長さになる。見出しが3個未満の記事には出さない
- [x] **検証**: 本番ビルド後のHTMLと突き合わせ、**全27記事**で目次のアンカーが
      本文の h2 の id と**順序まで完全一致**（不一致0件）
- [x] ブラウザ実機でも全7リンクが実在の h2 に解決することを確認。
      1280px / 375px の両方で横スクロールの破綻なし、コンソールエラーなし

### 更新日の表示
- [x] **調査の結果、すでに実装済みだった**ので作り直していない。実際に `updated` を入れて本番ビルドし、
      3か所すべてに反映されることを確認した（確認後、記事は元に戻した）:
      - 可視テキスト … `更新 <time dateTime="2026-08-30">2026.08.30</time>`
      - JSON-LD … `"datePublished": "2026-07-17"` / `"dateModified": "2026-08-30"`
      - OGP … `article:modified_time`
      - `updated` が無い記事には「更新」が出ないことも対照で確認
- [x] README / CLAUDE.md に挙動を明記（frontmatter 一覧に `updated` が載っていなかった）

### OGP画像
- [x] 記事以外は全ページが同じ画像だったので、`pageOgImage()`（`src/lib/og.tsx`）を足し、
      `/seo` `/geo` `/learn` `/news` `/tools` `/about` にセクション別の画像を用意した。
      枠は記事と同じ `ogFrame` なので見え方がそろう
- [x] **既存の不具合を修正**: ページ側の `metadata` に `openGraph` を自前で書くと、
      上位セグメントの `opengraph-image` が引き継がれず og:image が消える。
      このためレッスン10ページは**画像が1枚も無い**状態だった。
      10ページで完全に同一だった metadata を `lessonMetadata()` に集約し、`images` を明示して解消
- [x] **検証**: 本番ビルドのHTMLで全ページの og:image を確認。
      `/learn/*`→`/learn/opengraph-image`、`/tools/ai-crawlers`→`/tools/opengraph-image` のように
      引き継ぎも含めて意図どおり。7ルートすべてが 1200x630 のPNGとして生成されることも実測

---

## この指示の範囲外（やっていない）
- 記事の書き直し・記事数を増やすこと
- アフィリエイト導線・PR表記（tools.json 52件のASP調査が先）
- AdSense申請（1〜3が終わってから）

## 残っている判断
- **生成前の関門を `typecheck` だけにするか、`build` まで回すか。**
  今回の3便は typecheck で止まるので指示どおり typecheck だけにした。
  ただし「MDXは壊れていないがビルドだけ落ちる」種類の不整合が main にあった場合は素通りする。
  Actions分数は public リポジトリなら無料なので、`npm run typecheck && npm run build` に
  広げれば穴は塞がる（1便あたり +1〜2分）。広げるかはオーナー判断。
- ~~**このブランチ（`feat/audit-where`）を main にマージするか。**~~
  → **PR #8 で main にマージ済み**（2026-08-31 確認）。生成前の関門・目次・OGP・`/learn` はすべて本番で有効。
  次の定期実行（毎日 07:00 JST）が、新しい関門を通る最初の便になる。
