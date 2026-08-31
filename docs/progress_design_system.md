# デザインシステム導入

見た目は現状維持のまま、コピペで散っていたクラス文字列をトークン＋部品に集約した。

- [x] 1. トークン層（`src/app/globals.css` の `@theme`）: 配色モードで反転するセマンティック色、角丸・影・ページ幅・極小文字
- [x] 2. クラス定義層（`src/lib/ui.ts`）: 面・ボタン・チップ・表・入力・本文の組み合わせを名前で持つ
- [x] 3. 部品層（`src/components/ui.tsx`）: Container / Card / CardLink / Button / Chip / Eyebrow / SectionHeading / Steps
- [x] 4. 共通コンポーネントの載せ替え（Header, Footer, ArticleCard, KeyPoints, Toc, PageHeader, guide, lesson ほか）
- [x] 5. ページの載せ替え（top, news, seo, geo, learn, tools, 各ツール, articles, tag, 固定ページ）
- [x] 6. `dark:` の重複を全廃 → typecheck / lint / build / 両モードのスクリーンショット確認
- [x] 7. ドキュメント（`docs/design-system.md`）・README・CLAUDE.md 更新

## 意図して変えた見た目（統一のため）

- バッジの文字サイズを 10px → 11px に統一（`BADGE.sm`）。和文ラベルが小さすぎたため
- Eyebrow（小ラベル）の字間を `tracking-[0.2em]` と `tracking-wider` の混在から `tracking-wider` に統一
- 罫線の濃さを 3種（10% / 15% / 20% / 25%）から2種（`line` 10% / `line-strong` 18%）に統一
- リンクカードの余白を `p-7` / `p-6` の混在から `p-6 sm:p-8` に統一
- ダークモードの `mute`（補足文）を #6b6b66 → #9c9c95 に。暗い地の上でコントラストが足りていなかった

## 残していること

- `figures.tsx` / `screens.tsx` の図解内部（常に黒地・ブラウザ模写）は生の色のまま。トークン化すると図の意味が変わる
- ヒーロー・PageHeader・記事ヘッダーの「常に黒地」の帯は `ink` / `paper` を直接使う（`CHIP_ON_INK` も同じ理由）
