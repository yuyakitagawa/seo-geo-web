# seo-geo-web

SEOとGEO（生成AI検索最適化。AIO/LLMOと呼ばれる領域を含む）の最新動向と実務ノウハウを発信するメディア。
読者は事業会社・制作会社のSEO/GEO担当。追いきれない量の公式発表と海外ソースから、読むべき変更だけを日本語で整理する。
一次情報（Google Search Central 等）をRSSで毎日収集し、Claudeで日本語解説を生成して自動公開する（GitHub Actions）。

## スタック
- Next.js 16 (App Router, SSG) + TypeScript + Tailwind CSS v4 (+ @tailwindcss/typography)
- 記事: リポジトリ内 MDX（`next-mdx-remote`）。CMS不使用。
- 計測: Vercel Analytics / Speed Insights / GA4（`NEXT_PUBLIC_GA_ID` 設定時）
- 収益: Google AdSense（`NEXT_PUBLIC_ADSENSE_CLIENT` 設定時のみ出力。未設定なら広告関連は一切出ない）
- 記事生成: `@anthropic-ai/sdk`（`claude-sonnet-5`・effort medium。草稿が検査に落ちたときだけ編集長レビューで改稿。品質不足なら `claude-opus-5` へ）

## ページ構成
| パス | 内容 |
|---|---|
| `/` | 新着記事・解説ページ（`/seo` `/geo`）＋教科書・ツールへの導線 |
| `/articles/[id]` | 記事（URLは連番 `/articles/12`。Article + BreadcrumbList + FAQPage JSON-LD、出典一覧、関連記事、広告） |
| `/news` | 記事アーカイブ。新着12本＋タグ一覧＋公開月ごとの全記事リスト |
| `/tag/[tag]` | タグ別一覧 |
| `/seo` `/geo` | 用語の解説（「SEO対策とは」「GEO対策とは」）＋そのカテゴリの記事一覧。定義1文＋要点3つ＋比較表＋FAQ＋一次情報。**手順は置かず `/learn` へ送る**（本文の中ほどに `NextStep` で教科書への導線を出す）。Botの解説は両ページに置く（`/seo` はGoogleの3分類＝一般的なクローラー／特殊なケース用／ユーザー トリガー フェッチャーとGooglebotの動き、`/geo` はAI側の4種類＝検索インデックス用／AI検索インデックス用／ユーザー起点フェッチャー／モデル学習用）。データは `src/lib/guides.ts`、部品は `src/components/guide.tsx`（Article + DefinedTerm + FAQPage + BreadcrumbList JSON-LD） |
| `/glossary` | SEO・GEO用語集。41語を5分野に分け、1語につき1文の定義＋実務メモ＋一次情報リンクで出す（DefinedTermSet + DefinedTerm JSON-LD）。データは `src/lib/glossary.ts` |
| `/learn` | SEO・GEO教科書の目次。3レベル14レッスンのロードマップ＋「最初の90日でやること」（レッスンをカレンダーに割り当てた着手順）＋「参考記事を見ながら加筆しています」（何を見て加筆しているか・加筆のルール・レッスンと出典URLが一致するサイト内記事。記事の抽出は出典URLの一致だけで行い、タイトルの類似は使わない）。Article + ItemList JSON-LD。データは `src/lib/curriculum.ts` |
| `/learn/[slug]` | 各レッスン。到達目標・チェックリスト・FAQ・出典・前後ナビを `src/components/lesson.tsx` の `LessonShell` が固定の順番で出す（Article + LearningResource + FAQPage + BreadcrumbList JSON-LD）。実例データは `src/lib/cases.ts` |
| `/tools` | SEO・GEOツール比較（`content/tools.json`。運営者が公式ページを確認したものだけ掲載、ItemList JSON-LD）。他社ツールはカードで出し、外部への遷移は「公式ページを開く ↗」のボタンだけにする（カード全体は押せない）。確認日は各ツールではなくページ上部の更新日にまとめる |
| `/tools/page-audit` | 自作ツール: URLを入れてSEO/GEOの指摘を出す（`src/lib/audit.ts` + `POST /api/audit`） |
| `/tools/prompt-fit` | 自作ツール: 狙ったプロンプトにページの内容が合っているかを判定（`src/lib/promptFit.ts` + `POST /api/prompt-fit`） |
| `/about` `/privacy` `/disclaimer` | 運営者情報（運営方針・記事の作り方・収集元・FAQ）/ プライバシーポリシー（AdSense・GA・CookieのAdSense必須開示）/ 免責事項（正確性・外部リンク・著作権と引用）|
| `/contact` | お問い合わせ。フォーム（`POST /api/contact` → LINE・メールへ転送）＋ 窓口の一覧。フォームの転送先 / `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTACT_FORM_URL` / 公式X（`X_SCREEN_NAME`。既定 `seogeolab`）が**1つも無いとビルド時に404**になり、フッター・sitemapにも出ない |
| `/sitemap.xml` `/robots.txt` `/feed.xml` `/llms.txt` `/ads.txt` | クローラー・LLM・AdSense向け |
| `/manifest.webmanifest` `/icon-192.png` `/icon-512.png` | PWAマニフェストとアイコン（図案は `src/lib/icon.tsx` の1か所。黒地に「S」＝SEO（生成り）＋「G」＝GEO（ブランド色）） |

