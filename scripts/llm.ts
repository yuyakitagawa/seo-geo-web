// 記事生成に使うLLMの切り替え。既定は Anthropic（Claude）で、LLM_PROVIDER=moonshot のときだけ
// Moonshot AI（Kimi）を使う。Moonshot は Anthropic互換の Messages API を出しているので、
// SDKはそのままに baseURL と鍵だけ差し替える。
//
// 互換なのは messages/system/tools/max_tokens/stream までで、次の3つは Moonshot 側に無い。
// 送ると400になるので、能力フラグで落として呼び出し側から分岐させる。
//   - サーバー側ツール web_fetch  → 元記事は scripts/fetchSource.ts で自前取得してプロンプトに添付する
//   - output_config.effort        → 思考量の指定はしない
//   - cache_control               → system をプレーン文字列で送る（プロンプトキャッシュ無し）
import Anthropic from "@anthropic-ai/sdk";

export type Provider = "anthropic" | "moonshot";

export const PROVIDER: Provider = process.env.LLM_PROVIDER === "moonshot" ? "moonshot" : "anthropic";

// 既定はグローバル版。中国本土のアカウントは MOONSHOT_BASE_URL=https://api.moonshot.cn/anthropic を入れる。
const MOONSHOT_BASE_URL = process.env.MOONSHOT_BASE_URL || "https://api.moonshot.ai/anthropic";
// Moonshot のモデルIDは Kimi プラットフォーム側の一覧に従う（kimi-k2.6 / kimi-k3 など）。
// 既定は安いほうの kimi-k2.6。品質が足りなければ MOONSHOT_MODEL=kimi-k3 で上げる。
const MOONSHOT_DEFAULT_MODEL = "kimi-k2.6";
// コスト優先で sonnet（opus比で約4割減）。品質は下の generateWithReview（執筆→編集長レビューの2段階）で担保する。
// それでも品質が足りなければ claude-opus-5 に戻す。
const ANTHROPIC_MODEL = "claude-sonnet-5";

export const MODEL = PROVIDER === "moonshot" ? process.env.MOONSHOT_MODEL || MOONSHOT_DEFAULT_MODEL : ANTHROPIC_MODEL;

// 記事1本は3,000字前後（＝5,000トークン弱）で足りるが、思考トークンの分を上乗せしておく。
// Moonshot は出力上限が Claude より小さいので控えめにする。
export const MAX_TOKENS = PROVIDER === "moonshot" ? 16000 : 20000;

/** サーバー側で元記事を取得するツール（web_fetch）が使えるか。使えないときは自前で取得して本文を渡す */
export const HAS_WEB_FETCH = PROVIDER === "anthropic";
/** 思考量の指定（output_config.effort）が使えるか */
export const HAS_EFFORT = PROVIDER === "anthropic";
/** プロンプトキャッシュ（cache_control）が使えるか */
export const HAS_CACHE_CONTROL = PROVIDER === "anthropic";

export function createClient(): Anthropic {
  if (PROVIDER === "anthropic") return new Anthropic();
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) throw new Error("LLM_PROVIDER=moonshot には MOONSHOT_API_KEY が必要です");
  // Moonshot は Authorization: Bearer で認証する。SDKの apiKey は x-api-key に載るので、
  // ヘッダを明示して両方送る（余分な x-api-key は無視される）。
  return new Anthropic({ apiKey, baseURL: MOONSHOT_BASE_URL, defaultHeaders: { Authorization: `Bearer ${apiKey}` } });
}
