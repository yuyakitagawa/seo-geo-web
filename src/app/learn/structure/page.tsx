import type { Metadata } from "next";
import Link from "next/link";
import { FigureCompare, FigureDoDont, FigureStack } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { CaseList, LessonShell } from "@/components/lesson";
import { getCases } from "@/lib/cases";
import { requireLesson, lessonPath } from "@/lib/curriculum";
import { SITE_URL } from "@/lib/site";

const lesson = requireLesson("structure");

const REF = {
  starter: { href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=ja", label: "SEO スターター ガイド" },
  canonical: { href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja", label: "重複した URL を統合する" },
  noindex: { href: "https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja", label: "noindex でコンテンツをインデックスから除外する" },
  sitemaps: { href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja", label: "サイトマップの作成と送信" },
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
  { id: "cluster", label: "トピッククラスタ：ハブとスポーク" },
  { id: "url", label: "URL設計とパンくず" },
  { id: "links", label: "内部リンクの張り方" },
  { id: "thin", label: "薄いページをどう扱うか" },
  { id: "example", label: "実例：このサイトの構造" },
];

export default function Lesson06() {
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
                "例: 「SEO対策とは」「GEOとは」「この教科書の目次」",
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
          このレッスンでも、canonicalの話が出たところで<Link href={lessonPath("technical")}>レッスン04</Link>へリンクしています。
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
            ["ハブ（GEO）", "/geo", "「GEOとは」の定義ページ。同カテゴリの記事一覧を兼ねる"],
            ["ハブ（教科書）", "/learn", "10レッスンの目次。各レッスンの到達目標つきで並べる"],
            ["スポーク", "/learn/<レッスン>", "各レッスン。前後リンクとハブへの導線を固定で置く"],
            ["スポーク", "/articles/<id>", "個別のニュース記事。カテゴリのハブへ戻る導線を持つ"],
            ["薄いページの制御", "/tag/<タグ>", "記事が一定本数未満のタグはnoindex。サイトマップからも除外"],
          ]}
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
