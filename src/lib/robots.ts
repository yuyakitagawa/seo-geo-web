// robots.txt の解析と許可判定。RFC 9309 と Google の仕様に合わせる。
// ブラウザ側（ツール）とサーバー側の両方から使うため、DOMにもNode APIにも依存しない純関数だけを置く。
// 参考: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt

export type Rule = { type: "allow" | "disallow"; pattern: string; line: number };
export type Group = { tokens: string[]; rules: Rule[] };
export type Robots = { groups: Group[]; sitemaps: string[] };

/** robots.txt のテキストをグループに分解する。未知のディレクティブは無視する（仕様どおり） */
export function parseRobots(text: string): Robots {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  // 直前の行が user-agent かどうか。連続する user-agent は同じグループにまとめる。
  let inAgentBlock = false;

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) return;
    const at = line.indexOf(":");
    if (at < 0) return;
    const field = line.slice(0, at).trim().toLowerCase();
    const value = line.slice(at + 1).trim();

    if (field === "user-agent") {
      if (!current || !inAgentBlock) {
        current = { tokens: [], rules: [] };
        groups.push(current);
      }
      if (value) current.tokens.push(value);
      inAgentBlock = true;
      return;
    }
    inAgentBlock = false;
    if (field === "sitemap") {
      if (value) sitemaps.push(value);
      return;
    }
    if (field !== "allow" && field !== "disallow") return;
    if (!current) return; // グループの外にある allow/disallow は無効
    // 値が空の disallow は「制限なし」を意味するので、ルールとして持たない
    if (field === "disallow" && value === "") return;
    current.rules.push({ type: field, pattern: value, line: i + 1 });
  });

  return { groups, sitemaps };
}

/**
 * クローラーに適用されるグループを選ぶ。
 * トークンがクローラー名の前方一致（大文字小文字を区別しない）で、最も長いものが勝つ。
 * どれも一致しなければ `*` のグループ。同じトークンのグループは結合する。
 */
export function groupFor(robots: Robots, userAgent: string): { token: string; rules: Rule[] } | null {
  const ua = userAgent.toLowerCase();
  let best = "";
  for (const g of robots.groups) {
    for (const t of g.tokens) {
      const token = t.toLowerCase();
      if (token !== "*" && ua.startsWith(token) && token.length > best.length) best = token;
    }
  }
  if (!best) {
    const hasStar = robots.groups.some((g) => g.tokens.some((t) => t.trim() === "*"));
    if (!hasStar) return null;
    best = "*";
  }
  const rules = robots.groups
    .filter((g) => g.tokens.some((t) => t.trim().toLowerCase() === best))
    .flatMap((g) => g.rules);
  return { token: best, rules };
}

// パターンを正規表現にする。`*` は任意の文字列、`$` は末尾一致。それ以外はリテラル。
function toRegExp(pattern: string): RegExp {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") out += ".*";
    else if (c === "$" && i === pattern.length - 1) out += "$";
    else out += c.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp("^" + out);
}

/** パターンの具体度。ワイルドカードを除いた文字数で比べる（Googleの「最も長い一致が勝つ」） */
function specificity(pattern: string): number {
  return pattern.replace(/\*/g, "").length;
}

export type Verdict = { allowed: boolean; rule: Rule | null; reason: string };

/** 1つのグループのルールで、パスがクロール可能かを判定する。同じ長さなら allow が勝つ */
export function isAllowed(rules: Rule[], path: string): Verdict {
  let winner: Rule | null = null;
  for (const rule of rules) {
    if (!rule.pattern.startsWith("/")) continue; // 相対パスでない値は無視する
    if (!toRegExp(rule.pattern).test(path)) continue;
    if (
      !winner ||
      specificity(rule.pattern) > specificity(winner.pattern) ||
      (specificity(rule.pattern) === specificity(winner.pattern) && rule.type === "allow")
    ) {
      winner = rule;
    }
  }
  if (!winner) return { allowed: true, rule: null, reason: "一致するルールが無いため許可" };
  return {
    allowed: winner.type === "allow",
    rule: winner,
    reason: `${winner.type === "allow" ? "Allow" : "Disallow"}: ${winner.pattern}（${winner.line}行目）に一致`,
  };
}

/** クローラー名とパスを渡して判定する。グループが無ければ「記述なし＝許可」 */
export function check(robots: Robots, userAgent: string, path: string): Verdict & { token: string | null } {
  const g = groupFor(robots, userAgent);
  if (!g) return { allowed: true, rule: null, reason: "このクローラー向けの記述が無いため許可", token: null };
  const v = isAllowed(g.rules, path);
  return { ...v, token: g.token };
}
