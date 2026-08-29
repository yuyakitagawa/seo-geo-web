import type { Metadata } from "next";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { FigureCompare, FigureDoDont, FigureFlow, FigureQuote } from "@/components/figures";
import { GuideAnswer, GuideCitation, GuideCrossLinks, GuideFaq, GuideSection, GuideSources, GuideTable, GuideToc } from "@/components/guide";
import { getArticlesByCategory } from "@/lib/content";
import { faqPageJsonLd } from "@/lib/faq";
import { GUIDES, guideJsonLd, jpDate } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";

const guide = GUIDES.geo;
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
  { id: "definition", label: "GEOとは（定義）" },
  { id: "names", label: "GEO・AIO・LLMO・AEOの違い" },
  { id: "vs-seo", label: "SEOとGEOの違い" },
  { id: "how", label: "AIの回答に引用されるまでの経路" },
  { id: "crawlers", label: "主要なAIクローラーとrobots.txt" },
  { id: "writing", label: "引用されやすいページの書き方" },
  { id: "measure", label: "GEOの成果の測り方" },
  { id: "myths", label: "よくある誤解" },
  { id: "faq", label: "よくある質問" },
];

export default function GeoGuidePage() {
  const articles = getArticlesByCategory(guide.category).slice(0, 4);

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
          title="GEOとは（定義）"
          lead="GEO（Generative Engine Optimization／生成AI検索最適化）とは、ChatGPT・Gemini・GoogleのAIによる概要／AIモード・Perplexityといった生成AIが組み立てる回答の中で、自社の情報が引用・言及されるようにする取り組みのことです。検索結果の順位を上げる従来のSEOと違い、AIが回答を作るときの参照元として選ばれることを目標にします。"
        >
          <p>
            用語の初出は、2023年11月にarXivで公開された論文「GEO: Generative Engine Optimization」（Aggarwalほか）です。この論文は、
            生成AI（論文の用語では generative engines）が複数の情報源を統合して回答を作る一方で、コンテンツ制作者は自社の情報が
            いつ・どのように表示されるかをほとんど制御できない、という問題を出発点にしています。そのうえで、生成AIの回答内での可視性を
            高めるための枠組みとしてGEOを提案し、評価用のベンチマークGEO-benchを併せて公開しました。
          </p>
          <p>
            実務でGEOと呼ばれているのは、この論文の手法そのものではなく、「AIの回答に引用されるためにサイト側でできること」の総称です。
            中身は、AI各社のクローラーを許可する技術的な作業と、抜き出されやすい形で書くという編集上の作業に分かれます。
          </p>
        </GuideSection>

        <GuideSection
          id="names"
          title="GEO・AIO・LLMO・AEOの違い"
          lead="GEO・AIO・LLMO・AEOは、いずれも生成AIの回答で引用されることを目指す取り組みを指す呼び名で、実務の中身はほぼ同じです。標準化された定義があるわけではないため、社内やクライアントとの会話では、呼び名ではなく何を測るかを先にそろえるのが安全です。"
        >
          <GuideTable
            head={["呼び名", "元の語", "主な使われ方"]}
            rows={[
              ["GEO", "Generative Engine Optimization", "海外の論文・業界メディアで使われる語。当サイトはこれに統一している"],
              ["AIO", "AI Optimization", "主に日本のベンダー・記事で使われる語。AI Overview（AIによる概要）の略として使われることもあり紛らわしい"],
              ["LLMO", "Large Language Model Optimization", "主に日本で使われる語。大規模言語モデル側から見た呼び方"],
              ["AEO", "Answer Engine Optimization", "回答を返す検索（回答エンジン）向けの最適化。強調スニペット時代から使われている語"],
            ]}
          />
        </GuideSection>

        <GuideSection
          id="vs-seo"
          title="SEOとGEOの違い"
          lead="SEOは「検索結果ページで上位に表示されること」を、GEOは「AIが生成する回答の中で引用・言及されること」を目標にします。土台となるクロールとインデックスの要件は共通で、違いが出るのは評価される単位（ページか、本文中のパッセージか）と、対応すべきクローラーの数です。"
        >
          <FigureCompare
            title="SEOとGEOの違い"
            cols={[
              {
                label: "SEO",
                tone: "seo",
                sub: "検索結果で上位に出す",
                points: [
                  "評価される単位はページ",
                  "対象はGoogle・Bingなどの検索エンジン",
                  "指標は表示回数・クリック数・掲載順位",
                  "順位が上がれば流入が増える",
                ],
              },
              {
                label: "GEO",
                tone: "geo",
                sub: "AIの回答に引用される",
                points: [
                  "評価される単位は本文中のパッセージ",
                  "対象はChatGPT・Gemini・Perplexityなど複数のAI",
                  "指標は回答内での言及率・引用リンク・AI経由の流入",
                  "引用されても流入にならないこと（ゼロクリック）がある",
                ],
              },
            ]}
            caption="土台（クロール・インデックス・有用なコンテンツ）は共通。GEOはSEOの置き換えではなく、書き方とクローラー対応の追加分。"
          />
        </GuideSection>

        <GuideSection
          id="how"
          title="AIの回答に引用されるまでの経路"
          lead="AIの回答に自社の情報が載る経路は大きく2つです。1つはGoogle検索のインデックスを経由する経路（AIによる概要・AIモード）、もう1つはAI各社が自前のクローラーで集めた索引を経由する経路（ChatGPTの検索、Perplexityなど）です。前者はSEOそのもの、後者はrobots.txtでの許可が前提になります。"
        >
          <p>
            Googleは、AIによる概要とAIモードが「クエリ ファンアウト」と呼ぶ手法を使う場合があると説明しています。これは、
            ユーザーの1つの質問を関連する複数のサブトピックに分解して検索を実行し、その結果をもとに回答を組み立てる手法です。
            つまり、ユーザーが入力した語そのものだけでなく、その周辺の質問に答えているページも参照元の候補になります。
          </p>
          <FigureFlow
            title="AIの回答に引用されるまでの4段階"
            steps={[
              { label: "クロールを許可する", desc: "robots.txt に加えて、CDNやWAFがAIクローラーを弾いていないかを確認する。ここで止まっていると以降はすべて成立しない。" },
              { label: "索引に登録される", desc: "Googleの場合はインデックス登録され、スニペットが表示される状態であること。ChatGPT・Perplexityの場合は各社のクローラーが取得した索引に入ること。" },
              { label: "質問の候補として取り出される", desc: "質問と、その周辺のサブトピックに答えている本文が候補になる。ページ全体ではなく該当箇所（パッセージ）が単位。" },
              { label: "回答の根拠として引用・リンクされる", desc: "回答文に要約が使われ、参照元としてリンクが添えられる。ここで初めてブランド名やURLがユーザーの目に触れる。" },
            ]}
          />
          <FigureQuote
            text="AI による概要や AI モードにコンテンツが表示されるための追加の要件はなく、別途特別な最適化を行う必要もありません"
            source="Google 検索セントラル「AI 機能とウェブサイト」"
          />
        </GuideSection>

        <GuideSection
          id="crawlers"
          title="主要なAIクローラーとrobots.txt"
          lead="AI各社は、用途ごとに別々のボットを用意しています。検索表示用のボットを拒否すると回答に出なくなり、学習用のボットを拒否してもモデルの学習から外れるだけで検索表示には影響しません。robots.txtで一律にAIを拒否すると、引用されたい経路まで同時に閉じることになります。"
        >
          <GuideTable
            head={["ボット", "事業者", "用途", "robots.txtで拒否すると"]}
            rows={[
              ["Googlebot", "Google", "Google検索のクロール。AIによる概要・AIモードもこのインデックスを使う", "検索にもAI機能にも表示されない"],
              ["Google-Extended", "Google", "Geminiアプリ向けモデルの学習と、Geminiアプリ・Vertex AIでのグラウンディング", "Gemini側での利用から外れる。Google検索の登録・ランキングには影響しない"],
              ["OAI-SearchBot", "OpenAI", "ChatGPTの検索機能に表示するためのクロール", "ChatGPTの検索の回答に表示されない（ナビゲーションリンクとしては出る場合がある）"],
              ["GPTBot", "OpenAI", "基盤モデルの学習に使われる可能性のあるコンテンツの収集", "学習データから除外される。検索表示の可否とは独立"],
              ["ChatGPT-User", "OpenAI", "ユーザーの操作を起点としたページの取得", "ユーザー起点の取得のため、robots.txtのルールが適用されない場合があるとOpenAIは説明している"],
              ["PerplexityBot", "Perplexity", "Perplexityの検索結果にサイトを表示・リンクするためのクロール", "検索結果に表示されにくくなる"],
              ["Perplexity-User", "Perplexity", "ユーザーの質問を起点としたページの取得", "ユーザーの要求による取得のため、通常はrobots.txtのルールに従わないとPerplexityは説明している"],
              ["Claude-SearchBot", "Anthropic", "検索結果の品質向上のためのインデックス", "検索での可視性と正確性が下がる可能性がある"],
              ["Claude-User", "Anthropic", "ユーザーの質問を起点としたページの取得", "ユーザー起点の検索での可視性が下がる可能性がある"],
              ["ClaudeBot", "Anthropic", "生成AIモデルの学習に使われる可能性のあるコンテンツの収集", "将来の学習データから除外される"],
            ]}
            caption="出典: Google 検索セントラル「Google の一般的なクローラー」、OpenAI「Overview of OpenAI Crawlers」、Perplexity「PerplexityBot」、Anthropic ヘルプセンター。ボットの追加・変更は各社の公式ドキュメントで確認してください。"
          />
          <p>
            OpenAIは、robots.txtの変更が検索側の挙動に反映されるまでおよそ24時間かかると説明しています。Perplexityも、設定の反映に最大24時間かかるとしています。
            変更した直後に結果が変わらないことをもって「効果がない」と判断しないでください。
          </p>
        </GuideSection>

        <GuideSection
          id="writing"
          title="引用されやすいページの書き方"
          lead="GEOで書き方として効くのは、生成AIが本文中の短いまとまり（パッセージ）を取り出して回答に使う、という性質への対応です。見出しの直後に質問へ直答する2〜3文を置き、数値や条件は表と箇条書きで構造化し、根拠となる一次情報のURLを本文に添えます。"
        >
          <FigureDoDont
            title="AIに引用されるための書き方"
            dos={[
              "見出しを質問文にし、その直後に直答の1段落を置く",
              "回答が単体で成立するように書く（前の段落を読まないと意味が通らない書き方を避ける）",
              "数値・条件・比較は表や箇条書きにする",
              "根拠になる一次情報のURLを本文と末尾に置く",
              "公開日と更新日を明示する",
              "重要な内容をテキストで書く（画像内の文字は読まれない）",
            ]}
            donts={[
              "AI向けの隠しテキストや、ユーザーに見せない専用ページを作る",
              "llms.txtを置いただけで引用されると考える",
              "AI機能のためだけの特別な構造化データを追加する（Googleは不要と明記）",
              "結論を記事の最後まで引き延ばす構成にする",
              "出典の無い数値を書く（AIの回答経由で誤りが拡散する）",
            ]}
          />
        </GuideSection>

        <GuideSection
          id="measure"
          title="GEOの成果の測り方"
          lead="Googleは、AIによる概要やAIモードに表示されたサイトも、Search Consoleの検索タイプ「ウェブ」のパフォーマンスレポートに含まれると説明しています。AI機能だけを切り出した指標は提供されていないため、まずは全体の表示回数・クリック数の推移で見ます。"
        >
          <GuideTable
            head={["測るもの", "見る場所", "注意点"]}
            rows={[
              ["Google検索・AI機能からの流入", "Search Console（検索タイプ「ウェブ」）", "AIによる概要・AIモード分だけを分離した指標は提供されていない"],
              ["ChatGPT・Perplexityなどからの流入", "アクセス解析の参照元（chatgpt.com、perplexity.ai など）", "AIの回答内で言及されてもクリックされなければ流入には現れない"],
              ["AIの回答での言及率", "AI可視性計測ツール", "測っているのはツールが投げた質問への回答であり、実ユーザーが受け取った回答そのものではない"],
              ["ブランドの認知", "指名検索の表示回数（Search Console）", "AI経由の接触は流入にならないことがあるため、指名検索の変化が間接的な指標になる"],
            ]}
          />
          <p>
            AI可視性計測ツールの一覧と料金は、<a href="/tools">SEO・GEOツール比較</a>のページにまとめています。
          </p>
        </GuideSection>

        <GuideSection id="myths" title="よくある誤解">
          <h3>誤解1: llms.txtを置けばAIに引用される</h3>
          <p>
            llms.txtはコミュニティが提案している任意の仕様で、設置すれば引用されると保証する検索エンジンやAI事業者の公式な説明はありません。
            Googleは、AI機能に表示されるために新しいAIテキストファイルを作る必要はないと明記しています。設置する場合も、
            本文やサイト構造の代わりではなく補助として扱うのが安全です。
          </p>
          <h3>誤解2: GEOはSEOと別の施策である</h3>
          <p>
            AIによる概要・AIモードは、ページがインデックスに登録され、検索でスニペットが表示されることを前提にしています。
            インデックスに載っていないページはAIの参照元にもならないため、GEOはSEOの置き換えではなく、その上に積む作業です。
          </p>
          <h3>誤解3: robots.txtでAIを拒否すればコンテンツを守れる</h3>
          <p>
            自動巡回のクローラーはrobots.txtに従いますが、ユーザーの操作を起点とするフェッチャーは扱いが異なります。
            OpenAIはChatGPT-Userについて、ユーザーが起点であるためrobots.txtのルールが適用されない場合があると説明し、
            Perplexityも Perplexity-User について同様の説明をしています。拒否の設定は「学習に使わせない」「検索に出さない」という
            目的ごとに、対応するボットを指定して行います。
          </p>
        </GuideSection>

        <GuideSection id="faq" title="よくある質問">
          <GuideFaq items={guide.faq} />
        </GuideSection>

        <GuideSources sources={guide.sources} />
        <GuideCitation guide={guide} />
        <GuideCrossLinks
          links={[
            { href: "/seo", label: "SEO対策とは", note: "定義、3つの領域、Googleが公式に示す基準、最初の90日でやること。" },
            { href: "/category/geo", label: "GEOの最新記事", note: "AI検索の仕様変更と引用のされ方を、一次情報付きで毎日更新。" },
            { href: "/tools", label: "SEO・GEOツール比較", note: "AI可視性計測ツールとAI対応診断ツールを国内外で比較。" },
            { href: "/about", label: "運営者情報", note: "記事の作り方、収集元の一次情報源、編集方針。" },
          ]}
        />
      </div>

      {articles.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-5">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">GEOの最新記事</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {articles.map((a, i) => <ArticleCard key={a.slug} article={a} index={i} />)}
          </div>
        </section>
      )}
    </>
  );
}
