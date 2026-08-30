// 構造化データ(JSON-LD)を<script>で埋め込む。dangerouslySetInnerHTML は JSON 文字列のみで、
// "<" を < に置換して </script> 挿入を防ぐ。
// インデント付きで出力する: 本文HTMLはReactが1行に詰めるため、ページのソースを開いた読者が
// 手本として読めるのは構造化データだけになる。増える転送量は gzip 後で数十バイト。
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 2).replace(/</g, "\\u003c") }}
    />
  );
}
