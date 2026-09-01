import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { FigureFlow, FigureStack, FigureTimeline } from "@/components/figures";
import { GuideCrossLinks, GuideTable } from "@/components/guide";
import { CASES } from "@/lib/cases";
import type { LevelKey } from "@/lib/curriculum";
import { COURSE, LESSONS, LEVELS, LEVEL_KEYS, courseArticleJsonLd, courseJsonLd, lessonNo, lessonPath, lessonsByLevel } from "@/lib/curriculum";
import { jpDate } from "@/lib/guides";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { EYEBROW, HEADING, LIFT, PADDING, PROSE, SURFACE, cx } from "@/lib/ui";

const url = `${SITE_URL}${COURSE.path}`;

export const metadata: Metadata = {
  title: COURSE.metaTitle,
  description: COURSE.description,
  alternates: { canonical: COURSE.path },
  openGraph: {
    type: "article",
    siteName: SITE_NAME,
    locale: "ja_JP",
    title: COURSE.metaTitle,
    description: COURSE.description,
    url,
    publishedTime: COURSE.published,
    modifiedTime: COURSE.updated,
  },
};

const TONE_BAR = { accent: "bg-accent", seo: "bg-seo", geo: "bg-geo" } as const;
const TONE_TEXT = { accent: "text-accent", seo: "text-seo", geo: "text-geo" } as const;

const totalMinutes = LESSONS.reduce((n, l) => n + l.minutes, 0);

// 「レッスン01-04」のようなレベル内の範囲。手で書くとレッスンを1本足した時点で嘘になる。
function levelRange(level: LevelKey): string {
  const ls = lessonsByLevel(level);
  return `レッスン${lessonNo(ls[0].slug)}-${lessonNo(ls[ls.length - 1].slug)}`;
}

