import { useState } from "react";
import { getLang, t, useLang } from "../lib/i18n";

interface Props {
  cond: string;
  lat?: string | null;
  lng?: string | null;
  loc?: string | null;
  radius?: string | null;
}

/**
 * Opt-in email alerts (double opt-in). Discloses exactly what is stored —
 * the one deliberate exception to Beacon's zero-storage architecture.
 */
export function AlertSubscribe({ cond, lat, lng, loc, radius }: Props) {
  useLang();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "unavailable" | "error">("idle");

  const submit = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          cond,
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          loc: loc ?? undefined,
          radius: radius ? parseInt(radius, 10) : undefined,
          lang: getLang(),
        }),
      });
      if (res.status === 503) setState("unavailable");
      else if (!res.ok) setState("error");
      else setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "unavailable") return null;

  if (state === "sent") {
    return (
      <p className="hint alert-subscribe-done">
        ✉️ {t("Check your inbox — click the confirmation link to activate your alert.")}
      </p>
    );
  }

  return (
    <div className="alert-subscribe">
      {!open ? (
        <button className="btn btn-small" onClick={() => setOpen(true)}>
          ✉️ {t("Email me when new trials open")}
        </button>
      ) : (
        <div className="alert-subscribe-form">
          <div className="field-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email.includes("@") && submit()}
              placeholder={t("your@email.com")}
              aria-label="Email address for alerts"
            />
            <button
              className="btn btn-primary"
              disabled={state === "sending" || !email.includes("@")}
              onClick={submit}
            >
              {state === "sending" ? t("Working…") : t("Subscribe")}
            </button>
          </div>
          <p className="hint">
            {t("We store only your email and this search — nothing else. Every email has a one-click unsubscribe that deletes both.")}
          </p>
          {state === "error" && <p className="error">{t("Something went wrong — please try again.")}</p>}
        </div>
      )}
    </div>
  );
}