## 記事パイプライン
```
scripts/sources.ts  収集元（公式: Search Central / Search Status / The Keyword / Bing / OpenAI、メディア: SEL / SEJ / SERoundtable / 海外SEO情報ブログ、
                    ツール検知: Google News 日本語検索RSS「LLMO」「GEO対策」「AIO対策」「AI検索ツール」「AI visibility」）
      ↓ npm run collect [日数]   content/candidates.csv に「候補」として追記。話題スコア付き。Google NewsのURLは元記事に復号（scripts/googleNews.ts）
      ↓ npm run pick N           「候補」からN件を自動で「採用」に（scripts/pick.ts）。人が手で status を 採用/却下 にしてもよい
      ↓ npm run generate N [--publish]
                                「採用」をスコア順にN件、Claudeが元記事をweb_fetchで読んで MDX を出力 → status を「公開」に
                                --publish なら draft:false（自動公開）、無指定なら draft:true（下書き）
      ↓ GitHub Actions           毎朝7時JST、typecheck→collect→pick→generate --publish→本番ビルド検証→main へ push
                                （.github/workflows/daily-articles.yml）→ Vercel が自動デプロイ
```
**話題スコア**: 検索専門の公式ソース+3（その他公式+1）、同じ話題を報じた他ソース数×2（上限+6。タイトルの語の重なりでクラスタ化）、3日以内+1、テーマ語の一致数（上限3）、ツール発表+2。
**自動採用の基準**（`scripts/pick.ts`）: スコア2以上・公開21日以内・「ツール検知」メモなし（PR配信のツール発表は /tools の材料で記事にしない）。
すでに「公開」「採用」にした話題と語が重なるものは選ばない（別ソースが報じた同じ発表の二重記事を防ぐ）。
**記事の日付**（`date`）は出典が公開された日に合わせる（生成日ではない）。出典日が取れない・未来日の場合だけ生成日にする。
**重複排除**: URL、および正規化タイトル（PR TIMES転載をInfoseek/Excite等と同一視）。話題の重なり判定は `scripts/topic.ts` に共通化。

### 過去記事のバックフィル（半年分を遡って埋める）
通常フィードは最新数十件しか返さないため、`--since` を渡したときだけ収集経路を切り替える。日次の自動収集（`--since` なし）の挙動は変えない。
```
npm run collect -- --since=2026-03-02 --until=2026-07-14
      ↓ (1) Google News 検索を暦月ごとの日付窓（after: / before:）で掘る。検索語は scripts/sources.ts の BACKFILL_QUERIES（日本語4・英語4）
      ↓ (2) WordPress フィード（SEL / SEJ / 海外SEO情報ブログ = paged: true）を ?paged=N で遡る
      ↓     ページ送りは「記事0件」「1ページ目と同じ内容が返った」「窓より古い記事に到達」のどれかで打ち切る（上限15ページ）
      ↓     バックフィル由来の候補は note に「バックフィル」が付く
npm run pick -- --since=2026-03-02 --until=2026-07-14 --per-month=5
      ↓ 窓を暦月で区切り、各月からスコア上位を --per-month 件まで採用（月ごとの本数を揃える）。MAX_AGE_DAYS の21日制限は適用しない
      ↓ スコア下限は 2→1（「3日以内+1」の加点を過去記事は誰も取れないため、下限を1つ下げて釣り合わせる）
      ↓ 同一話題の除外は「語が重なる かつ 日付が14日以内」に限定する（3月と6月のコアアップデートを同じ話題と見なさないため）
npm run generate -- 30
      ↓ 「採用」を全件記事化。--publish を付けなければ draft:true なので、目視で確認してから false にする
```
**日次の自動公開と同時に走らせない**: 「採用」が残っていると翌朝のActionsが `pick`（`need = 件数 - 採用済み` が0以下で新規採用なし）→ `generate` でバックフィル分を先に消費し、その日のニュースが出なくなる。collect→pick→generate を一度に流し切ってからコミットする。
**日付は過去のまま**（`date` = 出典の公開日）なので、記事一覧・RSS・`datePublished` は過去日で出る。まとめて公開する場合、初回クロールは全記事が同日になる。
**自動公開の関門は3つ**:
1. **生成の前**に `npm run typecheck` を1回（`.github/workflows/daily-articles.yml`）。mainが壊れているとAPI代を使ってから捨てることになるので、その前に落とす。
   2026-08-28〜30の3便は、mainに `src/lib/apps.ts` が無いまま `sitemap.ts` がimportしていたせいで生成後に落ち、記事ごと捨てて課金だけが残った。
2. `scripts/generate.ts` の `validate()`（カテゴリ・description長・actions・本文1,200字以上・必須見出し4種・図解2個以上・FAQ2問以上）
3. **生成の後**に `npm run typecheck && npm run build`（本番ビルド＝MDXが実際にレンダリングできるか）

どれかで落ちたらpushしないので、その日は何も公開されない。
APIエラー時は「採用」のまま次回に回し、内容起因の失敗・検査落ちは「却下」にしてメモを残す。
**失敗はLINEに飛ぶ**（Actions Secrets に `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_USER_ID` を入れたときだけ。未設定なら黙ってスキップ）。
ワークフローの赤は誰も見ていない前提で運用する。
**公開もLINEに飛ぶ**（`scripts/notify.ts`）。公開した記事のぶんだけ、**Xの投稿文**を1本1メッセージで送る。
LINEで長押し→コピー→Xに貼る運用で、自動投稿はしない（文面と投稿タイミングは人が決める）。
手で作った記事を通知したいときは `npm run notify -- content/articles/0123-foo.mdx`（認証情報が無ければ文面をログに出すだけ）。

投稿文は**Claudeが記事本文を読んで書く**（`scripts/x-post.ts`）。形は「フック1行＋空行＋要点2〜3行」で、
URL・ハッシュタグ・文字数の勘定は機械側（`src/lib/xpost.ts`）が持つ（Xの重み付き280字＝半角1・全角2・URLは23固定）。
生成物は毎回検査して（URL/ハッシュタグ/@を書いていないか、行ごとと全体の字数）、外していたら違反内容を添えて最大3回まで書き直させる。
`ANTHROPIC_API_KEY` が無いときと3回でも通らなかったときは、テンプレの文面（タイトル＋説明＋URL＋タグ）に落ちる——通知そのものは止めない。

