import fs from "node:fs";
import path from "node:path";

export type ToolCategory = "seo" | "geo";
export type ToolType = "visibility" | "audit" | "both" | "rank" | "keyword" | "crawl" | "suite";
export const TOOL_TYPE_LABEL: Record<ToolType, string> = {
  visibility: "AI可視性計測",
  audit: "AI対応診断",
  both: "計測＋診断",
  rank: "順位計測",
  keyword: "キーワード調査",
  crawl: "クロール・技術監査",
  suite: "総合",
};
export const TOOL_TYPE_COLOR: Record<ToolType, string> = {
  visibility: "bg-geo text-white",
  audit: "bg-geo/70 text-white",
  both: "bg-accent text-accent-ink",
  rank: "bg-seo text-white",
  keyword: "bg-seo/70 text-white",
  crawl: "bg-invert text-invert-fg",
  suite: "bg-news text-white",
};

export type Tool = {
  name: string;
  vendor: string;
  country: "日本" | "海外";
  category: ToolCategory;
  type: ToolType;
  engines: string[];
  price: string;
  free: boolean;
  url: string;
  jaUrl?: string;
  note: string;
  /** 運営者が公式ページを確認した日 YYYY-MM-DD */
  verified: string;
};

const TOOLS_PATH = path.join(process.cwd(), "content", "tools.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown, field: string, index: number): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`content/tools.json: tools[${index}].${field} は空でない文字列が必要です`);
  return value;
}

function parseTool(value: unknown, index: number): Tool {
  if (!isRecord(value)) throw new Error(`content/tools.json: tools[${index}] はオブジェクトが必要です`);
  const category = requiredString(value.category, "category", index);
  const type = requiredString(value.type, "type", index);
  const country = requiredString(value.country, "country", index);
  if (category !== "seo" && category !== "geo") throw new Error(`content/tools.json: tools[${index}].category が不正です`);
  if (!(type in TOOL_TYPE_LABEL)) throw new Error(`content/tools.json: tools[${index}].type が不正です`);
  if (country !== "日本" && country !== "海外") throw new Error(`content/tools.json: tools[${index}].country が不正です`);

  const url = requiredString(value.url, "url", index);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    throw new Error(`content/tools.json: tools[${index}].url は http / https のURLが必要です`);
  }
  const verified = requiredString(value.verified, "verified", index);
  const verifiedDate = new Date(`${verified}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(verified) || Number.isNaN(verifiedDate.valueOf()) || verifiedDate.toISOString().slice(0, 10) !== verified) {
    throw new Error(`content/tools.json: tools[${index}].verified は YYYY-MM-DD 形式の有効な日付が必要です`);
  }
  if (!Array.isArray(value.engines) || !value.engines.every((engine) => typeof engine === "string" && engine.trim())) {
    throw new Error(`content/tools.json: tools[${index}].engines は文字列の配列が必要です`);
  }

  return {
    name: requiredString(value.name, "name", index),
    vendor: requiredString(value.vendor, "vendor", index),
    country,
    category,
    type: type as ToolType,
    engines: value.engines,
    price: requiredString(value.price, "price", index),
    free: value.free === true,
    url,
    ...(typeof value.jaUrl === "string" && value.jaUrl ? { jaUrl: value.jaUrl } : {}),
    note: requiredString(value.note, "note", index),
    verified,
  };
}

// content/tools.json を読む。/tools ページのデータ。新ツールは収集スクリプトの「ツール検知」候補を人が確認してから追記する。
export function getTools(): Tool[] {
  const raw: unknown = JSON.parse(fs.readFileSync(TOOLS_PATH, "utf8"));
  if (!isRecord(raw) || !Array.isArray(raw.tools)) throw new Error("content/tools.json: tools 配列が必要です");
  return raw.tools.map(parseTool).sort((a, b) => a.category.localeCompare(b.category) || (a.country === b.country ? a.name.localeCompare(b.name, "ja") : a.country === "日本" ? -1 : 1));
}

export function latestVerified(tools: Tool[]): string {
  return tools.map((t) => t.verified).sort().at(-1) ?? "";
}
