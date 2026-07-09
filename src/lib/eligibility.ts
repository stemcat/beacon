/**
 * Parser for ClinicalTrials.gov eligibility criteria text.
 *
 * Criteria arrive as one free-text blob. The dominant shape is:
 *
 *   Inclusion Criteria:
 *   * bullet
 *   * bullet
 *     * nested bullet
 *   Exclusion Criteria:
 *   1. numbered bullet
 *
 * ...but headers vary ("Main Inclusion Criteria", "Key exclusion criteria:",
 * trailing prose after the header), bullets vary (*, -, •, "1.", "1)", and
 * hybrids like "* 1\. text"), and the text contains markdown-style escapes
 * ("\<", "2\.") added by the registry. This parser is deliberately
 * conservative: when it can't find recognizable structure it reports
 * `parsed: false` so the UI can fall back to showing the raw text.
 */

export type SectionKind = "inclusion" | "exclusion" | "other";

export interface CriteriaItem {
  text: string;
  children: string[];
}

export interface CriteriaSection {
  kind: SectionKind;
  title: string;
  /** Prose that followed the header on the same line, if any. */
  preamble: string;
  items: CriteriaItem[];
}

export interface ParsedEligibility {
  sections: CriteriaSection[];
  /** True when at least one inclusion/exclusion header was recognized. */
  parsed: boolean;
  raw: string;
}

/** Remove registry markdown escapes: "\<" -> "<", "2\." -> "2.", etc. */
export function unescapeCriteria(text: string): string {
  return text.replace(/\\([<>.\-*_()\[\]#+!~])/g, "$1");
}

const HEADER_RE =
  /^\s*(?:[*\-•]\s*)?(?:main|key|major|principal)?\s*(inclusion|exclusion)\s+criteria\b\s*:?\s*(.*)$/i;

const BULLET_RE = /^(\s*)(?:[*\-•]|\d{1,3}[.)])\s+(.*)$/;

/** Strip a redundant secondary enumerator, e.g. "* 1. text" -> "text". */
function stripLeadingEnumerator(text: string): string {
  return text.replace(/^\d{1,3}[.)]\s+/, "");
}

export function parseEligibility(rawInput: string): ParsedEligibility {
  const raw = rawInput ?? "";
  const text = unescapeCriteria(raw);
  const lines = text.split(/\r?\n/);

  const sections: CriteriaSection[] = [];
  let current: CriteriaSection | null = null;
  let currentItem: CriteriaItem | null = null;
  let currentIndent = 0;

  const ensureSection = (): CriteriaSection => {
    if (!current) {
      current = { kind: "other", title: "Criteria", preamble: "", items: [] };
      sections.push(current);
    }
    return current;
  };

  for (const line of lines) {
    if (!line.trim()) continue;

    const header = line.match(HEADER_RE);
    if (header) {
      const kind = header[1].toLowerCase() as SectionKind;
      current = {
        kind,
        title: kind === "inclusion" ? "You may be able to join if…" : "You may not be able to join if…",
        preamble: header[2].trim(),
        items: [],
      };
      sections.push(current);
      currentItem = null;
      continue;
    }

    const bullet = line.match(BULLET_RE);
    if (bullet) {
      const indent = bullet[1].length;
      const body = stripLeadingEnumerator(bullet[2].trim());
      const section = ensureSection();
      if (currentItem && indent > currentIndent) {
        currentItem.children.push(body);
      } else {
        currentItem = { text: body, children: [] };
        currentIndent = indent;
        section.items.push(currentItem);
      }
      continue;
    }

    // Plain line: continuation of the current bullet, or free prose.
    const trimmed = line.trim();
    if (currentItem) {
      currentItem.text += " " + trimmed;
    } else {
      const section = ensureSection();
      section.preamble = section.preamble ? section.preamble + " " + trimmed : trimmed;
    }
  }

  const parsed = sections.some(
    (s) => (s.kind === "inclusion" || s.kind === "exclusion") && s.items.length > 0,
  );

  return { sections, parsed, raw: text };
}
