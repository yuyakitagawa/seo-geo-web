# デザインシステム

見た目の値と組み合わせを3層に分け、ページ側は「組み合わせるだけ」にする。
新しい見た目をページに直接書かない。足りない形が出たら、この3層のどれかに名前を足す。

| 層 | 置き場所 | 中身 |
| --- | --- | --- |
| トークン | `src/app/globals.css` の `@theme` | 色・角丸・影・ページ幅・極小文字。値を持つのはここだけ |
| クラス定義 | `src/lib/ui.ts` | 面・ボタン・チップ・表・入力・本文のクラスの組み合わせ |
| 部品 | `src/components/ui.tsx` | Container / Card / CardLink / Button / Chip / Eyebrow / SectionHeading / Steps |

## 1. トークン

### 色
2種類ある。**役割の色（セマンティック）を既定で使う**。

```
パレット（配色モードで変わらない）   ink / paper / accent / accent-ink / seo / geo / news
役割の色（ダークで反転する）        canvas / fg / mute / surface / line / line-strong / fill / fill-strong / invert / invert-fg
```

| トークン | ライト | ダーク | 用途 |
| --- | --- | --- | --- |
| `canvas` | paper | ink | ページ地・入力欄の地 |
| `fg` | ink | paper | 本文 |
| `mute` | #6b6b66 | #9c9c95 | 補足文・ラベル |
| `surface` | #fff | white 5% | カードの面 |
| `line` | ink 10% | paper 10% | 通常の罫線 |
| `line-strong` | ink 18% | paper 18% | チップ・入力欄の輪郭 |
| `fill` | ink 5% | paper 6% | 表ヘッダー・コード面 |
| `fill-strong` | ink 10% | paper 15% | 弱いバッジの地 |
| `invert` / `invert-fg` | ink / paper | paper / ink | 反転面（フッター・CTA・ホバー） |

**`dark:` は原則書かない。** 配色モードの差はトークン側が吸収する
（`globals.css` の `@media (prefers-color-scheme: dark)` でセマンティックトークンだけを差し替えている）。

例外は**常に黒地の帯**（トップのヒーロー、`PageHeader`、記事ヘッダー、`figures.tsx` の図解）。
ここは配色モードによらず黒地なので `bg-ink text-paper` と `paper/60` のような生のパレットを直接使う。
その上に置くチップは `CHIP_ON_INK`。

### 形・幅

| トークン | 値 | 用途 |
| --- | --- | --- |
| `rounded-card` | 1.5rem | カード・パネル |
| `rounded-panel` | 1rem | 表・コードブロック |
| `shadow-lift` | 0 30px 60px -30px | リンクカードのホバー |
| `shadow-panel` | 0 30px 60px -40px | 常時出す薄い影 |
| `max-w-page` | 72rem | 一覧・トップ |
| `max-w-wide` | 56rem | 記事本文の外枠 |
| `max-w-text` | 48rem | 本文 |
| `text-2xs` / `text-3xs` | 11px / 10px | バッジ・キャプション |

## 2. クラス定義（`src/lib/ui.ts`）

- `cx(...)` — クラスの連結。`false` は捨てる
- `CONTAINER.page / wide / text` — 左右のガター（`px-5`）込みのページ幅
- `SURFACE.card / outline / invert / accent / dashed` — 面。`PADDING.tight / card / roomy / hero` と組む
- `LIFT` — リンクカードのホバー（浮かせる）。静的なカードには付けない
- `EYEBROW.mute / accent / faint` — セクション上の小ラベル（faint=反転面・アクセント面の上）
- `HEADING.section / card / label` — 見出し
- `LINK` — 本文リンク（アクセント色の下線）
- `button(variant, size)` — `accent` / `invert` / `onAccent` / `outline` × `sm` / `md`
- `CHIP` / `CHIP_ON_INK` — 丸いリンク
- `BADGE.sm / md` — ラベル（色は呼び出し側で足す）
- `STEP` — 番号付き手順、`TABLE` — 表、`FIELD` — 入力欄、`CODE` — コード面
- `PROSE.body / page` — 記事・固定ページの本文

## 3. 部品（`src/components/ui.tsx`）

よく出る組み合わせだけを部品にしている。単発の組み合わせは上のクラス定義を直接使う。

```tsx
<Container width="page" as="section" className="py-16">…</Container>
<Card padding="roomy" className="shadow-panel">…</Card>   {/* 静的なカード */}
<CardLink href="/seo" tone="invert">…</CardLink>          {/* リンクカード。中で group-hover が使える */}
<Button href="/about" variant="accent">…</Button>         {/* external で別タブ＋rel */}
<Chip href="/tag/GEO">#GEO</Chip>
<Eyebrow tone="faint">Follow</Eyebrow>
<SectionHeading title="新着" lead="…" action={<Link …/>} />
<Steps items={["…", "…"]} />
```

`<button>` のようにDOMを自分で書きたいときは、部品ではなくクラス定義を使う
（例: `className={cx(button("invert"), "px-7 py-3")}`）。

## 運用ルール

1. ページに1回きりのクラスの並びを書かない。同じ形が2か所目に出たらここに名前を足す。
2. `dark:` を書きそうになったら、まずセマンティックトークンで表せないかを見る。
3. 色は `#hex` を直接書かない。`@theme` のトークン経由にする（図解の内部色など、SVGに直接渡すものだけ例外）。
4. 角丸・影・ページ幅も同じ。`rounded-3xl` や `max-w-6xl` ではなく `rounded-card` / `max-w-page` を使う。
