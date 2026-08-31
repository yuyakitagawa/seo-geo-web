import type { Metadata } from "next";
import Link from "next/link";
import { FigureDoDont, FigureFlow, FigureQuote } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { LessonShell } from "@/components/lesson";
import { requireLesson, lessonMetadata, lessonPath } from "@/lib/curriculum";
import { LINK } from "@/lib/ui";

const lesson = requireLesson("updates-risk");

const REF = {
  coreUpdates: { href: "https://developers.google.com/search/updates/core-updates?hl=ja", label: "Google 検索のランキング アップデート" },
  drops: { href: "https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops?hl=ja", label: "検索トラフィックの減少をデバッグする" },
  spam: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja", label: "ウェブ検索のスパムに関するポリシー" },
  spamScaled: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja#scaled-content", label: "スパムポリシー（大量生成されたコンテンツの不正使用）" },
  spamLink: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja#link-spam", label: "スパムポリシー（リンクスパム）" },
  manual: { href: "https://support.google.com/webmasters/answer/9044175?hl=ja", label: "[手動による対策] レポート" },
  siteMove: { href: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=ja", label: "URL の変更を伴うサイト移転" },
  helpful: { href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja", label: "ユーザー第一のコンテンツの作成" },
  aiContent: { href: "https://developers.google.com/search/blog/2023/02/google-search-and-ai-content?hl=ja", label: "AI 生成コンテンツに対する方針" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "core", label: "コアアップデートとは何か" },
  { id: "debug", label: "流入が落ちたときの切り分け" },
  { id: "spam", label: "スパムポリシーの禁止事項" },
  { id: "manual", label: "手動による対策を受けたら" },
  { id: "migration", label: "リニューアル・移転のリスク" },
];

export default function Lesson10() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="core"
        title="コアアップデートとは何か"
        lead={
          <>
            コアアップデートは、Googleの検索ランキングシステム全体に対する定期的な見直しです。Googleは、
            コアアップデートによる変動は個々のページに問題があることを必ずしも示すものではなく、
            修正すべき特定の項目があるわけではないと説明しています。
            <GuideRef {...REF.coreUpdates} />
          </>
        }
      >
        <p>
          この説明は、実務上とても重要です。コアアップデートで順位が落ちたとき、
          <strong>「何を直せば戻るか」という問いには公式な答えが用意されていない</strong>ということだからです。
          Googleが推奨しているのは、有用で信頼性の高い、ユーザー第一のコンテンツになっているかを自己評価することです。
          <GuideRef {...REF.helpful} />
        </p>
        <GuideTable
          head={["アップデートの種類", "対象", "対応"]}
          rows={[
            [
              "コアアップデート",
              "ランキングシステム全体の見直し",
              "特定の修正項目は示されない。コンテンツの自己評価を行う。回復は次回以降のアップデートのタイミングになることがある",
            ],
            [
              "スパムアップデート",
              "スパムポリシー違反の検出",
              "ポリシー違反にあたる要素を特定して除去する。何が違反かは公開されている",
            ],
            [
              "その他のランキング更新",
              "特定の機能や表示の変更",
              "Googleの発表内容を確認し、該当する場合のみ対応する",
            ],
          ]}
          caption={
            <>
              アップデートの一覧と、それぞれについてのGoogleの説明は公式ページにまとまっています。
              <GuideRef {...REF.coreUpdates} />
            </>
          }
        />
        <FigureDoDont
          title="コアアップデート直後にやること／やらないこと"
          dos={[
            "変動の前後で、どのページ・どのクエリが落ちたかをSearch Consoleで特定する",
            "落ちたページが答えるべき質問に、実際に答えられているかを読み直す",
            "少なくとも数週間、変動が落ち着くまで待ってから判断する",
            "他の原因（技術的な問題・季節性）を先に除外する",
          ]}
          donts={[
            "発表直後に、全ページを一斉に書き換える",
            "SNSで流れてくる「今回のアップデートの傾向」を根拠に施策を決める",
            "順位が戻らないことを理由に、日ごとに施策を変え続ける",
            "コアアップデートを、スパムポリシー違反への対処と混同する",
          ]}
        />
      </GuideSection>

      <GuideSection
        id="debug"
        title="流入が落ちたときの切り分け"
        lead={
          <>
            検索流入が落ちたとき、原因はアルゴリズムとは限りません。Googleは検索トラフィック減少のデバッグ手順を
            公開しており、技術的な問題を先に除外することを前提にしています。原因の特定を飛ばして本文を書き直すと、
            直っていない原因がそのまま残ります。
            <GuideRef {...REF.drops} />
          </>
        }
      >
        <FigureFlow
          title="流入が落ちたときに確認する順番"
          steps={[
            { label: "① 技術的な問題を除外する", desc: "サーバー障害、robots.txtの誤設定、noindexの混入、サイト移転の失敗、CDNの設定変更。URL検査とインデックス登録レポートで確認する。" },
            { label: "② 手動による対策を確認する", desc: "Search Consoleの「手動による対策」に問題が表示されていないかを見る。表示されていれば、原因はここで確定する。" },
            { label: "③ 落ちた範囲を特定する", desc: "サイト全体か、特定のページ群か、特定のクエリか。範囲によって疑う原因が変わる。" },
            { label: "④ 季節性・外部要因を確認する", desc: "前年同期と比較する。検索需要そのものが減っている場合、自サイトの問題ではない。" },
            { label: "⑤ アルゴリズム更新を確認する", desc: "落ちた時期にアップデートの発表があったかを確認する。あった場合も、①〜④を除外してから判断する。" },
          ]}
          caption={
            <>
              手順はGoogleが公開しているデバッグガイドに沿っています。
              <GuideRef {...REF.drops} />
            </>
          }
        />
        <GuideTable
          head={["落ちた範囲", "疑う原因", "確認する場所"]}
          rows={[
            ["サイト全体が急落", "技術的な問題（robots.txt・noindex・サーバー）／手動による対策", "URL検査、インデックス登録レポート、手動による対策"],
            ["特定のディレクトリだけ", "そのディレクトリの設定変更／テンプレートの変更", "該当URLのURL検査、直近のデプロイ内容"],
            ["特定のクエリだけ", "検索意図の変化／競合ページの入れ替わり", "検索パフォーマンスのクエリ別、実際の検索結果"],
            ["全体がゆるやかに減少", "季節性／検索需要の変化／アルゴリズムの継続的な更新", "前年同期比、検索需要の推移"],
            ["表示回数は横ばいでクリックだけ減少", "検索結果での表示のされ方が変わった", "検索パフォーマンスのCTR、実際の検索結果の見た目"],
          ]}
        />
      </GuideSection>

      <GuideSection
        id="spam"
        title="スパムポリシーの禁止事項"
        lead={
          <>
            Googleはウェブ検索のスパムに関するポリシーを公開しており、違反しているサイトは検索結果での掲載順位が下がったり、
            まったく表示されなくなったりすることがあると説明しています。何が違反かは公開されているため、
            ここは推測ではなく確認して避けられる領域です。
            <GuideRef {...REF.spam} />
          </>
        }
      >
        <GuideTable
          head={["禁止されている行為", "具体例", "実務で起きやすい形"]}
          rows={[
            ["リンクスパム", "ランキング操作を目的としたリンクの売買・相互リンクの過剰な交換", "被リンク獲得サービスの購入、記事広告での無指定リンク"],
            ["大量生成されたコンテンツの不正使用", "価値を付加せず、順位操作を主目的に大量のページを生成する", "テンプレートに地域名・商品名だけを差し替えたページの量産"],
            ["無断で複製されたコンテンツ", "他サイトのコンテンツを、独自の価値を加えずに転載する", "引用の範囲を超えた転載、翻訳しただけのページ"],
            ["クローキング", "ユーザーと検索エンジンに異なる内容を見せる", "クローラー判定でコンテンツを出し分ける実装"],
            ["隠しテキスト・隠しリンク", "ユーザーには見えない形でテキストやリンクを置く", "背景色と同じ文字色、画面外への配置"],
            ["キーワードの乱用", "順位操作を目的にキーワードを詰め込む", "タイトルや本文への不自然なキーワードの繰り返し"],
            ["サイトの評判の不正使用", "第三者のコンテンツを、サイトの評価を利用する目的で掲載する", "自社と無関係な外部業者に記事枠を貸す運用"],
            ["不正なリダイレクト", "ユーザーと検索エンジンで異なる転送先を使う", "検索から来た場合だけ別ページへ飛ばす実装"],
          ]}
          caption={
            <>
              項目と説明はGoogleが公開しているスパムポリシーにもとづきます。実務で起きやすい形は当サイトの整理です。
              <GuideRef {...REF.spam} />
              <GuideRef {...REF.spamLink} />
            </>
          }
        />
        <p>
          このうち、いま最も間違えやすいのが<strong>大量生成されたコンテンツの不正使用</strong>です。
          Googleは、コンテンツの制作方法ではなく品質に注目していると説明しており、AIの使用そのものは禁じていません。
          <GuideRef {...REF.aiContent} />
          問題になるのは、ユーザーにとっての価値を付加せず、検索順位の操作を主な目的として大量にページを生成する場合です。
          <GuideRef {...REF.spamScaled} />
          判断の分かれ目は、生成に使ったかどうかではなく、そのページが読者の質問に答えているかどうかです
          （<Link href={lessonPath("writing")}>レッスン06</Link>）。
        </p>
      </GuideSection>

      <GuideSection
        id="manual"
        title="手動による対策を受けたら"
        lead={
          <>
            アルゴリズムによる評価とは別に、Googleの担当者がポリシー違反を確認して適用する措置があります。
            適用されるとSearch Consoleの「手動による対策」レポートに表示され、該当ページまたはサイト全体が
            検索結果で下位に表示されるか、表示されなくなります。
            <GuideRef {...REF.manual} />
          </>
        }
      >
        <FigureFlow
          title="手動による対策への対応手順"
          steps={[
            { label: "レポートで対象範囲と理由を確認する", desc: "サイト全体に対する措置か、特定のページに対する措置かを確認する。理由の分類も表示される。" },
            { label: "指摘された問題をすべて修正する", desc: "指摘された箇所だけでなく、同じ問題が他にもないかを確認する。部分的な修正では再審査が通らない。" },
            { label: "修正内容を記録する", desc: "何が問題で、どう直し、再発防止に何をしたかを整理する。再審査リクエストで説明が必要になる。" },
            { label: "再審査をリクエストする", desc: "レポートから申請する。審査には時間がかかり、承認は保証されていない。" },
            { label: "承認されるまで、新たな施策を打たない", desc: "審査中に別の変更を加えると、何が評価されたのか分からなくなる。" },
          ]}
        />
        <FigureQuote
          text="コアアップデートによる変動は、必ずしもページに問題があることを示すものではありません"
          source={
            <a href={REF.coreUpdates.href} target="_blank" rel="noopener" className={LINK}>
              Google 検索セントラル「Google 検索のランキング アップデート」の説明にもとづく要約
            </a>
          }
        />
        <p>
          手動による対策とコアアップデートは、別の仕組みです。手動による対策は
          <strong>Search Consoleに通知が出る</strong>ので、通知が無ければこの原因は除外できます。
          通知が無いのに順位が落ちている場合、対応は「何かを直す」ではなく「切り分けを続ける」になります。
        </p>
      </GuideSection>

      <GuideSection
        id="migration"
        title="リニューアル・移転のリスク"
        lead={
          <>
            サイトリニューアルは、この分野で最も再現性の高い事故です。Googleは、URLの変更を伴うサイト移転の手順を
            公開しており、旧URLと新URLの対応表を作ってから移行することを前提にしています。
            <GuideRef {...REF.siteMove} />
          </>
        }
      >
        <GuideTable
          head={["典型的な失敗", "何が起きるか", "防ぎ方"]}
          rows={[
            [
              "旧URLから新URLへの301リダイレクトが無い",
              "旧URLが404になり、それまでの評価と流入が消える",
              "移行前に旧URLの一覧を出し、1対1の対応表を作る",
            ],
            [
              "リダイレクト先がすべてトップページ",
              "個別ページの評価が引き継がれず、ユーザーも目的のページに着かない",
              "内容が対応する個別ページへ転送する。対応先が無いページは、残すか404にするかを決める",
            ],
            [
              "検証環境の設定を本番に持ち込む",
              "サイト全体がnoindexまたはDisallowになり、検索結果から消える",
              "公開直後にrobots.txtとmeta robotsを実機で確認する",
            ],
            [
              "サイトマップが旧URLのまま",
              "存在しないURLを送信し続けることになる",
              "移行と同時にサイトマップを再生成し、再送信する",
            ],
            [
              "内部リンクが旧URLのまま",
              "リダイレクトが多段になり、経路が長くなる",
              "本文中のリンクも新URLに書き換える",
            ],
          ]}
        />
        <p>
          移行後は、URL検査で主要ページの状態を確認し、インデックス登録レポートで「未登録」が急増していないかを見ます。
          確認の手順は<Link href={lessonPath("measurement")}>レッスン09</Link>と同じです。
        </p>
        <p>
          これで11レッスンは終わりです。ここから先は、<Link href={lessonPath("measurement")}>レッスン09</Link>の
          4週間サイクルを回し続けることが実務になります。検索とAI検索の仕様は頻繁に変わるため、
          <Link href="/news">ニュース</Link>で変更を追いながら、この教科書のチェックリストを定期的に見直してください。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
