"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOTS, type AdPlacement } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// 記事と見分けが付かない置き方はAdSenseポリシー違反になるため、必ず「広告」ラベルを添える。
export default function AdUnit({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  const insRef = useRef<HTMLModElement>(null);
  const slot = ADSENSE_SLOTS[placement];

  useEffect(() => {
    const el = insRef.current;
    // 同じ<ins>を二度pushすると例外になる。StrictModeの二重実行を処理済みマーカーで回避。
    if (!el || el.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // 広告ブロッカー等で読めない場合は無視
    }
  }, []);

  if (!ADSENSE_CLIENT || !slot) return null;

  return (
    <aside className={`my-8 ${className}`}>
      <p className="mb-1 text-xs tracking-wider text-mute">広告</p>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
