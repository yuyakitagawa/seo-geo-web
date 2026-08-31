import type { Metadata } from "next";
import Link from "next/link";
import { FigureDoDont, FigureFlow, FigurePipeline, FigureTimeline } from "@/components/figures";
import { GuideChecklist, GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { LessonShell } from "@/components/lesson";
import { ScreenIndexReport, ScreenSearchPerformance, ScreenUrlInspection } from "@/components/screens";
import { requireLesson, lessonMetadata, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("measurement");

const REF = {
  perf: { href: "https://support.google.com/webmasters/answer/7576553?hl=ja", label: "検索パフォーマンス レポート" },
  indexReport: { href: "https://support.google.com/webmasters/answer/7440203?hl=ja", label: "ページ インデックス登録レポート" },
  urlInspection: { href: "https://support.google.com/webmasters/answer/9012289?hl=ja", label: "URL 検査ツール" },
  aiFeatures: { href: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja", label: "AI 機能とウェブサイト" },
  drops: { href: "https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops?hl=ja", label: "検索トラフィックの減少をデバッグする" },
  manual: { href: "https://support.google.com/webmasters/answer/9044175?hl=ja", label: "[手動による対策] レポート" },
  sitemaps: { href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja", label: "サイトマップの作成と送信" },
  robots: { href: "https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ja", label: "robots.txt の書き方、設定と送信" },
  essentials: { href: "https://developers.google.com/search/docs/essentials?hl=ja", label: "Google 検索の基本事項" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "order", label: "見る順番：表示回数が先" },
  { id: "screens", label: "Search Consoleの3画面" },
  { id: "routine", label: "Search Consoleの点検チェックリスト" },
  { id: "ai", label: "AI検索からの流入を測る" },
  { id: "cycle", label: "4週間サイクルで判断する" },
  { id: "stop", label: "施策を畳む基準" },
];

export default function Lesson10() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="order"
        title="見る順番：表示回数が先"
        lead="施策の効果は、順位ではなく表示回数から見ます。表示回数が増えているなら、まだクリックされていなくてもインデックスと関連性は前進しています。順位を先に見ると、まだ動くはずのない段階で「効いていない」と判断してしまいます。"
      >
        <FigurePipeline
          title="効果を確認する順番"
          stages={[
            { label: "① 表示回数", desc: "インデックスされ、クエリとの関連ありと判断されているか。ここが動かなければ、次の指標を見ても意味がない。", fail: "そもそも検索結果の対象になっていない。技術的な問題を疑う。" },
            { label: "② クリック数とCTR", desc: "検索結果の中で選ばれているか。表示回数があるのにCTRが低ければ、タイトルと説明文の問題。", fail: "表示はされるが選ばれていない。本文ではなくタイトルを直す。" },
            { label: "③ 平均掲載順位", desc: "①と②が動いたうえで、順位が上がっているかを見る。単独では判断材料にしない。", fail: "順位だけを見て、上の2段階の問題を見落とす。" },
          ]}
          caption={
            <>
              各指標の定義はSearch Consoleヘルプにあります。平均掲載順位は、実際に表示された結果の平均です。
              <GuideRef {...REF.perf} />
            </>
          }
        />
        <FigureDoDont
          title="判断に使う数値／使わない数値"
          dos={[
            "Search Consoleの表示回数・クリック数・CTR・平均掲載順位",
            "インデックス登録済みページ数の推移",
            "PageSpeed Insightsのフィールドデータ（実際のユーザーの環境）",
            "アクセス解析の参照元ドメイン（AI検索からの流入）",
          ]}
          donts={[
            "順位チェックツールの日々の上下（端末・地域・パーソナライズで変わる）",
            "自分で検索したときの見え方（自分の検索履歴が反映される）",
            "PageSpeed Insightsのラボデータのスコアだけ",
            "SNSでの「順位が上がった／下がった」という報告",
          ]}
        />
      </GuideSection>

      <GuideSection
        id="screens"
        title="Search Consoleの3画面"
        lead="日常的に見るのは3画面です。「検索パフォーマンス」で推移を、「ページ」でインデックス登録の状況を、「URL 検査」で1ページずつの登録可否を確認します。"
      >
        <h3>検索パフォーマンス：推移とクエリ</h3>
        <ScreenSearchPerformance />
        <p>
          期間を直近28日にし、前年同期または前の期間と比較します。全体の推移だけでなく、
          <strong>ページ別</strong>と<strong>クエリ別</strong>を必ず開いてください。全体が横ばいでも、
          伸びているページと落ちているページが打ち消し合っていることがあります。
          <GuideRef {...REF.perf} />
        </p>

        <h3>ページ（インデックス登録）：登録されているか</h3>
        <ScreenIndexReport />
        <p>
          「未登録」の件数そのものは問題ではありません。タグ一覧やパラメータ違いのURLも未登録に入るためです。
          見るのは内訳で、公開したいページが「クロール済み - インデックス未登録」や
          「noindex タグによって除外されました」に入っていないかを確認します。
          <GuideRef {...REF.indexReport} />
        </p>

        <h3>URL 検査：1ページの状態を確定させる</h3>
        <ScreenUrlInspection />
        <p>
          個別ページの問題を切り分けるときに使います。とくに「Googleが選択した正規URL」は、
          自分が意図したcanonicalが採用されているかを確認できる唯一の場所です。
          <GuideRef {...REF.urlInspection} />
        </p>
      </GuideSection>

      <GuideSection
        id="routine"
        title="Search Consoleの点検チェックリスト"
        lead="Search Consoleは「毎日開いて眺める」ものではなく、頻度を決めて決まった場所だけを見るものです。週に1回は壊れていないかの確認だけを行い、数値で施策の良し悪しを判断するのは月に1回にします。ここでは、最初の設定・週次・月次・変更したときの4つに分けて、確認する場所と合格の条件をまとめます。"
      >
        <GuideChecklist
          title="① 最初に1度だけ：計測できる状態を作る"
          cadence="登録時"
          items={[
            {
              check: "所有権を確認し、検索パフォーマンスの画面が開く",
              where: "プロパティを追加 → 所有権の確認",
              ok: "「検索パフォーマンス」のグラフが開く（作りたてでデータが0でもよい）",
              ng: <>確認方法を変える（DNSレコードが触れない場合はHTMLタグ）。手順は<Link href={lessonPath("first-week")}>レッスン02</Link>。</>,
            },
            {
              check: "サイト全体の数値が1つのプロパティに集まっている",
              where: "プロパティの一覧（ドメイン／URLプレフィックス）",
              ok: "www有無・http/httpsで数値が割れていない",
              ng: "DNSレコードを追加できるならドメインプロパティを作り、そちらを基準にする",
            },
            {
              check: "サイトマップを送信し、ステータスが「成功しました」になっている",
              where: "サイトマップ",
              ok: "検出されたURL数が、公開しているページ数とおおむね一致する",
              ng: <>数が大きくずれていれば、サイトマップの生成元を確認する。<GuideRef {...REF.sitemaps} /></>,
            },
            {
              check: "重大な問題の通知が、いま見ている人に届く",
              where: "設定 → ユーザーと権限／メール通知",
              ok: "運用している本人がユーザーに入っていて、通知がオンになっている",
              ng: "権限が退職者や制作会社だけになっていないか棚卸しする",
            },
          ]}
        />

        <GuideChecklist
          title="② 週に1回：壊れていないかだけを見る"
          cadence="5分・数値の判断はしない"
          items={[
            {
              check: "表示回数が前の期間から急に落ちていない",
              where: "検索パフォーマンス → 期間を直近28日、前の期間と比較",
              ok: "横ばい以上。数％の上下は誤差として扱う",
              ng: "ページ別に切り替え、落ちたページを特定してから原因を見る",
            },
            {
              check: "インデックス登録済みのページ数が減っていない",
              where: "ページ（インデックス登録）",
              ok: "公開ページの増加に沿って、登録済みが増えているか横ばい",
              ng: <>未登録の内訳を開き、公開したいページが混ざっていないか確認する。<GuideRef {...REF.indexReport} /></>,
            },
            {
              check: "手動による対策に問題が出ていない",
              where: "セキュリティと手動による対策 → 手動による対策",
              ok: "「問題は検出されませんでした」と表示される",
              ng: <>他の数値を見る前にここを処理する。手順は<Link href={lessonPath("updates-risk")}>レッスン12</Link>。<GuideRef {...REF.manual} /></>,
            },
            {
              check: "セキュリティの問題が出ていない",
              where: "セキュリティと手動による対策 → セキュリティの問題",
              ok: "検出なし",
              ng: "改ざん・マルウェアの可能性がある。検索の問題として扱う前にサイトの安全性を確認する",
            },
          ]}
          caption="直近数日のデータは確定していないため、週次では「前日比」ではなく期間同士の比較で見ます。"
        />

        <GuideChecklist
          title="③ 月に1回：数値を読んで次の作業を決める"
          cadence="30分・ここで判断する"
          items={[
            {
              check: "表示回数はあるのにCTRが低いクエリを書き出した",
              where: "検索パフォーマンス → クエリ別（表示回数で並べ替え）",
              ok: "上位クエリごとに、タイトルと説明文を直す候補が3件以内に絞れている",
              ng: <>本文ではなくタイトルから直す。書き方は<Link href={lessonPath("writing")}>レッスン06</Link>。</>,
            },
            {
              check: "表示回数はあるのに、そのクエリに答えるページが無いものを拾った",
              where: "検索パフォーマンス → クエリ別 ＋ ページ別",
              ok: "次に作るページが、思いつきではなく数値から決まっている",
              ng: <>クエリの意図から作る手順は<Link href={lessonPath("search-intent")}>レッスン03</Link>。</>,
            },
            {
              check: "先月公開したページがインデックス登録されている",
              where: "URL 検査（1本ずつ）",
              ok: "「URLはGoogleに登録されています」と表示される",
              ng: <>理由別の対処は<Link href={`${lessonPath("technical")}#not-indexed`}>レッスン05の「未インデックスの対処法」</Link>。<GuideRef {...REF.urlInspection} /></>,
            },
            {
              check: "主要ページで「Googleが選択した正規URL」が意図どおり",
              where: "URL 検査 → カバレッジ",
              ok: "自分が指定したcanonicalと一致している",
              ng: "重複ページの統合方針を見直す。Googleは指定を参考にするだけで、必ず従うわけではない",
            },
            {
              check: "構造化データ（拡張レポート）にエラーが出ていない",
              where: "拡張 → 各リッチリザルトのレポート",
              ok: "エラー0。警告は内容を見て判断する",
              ng: <>マークアップの直し方は<Link href={lessonPath("technical")}>レッスン05</Link>。</>,
            },
            {
              check: "AI検索からの流入を、検索とは別に把握している",
              where: "アクセス解析の参照元ドメイン（chatgpt.com、perplexity.ai など）",
              ok: "参照元ごとのセッション数を月次で並べられる",
              ng: "AIによる概要・AIモードは検索タイプ「ウェブ」に合算されるため、Search Console側では分離できない",
            },
          ]}
        />

        <GuideChecklist
          title="④ 変更したときだけ：反映を確認する"
          cadence="作業した日と、その1週間後"
          items={[
            {
              check: "robots.txtを変えたら、Googleが読んだ内容を確認する",
              where: "設定 → robots.txt レポート",
              ok: "取得日時が変更後になっていて、内容が意図どおり",
              ng: <>書き方と使い分けは<Link href={lessonPath("technical")}>レッスン05</Link>。<GuideRef {...REF.robots} /></>,
            },
            {
              check: "重要ページを公開・大きく書き換えたら、インデックス登録をリクエストする",
              where: "URL 検査 → インデックス登録をリクエスト",
              ok: "リクエストが受け付けられ、数日後に登録済みになる",
              ng: "登録されない場合、リクエストの問題ではなくページ側の条件を疑う（noindex・重複・内容の薄さ）",
            },
            {
              check: "URLを変えたら、旧URLと新URLの両方を追う",
              where: "URL 検査 ＋ ページ（インデックス登録）",
              ok: "旧URLがリダイレクト扱いになり、新URLが登録されていく",
              ng: <>サイト移転時の手順は<Link href={lessonPath("updates-risk")}>レッスン12</Link>。</>,
            },
            {
              check: "施策の開始日と対象URLを記録した",
              where: "自分のメモ（Search Consoleの外）",
              ok: "実行日・対象URL・変更内容・開始時点の表示回数が残っている",
              ng: "記録が無いと、4週間後に何と比較すればよいかが分からなくなる",
            },
          ]}
        />
      </GuideSection>

      <GuideSection
        id="ai"
        title="AI検索からの流入を測る"
        lead={
          <>
            Googleは、AIによる概要やAIモードに表示されたサイトも、Search Consoleの検索タイプ「ウェブ」の
            パフォーマンスレポートに含まれると説明しています。つまり通常の検索と合算されており、
            AI機能だけを切り出したレポートは提供されていません。
            <GuideRef {...REF.aiFeatures} />
          </>
        }
      >
        <GuideTable
          head={["測りたいもの", "どこで見るか", "限界"]}
          rows={[
            [
              "AIによる概要・AIモードからの流入",
              "Search Consoleの検索タイプ「ウェブ」（通常の検索と合算）",
              "AI機能だけを分離できない。合算値の変化として観察するしかない",
            ],
            [
              "ChatGPTからの流入",
              "アクセス解析の参照元ドメイン（chatgpt.com など）",
              "回答内で引用されたが、クリックされなかった分は測れない",
            ],
            [
              "Perplexityからの流入",
              "アクセス解析の参照元ドメイン（perplexity.ai など）",
              "同上",
            ],
            [
              "AIの回答に自社が出た割合",
              "AI可視性ツール（Semrush、Ahrefsなど）",
              "ツールが投げた質問への回答であり、実ユーザーが受け取った回答そのものではない",
            ],
            [
              "AIクローラーの巡回状況",
              "サーバーのアクセスログ（User-agentで絞る）",
              "ログを取得・保存できる環境が必要",
            ],
          ]}
        />
        <p>
          AI可視性ツールを契約する場合、確認すべきなのは<strong>自分で決めた質問を追跡できるか</strong>（カスタムプロンプトに対応しているか）です。
          ツールが用意した汎用の質問だけでは、自社が本当に出たい場面での可視性は測れません。
          ツールの比較は<Link href="/tools">ツール一覧</Link>にまとめています。
        </p>
      </GuideSection>

      <GuideSection
        id="cycle"
        title="4週間サイクルで判断する"
        lead="毎日見ても判断はできません。Search Consoleのデータには遅延があり、Core Web Vitalsのフィールドデータは28日間の集計です。判断は4週間ごとに行い、その間は施策を変えないのが基本です。"
      >
        <FigureFlow
          title="4週間の運用サイクル"
          steps={[
            { label: "0日目: 施策を1つ決めて実行する", desc: "同時に複数の施策を打たない。打つ場合は、どの施策が効いたか分からなくなることを承知のうえで行う。" },
            { label: "0日目: 開始日と対象ページを記録する", desc: "実行日・対象URL・変更内容・開始時点の数値をメモに残す。" },
            { label: "7日目: 技術的な反映だけ確認する", desc: "URL検査で、変更が読み取られているかを見る。数値の判断はまだしない。" },
            { label: "28日目: 数値を比較する", desc: "表示回数 → クリック数 → 順位の順に、開始時点と比較する。" },
            { label: "28日目: 続けるか畳むかを決める", desc: "表示回数がまったく動いていなければ、前提（インデックス・意図の対応）を疑う。" },
          ]}
        />
        <FigureTimeline
          title="施策ごとに、効果が見え始めるまでの目安"
          axis={["1週目", "4週目", "8週目", "12週目"]}
          rows={[
            { label: "技術的な修正（noindex解除・canonical修正）", start: 0, span: 22, desc: "数日〜数週間", tone: "accent" },
            { label: "構造化データの追加", start: 6, span: 30, desc: "再クロール後に表示が変わる", tone: "accent" },
            { label: "Core Web Vitalsの改善", start: 14, span: 30, desc: "フィールドデータは28日間の集計", tone: "seo" },
            { label: "既存ページの本文改善", start: 20, span: 48, desc: "1〜3か月", tone: "seo" },
            { label: "新規ページの追加", start: 34, span: 60, desc: "インデックス登録から評価まで", tone: "seo" },
            { label: "外部からの参照の増加", start: 55, span: 45, desc: "3か月〜", tone: "geo" },
          ]}
          caption={
            <>
              目安は当サイトの整理であり、Googleが保証する期間ではありません。Googleは効果が出るまでの期間を示しておらず、インデックス登録や掲載も保証していません。
              <GuideRef {...REF.essentials} />
            </>
          }
        />
      </GuideSection>

      <GuideSection
        id="stop"
        title="施策を畳む基準"
        lead="効果の出ない施策を続けることが、この分野で最も多い時間の浪費です。畳む基準をあらかじめ決めておき、28日目にその基準で判断します。"
      >
        <GuideTable
          head={["28日後の状態", "判断", "次にやること"]}
          rows={[
            [
              "表示回数が増えている",
              "続ける",
              "同じ施策を他のページにも展開する",
            ],
            [
              "表示回数は横ばい、CTRが上がった",
              "続ける",
              "タイトルの改善が効いている。他ページのタイトルも見直す",
            ],
            [
              "表示回数が横ばいで、CTRも変わらない",
              "前提を疑う",
              "URL検査でインデックス状況を確認する。登録されていなければ施策の問題ではない",
            ],
            [
              "表示回数が落ちた",
              "原因を切り分ける",
              "技術的な問題 → 手動による対策 → 季節性 → アルゴリズム更新の順に確認する（レッスン12）",
            ],
            [
              "サイト全体で急落した",
              "施策と無関係の可能性",
              "Googleの手順に沿ってデバッグする。個別ページの施策を疑う前にサイト全体を見る",
            ],
          ]}
          caption={
            <>
              流入減少の切り分け手順はGoogleが公開しています。
              <GuideRef {...REF.drops} />
            </>
          }
        />
        <p>
          次のレッスンでは、ここまでの作業について「実際にやった結果、何が起きたか」が公開されている事例を、
          一次情報つきでまとめて見ていきます。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
