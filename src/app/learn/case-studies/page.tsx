import type { Metadata } from "next";
import Link from "next/link";
import { FigureDoDont, FigureStack, FigureStats } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { CaseList, LessonShell } from "@/components/lesson";
import { CASES, casesByArea } from "@/lib/cases";
import { requireLesson, lessonPath } from "@/lib/curriculum";
import { SITE_URL } from "@/lib/site";

const lesson = requireLesson("case-studies");

const REF = {
  business: { href: "https://web.dev/case-studies/vitals-business-impact", label: "web.dev「The business impact of Core Web Vitals」" },
  geoPaper: { href: "https://arxiv.org/abs/2311.09735", label: "GEO: Generative Engine Optimization" },
  essentials: { href: "https://developers.google.com/search/docs/essentials?hl=ja", label: "Google 検索の基本事項" },
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
  { id: "rule", label: "この一覧に載せる条件" },
  { id: "technical", label: "テクニカルの基礎を直した例" },
  { id: "structured", label: "構造化データを入れた例" },
  { id: "cwv", label: "Core Web Vitalsを改善した例" },
  { id: "geo", label: "生成AIでの引用を測った例" },
  { id: "patterns", label: "11件に共通する3つのパターン" },
  { id: "caution", label: "自社に当てはめるときの注意" },
];

