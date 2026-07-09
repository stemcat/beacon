import { parseEligibility, type CriteriaSection } from "../lib/eligibility";
import { t, tn } from "../lib/i18n";
import { criterionKey, setMark, useSelfCheck, clearMarks, type Mark } from "../state/selfcheck";
import { AnnotatedText } from "./GlossaryTerm";

const MARKS: Array<{ value: Mark; label: string }> = [
  { value: "yes", label: "True for me" },
  { value: "no", label: "Not true for me" },
  { value: "unsure", label: "Not sure" },
];

function MarkButtons({ nctId, ckey, current }: { nctId: string; ckey: string; current?: Mark }) {
  return (
    <span className="mark-buttons no-print" role="group" aria-label="Does this apply to you?">
      {MARKS.map((m) => (
        <button
          key={m.value}
          className={`mark-btn mark-${m.value} ${current === m.value ? "mark-active" : ""}`}
          aria-pressed={current === m.value}
          onClick={() => setMark(nctId, ckey, current === m.value ? null : m.value)}
        >
          {t(m.label)}
        </button>
      ))}
    </span>
  );
}

function markSymbol(mark?: Mark): string {
  if (mark === "yes") return "✔ true for me";
  if (mark === "no") return "✘ not true for me";
  if (mark === "unsure") return "? not sure";
  return "— not reviewed";
}

/**
 * Eligibility criteria as an interactive self-check. Framed as preparation
 * for a conversation with the study team — Beacon never decides eligibility.
 */
export function EligibilityChecklist({ criteria, nctId }: { criteria: string; nctId: string }) {
  const result = parseEligibility(criteria);
  const marks = useSelfCheck(nctId);

  if (!result.parsed) {
    return (
      <div className="eligibility">
        <p className="hint">
          {t("This study lists its criteria in its own format — read through it and discuss anything unclear with the study team:")}
        </p>
        <pre className="criteria-raw">{result.raw}</pre>
      </div>
    );
  }

  const allItems = result.sections.flatMap((s) => s.items);
  const reviewed = allItems.filter((i) => marks[criterionKey(i.text)]).length;
  const unsure = allItems.filter((i) => marks[criterionKey(i.text)] === "unsure").length;
  const exclusionTrue = result.sections
    .filter((s) => s.kind === "exclusion")
    .flatMap((s) => s.items)
    .filter((i) => marks[criterionKey(i.text)] === "yes").length;

  const renderSection = (section: CriteriaSection, si: number) => {
    if (section.items.length === 0 && !section.preamble) return null;
    return (
      <section key={si} className={`criteria-section criteria-${section.kind}`}>
        <h4>
          {section.kind === "inclusion" && <span aria-hidden="true">✅ </span>}
          {section.kind === "exclusion" && <span aria-hidden="true">🚫 </span>}
          {t(section.title)}
        </h4>
        {section.preamble && (
          <p className="hint">
            <AnnotatedText text={section.preamble} />
          </p>
        )}
        <ul className="selfcheck-list">
          {section.items.map((item, ii) => {
            const ckey = criterionKey(item.text);
            return (
              <li key={ii} className={marks[ckey] ? `marked marked-${marks[ckey]}` : ""}>
                <div className="criterion-text">
                  <AnnotatedText text={item.text} />
                  {item.children.length > 0 && (
                    <ul>
                      {item.children.map((child, ci) => (
                        <li key={ci}>
                          <AnnotatedText text={child} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <span className="print-only print-mark">[{markSymbol(marks[ckey])}]</span>
                </div>
                <MarkButtons nctId={nctId} ckey={ckey} current={marks[ckey]} />
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="eligibility">
      <p className="hint">
        {t("Go through each point and mark what's true for you — it turns a wall of medical text into a focused conversation. Only the study team can confirm whether you qualify.")}
      </p>

      {result.sections.map(renderSection)}

      <div className="selfcheck-summary">
        <p>
          <strong>{t("{done} of {total} points reviewed", { done: reviewed, total: allItems.length })}</strong>
          {unsure > 0 && (
            <> · {t('{n} marked "not sure" — those are exactly the questions to bring to the study team', { n: unsure })}</>
          )}
          {exclusionTrue > 0 && (
            <>
              {" "}
              ·{" "}
              {tn(
                exclusionTrue,
                "{n} exclusion point may apply to you — worth asking about; some exclusions have exceptions",
                "{n} exclusion points may apply to you — worth asking about; some exclusions have exceptions",
              )}
            </>
          )}
        </p>
        <div className="selfcheck-actions no-print">
          <button className="btn btn-small" onClick={() => window.print()}>
            {t("🖨 Print my checklist")}
          </button>
          {reviewed > 0 && (
            <button className="btn btn-small" onClick={() => clearMarks(nctId)}>
              {t("Reset marks")}
            </button>
          )}
        </div>
      </div>

      <p className="hint">
        {t("Dotted-underlined words have plain-language explanations — tap or hover to see them. Your marks are saved only on this device.")}
      </p>
    </div>
  );
}
