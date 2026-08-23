// Google AdSense。パブリッシャーIDが未設定の間はスクリプト・広告枠・ads.txtのすべてが何も出力しない。
// NEXT_PUBLIC_ADSENSE_CLIENT: `ca-pub-` から始まるサイト運営者ID。
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export type AdPlacement = "infeed" | "article-mid" | "bottom";

// 掲載位置ごとに別ユニットにして、AdSense管理画面で位置別の収益を見られるようにする。
export const ADSENSE_SLOTS: Record<AdPlacement, string> = {
  infeed: process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT ?? "",
  "article-mid": process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_MID_SLOT ?? "",
  bottom: process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT ?? "",
};

// ads.txt の販売者IDは `ca-` 接頭辞を付けない。
export const ADSENSE_PUBLISHER_ID = ADSENSE_CLIENT.replace(/^ca-/, "");