## HOW TO記事パイプライン（ストック型）
上のパイプラインはRSS起点なので、出てくるのはニュース（フロー）だけになる。
検索とAI検索から継続的に読まれるのは手順・定義を持つストック記事なので、別系統で作る。
```
content/howto-topics.csv   テーマ表。人が status を「採用」にする。1行 = 1記事
                           列: status / category / title(タイトル案) / intent(検索意図) / sources(一次情報URL、| 区切り) / articleId / note
      ↓ npm run generate:howto N [--publish]
                           「採用」をN件、Claudeが指定URLをすべてweb_fetchで読んで MDX を出力（scripts/generate-howto.ts）
                           → テーマ表の status を「公開」に
```
- 出典は**テーマ表に書いたURLだけ**を許す（モデルが別URLを足したら記事ごと捨てる）。書ける事実の範囲をテーマ表で固定する。
- 必須見出しは「## 結論 / ## 手順 / ## やること／やらなくていいこと / ## よくある質問」、本文2,000字以上、FAQ3問以上。
- 「最近」「現在」のような時点依存の表現を禁止（半年後に読んでも成立させるため）。
- 生成失敗したテーマは「候補」に戻してメモを残す（ニュース側と違い、テーマ自体は捨てない）。
- プロンプトの共通部分（媒体の性格・図解・文体）は `scripts/prompt.ts`、採番・検査・書き出しは `scripts/article.ts` に集約。

## 記事の型（他媒体との差別化）
- frontmatter の `type` で **news（フロー）/ howto（ストック）** を区別する。カテゴリページは howto を上、news を下に分けて出す
- 冒頭に **Key Points パネル**（影響度 / 対象 / 今すぐやること）を固定表示
- 記事ヘッダー・記事カード・OGP画像に出すメタ情報は カテゴリ / 型 / 独自 / 出典 / 公開日（＋更新日）だけ。
  **読了時間（`N min read`）は表示しない**。`reading-time` はCJKを1文字＝1語・200語/分で数えるため
  日本語では実感の2〜3倍の分数になり、当てにならないので依存ごと削除した
- その下に **目次**（`src/components/Toc.tsx`）。本文の `##` だけを並べる（`###` は「よくある質問」配下の
  質問文が中心で、1記事に3〜10個あり目次が本文と同じ長さになるため）。見出しが3個未満の記事には出さない。
  idは `src/lib/toc.ts` が MDX から作り、本文に rehype-slug が振るidと同じものを再現する
  （目次に出さない見出しもsluggerに通して採番をそろえる。ずらすとリンクが外れる）
- 本文に「## 影響を受けるページ・クエリ」（自社のどのページ・クエリが動くかを特定。検索側のKPI推測は書かない）と「## やること／やらなくていいこと」を必須化
- 日本のサイトでの具体例を最低1つ。AI定型表現は禁止（`scripts/generate.ts` の SYSTEM_PROMPT 参照）
- **図解を3〜4個必須**（`src/components/figures.tsx`）。MDX内に直接書ける11種:
  `FigureCompare`（比較。3個なら横3列、それ以外は2列）/ `FigureDoDont`（✓✕の2パネル。やること／やらなくていいことのリストはこれで書く）/
  `FigureFlow`（手順ステップ）/ `FigureStats`（数字カード）/ `FigureBars`（横棒グラフ。マイナス混在で中央0の左右振り分け）/
  `FigureQuote`（一次情報の引用パネル）/ `FigurePipeline`（横並びの処理の流れ。段ごとに「ここで落ちると」を添える）/
  `FigureStack`（土台から積む階層）/ `FigureGauge`（良好／改善が必要／不良のしきい値の帯）/ `FigureTimeline`（期間の帯）/
  `FigureLinkMap`（リンク構造図。ページを箱・内部リンクを矢印で描く。`layer` で階層を指定すると座標は自動。
  `kind` は down（片方向）/ both（双方向）/ side（同じ階層どうしの曲線）、`dim` で孤立ページを破線にする。
  崩れた構造と直した構造を並べるため `maps` に複数渡せる）。
  実画像でなくコード描画なので、生成パイプラインが出力でき、テキストが残るためAI・検索エンジンにも読める。
  props はJS式で渡すため記事ページの `MDXRemote` は `blockJS: false`（記事はリポジトリ内の信頼済みコンテンツ）
- **画面の模式図**（`src/components/screens.tsx`）は解説ページ専用。Search Consoleと検索結果の画面を、スクリーンショットではなく
  同じ情報配置のHTMLで描き起こす（`ScreenSearchPerformance` / `ScreenIndexReport` / `ScreenUrlInspection` / `ScreenSerp`）。
  画面内の数値はすべてサンプルで、図のキャプションに「実際の画面の複製ではない」と明示する。ラベル表記はSearch Consoleヘルプに合わせる。
  記事MDXには渡していない（自動生成の記事が架空の管理画面を出さないようにするため）。

## サイト構成
ナビは **SEO / GEO / ニュース / 教科書 / ツール** の5本。入口をこれだけに絞り、同じ記事群を持つ一覧を2種類作らない。
- `/seo` `/geo` = 解説（ストック）＋そのカテゴリの記事一覧。一覧は「◯◯対策の解説」（`type: howto`）を上、「◯◯の最新記事」（`type: news`）を下に置く（`src/components/CategoryArticles.tsx`）。
- `/news` = 全記事のアーカイブ。新着12本のカードの下に、公開月ごとの全記事リスト。
- `/learn` = 教科書（ストック）。`/seo` `/geo` が「定義」、`/learn` が「順番のある実務手順」という役割分担で、
  ハブ（定義ページ）→ スポーク（各レッスン）の相互リンクを張る。
  **同じ手順を両方に書かない**（着手順・Search Consoleの見方・Googlebotのレンダリングと本人確認・Core Web Vitalsの直し方は `/learn` 側だけに置く）。
  定義ページが長くなったら、手順にあたる節を `/learn` へ移し、跡地に `NextStep` の導線を残す。
