import type { Metadata } from "next";
import CategoryArticles from "@/components/CategoryArticles";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { FigureCompare, FigureDoDont, FigureFlow, FigureGauge, FigurePipeline, FigureQuote, FigureStack, FigureTimeline } from "@/components/figures";
import { GuideAnswer, GuideCitation, GuideCrossLinks, GuideFaq, GuideRef, GuideSection, GuideSources, GuideTable, GuideToc } from "@/components/guide";
import { ScreenIndexReport, ScreenSearchPerformance, ScreenSerp, ScreenUrlInspection } from "@/components/screens";
import { faqPageJsonLd } from "@/lib/faq";
import { GUIDES, guideJsonLd, jpDate } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";
import { LINK, PROSE, cx } from "@/lib/ui";

const guide = GUIDES.seo;
const url = `${SITE_URL}${guide.path}`;

// Googleが公式に述べている記述の直後に置く一次情報リンク。GuideSources の一覧と同じURLを使い、
// 該当セクションのアンカーがある場合はそこまで飛ばす（本文のどの一文がどの文書由来かを示すため）。
const REF = {
  essentials: { href: "https://developers.google.com/search/docs/essentials?hl=ja", label: "Google 検索の基本事項" },
  spamLink: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja#link-spam", label: "スパムに関するポリシー（リンクスパム）" },
  spamScaled: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja#scaled-content", label: "スパムに関するポリシー（大量生成されたコンテンツの不正使用）" },
  helpfulContent: { href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja", label: "有用で信頼性の高い、ユーザー第一のコンテンツの作成" },
  vitals: { href: "https://web.dev/articles/vitals#core-web-vitals", label: "web.dev「Web Vitals」" },
  structuredData: { href: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ja", label: "構造化データの仕組みについて" },
  aiFeatures: { href: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja", label: "AI 機能とウェブサイト" },
  indexReport: { href: "https://support.google.com/webmasters/answer/7440203?hl=ja", label: "ページ インデックス登録レポート" },
  crawlersOverview: { href: "https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers?hl=ja", label: "Google クローラーとフェッチャーの概要" },
  commonCrawlers: { href: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers?hl=ja", label: "Google の一般的なクローラー" },
  userTriggered: { href: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers?hl=ja", label: "ユーザー トリガー フェッチャー" },
  jsBasics: { href: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=ja", label: "JavaScript の基本を理解する" },
  robotsIntro: { href: "https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ja", label: "robots.txt の概要" },
  verifyGooglebot: { href: "https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot?hl=ja", label: "Google クローラーの確認" },
} as const;

export const metadata: Metadata = {
  title: guide.metaTitle,
  description: guide.description,
  alternates: { canonical: guide.path },
  openGraph: {
    type: "article",
    title: guide.metaTitle,
    description: guide.description,
    url,
    publishedTime: guide.published,
    modifiedTime: guide.updated,
  },
};

const TOC = [
  { id: "definition", label: "SEO対策とは（定義）" },
  { id: "bots", label: "検索Botの種類と動き" },
  { id: "areas", label: "SEOの3領域と着手する順番" },
  { id: "google", label: "Googleが公式に示している基準" },
  { id: "steps", label: "最初の90日でやること" },
  { id: "gsc", label: "Search Consoleのどこを見るか" },
  { id: "dodont", label: "やること／やらなくていいこと" },
  { id: "myths", label: "よくある誤解" },
  { id: "geo", label: "SEO対策とGEOの関係" },
  { id: "faq", label: "よくある質問" },
];

export default function SeoGuidePage() {
  return (
    <>
      <JsonLd data={guideJsonLd(guide)} />
      <JsonLd data={faqPageJsonLd(url, guide.faq)} />
      <PageHeader eyebrow={`Guide · 更新 ${jpDate(guide.updated)}`} title={guide.h1} lead={guide.description} crumbs={[{ name: guide.h1 }]} />

      <div className={cx(PROSE.page, "prose-headings:scroll-mt-24")}>
        <GuideAnswer guide={guide} />
        <GuideToc items={TOC} />

        <GuideSection
          id="definition"
          title="SEO対策とは（定義）"
          lead="SEO対策（Search Engine Optimization／検索エンジン最適化）とは、検索エンジンが自社サイトのページを取得（クロール）し、内容を理解（インデックス）し、ユーザーの検索クエリに対して上位に表示できる状態に整える一連の施策のことです。広告費を払って掲載枠を買う検索広告と違い、検索結果の自然枠に表示されることを目指します。"
        >
          <p>
            作業の中身は、次の3つの問いに順番に答えていくことだと考えると整理しやすくなります。前の問いに「いいえ」がある状態では、
            後の問いにいくら手を入れても検索結果は動きません。
          </p>
          <FigurePipeline
            title="検索結果に出るまでの3段階"
            stages={[
              {
                label: "クロール",
                desc: "Googlebotがrobots.txt・内部リンク・サイトマップをたどってページを取得する。",
                fail: "そもそも取得されず、検索結果に一切出ない。",
              },
              {
                label: "インデックス",
                desc: "本文・見出し・構造化データを解析し、検索用のデータベースに登録する。",
                fail: "取得はされるが登録されず、どのクエリでも表示されない。",
              },
              {
                label: "ランキングと表示",
                desc: "クエリとの関連性・有用性を評価して順位を決め、検索結果に出す。",
                fail: "登録はされるが上位に出ず、流入にならない。",
              },
            ]}
            caption={
              <>
                Googleは、要件を満たしていてもクロール・インデックス登録・掲載は保証しないと明記しています。
                <GuideRef {...REF.essentials} />
              </>
            }
          />
          <GuideTable
            head={["問い", "検索エンジン側の処理", "答えが「いいえ」のときに起きること"]}
            rows={[
              ["ページを見つけられるか", "クロール（robots.txt・内部リンク・サイトマップをたどってページを取得する）", "そもそも取得されず、検索結果に一切出ない"],
              ["内容を理解できるか", "インデックス登録（本文・見出し・構造化データを解析して保存する）", "取得はされるが登録されず、どのクエリでも表示されない"],
              ["ユーザーに選ばれるか", "ランキングと表示（クエリとの関連性・有用性を評価して順位を決める）", "登録はされるが、上位に出ず流入にならない"],
            ]}
            caption={
              <>
                Googleは、要件とベストプラクティスをすべて満たしていても、クロール・インデックス登録・掲載が保証されるわけではないと明記しています。
                <GuideRef {...REF.essentials} />
              </>
            }
          />
          <ScreenSerp />
        </GuideSection>

        <GuideSection
          id="bots"
          title="検索Botの種類と動き"
          lead="サイトに来る検索エンジンのBotは1種類ではありません。Googleは自社のクローラーを、検索の索引を作る「一般的なクローラー」、広告やテストのための「特殊なケース用のクローラー」、ユーザーの操作で動く「ユーザー トリガー フェッチャー」の3つに分けて公開しています。robots.txtをどのトークンに書くかで、止まるものと止まらないものが変わります。"
        >
          <FigureCompare
            title="Googleが公開しているBotの3分類"
            cols={[
              {
                label: "一般的なクローラー",
                tone: "seo",
                sub: "検索の索引を作る",
                points: [
                  "代表: Googlebot・Googlebot-Image・Googlebot-News",
                  "役割: ページを取得してGoogle検索の索引に登録する",
                  "動き: サイト全体を自動で巡回し続ける",
                  "自動クロールでは常にrobots.txtのルールに従う",
                ],
              },
              {
                label: "特殊なケース用",
                tone: "accent",
                sub: "特定のサービス用",
                points: [
                  "代表: AdsBot・Google-InspectionTool",
                  "役割: 広告の品質確認や、URL検査・リッチリザルトテスト",
                  "動き: サービスの必要に応じて取得する",
                  "AdsBotは広告パブリッシャーの許可に基づき、robots.txtのグローバル指定（*）を無視する",
                ],
              },
              {
                label: "ユーザー トリガー フェッチャー",
                tone: "geo",
                sub: "人の操作で動く",
                points: [
                  "代表: Google-NotebookLM・Google-Site-Verification",
                  "役割: ユーザーが指定したURLをその場で取得する",
                  "動き: 巡回しない。1回の操作につき必要なURLだけ",
                  "フェッチはユーザーのリクエストによるため、通常robots.txtのルールを無視する",
                ],
              },
            ]}
            caption="AI検索側のBot（OAI-SearchBot・PerplexityBotなど）も同じ考え方で用途ごとに分かれている。詳細はGEOの解説ページで整理している。"
          />
          <p>
            SEOでまず押さえるのはGooglebotです。Googlebotにはスマートフォン用とパソコン用の2種類のユーザーエージェントがあり、
            Googleは、Googlebotに対するクロール設定がGoogle検索（Discoverやすべての検索機能を含む）だけでなく、画像検索・Google Video・
            Googleニュースなどのサービスにも影響すると説明しています。つまりrobots.txtでGooglebotを止めると、検索結果だけでなく
            画像やニュースへの露出も同時に失います。
            <GuideRef {...REF.commonCrawlers} />
          </p>
          <GuideTable
            head={["トークン", "分類", "役割", "robots.txtで拒否すると"]}
            rows={[
              ["Googlebot", "一般的なクローラー", "Google検索の索引を作る。AIによる概要・AIモードもこの索引を使う", "検索・Discover・AI機能のいずれにも表示されない"],
              ["Googlebot-Image", "一般的なクローラー", "画像のクロール", "Google画像検索や、画像が表示される検索機能に出なくなる"],
              ["Googlebot-News", "一般的なクローラー", "ニュース向けのクロール", "Googleニュース関連のプロダクトに出なくなる"],
              ["Google-InspectionTool", "特殊なケース用", "Search ConsoleのURL検査・リッチリザルトテスト", "自分でページを検査・テストできなくなる"],
              ["AdsBot", "特殊なケース用", "広告のランディングページの品質確認", "広告の品質評価ができず、広告配信に影響する。グローバル指定（*）では止まらない"],
              ["Google-Extended", "AI向けのトークン", "Geminiアプリの学習・グラウンディング。単独のUser-Agent文字列は持たない", "Gemini側での利用から外れる。Google検索の登録・ランキングには影響しない"],
            ]}
            caption={
              <>
                分類と役割はGoogleの公式ドキュメントの記述に沿っています。
                <GuideRef {...REF.crawlersOverview} />
                <GuideRef {...REF.commonCrawlers} />
              </>
            }
          />
          <h3>Googlebotの動き: クロールとレンダリングは別のタイミング</h3>
          <p>
            GooglebotはHTMLを取得したあと、ヘッドレスChromiumでページをレンダリングしてJavaScriptを実行し、その結果をインデックスに登録します。
            ただしレンダリングはクロールと同時ではなく順番待ちのキューに入り、ページがこのキューで数秒間、またはそれ以上待機することがあると
            Googleは説明しています。JavaScriptでしか描画されない本文は、登録が遅れたり、失敗すれば登録されなかったりします。
            重要な見出し・本文・内部リンクは、最初のHTMLに含めておくのが安全です。
            <GuideRef {...REF.jsBasics} />
          </p>
          <h3>robots.txtで拒否しても、検索結果から消えるとは限らない</h3>
          <p>
            Googleは、robots.txtでブロックされているコンテンツをクロールしたりインデックスに登録したりすることはないが、
            ブロック対象のURLが他の場所からリンクされている場合は、そのURLを検出してインデックスに登録する可能性があると説明しています。
            robots.txtは「取得させない」設定であって「検索結果に出さない」設定ではありません。検索結果から外したいページには
            noindexを使いますが、robots.txtで拒否しているとnoindexそのものが読まれないため、両方を同時に設定してはいけません。
            <GuideRef {...REF.robotsIntro} />
          </p>
          <h3>Googlebotを名乗る偽のアクセスを見分ける</h3>
          <p>
            User-Agentの文字列は誰でも名乗れるため、アクセスログの「Googlebot」が本物とは限りません。Googleは確認方法として、
            アクセス元IPアドレスの逆引きDNSでドメイン名がgooglebot.com・google.com・googleusercontent.comのいずれかであることを確認し、
            さらにそのドメイン名を順引きして元のIPに一致するかを見る手順を示しています。クローラーごとの
            <a href="https://developers.google.com/search/apis/ipranges/googlebot.json" target="_blank" rel="noopener">IPレンジのJSON</a>
            も公開されているので、ログ側で突き合わせることもできます。サーバー負荷を理由にBotを遮断する前に、まず本物かどうかを確認します。
            <GuideRef {...REF.verifyGooglebot} />
          </p>
          <p>
            ChatGPT・Perplexity・ClaudeなどのAI検索側のBotは、これとは別に用途ごとのトークンが用意されています。
            種類ごとの動きと、robots.txtで止めたときに何を失うかは<a href="/geo#bots">GEOの解説ページ</a>にまとめています。
          </p>
        </GuideSection>

        <GuideSection
          id="areas"
          title="SEOの3領域と着手する順番"
          lead="SEO対策の作業は、テクニカルSEO（読める状態にする）・コンテンツSEO（検索意図に答える）・外部評価（他サイトから参照される）の3領域に分けられます。着手する順番もこの通りで、技術的に読めないサイトで記事を増やしても評価は積み上がりません。"
        >
          <FigureStack
            title="SEOの3領域は下から積む"
            layers={[
              {
                label: "外部評価",
                tone: "geo",
                note: "3か月〜",
                desc: "他のサイトやユーザーから参照・言及される。一次情報の公開や広報の結果として増えるもので、買うものではない。",
              },
              {
                label: "コンテンツSEO",
                tone: "seo",
                note: "1〜3か月",
                desc: "検索クエリの背後にある意図に答えるページを用意する。既存ページの改善が先、新規作成はその後。",
              },
              {
                label: "テクニカルSEO",
                tone: "accent",
                note: "数日〜数週間",
                desc: "検索エンジンがページを取得し、正しく理解できる状態にする。robots.txt・サイトマップ・canonical・内部リンク・表示速度。",
              },
            ]}
            baseNote="下の層が欠けたまま上を積んでも評価は伸びない。技術的に読めないサイトで記事だけ増やしても、インデックスされなければ0のまま。"
            caption="期間の目安は当サイトの整理であり、Googleが保証する期間ではありません。"
          />
          <GuideTable
            head={["領域", "目的", "代表的な作業", "反映までの目安"]}
            rows={[
              [
                "テクニカルSEO",
                "検索エンジンがページを取得し、正しく理解できる状態にする",
                "robots.txt・XMLサイトマップ・canonical・内部リンク・構造化データ・表示速度・スマホ対応",
                "数日〜数週間",
              ],
              [
                "コンテンツSEO",
                "検索クエリの背後にある意図に答えるページを用意する",
                "キーワードと検索意図の調査、タイトルと見出しの設計、既存ページの改善、重複ページの統合",
                "1〜3か月",
              ],
              [
                "外部評価",
                "他のサイトやユーザーから参照・言及される状態をつくる",
                "一次情報やデータの公開、取材・寄稿、指名検索を増やす広報活動",
                "3か月〜",
              ],
            ]}
            caption="反映までの目安は当サイトの整理であり、Googleが保証する期間ではありません。"
          />
          <p>
            外部評価は「被リンクを買う」作業ではありません。Googleはスパムに関するポリシーで、ランキングを上げることを目的としたリンクの売買を
            リンクスパムとして挙げており、ポリシーに違反しているサイトは検索結果での掲載順位が下がったり、まったく表示されなかったりすることがあると
            説明しています。
            <GuideRef {...REF.spamLink} />
          </p>
        </GuideSection>

        <GuideSection
          id="google"
          title="Googleが公式に示している基準"
          lead={
            <>
              Googleが公開している判断基準は「Google検索の基本事項（Google Search Essentials）」の3本柱、すなわち技術的な要件・スパムに関するポリシー・主要なベストプラクティスです。
              非公開のチェックリストや裏技は存在せず、SEO対策はこの3つを満たす作業に還元されます。
              <GuideRef {...REF.essentials} />
            </>
          }
        >
          <GuideTable
            head={["3本柱", "内容", "満たさないと"]}
            rows={[
              ["技術的な要件", "Googlebotがページを取得でき、ページが機能し、コンテンツがインデックス可能な形式であること", "インデックスに登録されない"],
              ["スパムに関するポリシー", "自動生成された無価値な大量ページ、リンクの売買、クローキングなどを行わないこと", "順位低下、または検索結果からの削除"],
              ["主要なベストプラクティス", "ユーザー第一の有用なコンテンツ、分かりやすいタイトルと見出し、画像の代替テキスト、リンク構造の整備", "掲載はされても評価が伸びない"],
            ]}
            caption={
              <>
                3本柱の区分と各項目の内容は、Googleが公開している「Google検索の基本事項」にもとづきます。
                <GuideRef {...REF.essentials} />
              </>
            }
          />
          <h3>E-E-A-T（経験・専門性・権威性・信頼）</h3>
          <p>
            E-E-A-TはExperience・Expertise・Authoritativeness・Trustの頭文字で、Googleが「有用で信頼性の高い、ユーザー第一のコンテンツ」を
            作れているか自己評価するための観点として公開しているものです。
            <GuideRef {...REF.helpfulContent} />
            E-E-A-Tという単一のスコアが公開されているわけではないため、
            順位を直接操作する設定ではなく、コンテンツを点検するチェックリストとして使います。実務では、誰が書いたのかを明示する、
            一次情報のリンクを添える、更新日を出す、といった形でページに落とします。
          </p>
          <FigureCompare
            title="E-E-A-Tの4つの観点と、ページ上での見え方"
            cols={[
              {
                label: "Experience",
                sub: "経験",
                tone: "accent",
                points: ["実際に使った・行った・試した人が書いているか", "実測値・スクリーンショット・作業の手順を載せる"],
              },
              {
                label: "Expertise",
                sub: "専門性",
                tone: "seo",
                points: ["そのテーマについて説明できる知識があるか", "著者情報と、扱う範囲を絞ったサイト構成で示す"],
              },
              {
                label: "Authoritativeness",
                sub: "権威性",
                tone: "geo",
                points: ["そのテーマの情報源として参照されているか", "一次情報の公開と、他サイトからの言及の積み上げ"],
              },
              {
                label: "Trust",
                sub: "信頼",
                tone: "news",
                points: ["情報の正確さと、運営者の透明性が確認できるか", "出典リンク・更新日・運営者情報・問い合わせ先を明示する"],
              },
            ]}
            caption="4観点の説明はGoogleの公開ドキュメントにもとづく当サイトの整理です。E-E-A-Tという単一のスコアは公開されていません。"
          />
          <h3>Core Web Vitals（ページの体験）</h3>
          <p>
            ページの表示体験を測る3指標です。良好とされるしきい値は次の通りで、判定はモバイルとPCを分けたうえで全体の75パーセンタイルの値で見ます。
            <GuideRef {...REF.vitals} />
          </p>
          <GuideTable
            head={["指標", "測るもの", "良好の目安"]}
            rows={[
              ["LCP（Largest Contentful Paint）", "読み込みの速さ。主要なコンテンツが表示されるまでの時間", "2.5秒以内"],
              ["INP（Interaction to Next Paint）", "応答性。操作してから画面が反応するまでの時間", "200ミリ秒以下"],
              ["CLS（Cumulative Layout Shift）", "視覚的な安定性。読み込み中にレイアウトがずれる量", "0.1以下"],
            ]}
            caption={
              <>
                しきい値と75パーセンタイルでの判定はGoogleのweb.devが公開しているもので、今後変更される可能性があります。
                <GuideRef {...REF.vitals} />
              </>
            }
          />
          <FigureGauge
            title="Core Web Vitalsの3段階（良好／改善が必要／不良）"
            items={[
              { label: "LCP", sub: "主要なコンテンツが表示されるまでの時間", good: "2.5秒", poor: "4.0秒" },
              { label: "INP", sub: "操作してから画面が反応するまでの時間", good: "200ms", poor: "500ms" },
              { label: "CLS", sub: "読み込み中にレイアウトがずれる量", good: "0.1", poor: "0.25" },
            ]}
            caption={
              <>
                帯の下の数値は「良好」と「改善が必要」の境界、および「不良」の始まりです。判定はモバイルとPCを分け、全体の75パーセンタイルで見ます。
                <GuideRef {...REF.vitals} />
              </>
            }
          />
        </GuideSection>

        <GuideSection
          id="steps"
          title="最初の90日でやること"
          lead="SEO対策を始めるときは、計測環境の用意 → 技術的な土台の確認 → 既存ページの改善 → 新規ページの追加、の順に進めます。計測ができていない状態で施策だけ増やすと、順位が動いた理由を後から確認できなくなります。"
        >
          <FigureFlow
            title="SEO対策の着手順（最初の90日）"
            steps={[
              { label: "Search Consoleとアクセス解析を入れる", desc: "所有権を確認し、表示回数・クリック数・平均掲載順位を見られる状態にする。ここが無いと施策の効果を確認できない。" },
              { label: "インデックス状況とrobots.txtを確認する", desc: "重要なページが「登録済み」になっているか、意図せず noindex や Disallow になっていないかを確認する。" },
              { label: "XMLサイトマップとcanonicalを整える", desc: "サイトマップを送信し、同じ内容が複数URLで見える状態（パラメータ違いなど）を canonical で1本化する。" },
              { label: "既に表示回数のあるページを直す", desc: "検索クエリに対してタイトル・導入文・見出しが答えているかを見直す。新規作成より先に、既に見られているページを直すほうが早い。" },
              { label: "答えの無いクエリに対して新しいページを作る", desc: "Search Consoleで表示回数はあるのに該当ページが無いクエリを探し、その質問に直答するページを追加する。" },
              { label: "4週間おきに数値で確認する", desc: "順位の体感ではなく、表示回数・クリック数・インデックス数の推移で判断する。改善が無い施策は畳む。" },
            ]}
          />
          <FigureTimeline
            title="90日の割り振り（何を、いつ動かすか）"
            axis={["1週目", "4週目", "8週目", "12週目"]}
            rows={[
              { label: "計測環境の用意", start: 0, span: 10, desc: "Search Console・アクセス解析", tone: "accent" },
              { label: "インデックスとrobots.txtの確認", start: 6, span: 16, desc: "登録済みか、止めていないか", tone: "accent" },
              { label: "サイトマップとcanonical", start: 14, span: 18, desc: "送信と重複URLの1本化", tone: "accent" },
              { label: "既存ページの改善", start: 24, span: 46, desc: "表示回数のあるページから", tone: "seo" },
              { label: "新規ページの追加", start: 52, span: 48, desc: "答えの無いクエリに対して", tone: "seo" },
              { label: "4週おきの数値確認", start: 24, span: 76, desc: "表示回数・クリック数・登録数", tone: "geo" },
            ]}
            caption="割り振りは当サイトの整理です。効果が出るまでの期間はGoogleが保証しているものではありません。"
          />
        </GuideSection>

        <GuideSection
          id="gsc"
          title="Search Consoleのどこを見るか"
          lead="SEO対策の効果は、順位チェックツールの体感ではなくGoogle Search Consoleの3画面で確認します。「検索パフォーマンス」で表示回数とクリック数の推移を、「ページ」でインデックス登録の状況を、「URL 検査」で1ページずつの登録可否を見ます。"
        >
          <ScreenSearchPerformance />
          <p>
            最初に見るのは順位ではなく<strong>表示回数</strong>です。表示回数が増えているなら、まだクリックされていなくても
            インデックスと関連性は前に進んでいます。逆に、表示回数が多いのにクリック数が伸びないページは、順位よりも
            タイトルと説明文が検索意図に答えられていないことを疑います。
          </p>
          <ScreenIndexReport />
          <p>
            「未登録」の件数そのものは問題ではありません。タグ一覧やパラメータ違いのURLも未登録に入るためです。
            見るのは内訳で、公開したいページが「クロール済み - インデックス未登録」や「noindex タグによって除外されました」に
            入っていないかを確認します。
            <GuideRef {...REF.indexReport} />
          </p>
          <ScreenUrlInspection />
        </GuideSection>

        <GuideSection
          id="dodont"
          title="やること／やらなくていいこと"
          lead={
            <>
              SEO対策には、費用対効果が明確な作業と、効果が確認されていないか、Googleが不要と明言している作業が混ざっています。
              次の整理は、Googleの公式ドキュメントに書かれている内容にもとづくものです。
              <GuideRef {...REF.essentials} />
              <GuideRef {...REF.spamLink} />
              <GuideRef {...REF.aiFeatures} />
            </>
          }
        >
          <FigureDoDont
            title="SEO対策で手を動かす場所"
            dos={[
              "Search Consoleでインデックス登録の状況を定期的に確認する",
              "検索意図に答える本文を書き、結論を最初の段落に置く",
              "タイトルと見出しをページの内容と一致させる",
              "重要なコンテンツをテキストで提示する（画像内の文字は読まれない）",
              "構造化データを、ページに表示されているテキストと一致させる",
              "内部リンクで重要なページへの経路を作る",
            ]}
            donts={[
              "キーワードを本文に不自然に詰め込む",
              "被リンクを購入する（スパムポリシー違反）",
              "同じ内容のページを地域名だけ変えて量産する",
              "AI機能に出るためだけの特別なマークアップを追加する（Googleは不要と明記）",
              "順位チェックツールの日々の上下に反応して施策を変える",
            ]}
          />
        </GuideSection>

        <GuideSection id="myths" title="よくある誤解">
          <h3>誤解1: SEOは終わった</h3>
          <p>
            AI検索の普及で「SEOは終わった」と言われることがありますが、Googleは、AIによる概要やAIモードにページがサポートリンクとして表示されるには、
            ページがインデックスに登録され、Google検索でスニペットが表示され、検索の技術的要件を満たしている必要があると説明しています。
            <GuideRef {...REF.aiFeatures} />
            AI機能の参照元になる前提がインデックス登録である以上、SEOの土台は前提条件として残ります。
          </p>
          <h3>誤解2: 記事を毎日出せば順位が上がる</h3>
          <p>
            更新頻度そのものが順位を決めるという公式の説明はありません。Googleはスパムに関するポリシーで、生成AIツールなどを使ってユーザーにとっての
            価値を付加することなく大量のページを生成することを「大量生成されたコンテンツの不正使用」として挙げています。
            <GuideRef {...REF.spamScaled} />
            増やすかどうかは、そのページが答えるべき検索クエリがあるかで判断します。
          </p>
          <h3>誤解3: 構造化データを入れると順位が上がる</h3>
          <p>
            構造化データは、ページの内容を検索エンジンが理解し、検索結果でリッチリザルトとして表示するための仕組みです。
            <GuideRef {...REF.structuredData} />
            Googleは、AI機能で表示されるために新たなAIテキストファイルやマークアップを作成する必要はなく、特別なschema.orgの構造化データを
            追加する必要もないと明記しています。
            <GuideRef {...REF.aiFeatures} />
            構造化データは順位を買う手段ではなく、内容を正しく伝える手段だと考えるのが実務上は正確です。
          </p>
        </GuideSection>

        <GuideSection
          id="geo"
          title="SEO対策とGEOの関係"
          lead={
            <>
              SEO対策の土台は、そのままGEO（生成AI検索最適化）にも効きます。Googleは公式ドキュメントで、AIによる概要やAIモードにコンテンツが
              表示されるための追加の要件はなく、別途特別な最適化を行う必要もないと説明しています。
              <GuideRef {...REF.aiFeatures} />
            </>
          }
        >
          <FigureQuote
            text="SEO のベスト プラクティスは、引き続き Google 検索の AI 機能（AI による概要や AI モードなど）でも有効です"
            source={
              <a href={REF.aiFeatures.href} target="_blank" rel="noopener" className={LINK}>
                Google 検索セントラル「AI 機能とウェブサイト」
              </a>
            }
          />
          <p>
            違いが出るのは書き方と、Google以外のAIのクローラーへの対応です。生成AIは、ページ全体ではなく本文中の短いまとまり（パッセージ）を
            引用します。そのため、質問文にそのまま答える段落を見出しの直後に置く、数値や条件を表と箇条書きで構造化する、
            更新日と出典を明示する、といった書き方が追加の作業になります。ChatGPTやPerplexityは自前のクローラーで巡回するため、
            robots.txtでそれらを止めていないかの確認も必要です。詳しくはGEOの解説ページで整理しています。
          </p>
          <FigureCompare
            title="共通の土台と、GEOで足す作業"
            cols={[
              {
                label: "SEOと共通の土台",
                tone: "seo",
                sub: "AI機能に出る前提もここ",
                points: [
                  "クロールとインデックス登録ができている",
                  "検索でスニペットが表示できる",
                  "検索の技術的要件を満たしている",
                  "検索意図に答える本文がある",
                ],
              },
              {
                label: "GEOで足す作業",
                tone: "geo",
                sub: "新しいマークアップではなく書き方と設定",
                points: [
                  "質問文にそのまま答える段落を見出しの直後に置く",
                  "数値や条件を表・箇条書きで構造化する",
                  "更新日と出典を明示する",
                  "AI各社のクローラーをrobots.txtで止めていないか確認する",
                ],
              },
            ]}
            caption={
              <>
                Googleは、AI機能に表示されるための追加要件はなく、特別な構造化データやAIテキストファイルも必要ないと明記しています。
                <GuideRef {...REF.aiFeatures} />
              </>
            }
          />
        </GuideSection>

        <GuideSection id="faq" title="よくある質問">
          <GuideFaq items={guide.faq} />
        </GuideSection>

        <GuideSources sources={guide.sources} />
        <GuideCitation guide={guide} />
        <GuideCrossLinks
          links={[
            { href: "/learn", label: "SEO・GEO教科書（10レッスン）", note: "定義の次に読む教科書。基礎→実装→運用の順に、到達チェックリストと実例つきで積み上げる。" },
            { href: "/geo", label: "GEOとは", note: "生成AI検索最適化の定義、SEOとの違い、AIクローラーの一覧。" },
            { href: "/tools", label: "SEO・GEOツール比較", note: "順位計測・クロール監査・AI可視性計測ツールを国内外で比較。" },
            { href: "/about", label: "運営者情報", note: "サイトの運営方針、収集元の一次情報源、よくある質問。" },
          ]}
        />
      </div>

      <CategoryArticles category={guide.category} />
    </>
  );
}
