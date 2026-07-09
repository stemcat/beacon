import { Fragment, type ReactNode } from "react";
import { explainTerm, findGlossaryTerms } from "../lib/glossary";

/**
 * Renders text with medical jargon annotated: matched glossary terms get a
 * dotted underline and an accessible tooltip with a plain-language meaning.
 */
export function AnnotatedText({ text }: { text: string }) {
  const matches = findGlossaryTerms(text);
  if (matches.length === 0) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) parts.push(<Fragment key={`t${i}`}>{text.slice(cursor, m.index)}</Fragment>);
    const definition = explainTerm(m.term);
    parts.push(
      definition ? (
        <span key={`g${i}`} className="glossary-term" tabIndex={0}>
          {text.slice(m.index, m.index + m.length)}
          <span role="tooltip" className="glossary-tip">
            {definition}
          </span>
        </span>
      ) : (
        <Fragment key={`g${i}`}>{text.slice(m.index, m.index + m.length)}</Fragment>
      ),
    );
    cursor = m.index + m.length;
  });
  if (cursor < text.length) parts.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>);
  return <>{parts}</>;
}