- **旧URLは308でリダイレクト**（`next.config.ts`）: `/category/seo`→`/seo`、`/category/geo`→`/geo`、`/category/news`→`/news`、`/articles`→`/news`。
  記事詳細 `/articles/<id>` は変えない（完全一致のみリダイレクト）。
- カテゴリのリンク先は `categoryHref()`（`src/lib/site.ts`）だけを通す。URLを変えるときはここ1か所を直す。

## 自作ツール（/tools 配下）
外部ツールの比較表とは別に、サイト自身が提供する無料ツールを置く。一覧の定義は `src/lib/apps.ts`（/tools のカードと sitemap が同じ定義を見る）。
- **ページ診断 `/tools/page-audit`**: URLを `POST /api/audit` でサーバー側から1回取得し、`src/lib/audit.ts` が判定する。
  指摘は「該当コード（実物）／なぜ直すか／入れる場所／修正後のコード」の4点＋公式ドキュメントのリンク。点数は出さない。
  「無い」系の指摘（title・canonical・JSON-LD・h1 など）は該当コードが存在しないので、代わりに実物の head や既存の見出しを並べ、
  追加する位置に `<!-- ここに◯◯を追加 -->` の印を入れて返す（`headSpot()`）。
  JSは実行しないので、サーバーが返すHTMLに本文が無いページは「本文が少ない」と出る（AI検索のクローラーと同じ見え方）。
  GEOの指摘のうち4項目は **GEO論文（arXiv:2311.09735 / KDD 2024）の実測** を基準にする（`PAPER` 定数で出典を添える）:
  原文の引用（最大41%）・具体的な数値（約32%）・1文の長さ＝読みやすさ（約29%）・外部の出典リンク（約28%）。
  逆にキーワードの詰め込みは効果が無かったので、title・h1 由来の語が本文の5%以上かつ10回以上なら「詰め込み」として指摘する。
  文の長さは段落（p）のテキストだけから数える（ナビや一覧の文言を文として数えないため）。
- **プロンプト適合度 `/tools/prompt-fit`**: 狙っているプロンプト（最大5本）とページを比べ、どの見出しブロックがその質問を担当しているかを出す。
  判定は `src/lib/promptFit.ts`。URLは `POST /api/prompt-fit` で取得するが、原稿を貼り付ければ公開前でも判定できる。
  日本語は形態素解析なしで扱う。文字bigram（英数字は単語）でベクトル化し、TF-IDFのコサイン類似度を見出しブロック単位で取る（埋め込みAPIも外部AIも使わない）。
  返すのは4つ: プロンプトの語が本文にあるか（`語の一致`）、最も近いブロック（`近さ`）、そのブロックの先頭に直答があるか、
  意図（定義/手順/比較/費用/事例/判断）に合った形式（番号付きリスト・表・金額・数値）があるか。足りない場合は見出し・入れる場所・入れる語・文の型を返す。
  ページが多く語っている語のうち、どのプロンプトにも無いものは「狙いから離れている語」として並べる。
- **AIクローラーの定義** `src/lib/crawlers.ts`: AI検索/AI学習/検索エンジンの14種（トークンと用途は各社の公式ドキュメントで確認。verified 日付つき）。
  ページ診断の robots.txt 判定と、`/learn/geo-implementation` の一覧表・robots.txt ひな形（`src/components/RobotsPresets.tsx`）が同じ定義を見る。
  貼り付け式の `/tools/ai-crawlers` は判定がページ診断と重複していたため廃止し、308で `/tools/page-audit` に送っている。
- **robots.txt の判定ロジック** `src/lib/robots.ts`: 前方一致でグループを選び、最長一致が勝ち、同長ならAllowが勝つ（RFC 9309 / Google仕様）。
- **URL取得の安全策** `src/lib/fetchPage.ts`: http/https と 80/443 のみ、名前解決先がプライベート・ループバック・リンクローカルなら拒否（リダイレクトの各ホップで再検査）、
  12秒タイムアウト、2MB上限。結果は保存しない。`/api/audit` と `/api/prompt-fit` がこの1実装を使う。
  連打の抑制は `src/lib/rateLimit.ts`（同一インスタンス内で1分あたり、診断10回・お問い合わせ3回。IPは数えるだけで記録しない）。
- **お問い合わせフォーム** `/contact` → `POST /api/contact`: 入力の検証と通知文は `src/lib/contact.ts`、転送は `src/lib/contact-notify.ts`。
  転送先はLINE（`LINE_CHANNEL_ACCESS_TOKEN` / `LINE_USER_ID`。記事公開の通知と同じBot。共通処理は `src/lib/line.ts`）と
  メール（Resendの `RESEND_API_KEY` / `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL`。差出人は認証済みドメイン、`reply_to` に入力されたアドレス）。
  両方設定すれば両方に届き、**1つも無ければフォーム自体を表示しない**（Vercelの環境変数に入れて再デプロイすると出る）。
  **内容はDBにもログにも保存しない**（転送のみ）。迷惑投稿対策はハニーポット・3秒未満の送信の破棄・回数制限・文字数上限で、外部のCAPTCHAは使わない。
  記載は `/privacy` の「お問い合わせフォームについて」の章と揃える。
- **検査されたURLの記録**（`src/lib/audit-log.ts`）: どんなページが検査されているかを記事の題材選びに使うため、
  Supabase（stock-alert プロジェクトに相乗り）の `seogeo_audit_log` に1件ずつ残す。`SUPABASE_URL` と
  `SUPABASE_PUBLISHABLE_KEY` があるときだけ動き、未設定なら何もしない（ローカル・プレビューは未設定でよい）。
  - 残すもの: 検査対象の**ホスト名とパス**、HTTPステータス、指摘の件数、発火した指摘のID、取得時間、失敗時のエラー文
  - 残さないもの: **URLのクエリ文字列**（`?` 以降。トークン付きURLを貼られても保存しないため `new URL()` で落とす）、
    検査した人のIP・UA、対象ページのHTML
  - **保持30日**。相乗り先が取引システムの本番DBなので、期限は Supabase 側の関数 `seogeo_log_audit` が
    挿入のたびに古い行を削除して担保する（アプリの実装やcronに依存させない）
  - 渡す鍵は publishable（anon）。テーブルへの直接権限は revoke 済みで、この関数の EXECUTE 以外は何もできない。
    service_role キーは使わない（相乗り先のDB全体を触れる鍵をVercelに置かないため）
  - 記録している事実は `/tools/page-audit` のFAQと `/privacy`（「ツールに入力されたURLの記録」の章）に明記する。**内容を変えたら両方直す**

