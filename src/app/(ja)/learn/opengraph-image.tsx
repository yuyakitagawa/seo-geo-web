import { COURSE, LESSONS } from "@/lib/curriculum";
import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage, subtitleOf } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = COURSE.h1;

// 各レッスン（/learn/<slug>）にはこの画像が引き継がれる。レッスンごとに別画像を作らないのは、
// 共有されるのは目次と入口のレッスンが中心で、10枚に分けても見分けがつかないため。
export default pageOgImage({
  category: "geo",
  title: COURSE.h1,
  footer: subtitleOf(COURSE.metaTitle) || `全${LESSONS.length}レッスン`,
  label: "教科書",
});
