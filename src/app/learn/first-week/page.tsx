import type { Metadata } from "next";
import Link from "next/link";
import { FigureDoDont, FigureFlow } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { CaseList, LessonShell } from "@/components/lesson";
import { ScreenIndexReport, ScreenUrlInspection } from "@/components/screens";
import { getCases } from "@/lib/cases";
import { requireLesson, lessonMetadata, lessonNo, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("first-week");

const REF = {
  robots: { href: "https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ja", label: "robots.txt の書き方、設定と送信" },
  noindex: { href: "https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja", label: "noindex でコンテンツをインデックスから除外する" },
  canonical: { href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja", label: "重複した URL を統合する" },
  sitemaps: { href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja", label: "サイトマップの作成と送信" },
  indexReport: { href: "https://support.google.com/webmasters/answer/7440203?hl=ja", label: "ページ インデックス登録レポート" },
  urlInspection: { href: "https://support.google.com/webmasters/answer/9012289?hl=ja", label: "URL 検査ツール" },
  essentials: { href: "https://developers.google.com/search/docs/essentials?hl=ja", label: "Google 検索の基本事項" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "week", label: "7日間の作業" },
  { id: "days", label: "各日にやること" },
  { id: "troubleshoot", label: "症状から原因を特定する" },
  { id: "baseline", label: "改善前の数値を残す" },
  { id: "example", label: "実例：基礎を直しただけで動いた事例" },
];

export default function Lesson02() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="week"
        title="7日間の作業"
        lead="最初の1週間でやるのは、順位を上げる施策ではありません。「順位がつく前提」を満たしているかの点検です。1日1つずつ、計測環境 → インデックス → クロール制御 → 表示の順に確認します。1日あたり30分から1時間を想定しています。"
      >
        <FigureFlow
          title="最初の1週間でやる7つの点検"
          steps={[
            { label: "1日目: Search Consoleを登録する", desc: "所有権を確認し、検索パフォーマンスの数値が見える状態にする。ここが無いと以降の作業の効果を確認できない。" },
            { label: "2日目: インデックス状況を確認する", desc: "URL検査でトップページと主要3ページを調べ、「インデックス登録済み」になっているかを見る。" },
            { label: "3日目: robots.txtを読む", desc: "https://自分のドメイン/robots.txt を開き、Disallowの対象が意図したものだけか確認する。" },
            { label: "4日目: XMLサイトマップを送信する", desc: "サイトマップのURLをSearch Consoleに送信し、「成功しました」と表示されることを確認する。" },
            { label: "5日目: タイトルと見出しを見直す", desc: "主要ページのtitleとh1が、そのページの内容と検索する側の言葉に合っているかを確認する。" },
            { label: "6日目: AIクローラーの扱いを確認する", desc: "robots.txtでOAI-SearchBotやPerplexityBotなどを止めていないかを確認し、方針を決める。" },
            { label: "7日目: 改善前の数値を記録する", desc: "表示回数・クリック数・インデックス済みページ数をメモに残す。後から効果を判断するための基準値になる。" },
          ]}
          caption="この7日間は「順位を上げる」作業ではなく「順位がつく前提を満たす」作業です。"
        />
      </GuideSection>

      <GuideSection
        id="days"
        title="各日にやること"
        lead="それぞれの日で、何を開き、何を見て、どうなっていれば完了なのかを具体的にします。"
      >
        <h3>1日目: Search Consoleを登録する</h3>
        <p>
          Google Search Consoleにサイトを追加し、所有権を確認します。所有権の確認方法は、DNSレコードの追加、
          HTMLファイルのアップロード、HTMLタグの設置、Googleアナリティクスやタグマネージャーとの連携などがあります。
          サイト全体（www有無やサブドメインを含む）をまとめて見たい場合はドメインプロパティを選びますが、
          これにはDNSレコードの追加が必要です。DNSを触れない場合は、URLプレフィックスプロパティでHTMLタグによる確認を選びます。
        </p>
        <p>
          <strong>完了の条件</strong>: 「検索パフォーマンス」の画面が開き、グラフが表示されること。
          サイトを作ったばかりの場合はデータが0でも構いません。数字が入り始めるまで数日かかります。
        </p>

        <h3>2日目: インデックス状況を確認する</h3>
        <p>
          Search ConsoleのURL検査ツールに、トップページと重要なページ3本のURLを1つずつ入れて調べます。
          「URLはGoogleに登録されています」と出れば、そのページは検索結果に出る対象になっています。
          <GuideRef {...REF.urlInspection} />
        </p>
        <ScreenUrlInspection />
        <p>
          登録されていない場合、原因は次のいずれかであることがほとんどです。3日目以降の作業でそれぞれ確認します。
        </p>
        <ul>
          <li>noindexタグが入っている（テーマやプラグインの設定、公開前の設定の残り）</li>
          <li>robots.txtでDisallowになっている</li>
          <li>canonicalが別のURLを指している</li>
          <li>公開してから日が浅く、まだクロールされていない</li>
        </ul>

        <h3>3日目: robots.txtを読む</h3>
        <p>
          ブラウザで <code>https://自分のドメイン/robots.txt</code> を開きます。ファイルが無い場合（404）は、
          クローラーはサイト全体をクロールしてよいと解釈するため、それ自体は問題ではありません。
          <GuideRef {...REF.robots} />
          問題になるのは、CMSやテーマが出力した内容を確認しないまま放置していて、重要なディレクトリがDisallowになっている場合です。
        </p>
        <FigureDoDont
          title="robots.txt と noindex の使い分け"
          dos={[
            "検索結果に出したくないページには noindex を使う（クローラーが取得できて初めて読める）",
            "管理画面や検索結果ページなど、クロール自体が不要なパスに Disallow を使う",
            "変更後は Search Console の robots.txt レポートで、Google が読んだ内容を確認する",
          ]}
          donts={[
            "検索結果に出したくないという理由で robots.txt の Disallow を使う（他ページからのリンク経由でURLだけ登録されることがある）",
            "同じページに Disallow と noindex を同時に指定する（取得できないので noindex が読まれない）",
            "検証環境の robots.txt（全ページ Disallow）をそのまま本番に持ち込む",
          ]}
        />

        <h3>4日目: XMLサイトマップを送信する</h3>
        <p>
          サイトマップは、サイト内のURLとその更新日をクローラーに伝えるファイルです。多くのCMSやフレームワークは
          自動生成の仕組みを持っています。生成されたURL（多くは <code>/sitemap.xml</code>）をSearch Consoleの
          「サイトマップ」から送信します。
          <GuideRef {...REF.sitemaps} />
        </p>
        <p>
          <strong>完了の条件</strong>: ステータスが「成功しました」になり、検出されたURL数が実際のページ数とおおむね一致すること。
          数が大きくずれている場合は、サイトマップに載せているURLと実際に公開しているページがずれています。
        </p>
        <ScreenIndexReport />
        <p>
          あわせて「ページ」（インデックス登録レポート）を開き、「未登録」の内訳を見ます。件数そのものは問題ではありません。
          タグ一覧やパラメータ違いのURLも未登録に入るためです。確認するのは、公開したいページが
          「クロール済み - インデックス未登録」や「noindex タグによって除外されました」に混ざっていないかです。
          <GuideRef {...REF.indexReport} />
        </p>

        <h3>5日目: タイトルと見出しを見直す</h3>
        <p>
          主要ページのtitleタグとh1を確認します。見るのは3点です。ページごとに違う文言になっているか、
          そのページの内容を表しているか、読者が実際に検索する言葉が入っているか。
          サイト名だけのtitleや、全ページ共通のtitleは、検索結果でどのページを選べばよいか分からない状態を作ります。
        </p>
        <p>
          キーワードを詰め込む必要はありません。詰め込みは生成AIの回答内での可視性にもほとんど効果がないことが
          研究で報告されており、Googleのスパムポリシーでも問題として扱われています。
          具体的な書き方は<Link href={lessonPath("writing")}>レッスン06</Link>で扱います。
        </p>

        <h3>6日目: AIクローラーの扱いを確認する</h3>
        <p>
          robots.txtに戻り、AI各社のクローラーを止めていないかを確認します。ChatGPTやPerplexityは、
          Googlebotとは別の自前のクローラーで巡回するため、Googlebotを許可していても、これらを拒否していれば
          その事業者の回答には出ません。いまの許可状況は<Link href="/tools/page-audit">ページ診断</Link>にURLを入れると分かります。
          ボット名の一覧と各社の公式な説明、設定の方針は
          <Link href={lessonPath("geo-implementation")}>レッスン{lessonNo("geo-implementation")}</Link>にまとめています。
        </p>

        <h3>7日目: 改善前の数値を記録する</h3>
        <p>
          最後に、いまの数値をメモに残します。記録するのは、直近28日間の表示回数・クリック数・平均CTR・平均掲載順位、
          そしてインデックス登録済みのページ数です。この基準値が無いと、3か月後に「良くなった気がする」以上の
          判断ができなくなります。
        </p>
      </GuideSection>

      <GuideSection
        id="troubleshoot"
        title="症状から原因を特定する"
        lead="点検中に出てくる典型的な症状と、その原因、確認方法をまとめます。原因を特定せずに本文を書き直しても、詰まっている場所は変わりません。"
      >
        <GuideTable
          head={["症状", "考えられる原因", "確認する場所", "対処"]}
          rows={[
            [
              "サイト全体が検索結果に出ない",
              "robots.txtで全体をDisallowにしている／サイト全体にnoindexが入っている",
              "/robots.txt、ページのHTMLソース内のmeta robots",
              "Disallowを外す。noindexを削除し、URL検査からインデックス登録をリクエストする",
            ],
            [
              "特定のページだけ登録されない",
              "canonicalが別URLを指している／内容が他ページとほぼ同じ",
              "URL検査の「ユーザーが指定した正規URL」と「Googleが選択した正規URL」",
              "canonicalの向き先を直す。内容が重複しているなら統合する",
            ],
            [
              "「クロール済み - インデックス未登録」が多い",
              "中身の薄いページが多い／同じ構成のページが大量にある",
              "インデックス登録レポートの内訳",
              "薄い一覧ページをnoindexにする。統合できるページはまとめる",
            ],
            [
              "身に覚えのないURLがレポートに出る",
              "外部サイトからの誤ったリンク／以前のCMSの残骸／存在しないパスを試す自動巡回bot",
              "URL検査の「参照元ページ」と、自サイト内にそのURLへのリンクがあるか",
              "自分がリンクしていないURLは404のまま残す。robots.txtのDisallowで隠さない（noindexも404も読み取れなくなる）",
            ],
            [
              "表示回数はあるがクリックが無い",
              "タイトルと説明文が検索意図に答えていない",
              "検索パフォーマンスのクエリ別CTR",
              "クエリに直答するタイトルに直す。順位より先にここを見る",
            ],
            [
              "サイトマップの検出URL数が実際より少ない",
              "サイトマップが古い／生成対象から除外されている",
              "Search Consoleのサイトマップ画面",
              "生成設定を確認し、再送信する",
            ],
            [
              "ChatGPTの回答に出てこない",
              "OAI-SearchBotをrobots.txtで拒否している",
              "/robots.txt のUser-agent指定",
              "方針を決めたうえで許可する（レッスン09）",
            ],
          ]}
          caption={
            <>
              対処の前に原因を特定する、という順番が重要です。Googleは要件を満たしていてもインデックス登録を保証しないため、
              「直したのに登録されない」場合は時間をおいて再確認します。
              <GuideRef {...REF.essentials} />
            </>
          }
        />
        <p>
          canonicalの向き先が意図と違っているケースは、CMSの設定やプラグインが原因のことが多く、
          気づきにくい割に影響が大きい問題です。
          <GuideRef {...REF.canonical} />
          noindexとrobots.txtの関係についても、同時指定が効かないという点は間違えやすいので、
          <GuideRef {...REF.noindex} />
          で確認しておいてください。
        </p>
        <p>
          インデックス登録レポートに出る理由ごとの対処（noindex・robots.txt・代替ページ・クロール済み未登録・ソフト404など）は、
          <Link href={`${lessonPath("technical")}#not-indexed`}>レッスン05の「未インデックスの対処法」</Link>にまとめています。
        </p>
      </GuideSection>

      <GuideSection
        id="baseline"
        title="改善前の数値を残す"
        lead="7日目の記録は、後から効果を判断するために必ず残します。記録が無い状態で施策を続けると、うまくいっていない施策を畳む判断ができなくなります。"
      >
        <GuideTable
          head={["記録する数値", "どこで見るか", "後で何に使うか"]}
          rows={[
            ["表示回数（直近28日）", "Search Console 検索パフォーマンス", "インデックスと関連性が前進しているかの一次判断"],
            ["クリック数・平均CTR", "同上", "タイトルと説明文が効いているかの判断"],
            ["平均掲載順位", "同上", "順位そのものより、表示回数と併せて見る"],
            ["インデックス登録済みページ数", "Search Console ページ（インデックス登録）", "公開したページが登録されているかの追跡"],
            ["主要クエリ上位20件", "検索パフォーマンスのクエリ", "次に作るページを決める材料（レッスン03）"],
          ]}
        />
        <p>
          記録の形式は問いません。スプレッドシートでも、テキストファイルでも構いません。重要なのは、
          <strong>日付と一緒に残すこと</strong>と、<strong>施策を始めた日もメモすること</strong>です。
          見る頻度と判断の基準は<Link href={lessonPath("measurement")}>レッスン10</Link>で決めます。
        </p>
      </GuideSection>

      <GuideSection
        id="example"
        title="実例：基礎を直しただけで動いた事例"
        lead="この1週間の作業は地味ですが、公開されている事例では、基礎的な問題を解消した段階で流入が動いています。韓国の求人サイトSaraminは、クロールエラーを解消しただけの段階で流入が15%増えたと報告しています。"
      >
        <CaseList cases={getCases("saramin")} />
        <p>
          この事例で注目すべきなのは、順番です。クロールエラーの解消（2015年）が先にあり、
          その後にmetaタグの整理・canonicalによる重複統合・構造化データの追加が続き、2019年の数値につながっています。
          技術的な土台を飛ばして構造化データだけを入れても、この結果にはなりません。
        </p>
        <p>
          次のレッスンでは、点検が終わったサイトに対して「では何のページを作るか」を決めます。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
