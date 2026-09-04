# フローティングチャットボットの設計（2026-09-04 起草・設計のみ、未実装）

サイト右下に常駐するチャットで、SEO・GEOについて分からないことを質問できるようにする。
回答は **自サイトの記事・用語集・教科書の本文だけ** を根拠にし、出典URLを必ず添える。

## 結論（設計の骨子）
- **検索はサーバー内で完結、生成だけ Claude API**。質問→自サイトの本文から関連ブロックを検索（`src/lib/promptFit.ts` の文字bigram TF-IDF を流用。埋め込みAPIは使わない）→上位ブロックを渡して短い回答を生成→出典リンク付きで返す。
- **関連ブロックが無ければAPIを呼ばない**（類似度が閾値未満なら「該当する記事がありません」と `/contact` への案内だけ返す）。費用が発生するのは根拠があるときだけ。
- **モデルは `claude-haiku-4-5`**（渡された本文の要約・言い換えで、複雑な推論は不要。運営者方針「軽量モデルで完結」）。品質不足なら `claude-sonnet-5`（記事生成と同じ）へ定数1か所の変更で切り替える。
- **保存しない**。質問・回答はDBにもログにも残さない（お問い合わせフォームと同じ方針）。件数だけGA4イベントで数える。
- **既存の防御をそのまま通す**。`sameOrigin()`・`rateLimited()`・入力長の上限・`max_tokens` の上限・停止スイッチ。これらを外すと関数実行とAPI費用がそのまま漏れる。

## 1. 費用の見積もり（1回あたり）
入力 ≈ 5,000 tokens（system 800 ＋ 本文ブロック 6×600 ＋ 直前の履歴 500 ＋ 質問 100）、出力 ≈ 400 tokens で計算。
単価は Anthropic の一次料金（Haiku 4.5: $1/$5 per MTok、Sonnet 5: $2/$10 per MTok。2026-06-24 時点の表）。1USD=150円換算。

| モデル | 1回 | 月1,000回 |
|---|---|---|
| claude-haiku-4-5 | $0.0070（約1.05円） | $7.0 |
| claude-sonnet-5 | $0.0140（約2.10円） | $14.0 |

- プロンプトキャッシュは使わない。Haiku 4.5 のキャッシュ最小プレフィックスは 4,096 tokens で、固定部分（system 800）だけでは届かない。本文ブロックは質問ごとに変わるのでキャッシュに載らない。
- Vercel Functions の実行費は診断APIと同じ枠（Pro）。Haiku の応答は数秒なので `maxDuration: 30` で足りる。
- **上限は3か所で切る**: Anthropic Console の月額上限（ユーザー設定）／Vercel Spend Management（ユーザー設定・未設定のまま。`docs/progress_vercel-cost.md`）／サイト側の回数制限（下の3章）。

## 2. 構成
```
[ブラウザ]                       [Vercel Function]                    [Anthropic]
ChatWidget (client)  --POST-->   api/chat.ts                           
  質問 + 現在のパス + 履歴4往復      ├ sameOrigin / rateLimited / 入力検証
                                   ├ src/lib/chat.ts: retrieve()  ← src/generated/chat-index.ts（ビルド時生成）
                                   │   └ 閾値未満 → APIを呼ばず「記事なし」で返す
                                   ├ src/lib/chat.ts: buildPrompt() → messages.create（Haiku）
                                   └ { answer, sources[] }  <--
```

### 2.1 検索インデックス（ビルド時に生成）
- `scripts/chat-index.ts` を `npm run build` の `prebuild` で走らせ、`src/generated/chat-index.ts`（git-ignore）を書き出す。Vercel のビルダーは `api/chat.ts` から相対 import で届くファイルを関数に同梱するので、静的エクスポート後も関数から読める（`out/` は関数から読めない）。
- 収録するもの（公開中のページだけ。`draft: true` と `indexability.ts` で noindex のものは除外）:
  - 記事（`content/articles`）: 見出し（h2/h3）ごとのブロック。1ブロック最大 600 文字、本文の先頭 20 ブロックまで
  - 用語集（`src/lib/glossary.ts`）: 1語＝1ブロック（定義文そのまま）
  - 教科書・ガイド（`src/lib/curriculum.ts` `guides.ts`）: レッスンごとの見出しブロック
  - `/tools` の自作ツール説明（`src/lib/apps.ts`）
