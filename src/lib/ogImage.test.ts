// ogImageUrl() が Next の書き出すファイル名と一致することを、Next 自身の関数と突き合わせて固定する。
// Next を上げて規則が変わる／opengraph-image.tsx を足して OG_SEGMENTS を直し忘れる、のどちらでも落ちる。
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import test from "node:test";
import { fillMetadataSegment } from "next/dist/lib/metadata/get-metadata-route";
import { OG_SEGMENTS, ogImageUrl } from "./ogImage";
import { SITE_URL } from "./site";

const APP = join(process.cwd(), "src", "app");

function segmentsOnDisk(): string[] {
  return readdirSync(APP, { recursive: true, encoding: "utf8" })
    .filter((f) => /(^|[\\/])opengraph-image\.tsx$/.test(f))
    .map((f) => "/" + dirname(f).split(sep).join("/"))
    .map((s) => (s === "/." ? "/" : s))
    .sort();
}

test("OG_SEGMENTS が src/app にある opengraph-image.tsx と同じ", () => {
  assert.deepEqual([...OG_SEGMENTS].sort(), segmentsOnDisk());
});

test("ogImageUrl が Next の書き出すパスと一致する", () => {
  for (const segment of OG_SEGMENTS) {
    const params: Record<string, string> = segment.includes("[slug]") ? { slug: "75" } : {};
    const expected = fillMetadataSegment(segment, params, "opengraph-image", false);
    assert.equal(ogImageUrl(segment, params), `${SITE_URL}${expected}`, segment);
  }
});

test("本番で確認したURLを再現する（2026-09-11）", () => {
  assert.equal(ogImageUrl("/(ja)/articles/[slug]", { slug: "75" }), `${SITE_URL}/articles/75/opengraph-image-pnm8o`);
  assert.equal(ogImageUrl("/(ja)/learn"), `${SITE_URL}/learn/opengraph-image-14tkxo`);
});

test("無いセグメント・埋め忘れた params は例外", () => {
  assert.throws(() => ogImageUrl("/(ja)/privacy"));
  assert.throws(() => ogImageUrl("/(ja)/articles/[slug]"));
});
