# 進捗: 全記事のファクトチェック（AdSense申請前）

目的: `docs/progress_adsense.md` の「残るリスク」＝**全文AI生成・人のレビュー無しで公開している記事に、
一次情報に無い数値・固有名詞が混じっていないか**を1本ずつ潰す。落とすのは事実の誤りと重複記事。

## やり方
1. `content/articles/*.mdx` の frontmatter `sources` のURLを実際に取得し、本文の
   **数値・割合・日付・社名/人名/製品名・「〜と述べた」の帰属**が出典側にあるか照合する。
2. 出典に無い記述は、削るか、出典にある表現へ直す（推測で補わない）。
3. 続報で置き換わっている記事には `supersedes` を付ける（`npm run dupes` の報告2組）。
4. 直したら `npm run typecheck && npm run build`。

## 判定の記号
- OK: 出典で裏が取れた / FIX: 直した / DROP: 記述を削除 / ?: 出典が取得できず保留

## 記事チェックリスト
- [x] 0001-seo-geo-aio-difference — SEO・GEO・AIO・LLMOの違い。土台はSEOのまま、回答を作るLLMという評価者が増えただけ
      FIX 引用ブロックが逐語でなかった（「追加の要件も特別な最適化も不要」は2文の合成）。出典タイトルも実際のページ名「AI 機能とウェブサイト」に修正。llms.txt の提案者名は出典に無いため記述から削除。論文の投稿日・著者6名・KDD 2024・最大40%はOK
- [x] 0002-ai-visibility-tools-2026 — Semrush・AhrefsがAI可視性ツールを出した理由と、契約前に知っておくべき計測の限界
      FIX Semrush「2025年9月のAI Visibility Index」「2026年6月に1億2,600万件」は出典に無いため削除し、出典にあるAhrefsの数値に差し替え。引用ブロックを逐語に修正。$99/月・25プロンプト・1億9,000万件・Brand Radar公開日はOK
- [x] 0003-google-august-2026-spam-update — Google 2026年8月スパムアップデート完了、量産アフィリエイトサイトへの牽制が続く
      OK Muellerの「事前に展開することはない」は "We don't roll them out beforehand." の訳として妥当
- [x] 0004-google-personalization-search-discover-news — Google、検索・Discover・Googleニュースのパーソナライズを拡大。Discover依存メディアが見るべき指標
      FIX 「音声ブリーフィングの対象はニュースAIパイロット参加媒体」は誤読（パイロットは深掘りの理由）。60万/34万5000・16か月・幅1,200px・「特別なタグや構造化データは必要ありません」はOK
- [x] 0005-ai-mode-long-queries-lead-with-answer — Google AI Modeの質問は通常検索の3倍長い。店舗ページは冒頭3行で答えを書く
      OK 月間10億人超・四半期ごとに2倍以上・3倍の長さを公式ブログで確認。金額は架空の例
- [x] 0006-google-generative-ui-ai-overviews-tool-pages — GoogleがGenerative UIをAI Overviewに拡大、計算機・シミュレータ型ページの役割が検索結果内へ移る
      OK 「専門家のサイトが最上位、生成UIが僅差で続く」はGoogle Researchの記述どおり
- [x] 0007-reddit-chatgpt-citation-drop-lesson — RedditのChatGPT引用シェアが86%減、UGC頼みのGEO戦略が抱える引用元リスク
      FIX Lily Ray氏の引用が原文と別物だったため原文（英語）に差し替え、出典もX投稿＋SEJ引用と明記
- [x] 0008-chatgpt-site-search-official-sources — ChatGPTのsite:検索が0.3%から23%に急増、料金・仕様は公式サイトから取りに行く仕様に
      OK 12→24件・0.3%→23%・2.17→7.61回・64%をLily Ray氏の記事で確認
- [x] 0009-chatgpt-brand-first-candidate-33x — ChatGPTは検索前にブランドを決めている。最初のクエリに入る銘柄は回答登場率が約33倍
      OK 68.9%/2.1%・119件/515件・57会話3,554ページ・27会話・約33倍を原文で確認。「単一アカウント・数値は方向性」の注記も原文どおり
- [x] 0010-google-search-button-ai-mode-test — Googleがトップページの「Google検索」ボタンをAI Modeボタンに置き換えるテストを開始
      OK Robby Stein氏の引用は "This is a small test on desktop to help people find new things they can do with Search." の訳として妥当
