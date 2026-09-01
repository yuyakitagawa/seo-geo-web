# 進捗: 教科書レッスン13「ブランドをAIに覚えさせる」

AI検索は回答を組み立てる前に候補のブランドを決めている、という構造を扱う章を `/learn` に足す。
既存10レッスンが「取得されたあとに読まれるための作業」だったのに対し、
このレッスンは「そもそも候補に入るための作業」を担当する。

出典は、すでに記事 `content/articles/0009-chatgpt-brand-first-candidate-33x.mdx` で裏取り済みの
外部分析（Suganthan Mohanadasan / PPC Land）と、`src/lib/cases.ts` の GEO 論文（arXiv:2311.09735）のみ。
出典に無い数値・固有名詞は書かない（CLAUDE.md の方針）。景表法などの法令解釈には踏み込まない。

## 設計
- slug は `brand-entity`、order 11、レベル3（運用）。既存レッスンの採番は変えない
- 章の構成は「候補入りの構造 → 同一性 → 外部言及 → 引用材料 → 定点観測」の5節
- 教科書の締めくくりが `updates-risk` から `brand-entity` に移るので、両方の結びを書き換える

## ステップ
- [x] `src/lib/curriculum.ts`: 出典2件を `S` に追加、レッスン13を追記、COURSE のコピーを13レッスンに更新
- [x] `src/app/learn/brand-entity/page.tsx`: 本文5節
- [x] `src/components/lesson.tsx`: ハードコードしていた「10レッスン」を `LESSONS.length` に変更
- [x] `/learn`（読む順番の目安に1行追加）・`/seo`・`/geo`・`learn/structure` の「10レッスン」表記
- [x] `learn/updates-risk`: 締めの段落をレッスン13への引き渡しに変更
- [x] README 更新
- [x] `npm run typecheck && npm run build`

## 追記（2026-09-01）: 根拠の再監査

各節の主張を海外の調査と突き合わせ、根拠の強さに合わせて本文を書き直した。

### 分かったこと
- **外部言及（mentions節）が一番強い**。Ahrefs 75,000ブランドの相関（ブランド言及 0.664 > 指名アンカー 0.527 > 指名検索数 0.392 > 被リンク 0.218）と、Seer Interactive の80万件AI回答調査（レビュープロフィール運用群は共起9.5倍。Trustpilot委託）。どちらも相関であって因果ではない。
- **表記統一・構造化データ（entity節）には反証がある**。Ahrefs の準実験（JSON-LDを追加した1,885ページ vs 対照約4,000ページ、追加前後30日）で AI Overviews −4.6% / AI Mode +2.4% / ChatGPT +2.2%、いずれも有意な増加なし。「効果」として売らず「土台」として書く。
- **定点観測は月1回では足りない**。ザンクトガレン大の "Don't Measure Once"（arXiv:2604.07585）で、同一プロンプト再実行時の引用元の重なりは32〜43%、ブランド名は日をまたぐと45〜59%。揺れはモデルの確率的生成そのものに由来。→ 複数回×2〜4週間の窓で割合として記録する形に変更。
- **33倍（記事0009）は単一アカウント1件**。教科書側にも「方向性を示す数値」の但し書きを追加。
- **賞・バッジの効果を測ったデータは無い**。「有料か否か」ではなく「第三者が独立して書いたか」を基準に書き換え、当サイトの解釈だと明示。
- **3段階の順序（認知→説明→指名なし想起）も検証データ無し**。当サイトの整理だと明示。

### 変更
- [x] `src/lib/curriculum.ts`: 出典4件（ahrefsMentions / ahrefsSchema / measureOnce / seerReviews）を `S` に追加、レッスン13の sources・objectives・checklist・FAQ（賞／期間）を修正、updated を 2026-09-01 に
- [x] `src/app/learn/brand-entity/page.tsx`: recall（但し書き）・pipeline caption（根拠の強さ）・entity（表の列を「何が起きるか」に変更＋Ahrefsの準実験を追記）・mentions（Ahrefs/Seerを追記）・賞の段落・data（GEO論文の数値を「最大約40%」に統一）・measure（複数回計測へ全面改稿）
- [x] `npm run typecheck && npm run build`

### 残り（要・一次情報の確認）
このセッションのプロキシが arxiv.org / ahrefs.com / seerinteractive.com をブロックしており、原典を直接開けなかった。
上記の数値は複数の独立した二次情報（Search Engine Journal・Search Engine Roundtable ほか）で相互確認したもの。
- [ ] 原典5件を開いて数値・日付・調査規模を目視確認する（Ahrefs 2件、Seer 1件、arXiv:2604.07585、arXiv:2311.09735）
- [ ] GEO論文の手法別の内訳（統計/引用/出典それぞれの%）を原典で確認し、必要なら data節を数値入りに戻す

## 追記（2026-09-01・2）: Ahrefs 75,000ブランド調査を表にした

mentions節で文章にしていた相関係数を `GuideTable` に切り出した（指標／相関係数／何を数えているか の3列）。
本文は「上位3つはすべて自社サイトの外側の指標、被リンクは明確に弱い」という読み方だけを残し、
「相関であって因果ではない」の但し書きは表のキャプションに移した。
- [x] `src/app/learn/brand-entity/page.tsx`: mentions節にGuideTableを追加
- [x] `npm run typecheck && npm run build`

## 追記（2026-09-01）: 解説記事の追加

再監査で使った調査4件を、記事側にも独立した1本として出した。
教科書は「何をやるか」、記事は「その根拠がどれだけ強いか」を担当する。

- [x] `content/articles/0033-ai-brand-recall-evidence.mdx`（id 33・type howto・category geo）
      裏付けの強さで4つの施策を並べ直す構成。数値はAhrefs 2件・Seer・arXiv 2件・Google公式のみ
- [x] `content/howto-topics.csv` に「公開」行（articleId 33）
- [x] `learn/brand-entity` の mentions節から記事33へのリンク
- [x] `npm run typecheck && npm run build`

出典の一次情報は、このセッションでもプロキシが ahrefs.com / arxiv.org / seerinteractive.com を
ブロックしており直接開けていない。数値は WebSearch 経由で Search Engine Journal・Stan Ventures・
PR配信（Trustpilot/Seer）・論文PDFの検索結果スニペットなど複数の独立した情報源と一致することを確認した。
記事に書いたのはその範囲の数値だけで、教科書側にある Seer の共起9.5倍・ブランド名の重なり45〜59%は、
今回確認できなかったため記事には入れていない。
