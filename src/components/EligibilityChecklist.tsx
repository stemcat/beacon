import { parseEligibility } from "../lib/eligibility";
import { AnnotatedText } from "./GlossaryTerm";

/**
 * Renders eligibility criteria as a readable checklist. Framed as "things to
 * discuss with the study team" — Beacon never claims to determine eligibility.
 */
export function EligibilityChecklist({ criteria }: { criteria: string }) {
  const result = parseEligibility(criteria);

  if (!result.parsed) {
    return (
      <div className="eligibility">
        <p className="hint">
          This study lists its criteria in its own format — read through it and discuss anything
          unclear with the study team:
        </p>
        <pre className="criteria-raw">{result.raw}</pre>
      </div>
    );
  }

  return (
    <div className="eligibility">
      {result.sections.map((section, si) => {
        if (section.items.length === 0 && !section.preamble) return null;
        return (
          <section key={si} className={`criteria-section criteria-${section.kind}`}>
            <h4>
              {section.kind === "inclusion" && <span aria-hidden="true">✅ </span>}
              {section.kind === "exclusion" && <span aria-hidden="true">🚫 </span>}
              {section.title}
            </h4>
            {section.preamble && (
              <p className="hint">
                <AnnotatedText text={section.preamble} />
              </p>
            )}
            <ul>
              {section.items.map((item, ii) => (
                <li key={ii}>
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
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="hint">
        Dotted-underlined words have plain-language explanations — tap or hover to see them. Only
        the study team can confirm whether you qualify.
      </p>
    </div>
  );
}