- [x] 0011-search-console-ai-mode-traffic — Search ConsoleでAI Mode流入を追う方法。生成AIレポートは表示回数のみ、クリックはウェブ検索に合算
      FIX 引用「検索の機能そのもの」→原文「検索が機能するうえで欠かせないものです」
- [x] 0012-zero-click-era-do-you-still-need-a-website — AI Overviewsでクリック42%減でも自社サイトは残る。役割は流入装置から一次情報の置き場へ
      OK/? 42%・17億クリック・16%・64サイト・100万投稿超は出典で確認。フィッシュキン氏の4つの根拠はWeb担当者Forum（403で取得不可）に依存し未検証
- [x] 0013-search-console-platform-properties — Search Consoleプラットフォームプロパティ全世界展開、SNS投稿の検索流入が見える
      FIX 引用「自社サイトを持たない人でも」→原文「サイト所有者やクリエイター（独自のウェブサイトを持っていない場合も含む）」。/p/・/reels/・/watch・/shorts/ の比較例はガイドに記載あり
- [x] 0014-ai-mode-real-world-local-business — Google AI Modeが外出・店探しの5つの使い方を公開。店舗はビジネスプロフィールの空欄を埋める
      OK 数値は日本の店舗を想定した架空の例のみ
- [x] 0015-google-search-connected-apps-personal-context — Google AI Mode、接続アプリを拡大。Gmail・カレンダーの個人情報で回答が人ごとに変わる
      OK 数値は架空の例のみ
- [x] 0016-visual-search-25-years-image-geo — Google画像検索25周年。LensとAI Modeで「写真で聞く検索」が入口になり、商品画像の撮り方が順位を決める
      FIX altの引用を原文に差し替え。5億8,000万台・2001年7月・ジェニファー・ロペスの緑のドレスはOK
- [x] 0017-google-eea — Googleがサイト評判の不正利用ポリシーを更新、EEA内では手動対策の効果を適用せず
      OK 8月30日から・2024年導入・EEA外は該当部分に直接影響/EEA内は影響なし、を発表文で確認
- [x] 0018-google-ai-mode — GoogleがAI Modeにホテル予約を追加、航空券の価格追跡とポイント/マイル表示も同時提供
      OK 提携10社（Booking.com・Expedia等）と日本のOTAが含まれないことを発表文で確認
- [x] 0019-chatgpt-r-whatnotapp-8-6 — ChatGPTがサブレディットを名指しで検索、r/whatnotappが8件中6件の引用を獲得
      OK 3,650日・71件中48件・8件中6件を原文で確認
- [x] 0020-openai-google-100-ai — OpenAI・Googleら100超の組織がAIサイバー攻撃への備えを共同要請、サイト運営側の論点
      OK 100超の組織・署名企業名・「はるかに広範かつ高度に」を原文で確認
- [x] 0021-trendos-ai-1-700-reddit — Trendos調査：AI回答1億700万件の引用元は業種で分かれる、共通はReddit
      OK AI回答1億700万件は出典タイトルどおり
- [x] 0022-webmcp-shopify-cloudflare-chatgpt-ai — WebMCPがShopify・Cloudflare・ChatGPTで稼働開始、サイト内の操作をAIエージェントに開放
      OK Liquidストアフロント全店・翌日のCloudflare開発者プレビュー・8月25日のSite toolsを原文で確認
- [x] 0023-meta-ai-ai-sej — Meta広告AIが承認済みクリエイティブを改変、AI運用の責任者不在をSEJが指摘
      OK State of Email 2026（502人・30問・米英豪NZ・2025年11月19日〜12月17日）と35%/27%を原文で確認
- [x] 0024-google-preferred-sources-1-wordpress — GoogleのPreferred Sources埋め込みボタン、1タップ登録とWordPress実装の手順
      OK 専用確認ページ→Addの1アクション→元記事へ戻る、WordPressウィジェットの手順を原文で確認
- [x] 0025-ai-duane-forrester — AI検索は認知負荷を消さず移しただけ──Duane Forresterが示す抽出後も意味が残る書き方
      OK 2026年のACL研究・Microsoft Researchの20万件のBing Copilot会話を原文で確認。300名/40時間は架空の例
- [x] 0026-geo-seo-google-ai — GEOとは何か。SEOとの違いとGoogle公式が示すAI検索に載る条件
      OK Muellerの英文引用は英語版ブログと逐語一致