## デザイン
- 黒×生成り（paper）×シアンブルー（accent, Googleブルー×ChatGPTグリーン）。カテゴリ色: seo=青 / geo=紫 / news=橙（`src/lib/categoryStyle.ts`）
- 欧文は Space Grotesk（next/font）、和文は端末フォント
- **デザインシステムは3層**（詳細は `docs/design-system.md`）
  - トークン `src/app/globals.css` の `@theme`: 色・角丸・影・ページ幅・極小文字。値を持つのはここだけ
  - クラス定義 `src/lib/ui.ts`: 面・ボタン・チップ・表・入力・本文の組み合わせ（`SURFACE` / `button()` / `CHIP` / `TABLE` …）
  - 部品 `src/components/ui.tsx`: `Container` / `Card` / `CardLink` / `Button` / `Chip` / `Eyebrow` / `SectionHeading` / `Steps`
- ダークモードは**セマンティックトークンが吸収する**ので `dark:` は原則書かない
  （`canvas` / `fg` / `surface` / `line` / `fill` / `invert` が配色モードで反転する）。
  例外は常に黒地の帯（ヒーロー・PageHeader・記事ヘッダー・図解）で、そこだけ `ink` / `paper` を直接使う
- ページに1回きりのクラスの並びを書かない。同じ形が2か所目に出たら `src/lib/ui.ts` に名前を足す

## 画像（写真素材を持たずにビジュアルを作る）
- **キービジュアルはコードで生成する**（`src/components/KeyVisual.tsx`）。写真素材は持たない。
  記事ID（slug）をシードにした擬似乱数で図柄を決めるので、同じ記事は常に同じ絵になり、
  毎朝の自動生成パイプラインでも人手が要らない。図柄は5種（同心円 / 縦棒 / ノード /
  波 / タイル）、配色はカテゴリ色＋アクセント。インラインSVGなので追加リクエストは発生しない。
  使い所は記事ページのヘッダー背景（`articles/[slug]/page.tsx`）と一覧カードの上部帯（`ArticleCard.tsx`）。
- **OGP画像**: 実PNGを `next/og` で生成する。枠は全ページ共通で `src/lib/og.tsx` の `ogFrame`、
  背景は黒地＋カテゴリ色のグラデーション。和文は Google Fonts から
  **その画像で使う文字だけ**を切り出して読む（`loadOgFont`。ImageResponseの500KB制限対策）。
  フォント取得に失敗しても画像自体は出る（和文が欠けるだけ）。ビルド時にネットワークが必要。
  置き場所は `opengraph-image.tsx` をセグメントごとに置く方式で、**下位のページには自動で引き継がれる**
  （`/tools` の画像が `/tools/page-audit` などにも出る）。記事以外は `pageOgImage()` に文言を渡すだけ:

  | ファイル | 対象 | 見出し |
  |---|---|---|
  | `src/app/opengraph-image.tsx` | トップと、下に画像を持たない全ページ | サイトのキャッチコピー |
  | `src/app/articles/[slug]/opengraph-image.tsx` | 記事ごと | 記事タイトル |
  | `src/app/seo|geo/opengraph-image.tsx` | 解説ページ | 「SEO対策とは」「GEO対策とは」 |
  | `src/app/learn/opengraph-image.tsx` | 教科書の目次と**14レッスン全部** | 「SEO・GEO教科書」 |
  | `src/app/news/opengraph-image.tsx` | 記事アーカイブ | 「検索とAI検索のニュース」 |
  | `src/app/tools/opengraph-image.tsx` | ツール比較と自作ツール2本 | 「SEO・GEOツール比較」 |
  | `src/app/about/opengraph-image.tsx` | 運営者情報 | 「運営者情報」 |

  **注意**: ページ側の `metadata` に `openGraph` を自分で書くと、上位セグメントの画像は引き継がれず
  og:image が消える。レッスン11ページがこれに当たるので、`lessonMetadata()`（`src/lib/curriculum.ts`）で
  `openGraph.images` を明示している。`openGraph` を書き足すときは画像も一緒に指定する。
- **OGP/Twitterカードのメタタグ**: `openGraph` はマージされず**オブジェクトごと置き換わる**ので、
  自前で書くページは `siteName` / `locale` / `url` も毎回書く。逆に `layout.tsx` の `openGraph` と `twitter` には
  **`title` / `description` / `url` を置かない**。置くと全下層ページに継承され、記事を共有しても
  カードの見出しがサイト名になる（X は `twitter:*` を `og:*` より優先する）。
  `twitter.title` を空けておけば Next が `openGraph`→ページの `title` の順で埋める
  （`node_modules/next/dist/lib/metadata/resolve-metadata.js` の `postProcessMetadata`）。
  トップページ分の `og:url` は `src/app/page.tsx` が持つ。
- **記事内の図解**: 上記の `figures.tsx`（10種）。本文中のビジュアルはこれだけ。
- **記事のバッジ（チップ）**: 軸ごとに1つまで。①何の話か＝カテゴリ（SEO/GEO/ニュース、必ず1つ）②記事の型＝`解説`（`type: howto` のときだけ。news は既定なので出さない）③根拠の強さ＝`独自`（`original: true`）か `Google公式`（**主出典＝先頭が当事者のドメイン、または出典の半数以上が当事者のドメイン**のときだけ。添え物として公式ドキュメントを1本引いただけの記事には出さない。`src/lib/sourceVendor.ts` で判定。独自記事にも出さない）。全記事に付くバッジは情報量がゼロなので増やさない。

