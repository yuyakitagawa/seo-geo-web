// ドメイン単位の評価。取得（RDAP / WHOIS / Open PageRank）は API 側が担当し、
// ここは受け取った値を判定するだけの純関数にする。
//
// **合成スコア（0〜100の「ドメインパワー」）は作らない。**
// 被リンク元ドメイン数と登録年数をどんな重みで足すべきかの根拠が無く、
// 根拠の出せない数字を1つにまとめると、このサイトの他のページと矛盾するため。
import type { LinkProfile } from "./openPageRank";
import type { Registration } from "./rdap";

export type DomainSeverity = "high" | "mid" | "low" | "ok";

export const DOMAIN_SEVERITY_LABEL: Record<DomainSeverity, string> = {
  high: "要対処",
  mid: "直したい",
  low: "検討",
  ok: "問題なし",
};

const SEVERITY_ORDER: DomainSeverity[] = ["high", "mid", "low", "ok"];

export type DomainFinding = {
  id: string;
  severity: DomainSeverity;
  /** 何が起きているか（結論を先に） */
  title: string;
  /** なぜ問題か。1〜2文 */
  detail: string;
  /** 何をするか */
  fix?: string;
  source?: { title: string; url: string };
};

export type DomainMetric = { label: string; value: string; note: string };

export type DomainPowerInput = {
  host: string;
  domain: string;
  suffix: string;
  registration: Registration | null;
  registrationError: string | null;
  links: LinkProfile | null;
  linksError: string | null;
  /** 被リンクデータのAPIキーが設定されているか */
  linksConfigured: boolean;
  now: number;
};

export type DomainPowerResult = {
  host: string;
  domain: string;
  registration: (Registration & { ageDays: number | null; expiresInDays: number | null }) | null;
  links: LinkProfile | null;
  metrics: DomainMetric[];
  findings: DomainFinding[];
  counts: Record<DomainSeverity, number>;
  /** 取れなかったデータの説明。指摘ではないので分けて出す */
  notes: string[];
};

const ICANN = {
  title: "ICANN: EPP Status Codes（ドメインの状態コード）",
  url: "https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en",
};
const SPAM = {
  title: "Google ウェブ検索のスパムに関するポリシー",
  url: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja",
};
const OPR = {
  title: "Open PageRank: Methodology（Common Crawl のリンクグラフから算出）",
  url: "https://www.domcop.com/openpagerank/what-is-openpagerank",
};

const DAY_MS = 86_400_000;

/** iso から now までの経過日数。未来の日付なら負になる */
function daysSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  return Number.isNaN(at) ? null : Math.floor((now - at) / DAY_MS);
}

/** 「3年2か月」の形にする。1年未満は月だけ */
function humanAge(days: number): string {
  const months = Math.floor(days / 30.44);
  const years = Math.floor(months / 12);
  return years > 0 ? `${years}年${months % 12}か月` : `${months}か月`;
}

function ymd(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "—";
}

/** RDAP は "client transfer prohibited"、WHOIS は "clientTransferProhibited" のように書式が違う */
function hasStatus(statuses: string[], keyword: string): boolean {
  const flat = statuses.join(" ").toLowerCase().replace(/[\s_-]/g, "");
  return flat.includes(keyword.toLowerCase().replace(/[\s_-]/g, ""));
}