- [x] 0027-seo-google-seo-5 — SEOの始め方。Google公式SEOスターターガイドが示す最初の5項目
      OK スターターガイドの英文引用は原文どおり。2023年公開の記事は架空の例
- [x] 0028-search-console — キーワードカニバリゼーションの見つけ方と潰し方をSearch Console等で解説
      OK Adam Riemer氏の英文引用は原文と一致。公開日2026年8月20日も一致
- [x] 0029-2026-08-20-qijci4 — プロンプトインジェクションが示す25年前からのSEOの教訓
      FIX 英文引用の後半（Now, it tells AI models…）が原文に無い創作だったため原文に差し替え（draft記事）
- [x] 0030-chatgpt-fanout-log-analysis — ChatGPTのfan-outクエリを実ログで解析。候補36URLのうち引用は4つだけだった
      FIX 「海外報告は1プロンプトあたり8〜15本」は出典に無いため、出典にある「GPT-5.4で平均8.5本（Writesonic調査）」に修正。実測値は自分のログなので対象外
- [x] 0031-google-mueller-markdown-ai — GoogleのMuellerが検証、Markdown配信はAI検索に効かない
      OK Mueller氏のReddit投稿は英文のまま逐語一致。「30年以上」は一般論の地の文
- [x] 0032-openai-polimill-ai-qommonsai-seo — OpenAIのPolimill事例に見る自治体AI「QommonsAI」とSEO担当者の関係
      OK 出典（openai.com）は403で直接取得できないため検索経由で照合。約1,050自治体・約55万人・2024年10月公開・開発速度3〜5倍・若林氏の英文引用をすべて確認
- [x] 0033-ai-brand-recall-evidence — 「AIにブランドを覚えさせる」施策のうち、実測データがあるのはどれか
      FIX Seerの「レビューのページ」→Trustpilotのプロフィールに限定し1%→53.5%→75%の内訳を明記。GEO論文の手法別%（41/32/28）は論文に無いため「30〜40%の相対改善」に修正。「同じ瞬間」→「24時間のうちに」。600万URL・約3倍・-4.6%・32〜43%はOK
- [x] 0034-chatgpt-for-healthcare-epic-seo — ChatGPT for HealthcareがEPICのカルテと連携、日本のSEOへの影響は
      FIX 逐語確認できない英文引用ブロックを削除し、地の文に置き換え（EPIC連携が読み取り専用である点を追記）。27ユースケース・4,363件・99.1%・93%以上・9ソース・ローンチパートナー名は二次情報で確認
- [x] 0035-ai-schema — AI引用に効くschemaとは？信頼される情報源になる条件を解説
      FIX Loren Baker氏の引用が創作だったため原文「Schema is far less a ranking switch than a trust builder.」に差し替え

## 重複話題（npm run dupes の報告）
- [x] 記事5（AI Modeの質問は3倍長い）と記事14（AI Modeの外出・店探し5つの使い方）: 別の発表。supersedes は付けない
- [x] 記事10（検索ボタンのAI Modeテスト）と記事16（画像検索25周年）: 別の話題。supersedes は付けない

## 横断して分かったこと（再発防止）
FigureQuote に**要約・言い換え・複数文の合成・創作した一文**が入っている記事が5本あった
（0001 / 0002 / 0007 / 0011 / 0013 / 0016 / 0029 / 0035）。引用の体裁で出す以上これは事実の誤りに当たるため、
`scripts/prompt.ts` に「FigureQuote の text は出典の一文をそのまま写す。写せる一文が無ければ引用をやめる」
というルールと、編集長レビューのチェック項目（6-2）を追加した。

出典タイトルを実際のページ名と違う名前で書いている例もあった（「AI 機能と Google 検索の仕組み」→
正しくは「AI 機能とウェブサイト」）。source にも出典ページの実際のタイトルを使うルールを同じ場所に足した。

## 取得できなかった出典
- `https://webtan.impress.co.jp/e/2026/08/21/53131`（403 / ブラウザからも遮断）… 記事12のフィッシュキン氏の4つの根拠が未検証
- `https://openai.com/index/polimill`、`https://openai.com/index/chatgpt-connects-health-records-and-healthcare-sources`（403）
  … 記事32は検索経由で全数値を確認済み。記事34は数値を二次情報で確認し、逐語確認できない引用ブロックを外した
