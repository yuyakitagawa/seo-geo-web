import type { Metadata } from "next";
import Link from "next/link";
import { FigureCompare, FigureDoDont, FigureFlow } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { LessonShell } from "@/components/lesson";
import { ScreenSearchPerformance } from "@/components/screens";
import { requireLesson, lessonMetadata, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("search-intent");

const REF = {
  helpful: { href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja", label: "ユーザー第一のコンテンツの作成" },
  titleLink: { href: "https://developers.google.com/search/docs/appearance/title-link?hl=ja", label: "タイトルリンクを管理する" },
  snippet: { href: "https://developers.google.com/search/docs/appearance/snippet?hl=ja", label: "スニペットを管理する" },
  canonical: { href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja", label: "重複した URL を統合する" },
  perf: { href: "https://support.google.com/webmasters/answer/7576553?hl=ja", label: "検索パフォーマンス レポート" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "intent", label: "検索意図の4分類" },
  { id: "find", label: "作るページをデータから決める" },
  { id: "one", label: "1ページ1意図の原則" },
  { id: "cannibal", label: "同じ意図のページが複数あるとき" },
  { id: "plan", label: "次に作る3本を決める" },
];

export default function Lesson03() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="intent"
        title="検索意図の4分類"
        lead="検索意図とは、そのクエリを入力した人が本当に達成したいことです。同じ「SEO」という語でも、意味を知りたいのか、業者を探しているのか、ツールを使いたいのかで、求められるページの形はまったく違います。作るページの形式は、キーワードではなく意図から決めます。"
      >
        <GuideTable
          head={["意図", "検索している人の状態", "求められるページの形", "クエリの例"]}
          rows={[
            ["知りたい", "言葉の意味や仕組みを理解したい", "定義と要点を先に出す解説ページ", "「GEO対策とは」「Core Web Vitals 意味」"],
            ["やりたい", "手順を知って自分で実行したい", "手順を番号付きで並べた実務ページ", "「robots.txt 書き方」「サイトマップ 送信 方法」"],
            ["選びたい", "複数の選択肢から決めたい", "条件つきの比較表と選び方の基準", "「SEOツール 比較」「AI可視性ツール 料金」"],
            ["たどりつきたい", "特定のサイトやページに行きたい", "そのブランド・サービスの公式ページ", "「Search Console ログイン」「サービス名 料金」"],
          ]}
          caption="4分類は当サイトの整理です。実際の意図は複合することがあり、その場合は上位に表示されているページの形式が現時点の答えになります。"
        />
        <p>
          意図を確認する最も確実な方法は、<strong>実際にそのクエリで検索して、上位のページの形を見ること</strong>です。
          比較表が並んでいれば比較が求められており、手順の記事が並んでいれば手順が求められています。
          Googleが現に上位に出しているものは、そのクエリに対する現時点で最も具体的な答えです。
          <GuideRef {...REF.helpful} />
        </p>
        <FigureCompare
          title="同じテーマでも、意図が違えばページは別になる"
          cols={[
            {
              label: "「知りたい」向け",
              tone: "seo",
              sub: "定義ページ",
              points: [
                "冒頭に定義の1文と要点3つ",
                "用語の対応表と誤解の解消",
                "詳細は個別ページへリンク",
                "更新頻度は低くてよい",
              ],
            },
            {
              label: "「やりたい」向け",
              tone: "geo",
              sub: "手順ページ",
              points: [
                "冒頭に完了条件と所要時間",
                "番号付きの手順と画面の説明",
                "つまずいたときの分岐",
                "仕様変更のたびに更新が必要",
              ],
            },
          ]}
        />
      </GuideSection>

      <GuideSection
        id="find"
        title="作るページをデータから決める"
        lead="次に作るページは、思いつきではなくSearch Consoleの検索パフォーマンスから決めます。すでに表示回数が出ているクエリは、Googleが自分のサイトを「そのクエリに関連あり」と判断している証拠だからです。関連ありと見られているのに答えるページが弱い箇所が、最も早く動きます。"
      >
        <ScreenSearchPerformance />
        <FigureFlow
          title="Search Consoleから次に作るページを決める手順"
          steps={[
            { label: "検索パフォーマンスを開き、期間を直近3か月にする", desc: "データが少ない場合は6か月。クエリタブを表示回数の多い順に並べる。" },
            { label: "表示回数が多く、CTRが低いクエリを抽出する", desc: "表示はされているのにクリックされていない＝答えられていない、または答えが伝わっていないクエリ。" },
            { label: "各クエリに対応するページを確認する", desc: "クエリをクリックして「ページ」タブを見る。対応ページが無い、または意図の違うページが出ているものを印を付ける。" },
            { label: "実際にそのクエリで検索し、上位ページの形式を見る", desc: "定義なのか、手順なのか、比較なのか。求められている形式を確認する。" },
            { label: "既存ページを直すか、新規に作るかを決める", desc: "近い内容のページがあるなら直すほうが早い。まったく無い場合だけ新規に作る。" },
            { label: "そのページが答える質問を1文で書く", desc: "書けない場合は意図が絞れていない。ここで書いた質問文が、後の見出しと冒頭の直答になる。" },
          ]}
          caption={
            <>
              検索パフォーマンスの各指標の定義はSearch Consoleヘルプにあります。
              <GuideRef {...REF.perf} />
            </>
          }
        />
        <p>
          サイトを作ったばかりでデータが無い場合は、この手順は使えません。その場合は、自分の扱うテーマで
          読者が実際に口にする質問を10個書き出し、それぞれに1ページずつ当てるところから始めます。
          データが貯まったら、この手順に切り替えてください。
        </p>
      </GuideSection>

      <GuideSection
        id="one"
        title="1ページ1意図の原則"
        lead="1つのページが答える質問は1つに絞ります。複数の意図を1ページに詰め込むと、どの意図に対しても中途半端な答えになり、結果としてどのクエリでも上位に出ないページになります。"
      >
        <p>
          判断の基準はキーワードの数ではありません。<strong>そのページが答える質問を1文で書けるかどうか</strong>です。
          「GEO対策とは何か、どう実装するか、どのツールを使うか」を1ページに書こうとすると、この1文が書けません。
          その場合は3ページに分け、定義ページから実装ページとツールページへリンクします。
        </p>
        <FigureDoDont
          title="ページを分ける／分けない の判断"
          dos={[
            "答える質問が1文で書けるところまでページを分ける",
            "分けたページ同士を相互にリンクし、どこから入っても迷子にならないようにする",
            "タイトルと見出しを、そのページが答える質問に合わせる",
            "同じ意図の内容が複数ページに散っている場合は1本に統合する",
          ]}
          donts={[
            "検索数の多いキーワードを1ページに詰め込む",
            "意図の違う内容を「網羅性」の名目で1ページにまとめる",
            "同じ内容を、キーワードだけ変えた別ページとして量産する",
            "分けたページ同士を相互リンクせず、孤立させる",
          ]}
        />
        <p>
          タイトルは、そのページが答える質問と一致させます。Googleは検索結果のタイトルリンクを
          ページの内容に応じて書き換えることがあり、書き換えを減らすにはページ内容と一致した簡潔なtitleを付けるのが基本です。
          <GuideRef {...REF.titleLink} />
          説明文（meta description）も同様に、そのページの答えを要約したものにします。
          <GuideRef {...REF.snippet} />
        </p>
      </GuideSection>

      <GuideSection
        id="cannibal"
        title="同じ意図のページが複数あるとき"
        lead="同じ検索意図に対して複数のページがある状態を、キーワードの食い合い（カニバリゼーション）と呼びます。どのページも中途半端な順位で止まる、Googleが出すページが日によって変わる、といった形で現れます。"
      >
        <GuideTable
          head={["見つけ方", "手順", "判断"]}
          rows={[
            [
              "検索パフォーマンスから",
              "1つのクエリを選び「ページ」タブを開く。複数ページが表示回数を分け合っていないか見る",
              "上位1本に集中していれば問題なし。分散していれば候補",
            ],
            [
              "サイト内検索から",
              "検索エンジンで site: 指定＋対象キーワードで検索し、自サイトの何ページが出るか見る",
              "同じ意図のページが3本以上出るなら統合を検討",
            ],
            [
              "URL検査から",
              "対象URLの「Googleが選択した正規URL」を確認する",
              "自分の意図と違うURLが選ばれていれば、canonicalか内容の重複が原因",
            ],
          ]}
        />
        <p>
          統合すると決めたら、残すURLを1つ選び、他のページからは301リダイレクトするか、
          canonicalで残すURLを指定します。内容は捨てずに、残すページに統合します。
          <GuideRef {...REF.canonical} />
          リダイレクトの実装は<Link href={lessonPath("technical")}>レッスン04</Link>、
          統合後のサイト構造の整理は<Link href={lessonPath("structure")}>レッスン06</Link>で扱います。
        </p>
        <p>
          一方で、Googleが意図ごとに別々のページを正しく出し分けられている場合は、無理に統合する必要はありません。
          食い合いは「同じ意図なのに分散している」ことが問題であって、ページ数が多いこと自体は問題ではありません。
        </p>
      </GuideSection>

      <GuideSection
        id="plan"
        title="次に作る3本を決める"
        lead="このレッスンの成果物は、次に作る（または直す）3本のページと、それぞれが答える質問文です。ここが決まっていれば、レベル2の実装レッスンは手を動かすだけになります。"
      >
        <GuideTable
          head={["決めること", "書き方の例"]}
          rows={[
            ["対象のクエリ", "「robots.txt AIクローラー 書き方」（表示回数320・CTR 0.6%）"],
            ["答える質問（1文）", "AI各社のクローラーをrobots.txtで許可・拒否するにはどう書くか"],
            ["意図の分類", "やりたい（手順）"],
            ["ページの形式", "ボット名の一覧表＋そのままコピーできる記述例＋各社の公式説明へのリンク"],
            ["既存か新規か", "既存の解説ページに手順セクションを追加（新規は作らない）"],
          ]}
          caption="3本それぞれについて、この5項目が埋まっていれば準備完了です。"
        />
        <p>
          次のレベル2では、技術的な土台（レッスン04）、本文の書き方（レッスン05）、
          サイト構造（レッスン06）、AIクローラーへの対応（レッスン07）の順に実装していきます。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
