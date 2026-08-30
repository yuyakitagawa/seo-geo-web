import type { Metadata } from "next";
import Link from "next/link";
import { FigureBars, FigureCompare, FigurePipeline, FigureQuote } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { LessonShell } from "@/components/lesson";
import { ScreenSerp } from "@/components/screens";
import { requireLesson, lessonPath } from "@/lib/curriculum";
import { SITE_URL } from "@/lib/site";

const lesson = requireLesson("starter-guide");

const REF = {
  essentials: { href: "https://developers.google.com/search/docs/essentials?hl=ja", label: "Google 検索の基本事項" },
  aiFeatures: { href: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja", label: "AI 機能とウェブサイト" },
  crawlers: { href: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers?hl=ja", label: "Google の一般的なクローラー" },
  helpful: { href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja", label: "ユーザー第一のコンテンツの作成" },
  geoPaper: { href: "https://arxiv.org/abs/2311.09735", label: "GEO: Generative Engine Optimization" },
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
  { id: "pipeline", label: "回答に載るまでの5段階" },
  { id: "routes", label: "AIの回答に載る2つの経路" },
  { id: "glossary", label: "用語の地図" },
  { id: "evidence", label: "効果が確認されている施策" },
  { id: "roadmap", label: "この先の学習順序" },
];

export default function Lesson01() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="pipeline"
        title="回答に載るまでの5段階"
        lead="あなたのページが検索結果や生成AIの回答に出るまでには、発見・取得・理解・選択・提示という5つの段階があります。前の段階を通っていないページは、後の段階でいくら工夫しても表示されません。SEOとGEOの作業は、この5段階のどこを詰まらせているかを特定して直す作業です。"
      >
        <FigurePipeline
          title="ページが回答に載るまでの5段階"
          stages={[
            { label: "発見", desc: "内部リンク・サイトマップ・外部からのリンクをたどって、URLの存在が知られる。", fail: "存在を知られず、取得もされない。" },
            { label: "取得", desc: "クローラーがrobots.txtの許可を確認してHTMLを取得する。", fail: "robots.txtで拒否されていると取得されない。" },
            { label: "理解", desc: "本文・見出し・構造化データを解析し、検索用のデータベースに登録する（インデックス）。", fail: "noindexやcanonicalの向き先が原因で登録されない。" },
            { label: "選択", desc: "クエリとの関連性・有用性で順位を決める。生成AIは回答の材料として使うパッセージを選ぶ。", fail: "登録はされるが、上位にも回答にも選ばれない。" },
            { label: "提示", desc: "検索結果のリンクとして、またはAIの回答内の引用・リンクとして表示される。", fail: "表示されず、流入にならない。" },
          ]}
          caption={
            <>
              Googleは、要件とベストプラクティスを満たしていてもクロール・インデックス登録・掲載を保証しないと明記しています。
              <GuideRef {...REF.essentials} />
            </>
          }
        />
        <p>
          このうち<strong>発見・取得・理解</strong>の3段階はテクニカルな設定の問題で、確認すればすぐ分かります。
          <strong>選択・提示</strong>の2段階はコンテンツの問題で、時間がかかります。順位が上がらないと悩んでいるサイトの多くは、
          実際には「理解」で止まっていて、そもそも選択の対象になっていません。どこで止まっているかを先に特定するのが、
          このカリキュラムの<Link href={lessonPath("first-week")}>レッスン02</Link>です。
        </p>
        <ScreenSerp />
      </GuideSection>

      <GuideSection
        id="routes"
        title="AIの回答に載る2つの経路"
        lead={
          <>
            生成AIの回答に自社の情報が載る経路は2つあります。1つはGoogle検索のインデックス経由（AIによる概要・AIモード）、
            もう1つはAI各社が自前で動かしているクローラー経由（ChatGPT・Perplexityなど）です。前者はSEOそのもので、
            後者はrobots.txtでの許可が前提になります。
            <GuideRef {...REF.aiFeatures} />
          </>
        }
      >
        <FigureCompare
          title="AIの回答に載る2つの経路"
          cols={[
            {
              label: "経路A: Google検索のインデックス経由",
              tone: "seo",
              sub: "AIによる概要 / AIモード",
              points: [
                "Googlebotがクロールし、通常の検索インデックスに登録される",
                "AI機能に出るための追加要件は無いとGoogleが明記",
                "つまり、やることはSEOの土台そのもの",
                "成果はSearch Consoleの検索タイプ「ウェブ」に合算される",
              ],
            },
            {
              label: "経路B: AI各社の独自クローラー経由",
              tone: "geo",
              sub: "ChatGPT / Perplexity / Claude など",
              points: [
                "OAI-SearchBot・PerplexityBot・Claude-SearchBotなどが個別に巡回する",
                "robots.txtで拒否していると、その事業者の回答に出ない",
                "検索用と学習用でボット名が分かれている事業者がある",
                "成果はアクセス解析の参照元ドメインで判別する",
              ],
            },
          ]}
          caption={
            <>
              経路Aの追加要件が無いことはGoogleが公式ドキュメントで明記しています。経路Bの各ボットの扱いは
              <Link href={lessonPath("geo-implementation")}>レッスン07</Link>で扱います。
              <GuideRef {...REF.aiFeatures} />
            </>
          }
        />
        <FigureQuote
          text="SEO のベスト プラクティスは、引き続き Google 検索の AI 機能（AI による概要や AI モードなど）でも有効です"
          source={
            <a href={REF.aiFeatures.href} target="_blank" rel="noopener" className="underline decoration-accent decoration-2 underline-offset-4">
              Google 検索セントラル「AI 機能とウェブサイト」
            </a>
          }
        />
        <p>
          ここから分かるのは、<strong>GEOはSEOの置き換えではなく追加である</strong>ということです。
          経路Aは検索インデックスに依存しているため、SEOをやめてGEOだけを行うことはできません。
          GEO固有の作業として残るのは、質問に短く直答する書き方（<Link href={lessonPath("writing")}>レッスン05</Link>）と、
          AI各社のクローラーを止めない設定（<Link href={lessonPath("geo-implementation")}>レッスン07</Link>）の2つです。
        </p>
      </GuideSection>

      <GuideSection
        id="glossary"
        title="用語の地図"
        lead="この分野は同じことを指す言葉が多く、それが学習の障害になっています。まず、覚える必要がある語と、別名にすぎない語を分けておきます。"
      >
        <GuideTable
          head={["用語", "指しているもの", "覚え方"]}
          rows={[
            ["クロール", "クローラーがページのHTMLを取得すること", "取得。ここで止まると何も始まらない"],
            ["インデックス", "取得したページを解析して検索用データベースに登録すること", "登録。登録されて初めて順位の対象になる"],
            ["ランキング", "クエリごとに登録済みページの順序を決めること", "順位。ここだけを「SEO」と誤解されがち"],
            ["SEO", "検索エンジンの検索結果で上位に表示されるよう整えること", "上の3つ全部を対象にする作業の総称"],
            ["GEO", "生成AIが作る回答の中で引用・言及されるよう整えること", "SEOの上に足す作業。置き換えではない"],
            ["AIO / LLMO / AEO", "GEOと同じ領域を指す別の呼び名", "覚え直す必要はない。当サイトはGEOに統一"],
            ["E-E-A-T", "経験・専門性・権威性・信頼という自己点検の観点", "設定項目ではなくチェックリスト"],
            ["Core Web Vitals", "LCP・INP・CLSの3指標で測るページ体験", "速度の話。数値のしきい値が公開されている"],
            ["構造化データ", "ページの内容を機械可読な形で併記するマークアップ", "順位を上げる設定ではなく、内容を正確に伝える手段"],
          ]}
          caption="用語の対応関係は当サイトの整理です。GEO・AIO・LLMO・AEOの関係については「GEOとは」のページで出典つきで扱っています。"
        />
        <p>
          このうち、最初に理解しておく必要があるのは<strong>クロール・インデックス・ランキング</strong>の3語だけです。
          残りは、それぞれのレッスンで必要になったところで出てきます。
        </p>
      </GuideSection>

      <GuideSection
        id="evidence"
        title="効果が確認されている施策"
        lead={
          <>
            この分野には、根拠のはっきりしない施策が大量に流通しています。判断の基準を先に決めておきます。
            採用してよいのは、Googleなどの検索事業者が公式に述べていること、運営者本人が施策と数値をセットで公開している事例、
            そして測定方法が公開されている研究の3つです。
            <GuideRef {...REF.helpful} />
          </>
        }
      >
        <p>
          生成AI側については、GEOという用語の初出であるarXiv論文（KDD 2024採録）が、10,000件のクエリからなる
          ベンチマークで9通りの書き換えを比較しています。この論文が報告している結果は、実務の優先順位を決めるのに使えます。
          <GuideRef {...REF.geoPaper} />
        </p>
        <FigureBars
          title="書き換え方法ごとの可視性の変化（GEO論文の報告値）"
          unit="%"
          bars={[
            { label: "引用の追加（Quotation Addition）", value: 41, note: "専門家や一次情報の発言をそのまま引用として置く" },
            { label: "統計の追加（Statistics Addition）", value: 32, note: "主張の裏に具体的な数値を添える" },
            { label: "読みやすさの改善（Fluency Optimization）", value: 29, note: "文章として自然で読みやすい形に整える" },
            { label: "出典の明示（Cite Sources）", value: 28, note: "根拠となる情報源へのリンクを本文に置く" },
            { label: "権威性の強調（Authoritative）", value: 15, note: "断定的で権威のある書き方に寄せる" },
            { label: "専門用語の追加（Technical Terms）", value: 10, note: "その分野の術語を増やす" },
            { label: "キーワードの詰め込み（Keyword Stuffing）", value: 0, note: "従来型のSEO手法。生成AIの回答ではほとんど効果がない" },
          ]}
          caption={
            <>
              値は論文が報告している可視性の向上率です。研究環境での測定であり、各社のサービスが同じ挙動をすることを保証するものではありません。
              <GuideRef {...REF.geoPaper} />
            </>
          }
        />
        <p>
          注目すべきは、上位を占めているのが<strong>引用・統計・出典</strong>という「情報としての確かさ」に関わる要素で、
          最下位が<strong>キーワードの詰め込み</strong>という従来型のテクニックだという点です。
          生成AIに引用されるための作業は、小手先の記述ではなく、内容の裏付けを増やす作業に寄っています。
          具体的な書き方は<Link href={lessonPath("writing")}>レッスン05</Link>で扱います。
        </p>
        <p>
          検索側については、Googleの成功事例やweb.devのケーススタディに、施策と数値が同じ文書で公開されている事例があります。
          このカリキュラムでは、そうした確認できる事例だけを<Link href={lessonPath("case-studies")}>レッスン09</Link>に集め、
          各実装レッスンからも参照しています。
          <GuideRef {...REF.crawlers} />
        </p>
      </GuideSection>

      <GuideSection
        id="roadmap"
        title="この先の学習順序"
        lead="残り9レッスンは、レベル1（基礎）で自分のサイトの現状を把握し、レベル2（実装）で手を入れ、レベル3（運用）で数値を見ながら回す、という順に並んでいます。"
      >
        <GuideTable
          head={["レベル", "レッスン", "終わったときの状態"]}
          rows={[
            ["Level 1 基礎", "02 初期点検 / 03 検索意図", "自分のサイトが検索とAIに読める状態か分かり、次に作るページが決まっている"],
            ["Level 2 実装", "04 テクニカル / 05 本文 / 06 構造 / 07 GEO", "技術的な土台が整い、引用される形の本文とサイト構造ができ、AIクローラーの扱いを決めている"],
            ["Level 3 運用", "08 計測 / 09 実例 / 10 リスク", "効果を数値で判断でき、実例から次の一手を選べ、順位下落時の手順が決まっている"],
          ]}
        />
        <p>
          次のレッスンでは、実際に自分のサイトを開いて7日間の点検を行います。ここまでの内容を読むだけで終わらせず、
          Search Consoleを開いた状態で進めてください。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