## 記事 frontmatter
```yaml
id: 12                    # 必須。URLになる連番。生成スクリプトが最大値+1を自動採番
title: "..."
description: "..."        # 90〜120字
date: "2026-08-23"
updated: "2026-08-23"     # 任意。date と違うときだけ「更新 …」を表示し、JSON-LD の dateModified と og:article:modified_time に入る
category: "seo"           # seo | geo | news
type: "news"              # news（既定・省略可） | howto
original: true            # 任意。自分で取ったログ・実測値・検証が中心の独自記事だけに付ける。一覧と記事上部に「独自」バッジが出る
tags: ["SEO", "AI Overview"]
impact: "mid"             # high | mid | low（任意）
audience: "店舗集客サイト"  # 任意
actions:                  # 任意、1〜4項目
  - "robots.txt を確認する"
sources:                  # 先頭が主出典。主出典か半数以上が当事者自身のドメインなら「Google公式」バッジが出る（src/lib/sourceVendor.ts）
  - title: "出典タイトル"
    url: "https://..."
supersedes: 12            # 任意。この記事が置き換える古い記事のid（配列可）。指定された記事は noindex + sitemap除外
draft: false
```

## セットアップ
```bash
npm ci
cp .env.example .env.local   # 値を設定
npm run dev
```

配信されるHTMLを読むとき（Reactが要素間に空白を出さないので、ソースは1行に詰まっている）:
```bash
npm run html -- https://seo-geo-lab.com          # URL でも
npm run html -- .next/server/app/index.html      # ファイルでも
```
インデントを付けて標準出力に流すだけのスクリプト（`scripts/format-html.ts`）。ビルド成果物には関与しない。

アイコンをファイルとして書き出すとき（`src/lib/icon.tsx` の図案を変えたあとだけ。手で実行する）:
```bash
npm run icon   # src/app/favicon.ico（16/32/48/64/128）と docs/brand/icon-1024.png を作り直す
```

## SEO / GEO 対策
- **構造化データ**: Organization / WebSite（全ページ）、Article（記事）、CollectionPage + ItemList（一覧・カテゴリ・タグ）、
  ItemList（/tools）、BreadcrumbList（全ページ）、FAQPage（記事の「## よくある質問」と /about）、
  WebPage（記事以外のページの公開日・更新日。`src/components/PageDates.tsx`）。
  Organization には `logo`（`/icon-512.png`）、記事の Article には `image`（`/articles/<id>/opengraph-image`）を必ず入れる
  ——どちらもリッチリザルトの要件。
- **BreadcrumbList は `src/components/Breadcrumbs.tsx` が可視UIとJSON-LDを同じ配列から出す**（表示と構造化データがずれない）。
  一覧・固定ページは `PageHeader` に `crumbs` を渡すだけで付く。
- **FAQPage は記事本文から抽出する**（`src/lib/faq.ts`）。可視テキストと一言一句一致させるため別データを持たない。
  生成側は `validate()` でFAQ2問以上を必須にしている。
- 記事の出典を `citation` として構造化データに宣言、本文末尾にも一覧表示
- **JSON-LD はインデント付きで出力する**（`src/components/JsonLd.tsx`）。本文HTMLはReactが1行に詰めるため、
  ページのソースを開いた読者が手本として読めるのは構造化データだけになる。gzip後の増分は1ページあたり数十バイト。
- **用語の解説ページ `/seo` `/geo`**: 「SEO対策とは」「GEO対策とは」という定義クエリの受け皿。
  定義文・要点・FAQ・出典・更新日を `src/lib/guides.ts` の1か所に持ち、**可視テキスト・JSON-LD（DefinedTerm / FAQPage）・llms.txt が同じ文字列を使う**。
  記事（フロー）と違い日付で古くならないストックページなので、sitemap の priority はトップの次に高い 0.9。
  事実は各社の公式ドキュメント（Google 検索セントラル / OpenAI / Perplexity / Anthropic / arXiv / web.dev）で裏取りし、citation に入れている。
- **用語の表記ルール（パッセージ / チャンク）**: 本文中の一部分を指す読者向けの語は「パッセージ」に統一する。
  説明を添えるときの定型は「本文中の短いまとまり（パッセージ）」、それ以外は「パッセージ」単独。
  「チャンク」は生成AI側が機械的に切り分けた断片を指すときだけ使い、初出で1文の説明を添える。
  語の違いそのものは `/geo` のFAQ（`src/lib/guides.ts`）で1か所だけ説明する。