- 1ブロックの形: `{ url, title, heading, text, date }`。記事 64 本で約 300KB（1記事 5KB 前後の推定）、500 本でも数MB。
- 検索: `promptFit.ts` の `blocksFromText` 相当でブロック化済みなので、質問を同じ bigram でベクトル化し、コサイン類似度の上位 6 ブロックを取る。**同じ記事から最大 2 ブロック**（1記事に偏らない）。現在いる記事のブロックは類似度に +0.1 の加点（記事を読みながらの質問に効く）。
- 閾値: 最上位の近さ（`promptFit.ts` の `nearness` と同じ計算、0〜100）が目安 15 未満なら「該当なし」。実際の値は実装時に `content/prompts.csv` の想定プロンプト 20 本で当たり具合を見て決める。

### 2.2 API（`api/chat.ts`）
- ルート直下の `api/` に置く（`audit.ts` と同じ。`@/` は使わず相対 import、`api/tsconfig.json` の commonjs で変換される）。`vercel.json` の `functions` に `"api/chat.ts": { "maxDuration": 30 }` を足す。
- リクエスト: `{ question: string, path?: string, history?: {role:"user"|"assistant", text:string}[] }`
  - `question` 1〜300 文字 / `history` 最大 4 往復・1件 500 文字（超過分はサーバーで切り落とす。クライアントの申告は信用しない） / `path` は `/` 始まりの自サイトのパスだけ受ける
- 判定順（費用がかかる処理ほど後ろ）:
  1. `CHAT_ENABLED !== "true"` または `ANTHROPIC_API_KEY` 無し → 503（停止スイッチ）
  2. `sameOrigin()` 不一致 → 403
  3. `rateLimited(ip, 5)` → 429（1分5回。既存のインスタンス全体 60回/分も効く）
  4. 入力検証 → 400
  5. `retrieve()` で閾値未満 → 200 `{ answer: "該当する記事がありません…", sources: [] }`（**APIを呼ばない**）
  6. `messages.create({ model, max_tokens: 600, system, messages })` → 200
- レスポンス: `{ answer: string, sources: { url, title }[] }`。`answer` は Markdown ではなく平文＋箇条書き（クライアントで Markdown を描画しない。XSS の面と実装の軽さ）。
- 失敗時: Anthropic の 429/5xx は「混み合っています。少し待ってください」で 503。`refusal` は「この質問には答えられません」。どちらも質問文をログに出さない。
- ストリーミングは v1 ではやらない（Haiku の 400 tokens は 2〜4 秒で返る。実装が半分で済む）。遅いと感じたら v2 で `messages.stream` に替える。

### 2.3 プロンプト（`src/lib/chat.ts`）
system（固定。変えるとキャッシュには関係ないが、回答の型が変わるので README に書いた方針と同期する）:
- 役割: 「SEO GEO Lab の案内役。渡された抜粋だけを根拠に日本語で答える」
- 禁止: 抜粋に無い数値・固有名詞・日付を書かない／推測は「〜と考えられます」と明示／業務委託・サービスの勧誘をしない（運営者方針）
- 形式: 結論1文→根拠を箇条書き3つまで→「詳しくは」で出典の記事タイトル（URLはサーバーが `sources` に別途付けるので本文に書かせない）
- 分からないときは「サイト内に該当する記事がありません」と言い切る（`/contact` の案内はクライアントが固定文で出す）
- user: `<抜粋>` ブロック（url/title/heading/text を番号付きで）→ 直前の履歴 → 質問。抜粋の中身はサイトの本文なので指示注入の心配は薄いが、**質問文は必ず抜粋の後ろに置き、抜粋に無いことは書かないという指示を system 側に固定**する。

