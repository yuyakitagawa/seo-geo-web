import fs from "node:fs";
import path from "node:path";

export type ToolType = "visibility" | "audit" | "both";
export const TOOL_TYPE_LABEL: Record<ToolType, string> = {
  visibility: "可視性計測",
  audit: "サイト診断",
  both: "計測＋診断",
};

export type Tool = {
  name: string;
  vendor: string;
  country: "日本" | "海外";
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
  return raw.tools.sort((a, b) => (a.country === b.country ? a.name.localeCompare(b.name, "ja") : a.country === "日本" ? -1 : 1));
}

export function latestVerified(tools: Tool[]): string {
  return tools.map((t) => t.verified).sort().at(-1) ?? "";
}
