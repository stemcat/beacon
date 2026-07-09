import { useState } from "react";
import { t, useLang } from "../lib/i18n";

/**
 * About-page contact form. Relayed once to Kevin's inbox via /api/contact;
 * Beacon stores nothing. The hidden "website" field is a bot honeypot.
 */
export function ContactForm() {
  useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const canSubmit = email.includes("@") && message.trim().length >= 5 && state !== "sending";

  const submit = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return <p className="hint contact-sent">✅ {t("Message sent — thank you. You'll hear back at the email you provided.")}</p>;
  }

  return (
    <div className="contact-form">
      <div className="field-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("Your name (optional)")}
          aria-label={t("Your name (optional)")}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("your@email.com")}
          aria-label="Email"
        />
      </div>
      {/* Honeypot — hidden from humans, tempting to bots */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hp-field"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("Your message — a question, a correction, a partnership idea…")}
        aria-label="Message"
        rows={5}
      />
      <div className="contact-actions">
        <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
          {state === "sending" ? t("Working…") : t("Send message")}
        </button>
        <span className="hint">{t("Delivered once to Kevin's inbox — Beacon stores nothing.")}</span>
      </div>
      {state === "error" && <p className="error">{t("Something went wrong — please try again.")}</p>}
    </div>
  );
}