- **教科書 `/learn`**: 「SEO対策とは」「GEO対策とは」の次に読む、順番の決まった14レッスン。
  レッスン定義（到達目標・チェックリスト・FAQ・出典）は `src/lib/curriculum.ts` の1か所に持ち、
  **可視テキスト・JSON-LD（LearningResource の teaches / FAQPage / ItemList）・llms.txt が同じ文字列を使う**。
  実例は `src/lib/cases.ts` に分離し、収録条件を「①出典が一次情報 ②施策と数値が同じ文書にある ③数値を言い換えない」の3つに固定した。
  出典は Google 検索セントラルの成功事例・web.dev のケーススタディ・arXiv の GEO 論文のみ。
  数値は各社の環境での結果なので、`CaseList` が「同じ結果を保証しない」注記を必ず添える。
  レッスンの並びは 01 スターターガイド / 02 初期点検 / 03 検索意図とキーワード設計 / 04 ロングテール設計 /
  05 テクニカル / 06 本文の書き方 / 07 スニペット / 08 サイト構造 / 09 ドメイン構造 / 10 GEO実装 / 11 計測 / 12 実例 /
  13 アップデート対応 / 14 ブランドをAIに覚えさせる。
  順番を入れ替えるときに直すのは `src/lib/curriculum.ts` の `order` だけで済む（本文の番号は `lessonNo()` 経由、URLは slug 固定）。
  レッスン07は「抜き出され方」を1章にまとめた場所で、通常のスニペット・強調スニペット・AIによる概要の引用を
  同じ問題として扱い、`nosnippet` / `data-nosnippet` / `max-snippet` で決まる範囲と meta description の位置づけを置く。
  レッスン11には Search Console の点検チェックリスト（初期設定・週次・月次・変更したとき）を置き、
  1項目ごとに「見る場所・合格の条件・崩れていたら」を `GuideChecklist`（`src/components/guide.tsx`）で出す。
  レッスン05には「未インデックスの対処法」（`#not-indexed`）を置き、インデックス登録レポートの理由別に
  「起きていること・対処・直ったかの確認」を並べる。レッスン02・11からはこのアンカーへ送る。
  同じくレッスン05の「クローラーの訪問頻度と取得ファイル」（`#crawl-stats`）は、クロールの統計情報レポートの
  4つの内訳（レスポンス／ファイル形式／目的／Googlebotタイプ）と、HTMLが押し出されているときの対処を扱う。
  レッスン07の「Googleの説明：ECサイトの例で読む」（`#google-ec`）は、リンク構造についてのGoogleの記述が
  ECサイト向けドキュメント（`help-google-understand-your-ecommerce-site-structure`）にまとまっているため、
  そこを引用したうえで「メニュー → カテゴリ → サブカテゴリ → 商品」をメディアの語彙に読み替える表と図を置く。
  **Googleが述べているのは「到達までにたどるリンクの本数」と「そのページに向けられたリンクの本数」を
  相対的な重要度の推測に使うことがある、という点まで**で、階層数やクリック数の上限は示していない。
  「2〜3クリック」のような数字は当サイトの整理なので、図のキャプションで必ず切り分ける。
  続く「「何クリック以内」はGoogleが決めているのか」（`#clicks`）が、その切り分けを1か所に集約する節。
  Googleの3文書（2008年のブログ「Importance of link architecture」＝重要なページはトップからクリックできるように／
  サイトマップのドキュメント＝トップからリンクをたどって重要なページをすべて見つけられること／
  ECサイトのドキュメント＝たどる本数と集まる本数を重要度の推測に使うことがある）を出典つきで並べ、
  **クリック数の数字はどの文書にも無い**ことを明記する。クリック数の目安を本文で使うときは、この節へ送る。
- **用語集 `/glossary`**: 「◯◯とは」は検索でもAI検索でも最も多い形の質問で、AI検索は**質問に直答する短い定義文**を抜き出す。
  `/seo` `/geo` が主要語2つを深く説明するページ、`/glossary` はその周辺語を1語ずつ短く定義するページ。
  定義は**その1文だけ読んで意味が通る**こと（前の項目や見出しに依存しない）。出典は用語ごとに1つだけ持つ
  （複数並べると、どの記述がどの文書由来か分からなくなる）。**新しい用語を足すときは、このサイトが既に
  一次情報として確認済みのURL**（`guides.ts` / `curriculum.ts` / `crawlers.ts` と同じもの）から選ぶ。
  可視テキストと DefinedTerm の `description`、llms.txt が同じ文字列を使う。
- **一覧ページの冒頭に直答段落**（件数・期間・最新記事。`src/lib/collection.ts`）。
  「◯◯の最新動向は？」のような包括クエリにそのまま答えるパッセージをAI検索に渡す。
- **インデックス判定は `src/lib/indexability.ts` に集約する**。ページ側（robots メタ）・sitemap 側・内部リンク側で
  条件がずれると「サイトマップに載っているのに noindex」という矛盾をGoogleに送ることになる。判定を足すときは必ずここに書く。
  - 薄いタグページ: 記事が `TAG_MIN_ARTICLES`（`src/lib/site.ts`、既定2）本未満のタグは `noindex, follow` ＋ sitemap 除外。
    ページ自体は残すので内部リンクの経路としては機能する。
  - 同じ話題のカニバリ対策: 続報が前の記事を置き換えたときは、新しい記事の frontmatter に `supersedes: <古い記事のid>` を書く。
    指定された記事は `noindex, follow` ＋ sitemap 除外になり、本文の冒頭から最新版へ送られる。
    **タイトルの類似度で自動判定はしない** —— `npm run dupes` が候補を報告するだけにしてある。
    `sameTopic()`（`src/lib/topic.ts`）はRSSの見出し重複を弾く基準で、記事タイトルに当てると別の出来事を同一視する
    （実測: 「Google画像検索25周年」と「トップページのボタンをAI Modeに置き換えるテスト」が共有語 google/ai/mode/検索 だけで一致した）。
- **回遊導線**: 記事は本文の**前**に `ArticleNextStep`（同じタグ／カテゴリの解説／ページ診断）を置く
  —— 本文下の関連記事は読み切らないと到達しない。一覧・ツールページは末尾に `NextStep`＋`siblingPages()`（`src/lib/nav.ts`、
  自分の次のページから順に拾うのでどのページも同じ顔にならない）。記事末尾には `ShareButtons`（SDKを読まずWeb Intentのリンクだけ）。
  解説ページは本文の途中に `GuideLessonCta`（`src/components/guide.tsx`）を置いて教科書の該当レッスンへ送る
  —— 末尾の `GuideCrossLinks` は長い解説を読み切らないと届かない。レッスンの見出し・所要時間は `curriculum.ts` から引くので文言は1か所。
  設置は `/geo` の「AIの回答に引用されるまでの経路」の直後（→「GEO実装」）と、`/seo` の「検索Botの種類と動き」の直後（→「テクニカルSEO実装」）。
  どちらも「仕組みが分かった直後 ＝ 自分のサイトで手を動かす番」の位置に置く。本文中の「レッスン05」のような番号は
  `lessonNo()`（`src/lib/curriculum.ts`）から引く —— 手で書いた番号はレッスンを1本足した時点で嘘になる。
