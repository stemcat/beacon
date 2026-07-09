import { useState } from "react";
import { getLang, t, useLang } from "../lib/i18n";
import {
  fetchQuestionnaire,
  loadAnswers,
  saveAnswers,
  summarize,
  itemStatus,
  type PreScreenAnswer,
  type PreScreenItem,
} from "../lib/prescreen";

const ANSWERS: Array<{ value: PreScreenAnswer; key: string }> = [
  { value: "yes", key: "Yes" },
  { value: "no", key: "No" },
  { value: "unsure", key: "Not sure" },
];

/**
 * AI-assisted pre-screen: loads on demand (never automatically — each new
 * trial+language costs one model call, then caches forever). Answers stay
 * on-device; the summary is framed as conversation prep, never a verdict.
 */
export function PreScreen({ nctId }: { nctId: string }) {
  useLang();
  const [state, setState] = useState<"idle" | "loading" | "ready" | "unavailable" | "error">("idle");
  const [items, setItems] = useState<PreScreenItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, PreScreenAnswer>>({});

  const start = async () => {
    setState("loading");
    try {
      const fetched = await fetchQuestionnaire(nctId, getLang());
      setItems(fetched);
      setAnswers(loadAnswers(nctId));
      setState(fetched.length > 0 ? "ready" : "unavailable");
    } catch (e) {
      setState(e instanceof Error && e.message === "not_configured" ? "unavailable" : "error");
    }
  };

  const answer = (i: number, a: PreScreenAnswer) => {
    const next = { ...answers, [i]: answers[i] === a ? undefined : a } as Record<number, PreScreenAnswer>;
    if (next[i] === undefined) delete next[i];
    setAnswers(next);
    saveAnswers(nctId, next);
  };

  if (state === "unavailable") return null;

  const summary = summarize(items, answers);

  return (
    <section className="card detail-section">
      <h3>{t("Quick pre-screen — answer a few questions")}</h3>

      {state === "idle" && (
        <>
          <p className="hint">
            {t(
              "Beacon's AI turns this trial's criteria into simple yes/no questions you can answer about yourself. The AI never sees you — it only reads the trial's public text. Your answers stay on this device.",
            )}
          </p>
          <button className="btn btn-primary" onClick={start}>
            {t("Start the pre-screen")}
          </button>
        </>
      )}

      {state === "loading" && <p className="hint">{t("Preparing your questions…")}</p>}
      {state === "error" && (
        <p className="hint">
          {t("The pre-screen couldn't load right now — the full checklist above covers everything it would ask.")}
        </p>
      )}

      {state === "ready" && (
        <>
          <ul className="selfcheck-list">
            {items.map((item, i) => {
              const a = answers[i];
              const status = a ? itemStatus(item, a) : null;
              return (
                <li key={i} className={status ? `marked marked-${status === "ok" ? "yes" : status === "concern" ? "unsure" : "no"}` : ""}>
                  <div className="criterion-text">
                    {item.question}
                    <div className="prescreen-criterion">{item.criterion}</div>
                  </div>
                  <span className="mark-buttons" role="group" aria-label={item.question}>
                    {ANSWERS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`mark-btn ${a === opt.value ? "mark-active mark-yes" : ""}`}
                        aria-pressed={a === opt.value}
                        onClick={() => answer(i, opt.value)}
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>

          {summary.answered > 0 && (
            <div className="selfcheck-summary">
              <p>
                <strong>{t("{done} of {total} answered", { done: summary.answered, total: summary.total })}</strong>
                {summary.concerns > 0 && (
                  <>
                    {" "}·{" "}
                    {t("{n} answers may not line up with this trial's criteria — worth discussing; many criteria have exceptions", { n: summary.concerns })}
                  </>
                )}
                {summary.unsure > 0 && (
                  <> · {t('{n} marked "not sure" — bring these to the study team', { n: summary.unsure })}</>
                )}
              </p>
              <p className="hint">
                {t("Only the study team can determine eligibility. This is preparation for that conversation, not a decision.")}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
