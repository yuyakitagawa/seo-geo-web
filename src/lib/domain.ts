// 入力された文字列から「登録の単位になるドメイン」を取り出す。/tools/domain-power とそのAPIが使う。
// 「example.com」でも「https://blog.example.com/a/b?q=1」でも同じ example.com になる。

/**
 * 2ラベル以上でひとつの登録単位になる接尾辞。
 * Public Suffix List を丸ごと持つと更新が要るので、日本語圏で実際に入力される範囲と主要国だけを手で並べる。
 * ここに無いTLDは「最後の1ラベル」として扱うため、判定が壊れるのではなく粗くなるだけ。
 */
const MULTI_LABEL_SUFFIXES = new Set([
  // 日本
  "co.jp", "or.jp", "ne.jp", "ac.jp", "ad.jp", "ed.jp", "go.jp", "gr.jp", "lg.jp",
  // 英語圏
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "net.uk", "sch.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au", "id.au",
  "co.nz", "net.nz", "org.nz", "ac.nz", "govt.nz",
  // アジア
  "co.kr", "or.kr", "ne.kr", "re.kr", "pe.kr", "go.kr", "ac.kr",
  "com.cn", "net.cn", "org.cn", "gov.cn", "edu.cn", "ac.cn",
  "com.tw", "net.tw", "org.tw", "gov.tw", "edu.tw",
  "com.hk", "net.hk", "org.hk", "edu.hk", "gov.hk",
  "com.sg", "net.sg", "org.sg", "edu.sg", "gov.sg",
  "co.th", "in.th", "ac.th", "go.th",
  "co.id", "or.id", "ac.id", "go.id", "web.id",
  "com.my", "net.my", "org.my", "edu.my", "gov.my",
  "com.ph", "net.ph", "org.ph", "edu.ph", "gov.ph",
  "com.vn", "net.vn", "org.vn", "edu.vn", "gov.vn",
  "co.in", "net.in", "org.in", "gen.in", "firm.in", "ac.in", "gov.in",
  // その他
  "com.br", "net.br", "org.br", "gov.br", "edu.br",
  "com.mx", "org.mx", "gob.mx", "edu.mx",
  "com.ar", "net.ar", "org.ar", "gob.ar", "edu.ar",
  "com.tr", "net.tr", "org.tr", "gov.tr", "edu.tr",
  "co.za", "org.za", "net.za", "gov.za", "ac.za",
  "co.il", "org.il", "net.il", "ac.il", "gov.il",
  "com.ua", "net.ua", "org.ua", "gov.ua",
  "com.ru", "net.ru", "org.ru",
  "com.pl", "net.pl", "org.pl", "gov.pl",
  "co.at", "or.at", "ac.at", "gv.at",
]);

export type ParsedDomain = {
  /** 入力から取り出したホスト名（www. も含む、小文字） */
  host: string;
  /** 登録の単位になるドメイン（例: blog.example.co.jp → example.co.jp） */
  domain: string;
  /** 登録ドメインの接尾辞（例: example.co.jp → co.jp） */
  suffix: string;
};

/** 入力（ドメイン・ホスト名・URL）から登録ドメインを取り出す。取れない入力は Error を投げる */
export function parseDomain(raw: string): ParsedDomain {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("ドメインを入力してください");

  // URLで来ても、スキームなしのホストで来ても、同じ経路でホスト名にする
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let host: string;
  try {
    host = new URL(withScheme).hostname.toLowerCase();
  } catch {
    throw new Error("ドメインの形式が正しくありません（例: example.com）");
  }
  host = host.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) throw new Error("ドメインの形式が正しくありません（例: example.com）");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) {
    throw new Error("IPアドレスは診断できません。ドメイン名を入力してください");
  }

  const labels = host.split(".");
  if (labels.length < 2) throw new Error("トップレベルドメインが見つかりません（例: example.com）");
  if (labels.some((l) => l === "" || l.length > 63)) throw new Error("ドメインの形式が正しくありません（例: example.com）");
  // 国際化ドメイン名は URL が Punycode に直すので、ここに来る時点で英数字とハイフンだけになる
  if (labels.some((l) => !/^[a-z0-9-]+$/.test(l))) throw new Error("ドメインの形式が正しくありません（例: example.com）");

  const last2 = labels.slice(-2).join(".");
  const suffixLabels = MULTI_LABEL_SUFFIXES.has(last2) ? 2 : 1;
  if (labels.length <= suffixLabels) throw new Error(`${host} は登録できるドメインではありません（例: example.${last2}）`);

  return {
    host,
    domain: labels.slice(-(suffixLabels + 1)).join("."),
    suffix: labels.slice(-suffixLabels).join("."),
  };
}

/** 最後の1ラベル。RDAP のブートストラップを引くときのキー */
export function topLevelDomain(domain: string): string {
  return domain.split(".").pop() ?? "";
}
