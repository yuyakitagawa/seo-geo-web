import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { ADSENSE_CLIENT } from "./src/lib/adsense";
import { AUDIT_LOG_ENABLED } from "./src/lib/audit-log";
import { CONTACT_FORM_ENABLED } from "./src/lib/contact-notify";

// 環境変数で入り切りする機能の一覧を、本番ビルドのたびにビルドログへ出す。
// 2026-09-06、Vercel に SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY を入れないまま /tools/page-audit を
// 公開していて、利用ログが1件も残っていなかった。この手の無効化はどれも例外を出さずに静かに起こるため、
// 「何が無効のまま本番に出たか」をログで気づけるようにする。判定は各機能の実装から import して、
// ここに配線の条件を書き写さない（書き写すと実装とずれて、また気づけなくなる）。
//
// さらに required の機能は、Vercel の本番デプロイ（VERCEL_ENV=production）に限りビルドを落とす。
// ログは誰も読まないので、「気づける」だけでは同じことが起きる。プレビュー・ローカル・CI では落とさない
// （env を持たないのが普通のため）。required に入れてよいのは、本番の env が実際に入っていて、
// 欠けたら機能が壊れると言い切れるものだけ:
//   - GA4         : 計測が止まると運用の判断材料が消える（本番設定済み: G-YD43872M17）
//   - 利用ログ     : /tools/page-audit の記録。上の事故の再発防止（本番設定済み。2026-09-06 に記録あり）
// AdSense（審査前）と お問い合わせフォーム（Xだけで受ける運用）は意図的に無効なので required にしない。
type FeatureFlag = { label: string; on: boolean; env: string; required: boolean };

function featureFlags(): FeatureFlag[] {
  return [
    { label: "GA4", on: Boolean(process.env.NEXT_PUBLIC_GA_ID), env: "NEXT_PUBLIC_GA_ID", required: true },
    { label: "AdSense", on: Boolean(ADSENSE_CLIENT), env: "NEXT_PUBLIC_ADSENSE_CLIENT", required: false },
    { label: "ページ診断の利用ログ", on: AUDIT_LOG_ENABLED, env: "SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY", required: true },
    { label: "お問い合わせフォーム", on: CONTACT_FORM_ENABLED, env: "LINE_* または RESEND_* 一式", required: false },
  ];
}

function logFeatureFlags(): void {
  const flags = featureFlags();
  // 等幅で桁を揃えるため、和文を2桁として数える
  const width = (s: string) => [...s].reduce((n, c) => n + (c.charCodeAt(0) < 0x100 ? 1 : 2), 0);
  const max = Math.max(...flags.map((f) => width(f.label)));
  console.log("[seo-geo-web] 環境変数で入り切りする機能");
  for (const { label, on, env, required } of flags) {
    const pad = " ".repeat(max - width(label));
    const state = on ? "有効" : `無効（${env} が未設定）`;
    console.log(`  ${label}${pad} : ${state}${required ? "  ※本番では必須" : ""}`);
  }

  // Vercel の本番デプロイでだけ落とす。ここで止めれば、機能が欠けたまま公開されることはない
  if (process.env.VERCEL_ENV === "production") {
    const missing = flags.filter((f) => f.required && !f.on);
    if (missing.length) {
      throw new Error(
        `本番に必須の環境変数が未設定です: ${missing.map((f) => `${f.label}（${f.env}）`).join(" / ")}\n` +
          "Vercel の Environment Variables（Production）に登録してから再デプロイしてください。"
      );
    }
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
