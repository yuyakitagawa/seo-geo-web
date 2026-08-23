export default function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header className="mx-auto max-w-6xl px-5 pb-10 pt-16 sm:pt-24">
      {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-wider text-mute">{eyebrow}</p>}
      <h1 className="text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-none tracking-tighter">{title}</h1>
      {lead && <p className="mt-5 max-w-2xl text-mute sm:text-lg">{lead}</p>}
    </header>
  );
}
