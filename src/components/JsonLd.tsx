// 構造化データ(JSON-LD)を<script>で埋め込む。dangerouslySetInnerHTML は JSON 文字列のみで、
// "<" を < に置換して </script> 挿入を防ぐ。
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
