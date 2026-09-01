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

// content/tools.json を読む。/tools ページのデータ。新ツールは収集スクリプトの「ツール検知」候補を人が確認してから追記する。
export function getTools(): Tool[] {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "tools.json"), "utf8")) as { tools: Tool[] };
  return [...raw.tools].sort((a, b) => a.category.localeCompare(b.category) || (a.country === b.country ? a.name.localeCompare(b.name, "ja") : a.country === "日本" ? -1 : 1));
}

export function latestVerified(tools: Tool[]): string {
  return tools.map((t) => t.verified).sort().at(-1) ?? "";
}
