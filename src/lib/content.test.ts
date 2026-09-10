// 記事ファイルの不変条件。CLAUDE.md に「守る」と書いてあるだけで、破っても何も落ちなかったものを検査する。
//
// ここが無かったせいで起きたこと:
//   - id 43 の記事が3本でき、本番ビルドが落ちた（並行ブランチのマージで採番が衝突した）
//   - 最新 main と番号が衝突し、公開後に採番し直した
// どちらも「毎朝の自動公開が止まってから気づく」壊れ方で、CI で先に止めるべきもの。
// content.ts 経由ではなくファイルを直接読むのは、draft も採番の対象（scripts/article.ts の currentMaxId）で、
// 一覧から外れている記事とも id が衝突しうるため。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import matter from "gray-matter";
import { isCategoryKey } from "./site";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

const articles = fs
  .readdirSync(ARTICLES_DIR)
  .filter((f) => /\.mdx?$/.test(f))
  .map((file) => ({ file, data: matter(fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8")).data }));

test("記事が1本以上ある", () => {
  assert.ok(articles.length > 0, `${ARTICLES_DIR} に記事がない`);
});

test("記事 id が重複していない", () => {
  const byId = new Map<number, string[]>();
  for (const { file, data } of articles) {
    const id = Number(data.id);
    byId.set(id, [...(byId.get(id) ?? []), file]);
  }
  const dups = [...byId].filter(([, files]) => files.length > 1);
  assert.deepEqual(dups, [], `id が重複している（URL が衝突し本番ビルドが落ちる）: ${JSON.stringify(dups)}`);
});

test("ファイル名の番号と frontmatter の id が一致する", () => {
  // ファイル名の番号は人間用、URL は id。ずれるとファイルを探せなくなる
  const bad = articles.filter(({ file, data }) => Number(file.slice(0, 4)) !== Number(data.id));
  assert.deepEqual(bad.map((b) => `${b.file} は id:${b.data.id}`), []);
});

test("id は正の整数", () => {
  const bad = articles.filter(({ data }) => !Number.isInteger(Number(data.id)) || Number(data.id) <= 0);
  assert.deepEqual(bad.map((b) => `${b.file}:${b.data.id}`), []);
});

test("date が YYYY-MM-DD", () => {
  // 出典の公開日を入れる決まり。Date オブジェクトのまま書かれるとタイムゾーンで1日ずれる
  const bad = articles.filter(({ data }) => !/^\d{4}-\d{2}-\d{2}$/.test(String(data.date)));
  assert.deepEqual(bad.map((b) => `${b.file}:${b.data.date}`), []);
});

test("category がサイトの定義にある", () => {
  const bad = articles.filter(({ data }) => !isCategoryKey(String(data.category)));
  assert.deepEqual(bad.map((b) => `${b.file}:${b.data.category}`), []);
});

test("sources に出典 URL がある", () => {
  // CLAUDE.md の「記事の事実は一次情報で裏取り」を機械で担保する。出典の無い記事は公開しない
  const bad: string[] = [];
  for (const { file, data } of articles) {
    const sources = data.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      bad.push(`${file}: sources が無い`);
      continue;
    }
    for (const s of sources) {
      if (!/^https?:\/\//.test(String(s?.url))) bad.push(`${file}: url が不正 ${JSON.stringify(s?.url)}`);
      if (!String(s?.title ?? "").trim()) bad.push(`${file}: title が空`);
    }
  }
  assert.deepEqual(bad, []);
});

test("supersedes の参照先が存在し、自分自身ではない", () => {
  // 参照先を消したり書き間違えたりすると、カニバリ対策（indexability.ts）が黙って効かなくなる
  const ids = new Set(articles.map(({ data }) => Number(data.id)));
  const bad: string[] = [];
  for (const { file, data } of articles) {
    if (data.supersedes === undefined) continue;
    for (const target of [data.supersedes].flat()) {
      if (Number(target) === Number(data.id)) bad.push(`${file}: 自分自身を supersedes している`);
      else if (!ids.has(Number(target))) bad.push(`${file}: supersedes:${target} の記事が無い`);
    }
  }
  assert.deepEqual(bad, []);
});

// 引用符の無い YAML スカラーに「: 」が入るとマッピングとして読まれ、画面に `[object Object]` が出る。
// 記事76の actions[0]（`旧ドメインで site: 検索されて0件に…`）が実際に本番でそう出た。
// 対処は frontmatter 側でその値を "…" で囲むこと。読み込み側は content.ts の parseStringList が弾く。
test("tags と actions がすべて文字列（「: 」を含む値の引用符落ち）", () => {
  const dirs = ["articles", "articles-en"];
  const broken: string[] = [];
  for (const dir of dirs) {
    const dirPath = path.join(process.cwd(), "content", dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const file of fs.readdirSync(dirPath).filter((f) => /\.mdx?$/.test(f))) {
      const data = matter(fs.readFileSync(path.join(dirPath, file), "utf8")).data;
      for (const field of ["tags", "actions"] as const) {
        const value = data[field];
        if (!Array.isArray(value)) continue;
        value.forEach((item, index) => {
          if (typeof item !== "string") broken.push(`${dir}/${file}: ${field}[${index}] = ${JSON.stringify(item)}`);
        });
      }
    }
  }
  assert.deepEqual(broken, []);
});
