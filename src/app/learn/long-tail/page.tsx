import type { Metadata } from "next";
import Link from "next/link";
import { FigureCompare, FigureDoDont, FigureFlow, FigureStack } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { LessonShell } from "@/components/lesson";
import { requireLesson, lessonMetadata, lessonNo, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("long-tail");

const REF = {
  helpful: { href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja", label: "ユーザー第一のコンテンツの作成" },
  spam: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja", label: "スパムに関するポリシー" },
  aiContent: { href: "https://developers.google.com/search/blog/2023/02/google-search-and-ai-content?hl=ja", label: "AI 生成コンテンツに対する方針" },
  aiFeatures: { href: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja", label: "AI 機能とウェブサイト" },
  perf: { href: "https://support.google.com/webmasters/answer/7576553?hl=ja", label: "検索パフォーマンス レポート" },
  canonical: { href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja", label: "重複した URL を統合する" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "shape", label: "検索需要のかたち" },
  { id: "axis", label: "掛け合わせの軸で面を作る" },
  { id: "fanout", label: "AI検索で細かいページが効く理由" },
  { id: "line", label: "量産の一線" },
  { id: "steps", label: "尾を拾う手順" },
];

export default function Lesson04() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="shape"
        title="検索需要のかたち"
        lead="検索されている語は、検索数の多い少数のクエリと、1件あたりは小さい膨大な数のクエリに分かれます。前者を狙うのが一般的なSEOのイメージですが、評価が積み上がっていないサイトが最初に取れるのは後者です。ここでは後者を「細かいクエリ」と呼び、それを1本ずつではなく面で押さえる設計を扱います。"
      >
        <GuideTable
          head={["", "太いクエリ", "細かいクエリ"]}
          rows={[
            ["例", "「SEOとは」「GEO 対策」", "「robots.txt GPTBot 許可 書き方」"],
            ["1本あたりの検索数", "多い", "少ない（数件〜数十件のこともある）"],
            ["検索している人の状況", "幅がある。何を求めているか読み切れない", "具体的。何に困っているかがクエリに書いてある"],
            ["競合", "十分な答えを持つ強いサイトが並んでいる", "そもそも誰も答えていないものが残っている"],
            ["必要なサイト評価", "高い。後発が同じ答えを出しても選ばれにくい", "低い。答えの中身で決まりやすい"],
            ["書ける内容", "総論。差がつきにくい", "自分の検証・実測・判断を書ける"],
          ]}
          caption="この2分類は当サイトの整理です。Googleのドキュメントに「ロングテール」という区分はありません。判断の根拠にできるのは、検索する人の役に立つかどうかという基準のほうです。"
        />
        <p>
          後発のサイトが太いクエリで伸びない理由は、順位の仕組みが不利だからではありません。
          <strong>すでに十分な答えが並んでいる場所に、同じ答えを後から置いているから</strong>です。
          Googleは、ユーザーの役に立つ独自の情報を持つコンテンツを評価すると説明しています。
          細かいクエリには、その「独自の情報」を書ける余地がまだ残っています。
          <GuideRef {...REF.helpful} />
        </p>
        <FigureCompare
          title="同じ労力を、どちらに割り当てるか"
          cols={[
            {
              label: "太いクエリに10本",
              tone: "news",
              sub: "総論を厚くする",
              points: [
                "1本ごとに強い競合と正面から当たる",
                "書ける内容が他サイトと似る",
                "評価が積み上がるまで反応が出ない",
                "外れたときに何が悪かったか分からない",
              ],
            },
            {
              label: "細かいクエリに10本",
              tone: "accent",
              sub: "面を作る",
              points: [
                "答えていないクエリを取りに行ける",
                "1本ごとに固有の情報を書ける",
                "数週間で表示回数の変化が出る",
                "当たった軸が分かり、次の10本を選べる",
              ],
            },
          ]}
          caption="細かいクエリは1本あたりの流入が小さいため、群として合計で見ます。単発で成否を判断しないのが前提です。"
        />
      </GuideSection>

      <GuideSection
        id="axis"
        title="掛け合わせの軸で面を作る"
        lead={
          <>
            <Link href={lessonPath("search-intent")}>レッスン{lessonNo("search-intent")}</Link>では、作るページを1本ずつ決めました。
            細かいクエリはページ数が増えるため、1本ずつ思いつくやり方では続きません。軸を決めて掛け合わせ、
            そのうえで<strong>答えを持っていないマスを消す</strong>という順番で決めます。
          </>
        }
      >
        <GuideTable
          head={["軸", "問い", "このサイトでの例"]}
          rows={[
            ["対象", "誰の、何についての話か", "WordPress / Next.js / Shopify、記事ページ / 一覧ページ"],
            ["条件", "その人が置かれている状況・制約は何か", "インデックスされない / 順位が落ちた / AIに引用されない"],
            ["目的", "何を達成したいのか", "原因を切り分けたい / 設定を書き換えたい / 効果を確認したい"],
          ]}
          caption="3つの軸は当サイトの整理です。掛け合わせると「対象 × 条件 × 目的」のマスができ、1マスが1つの質問文に対応します。"
        />
        <FigureFlow
          title="軸を決めてページを確定するまで"
          steps={[
            { label: "固有の答えを出せる領域を1つ書く", desc: "自分が実際に手を動かした範囲。ここが広すぎると、以降のマスがすべて他サイトの引き写しになる。" },
            { label: "その領域で読者が置かれている状況を並べる", desc: "これが「条件」の軸。問い合わせ・Search Consoleのクエリ・自分がつまずいた箇所から拾う。" },
            { label: "状況ごとに達成したいことを並べる", desc: "これが「目的」の軸。同じ状況でも、原因を知りたいのか、直したいのかで必要なページは別になる。" },
            { label: "掛け合わせて一覧にする", desc: "この時点ではマスが多すぎて構わない。ここまでは機械的な作業。" },
            { label: "「他のページには書けない情報」が1つも書けないマスを消す", desc: "この工程が設計の本体。書けない理由が「まだ調べていないだけ」なら残し、「調べても他と同じ」なら消す。" },
            { label: "残ったマスを、1マス1ページとして着手順に並べる", desc: "答えを持っている順に着手する。網羅を目的にして順番を決めない。" },
          ]}
        />
        <p>
          軸を掛け合わせると、必ず「同じ答えになる2つのマス」が出てきます。これは分けずに1ページへまとめます。
          すでに別々のURLで公開してしまっている場合は、残すURLへ301リダイレクトするか、canonicalで代表URLを指定します。
          <GuideRef {...REF.canonical} />
        </p>
      </GuideSection>

      <GuideSection
        id="fanout"
        title="AI検索で細かいページが効く理由"
        lead="細かい粒度でページを作ることは、SEOの都合だけの話ではありません。生成AIの検索は、1つの質問をそのまま検索するのではなく、複数の小さな検索に分解してから回答を組み立てます。分解された後の単位と、ページの粒度が一致しているかどうかが効いてきます。"
      >
        <p>
          Googleは、AIによる概要とAIモードが「クエリ ファンアウト」と呼ぶ手法を使う場合があると説明しています。
          これは、ユーザーの1つの質問を関連する複数のサブトピックに分解して検索を実行し、その結果をもとに回答を作る手法です。
          つまり、<strong>利用者が入力した質問そのものに一致するページだけでなく、分解された個々のサブトピックに答えているページも参照元の候補になります</strong>。
          <GuideRef {...REF.aiFeatures} />
        </p>
        <FigureStack
          title="1つの質問が分解され、別々のページに当たる"
          layers={[
            { label: "利用者の質問", desc: "「Next.jsのサイトがAI検索に出ないのはなぜ？」", tone: "accent" },
            { label: "分解されたサブトピック", desc: "AIクローラーの許可 / サーバーが返すHTMLに本文があるか / 見出しと直答の書き方 / 確認する方法", tone: "geo" },
            { label: "各サブトピックに答えているページ", desc: "1マス1ページで作ってあれば、それぞれが別々に候補になる", tone: "seo" },
          ]}
          baseNote="4つのサブトピックを1本の総論ページにまとめていると、どのサブトピックに対しても該当箇所が弱くなる"
          caption="分解のされ方は質問ごとに変わります。狙って一致させられるものではなく、粒度をそろえておくことで当たる確率を上げる、という性質のものです。"
        />
        <p>
          ここで注意が必要なのは、<strong>ファンアウトを狙って質問文だけを並べたページを作っても意味がない</strong>ことです。
          Googleは、AIによる概要やAIモードに表示されるための追加要件はなく、別途特別な最適化を行う必要もないと明記しています。
          効くのは粒度をそろえることであって、AI向けの特別な書式ではありません。抜き出されやすい本文の書き方は
          <Link href={lessonPath("writing")}>レッスン{lessonNo("writing")}</Link>で扱います。
          <GuideRef {...REF.aiFeatures} />
        </p>
      </GuideSection>

      <GuideSection
        id="line"
        title="量産の一線"
        lead="面で埋める設計は、一歩間違えると「薄いページの量産」になります。ここはGoogleが明文でポリシーを持っている領域なので、線引きを先に確認しておきます。"
      >
        <p>
          Googleはスパムに関するポリシーで「スケーリングされたコンテンツの不正使用」を挙げ、
          <strong>検索結果のランキング操作を主な目的として多数のページを生成する行為</strong>を対象としています。
          対象になるかどうかは生成方法では決まりません。人が書いたか、自動化したか、その組み合わせかは問われず、
          目的と中身で判断されます。
          <GuideRef {...REF.spam} />
        </p>
        <p>
          AIで書くこと自体も違反ではありません。Googleは、コンテンツの制作方法ではなく品質で評価すると説明しています。
          分かれ目は、そのページに一次情報・実際の検証・固有の判断が入っているかどうかで、
          これは人が書いてもAIが書いても同じ基準です。
          <GuideRef {...REF.aiContent} />
        </p>
        <FigureDoDont
          title="面で埋めるときの線引き"
          dos={[
            "1マスにつき、自分だけが書ける情報を1つ以上入れる",
            "答えを持っていないマスは、埋めずに空けておく",
            "同じ答えになるマスは1ページに統合する",
            "作ったページ群を束ねる一覧ページを用意する",
            "公開後にクエリを見て、当たった軸を次の10本に反映する",
          ]}
          donts={[
            "語を入れ替えただけのページを機械的に作る",
            "検索需要があるという理由だけでページを増やす",
            "網羅の見た目をそろえるために内容の薄いページで穴を埋める",
            "1クエリ1ページを徹底して、同じ答えのページを分割する",
            "ページ数そのものを進捗の指標にする",
          ]}
          caption="「やらないこと」はいずれも、ページ数を増やす一方で1ページあたりの固有の情報を減らす操作です。"
        />
      </GuideSection>

      <GuideSection
        id="steps"
        title="尾を拾う手順"
        lead="軸を頭の中で作るより、すでにGoogleが自分のサイトに割り当てているクエリから拾うほうが早く当たります。表示回数の多い順ではなく、少ない側を見るのがこのレッスンの手順です。"
      >
        <FigureFlow
          title="Search Consoleから細かいクエリを拾う"
          steps={[
            { label: "検索パフォーマンスを開き、期間を直近6か月にする", desc: "細かいクエリは母数が小さいため、3か月では判断できないことが多い。" },
            { label: "クエリタブを表示回数の少ない側から見る", desc: "表示回数が1〜10のクエリは、Googleが自分のサイトを関連ありと判断しつつ、答えが弱いと見ている箇所。" },
            { label: "50件ほど書き出し、対象・条件・目的の3軸に分類する", desc: "分類したときに集まる場所が、自分のサイトが実際に評価されている領域。" },
            { label: "既存ページで答えられるものは、そのページに節を足す", desc: "新規に作るより速い。見出しを追加し、その質問に短く直答する段落を置く。" },
            { label: "既存ページでは答えられないものだけ、新規に作る", desc: "ここで初めてページが増える。増やす前に、既存ページで拾い切ったかを必ず確認する。" },
            { label: "4週間後に同じクエリの表示回数とクリック数を見る", desc: "個別ページではなく、その軸に属するページ群の合計で見る。" },
          ]}
          caption={
            <>
              検索パフォーマンスの各指標の定義はSearch Consoleヘルプにあります。
              <GuideRef {...REF.perf} />
            </>
          }
        />
        <p>
          データがまだ無いサイトでは、この手順は使えません。その場合は前半の「掛け合わせの軸」で10マス作り、
          公開してデータが出てからこの手順に切り替えます。
        </p>
        <p>
          最後に、<strong>面で作ったページは、束ねないと群になりません</strong>。
          個別ページが単発で並んでいるだけでは、テーマとしての評価が積み上がらず、読者も次のページに移動できません。
          一覧ページ（ハブ）を置き、そこから各ページへ、各ページから一覧へ戻す内部リンクを張るところまでが必要です。
          その設計は<Link href={lessonPath("structure")}>レッスン{lessonNo("structure")}</Link>で扱います。
          効果の確認は<Link href={lessonPath("measurement")}>レッスン{lessonNo("measurement")}</Link>です。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
