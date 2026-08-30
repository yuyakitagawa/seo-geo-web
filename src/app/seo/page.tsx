import type { Metadata } from "next";
import CategoryArticles from "@/components/CategoryArticles";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { FigureDoDont, FigureFlow, FigureQuote } from "@/components/figures";
import { GuideAnswer, GuideCitation, GuideCrossLinks, GuideFaq, GuideSection, GuideSources, GuideTable, GuideToc } from "@/components/guide";
import { faqPageJsonLd } from "@/lib/faq";
import { GUIDES, guideJsonLd, jpDate } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";

const guide = GUIDES.seo;
const url = `${SITE_URL}${guide.path}`;

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
  { id: "areas", label: "SEOの3領域と着手する順番" },
  { id: "google", label: "Googleが公式に示している基準" },
  { id: "steps", label: "最初の90日でやること" },
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

      <div className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 dark:prose-invert prose-headings:scroll-mt-24 sm:py-20">
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
          <GuideTable
            head={["問い", "検索エンジン側の処理", "答えが「いいえ」のときに起きること"]}
            rows={[
              ["ページを見つけられるか", "クロール（robots.txt・内部リンク・サイトマップをたどってページを取得する）", "そもそも取得されず、検索結果に一切出ない"],
              ["内容を理解できるか", "インデックス登録（本文・見出し・構造化データを解析して保存する）", "取得はされるが登録されず、どのクエリでも表示されない"],
              ["ユーザーに選ばれるか", "ランキングと表示（クエリとの関連性・有用性を評価して順位を決める）", "登録はされるが、上位に出ず流入にならない"],
            ]}
            caption="Googleは、要件とベストプラクティスを満たしていてもクロール・インデックス登録・掲載は保証しないと明記しています（出典: Google 検索セントラル「AI 機能とウェブサイト」）。"
          />
          <p>
            なお、SEOで扱う「検索エンジン」はGoogleだけではありません。ただし日本国内の実務では、Yahoo! JAPANの検索結果もGoogleの技術を利用しているため、
            まずGoogleの公開している基準に合わせるのが基本になります。
          </p>
        </GuideSection>

        <GuideSection
          id="areas"
          title="SEOの3領域と着手する順番"
          lead="SEO対策の作業は、テクニカルSEO（読める状態にする）・コンテンツSEO（検索意図に答える）・外部評価（他サイトから参照される）の3領域に分けられます。着手する順番もこの通りで、技術的に読めないサイトで記事を増やしても評価は積み上がりません。"
        >
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
            外部評価は「被リンクを買う」作業ではありません。Googleはスパムに関するポリシーでリンクの売買を明確に禁止しており、
            違反したサイトは順位が下がるか、検索結果から削除されることがあります。
          </p>
        </GuideSection>

        <GuideSection
          id="google"
          title="Googleが公式に示している基準"
          lead="Googleが公開している判断基準は「Google検索の基本事項（Google Search Essentials）」の3本柱、すなわち技術的な要件・スパムに関するポリシー・主要なベストプラクティスです。非公開のチェックリストや裏技は存在せず、SEO対策はこの3つを満たす作業に還元されます。"
        >
          <GuideTable
            head={["3本柱", "内容", "満たさないと"]}
            rows={[
              ["技術的な要件", "Googlebotがページを取得でき、ページが機能し、コンテンツがインデックス可能な形式であること", "インデックスに登録されない"],
              ["スパムに関するポリシー", "自動生成された無価値な大量ページ、リンクの売買、クローキングなどを行わないこと", "順位低下、または検索結果からの削除"],
              ["主要なベストプラクティス", "ユーザー第一の有用なコンテンツ、分かりやすいタイトルと見出し、画像の代替テキスト、リンク構造の整備", "掲載はされても評価が伸びない"],
            ]}
          />
          <h3>E-E-A-T（経験・専門性・権威性・信頼）</h3>
          <p>
            E-E-A-TはExperience・Expertise・Authoritativeness・Trustの頭文字で、Googleが「有用で信頼性の高い、ユーザー第一のコンテンツ」を
            作れているか自己評価するための観点として公開しているものです。E-E-A-Tという単一のスコアが公開されているわけではないため、
            順位を直接操作する設定ではなく、コンテンツを点検するチェックリストとして使います。実務では、誰が書いたのかを明示する、
            一次情報のリンクを添える、更新日を出す、といった形でページに落とします。
          </p>
          <h3>Core Web Vitals（ページの体験）</h3>
          <p>ページの表示体験を測る3指標です。良好とされるしきい値は次の通りで、判定はモバイルとPCを分けたうえで全体の75パーセンタイルの値で見ます。</p>
          <GuideTable
            head={["指標", "測るもの", "良好の目安"]}
            rows={[
              ["LCP（Largest Contentful Paint）", "読み込みの速さ。主要なコンテンツが表示されるまでの時間", "2.5秒以内"],
              ["INP（Interaction to Next Paint）", "応答性。操作してから画面が反応するまでの時間", "200ミリ秒以下"],
              ["CLS（Cumulative Layout Shift）", "視覚的な安定性。読み込み中にレイアウトがずれる量", "0.1以下"],
            ]}
            caption="出典: web.dev「Web Vitals」。しきい値は今後変更される可能性があります。"
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
        </GuideSection>

        <GuideSection
          id="dodont"
          title="やること／やらなくていいこと"
          lead="SEO対策には、費用対効果が明確な作業と、効果が確認されていないか、Googleが不要と明言している作業が混ざっています。次の整理は、Googleの公式ドキュメントに書かれている内容にもとづくものです。"
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
            AI検索の普及で「SEOは終わった」と言われることがありますが、Googleは、AIによる概要やAIモードにページが表示される条件として、
            ページがインデックスに登録され、検索でスニペットが表示され、検索の技術的要件を満たしていることを挙げています。
            AI機能の参照元になる前提がインデックス登録である以上、SEOの土台は前提条件として残ります。
          </p>
          <h3>誤解2: 記事を毎日出せば順位が上がる</h3>
          <p>
            更新頻度そのものが順位を決めるという公式の説明はありません。Googleは、検索順位を上げることを主目的にした自動生成の大量ページを
            スパムに関するポリシーで問題として扱っています。増やすかどうかは、そのページが答えるべき検索クエリがあるかで判断します。
          </p>
          <h3>誤解3: 構造化データを入れると順位が上がる</h3>
          <p>
            構造化データは、ページの内容を検索エンジンが理解し、検索結果でリッチリザルトとして表示するための仕組みです。
            Googleは、AI機能に表示されるために特別なschema.orgの構造化データを追加する必要はないと明記しています。
            構造化データは順位を買う手段ではなく、内容を正しく伝える手段だと考えるのが実務上は正確です。
          </p>
        </GuideSection>

        <GuideSection
          id="geo"
          title="SEO対策とGEOの関係"
          lead="SEO対策の土台は、そのままGEO（生成AI検索最適化）にも効きます。Googleは公式ドキュメントで、AI機能に表示されるための追加要件はなく、特別な最適化も必要ないと説明しています。"
        >
          <FigureQuote
            text="SEO のベスト プラクティスは、引き続き Google 検索の AI 機能（AI による概要や AI モードなど）でも有効です"
            source="Google 検索セントラル「AI 機能とウェブサイト」"
          />
          <p>
            違いが出るのは書き方と、Google以外のAIのクローラーへの対応です。生成AIは、ページ全体ではなく本文中の短いまとまり（パッセージ）を
            引用します。そのため、質問文にそのまま答える段落を見出しの直後に置く、数値や条件を表と箇条書きで構造化する、
            更新日と出典を明示する、といった書き方が追加の作業になります。ChatGPTやPerplexityは自前のクローラーで巡回するため、
            robots.txtでそれらを止めていないかの確認も必要です。詳しくはGEOの解説ページで整理しています。
          </p>
        </GuideSection>

        <GuideSection id="faq" title="よくある質問">
          <GuideFaq items={guide.faq} />
        </GuideSection>

        <GuideSources sources={guide.sources} />
        <GuideCitation guide={guide} />
        <GuideCrossLinks
          links={[
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
