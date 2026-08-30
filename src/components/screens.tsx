import type { ReactNode } from "react";
import { Frame } from "./figures";

// 解説ページ（/seo・/geo）で使う「画面の模式図」。
// Search Consoleや検索結果のスクリーンショットは貼らず、同じ情報配置をコードで描き起こす。
// - 画像内の文字は検索エンジン・AIに読まれないため、画面の説明はテキストで残す必要がある
// - 実データを載せないので、数値はすべてサンプルだと明示する（SCREEN_NOTE）
// - ダークモードでも「スクリーンショット」に見えるよう、内側は常にライトUIで描く
// 記事MDXには渡していない（自動生成の記事が架空の管理画面を出さないようにするため）。

const SCREEN_NOTE = "※Search Consoleの画面を模した図です。実際の画面の複製ではなく、数値はすべてサンプルです。";

/** ブラウザの窓。中身は常にライトUIで描く */
function ScreenChrome({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/10">
      <div className="flex items-center gap-3 border-b border-black/10 bg-[#f1f3f4] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <p className="truncate rounded-full bg-white px-3 py-1 text-[11px] text-mute ring-1 ring-black/5">{url}</p>
      </div>
      {children}
    </div>
  );
}

/** 左のナビ。狭い画面では隠す（本題は右側の数値なので、無くても読める） */
function SideNav({ active }: { active: string }) {
  const items = ["サマリー", "検索パフォーマンス", "URL 検査", "ページ", "サイトマップ", "削除", "エクスペリエンス"];
  return (
    <nav className="hidden w-44 shrink-0 border-r border-black/10 bg-[#fafafa] py-3 sm:block" aria-hidden>
      <p className="px-4 pb-3 text-[11px] font-bold tracking-tight text-[#5f6368]">Google Search Console</p>
      <ul className="space-y-0.5 text-[11px]">
        {items.map((it) => (
          <li
            key={it}
            className={`mr-2 rounded-r-full px-4 py-1.5 ${
              it === active ? "bg-[#e8f0fe] font-bold text-[#1967d2]" : "text-[#3c4043]"
            }`}
          >
            {it}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** 画面の中の注釈番号。図の下の「読み取り方」と対応させる */
function Mark({ n, corner = false }: { n: number; corner?: boolean }) {
  const badge = (
    <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#d93025] text-[9px] font-bold text-white">
      {n}
    </span>
  );
  // corner: カード右上に逃がす（ラベルの途中で改行させないため）
  return corner ? <span className="absolute right-2 top-2">{badge}</span> : <span className="ml-1.5 inline-flex translate-y-[-1px] align-middle">{badge}</span>;
}

/** 図の下に置く「どこを見るか」の凡例 */
function Legend({ items }: { items: string[] }) {
  return (
    <ol className="mt-5 space-y-2 border-t border-paper/15 pt-4 text-sm leading-relaxed text-paper/80">
      {items.map((t, i) => (
        <li key={t} className="flex gap-2.5">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">
            {i + 1}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}

// 折れ線グラフ用のサンプル値（28日分）。実データではない。
const CLICKS = [12, 14, 11, 16, 15, 9, 8, 18, 21, 19, 24, 22, 14, 12, 26, 29, 31, 28, 33, 36, 22, 19, 38, 41, 44, 47, 43, 52];
const IMPRESSIONS = [420, 460, 390, 510, 480, 300, 280, 560, 610, 590, 700, 660, 420, 380, 760, 820, 880, 840, 910, 980, 620, 560, 1040, 1120, 1180, 1260, 1150, 1380];

function path(values: number[], w: number, h: number, scale = 1): string {
  const max = Math.max(...values);
  return values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h * scale}`).join(" ");
}

/**
 * Search Console「検索パフォーマンス」レポートの模式図。
 * 見る場所（4つの指標・推移・クエリ表）を注釈番号つきで示す。
 */
export function ScreenSearchPerformance() {
  const tiles = [
    { label: "合計クリック数", value: "1,284", color: "#1a73e8", mark: 1 },
    { label: "合計表示回数", value: "42,910", color: "#673ab7", mark: 2 },
    { label: "平均CTR", value: "3.0%", color: "#00897b", mark: 3 },
    { label: "平均掲載順位", value: "18.4", color: "#f9ab00", mark: 4 },
  ];
  const rows = [
    ["seo 対策 とは", "312", "9,840", "3.2%", "8.1"],
    ["geo 生成ai 最適化", "204", "6,120", "3.3%", "12.4"],
    ["search console 使い方", "168", "11,300", "1.5%", "24.7"],
    ["core web vitals 基準", "96", "4,410", "2.2%", "19.2"],
  ];
  return (
    <Frame title="Search Console「検索パフォーマンス」で見る4つの数値" caption={SCREEN_NOTE}>
      <ScreenChrome url="search.google.com/search-console/performance">
        <div className="flex">
          <SideNav active="検索パフォーマンス" />
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">検索パフォーマンス</p>
              <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[10px] font-semibold text-[#1967d2]">検索タイプ: ウェブ</span>
              <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] text-mute">日付: 過去 3 か月間</span>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-lg border border-black/10 p-3">
                  <p className="flex items-center whitespace-nowrap text-[10px] leading-tight text-mute">
                    <span className="mr-1.5 inline-block size-2 shrink-0 rounded-[2px]" style={{ background: t.color }} aria-hidden />
                    {t.label}
                  </p>
                  <p className="mt-1 flex items-center text-xl font-bold tabular-nums tracking-tight" style={{ color: t.color }}>
                    {t.value}
                    <Mark n={t.mark} />
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-black/10 p-3">
              <svg viewBox="0 0 640 160" className="h-32 w-full" role="img" aria-label="クリック数と表示回数の推移を示す折れ線グラフ（サンプル）">
                {[0, 40, 80, 120, 160].map((y) => (
                  <line key={y} x1="0" y1={y} x2="640" y2={y} stroke="#e0e0e0" strokeWidth="1" />
                ))}
                {/* 表示回数は面、クリック数は下側の線。2本が重ならないようクリック数は振幅を抑える */}
                <polygon points={`0,150 ${path(IMPRESSIONS, 640, 150)} 640,150`} fill="#673ab7" fillOpacity="0.12" />
                <polyline points={path(IMPRESSIONS, 640, 150)} fill="none" stroke="#673ab7" strokeWidth="3" strokeLinejoin="round" />
                <polyline points={path(CLICKS, 640, 150, 0.5)} fill="none" stroke="#1a73e8" strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <div className="mt-1 flex justify-between text-[9px] tabular-nums text-mute">
                <span>6/1</span>
                <span>6/15</span>
                <span>7/1</span>
                <span>7/15</span>
                <span>8/1</span>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-black/10">
              <div className="flex gap-4 border-b border-black/10 px-3 pt-2 text-[11px]">
                <span className="border-b-2 border-[#1a73e8] pb-1.5 font-bold text-[#1967d2]">
                  クエリ
                  <Mark n={5} />
                </span>
                <span className="pb-1.5 text-mute">ページ</span>
                <span className="pb-1.5 text-mute">国</span>
                <span className="pb-1.5 text-mute">デバイス</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-[11px]">
                  <thead className="bg-black/[0.03] text-left text-[10px] text-mute">
                    <tr>
                      {["上位のクエリ", "クリック数", "表示回数", "CTR", "掲載順位"].map((h) => (
                        <th key={h} className="px-3 py-1.5 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r[0]} className="border-t border-black/5">
                        {r.map((c, j) => (
                          <td key={j} className={`px-3 py-2 ${j === 0 ? "font-medium" : "tabular-nums text-mute"}`}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ScreenChrome>
      <Legend
        items={[
          "クリック数＝検索結果から実際に訪問された回数。施策の最終的な成果はここで見る。",
          "表示回数＝検索結果に出た回数。ここが増えていれば、まだクリックされていなくてもインデックスと関連性は前進している。",
          "CTR＝クリック数 ÷ 表示回数。表示回数が多いのにCTRが低いページは、タイトルと説明文が検索意図に答えられていない。",
          "掲載順位＝表示されたときの平均順位。ページ単位で見ると、あと少しで1ページ目に届くページが見つかる。",
          "「クエリ」タブ＝実際に検索された語。表示回数はあるのに答えるページが無い語が、次に作るページの候補になる。",
        ]}
      />
    </Frame>
  );
}

/**
 * Search Console「ページ（インデックス登録）」レポートの模式図。
 * 未登録の理由は Search Console ヘルプの表記に合わせる。
 */
export function ScreenIndexReport() {
  const reasons = [
    { label: "検出 - インデックス未登録", count: "184", meaning: "URLは見つかったがまだクロールされていない。サイト全体の負荷や優先度の問題が多い。" },
    { label: "クロール済み - インデックス未登録", count: "96", meaning: "取得はされたが登録されていない。内容の薄さ・重複が疑われる。" },
    { label: "代替ページ（適切な canonical タグあり）", count: "42", meaning: "別URLを正規と判断した状態。意図通りなら対応不要。" },
    { label: "noindex タグによって除外されました", count: "14", meaning: "意図した除外か、設定ミスかを必ず確認する。" },
    { label: "見つかりませんでした（404）", count: "6", meaning: "削除済みなら問題ない。移動なら301で転送する。" },
  ];
  return (
    <Frame title="Search Console「ページ」で見るインデックス登録の状況" caption={SCREEN_NOTE}>
      <ScreenChrome url="search.google.com/search-console/index">
        <div className="flex">
          <SideNav active="ページ" />
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <p className="mb-4 text-sm font-bold">ページのインデックス登録</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative rounded-lg border border-black/10 p-3">
                <Mark n={1} corner />
                <p className="flex items-center whitespace-nowrap text-[10px] text-mute">
                  <span className="mr-1.5 inline-block size-2 rounded-[2px] bg-[#188038]" aria-hidden />
                  インデックスに登録済みのページ
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[#188038]">128</p>
              </div>
              <div className="relative rounded-lg border border-black/10 p-3">
                <Mark n={2} corner />
                <p className="flex items-center whitespace-nowrap text-[10px] text-mute">
                  <span className="mr-1.5 inline-block size-2 rounded-[2px] bg-[#5f6368]" aria-hidden />
                  未登録のページ
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[#5f6368]">342</p>
              </div>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full" aria-hidden>
              <div className="bg-[#188038]" style={{ width: "27%" }} />
              <div className="flex-1 bg-[#dadce0]" />
            </div>
            <p className="mt-4 mb-2 flex items-center text-[11px] font-bold">
              ページがインデックスに登録されなかった理由
              <Mark n={3} />
            </p>
            <div className="overflow-hidden rounded-lg border border-black/10">
              <table className="w-full text-[11px]">
                <thead className="bg-black/[0.03] text-left text-[10px] text-mute">
                  <tr>
                    <th className="px-3 py-1.5 font-semibold">理由</th>
                    <th className="w-20 px-3 py-1.5 text-right font-semibold">ページ数</th>
                  </tr>
                </thead>
                <tbody>
                  {reasons.map((r) => (
                    <tr key={r.label} className="border-t border-black/5">
                      <td className="px-3 py-2">{r.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-mute">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ScreenChrome>
      <Legend
        items={[
          "「インデックスに登録済み」＝検索結果に出る可能性があるページ数。ここに重要なページが入っていなければ、順位以前の問題。",
          "「未登録」は全部が不具合ではない。タグ一覧やパラメータ違いのURLも入るため、件数ではなく理由の内訳で判断する。",
          "理由ごとの意味は下の表のとおり。まず「クロール済み - インデックス未登録」と「noindex タグによって除外されました」を確認する。",
        ]}
      />
      <div className="mt-5 space-y-2 text-sm leading-relaxed text-paper/80">
        {reasons.map((r) => (
          <p key={r.label}>
            <span className="font-bold text-accent">{r.label}</span>
            <span className="text-paper/60"> … {r.meaning}</span>
          </p>
        ))}
      </div>
    </Frame>
  );
}

/** Search Console「URL 検査」ツールの模式図 */
export function ScreenUrlInspection() {
  return (
    <Frame title="Search Console「URL 検査」で1ページずつ確認する" caption={SCREEN_NOTE}>
      <ScreenChrome url="search.google.com/search-console/inspect">
        <div className="flex">
          <SideNav active="URL 検査" />
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5">
              <span className="text-mute" aria-hidden>
                🔍
              </span>
              <span className="truncate text-[11px] text-mute">https://example.com/blog/seo-basics</span>
            </div>
            <div className="rounded-lg border border-black/10 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[#188038]">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#188038] text-[11px] text-white" aria-hidden>
                  ✓
                </span>
                URL は Google に登録されています
                <Mark n={1} />
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mute">
                このページは検索結果に表示される可能性があります（拡張機能とセキュリティの問題がない場合）。
              </p>
              <div className="mt-4 space-y-2 border-t border-black/10 pt-3 text-[11px]">
                {[
                  ["検出元サイトマップ", "https://example.com/sitemap.xml"],
                  ["参照元ページ", "https://example.com/blog/"],
                  ["前回のクロール", "2026年8月28日"],
                  ["ユーザー宣言の canonical", "https://example.com/blog/seo-basics"],
                  ["Google が選択した canonical", "検査対象の URL"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                    <span className="text-mute">
                      {k}
                      {k === "Google が選択した canonical" ? <Mark n={2} /> : null}
                    </span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded border border-[#1a73e8] px-3 py-1.5 text-[11px] font-semibold text-[#1967d2]">
                  公開 URL をテスト
                </span>
                <span className="rounded bg-[#1a73e8] px-3 py-1.5 text-[11px] font-semibold text-white">
                  インデックス登録をリクエスト
                </span>
                <Mark n={3} />
              </div>
            </div>
          </div>
        </div>
      </ScreenChrome>
      <Legend
        items={[
          "ページを直したあと、そのURLが登録されているかを1本ずつ確認できる。ここが「登録されていません」なら、順位ではなくインデックスの問題。",
          "Googleが選んだ正規URL（canonical）が自分の指定と違う場合、評価は別URLに寄っている。重複ページの統合はここで気づく。",
          "「インデックス登録をリクエスト」は再クロールの依頼で、登録も順位も保証されない。大量のURLにはサイトマップを使う。",
        ]}
      />
    </Frame>
  );
}

/** 検索結果ページの模式図。SEOが対象にしている枠を示す */
export function ScreenSerp() {
  return (
    <Frame
      title="検索結果のどこがSEO対策の対象か"
      caption="※検索結果の見え方を模した図です。表示される要素はクエリ・時期・地域によって変わります。"
    >
      <ScreenChrome url="www.google.com/search?q=seo+対策+とは">
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-black/15 px-4 py-2">
            <span className="text-mute" aria-hidden>
              🔍
            </span>
            <span className="text-[12px]">seo 対策 とは</span>
          </div>

          <div className="relative rounded-xl border border-[#1a73e8]/40 bg-[#f8fbff] p-3">
            <span className="absolute -top-2 left-3 rounded-full bg-[#1a73e8] px-2 py-0.5 text-[9px] font-bold text-white">
              AI による概要
            </span>
            <div className="mt-1.5 space-y-1.5" aria-hidden>
              <div className="h-2 w-full rounded bg-[#c6dafc]" />
              <div className="h-2 w-11/12 rounded bg-[#c6dafc]" />
              <div className="h-2 w-8/12 rounded bg-[#c6dafc]" />
            </div>
            <div className="mt-3 flex gap-1.5">
              {["example.com", "your-site.jp", "other.jp"].map((s, i) => (
                <span
                  key={s}
                  className={`rounded-full px-2 py-0.5 text-[9px] ${
                    i === 1 ? "bg-[#1a73e8] font-bold text-white" : "bg-white text-mute ring-1 ring-black/10"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-[#1967d2]">
              ← 引用元として並ぶ枠。ここに載る前提はインデックス登録
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {[
              { site: "your-site.jp › blog › seo", title: "SEO対策とは｜定義と最初にやること", you: true },
              { site: "example.com › guide", title: "SEOの基本 - 検索順位の決まり方", you: false },
              { site: "another.jp › column", title: "初心者向けSEOチェックリスト", you: false },
            ].map((r) => (
              <div key={r.title} className={r.you ? "-mx-2 rounded-lg bg-[#e6f4ea] px-2 py-1.5" : ""}>
                <p className="text-[10px] text-mute">{r.site}</p>
                <p className="text-[13px] font-medium leading-snug text-[#1a0dab]">{r.title}</p>
                <div className="mt-1 space-y-1" aria-hidden>
                  <div className="h-1.5 w-full rounded bg-black/10" />
                  <div className="h-1.5 w-9/12 rounded bg-black/10" />
                </div>
                {r.you && <p className="mt-1.5 text-[10px] font-bold text-[#188038]">← 自然検索の枠。順位・タイトル・説明文で流入が決まる</p>}
              </div>
            ))}
          </div>
        </div>
      </ScreenChrome>
      <Legend
        items={[
          "自然検索の枠＝広告費で買えない枠。SEO対策が動かそうとしているのは主にここ。",
          "AIによる概要の引用元も、インデックスに登録され、スニペットが表示できるページから選ばれる。土台は自然検索と共通。",
          "同じクエリでも、AIによる概要が出る／出ないは変わる。順位1本ではなく、表示回数とクリック数の両方で判断する。",
        ]}
      />
    </Frame>
  );
}