- sitemap は **loc と lastmod だけ**を出す。`changefreq` と `priority` はGoogleが無視すると明言している値なので載せない。
  `lastmod` は「そのページの内容が実際に変わるデータ源」から取る（記事=updated、一覧=載っている記事の最新更新日、
  /tools=掲載ツールの最終確認日、固定ページ=`POLICY_UPDATED`）。ビルド時刻は使わない
- `llms.txt`（冒頭に「用語の定義」＝ `/seo` `/geo` の定義文をそのまま掲載・教科書14レッスンの到達目標を番号つきで掲載・サイト概要・記事の作り方・収集元の一次情報源・引用時の注意・最新50本）、RSS、sitemap、robots
- テキスト系ルート（`llms.txt` / `feed.xml` / `ads.txt`）は `force-static`。全ページが静的生成。
- アイコン一式: `favicon.ico`（実ファイル。`/favicon.ico` は `icon.tsx` より優先されるので生成物をコミットする）/
  `icon.tsx`(32) / `apple-icon.tsx`(180) / `icon-192.png` `icon-512.png`（manifest参照用の固定URL）/ `manifest.ts`。
  **図案は `src/lib/icon.tsx` だけ**にあり、上のルートは全部そこを描画する。Xのアイコンは円形に切られるので四隅には何も置かない。
  図案を変えたら `npm run icon` を実行して `src/app/favicon.ico`（16/32/48/64/128。ブックマーク一覧やタスクバーは
  48より大きいサイズを使うので入れておく）と `docs/brand/icon-1024.png`（X等へアップロードする用）を作り直す。
  manifest のアイコンは `any` と `maskable` の両方で宣言する（四隅が空の図案なので、Androidが円形に切っても欠けない）
- E-E-A-T: 運営者は匿名。実名・所属・社名が特定できる経歴は載せないが、**about の「運営者と連絡先」には
  匿名のまま検証できる属性（職種＝ネット企業のPdM、運営動機＝勉強を兼ねた個人運営、自作ツール、公式X）を書く**。
  加えて **about には記事がAI生成・自動公開であることと自動検査の内容、収集元の媒体一覧
  （`scripts/sources.ts` の `home` から生成）、FAQを掲載する**。記事本文では一人称の経験談は書かない
  （書くのは自分で検証した `original: true` の独自記事だけ）。
  連絡窓口は匿名のまま用意する（メール or フォーム or 公式X。Organization contactPoint はメール > フォーム > X の順で1つ宣言）
- 公式X（`X_SCREEN_NAME`）は**about の自己紹介で「公式アカウントはこれ1つ」と明記**し、同じURLを
  Organization の `sameAs`・フッター/about/contact の `rel="me"`・`llms.txt` の「サイト情報」で揃える。
  同名アカウントとの取り違えを防ぎ、AI検索がサイトと外部プロフィールを同一エンティティとして結べるようにするため

## 計測
- **GA4**: `NEXT_PUBLIC_GA_ID` があるときだけ `<GoogleAnalytics>` と `GaClickTracker` を出す。
- **クリック計測**（`src/components/GaClickTracker.tsx`）: 全リンク・ボタンのクリックを `click` イベント
  （`label` / `tag` / `external` / `path`）としてGA4へ送る。各ボタンに個別実装しない。
  **PVだけでは「そのページから次へ行けたか」が分からない**ため、回遊導線（`NextStep` / `ShareButtons`）の
  効果はこのイベントでしか確認できない。
- Vercel Analytics / Speed Insights は常時有効。

## AdSense審査で見られる点（実装済み）
- 固定ページ: `/about`（運営者・記事の作り方・編集方針・FAQ）/ `/privacy` / `/disclaimer` / `/contact`。全ページのフッターから到達できる
- プライバシーポリシーに **AdSenseが要求する開示**（第三者配信事業者によるCookie使用、パーソナライズ広告の無効化リンク、
  GAオプトアウトアドオン、EU/英国の同意、13歳未満）を記載。文言を削るとポリシー違反になる
- 免責事項に著作権・引用の方針と権利者からの連絡窓口
- 広告には必ず「広告」ラベル（`src/components/AdUnit.tsx`）。記事と誤認させる置き方をしない
- `ADSENSE_CLIENT` 設定時のみ、`<meta name="google-adsense-account">`（所有権確認）と `/ads.txt` を出力
- **審査前にユーザー側で必要な作業**: 連絡先env（`NEXT_PUBLIC_CONTACT_EMAIL` など）の設定、AdSense管理画面でのEU同意メッセージ（Privacy & messaging）の有効化
- 記事冒頭に「## 結論」を置き、その1文目をタイトルへの直答の断定文にする執筆ルール（AI検索のパッセージ抽出向け）。
  FAQの回答は質問文を読まなくても意味が通る形にする。
- 和文Webフォント不使用（端末フォント）で初期表示を軽く保つ

## 未着手 / 将来
- **AIクローラーのアクセスログ**（`proxy.ts` + Supabase）。AIクローラーはJSを実行しないのでGA4に載らず、
  巡回の実態はサーバーログにしか無い。UAの定義は `src/lib/crawlers.ts` に14種そろっている。
  コスト懸念で保留中（`docs/progress_ga_supabase_logging.md`、運営者判断）
- 運用レポート（GSC / GA4 / AI巡回の前後比較）。kujira-watch の `tools/gsc_report.py` `ga4_clicks.py` `geo_report.py` 相当
- サイト共通の `/faq`（カテゴリ分割が前提。1ページに全問置くとHTMLが肥大する）、用語集ページ
- 記事内検索、英語版
- タグURLのASCII化（現状 `/tag/店舗集客`）。308リダイレクトと衝突管理が必要なので、タグが定着してから判断する
- 週次/月次のまとめページ。記事本数が増えて一覧が長くなってから
- 業務委託の導線はPVが伸びてから（現段階では設計に含めない。`/contact` は問い合わせ受付のみで受注導線は置かない）
