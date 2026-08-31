import type { Metadata } from "next";
import Link from "next/link";
import { FigureCompare, FigureDoDont, FigureLinkMap, FigureStack } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { CaseList, LessonShell } from "@/components/lesson";
import { getCases } from "@/lib/cases";
import { requireLesson, lessonMetadata, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("structure");

const REF = {
  starter: { href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=ja", label: "SEO スターター ガイド" },
  canonical: { href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja", label: "重複した URL を統合する" },
  noindex: { href: "https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja", label: "noindex でコンテンツをインデックスから除外する" },
  sitemaps: { href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja", label: "サイトマップの作成と送信" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "cluster", label: "トピッククラスタ：ハブとスポーク" },
  { id: "patterns", label: "リンク構造の型：崩れ方と直し方" },
  { id: "url", label: "URL設計とパンくず" },
  { id: "links", label: "内部リンクの張り方" },
  { id: "thin", label: "薄いページをどう扱うか" },
  { id: "example", label: "実例：このサイトの構造" },
];

export default function Lesson07() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="cluster"
        title="トピッククラスタ：ハブとスポーク"
        lead="トピッククラスタとは、1つのテーマについて、全体を扱うハブページと、個別の論点を扱う複数のスポークページを作り、相互にリンクで結ぶ構造のことです。記事を単発で増やしていくのをやめ、テーマ単位で束ねると、そのテーマを扱っているサイトだと理解されやすくなります。"
      >
        <FigureCompare
          title="ハブとスポークの役割"
          cols={[
            {
              label: "ハブ（軸になるページ）",
              tone: "seo",
              sub: "定義・全体像・目次",
              points: [
                "テーマ全体を扱い、そのテーマの定義クエリを受ける",
                "各スポークへのリンクを、内容の説明つきで並べる",
                "更新頻度は低いが、長く生き続ける",
                "例: 「SEO対策とは」「GEO対策とは」「この教科書の目次」",
              ],
            },
            {
              label: "スポーク（個別のページ）",
              tone: "geo",
              sub: "手順・事例・ニュース",
              points: [
                "1つの論点だけを深く扱う",
                "本文中からハブへ戻るリンクを置く",
                "関連するスポーク同士も横につなぐ",
                "例: 各レッスン、個別のニュース記事",
              ],
            },
          ]}
        />
        <p>
          重要なのは<strong>双方向</strong>であることです。ハブからスポークへのリンクだけでは、
          スポークに直接来た読者がテーマ全体にたどり着けません。各スポークの本文中と末尾に、
          ハブへ戻るリンクを必ず置きます。
        </p>
        <FigureStack
          title="サイト構造は3階層に収める"
          layers={[
            { label: "スポーク（個別ページ）", tone: "geo", note: "第3階層", desc: "個別の論点。ハブと、関連する他のスポークへリンクする。" },
            { label: "ハブ（テーマの軸）", tone: "seo", note: "第2階層", desc: "テーマの定義と全体像。配下のスポークを説明つきで並べる。" },
            { label: "トップページ", tone: "accent", note: "第1階層", desc: "サイト全体の入口。各ハブへの導線を明示する。" },
          ]}
          baseNote="トップから3クリック以内で全ページに到達できる状態を目安にする。階層が深くなるほど、クロールも読者も届きにくくなる。"
          caption="階層の目安は当サイトの整理です。Googleが階層数の上限を示しているわけではありません。"
        />
      </GuideSection>

      <GuideSection
        id="patterns"
        title="リンク構造の型：崩れ方と直し方"
        lead="リンク構造とは、どのページからどのページへリンクが張られているか、その全体の形のことです。1ページずつ見れば問題がなくても、全体の形が崩れていると、重要なページに経路が集まりません。よくある崩れ方を3つ、直した形とセットで図にします。"
      >
        <p>
          先に結論を書くと、目指す形は次の3つを満たすものです。
          <strong>①テーマの軸になるハブがあり、どのページもハブから2クリック以内にある</strong>。
          <strong>②ハブとスポークが双方向にリンクしている</strong>。
          <strong>③どのページにも、本文か一覧から最低1本のリンクが入っている</strong>。
          以下の図では、リンクを矢印で描いています。片矢印は一方向、両矢印は双方向のリンクです。
        </p>

        <FigureLinkMap
          title="型1: トップに全部ぶら下げる（フラット型）"
          maps={[
            {
              label: "フラット型：ハブが無い",
              verdict: "bad",
              alt: "トップページから4本の記事へ一方向のリンクが伸びるだけで、記事どうしはつながっていない図",
              nodes: [
                { id: "top", label: "トップ", layer: 0, tone: "accent" },
                { id: "a1", label: "記事A", layer: 1 },
                { id: "a2", label: "記事B", layer: 1 },
                { id: "a3", label: "記事C", layer: 1 },
                { id: "a4", label: "記事D", layer: 1 },
              ],
              edges: [
                { from: "top", to: "a1", tone: "news" },
                { from: "top", to: "a2", tone: "news" },
                { from: "top", to: "a3", tone: "news" },
                { from: "top", to: "a4", tone: "news" },
              ],
              note: "トップだけが全記事を抱え、記事どうしはつながっていない。記事が増えるほどトップの一覧から押し出され、古い記事への経路が消える。テーマのまとまりも読み取れない。",
            },
            {
              label: "ハブ＆スポーク型",
              verdict: "good",
              alt: "トップからSEOハブとGEOハブへ、各ハブと配下の記事が双方向にリンクし、同じハブの記事どうしも横に結ばれている図",
              nodes: [
                { id: "top", label: "トップ", layer: 0, tone: "accent" },
                { id: "hs", label: "SEOハブ", layer: 1, tone: "seo" },
                { id: "hg", label: "GEOハブ", layer: 1, tone: "geo" },
                { id: "a1", label: "記事A", layer: 2, tone: "seo" },
                { id: "a2", label: "記事B", layer: 2, tone: "seo" },
                { id: "a3", label: "記事C", layer: 2, tone: "geo" },
                { id: "a4", label: "記事D", layer: 2, tone: "geo" },
              ],
              edges: [
                { from: "top", to: "hs" },
                { from: "top", to: "hg" },
                { from: "hs", to: "a1", kind: "both", tone: "seo" },
                { from: "hs", to: "a2", kind: "both", tone: "seo" },
                { from: "hg", to: "a3", kind: "both", tone: "geo" },
                { from: "hg", to: "a4", kind: "both", tone: "geo" },
                { from: "a1", to: "a2", kind: "side", tone: "seo" },
                { from: "a3", to: "a4", kind: "side", tone: "geo" },
              ],
              note: "テーマごとにハブを1枚立て、ハブと記事を双方向でつなぐ。同じテーマの記事どうしも横につなぐ。記事が増えても、増えるのはハブの下だけで済む。",
            },
          ]}
        />
        <p>
          フラット型が崩れる理由は、トップページの一覧が有限だからです。記事が増えると古い記事はトップから押し出され、
          リンクが1本も無いページになります。ハブを挟むと、押し出される先がテーマ単位のハブになり、
          そのテーマの記事はハブに残り続けます。
        </p>

        <FigureLinkMap
          title="型2: どこからもリンクされていないページ（孤立ページ）"
          maps={[
            {
              label: "孤立ページがある",
              verdict: "bad",
              alt: "記事一覧から2本の記事にだけリンクがあり、残り2本の記事はどこからもリンクされず破線で示されている図",
              nodes: [
                { id: "top", label: "トップ", layer: 0, tone: "accent" },
                { id: "list", label: "記事一覧", layer: 1 },
                { id: "a1", label: "記事A", layer: 2 },
                { id: "a2", label: "記事B", layer: 2 },
                { id: "a3", label: "記事C", layer: 2, dim: true, sub: "リンク無し" },
                { id: "a4", label: "記事D", layer: 2, dim: true, sub: "リンク無し" },
              ],
              edges: [
                { from: "top", to: "list", tone: "news" },
                { from: "list", to: "a1", tone: "news" },
                { from: "list", to: "a2", tone: "news" },
              ],
              note: "一覧の1ページ目に残っている記事しか、リンクをたどって到達できない状態。サイトマップには載っていても、サイトマップは「こういうURLがある」という一覧で、ページ同士の関係は表さない。",
            },
            {
              label: "全ページに入り口がある",
              verdict: "good",
              alt: "記事一覧と4本の記事すべてが双方向にリンクし、記事どうしも横に結ばれている図",
              nodes: [
                { id: "top", label: "トップ", layer: 0, tone: "accent" },
                { id: "list", label: "ハブ", layer: 1, tone: "seo" },
                { id: "a1", label: "記事A", layer: 2, tone: "seo" },
                { id: "a2", label: "記事B", layer: 2, tone: "seo" },
                { id: "a3", label: "記事C", layer: 2, tone: "seo" },
                { id: "a4", label: "記事D", layer: 2, tone: "seo" },
              ],
              edges: [
                { from: "top", to: "list" },
                { from: "list", to: "a1", kind: "both", tone: "seo" },
                { from: "list", to: "a2", kind: "both", tone: "seo" },
                { from: "list", to: "a3", kind: "both", tone: "seo" },
                { from: "list", to: "a4", kind: "both", tone: "seo" },
                { from: "a2", to: "a3", kind: "side", tone: "seo" },
              ],
              note: "ハブは新着順の一覧と違い、古い記事も説明つきで並べ続ける。さらに本文中の関連リンクで横にもつなぐと、入り口が2本以上になる。",
            },
          ]}
          caption="孤立ページの探し方は、サイトマップのURL一覧と、サイト内リンクのリンク先一覧を突き合わせること。差分がそのまま孤立ページになる。"
        />

        <FigureLinkMap
          title="型3: 奥に埋まっている（クリック深度）"
          maps={[
            {
              label: "ページ送りでしか届かない",
              verdict: "bad",
              alt: "トップから一覧の1ページ目・2ページ目・3ページ目をたどらないと記事に届かない、4クリックの直列構造の図",
              nodes: [
                { id: "top", label: "トップ", layer: 0, tone: "accent" },
                { id: "p1", label: "一覧 1", layer: 1 },
                { id: "p2", label: "一覧 2", layer: 2 },
                { id: "p3", label: "一覧 3", layer: 3 },
                { id: "art", label: "記事", layer: 4, sub: "4クリック" },
              ],
              edges: [
                { from: "top", to: "p1", tone: "news" },
                { from: "p1", to: "p2", tone: "news" },
                { from: "p2", to: "p3", tone: "news" },
                { from: "p3", to: "art", tone: "news" },
              ],
              note: "古い記事ほど奥のページ送りに流れる。中身は同じでも、経路が長いほど読者もクローラーも届きにくくなる。",
            },
            {
              label: "ハブから直接届く",
              verdict: "good",
              alt: "トップからハブへ、ハブから記事へと2クリックで届く3階層の構造の図",
              nodes: [
                { id: "top", label: "トップ", layer: 0, tone: "accent" },
                { id: "hub", label: "ハブ", layer: 1, tone: "seo" },
                { id: "a1", label: "記事A", layer: 2, tone: "seo", sub: "2クリック" },
                { id: "a2", label: "記事B", layer: 2, tone: "seo", sub: "2クリック" },
              ],
              edges: [
                { from: "top", to: "hub" },
                { from: "hub", to: "a1", kind: "both", tone: "seo" },
                { from: "hub", to: "a2", kind: "both", tone: "seo" },
                { from: "a1", to: "a2", kind: "side", tone: "seo" },
              ],
              note: "ページ送りを無くす必要はない。ページ送りとは別に、ハブから直接届く経路を1本用意する。",
            },
          ]}
          caption="クリック数の目安は当サイトの整理です。Googleが階層数やクリック数の上限を示しているわけではありません。"
        />
      </GuideSection>

      <GuideSection
        id="url"
        title="URL設計とパンくず"
        lead="URLは、決めたら変えないことが最も重要です。変更するたびにリダイレクトの管理が増え、対応漏れがそのまま流入の損失になります。設計の段階で、後から変えたくならない形にしておきます。"
      >
        <GuideTable
          head={["決めること", "選択肢", "判断の基準"]}
          rows={[
            [
              "URLに何を使うか",
              "英数字のスラッグ／連番のID／日本語",
              "タイトルを変えてもURLが変わらない形にする。連番IDはタイトル変更に強い",
            ],
            [
              "階層をURLに反映するか",
              "/seo/robots-txt のように反映する／/articles/123 のようにフラットにする",
              "カテゴリが変わる可能性があるなら、URLに含めないほうが安全",
            ],
            [
              "カテゴリページをどこに置くか",
              "/category/seo のような専用パス／/seo のような短いパス",
              "カテゴリの解説とアーカイブを兼ねるなら短いパスにまとめる",
            ],
            [
              "末尾のスラッシュ",
              "あり／なし",
              "どちらでもよいが、どちらかに統一し、もう一方は301で寄せる",
            ],
          ]}
        />
        <p>
          当サイトでは、記事のURLをフロントマターの連番IDにしています（<code>/articles/123</code>）。
          タイトルを変更してもURLが変わらないためです。またカテゴリについては、
          <code>/category/seo</code> のような専用パスを廃止し、解説ページと記事一覧を兼ねる
          <Link href="/seo">/seo</Link>・<Link href="/geo">/geo</Link>・<Link href="/news">/news</Link> に統合しました。
          旧URLからは308リダイレクトで転送しています。
          <GuideRef {...REF.canonical} />
        </p>
        <p>
          パンくずは、可視のUIとBreadcrumbList構造化データを<strong>同じデータから出す</strong>のが実装の要点です。
          表示とマークアップを別々に書くと、片方だけ直る状態が起きます。
          <GuideRef {...REF.starter} />
        </p>
      </GuideSection>

      <GuideSection
        id="links"
        title="内部リンクの張り方"
        lead="内部リンクは、数の多さが目的ではありません。重要なページへの経路が短いことと、リンクの文言がリンク先の内容を表していることの2点が要件です。"
      >
        <FigureDoDont
          title="内部リンクの書き方"
          dos={[
            "アンカーテキストにリンク先の内容を表す語を使う（「robots.txtの書き方」）",
            "本文中の、その話題に触れた位置からリンクする",
            "各ページからハブへ戻る導線を必ず置く",
            "関連ページを、なぜ関連するのかの一言つきで並べる",
          ]}
          donts={[
            "「こちら」「詳しくはこちら」だけのアンカーテキスト",
            "本文と関係のないページへ機械的にリンクを張る",
            "同じページへ1ページ内から何度も繰り返しリンクする",
            "リンク集ページだけを作って、本文中からはリンクしない",
          ]}
        />
        <p>
          リンクを置く位置も効きます。ページ末尾の関連記事一覧よりも、
          <strong>その話題に触れた本文中</strong>からのリンクのほうが、読者にとってもクローラーにとっても文脈が明確です。
          このレッスンでも、canonicalの話が出たところで<Link href={lessonPath("technical")}>レッスン05</Link>へリンクしています。
        </p>
      </GuideSection>

      <GuideSection
        id="thin"
        title="薄いページをどう扱うか"
        lead="タグ一覧、著者別一覧、月別アーカイブなど、中身がリンク数個しかないページは、増えるとクロールの枠を食います。Search Consoleの「クロール済み - インデックス未登録」が増えている場合、まずここを疑います。"
      >
        <GuideTable
          head={["ページの種類", "問題になる状態", "対処"]}
          rows={[
            [
              "タグ一覧",
              "記事が1本しかないタグページが大量にある",
              "一定本数未満のタグはnoindexにし、サイトマップからも外す",
            ],
            [
              "ページネーション",
              "2ページ目以降が中身のほぼ無い一覧になっている",
              "1ページあたりの件数を増やす。canonicalで1ページ目に寄せない（各ページは別の内容）",
            ],
            [
              "パラメータ違いのURL",
              "並び替えや絞り込みのパラメータが全部インデックス対象になっている",
              "canonicalでパラメータ無しのURLを代表にする",
            ],
            [
              "内容の重複するページ",
              "同じ意図のページが複数ある（レッスン03のカニバリゼーション）",
              "1本に統合し、他は301リダイレクトする",
            ],
          ]}
          caption={
            <>
              noindexにしたページはサイトマップからも外します。サイトマップに載せながらnoindexにするのは矛盾したシグナルです。
              <GuideRef {...REF.noindex} />
              <GuideRef {...REF.sitemaps} />
            </>
          }
        />
        <p>
          実装では、<strong>表示側（noindexの判定）と生成側（サイトマップの生成）で同じしきい値を使う</strong>ようにします。
          別々に書くと、片方だけ直った状態が起きて、矛盾に気づきにくくなります。
        </p>
      </GuideSection>

      <GuideSection
        id="example"
        title="実例：このサイトの構造"
        lead="このサイト自身が、ここまでの内容をそのまま実装しています。読者が実際に開いて確認できる例として挙げます。"
      >
        <GuideTable
          head={["役割", "ページ", "何をしているか"]}
          rows={[
            ["ハブ（SEO）", "/seo", "「SEO対策とは」の定義ページ。同カテゴリの記事一覧を兼ねる"],
            ["ハブ（GEO）", "/geo", "「GEO対策とは」の定義ページ。同カテゴリの記事一覧を兼ねる"],
            ["ハブ（教科書）", "/learn", "13レッスンの目次。各レッスンの到達目標つきで並べる"],
            ["スポーク", "/learn/<レッスン>", "各レッスン。前後リンクとハブへの導線を固定で置く"],
            ["スポーク", "/articles/<id>", "個別のニュース記事。カテゴリのハブへ戻る導線を持つ"],
            ["薄いページの制御", "/tag/<タグ>", "記事が一定本数未満のタグはnoindex。サイトマップからも除外"],
          ]}
        />
        <FigureLinkMap
          title="このサイトの実際のリンク構造"
          maps={[
            {
              label: "ハブ4枚 + 双方向リンク",
              verdict: "good",
              alt: "トップから /seo /geo /learn /news の4つのハブへリンクし、各ハブと記事・レッスンが双方向に結ばれ、記事とレッスンも横に結ばれている図",
              nodes: [
                { id: "top", label: "トップ", layer: 0, tone: "accent" },
                { id: "seo", label: "/seo", layer: 1, tone: "seo" },
                { id: "geo", label: "/geo", layer: 1, tone: "geo" },
                { id: "news", label: "/news", layer: 1, tone: "news" },
                { id: "learn", label: "/learn", layer: 1, tone: "accent" },
                { id: "art", label: "記事", layer: 2, sub: "/articles/<id>" },
                { id: "les", label: "レッスン", layer: 2, sub: "/learn/<slug>" },
              ],
              edges: [
                { from: "top", to: "seo", tone: "seo" },
                { from: "top", to: "geo", tone: "geo" },
                { from: "top", to: "news", tone: "news" },
                { from: "top", to: "learn" },
                { from: "seo", to: "art", kind: "both", tone: "seo" },
                { from: "geo", to: "art", kind: "both", tone: "geo" },
                { from: "news", to: "art", kind: "both", tone: "news" },
                { from: "learn", to: "les", kind: "both" },
                { from: "art", to: "les", kind: "side" },
              ],
              note: "記事は所属カテゴリのハブと双方向につながり、関連する記事・レッスンとも横につながる。読者がどのページに直接来ても、そのテーマの全体像に1クリックで戻れる。",
            },
          ]}
          caption="タグ一覧（/tag/<タグ>）は、記事が一定本数未満のものをnoindexにしているため、この図には含めていません。"
        />
        <p>
          カテゴリのリンク先は1つの関数を通して生成しており、リンクを書く場所ごとにURLがばらつかないようにしています。
          URLの変更が必要になったとき、直す場所が1か所で済むためです。
        </p>
        <p>
          外部評価の側では、韓国のSaraminが不要なmetaタグの削除とcanonicalによる重複統合を行ったうえで
          構造化データを追加し、自然検索流入が前年同月比102%増になったと報告しています。
          構造の整理が先、追加のマークアップは後、という順番になっている点が参考になります。
        </p>
        <CaseList cases={getCases("saramin")} />
        <p>
          次のレッスンでは、ここまでで整えたサイトを、生成AIに引用される状態にするための設定を扱います。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
