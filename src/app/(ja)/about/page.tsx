import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageDates from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import { ABOUT_FAQ, ABOUT_FEEDS, aboutFacts } from "@/lib/about";
import { faqPageJsonLd } from "@/lib/faq";
import { HAS_CONTACT_PAGE } from "@/lib/contact-notify";
import { SITE_NAME, SITE_URL, X_HANDLE, X_PROFILE_URL } from "@/lib/site";
import { cx, PROSE, TABLE } from "@/lib/ui";

const facts = aboutFacts();

export const metadata: Metadata = {
  title: "運営者情報",
  // 「運営方針」だけの一般的な説明文にしない。このページにしか無い中身（巡回している媒体の数、
  // 記事の作り方、公開している本数）をそのまま書く。
  description: `${SITE_NAME}の運営者・記事の作り方・訂正の方針と、毎日巡回している一次情報源${facts.feeds}媒体の一覧。記事${facts.articles}本の内訳とよくある質問も掲載。`,
  alternates: { canonical: "/about" },
};

const jp = (d: string) => d.replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, "$1年$2月$3日");

// E-E-A-T（経験・専門性・権威性・信頼性）のシグナルとして、収集元の一次情報源とFAQを明記する。
// 運営者は匿名。実名・所属・具体的な社名に繋がる経歴は書かないが、職種・運営動機・自作ツール・Xまでは書く。
// 業務委託・相談窓口の導線は意図的に置いていない（PVが十分に伸びた段階で検討する方針）。相談を受け付ける旨もサイトには書かない。
//
// 用語の定義（GEO・AIO・LLMO・SEO）はここで説明せず /geo /seo /glossary に送る。
// 同じ問いに二重に答えると、専用ページの劣化コピーになる。理由は src/lib/about.ts の冒頭に書いた。
export default function AboutPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(`${SITE_URL}/about`, ABOUT_FAQ)} />
      <PageHeader
        eyebrow="About"
        title="運営者情報"
        lead={`${SITE_NAME}は、検索とAI検索の最新アップデートを個人で毎日追って記事にしているメディアです。誰が、どの情報源から、どんな手順で記事を作り、誤りをどう直すかを公開しています。`}
        crumbs={[{ name: "運営者情報" }]}
      />
      <div className={PROSE.page}>
      <PageDates
        path="/about"
        name="運営者情報"
        type="AboutPage"
        mainEntityId={`${SITE_URL}/#organization`}
        updated={facts.updated}
      />

      <h2>このサイトについて</h2>
      <p>
        {SITE_NAME}は、Google検索とAI検索（ChatGPT Search・Perplexity・Gemini・Google AI Overview/AI Mode）の
        最新アップデートを追い、SEOとGEOの実務ノウハウとして解説するメディアです。運営者が検索とAI検索の変化を
        自分で追い続けるために、勉強を兼ねて個人で運営しています。
      </p>
      <p>
        用語の説明はこのページでは繰り返しません。GEO（AIO・LLMOを含む）の定義とSEOとの違いは
        <a href="/geo">GEO対策とは</a>、検索エンジン側の話は<a href="/seo">SEO対策とは</a>、
        個別の用語は<a href="/glossary">用語集</a>にまとめています。
      </p>

      <h2>公開している内容</h2>
      <p>
        {/* 過去の話題を遡って記事化した分があるので「最初の記事を公開した日」とは書かない（記事の日付＝話題の日付）。 */}
        {facts.since ? `扱っている話題は${jp(facts.since)}以降の分です（公開前の話題を遡って記事にしたものを含みます）。` : ""}
        現在の内訳は次のとおりです（{jp(facts.updated)}時点。数値はサイトのデータから自動で算出しています）。
      </p>
      {/* 2列の対応表。見出し行は無く各行が項目名なので GuideTable（見出し行＋横スクロール）は使わず、
          同じ TABLE トークンで組む。列を固定幅にしないので狭い画面では折り返す。 */}
      <div className={cx("not-prose my-8", TABLE.frame)}>
        <table className={TABLE.table}>
          <tbody>
            {[
              ["公開記事数", `${facts.articles}本（ニュース${facts.news}本 / 解説${facts.howto}本）`],
              ["うち独自記事", `${facts.original}本（運営者が自分で取ったログ・計測値・検証が中心の記事）`],
              ["巡回している情報源", `${facts.feeds}媒体（うち検索・AI各社の公式は${facts.official}媒体）`],
              ["公開している自作ツール", `${facts.tools}種類（ページ診断・プロンプト適合度。無料・登録不要）`],
              [
                "更新の頻度",
                `毎朝7時（日本時間）に自動生成。${facts.latest ? `直近の公開は${jp(facts.latest)}` : "基準を満たす話題が無い日は公開なし"}`,
              ],
            ].map(([label, value], i) => (
              // 先頭行は枠線と二重になるので区切り線を出さない
              <tr key={label} className={i === 0 ? "align-top" : TABLE.row}>
                <th scope="row" className={cx(TABLE.cell, "whitespace-nowrap text-left font-semibold")}>{label}</th>
                <td className={cx(TABLE.cell, "leading-relaxed text-mute")}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>収集元にしている情報源</h2>
      <p>次の{facts.feeds}媒体を毎日巡回しています。記事の一次情報として優先するのは公式発表です。</p>
      <ul>
        {ABOUT_FEEDS.map((s) => (
          <li key={s.name}>
            <a href={s.home} target="_blank" rel="noopener">{s.name}</a>
            {s.kind === "official" ? "（公式）" : "（業界メディア）"}
          </li>
        ))}
      </ul>

      <h2>記事の作り方と編集方針</h2>
      <p>
        当サイトは、次の手順で毎日の記事を作っています。読んだ方が内容をどこまで信頼してよいか判断できるよう、
        手順をすべて公開します。
      </p>
      <ol>
        <li>上記の情報源を毎朝巡回し、SEO・GEOの実務に影響する話題を候補として集めます。</li>
        <li>候補のうち、公式発表または複数の媒体が扱った話題だけを記事化の対象にします。</li>
        <li>一次情報の本文をAIに読ませて下書きを作ります。一次情報に書かれていない数値・固有名詞は書きません。</li>
        <li>
          公開前に自動検査を通します。出典URLの記載、見出し構成、実務上の打ち手が書かれているかを確認し、
          基準を満たさない原稿は公開せず破棄します。
        </li>
        <li>公開後に誤りや古くなった記述が見つかった場合は、本文を訂正して更新日を表示するか、記事を取り下げます。</li>
      </ol>
      <p>
        自分で試した結果を書く独自記事（一覧で「独自」と表示している{facts.original}本）は、これとは別の基準で書いています。
        取得したログや計測値には、期間・対象・除外したものといった取得条件を必ず添えます。
        観測した事実と運営者の解釈は段落を分け、観測から言えない一般化はしません。
        アクセス数のような実数は公開せず、率と傾向だけを載せます。
      </p>
      <p>
        記事はすべて出典を明記しています。他社の記事や公式ドキュメントの文章をそのまま転載することはせず、
        要点を当サイトの言葉で整理したうえで、一次情報へのリンクを記事末尾に置いています。
        当サイトの運営者は検索エンジンやAI検索サービスの関係者ではなく、記事の内容について各社から
        対価を受け取っていません。
      </p>

      <h2>運営者と連絡先</h2>
      <p>
        ネット企業でプロダクトマネージャーとしてサービスの運営に関わってきました。毎朝一次情報を巡回して記事にするほか、
        自分が使いたかった診断ツール（<a href="/tools/page-audit">ページ診断</a>・
        <a href="/tools/prompt-fit">プロンプト適合度</a>）を作って公開しています。
        自分で試して分かったことは独自記事として書いています。
        {X_PROFILE_URL ? (
          <>
            記事の公開と補足は、公式アカウントのX（旧Twitter）
            <a href={X_PROFILE_URL} rel="me noopener" target="_blank">{X_HANDLE}</a>
            （{X_PROFILE_URL}）でも発信しています。
          </>
        ) : null}
      </p>
      <p>
        実名は公開していませんが、記事の誤りのご指摘や権利関係のご連絡には問い合わせ窓口で対応します。
      </p>
      {HAS_CONTACT_PAGE ? (
        <p>
          お問い合わせは<a href="/contact">お問い合わせページ</a>に記載の窓口
          {X_PROFILE_URL ? <>、または公式Xアカウント（<a href={X_PROFILE_URL} rel="me noopener" target="_blank">{X_HANDLE}</a>）</> : null}
          からお願いします。
        </p>
      ) : null}

      <h2>広告について</h2>
      <p>
        当サイトの収益源は広告（Google AdSense）だけです。対価を受け取って特定の製品を取り上げる記事広告は
        掲載していません。広告の仕組みと取得される情報については
        <a href="/privacy">プライバシーポリシー</a>と<a href="/disclaimer">免責事項</a>をご覧ください。
      </p>

      <h2>よくある質問</h2>
      {ABOUT_FAQ.map((f) => (
        <div key={f.question}>
          <h3>{f.question}</h3>
          <p>{f.answer}</p>
        </div>
      ))}
      </div>
    </>
  );
}
