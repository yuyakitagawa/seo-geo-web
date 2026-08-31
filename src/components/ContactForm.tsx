"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT_LIMITS, CONTACT_TOPICS, type ContactTopic } from "@/lib/contact";
import { FIELD, PADDING, SURFACE, button, cx } from "@/lib/ui";

const TOPIC_KEYS = Object.keys(CONTACT_TOPICS) as ContactTopic[];

export default function ContactForm() {
  const [topic, setTopic] = useState<ContactTopic>("correction");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // ハニーポット。人は触らない
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  // 開いてから送信するまでの時間。自動投稿の足切りに使う（判定はサーバー側）。
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || message.trim().length < 10) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, name, email, message, company, elapsed: openedAt.current ? Date.now() - openedAt.current : 0 }),
      });
      const data = await res.json();
      if (!res.ok) setError(String(data.error ?? "送信に失敗しました"));
      else setDone(true);
    } catch {
      setError("通信に失敗しました。時間を置いて試してください。");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={cx(SURFACE.card, PADDING.card)} role="status">
        <p className="font-bold">送信しました。ありがとうございます。</p>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          個人で運営しているため、すべてのお問い合わせに返信できるとは限りません。数日以内に返信がない場合は、
          恐れ入りますが再送をお願いします。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cx(SURFACE.card, PADDING.card, "not-prose space-y-5")}>
      <div>
        <label htmlFor="contact-topic" className="text-sm font-bold">
          用件
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as ContactTopic)}
          className={cx(FIELD.plain, "mt-2 block w-full")}
        >
          {TOPIC_KEYS.map((k) => (
            <option key={k} value={k}>
              {CONTACT_TOPICS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-bold">
            お名前 <span className="font-normal text-mute">（任意）</span>
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={CONTACT_LIMITS.name}
            autoComplete="name"
            className={cx(FIELD.plain, "mt-2 block w-full")}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm font-bold">
            返信先メール <span className="font-normal text-mute">（任意）</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={CONTACT_LIMITS.email}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className={cx(FIELD.plain, "mt-2 block w-full")}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="text-sm font-bold">
          お問い合わせ内容
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          maxLength={CONTACT_LIMITS.message}
          required
          placeholder="該当する記事のURLがあれば、あわせてお知らせください。"
          className={cx(FIELD.text, "mt-2 block w-full")}
        />
        <p className="mt-2 text-right text-xs text-mute">
          {message.length} / {CONTACT_LIMITS.message}
        </p>
      </div>

      {/* ハニーポット。自動投稿だけが入力する。読み上げ・タブ移動からも外す */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-company">会社名（入力しないでください）</label>
        <input id="contact-company" value={company} onChange={(e) => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={loading || message.trim().length < 10} className={cx(button("invert"), "px-7 py-3 disabled:opacity-40")}>
          {loading ? "送信中…" : "送信する"}
        </button>
        <p className="text-xs text-mute">返信が必要な場合はメールアドレスをご記入ください。</p>
      </div>

      {error && (
        <p className="rounded-panel border border-news/40 bg-news/10 p-4 text-sm text-news" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
