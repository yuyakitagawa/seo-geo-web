import { mkdirSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { iconFrame, loadIconFont } from "../src/lib/icon";

// アイコン（src/lib/icon.tsx）をファイルとして書き出す。手で実行する（`npm run icon`）。
//   - src/app/favicon.ico … ブラウザのタブ。/favicon.ico は icon.tsx より優先されるので実ファイルが要る
//   - docs/brand/icon-1024.png … X・外部サービスにアップロードする用（円形に切られても成立する図案）
// 図案を変えたら再実行してコミットする。

// ICOに入れるサイズ。16/32=タブ、48=Windowsのショートカット、64/128=高解像度ディスプレイの
// ブックマーク一覧・タスクバー（小さい方を引き伸ばすとにじむ）。
const PNG_SIZES = [16, 32, 48, 64, 128];

async function png(size: number, fonts: Awaited<ReturnType<typeof loadIconFont>>): Promise<Buffer> {
  const res = new ImageResponse(iconFrame(size), { width: size, height: size, fonts });
  return Buffer.from(await res.arrayBuffer());
}

/** PNGをそのまま格納するICOを組み立てる（現行ブラウザはPNG入りICOを読める） */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries: Buffer[] = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // パレット色数（トゥルーカラーは0）
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
  const fonts = await loadIconFont();
  if (fonts.length === 0) throw new Error("フォントを取得できませんでした。細字のまま書き出さずに中断します");

  const images = await Promise.all(PNG_SIZES.map(async (size) => ({ size, data: await png(size, fonts) })));
  writeFileSync("src/app/favicon.ico", ico(images));
  console.log(`src/app/favicon.ico (${PNG_SIZES.join("/")}px)`);

  mkdirSync("docs/brand", { recursive: true });
  writeFileSync("docs/brand/icon-1024.png", await png(1024, fonts));
  console.log("docs/brand/icon-1024.png");
}
main();
