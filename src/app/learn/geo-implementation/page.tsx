import type { Metadata } from "next";
import Link from "next/link";
import { FigureCompare, FigureDoDont, FigurePipeline } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import RobotsPresets from "@/components/RobotsPresets";
import { LessonShell } from "@/components/lesson";
import { CRAWLERS, PURPOSE, PURPOSE_ORDER } from "@/lib/crawlers";
import { requireLesson, lessonMetadata, lessonNo, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("geo-implementation");

const REF = {
  aiFeatures: { href: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja", label: "AI 機能とウェブサイト" },
  googleCrawlers: { href: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers?hl=ja", label: "Google の一般的なクローラー" },
  openai: { href: "https://platform.openai.com/docs/bots", label: "Overview of OpenAI Crawlers" },
  perplexity: { href: "https://docs.perplexity.ai/guides/bots", label: "PerplexityBot" },
  llmstxt: { href: "https://llmstxt.org/", label: "The /llms.txt file" },
  geoPaper: { href: "https://arxiv.org/abs/2311.09735", label: "GEO: Generative Engine Optimization" },
  genAiReport: { href: "https://support.google.com/webmasters/answer/16984139?hl=ja", label: "生成 AI パフォーマンス レポート（検索）" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "routes", label: "2つの経路と必要な設定" },
  { id: "crawlers", label: "AIクローラーの一覧と役割" },
  { id: "robots", label: "robots.txtでの書き分け" },
  { id: "notneeded", label: "やらなくていいこと" },
  { id: "shape", label: "引用される形に整える" },
];

export default function Lesson09() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="routes"
        title="2つの経路と必要な設定"
        lead={
          <>
            生成AIの回答に載る経路は2つあり、必要な作業が違います。Google検索のインデックス経由（AIによる概要・AIモード）は
            SEOそのもので、追加の設定はありません。AI各社がページを取得する経路には、検索用ボットによる巡回と、
            ユーザーが質問したときに <code>ChatGPT-User</code> などが、その質問に応じてページへアクセス（取得）することがあります。
            検索用ボットはrobots.txtで許可していることが前提になります。
            <GuideRef {...REF.aiFeatures} />
          </>
        }
      >
        <FigurePipeline
          title="経路ごとに、どこで止まるか"
          stages={[
            { label: "経路A: Googleのインデックス", desc: "Googlebotがクロールし、通常の検索インデックスに登録される。AI機能はここを参照する。", fail: "インデックスされていなければ、AIによる概要・AIモードの参照元にならない。" },
            { label: "経路B: AI各社によるページ取得", desc: "OAI-SearchBotなどは個別に巡回し、ChatGPT-Userなどはユーザーの質問に応じてページへアクセス（取得）することがある。どちらも回答の材料になり得る。", fail: "検索用ボットをrobots.txtで拒否すると、その事業者の検索結果に出にくくなる。ユーザー起点のアクセス（取得）はrobots.txtが適用されない場合がある。" },
            { label: "共通: 抜き出せる本文", desc: "見出しの直下に質問へ直答する段落があり、数値や条件が構造化されている。", fail: "取得されても、引用できるまとまりが無ければ回答に使われにくい。" },
          ]}
          caption={
            <>
              経路Aについて、Googleは追加の要件はなく特別な最適化も必要ないと明記しています。
              <GuideRef {...REF.aiFeatures} />
            </>
          }
        />
        <p>
          つまりGEOの実装作業は、<strong>設定（クローラーを止めない）</strong>と<strong>書き方（抜き出せる形にする）</strong>の
          2つに集約されます。書き方は<Link href={lessonPath("writing")}>レッスン{lessonNo("writing")}</Link>で扱ったので、
          このレッスンでは設定を決めます。
        </p>
      </GuideSection>

      <GuideSection
        id="crawlers"
        title="AIクローラーの一覧と役割"
        lead="AI関連のクローラーは、大きく「AI検索の回答に出るためのもの」「モデルの学習に使われるもの」「従来の検索エンジンのもの」に分かれます。同じ事業者でも用途ごとにユーザーエージェント名が分かれていることがあり、そこが書き分けの起点になります。"
      >
        {PURPOSE_ORDER.map((p) => (
          <div key={p}>
            <h3>{PURPOSE[p].label}</h3>
            <p>{PURPOSE[p].lead}</p>
            <GuideTable
              head={["User-agent", "提供元", "何をするか", "拒否すると"]}
              rows={CRAWLERS.filter((c) => c.purpose === p).map((c) => [
                <code key={c.token}>{c.token}</code>,
                c.vendor,
                c.note ? `${c.role}（${c.note}）` : c.role,
                c.ifBlocked,
              ])}
              caption="各行は提供元の公式ドキュメントで確認したものです。ボット名は変わることがあるため、出典のドキュメントで現在の名前を確認してください。"
            />
          </div>
        ))}
        <p>
          注意点が2つあります。1つ目は、<code>ChatGPT-User</code> や <code>Perplexity-User</code> のような
          <strong>ユーザー起点のアクセス</strong>は、ユーザーの質問に応じて対象ページへアクセス（取得）することがあるもので、自動巡回ではありません。
          そのためrobots.txtが適用されない場合があると各社が説明しています。2つ目は、GoogleのGoogle-ExtendedはGeminiアプリの学習・グラウンディング用のトークンで、
          Google検索へのサイトの登録やランキングには影響しないと明記されていることです。
          <GuideRef {...REF.googleCrawlers} />
        </p>
      </GuideSection>

      <GuideSection
        id="robots"
        title="robots.txtでの書き分け"
        lead="AI検索の回答に引用されたいなら、検索用のクローラー（OAI-SearchBot・PerplexityBotなど）は許可します。モデルの学習に使われたくない場合は、学習用のクローラー（GPTBot・Google-Extendedなど）だけを拒否します。GPTBotを拒否してもChatGPTの検索結果からは消えません（そちらはOAI-SearchBotの担当です）。設定の方針は次の3つに分かれ、どれを選ぶかはAI経由の露出をどう扱いたいかで決まります。決めたら、robots.txtに書いてSearch Consoleのrobots.txtレポートで読み取り結果を確認します。"
      >
        <FigureCompare
          title="3つの方針"
          cols={[
            {
              label: "AI検索には出す／学習には使わせない",
              tone: "seo",
              sub: "もっとも選ばれる設定",
              points: [
                "OAI-SearchBot・PerplexityBot・Claude-SearchBotなどは許可",
                "GPTBot・ClaudeBot・Google-Extended・CCBotなどは拒否",
                "回答内での引用は受け入れ、モデル学習からは外れる",
              ],
            },
            {
              label: "すべて許可",
              tone: "geo",
              sub: "露出を最大化する",
              points: [
                "AI検索の引用も、モデル学習も止めない",
                "設定としては最も単純",
                "自社コンテンツが学習に使われることを許容できる場合",
              ],
            },
            {
              label: "AI関連をすべて拒否",
              tone: "news",
              sub: "AI経由の流入は無くなる",
              points: [
                "従来の検索エンジンだけを許可する",
                "ChatGPTやPerplexityの回答に出なくなる",
                "有料コンテンツや会員向け情報を持つ場合の選択肢",
              ],
            },
          ]}
          caption="下に3方針それぞれのrobots.txtのひな形を置いています。"
        />
        <RobotsPresets />
        <p>
          いま自分のサイトがどのボットを止めているかは、
          <Link href="/tools/page-audit">ページ診断</Link>にURLを入れると
          robots.txtを取得してAI検索クローラーの許可状況まで判定します。
        </p>
        <p>
          書き分けができるのは、事業者が用途ごとにボット名を分けている場合だけです。OpenAIの場合、
          検索の回答に出したいなら <code>OAI-SearchBot</code> を許可し、基盤モデルの学習に使われたくないなら
          <code>GPTBot</code> を拒否する、という指定ができます。
          <GuideRef {...REF.openai} />
          Perplexityも <code>PerplexityBot</code> の許可を推奨しています。
          <GuideRef {...REF.perplexity} />
          すべての事業者が分離しているわけではないため、各社の公式ドキュメントで現在のボット名を確認してください。
        </p>
      </GuideSection>

      <GuideSection
        id="notneeded"
        title="やらなくていいこと"
        lead={
          <>
            GEOという言葉のまわりには、効果が確認されていない作業が多く流通しています。Googleは公式ドキュメントで、
            AI機能に表示されるために新たにコンピュータが解読可能なファイルやAIテキストファイルを作る必要はなく、
            特別なschema.orgの構造化データを追加する必要もないと明記しています。
            <GuideRef {...REF.aiFeatures} />
          </>
        }
      >
        <FigureDoDont
          title="GEOで手を動かす場所"
          dos={[
            "robots.txtでAI検索用クローラーを止めていないか確認する",
            "見出しの直下に、質問へ1文で答える段落を置く",
            "数値・条件を表と箇条書きで構造化する",
            "更新日と出典をページ上に表示する",
            "アクセス解析でAI検索からの参照を分けて見る",
          ]}
          donts={[
            "AI機能に出るための特別な構造化データを追加する（Googleが不要と明記）",
            "llms.txtを設置することを、本文やサイト構造の整備の代わりにする",
            "AI向けと称してユーザーに見せない隠しテキストを置く",
            "キーワードを詰め込む（生成AIの回答での可視性にほとんど効果がないと報告されている）",
          ]}
        />
        <GuideTable
          head={["よく聞く施策", "現時点で確認できること", "扱い"]}
          rows={[
            [
              "llms.txt の設置",
              "コミュニティが提案している任意の仕様。設置すれば引用されるという検索・AI事業者の公式な説明は無い",
              "本文やサイト構造の代わりではなく、補助として置くなら可",
            ],
            [
              "AI向けの構造化データ",
              "Googleは、AI機能に表示されるために特別なschema.orgの構造化データは必要ないと明記",
              "不要。構造化データは通常の目的（内容を正確に伝える）で使う",
            ],
            [
              "AI可視性ツールでの計測",
              "ツールが投げた質問への回答を測るもので、実ユーザーが受け取った回答そのものではない",
              `測っているものを理解したうえでなら有用（レッスン${lessonNo("measurement")}）`,
            ],
            [
              "引用・統計・出典を本文に足す",
              "GEO論文が、引用の追加で最大41%、統計で約32%、出典で約28%の可視性向上を報告",
              `優先度が高い。レッスン${lessonNo("writing")}の書き方に含まれる`,
            ],
          ]}
          caption={
            <>
              llms.txtの仕様はコミュニティが公開しているものです。
              <GuideRef {...REF.llmstxt} />
              可視性の数値は研究環境での測定であり、各社のサービスが同じ挙動をすることを保証するものではありません。
              <GuideRef {...REF.geoPaper} />
            </>
          }
        />
      </GuideSection>

      <GuideSection
        id="shape"
        title="引用される形に整える"
        lead={`設定が済んだら、主要ページを引用される形に整えます。作業はレッスン${lessonNo("writing")}の書き方と同じですが、ここでは「AIが読む単位」に注目して点検します。`}
      >
        <GuideTable
          head={["点検する場所", "満たしている状態", "直し方"]}
          rows={[
            ["h2直下の段落", "その見出しの問いに1文で答えている", "見出しを質問形に直し、答えを冒頭に移動する"],
            ["指示語", "「これ」「その」で前を参照していない", "主語を毎回書き、そのセクションだけで意味が通るようにする"],
            ["数値の置き場所", "表か箇条書きになっている", "文章に埋もれている条件を表に出す"],
            ["出典の位置", "その記述の直後にリンクがある", "末尾の一覧に加えて、本文中にもリンクを置く"],
            ["更新日", "ページ上に表示されている", "公開日と更新日を分けて表示する"],
            ["用語の定義", "そのページ内で1度は定義している", "略語の初出で正式名称と定義を書く"],
          ]}
        />
        <p>
          最後に、AI検索での露出を分けて見られるようにしておきます。GoogleのAIによる概要とAIモードでの表示回数は、
          Search Consoleの生成AIパフォーマンスレポートで確認できます。指標は表示回数のみで、クリック数は含まれません。
          元のデータは検索パフォーマンスレポート（検索結果）のウェブ検索タイプに含まれるものです。
          <GuideRef {...REF.genAiReport} />
          ChatGPTやPerplexityからの流入は、アクセス解析の参照元ドメインで判別します。使い方は
          <Link href="/articles/36">Search Consoleの使い方</Link>と
          <Link href={lessonPath("measurement")}>レッスン{lessonNo("measurement")}</Link>で扱います。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