export function evaluateDomain(input: DomainPowerInput): DomainPowerResult {
  const findings: DomainFinding[] = [];
  const notes: string[] = [];
  const metrics: DomainMetric[] = [];

  const reg = input.registration;
  const ageDays = daysSince(reg?.registeredAt, input.now);
  const elapsedFromExpiry = daysSince(reg?.expiresAt, input.now);
  const expiresInDays = elapsedFromExpiry === null ? null : -elapsedFromExpiry;

  // ---- 被リンク -------------------------------------------------------------
  const rd = input.links?.referringDomains ?? null;
  const opr = input.links?.openPageRank ?? null;
  metrics.push({
    label: "被リンク元ドメイン数",
    value: rd === null ? "未計測" : rd.toLocaleString(),
    note: "このドメインへリンクしている別ドメインの数（Common Crawl のリンクグラフ）",
  });
  metrics.push({
    label: "Open PageRank",
    value: opr === null ? "未計測" : `${opr.toFixed(2)} / 10`,
    note: "リンクグラフ上の到達しやすさ。Googleが使っている指標ではない",
  });
  metrics.push({
    label: "世界順位",
    value: input.links?.worldRank == null ? "未計測" : `${input.links.worldRank.toLocaleString()} 位`,
    note: "Open PageRank が集計している全ドメイン内の順位",
  });

  if (input.linksError) {
    notes.push(`被リンクデータを取得できませんでした: ${input.linksError}`);
  } else if (!input.linksConfigured) {
    notes.push("被リンクデータは未設定のため計測していません（サイト運営者が Open PageRank のAPIキーを設定すると表示されます）。");
  } else if (rd === null) {
    notes.push(`${input.domain} は Open PageRank のリンクグラフに載っていません。被リンク元ドメインが極めて少ないか、集計対象外の新しいドメインです。`);
  }

  if (rd !== null) {
    const linkFix =
      "自分で取った実測値（GA4・Search Console の前後比較、検証ログ）を1本の記事にし、条件・期間・数値を表で置く。" +
      "引用しやすい形にしてから、その数値を扱う媒体やコミュニティに出典として提示する。" +
      "被リンクの購入と、リンク目的だけの相互リンクはGoogleのスパムポリシー（リンクスパム）に該当する。";
    if (rd < 10) {
      findings.push({
        id: "links-isolated",
        severity: "high",
        title: `被リンク元ドメインが ${rd} 件。リンクグラフ上ほぼ孤立しています`,
        detail: "外部からの入口が無い状態です。クローラーの再訪頻度が上がらず、AI検索が引用元を選ぶときの手がかりも自サイト内で完結してしまいます。",
        fix: linkFix,
        source: SPAM,
      });
    } else if (rd < 50) {
      findings.push({
        id: "links-few",
        severity: "mid",
        title: `被リンク元ドメインが ${rd} 件。同テーマの競合と比べて少ない水準です`,
        detail: "リンク元の数そのものより、テーマの近いドメインから引かれているかが効きます。数が少ないうちは1件の質が結果を左右します。",
        fix: linkFix,
        source: SPAM,
      });
    } else if (rd < 500) {
      findings.push({
        id: "links-growing",
        severity: "low",
        title: `被リンク元ドメインは ${rd} 件。増やす余地があります`,
        detail: "入口は確保できています。ここから先は件数ではなく、狙っているテーマと同じ分野のドメインから引かれているかを見てください。",
        fix: linkFix,
        source: SPAM,
      });
    } else {
      findings.push({
        id: "links-ok",
        severity: "ok",
        title: `被リンク元ドメインは ${rd} 件`,
        detail: "リンクグラフ上の入口は十分にあります。これ以上の件数より、ページ単位で狙った質問に答えているかが差になります。",
        source: OPR,
      });
    }
  }

  // ---- 登録情報 -------------------------------------------------------------
  metrics.push({
    label: "ドメイン年齢",
    value: ageDays === null ? "取得できません" : humanAge(ageDays),
    note: reg?.registeredAt ? `登録 ${ymd(reg.registeredAt)}` : "登録日が取得できませんでした",
  });
  metrics.push({
    label: "有効期限",
    value: expiresInDays === null ? "取得できません" : `あと ${expiresInDays.toLocaleString()} 日`,
    note: reg?.expiresAt ? ymd(reg.expiresAt) : "有効期限が取得できませんでした",
  });

  if (!reg) {
    if (input.registrationError) {
      notes.push(`登録情報を取得できませんでした: ${input.registrationError}`);
    } else if (input.suffix.endsWith("jp")) {
      notes.push(
        `${input.domain} の登録情報を取得できませんでした。.jp は IANA の RDAP 一覧に登録されておらず、JPRS の WHOIS からも応答がありませんでした。`,
      );
    } else {
      notes.push(`${input.domain} は登録されていないか、このTLDが RDAP に対応していないため登録情報を取得できませんでした。`);
    }
  } else {
    if (hasStatus(reg.statuses, "hold") || hasStatus(reg.statuses, "pendingdelete") || hasStatus(reg.statuses, "redemptionperiod")) {
      findings.push({
        id: "status-hold",
        severity: "high",
        title: "ドメインが保留・削除待ちの状態です",
        detail: `状態: ${reg.statuses.join(" / ")}。この状態では名前解決が止まり、検索エンジンもAI検索もページに到達できません。`,
        fix: "レジストラの管理画面で支払い状況と登録連絡先の確認状況を見る。redemptionPeriod は復旧に追加費用がかかり、期限を過ぎると第三者が再登録できる。",
        source: ICANN,
      });
    }

    if (expiresInDays !== null && expiresInDays < 180) {
      findings.push({
        id: "expiry-soon",
        severity: expiresInDays < 60 ? "high" : "mid",
        title: `有効期限まで ${expiresInDays.toLocaleString()} 日です`,
        detail: "失効するとサイトが止まります。第三者に再登録された場合、それまでの被リンクの評価は引き継げません。",
        fix: "レジストラで自動更新を有効にし、登録連絡先のメールアドレスが実際に受信できるかを確認する。",
        source: ICANN,
      });
    }

    // WHOIS（.jp）は EPP ステータスを返さないので、RDAP で取れたときだけ判定する
    if (reg.source === "RDAP" && !hasStatus(reg.statuses, "transferprohibited")) {
      findings.push({
        id: "transfer-unlocked",
        severity: "mid",
        title: "移管ロック（clientTransferProhibited）が付いていません",
        detail: "認証コードが漏れたときに、第三者が別のレジストラへ移管できる状態です。ドメインを失うとサイトごと失います。",
        fix: "レジストラの管理画面でドメインロック（移管ロック）を有効にする。ほとんどのレジストラで無料。",
        source: ICANN,
      });
    }

    if (ageDays !== null && ageDays < 365) {
      findings.push({
        id: "age-new",
        severity: "low",
        title: `登録から ${humanAge(ageDays)}。被リンクが少ないのは想定どおりです`,
        detail: "被リンクは時間をかけて増えます。新しいドメインで件数が出ないこと自体は異常ではありません。",
        fix:
          "過去の評価を引き継ぐ目的で期限切れドメイン（中古ドメイン）を買い、以前のサイトと関係のない内容を載せる行為は、" +
          "Googleのスパムポリシー「期限切れドメインの不正使用」に該当する。年齢を買うのではなく、更新を続けて履歴を作る。",
        source: SPAM,
      });
    }
  }

  findings.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  const counts: Record<DomainSeverity, number> = { high: 0, mid: 0, low: 0, ok: 0 };
  for (const f of findings) counts[f.severity] += 1;

  return {
    host: input.host,
    domain: input.domain,
    registration: reg ? { ...reg, ageDays, expiresInDays } : null,
    links: input.links,
    metrics,
    findings,
    counts,
    notes,
  };
}
