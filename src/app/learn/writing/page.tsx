import type { Metadata } from "next";
import Link from "next/link";
import { FigureBars, FigureCompare, FigureDoDont, FigureFlow, FigureQuote } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { CaseList, LessonShell } from "@/components/lesson";
import { getCases } from "@/lib/cases";
import { requireLesson, lessonMetadata, lessonPath } from "@/lib/curriculum";
import { LINK } from "@/lib/ui";

const lesson = requireLesson("writing");

const REF = {
  helpful: { href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja", label: "ユーザー第一のコンテンツの作成" },
  aiFeatures: { href: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja", label: "AI 機能とウェブサイト" },
  spamScaled: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja#scaled-content", label: "スパムポリシー（大量生成されたコンテンツの不正使用）" },
  aiContent: { href: "https://developers.google.com/search/blog/2023/02/google-search-and-ai-content?hl=ja", label: "AI 生成コンテンツに対する方針" },
  geoPaper: { href: "https://arxiv.org/abs/2311.09735", label: "GEO: Generative Engine Optimization" },
  snippet: { href: "https://developers.google.com/search/docs/appearance/snippet?hl=ja", label: "スニペットを管理する" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "shape", label: "段落の型：見出し→直答→根拠→詳細" },
  { id: "passage", label: "パッセージとして抜き出される条件" },
  { id: "evidence", label: "引用・統計・出典を入れる" },
  { id: "eeat", label: "E-E-A-Tをページ上の要素に落とす" },
  { id: "ai", label: "AIで書く場合の線引き" },
];

export default function Lesson05() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="shape"
        title="段落の型：見出し→直答→根拠→詳細"
        lead="検索結果でも生成AIの回答でも抜き出されやすい本文は、書き方の型が共通しています。見出しで問いを立て、その直下の1文で答え、次に根拠を置き、最後に詳細と例外を書く。この順番を全セクションで守るのが、このレッスンの中心です。"
      >
        <FigureFlow
          title="1セクションの書き順"
          steps={[
            { label: "見出しを、読者が検索する質問の形にする", desc: "「robots.txtの設定」ではなく「robots.txtでAIクローラーを止めないようにするには」。検索される言葉に寄せる。" },
            { label: "見出しの直下に、答えを1文で置く", desc: "主語と述語がそろい、この1文だけを切り出しても意味が通る形にする。前の段落を読んでいる前提にしない。" },
            { label: "その答えの根拠を書く", desc: "公式ドキュメントの記述、実測値、公開されている事例。出典があるものはリンクを付ける。" },
            { label: "詳細・手順・例外を続ける", desc: "表や箇条書きで構造化する。ここまで読む人は、すでに答えを得ている。" },
          ]}
        />
        <FigureCompare
          title="同じ内容でも、順番で抜き出しやすさが変わる"
          cols={[
            {
              label: "抜き出されにくい書き方",
              tone: "news",
              sub: "背景から始まる",
              points: [
                "「近年、AI検索の普及にともない……」と背景説明から入る",
                "答えが第3段落あたりに埋まっている",
                "「これ」「その」で前の段落を参照している",
                "数値が文章の中に埋もれている",
              ],
            },
            {
              label: "抜き出されやすい書き方",
              tone: "seo",
              sub: "直答から始まる",
              points: [
                "見出しの直後に「〜とは、……のことです」と答えを置く",
                "1文目だけを切り出しても意味が通る",
                "指示語を使わず、主語を毎回書く",
                "数値や条件は表・箇条書きにする",
              ],
            },
          ]}
          caption="この型は、検索結果のスニペットとしても、生成AIが引用するパッセージとしても機能します。"
        />
        <p>
          結論を先に置くと最後まで読まれないのでは、という懸念はよく聞きます。実際は逆です。検索から来た読者は、
          まず自分の質問に答えているかを確認し、答えが見つからなければその場で離脱します。
          答えを先に示したうえで根拠と詳細を続けるほうが、読み進められます。
          <GuideRef {...REF.helpful} />
        </p>
      </GuideSection>

      <GuideSection
        id="passage"
        title="パッセージとして抜き出される条件"
        lead="生成AIはページ全体ではなく、本文中の短いまとまり（パッセージ）を引用します。抜き出される単位で意味が完結しているかが、そのまま引用されやすさになります。目安は、1つの見出しに対して1つの問い、200〜400字で自己完結、です。"
      >
        <GuideTable
          head={["条件", "満たしている状態", "満たしていない状態"]}
          rows={[
            [
              "1見出し1問い",
              "その見出しが答える質問を1文で書ける",
              "1つの見出しの下に、意図の違う話題が3つ入っている",
            ],
            [
              "自己完結",
              "そのセクションだけ読んでも意味が通る",
              "「前述のとおり」「上記の設定を」で前を参照している",
            ],
            [
              "主語の明示",
              "「Googleは〜と説明しています」と主語を毎回書く",
              "「これは推奨されていません」（誰が推奨していないのか不明）",
            ],
            [
              "構造化",
              "条件・数値・手順が表か箇条書きになっている",
              "条件が段落の中に文章として並んでいる",
            ],
            [
              "根拠の位置",
              "その記述の直後に出典リンクがある",
              "出典がページ末尾にまとめてあるだけで、どの記述の根拠か分からない",
            ],
          ]}
        />
        <p>
          このサイト自体も同じ型で書いています。各セクションの見出し直下にある1文が直答で、
          出典リンクは記述の直後に置いています。ページ末尾の出典一覧は補助であって、
          <strong>どの記述がどの文書に由来するかは本文中で示す</strong>という設計です。
        </p>
        <p>
          なお、検索結果のスニペットとして何が表示されるかはGoogleが自動で決めるもので、指定はできません。
          できるのは、抜き出しやすい形に整えることだけです。
          <GuideRef {...REF.snippet} />
        </p>
      </GuideSection>

      <GuideSection
        id="evidence"
        title="引用・統計・出典を入れる"
        lead={
          <>
            生成AIの回答内での可視性については、測定方法が公開されている研究があります。GEOという用語の初出である
            arXiv論文（KDD 2024採録）は、10,000件のクエリからなるベンチマークGEO-benchで9通りの書き換えを比較し、
            引用・統計・出典といった「情報としての確かさ」に関わる要素が上位を占めたと報告しています。
            <GuideRef {...REF.geoPaper} />
          </>
        }
      >
        <FigureBars
          title="書き換え方法ごとの可視性の変化（GEO論文の報告値）"
          unit="%"
          bars={[
            { label: "引用の追加", value: 41, note: "専門家や一次情報の発言を、引用としてそのまま置く" },
            { label: "統計の追加", value: 32, note: "主張の裏に具体的な数値を添える" },
            { label: "読みやすさの改善", value: 29, note: "文章として自然で読みやすい形に整える" },
            { label: "出典の明示", value: 28, note: "根拠となる情報源へのリンクを本文に置く" },
            { label: "権威性の強調", value: 15, note: "断定的で権威のある書き方に寄せる" },
            { label: "キーワードの詰め込み", value: 0, note: "従来型のSEO手法。ほとんど効果がない" },
          ]}
          caption={
            <>
              研究環境での測定値であり、各社のサービスが同じ挙動をすることを保証するものではありません。
              <GuideRef {...REF.geoPaper} />
            </>
          }
        />
        <CaseList cases={getCases("geo-bench")} note="この研究は2023年11月に公開され、KDD 2024に採録されたものです。生成AI各社のモデルは継続的に更新されるため、現時点の挙動が同じである保証はありません。" />
        <p>
          実務に落とすと、次の3点になります。いずれも「新しいマークアップを足す」作業ではなく、
          <strong>本文の中身を増やす作業</strong>です。
        </p>
        <ul>
          <li>公式ドキュメントや当事者の発言は、要約せず引用として置き、出典へリンクする</li>
          <li>主張には具体的な数値を添える。数値が無いなら、その主張は書かない</li>
          <li>出典は記述の直後に置く。ページ末尾の一覧だけでは、どの記述の根拠か伝わらない</li>
        </ul>
        <FigureQuote
          text="SEO のベスト プラクティスは、引き続き Google 検索の AI 機能（AI による概要や AI モードなど）でも有効です"
          source={
            <a href={REF.aiFeatures.href} target="_blank" rel="noopener" className={LINK}>
              Google 検索セントラル「AI 機能とウェブサイト」
            </a>
          }
        />
      </GuideSection>

      <GuideSection
        id="eeat"
        title="E-E-A-Tをページ上の要素に落とす"
        lead="E-E-A-T（経験・専門性・権威性・信頼）は設定項目ではなく、コンテンツを自己点検するための観点です。順位を直接操作するスコアは公開されていないため、実務では「ページ上の何を見れば、その観点を満たしていると分かるか」に翻訳して扱います。"
      >
        <GuideTable
          head={["観点", "問い", "ページ上の要素に落とすと"]}
          rows={[
            ["Experience（経験）", "実際に使った・行った・試した人が書いているか", "実測値、作業手順、画面の記録、失敗した内容"],
            ["Expertise（専門性）", "そのテーマを説明できる知識があるか", "扱う範囲を絞ったサイト構成、著者情報、用語の定義ページ"],
            ["Authoritativeness（権威性）", "そのテーマの情報源として参照されているか", "自分で一次情報を公開する。他サイトからの言及が積み上がる"],
            ["Trust（信頼）", "情報の正確さと運営者の透明性が確認できるか", "出典リンク、更新日、運営者情報、問い合わせ先"],
          ]}
          caption="4観点の説明はGoogleの公開ドキュメントにもとづく当サイトの整理です。E-E-A-Tという単一のスコアは公開されていません。"
        />
        <p>
          このうち、いま手を動かして増やせるのは<strong>経験</strong>と<strong>信頼</strong>です。
          権威性は他サイトからの参照の積み上げなので、直接は操作できません。
          自分で一次情報（自分で測った数値、自分で試した手順）を公開することが、結果として権威性につながる、という順序になります。
          <GuideRef {...REF.helpful} />
        </p>
      </GuideSection>

      <GuideSection
        id="ai"
        title="AIで書く場合の線引き"
        lead={
          <>
            Googleは、コンテンツの制作方法ではなく品質に注目していると説明しており、AIの使用そのものを禁じてはいません。
            <GuideRef {...REF.aiContent} />
            一方でスパムに関するポリシーでは、ユーザーにとっての価値を付加せず、検索順位の操作を主な目的として
            大量にページを生成することを「大量生成されたコンテンツの不正使用」として挙げています。
            <GuideRef {...REF.spamScaled} />
          </>
        }
      >
        <FigureDoDont
          title="AIを使う場合の線引き"
          dos={[
            "一次情報を自分で確認し、そこから外れた記述を消す",
            "数値・固有名詞は出典に書かれているものだけを残す",
            "推論を含む部分は「〜と考えられます」と明示する",
            "公開前に、そのページが答える質問を1文で言えるか確認する",
          ]}
          donts={[
            "確認していない数値や固有名詞をそのまま公開する",
            "既存記事を言い換えただけのページを量産する",
            "同じテンプレートに地域名や商品名だけを差し替えたページを大量生成する",
            "出典を確認せずに「〜と言われています」と書く",
          ]}
        />
        <p>
          判断の分かれ目は、生成に使ったかどうかではなく、そのページが読者の質問に答えているかどうかです。
          このサイトの記事も自動生成の仕組みで作っていますが、数値と固有名詞は出典元の記事にあるものだけを書く、
          という制約を生成の段階で課しています。
        </p>
        <p>
          次のレッスンでは、こうして書いたページを、テーマごとに束ねて評価が積み上がる構造に組み替えます。
          個別ページの品質だけを上げても、サイト全体としてのまとまりが無いと積み上がりません。
          <Link href={lessonPath("structure")}>レッスン07</Link>へ進んでください。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
