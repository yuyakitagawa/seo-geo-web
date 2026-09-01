# 記事生成のLLMをMoonshot AI（Kimi）に切り替えられるようにする

既定は今までどおり Claude。`LLM_PROVIDER=moonshot` のときだけ Moonshot AI（Kimi）を使う。
Moonshot は Anthropic互換の Messages API（`https://api.moonshot.ai/anthropic`）を出しているので、
`@anthropic-ai/sdk` はそのままに baseURL と鍵だけ差し替える。

## 互換でないもの（3つ）
| 機能 | Claude | Moonshot | 対応 |
|---|---|---|---|
| 元記事の取得 | サーバー側ツール `web_fetch` | 無い | `scripts/fetchSource.ts` で自前取得し、プロンプト末尾に本文を添付する |
| 思考量 | `output_config.effort` | 無い | 送らない |
| プロンプトキャッシュ | `cache_control` | 無い | `system` をプレーン文字列で送る |

送ると400になるので、`scripts/llm.ts` の能力フラグ（`HAS_WEB_FETCH` / `HAS_EFFORT` / `HAS_CACHE_CONTROL`）で落とす。

## ステップ
- [x] `scripts/llm.ts`: プロバイダ選択・モデル・`max_tokens`・能力フラグ・クライアント生成を1か所に集約
- [x] `scripts/fetchSource.ts`: 出典ページの本文をテキストで取り出す（`structuredText` で箇条書きの改行を残す）
- [x] `scripts/article.ts`: `generateWithReview` のリクエストを能力フラグで組み立てる（モデル定数は llm.ts へ移動）
- [x] `scripts/generate.ts` / `scripts/generate-howto.ts`: web_fetch の有無でプロンプトとツールを分岐
- [x] `.env.example` / `README.md` / `CLAUDE.md` / `.github/workflows/daily-articles.yml` を更新
- [x] `npm run typecheck && npm run build`
- [x] モックのAnthropic互換サーバーで両プロバイダのリクエストを検証（下記）

## 検証
Anthropic互換のSSEを返すモックサーバーを立て、`scripts/generate.ts` を両プロバイダで通した結果。

| | model | max_tokens | output_config | tools | system | 認証 | プロンプト |
|---|---|---|---|---|---|---|---|
| 既定（Claude） | claude-sonnet-5 | 20000 | あり | web_fetch | 配列＋cache_control | x-api-key | web_fetchで取得して読む |
| moonshot | kimi-k2.6 | 16000 | なし | なし | 文字列 | Authorization: Bearer | 元記事の本文を添付 |

実APIへの疎通（鍵を入れての1本生成）は未実施。ローカルで `LLM_PROVIDER=moonshot MOONSHOT_API_KEY=... npm run generate -- 1`
を回して、モデルIDと出力品質を確認してから Actions の変数を切り替える。

## 運用
- ローカル: `.env` に `LLM_PROVIDER=moonshot` と `MOONSHOT_API_KEY` を入れる。
- GitHub Actions: Repository variables に `LLM_PROVIDER=moonshot`、Secrets に `MOONSHOT_API_KEY`。
  変数を消せば Claude に戻る（コード変更不要）。
- モデルは `MOONSHOT_MODEL` で変える（既定 `kimi-k2.6`、品質を上げるなら `kimi-k3`）。
  モデルIDは Kimi プラットフォームの一覧が正。400が返るときはまずここを疑う。
