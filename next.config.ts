import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的エクスポート。ページを純粋な静的ファイルにして、Vercel の ISR（デプロイごとにキャッシュを作り直し、
  // 8KB 単位で書き込みを課金する層）を通さない。2026-09-03、ISR Writes の超過でサイトが停止したため。
  // 旧URLのリダイレクト（/category/* など）は export では next.config で扱えないので vercel.json に置く。
  // 診断・お問い合わせの API はルート直下の api/（Vercel Functions）に置く。
  output: "export",
};

export default nextConfig;