export default function LearnPage() {
  return (
    <>
      <JsonLd data={courseArticleJsonLd()} />
      <JsonLd data={courseJsonLd()} />
      <PageHeader
        eyebrow={`Curriculum · 更新 ${jpDate(COURSE.updated)}`}
        title={COURSE.h1}
        lead={COURSE.lead}
        crumbs={[{ name: COURSE.h1 }]}
      />

      <div className={cx(PROSE.page, "prose-headings:scroll-mt-24")}>
        <section aria-label="このカリキュラムの概要" className="not-prose -mt-8 mb-14">
          <div className={cx(SURFACE.card, PADDING.roomy, "shadow-panel")}>
            <p className={EYEBROW.mute}>Curriculum · 1行でいうと</p>
            <p className="mt-4 text-lg font-bold leading-relaxed tracking-tight sm:text-2xl">
              SEOとGEO（生成AI検索最適化）を、仕組みの理解 → 実装 → 運用の順に3レベル{LESSONS.length}レッスンで積み上げる教科書です。
            </p>
            <dl className="mt-7 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <div>
                <dt className={EYEBROW.mute}>レッスン数</dt>
                <dd className={cx(HEADING.section, "mt-1")}>{LESSONS.length}本</dd>
              </div>
              <div>
                <dt className={EYEBROW.mute}>通読の目安</dt>
                <dd className={cx(HEADING.section, "mt-1")}>約{totalMinutes}分</dd>
              </div>
              <div>
                <dt className={EYEBROW.mute}>収録した実例</dt>
                <dd className={cx(HEADING.section, "mt-1")}>{CASES.length}件</dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="how" className="scroll-mt-24">
          <h2>この教科書の使い方</h2>
          <p>
            レッスンは1から{LESSONS.length}まで順番に並んでいます。前のレッスンで作った状態を前提に次が進むため、
            飛ばさずに読むのが最短です。各レッスンの末尾には到達チェックリストがあり、自分のサイトで確認できたら次へ進みます。
          </p>
          <p>
            前提として、用語の定義は<Link href="/seo">SEO対策とは</Link>と<Link href="/geo">GEO対策とは</Link>の2ページにまとめています。
            「そもそもSEOとは何か」から確認したい場合は、先にそちらを読んでください。この教科書は、その定義を前提に
            「では実際に何をするか」を順番に並べたものです。
          </p>
          <h3>実例の扱い</h3>
          <p>
            この教科書に載せている実例は、<strong>実施した施策と結果の数値が同じ一次情報の中で公開されているもの</strong>だけです。
            出典は、サイト運営者本人の発表か、Google（検索セントラルの成功事例・web.devのケーススタディ）、
            および査読を経た論文に限っています。数値は各社の環境での結果であり、同じ施策で同じ結果が出ることを示すものではありません。
            すべての実例は<Link href={lessonPath("case-studies")}>レッスン{lessonNo("case-studies")}</Link>にまとめてあります。
          </p>
        </section>

        <section id="levels" className="scroll-mt-24">
          <h2>3つのレベルと積み上げる順番</h2>
          <p>
            レベルは下から積みます。技術的に読めない状態でコンテンツを増やしても評価は積み上がらず、
            計測できない状態で施策を続けても、効いたかどうかが分かりません。
          </p>
          <FigureStack
            title="レベル1から順に積む"
            layers={[
              { label: "Level 3 運用", tone: "geo", note: levelRange(3), desc: "数値で効果を確認し、実例から共通パターンを取り出し、アップデートとペナルティに備える。" },
              { label: "Level 2 実装", tone: "seo", note: levelRange(2), desc: "技術的な土台、本文の書き方、検索結果とAI回答での見え方、サイト構造、ドメインの置き場所、AIクローラーへの対応を順に仕上げる。" },
              { label: "Level 1 基礎", tone: "accent", note: levelRange(1), desc: "検索と生成AIがページを回答に載せる仕組みを理解し、自分のサイトの初期状態を点検する。" },
            ]}
            baseNote="上のレベルから手を付けると、なぜ効いたのか（効かなかったのか）を後から説明できなくなる。"
          />
        </section>

        <section id="lessons" className="scroll-mt-24">
          <h2>カリキュラム（全{LESSONS.length}レッスン）</h2>
          <p>
            各レッスンの見出しの下にある1文が、そのレッスンを終えたときにできるようになることです。
            いまの自分に足りないものから読み始めても構いませんが、その場合も前のレッスンのチェックリストは確認してください。
          </p>

          {LEVEL_KEYS.map((key) => {
            const level = LEVELS[key];
            return (
              <div key={key} className="not-prose mb-12">
                <div className="mb-5 flex items-baseline gap-3">
                  <span className={`inline-block size-2.5 shrink-0 rounded-full ${TONE_BAR[level.tone]}`} />
                  <div>
                    <p className={cx(EYEBROW.mute, TONE_TEXT[level.tone])}>{level.label}</p>
                    <h3 className={cx(HEADING.section, "mt-1")}>{level.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{level.lead}</p>
                  </div>
                </div>
                <ol className="space-y-3">
                  {lessonsByLevel(key).map((l) => (
                    <li key={l.slug}>
                      <Link
                        href={lessonPath(l.slug)}
                        className={cx("group flex gap-5 p-5 sm:p-6", SURFACE.outline, LIFT)}
                      >
                        <span className="mt-0.5 font-mono text-sm font-bold tabular-nums text-mute">{String(l.order).padStart(2, "0")}</span>
                        <span className="min-w-0">
                          <span className="block text-lg font-bold tracking-tight">
                            {l.title} <span className="inline-block transition group-hover:translate-x-1">→</span>
                          </span>
                          <span className="mt-1.5 block text-sm leading-relaxed text-mute">{l.goal}</span>
                          <span className="mt-2 block text-xs text-mute">約{l.minutes}分 · チェック{l.checklist.length}項目</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </section>

        <section id="plan" className="scroll-mt-24">
          <h2>最初の90日でやること</h2>
          <p>
            {LESSONS.length}レッスンを実際のカレンダーに割り当てると、次の順番になります。計測環境の用意 → 技術的な土台の確認 →
            既存ページの改善 → 新規ページの追加、の順です。計測ができていない状態で施策だけ増やすと、
            順位が動いた理由を後から確認できなくなります。
          </p>
          <FigureFlow
            title="SEO対策の着手順（最初の90日）"
            steps={[
              { label: "Search Consoleとアクセス解析を入れる", desc: `所有権を確認し、表示回数・クリック数・平均掲載順位を見られる状態にする。ここが無いと施策の効果を確認できない（レッスン${lessonNo("first-week")}）。` },
              { label: "インデックス状況とrobots.txtを確認する", desc: `重要なページが「登録済み」になっているか、意図せず noindex や Disallow になっていないかを確認する（レッスン${lessonNo("first-week")}・${lessonNo("technical")}）。` },
              { label: "XMLサイトマップとcanonicalを整える", desc: `サイトマップを送信し、同じ内容が複数URLで見える状態（パラメータ違いなど）を canonical で1本化する（レッスン${lessonNo("technical")}）。` },
              { label: "既に表示回数のあるページを直す", desc: `検索クエリに対してタイトル・導入文・見出しが答えているかを見直す。新規作成より先に、既に見られているページを直すほうが早い（レッスン${lessonNo("writing")}）。` },
              { label: "答えの無いクエリに対して新しいページを作る", desc: `Search Consoleで表示回数はあるのに該当ページが無いクエリを探し、その質問に直答するページを追加する（レッスン${lessonNo("search-intent")}・${lessonNo("writing")}）。` },
              { label: "4週間おきに数値で確認する", desc: `順位の体感ではなく、表示回数・クリック数・インデックス数の推移で判断する。改善が無い施策は畳む（レッスン${lessonNo("measurement")}）。` },
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
          <p>
            AI検索（GEO）側の作業は、この90日の外に別枠で足すものではありません。
            <Link href={lessonPath("geo-implementation")}>レッスン{lessonNo("geo-implementation")}</Link>のAIクローラーの確認は、
            2番目のrobots.txtの確認と同じタイミングで済ませられます。
          </p>
        </section>

        <section id="who" className="scroll-mt-24">
          <h2>読む順番の目安</h2>
          <p>
            すでに一部を実施している場合は、次の対応で入口を選んでください。ただし、飛ばしたレッスンの
            チェックリストだけは目を通すことをおすすめします。多くの場合、詰まっている原因は前の段階に残っています。
          </p>
          <GuideTable
            head={["いまの状態", "入口", "理由"]}
            rows={[
              ["サイトを作ったばかり／Search Console未登録", `レッスン${lessonNo("starter-guide")} → ${lessonNo("first-week")}`, "計測できない状態では、以降のどの施策も効果を確認できないため"],
              ["記事はあるが検索結果に出てこない", `レッスン${lessonNo("first-week")} → ${lessonNo("technical")}`, "インデックス登録の前提が満たせていない可能性が高いため"],
              ["インデックスはされるが順位が伸びない", `レッスン${lessonNo("search-intent")} → ${lessonNo("writing")}`, "検索意図と本文の対応が取れていない可能性が高いため"],
              ["書くテーマが尽きた／記事が単発で増えていくだけ", `レッスン${lessonNo("long-tail")}`, "作るページを軸の掛け合わせで決めていないため"],
              ["検索結果に出ているのにクリックされない／AIの回答に引用されない", `レッスン${lessonNo("snippet")}`, "タイトルリンクと説明文が、そのクエリに答えていると読める形になっていないため"],
              ["記事は増えたが評価が積み上がらない", `レッスン${lessonNo("structure")}`, "個別記事が単発で並んでいるだけで、テーマとして束ねられていないため"],
              ["サブドメインを増やすか、リニューアルでURLを変えるか迷っている", `レッスン${lessonNo("domain")}`, "ドメインを分けた分だけ、設定と計測の単位が増えるため"],
              ["SEOは回っているがAI検索に出てこない", `レッスン${lessonNo("geo-implementation")}`, "AI各社のクローラー設定と、抜き出されやすい書き方が別作業のため"],
              ["施策を続けているが効果が判断できない", `レッスン${lessonNo("measurement")}`, "見るべき指標と見る順番が決まっていないため"],
              ["アップデートで流入が落ちた", `レッスン${lessonNo("updates-risk")}`, "原因の切り分け手順を先に決める必要があるため"],
              ["AI検索の回答に自社名が出てこない", `レッスン${lessonNo("brand-entity")}`, "回答に載る候補は、ページを読まれるより前に決まっているため"],
            ]}
          />
        </section>

        <GuideCrossLinks
          links={[
            { href: "/seo", label: "SEO対策とは", note: "用語の定義、3領域、Googleが公式に示している基準。" },
            { href: "/geo", label: "GEO対策とは", note: "生成AI検索最適化の定義、SEOとの違い、AIクローラーの一覧。" },
            { href: lessonPath("starter-guide"), label: `レッスン${lessonNo("starter-guide")}を始める`, note: "検索と生成AIがページを回答に載せるまでの経路から。" },
            { href: "/tools", label: "SEO・GEOツール", note: "ページ診断・AIクローラー確認など、教科書と一緒に使うツール。" },
            { href: "/glossary", label: "SEO・GEO用語集", note: "実務で出てくる用語を1語1文の定義と出典リンクで引ける。" },
          ]}
        />
      </div>
    </>
  );
}
