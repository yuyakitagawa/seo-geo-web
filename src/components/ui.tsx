import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { CHIP, CONTAINER, EYEBROW, HEADING, LIFT, PADDING, STEP, SURFACE, button, cx, type ButtonSize, type ButtonVariant, type CardPadding, type ContainerWidth, type EyebrowTone, type SurfaceTone } from "@/lib/ui";

// デザインシステムの部品。よく出る形だけを持ち、単発の組み合わせは src/lib/ui.ts のクラス定義を直接使う。
// ここに無い形が必要になったら、ページに新しい見た目を書く前に ui.ts の定義を足せないかを先に見る。

/** ページ幅のラッパー。左右のガター（px-5）込み */
export function Container({
  width = "page",
  as = "div",
  className,
  children,
}: {
  width?: ContainerWidth;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return <Tag className={cx(CONTAINER[width], className)}>{children}</Tag>;
}

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
    <Link href={href} className={cx("group", SURFACE[tone], padding !=="none" && PADDING[padding], LIFT, className)}>
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

/** 丸いリンク（タグ・カテゴリ・ページ内ジャンプ） */
export function Chip({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const cls = cx(CHIP, className);
  // ページ内アンカーと外部URLは <a>、サイト内は Link
  if (href.startsWith("#") || href.startsWith("http")) {
    return (
      <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
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

/** セクション見出し。lead は見出しへの直答1段落、action は右に置く導線 */
export function SectionHeading({
  title,
  lead,
  action,
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-5", className)}>
      <div className="flex items-end justify-between gap-4">
        <h2 className={HEADING.section}>{title}</h2>
        {action}
      </div>
      {lead && <p className="mt-1 text-sm text-mute">{lead}</p>}
    </div>
  );
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
