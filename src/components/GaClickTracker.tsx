"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";

// ページ内の全リンク・ボタンのクリックをGA4に送るグローバルリスナー。
// 各ボタンに個別実装せず、ここ1か所でサイト全体をカバーする。
//
// なぜ要るか: PVだけ見ても「そのページから次へ行けたか」が分からない。kujira-watch はこのログで
// 「TOPは閲覧者の17.6%しか何も押していない（全ページ中最低）」を見つけて導線を作り直した。
// 回遊導線（NextStep / ShareButtons）の効果はこのイベントでしか確認できない。
//
// GA_ID 未設定のときは layout 側でこのコンポーネント自体を出さない（sendGAEvent は
// dataLayer を作ってしまうため、置くだけでも無駄なグローバルが増える）。
export default function GaClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest("a, button, [role='button']");
      if (!el) return;
      const label =
        el.getAttribute("aria-label")?.trim() ||
        el.textContent?.trim().slice(0, 100) ||
        (el instanceof HTMLAnchorElement ? el.href : el.tagName.toLowerCase());
      sendGAEvent("event", "click", {
        label,
        tag: el.tagName.toLowerCase(),
        // 外部リンク（出典・ツール公式）と内部回遊を分けて数えるため。
        external: el instanceof HTMLAnchorElement && el.host !== window.location.host,
        path: window.location.pathname,
      });
    };
    // キャプチャで拾う。途中で stopPropagation するUIがあってもログが欠けない。
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
