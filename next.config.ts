import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { ADSENSE_CLIENT } from "./src/lib/adsense";
import { AUDIT_LOG_ENABLED } from "./src/lib/audit-log";
import { CONTACT_FORM_ENABLED } from "./src/lib/contact-notify";

// 環境変数で入り切りする機能の一覧を、本番ビルドのたびにビルドログへ出す。
// 2026-09-06、Vercel に SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY を入れないまま /tools/page-audit を
// 公開していて、利用ログが1件も残っていなかった。この手の無効化はどれも例外を出さずに静かに起こるため、
// 「何が無効のまま本番に出たか」をログで気づけるようにする。判定は各機能の実装から import して、
// ここに条件を書き写さない（書き写すと実装とずれて、また気づけなくなる）。
// 欠けていてもビルドは止めない（Xだけで問い合わせを受けるなど、意図的に無効な構成があるため）。
function logFeatureFlags(): void {
  const flags: [string, boolean, string][] = [
    ["GA4", Boolean(process.env.NEXT_PUBLIC_GA_ID), "NEXT_PUBLIC_GA_ID"],
    ["AdSense", Boolean(ADSENSE_CLIENT), "NEXT_PUBLIC_ADSENSE_CLIENT"],
    ["ページ診断の利用ログ", AUDIT_LOG_ENABLED, "SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY"],
    ["お問い合わせフォーム", CONTACT_FORM_ENABLED, "LINE_* または RESEND_* 一式"],
  ];
  // 等幅で桁を揃えるため、和文を2桁として数える
  const width = (s: string) => [...s].reduce((n, c) => n + (c.charCodeAt(0) < 0x100 ? 1 : 2), 0);
  const max = Math.max(...flags.map(([label]) => width(label)));
  console.log("[seo-geo-web] 環境変数で入り切りする機能");
  for (const [label, on, env] of flags) {
    const pad = " ".repeat(max - width(label));
    console.log(`  ${label}${pad} : ${on ? "有効" : `無効（${env} が未設定）`}`);
  }
}

const nextConfig: NextConfig = {
  // 静的エクスポート。ページを純粋な静的ファイルにして、Vercel の ISR（デプロイごとにキャッシュを作り直し、
  // 8KB 単位で書き込みを課金する層）を通さない。2026-09-03、ISR Writes の超過でサイトが停止したため。
  // 旧URLのリダイレクト（/category/* など）は export では next.config で扱えないので vercel.json に置く。
  // 診断・お問い合わせの API はルート直下の api/（Vercel Functions）に置く。
  output: "export",
};

// 関数形式にするのは phase を受け取るため。`next dev` では出さない。
// 1回のビルドで設定は複数のプロセスから読まれるので、環境変数に印を付けて重複出力を防ぐ
// （子プロセスは印を引き継ぐ）。`next typegen` も本番フェーズを名乗るため typecheck でも1回出る。
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.SEOGEO_FLAGS_LOGGED) {
    process.env.SEOGEO_FLAGS_LOGGED = "1";
    logFeatureFlags();
  }
  return nextConfig;
}