export default function Lesson09() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="rule"
        title="この一覧に載せる条件"
        lead="ここに載せているのは、実施した施策と結果の数値が同じ一次情報の中で公開されている事例だけです。施策と数値が別々の情報源にある、数値の出どころが不明、運営者本人の発表ではない、といった事例は、因果関係を確認できないため除いています。"
      >
        <FigureStats
          title="この一覧の内訳"
          stats={[
            { value: `${CASES.length}件`, label: "収録している事例", note: "施策と数値が同じ文書で公開されているもの" },
            { value: "3件", label: "日本のサイト", note: "楽天レシピ・Yahoo! JAPANニュース・Rakuten 24" },
            { value: "4領域", label: "テクニカル / 構造化データ / Core Web Vitals / 生成AI", note: "レッスン04・07で扱った作業に対応" },
          ]}
        />
        <GuideTable
          head={["条件", "内容"]}
          rows={[
            ["出典が一次情報である", "サイト運営者本人の発表か、Google（検索セントラルの成功事例・web.devのケーススタディ）、または査読を経た論文"],
            ["施策と数値が同じ文書にある", "「何をしたか」と「どうなったか」が同じページに書かれている"],
            ["数値を言い換えない", "出典の表現をそのまま使い、丸めたり単位を変換したりしない"],
          ]}
        />
        <p>
          件数は多くありません。確認できることを優先した結果です。SNSやブログで見かける「〇倍になった」という話の多くは、
          この3条件のどれかを満たしていません。
        </p>
      </GuideSection>

      <GuideSection
        id="technical"
        title="テクニカルの基礎を直した例"
        lead="クロールエラーの解消、重複URLの統合、不要なmetaタグの削除といった基礎的な作業です。地味ですが、公開されている事例では、この段階で流入が動いています。"
      >
        <CaseList cases={casesByArea("technical")} />
        <p>
          Saraminで注目すべきなのは順番です。2015年にクロールエラーを解消した段階で流入が15%増え、
          そのうえでmetaタグの整理・canonicalによる重複統合・構造化データの追加が続き、2019年の102%増につながっています。
          構造化データから始めていたら、この結果にはなっていません。作業の順序は
          <Link href={lessonPath("technical")}>レッスン04</Link>で扱ったとおりです。
        </p>
      </GuideSection>

      <GuideSection
        id="structured"
        title="構造化データを入れた例"
        lead="ページの内容を機械可読な形で併記する作業です。順位を直接上げる設定ではありませんが、検索結果での表示のされ方が変わることで、クリックと流入が動いた例が複数公開されています。"
      >
        <CaseList cases={casesByArea("structured")} />
        <p>
          3件に共通しているのは、<strong>テンプレートで一括して出している</strong>点です。
          楽天レシピはCMS側で対応して2週間で全ページに反映し、Eventbriteは基本テンプレートを1つ作って以降は微調整だけ、
          MX Playerは動画サイトマップの送信とセットで運用しています。1ページずつ手で書く運用では、この規模になりません。
        </p>
      </GuideSection>

      <GuideSection
        id="cwv"
        title="Core Web Vitalsを改善した例"
        lead="LCP・INP・CLSの改善が事業指標にどう表れたかの事例です。web.devがまとめている一覧には他にも多数掲載されており、ここではそのうち施策の内容まで公開されているものを中心に挙げています。"
      >
        <CaseList cases={casesByArea("cwv")} />
        <p>
          この領域で共通しているのは、<strong>1つの指標に絞っている</strong>ことです。redBusはINPだけ、
          Nykaaは LCPだけ、Yahoo! JAPANニュースはCLSだけを扱っています。3指標を同時に追った事例は見当たりません。
          <GuideRef {...REF.business} />
        </p>
      </GuideSection>

      <GuideSection
        id="geo"
        title="生成AIでの引用を測った例"
        lead="生成AIの回答内での可視性については、企業の事例よりも、測定方法が公開されている研究のほうが参考になります。GEOという用語の初出であるarXiv論文（KDD 2024採録）が、9通りの書き換えを比較しています。"
      >
        <CaseList cases={casesByArea("geo")} note="研究環境での測定値です。生成AI各社のモデルは継続的に更新されるため、現時点の挙動が同じである保証はありません。" />
        <p>
          読み取れるのは、上位が<strong>引用・統計・出典</strong>という情報の裏付けに関わる要素で、
          最下位が<strong>キーワードの詰め込み</strong>という従来型のテクニックだという点です。
          生成AI向けの作業は、記述テクニックではなく内容の裏付けを増やす作業に寄っています。
          <GuideRef {...REF.geoPaper} />
          具体的な書き方は<Link href={lessonPath("writing")}>レッスン05</Link>にまとめています。
        </p>
      </GuideSection>

      <GuideSection
        id="patterns"
        title="11件に共通する3つのパターン"
        lead="個別の数値ではなく、11件に共通している進め方を取り出すと、次の3つになります。自分のサイトで欠けているものがあれば、そこが次に手を付ける場所です。"
      >
        <FigureStack
          title="公開されている事例に共通する進め方"
          layers={[
            {
              label: "③ 1つの指標に絞る",
              tone: "geo",
              note: "測って畳む",
              desc: "redBusはINPだけ、NykaaはLCPだけ。複数を同時に追った事例は無い。効果の判定が可能な単位に切る。",
            },
            {
              label: "② テンプレート単位で直す",
              tone: "seo",
              note: "一括で反映",
              desc: "楽天レシピはCMSで2週間、Eventbriteは基本テンプレート1つ、Nuvemshopは18万店舗へ一括展開。1ページずつ直す運用にはしていない。",
            },
            {
              label: "① 土台から順に積む",
              tone: "accent",
              note: "順番を守る",
              desc: "Saraminはクロールエラーの解消が先で、構造化データは後。技術的に読める状態を作ってから、表示のされ方に手を入れている。",
            },
          ]}
          baseNote="この3点は当サイトが11件から取り出した整理です。各社が「この3原則で進めた」と述べているわけではありません。"
        />
        <GuideTable
          head={["パターン", "自分のサイトで確認すること", "欠けている場合に読むレッスン"]}
          rows={[
            [
              "① 土台から順に積む",
              "インデックス登録・robots.txt・canonicalの確認が済んでいるか",
              <Link key="l2" href={lessonPath("first-week")}>レッスン02</Link>,
            ],
            [
              "② テンプレート単位で直す",
              "構造化データやメタ情報が、テンプレートから一括で出力されているか",
              <Link key="l4" href={lessonPath("technical")}>レッスン04</Link>,
            ],
            [
              "③ 1つの指標に絞る",
              "いま追いかけている指標が1つに決まっているか",
              <Link key="l8" href={lessonPath("measurement")}>レッスン08</Link>,
            ],
          ]}
        />
      </GuideSection>

      <GuideSection
        id="caution"
        title="自社に当てはめるときの注意"
        lead="事例から取り出すべきなのは倍率ではなく、「どの種類の作業が、どの指標に効いた例があるか」という対応関係です。数値をそのまま自社の目標にすると、ほぼ確実に外れます。"
      >
        <FigureDoDont
          title="事例の使い方"
          dos={[
            "自分のサイトに近い業種・規模の事例を選び、施策の内容を読む",
            "その事例が「何を最初にやったか」を見る（順番が最も再現性が高い）",
            "自社の目標値は、自社の現状値を基準に設定する",
            "出典に直接あたり、前提条件（実施時期・対象範囲）を確認する",
          ]}
          donts={[
            "他社の倍率をそのまま自社の目標にする",
            "同時に実施された他の施策を無視して、1つの施策の効果だと考える",
            "業種も規模も違う事例の数値を根拠に、施策の優先順位を決める",
            "出典を確認せず、まとめ記事に書かれた数値だけを引用する",
          ]}
        />
        <p>
          各事例の数値は、その企業のサイト規模・業種・実施時期・同時に行った他の施策を含んだ結果です。
          また、Googleは要件とベストプラクティスを満たしていてもクロール・インデックス登録・掲載を保証しないと
          明記しており、効果が出るまでの期間も示していません。
          <GuideRef {...REF.essentials} />
        </p>
        <p>
          最後のレッスンでは、順位や流入が落ちたときに何をするかを扱います。
          伸ばす作業と同じくらい、落ちたときの手順を決めておくことが運用では効きます。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
