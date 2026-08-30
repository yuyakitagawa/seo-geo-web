import type { Metadata } from "next";
import Link from "next/link";
import { FigureBars, FigureDoDont, FigureGauge, FigurePipeline } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { CaseList, LessonShell } from "@/components/lesson";
import { getCases } from "@/lib/cases";
import { requireLesson, lessonPath } from "@/lib/curriculum";
import { SITE_URL } from "@/lib/site";

const lesson = requireLesson("technical");

const REF = {
  robots: { href: "https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ja", label: "robots.txt の書き方、設定と送信" },
  noindex: { href: "https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja", label: "noindex でコンテンツをインデックスから除外する" },
  canonical: { href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja", label: "重複した URL を統合する" },
  sitemaps: { href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja", label: "サイトマップの作成と送信" },
  structuredData: { href: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ja", label: "構造化データの仕組みについて" },
  gallery: { href: "https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=ja", label: "構造化データ マークアップの一覧" },
  vitals: { href: "https://web.dev/articles/vitals#core-web-vitals", label: "web.dev「Web Vitals」" },
  lcp: { href: "https://web.dev/articles/optimize-lcp", label: "web.dev「Optimize LCP」" },
  inp: { href: "https://web.dev/articles/optimize-inp", label: "web.dev「Optimize INP」" },
  cls: { href: "https://web.dev/articles/optimize-cls", label: "web.dev「Optimize CLS」" },
  business: { href: "https://web.dev/case-studies/vitals-business-impact", label: "web.dev「The business impact of Core Web Vitals」" },
} as const;

export const metadata: Metadata = {
  title: lesson.metaTitle,
  description: lesson.description,
  alternates: { canonical: lessonPath(lesson.slug) },
  openGraph: {
    type: "article",
    title: lesson.metaTitle,
    description: lesson.description,
    url: `${SITE_URL}${lessonPath(lesson.slug)}`,
    publishedTime: lesson.published,
    modifiedTime: lesson.updated,
  },
};

const TOC = [
  { id: "control", label: "クロールとインデックスの制御" },
  { id: "duplicate", label: "重複と正規URLの整理" },
  { id: "structured", label: "構造化データの選び方" },
  { id: "vitals", label: "Core Web Vitalsの直し方" },
  { id: "cases", label: "実例：この作業で何が動いたか" },
];

export default function Lesson04() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="control"
        title="クロールとインデックスの制御"
        lead={
          <>
            robots.txtは「クロールしてよいか」を、noindexは「インデックスに登録してよいか」を制御します。
            この2つは目的が違い、混同すると意図と逆の結果になります。とくに、検索結果に出したくないページに
            robots.txtのDisallowを使うのは誤りです。Googleは、ブロックされたページでも他ページからリンクされていれば
            URLがインデックスに登録される場合があると説明しています。
            <GuideRef {...REF.robots} />
          </>
        }
      >
        <GuideTable
          head={["やりたいこと", "使う仕組み", "書く場所", "間違えると"]}
          rows={[
            [
              "検索結果に出したくない",
              "noindex",
              "ページの <meta name=\"robots\" content=\"noindex\"> または X-Robots-Tag ヘッダー",
              "Disallowで代用すると、URLだけ検索結果に残ることがある",
            ],
            [
              "クロール自体させたくない（管理画面・検索結果ページなど）",
              "robots.txt の Disallow",
              "サイト直下の /robots.txt",
              "noindexで代用すると、無駄なクロールが発生し続ける",
            ],
            [
              "クロールもインデックスもさせたくない",
              "まず noindex を付け、登録が消えてから Disallow",
              "両方",
              "同時指定すると、取得できないためnoindexが読まれない",
            ],
            [
              "リンクを評価の対象にしたくない",
              "rel=\"nofollow\" / rel=\"sponsored\" / rel=\"ugc\"",
              "該当の a タグ",
              "広告リンクを無指定で置くと、リンクスパムとみなされる可能性がある",
            ],
          ]}
          caption={
            <>
              noindexはクローラーがページを取得できて初めて読み取られます。この前提はGoogleの公式ドキュメントに明記されています。
              <GuideRef {...REF.noindex} />
            </>
          }
        />
        <p>
          robots.txtを変更したら、Search Consoleのrobots.txtレポートで<strong>Googleが実際に読んだ内容</strong>を確認します。
          CDNやサーバーの設定によっては、ブラウザで見えている内容とクローラーが取得する内容が違うことがあります。
        </p>
      </GuideSection>

      <GuideSection
        id="duplicate"
        title="重複と正規URLの整理"
        lead="同じ内容が複数のURLで見える状態は、評価が分散するだけでなく、どのURLを検索結果に出すかの判断をGoogleに委ねることになります。canonical・301リダイレクト・サイトマップの3つで、代表URLを1本に決めます。"
      >
        <FigurePipeline
          title="重複URLを1本化する判断"
          stages={[
            { label: "旧URLを残す必要がない", desc: "301リダイレクトで新URLへ恒久的に転送する。旧URLは検索結果から消える。", fail: "リダイレクトを張らずに削除すると404が残り、流入が消える。" },
            { label: "両方のURLにアクセスさせたい", desc: "canonicalで代表URLを指定する。両方生きたまま、評価は代表URLに寄せられる。", fail: "canonicalを付けないと、Googleがどちらかを勝手に選ぶ。" },
            { label: "パラメータ違いが大量にある", desc: "canonicalでパラメータ無しのURLを代表にする。サイトマップにも代表URLだけを載せる。", fail: "全パターンがインデックス対象になり、クロールが分散する。" },
          ]}
          caption={
            <>
              canonicalはあくまで「ヒント」であり、Googleが別のURLを正規と判断することがあります。実際にどれが選ばれたかはURL検査で確認します。
              <GuideRef {...REF.canonical} />
            </>
          }
        />
        <p>
          サイトマップには、<strong>代表URLだけ</strong>を載せます。canonicalで除外したURLをサイトマップに残すと、
          サイトマップとcanonicalが矛盾したシグナルを出すことになります。サイトマップの更新日（lastmod）も、
          全ページ同じ日付にすると更新のシグナルとして機能しません。
          <GuideRef {...REF.sitemaps} />
        </p>
      </GuideSection>

      <GuideSection
        id="structured"
        title="構造化データの選び方"
        lead={
          <>
            構造化データは、ページの内容を機械が読める形で併記するマークアップです。順位を上げる設定ではなく、
            検索結果での表示のされ方（リッチリザルト）を変えるためのものです。
            <GuideRef {...REF.structuredData} />
            守るべき条件は1つで、<strong>マークアップの内容がページに表示されているテキストと一致していること</strong>です。
          </>
        }
      >
        <GuideTable
          head={["ページの種類", "使う型", "何が変わるか"]}
          rows={[
            ["記事・ニュース", "Article / NewsArticle", "見出し・公開日・著者が正しく解釈される"],
            ["よくある質問", "FAQPage", "質問と回答が構造として伝わる（表示は保証されない）"],
            ["手順の解説", "HowTo", "手順の並びが構造として伝わる"],
            ["レシピ", "Recipe", "調理時間・材料・評価が検索結果に表示されうる"],
            ["イベント", "Event", "日時・場所・チケット情報が検索結果に表示されうる"],
            ["求人", "JobPosting", "求人の検索結果に掲載されうる"],
            ["動画", "VideoObject", "動画タブ・Discoverなどの動画向け面に載る条件を満たす"],
            ["パンくず", "BreadcrumbList", "検索結果のURL表示が階層表示になる"],
            ["用語の定義", "DefinedTerm", "用語とその定義・別名の関係が伝わる"],
          ]}
          caption={
            <>
              対応している型と要件の一覧は、Googleの検索ギャラリーにあります。リッチリザルトとしての表示は保証されません。
              <GuideRef {...REF.gallery} />
            </>
          }
        />
        <p>
          実装後は、リッチリザルトテストとSearch Consoleの拡張レポートで検証します。
          楽天レシピはCMS側で対応して2週間で全ページに反映し、構造化データテストツールで検証したうえで、
          検索エンジンからの流入が2.7倍になったと報告しています。Eventbriteは基本テンプレートを1つ作り、
          以降は微調整だけで運用しています。<strong>1ページずつ手で書くのではなく、テンプレートで一括して出す</strong>のが実装の要点です。
        </p>
        <p>
          なお、生成AI向けの特別な構造化データは存在しません。Googleは、AI機能に表示されるために
          特別なschema.orgの構造化データを追加する必要はないと明記しています。詳しくは
          <Link href={lessonPath("geo-implementation")}>レッスン07</Link>で扱います。
        </p>
      </GuideSection>

      <GuideSection
        id="vitals"
        title="Core Web Vitalsの直し方"
        lead={
          <>
            Core Web Vitalsは、LCP（読み込み）・INP（応答性）・CLS（視覚的な安定性）の3指標です。
            良好とされる目安はLCPが2.5秒以内、INPが200ミリ秒以下、CLSが0.1以下で、判定はモバイルとPCを分けたうえで
            全体の75パーセンタイルの値で見ます。
            <GuideRef {...REF.vitals} />
          </>
        }
      >
        <FigureGauge
          title="Core Web Vitalsの3段階（良好／改善が必要／不良）"
          items={[
            { label: "LCP", sub: "主要なコンテンツが表示されるまでの時間", good: "2.5秒", poor: "4.0秒" },
            { label: "INP", sub: "操作してから画面が反応するまでの時間", good: "200ms", poor: "500ms" },
            { label: "CLS", sub: "読み込み中にレイアウトがずれる量", good: "0.1", poor: "0.25" },
          ]}
          caption={
            <>
              帯の下の数値は「良好」と「改善が必要」の境界、および「不良」の始まりです。
              <GuideRef {...REF.vitals} />
            </>
          }
        />
        <p>
          3指標を同時に追わないでください。PageSpeed Insightsのフィールドデータを開き、
          <strong>最も悪い1指標に絞る</strong>ほうが進みます。実際、redBusはINPだけに絞って改善し、売上が7%増えたと報告しています。
        </p>
        <GuideTable
          head={["指標", "よくある原因", "最初に試す対処"]}
          rows={[
            [
              "LCP（読み込み）",
              "ファーストビューの画像に loading=\"lazy\" が付いている／LCP要素の読み込み優先度が低い／サーバーの応答が遅い",
              "ファーストビューの画像から loading=\"lazy\" を外し、fetchpriority=\"high\" を付ける。先頭要素のCSSトランジションを外す",
            ],
            [
              "INP（応答性）",
              "1回の操作で重い処理が走る／1リクエストで大量のデータを取得している／状態更新の範囲が広すぎる",
              "1回あたりの取得件数を減らす。入力中の状態はコンポーネント内で持ち、確定時だけ全体に反映する",
            ],
            [
              "CLS（安定性）",
              "画像や広告枠の寸法が指定されていない／後から差し込まれる要素がある／Webフォントの差し替えで文字が動く",
              "画像・iframe・広告枠に width と height を指定する。差し込み領域の高さをあらかじめ確保する",
            ],
          ]}
          caption={
            <>
              対処の詳細はweb.devの各ガイドにあります。
              <GuideRef {...REF.lcp} />
              <GuideRef {...REF.inp} />
              <GuideRef {...REF.cls} />
            </>
          }
        />
        <FigureDoDont
          title="Core Web Vitalsの進め方"
          dos={[
            "PageSpeed Insightsの「実際のユーザーの環境で評価する」（フィールドデータ）を基準にする",
            "最も悪い1指標を決め、それだけを直す",
            "直す前の数値を記録し、28日後に同じ画面で比較する",
            "テンプレート単位で直す（1ページ直しても全体の75パーセンタイルは動かない）",
          ]}
          donts={[
            "ラボデータ（シミュレーション）のスコア100を目標にする",
            "3指標を同時に改善しようとして、どれも中途半端に終わる",
            "AMPやPWAの導入を、表示速度改善の代わりにする",
            "改善直後に数値が変わらないことを理由に、やり直す（フィールドデータは28日間の集計）",
          ]}
        />
      </GuideSection>

      <GuideSection
        id="cases"
        title="実例：この作業で何が動いたか"
        lead="このレッスンで扱った作業について、施策と結果の数値が同じ文書で公開されている事例です。数値は各社の環境での結果であり、同じ結果を保証するものではありませんが、どの作業がどの指標に効いた例があるかの対応関係は読み取れます。"
      >
        <CaseList cases={getCases("nuvemshop", "redbus", "yahoo-japan-news", "rakuten-recipe", "eventbrite")} />
        <FigureBars
          title="Core Web Vitalsの改善で報告された事業指標の変化"
          unit="%"
          bars={[
            { label: "Rakuten 24: 訪問者あたり収益", value: 53.37, note: "CLSを92.72%改善するなどCore Web Vitalsに投資（A/Bテスト）" },
            { label: "Nykaa: tier2・3都市からの自然検索流入", value: 28, note: "LCPを40%改善" },
            { label: "Yahoo! JAPANニュース: セッションあたりPV", value: 15.1, note: "CLSを約0.2から0へ" },
            { label: "Nuvemshop: モバイル自然検索のCVR", value: 8.9, note: "ファーストビュー画像の優先度を修正" },
            { label: "Vodafone（イタリア）: 売上", value: 8, note: "LCPを31%改善" },
            { label: "redBus: 売上", value: 7, note: "INPを870〜900msから350〜370msへ" },
          ]}
          caption={
            <>
              各社が公開している数値です。実施時期・サイト規模・同時に行った他の施策を含んだ結果であり、同じ施策で同じ結果が出ることを示すものではありません。
              <GuideRef {...REF.business} />
            </>
          }
        />
        <p>
          全11件の実例は<Link href={lessonPath("case-studies")}>レッスン09</Link>にまとめています。
          次のレッスンでは、技術的に読める状態になったページに、引用される本文を書いていきます。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
