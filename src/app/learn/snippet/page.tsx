import type { Metadata } from "next";
import Link from "next/link";
import { FigureCompare, FigureDoDont, FigureFlow, FigurePipeline } from "@/components/figures";
import { GuideRef, GuideSection, GuideTable } from "@/components/guide";
import { LessonShell } from "@/components/lesson";
import { requireLesson, lessonMetadata, lessonNo, lessonPath } from "@/lib/curriculum";

const lesson = requireLesson("snippet");

const REF = {
  snippet: { href: "https://developers.google.com/search/docs/appearance/snippet?hl=ja", label: "スニペットを管理する" },
  featured: { href: "https://developers.google.com/search/docs/appearance/featured-snippets?hl=ja", label: "強調スニペットとウェブサイト" },
  robotsMeta: { href: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=ja", label: "robots meta タグ、data-nosnippet、X-Robots-Tag の設定" },
  aiFeatures: { href: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja", label: "AI 機能とウェブサイト" },
  aiGuide: { href: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?hl=ja", label: "Google 検索の生成 AI 機能向けにウェブサイトを最適化する" },
  titleLink: { href: "https://developers.google.com/search/docs/appearance/title-link?hl=ja", label: "Google 検索結果のタイトルリンクを管理する" },
  perf: { href: "https://support.google.com/webmasters/answer/7576553?hl=ja", label: "検索パフォーマンス レポート" },
  geoPaper: { href: "https://arxiv.org/abs/2311.09735", label: "GEO: Generative Engine Optimization（arXiv:2311.09735）" },
} as const;

export const metadata: Metadata = lessonMetadata(lesson);

const TOC = [
  { id: "role", label: "スニペットが決めていること" },
  { id: "source", label: "スニペットは何から作られるか" },
  { id: "description", label: "meta descriptionは大事か" },
  { id: "controls", label: "制御できること・できないこと" },
  { id: "ai", label: "スニペットの設定がAI回答の可否を決める" },
  { id: "optimize", label: "抜き出される形に整える" },
  { id: "measure", label: "クリック率で切り分ける" },
];

export default function Lesson07() {
  return (
    <LessonShell lesson={lesson} toc={TOC}>
      <GuideSection
        id="role"
        title="スニペットが決めていること"
        lead="スニペットとは、検索結果でタイトルリンクの下に出る数行の説明文です。読者がクリックするかどうかは、順位そのものよりこの数行で決まります。そして「本文の一部を抜き出して見せる」という同じ仕組みが、強調スニペットにも、AIによる概要やAIモードの回答にも使われています。だからスニペットの扱いは、SEOとGEOの両方に同時に効きます。"
      >
        <FigureCompare
          title="3つの抜き出され方"
          cols={[
            {
              label: "通常のスニペット",
              tone: "seo",
              sub: "検索結果の説明文",
              points: [
                "タイトルリンクの下に出る数行",
                "主にページの本文から自動的に作られる",
                "出す・出さない、最大文字数はサイト側で指定できる",
                "どの文が選ばれるかは指定できない",
              ],
            },
            {
              label: "強調スニペット",
              tone: "accent",
              sub: "検索結果の上部",
              points: [
                "質問に直答する部分が、大きく引用される",
                "表示をリクエストする設定やマークアップは無い",
                "確実に止めるには nosnippet",
                "max-snippet を短くしても止まる保証は無い",
              ],
            },
            {
              label: "AIによる概要・AIモード",
              tone: "geo",
              sub: "AIの回答と参照リンク",
              points: [
                "回答の材料として本文が使われ、リンクが添えられる",
                "スニペット付きで表示できることが掲載の前提",
                "nosnippet を入れると入力として使われなくなる",
                "出すための特別な設定やマークアップは無い",
              ],
            },
          ]}
          caption={
            <>
              各項目はGoogleのドキュメントにもとづきます。3つを並べる整理は当サイトのものです。
              <GuideRef {...REF.snippet} />
              <GuideRef {...REF.featured} />
              <GuideRef {...REF.aiFeatures} />
            </>
          }
        />
        <p>
          3つに共通するのは、サイト側が決められるのが<strong>「出すか出さないか」と「どこまで見せるか」まで</strong>で、
          どの文が選ばれるかはGoogle側が決める、という点です。
          つまりスニペット対策は文言を指定する作業ではなく、
          <strong>どこを抜き出されても意味が通る文を、本文にあらかじめ用意しておく作業</strong>になります。
        </p>
        <p>
          前の<Link href={lessonPath("writing")}>レッスン{lessonNo("writing")}</Link>で扱った「見出し → 直答 → 根拠 → 詳細」という段落の型は、
          この抜き出しに耐える形を作るためのものでした。このレッスンでは、その本文が実際に検索結果とAIの回答でどう扱われるか、
          そこにサイト側からどこまで介入できるかを見ます。
        </p>
      </GuideSection>

      <GuideSection
        id="source"
        title="スニペットは何から作られるか"
        lead="Googleは、スニペットは主にページのコンテンツから自動的に作られると説明しています。meta description は、そのほうがページをよく表しているとGoogleが判断したときに使われます。検索結果に出る要素ごとに、生成元とサイト側でできることを分けて押さえます。"
      >
        <GuideTable
          head={["検索結果に出る要素", "主な生成元", "サイト側でできること"]}
          rows={[
            [
              "タイトルリンク",
              <>
                <code>title</code>要素のほか、ページ上の主要な見出しや目立つテキストなど複数のソース
              </>,
              "そのページ固有で、内容を正確に表す簡潔なtitle要素を書く。h1と主要な見出しを整える",
            ],
            [
              "スニペット（説明文）",
              <>
                主にページの本文。<code>meta description</code>がページをよく表している場合はそれ
              </>,
              "見出し直下に、その見出しの問いへ直答する文を置く。meta descriptionをページごとに書く",
            ],
            [
              "画像のプレビュー",
              "ページ内の画像",
              <>
                <code>max-image-preview</code>で大きさの上限を指定する
              </>,
            ],
          ]}
          caption={
            <>
              生成元と指定の内容はGoogleのドキュメントにもとづきます。
              <GuideRef {...REF.titleLink} />
              <GuideRef {...REF.snippet} />
              <GuideRef {...REF.robotsMeta} />
            </>
          }
        />
        <p>
          タイトルリンクも、書いたtitle要素がそのまま出るとは限りません。Googleは複数のソースから自動的に決めると説明しており、
          サイト側にできるのは「こう出したい」という材料を整えることまでです。
          Googleが挙げているのは、<strong>ページごとに固有であること、内容を正確に表していること、簡潔であること</strong>で、
          サイト名の繰り返しや全ページ共通の定型文は、その逆に当たります。
          <GuideRef {...REF.titleLink} />
        </p>
      </GuideSection>

      <GuideSection
        id="description"
        title="meta descriptionは大事か"
        lead="大事です。ただし「書けばそのまま出る」ものではありません。検索結果の説明文に対して、サイト側から文言を提案できる場所はここだけである一方、Googleは本文のほうがそのクエリをよく説明していると判断すれば本文から作ります。この両方を前提に扱います。"
      >
        <FigureCompare
          title="meta descriptionの位置づけ"
          cols={[
            {
              label: "書く価値があるところ",
              tone: "seo",
              sub: "こちらから提案できる唯一の枠",
              points: [
                "検索結果に出したい要約が決まっているページで、その文言を提案できる",
                "本文が短い・箇条書き中心のページ（一覧、トップ、ツール）は、本文からだと要約を作りにくい",
                "本文の書き出しが定型の注意書きから始まるページで、代わりの説明を用意できる",
                "1ページ1文の作業で済み、公開後にも直せる",
              ],
            },
            {
              label: "期待しすぎてはいけないところ",
              tone: "news",
              sub: "採用するかはGoogleが決める",
              points: [
                "書いてもそのまま使われるとは限らない",
                "検索クエリによって、本文の別の箇所が選ばれることがある",
                "全ページで同じ文言を使い回すと、そのページの説明として採用されにくい",
                "順位そのものを動かす指定ではない",
              ],
            },
          ]}
          caption={
            <>
              スニペットの生成元についてはGoogleのドキュメントにもとづきます。使い分けの整理は当サイトのものです。
              <GuideRef {...REF.snippet} />
            </>
          }
        />
        <GuideTable
          head={["書き方", "満たしている状態", "よくある崩れ方"]}
          rows={[
            ["ページごとに固有", "そのページを開かないと書けない内容になっている", "サイト説明文を全ページに同じ文言で入れている"],
            ["そのページの答えを含む", "何が書いてあるページかが1文で分かる", "「〜について解説します」だけで、答えが入っていない"],
            ["クエリの言葉が入っている", "実際に検索されている言い方が含まれている", "社内用語や商品名の正式表記だけで書かれている"],
            ["長さ", "切れても意味が通る前半に要点が来ている", "前半が前置きで、要点が後半にある"],
            ["本文と一致している", "書いた要約どおりの内容がページにある", "説明文と本文の内容がずれている"],
          ]}
          caption="表の整理は当サイトのものです。Googleは推奨文字数を公表していないため、字数ではなく「前半に要点を置く」形で書いています。"
        />
        <p>
          優先順位としては、<strong>本文の整備が先、meta descriptionは後</strong>です。
          本文が抜き出せる形になっていれば、descriptionが使われなくても妥当な説明文が出ます。
          逆に本文が整っていない状態でdescriptionだけ書いても、クエリによっては本文側から作られるため、意図した説明文にはなりません。
          そのうえで、表示回数が多い主要ページから順にdescriptionを書いていくのが、手数に対して効く順番です。
        </p>
      </GuideSection>

      <GuideSection
        id="controls"
        title="制御できること・できないこと"
        lead="制御はrobots metaタグ（またはHTTPレスポンスヘッダーのX-Robots-Tag）と、HTMLのdata-nosnippet属性で行います。指定できるのは範囲であって、文言ではありません。"
      >
        <GuideTable
          head={["指定", "書き方", "効く範囲"]}
          rows={[
            [
              <code key="a">nosnippet</code>,
              <code key="b">{'<meta name="robots" content="nosnippet">'}</code>,
              "そのページのスニペットを一切表示しない。Googleは、ウェブ検索・画像検索・Discover・AIによる概要・AIモードのすべてに適用され、AIによる概要とAIモードの直接の入力としても使われなくなると説明している",
            ],
            [
              <code key="a">data-nosnippet</code>,
              <code key="b">{'<span data-nosnippet>…</span>'}</code>,
              <>
                その要素の中のテキストだけをスニペットに使わせない。<code>span</code>・<code>div</code>・<code>section</code>要素で使える。ページの他の部分は通常どおり
              </>,
            ],
            [
              <code key="a">max-snippet:[数値]</code>,
              <code key="b">{'<meta name="robots" content="max-snippet:120">'}</code>,
              "スニペットの最大文字数。0はスニペットなし、-1は上限なし",
            ],
            [
              <code key="a">max-image-preview:[設定]</code>,
              <code key="b">{'<meta name="robots" content="max-image-preview:large">'}</code>,
              <>
                画像プレビューの大きさの上限。<code>none</code>・<code>standard</code>・<code>large</code>から選ぶ
              </>,
            ],
            [
              <code key="a">X-Robots-Tag</code>,
              <code key="b">{'X-Robots-Tag: nosnippet'}</code>,
              "HTTPレスポンスヘッダーでの指定。HTMLを編集できないファイル（PDFなど）にも同じ指定ができる",
            ],
          ]}
          caption={
            <>
              指定の内容と適用範囲はGoogleのドキュメントにもとづきます。
              <GuideRef {...REF.robotsMeta} />
              <GuideRef {...REF.aiFeatures} />
            </>
          }
        />
        <p>
          複数の指定が競合したときは、<strong>より制限の強いほうが適用されます</strong>。
          たとえば同じページに <code>max-snippet:50</code> と <code>nosnippet</code> の両方があれば、
          <code>nosnippet</code> が適用されてスニペットは出ません。
          <GuideRef {...REF.robotsMeta} />
        </p>
        <p>
          一方、<strong>「この文をスニペットに使ってほしい」という指定はどこにもありません</strong>。
          強調スニペットについてもGoogleは、表示をリクエストする方法は無く、自社のシステムが
          そのページを強調スニペットに適していると判断したときに選ばれると説明しています。
          止めたい場合は <code>nosnippet</code> が確実で、<code>max-snippet</code> を短くする方法は
          強調スニペットに出る可能性を下げるだけで、止まることは保証されていません。
          <GuideRef {...REF.featured} />
        </p>
        <FigureDoDont
          title="スニペットの設定でよく起きること"
          dos={[
            "本番のHTMLとHTTPレスポンスヘッダーの両方でrobotsの指定を確認する（ヘッダー側は画面を見ても分からない）",
            "data-nosnippetは、抜き出されると誤解を招く部分（価格の注記、キャンペーンの但し書きなど）に限って使う",
            "画像を大きく見せたいページでは max-image-preview:large を明示する",
            "変更したら、実際の検索結果とURL検査ツールで反映を確認する",
          ]}
          donts={[
            "サイト全体に nosnippet を入れる（AIによる概要・AIモードの対象からも外れる）",
            "「AIに使われたくない」という理由だけで max-snippet を極端に短くする（通常の検索結果の説明文も短くなる）",
            "CMSやテーマの既定値を確認しないまま公開する",
            "noindexとスニペットの制御を混同する（noindexは検索結果に出さない指定）",
          ]}
          caption={
            <>
              指定の効果はGoogleのドキュメントにもとづきます。事故の形の整理は当サイトのものです。
              noindexとの使い分けは<Link href={lessonPath("technical")}>レッスン{lessonNo("technical")}</Link>で扱っています。
              <GuideRef {...REF.robotsMeta} />
            </>
          }
        />
      </GuideSection>

      <GuideSection
        id="ai"
        title="スニペットの設定がAI回答の可否を決める"
        lead="GEOの観点では、スニペットの設定は「AIの回答に載るかどうか」の入口です。Googleは、AIによる概要やAIモードにリンクとして表示される対象になるには、インデックスされていて、スニペット付きで検索結果に表示できる状態である必要があり、それ以外に追加の技術要件は無いと説明しています。"
      >
        <FigurePipeline
          title="AIの回答に自分のページが出るまでの前提"
          stages={[
            { label: "クロールできる", desc: "robots.txtでGooglebotを止めていない", fail: "そもそもインデックスに入らない" },
            { label: "インデックスされる", desc: "noindexが入っていない", fail: "検索結果にもAI機能にも出ない" },
            { label: "スニペットを出せる", desc: "nosnippetが入っておらず、max-snippetで潰していない", fail: "AIによる概要・AIモードの入力として使われない" },
            { label: "抜き出せる形になっている", desc: "見出しの問いに直答する文が本文にある", fail: "引用の候補になりにくい" },
          ]}
          caption={
            <>
              3段目までの条件はGoogleのドキュメントにもとづきます。4段目は当サイトの整理です。
              <GuideRef {...REF.aiFeatures} />
              <GuideRef {...REF.robotsMeta} />
            </>
          }
        />
        <p>
          ここで重要なのは、<strong>AI機能だけを対象にした「出す・出さない」の指定がGoogleには用意されていない</strong>ことです。
          <code>nosnippet</code> はAIによる概要とAIモードの入力を止めますが、同時に通常の検索結果の説明文も消します。
          AI検索への露出を減らしたいという理由でこれを入れると、検索からの流入も一緒に減ります。
          Google以外のAIサービスについては、robots.txtでクローラーごとに書き分ける別の作業になります
          （<Link href={lessonPath("geo-implementation")}>レッスン{lessonNo("geo-implementation")}</Link>）。
        </p>
        <p>
          逆に「AIに出るための追加の作業」も、Googleは求めていません。生成AI機能向けの最適化ガイドは、
          生成AI検索向けの最適化は検索体験に対する最適化であり、結局はSEOだとしたうえで、
          AI向けに新しいファイルやマークアップを用意する必要は無いと明記しています。
          このレッスンでやることが、そのままAI側への対応になります。
          <GuideRef {...REF.aiGuide} />
        </p>
      </GuideSection>

      <GuideSection
        id="optimize"
        title="抜き出される形に整える"
        lead={`文言そのものは指定できないので、どこを抜き出されても意味が通る状態にしておくのが対策になります。作業はレッスン${lessonNo("writing")}の書き方と重なりますが、ここでは「抜き出される単位」で1ページを点検します。`}
      >
        <FigureFlow
          title="1ページを、抜き出される形に整える手順"
          steps={[
            { label: "見出しを、読者が検索する質問の形にする", desc: "抜き出しは、見出しとその下の本文の対応で判断される。「機能一覧」ではなく「何ができるのか」。" },
            { label: "見出し直下に、単独で意味が通る1〜2文の答えを置く", desc: "指示語を使わず主語を書く。前の段落を読んでいる前提にしない。" },
            { label: "条件・数値・手順を表か箇条書きにする", desc: "比較や手順は、そのまま抜き出せる形にしておく。文章の中に埋めない。" },
            { label: "本文の冒頭に定型文を置かない", desc: "全ページ共通の注意書きやナビゲーションが先頭にあると、要点より先にそこを拾われることがある。必要ならdata-nosnippetで外す。" },
            { label: "主要ページからmeta descriptionを書く", desc: "表示回数の多いページから順に。使われないこともあるので、本文の整備を先に済ませる。" },
          ]}
          caption={
            <>
              手順の整理は当サイトのものです。data-nosnippetとmeta descriptionの扱いはGoogleのドキュメントにもとづきます。
              <GuideRef {...REF.snippet} />
              <GuideRef {...REF.robotsMeta} />
            </>
          }
        />
        <p>
          生成AIの回答での見え方については、GEOという用語の初出であるarXiv論文（KDD 2024採録）が、
          10,000件のクエリからなるベンチマークで9通りの書き換えを比較しています。この論文では、
          引用の追加で可視性が最大41%、統計の追加で約32%、出典の明示で約28%向上した一方、
          キーワードの詰め込みはほとんど効果がなかったと報告されています。
          いずれも<strong>抜き出したときに根拠ごと持っていける形</strong>にする書き換えで、ここまでの手順と方向は同じです。
          ただしこれは研究環境での測定であり、各社のサービスが同じ挙動をすることを保証するものではありません。
          <GuideRef {...REF.geoPaper} />
        </p>
        <FigureDoDont
          title="スニペット対策としてやること／やらなくていいこと"
          dos={[
            "見出しごとに答えを完結させる（読者にとって読みやすいから）",
            "抜き出されると誤解を招く部分だけをdata-nosnippetで外す",
            "条件と数値を表・箇条書きで出す",
            "出典リンクを、その記述の直後に置く",
          ]}
          donts={[
            "AI向けにページを細切れに分割する（Googleが不要と明記）",
            "強調スニペットに出すための専用マークアップを探す（存在しない）",
            "AI専用のファイルやMarkdownを別途用意する（Google検索は使わないと明記）",
            "キーワードを詰め込んで説明文に出させようとする（GEO論文でも効果はほとんど無いと報告）",
          ]}
          caption={
            <>
              「やらなくていいこと」の根拠はGoogleのドキュメントとGEO論文です。
              <GuideRef {...REF.aiGuide} />
              <GuideRef {...REF.featured} />
              <GuideRef {...REF.geoPaper} />
            </>
          }
        />
      </GuideSection>

      <GuideSection
        id="measure"
        title="クリック率で切り分ける"
        lead="スニペットとタイトルリンクの見え方が問題なのかどうかは、クリック率で切り分けられます。Search Consoleの検索パフォーマンスレポートには、クエリとページごとに表示回数・クリック数・クリック率・平均掲載順位が出ます。"
      >
        <GuideTable
          head={["数値の出方", "考えられること", "次にやること"]}
          rows={[
            [
              "表示回数が少ない",
              "そもそも上位に出ていない、またはインデックスされていない",
              <>
                <Link href={lessonPath("technical")}>レッスン{lessonNo("technical")}</Link>と
                <Link href={lessonPath("search-intent")}>レッスン{lessonNo("search-intent")}</Link>に戻る
              </>,
            ],
            [
              "表示回数はあるがクリック率が低い",
              "タイトルリンクと説明文が、そのクエリに答えていると読めない",
              "実際に来ているクエリの言葉に、title要素と見出し直下の直答を寄せる",
            ],
            [
              "特定のページだけ説明文が出ない",
              <>
                <code>nosnippet</code>や<code>max-snippet:0</code>が入っている可能性
              </>,
              "HTMLとHTTPレスポンスヘッダーを確認し、URL検査ツールで取得結果を見る",
            ],
            [
              "意図しないテキストが説明文に出る",
              "本文の先頭にある定型文が拾われている",
              <>
                本文の順番を直す。残す必要がある部分は<code>data-nosnippet</code>で外す
              </>,
            ],
          ]}
          caption={
            <>
              レポートの指標はSearch Consoleヘルプにもとづきます。原因と対処の対応づけは当サイトの整理です。
              <GuideRef {...REF.perf} />
            </>
          }
        />
        <p>
          クリック率は掲載順位やクエリの性質でも変わるため、単独の値ではなく<strong>同じページの推移</strong>で見ます。
          説明文を直したら、その前後4週間で比較します。数値の見方そのものは
          <Link href={lessonPath("measurement")}>レッスン{lessonNo("measurement")}</Link>で扱います。
        </p>
        <p>
          次のレッスンでは、こうして1ページずつ整えたものを、サイト全体の構造として束ねます。
          個々のページが抜き出される形になっていても、テーマとしてまとまっていないと評価は積み上がりません。
          <Link href={lessonPath("structure")}>レッスン{lessonNo("structure")}</Link>へ進んでください。
        </p>
      </GuideSection>
    </LessonShell>
  );
}
