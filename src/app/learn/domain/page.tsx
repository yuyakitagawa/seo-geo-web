import type { Metadata } from "next";
import Link from "next/link";
import { FigureCompare, FigureDoDont, FigureStack } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { LessonShell } from "@/components/lesson";
import { requireLesson, lessonMetadata, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("domain");

const REF = {
  starter: { href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=ja", label: "SEO スターター ガイド" },
  canonical: { href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja", label: "重複した URL を統合する" },
  robots: { href: "https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ja", label: "robots.txt の書き方、設定と送信" },
  noindex: { href: "https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja", label: "noindex でコンテンツをインデックスから除外する" },
  sitemaps: { href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja", label: "サイトマップの作成と送信" },
  spam: { href: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja", label: "ウェブ検索のスパムに関するポリシー" },
  siteMove: { href: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=ja", label: "URL の変更を伴うサイト移転" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "units", label: "どこで単位が分かれるのか" },
  { id: "choice", label: "サブドメインとサブディレクトリの選び方" },
  { id: "host", label: "ホスト名を1つに決める" },
  { id: "staging", label: "検証環境を検索結果に出さない" },
  { id: "policy", label: "中古ドメインと貸しディレクトリ" },
  { id: "example", label: "実例：このサイトのドメイン構成" },
];

export default function Lesson07() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="units"
        title="どこで単位が分かれるのか"
        lead="前のレッスンではサイトの内側の構造を扱いました。ここでは1つ外側、どのドメインにコンテンツを置くかを決めます。まず押さえるのは「サブドメインにすると、何が別々になるのか」です。"
      >
        <FigureStack
          title="3つの分け方と、分けたときに増えるもの"
          layers={[
            {
              label: "別ドメイン（example.net）",
              tone: "geo",
              note: "完全に別サイト",
              desc: "運営主体やサービスが別。設定・計測・内部リンクのすべてが独立する。",
            },
            {
              label: "サブドメイン（blog.example.com）",
              tone: "seo",
              note: "ホストが別",
              desc: "robots.txt・サイトマップ・URLプレフィックスのプロパティが、そのホスト用に別途必要になる。",
            },
            {
              label: "サブディレクトリ（example.com/blog/）",
              tone: "accent",
              note: "同じホスト",
              desc: "robots.txtもサイトマップもSearch Consoleのプロパティも、既存のものをそのまま使える。",
            },
          ]}
          baseNote="上に行くほど独立性が上がり、同時に管理する対象が増える。増える手間に見合う理由があるかで選ぶ。"
        />
        <p>
          robots.txtは、<strong>ホストの直下に置いたものだけが、そのホストに適用されます</strong>。
          <code>example.com/robots.txt</code> は <code>blog.example.com</code> には効かないため、
          サブドメインを作ったらそこにもrobots.txtを用意します。用意しなければ、そのサブドメインには
          クロールの制限が何も無い状態になります。
          <GuideRef {...REF.robots} />
        </p>
        <p>
          サイトマップも同じで、原則として<strong>同じホストのURLだけ</strong>を載せます。
          サブドメインを増やすと、サイトマップも増え、送信と更新の管理対象も増えます。
          <GuideRef {...REF.sitemaps} />
        </p>
        <p>
          Search Consoleでは、URLプレフィックスプロパティがホストごとに分かれます。サブドメインをまとめて見たい場合は
          ドメインプロパティを使いますが、これにはDNSレコードでの所有権確認が必要です（
          <Link href={lessonPath("first-week")}>レッスン02</Link>で登録した形式を確認してください）。
        </p>
        <p>
          なお、Googleがサブドメインを常に別サイトとして扱うと明言しているわけではありません。
          ここで挙げたのは、仕様として確実に分かれる運用上の単位です。順位がどう変わるかではなく、
          <strong>管理する対象がいくつになるか</strong>で判断するのが、確認できる範囲での判断基準になります。
        </p>
      </GuideSection>

      <GuideSection
        id="choice"
        title="サブドメインとサブディレクトリの選び方"
        lead="迷ったらサブディレクトリです。分けるのは、分けないと運用できない事情があるときだけにします。"
      >
        <FigureCompare
          title="どちらを選ぶか"
          cols={[
            {
              label: "サブディレクトリにまとめる",
              tone: "accent",
              sub: "example.com/blog/",
              points: [
                "同じサイトのテーマとして、内部リンクで自然につながる",
                "robots.txt・サイトマップ・プロパティが1組で済む",
                "オウンドメディア、事例集、ヘルプ、導入事例など、本体と読者が重なるもの",
                "後からサブドメインへ移すのは、URLの変更を伴う移転になる",
              ],
            },
            {
              label: "サブドメインに分ける",
              tone: "seo",
              sub: "blog.example.com",
              points: [
                "技術的に同居できない（別のCMS・別のホスティング・別の基盤）",
                "運営チームも読者も別で、内部リンクでつながる必然性が無い",
                "言語や国ごとにサイトを丸ごと分ける",
                "ユーザー投稿など、本体と同じ責任範囲で扱いたくないコンテンツ",
              ],
            },
          ]}
          caption="判断の基準は当サイトの整理です。Googleがどちらかを推奨していることを示すものではありません。"
        />
        <GuideTable
          head={["置きたいもの", "推奨", "理由"]}
          rows={[
            ["オウンドメディア・ブログ", "サブディレクトリ", "本体と読者が重なり、内部リンクで相互に送客できるため"],
            ["ヘルプ・ドキュメント", "サブディレクトリ", "製品ページからの導線が自然につながり、設定も1組で済むため"],
            ["別基盤のサービス（アプリ・管理画面）", "サブドメイン", "同じホストに同居させられず、検索に出す必要も無いことが多いため"],
            ["言語・地域ごとの別サイト", "どちらでも可（統一する）", "分けること自体より、選んだ方式をサイト全体で揃えることのほうが効くため"],
            ["ユーザー投稿・外部提供のコンテンツ", "サブドメイン、または責任範囲を明示", "本体の評価と切り離して扱うため。詳細は後述のスパムポリシー"],
          ]}
        />
        <p>
          どちらを選んでも、<strong>後から変えるとURLの変更を伴う移転になります</strong>。
          移転には旧URLと新URLの対応表と301リダイレクトが必要で、対応漏れがそのまま流入の損失になります。
          手順は<Link href={lessonPath("updates-risk")}>レッスン11</Link>で扱いますが、最も安全なのは最初に決めて動かさないことです。
          <GuideRef {...REF.siteMove} />
        </p>
      </GuideSection>

      <GuideSection
        id="host"
        title="ホスト名を1つに決める"
        lead="www有無、httpとhttps、末尾スラッシュの有無は、それぞれ別のURLです。何もしなければ、同じ内容が複数のURLで見える状態になります。使うホスト名を1つ決め、他はそこへ寄せます。"
      >
        <GuideTable
          head={["分かれ方", "起きること", "対処"]}
          rows={[
            [
              "http と https",
              "同じページが2つのURLで見える",
              "httpからhttpsへ301リダイレクトし、サイト内のリンクもhttpsで書く",
            ],
            [
              "www あり と www なし",
              "同じページが2つのホストで見える",
              "使うほうを決め、もう一方から301リダイレクトする",
            ],
            [
              "末尾スラッシュのあり・なし",
              "同じページが2つのURLで見える",
              "どちらかに統一し、もう一方は301で寄せる",
            ],
            [
              "ホスティング事業者の初期ドメイン",
              "独自ドメインと初期ドメインの両方で同じ内容が見える",
              "初期ドメインから独自ドメインへリダイレクトするか、canonicalを独自ドメインに固定する",
            ],
          ]}
          caption={
            <>
              重複したURLは、リダイレクトとcanonicalで代表URLを1つに決めます。
              <GuideRef {...REF.canonical} />
            </>
          }
        />
        <p>
          実装の要点は、<strong>canonicalやOGP、サイトマップが参照するサイトURLを、コードの1か所で持つ</strong>ことです。
          ページごとにホスト名を書くと、追加したページだけ古いホスト名のまま、という状態が起きます。
          1か所にまとめておけば、ドメインを変えるときに直す場所も1つで済みます。
          <GuideRef {...REF.starter} />
        </p>
      </GuideSection>

      <GuideSection
        id="staging"
        title="検証環境を検索結果に出さない"
        lead="本番と同じ内容が、検証用の別ホストでも公開されている状態は、意図しない重複です。デプロイのたびに新しいプレビューURLが増える構成では特に起きやすくなります。"
      >
        <FigureDoDont
          title="検証環境の扱い"
          dos={[
            "Basic認証などでアクセス自体を制限する（最も確実）",
            "公開したまま止めるなら、meta robots の noindex を返す",
            "canonicalは、プレビュー環境でも本番のホスト名を指すようにする",
            "本番公開の直後に、robots.txt と meta robots を実機で確認する",
          ]}
          donts={[
            "robots.txt のDisallowだけでインデックス済みのURLを消そうとする",
            "検証環境用のnoindexを本番へそのまま持ち込む",
            "プレビューURLを、そのままSNSや資料に貼る",
            "検証環境のサイトマップを送信したままにする",
          ]}
          caption={
            <>
              robots.txt でブロックしても、そのURLがインデックスから消えるとは限りません。除外にはnoindexを使います。
              <GuideRef {...REF.robots} />
              <GuideRef {...REF.noindex} />
            </>
          }
        />
        <p>
          noindexを使う場合、そのページはクロールできる必要があります。robots.txtでブロックすると、
          noindexの指定自体が読まれません。ブロックと除外は別の手段だと理解して使い分けます
          （<Link href={lessonPath("technical")}>レッスン04</Link>）。
        </p>
      </GuideSection>

      <GuideSection
        id="policy"
        title="中古ドメインと貸しディレクトリ"
        lead={
          <>
            ドメインの扱いには、スパムポリシーで明示的に禁止されている使い方があります。順位を狙って
            「評価のあるドメイン」を借りる・買うという発想が、そのまま該当します。
            <GuideRef {...REF.spam} />
          </>
        }
      >
        <GuideTable
          head={["禁止されている行為", "どういう使い方か", "実務で起きやすい形"]}
          rows={[
            [
              "期限切れドメインの不正使用",
              "期限切れのドメインを、過去の評価を利用する目的で取得し、以前のサイトとほぼ無関係な内容を載せる",
              "中古ドメイン販売業者から「被リンクが付いている」ドメインを買い、別ジャンルのサイトを立てる",
            ],
            [
              "サイトの評判の不正使用",
              "第三者のコンテンツを、そのサイトの評価を利用する目的で、運営者の監督がほとんど無いまま掲載する",
              "自社ドメインのサブディレクトリを外部業者に貸し、そこにアフィリエイト記事を置いてもらう",
            ],
          ]}
          caption={
            <>
              項目と説明はGoogleが公開しているスパムポリシーにもとづきます。実務で起きやすい形は当サイトの整理です。
              <GuideRef {...REF.spam} />
            </>
          }
        />
        <p>
          判断の分かれ目は、置き場所がサブドメインかサブディレクトリかではなく、
          <strong>そのコンテンツを誰が作り、誰が責任を持っているか</strong>です。
          自社で企画し、自社で編集し、自社の名前で出しているなら、外部ライターが書いていても問題になりません。
          逆に、枠だけ貸して中身に関与していないなら、置き場所を変えても同じ判定の対象になります。
        </p>
        <p>
          中古ドメインについても、ドメインを買うこと自体が禁止されているわけではありません。
          事業の継続や社名変更で引き継ぐのは通常の運用です。問題になるのは、過去の評価を引き継ぐこと自体を目的に、
          無関係な内容を載せる場合です。
        </p>
      </GuideSection>

      <GuideSection
        id="example"
        title="実例：このサイトのドメイン構成"
        lead="このサイトは、単一ホストにすべてを置く構成です。ここまでの判断をどう実装しているかを、そのまま挙げます。"
      >
        <GuideTable
          head={["決めたこと", "どうしているか", "理由"]}
          rows={[
            ["ホストを分けない", "記事・教科書・ツールをすべて同じホストのサブディレクトリに置く", "別の基盤を使う必要が無く、内部リンクで相互に送客できるため"],
            ["サイトURLを1か所で持つ", "環境変数を1つ読む定数を用意し、canonical・OGP・サイトマップ・JSON-LDのすべてがそれを参照する", "ドメインを変えるときに直す場所を1つにするため"],
            ["プレビュー環境のURL", "プレビューでも本番のホスト名を返すようにし、canonicalが本番を指すようにする", "デプロイのたびに増えるプレビューURLが、本番と重複しないようにするため"],
            ["カテゴリの旧URL", "/category/seo などから /seo へ308リダイレクト", "URLを変えた分は、旧URLを残さず新URLへ寄せるため"],
            ["robots.txtとサイトマップ", "同じホストの直下に1組だけ置き、サイトマップのURLをrobots.txtに書く", "ホストが1つなので、管理する組も1つで済むため"],
          ]}
        />
        <p>
          この構成の利点は、確認する場所が少ないことです。robots.txtは1つ、サイトマップは1つ、
          Search Consoleのプロパティも1つで、どこかだけ設定が古いという状態が起きません。
          サブドメインを増やすなら、この一式をサブドメインの数だけ用意して維持できるかを先に考えます。
        </p>
        <p>
          次のレッスンでは、ここまでで整えたサイトを、生成AIに引用される状態にするための設定を扱います。
          AIクローラーの許可・拒否もrobots.txtで書くため、<strong>ホストを分けた分だけ、その設定も増えます</strong>。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