### 2.4 ウィジェット（`src/components/ChatWidget.tsx`）
- `"use client"`。`src/app/layout.tsx` の `<Footer />` の後ろに置く。`NEXT_PUBLIC_CHAT_ENABLED === "true"` のときだけ描画（未設定なら何も出ない。診断ツールのフォームと同じ「envが無ければ表示しない」の流儀）。
- **表示物は2つ**: 起動ボタンと、開いたときのパネル。
  - 起動ボタン: 右下固定 `fixed right-4 bottom-4`、56px の円、`bg-invert text-invert-fg`、`aria-label="サイトの内容について質問する"`。`z-[60]`（ヘッダーの `z-50` より上）。`prefers-reduced-motion` ではアニメーションなし。
  - パネル: デスクトップは右下に 360×min(600px, 100dvh−32px) のカード（`SURFACE.card` ＋ 影トークン）。`sm` 未満は画面全体のシート（`inset-0`）で、ヘッダーに閉じるボタン。
  - パネル内: タイトル行（「記事から答えます」＋閉じる）／メッセージ一覧（`role="log" aria-live="polite"`）／初回だけ「よく聞かれる質問」チップ3つ（記事ページなら FAQ の質問を `src/lib/faq.ts` で拾い、それ以外は固定3問）／入力欄（textarea 1〜3行、Enter 送信、Shift+Enter 改行、300文字カウンタ）／注記「回答はAIが生成します。数値・仕様は出典の記事で確認してください。入力内容は保存しません」
  - 回答バブルの下に `sources` をリストで出す（記事へのリンク。`GaClickTracker` と同じ流儀で `chat_source_click` を送る）。
- 状態: idle / sending / error（再送ボタン）/ rate-limited（「1分ほど空けてください」）/ disabled（503 を受けたら起動ボタンごと隠す）。
- 履歴はメモリだけ（ページ遷移で消える）。`localStorage` にも置かない（保存しない方針を UI の注記と一致させる）。1セッション 10 往復で入力欄を閉じ「続きは /contact へ」（費用の天井）。
- パフォーマンス: 起動ボタンだけ初期描画し、パネルは `next/dynamic` で開いたときに読む。固定配置なので CLS は 0。LCP に影響する画像・フォントは持たない。
- **広告と重ねない**: `bottom` 広告枠（`AdUnit` の `bottom`）と起動ボタンが重なる幅では、ボタンを `bottom-20` に上げる。AdSense のアンカー広告を後で有効にする場合はこの位置を再確認する（広告を覆う UI はポリシー違反）。
- デザインは `globals.css` / `ui.ts` / `ui.tsx` のトークン経由。`dark:` は書かない。新しい形（右下固定・シート）は `ui.ts` に `FLOAT` として名前を足す。

### 2.5 計測
- GA4 イベント: `chat_open`（開いた）/ `chat_ask`（送信。質問文は載せない）/ `chat_no_source`（該当なし）/ `chat_source_click`（出典クリック）。`GaClickTracker` と同じ `window.gtag` 経由。
- 「該当なし」が多い質問の傾向は、質問文を保存しない方針のため GA4 では分からない。知りたくなったら `content/prompts.csv` 側に想定プロンプトとして人が書き、`npm run prompt-gap` で穴を見る（既存の仕組みで足りる）。

## 3. 費用・乱用の防御（診断APIと同じ層＋LLM向けの追加）
| 層 | 何を止めるか | 実装 |
|---|---|---|
| 停止スイッチ | 予算超過・事故時に即停止 | `CHAT_ENABLED` を外す → 503、クライアントはボタンを隠す |
| 同一オリジン | スクリプトからの直叩き | `sameOrigin()`（既存） |
| 回数制限 | 連打・IP変えの洪水 | `rateLimited(ip, 5)` ＋ インスタンス全体 60/分（既存） |
| 入力上限 | 巨大入力での input 課金 | 質問 300 字・履歴 4 往復×500 字・path 形式チェック |
| 検索ゲート | 無関係な質問での API 呼び出し | 類似度閾値未満は API を呼ばない |
| 出力上限 | 長文生成 | `max_tokens: 600` |
| 会話上限 | 1人で回し続ける | クライアント 10 往復で終了（サーバーは `history` を 4 往復に切る） |
| 月額上限 | すべての取りこぼし | Anthropic Console の Spend limit（ユーザー設定） |

## 4. プライバシー・表記（実装と同時に直す）
- `/privacy` に「チャットについて」の章を追加: 入力内容は当サイトでは保存しない／回答生成のため Anthropic の API に質問文と履歴を送信する／Anthropic 側の取り扱いは同社のプライバシーポリシーに従う（**保持期間などの具体値は公式ページを確認してから書く。未確認のまま書かない**）。
- `/about` の「よくある質問」に「チャットの回答は信用できるか」を1問足す（記事本文だけを根拠にし出典を付けること、最新の仕様は出典で確認することを書く）。
- 免責（`/disclaimer`）に「チャットの回答」を対象として1文追加。
- 記事本文・`llms.txt` には何も足さない（チャットはインデックス対象ではない）。

