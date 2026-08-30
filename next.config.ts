import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 旧URLの統合。カテゴリ一覧（/category/*）は廃止し、SEO・GEOは解説ページ、ニュースは記事アーカイブに寄せた。
  // 記事詳細（/articles/<id>）はそのまま。ここは完全一致のみリダイレクトする。
  async redirects() {
    return [
      { source: "/category/seo", destination: "/seo", permanent: true },
      { source: "/category/geo", destination: "/geo", permanent: true },
      { source: "/category/news", destination: "/news", permanent: true },
      { source: "/articles", destination: "/news", permanent: true },
    ];
  },
};

export default nextConfig;
