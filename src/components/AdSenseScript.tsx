import { ADSENSE_CLIENT } from "@/lib/adsense";

// AdSenseローダー。React 19は async+src の<script>を<head>へ巻き上げるため、body配置でも審査は通る。
export default function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