## 5. 追加・変更するファイル
| 種別 | パス | 内容 |
|---|---|---|
| 追加 | `scripts/chat-index.ts` | ビルド時に `src/generated/chat-index.ts` を書き出す（`prebuild`） |
| 追加 | `src/lib/chat.ts` | `retrieve()` / `buildPrompt()` / 入力検証（純関数。API も無い環境でテストできる） |
| 追加 | `src/lib/chat.test.ts` | 検索の上位・閾値・同一記事の上限・入力検証 |
| 追加 | `api/chat.ts` | Vercel Function（相対 import） |
| 追加 | `src/components/ChatWidget.tsx` | 起動ボタン＋パネル |
| 変更 | `src/app/layout.tsx` | `<ChatWidget />` を追加 |
| 変更 | `src/lib/ui.ts` | `FLOAT`（右下固定・シート）の定義 |
| 変更 | `vercel.json` | `functions["api/chat.ts"].maxDuration = 30` |
| 変更 | `package.json` | `prebuild`、`@anthropic-ai/sdk` を `dependencies` へ（今は devDependencies。関数に同梱されないと本番で落ちる） |
| 変更 | `.gitignore` | `src/generated/` |
| 変更 | `.env.example` | `CHAT_ENABLED` / `NEXT_PUBLIC_CHAT_ENABLED` / `ANTHROPIC_API_KEY`（Vercel にも入れる旨） |
| 変更 | `src/app/privacy/page.tsx` `about` `disclaimer` | 4章のとおり |
| 変更 | `README.md` `CLAUDE.md` | File Map・Env・自作ツールの節に追記 |

## 6. やらないこと（v1）
- 外部チャットSaaS（Crisp・Intercom 等）の埋め込み。スクリプトの重さ・月額・データの第三者保持が方針と合わない。
- 会話の保存・ログイン・履歴の復元。
- 埋め込みAPI・ベクトルDB。文字bigram TF-IDF で足りる規模（数百記事）で、外部依存を増やさない。
- 業務委託・相談の勧誘文。`/contact` への案内は「該当なし」のときの固定文だけ。
- 記事以外の一般知識での回答（抜粋に無ければ「該当なし」）。

## 7. ユーザー判断が要る点（実装前に決める）
- [ ] モデル: `claude-haiku-4-5`（推奨）か `claude-sonnet-5` か
- [ ] Vercel の環境変数に `ANTHROPIC_API_KEY` を入れる（今は Actions Secrets のみ。**Vercel 側はユーザーが設定**）
- [ ] Anthropic Console の月額上限（目安: Haiku で 1,000回/月 ≈ $7）
- [ ] 表示範囲: 全ページか、記事・教科書・用語集ページだけか（トップ・一覧では邪魔になりやすい。推奨は記事・learn・glossary・tools）

## 8. 実装手順（設計承認後）
- [ ] `scripts/chat-index.ts` と `prebuild`。`npm run build` で `src/generated/chat-index.ts` が出ることを確認
- [ ] `src/lib/chat.ts` の `retrieve()` と test。`content/prompts.csv` の 20 本で上位と閾値を確認
- [ ] `api/chat.ts`（`vercel dev` で 403/429/400/該当なし/200 の順に確認。`docs/progress_vercel-cost.md` の検証手順と同じ）
- [ ] `ChatWidget.tsx`（デスクトップ・モバイル・reduced-motion・キーボード操作・広告枠との重なり）
- [ ] `/privacy` `/about` `/disclaimer` の追記
- [ ] README / CLAUDE.md / `.env.example`
- [ ] `vercel build` の出力で `api/chat.func` に `chat-index` と `@anthropic-ai/sdk` が同梱されることを確認（本番で `FUNCTION_INVOCATION_FAILED` を踏まないため）
- [ ] 本番投入後 1 週間の GA4（`chat_ask` / `chat_no_source`）と Anthropic の使用量を見て、閾値とモデルを見直す
