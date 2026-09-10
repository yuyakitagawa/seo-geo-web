// 独自記事（original: true）には英語版がある、という運営方針を CI で守る。
// 英語版が無いまま独自記事を公開するとここで落ちる。英訳は `npm run translate:en -- <id>`。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import matter from "gray-matter";
import { enArticleErrors, type MdxDoc } from "./enRules";

function load(dir: string): (MdxDoc & { file: string })[] {
  const abs = path.join(process.cwd(), "content", dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => /\.mdx?$/.test(f))
    .map((file) => ({ file, ...matter(fs.readFileSync(path.join(abs, file), "utf8")) }));
}

const ja = load("articles");
const en = load("articles-en");
const jaById = new Map(ja.map((a) => [Number(a.data.id), a]));
const enSlugs = new Set(en.map((a) => String(a.data.slug)));

test("公開する独自記事には英語版がある", () => {
  const enIds = new Set(en.map((a) => Number(a.data.id)));
  const missing = ja.filter((a) => a.data.original === true && !a.data.draft && !enIds.has(Number(a.data.id)));
  assert.deepEqual(
    missing.map((a) => a.file),
    [],
    "英語版が無い独自記事がある。`npm run translate:en -- <id>` で作る"
  );
});

test("英語版の id・slug が重複していない", () => {
  const ids = en.map((a) => Number(a.data.id));
  assert.equal(new Set(ids).size, ids.length, `id の重複: ${ids.join(", ")}`);
  assert.equal(enSlugs.size, en.length, "slug の重複");
});

test("英語版が日本語の独自記事と対応している", () => {
  const problems = en.flatMap((doc) => {
    const source = jaById.get(Number(doc.data.id));
    if (!source) return [`${doc.file}: id ${String(doc.data.id)} の日本語記事が無い`];
    return enArticleErrors(source, doc, enSlugs).map((e) => `${doc.file}: ${e}`);
  });
  assert.deepEqual(problems, []);
});
