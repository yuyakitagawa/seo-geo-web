import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { EYEBROW, LIFT, PADDING, STEP, SURFACE, button, cx, type ButtonSize, type ButtonVariant, type CardPadding, type EyebrowTone, type SurfaceTone } from "@/lib/ui";

// デザインシステムの部品。よく出る形だけを持ち、単発の組み合わせは src/lib/ui.ts のクラス定義を直接使う。
// ここに無い形が必要になったら、ページに新しい見た目を書く前に ui.ts の定義を足せないかを先に見る。

/** カード・パネル。リンクにするときは CardLink を使う */
export function Card({
  tone = "card",
  padding = "card",
  as = "div",
  className,
  children,
  ...rest
}: {
  tone?: SurfaceTone;
  padding?: CardPadding | "none";
  as?: ElementType;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  id?: string;
}) {
  const Tag = as;
  return (
    <Tag className={cx(SURFACE[tone], padding !== "none" && PADDING[padding], className)} {...rest}>
      {children}
    </Tag>
  );
}

/** リンクになっているカード。ホバーで浮く。中で group-hover を使える */
export function CardLink({
  href,
  tone = "outline",
  padding = "card",
  className,
  children,
}: {
  href: string;
  tone?: SurfaceTone;
  padding?: CardPadding | "none";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx("group", SURFACE[tone], padding !== "none" && PADDING[padding], LIFT, className)}>
      {children}
    </Link>
  );
}

/** 主導線のボタン。外部リンクは external を付ける（別タブ＋rel） */
export function Button({
  href,
  variant = "accent",
  size = "md",
  external = false,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = cx(button(variant, size), className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** セクションの上に置く小さいラベル。tone=accent は黒地の上で使う */
export function Eyebrow({ tone = "mute", className, children }: { tone?: EyebrowTone; className?: string; children: ReactNode }) {
  return <p className={cx(EYEBROW[tone], className)}>{children}</p>;
}

/** 番号付きの手順リスト */
export function Steps({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ol className={cx(STEP.list, className)}>
      {items.map((item, i) => (
        <li key={i} className={STEP.item}>
          <span className={STEP.marker}>{i + 1}</span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}
