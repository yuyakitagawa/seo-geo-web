import { coverArtDataUri } from "@/lib/coverArt";
import type { CategoryKey } from "@/lib/site";

// 記事のキービジュアル。写真素材を持たないため、記事idから決定的に生成したSVGを画像として表示する。
// 装飾なので alt は空にする（隣に必ず記事タイトルがある）。
export default function CoverArt({
  id,
  category,
  className = "",
}: {
  id: number;
  category: CategoryKey;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URIのSVGなのでnext/imageの最適化対象外
    <img
      src={coverArtDataUri(id, category)}
      alt=""
      aria-hidden
      className={`size-full object-cover ${className}`}
    />
  );
}
