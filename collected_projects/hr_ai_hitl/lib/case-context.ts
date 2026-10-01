import { escapeHtml } from "@/lib/note-format";

export type CaseHighlight = {
  label: string;
  tone?: "default" | "accent" | "warn";
};

export type CaseContextView = {
  facts: string[];
  openQuestions: string[];
  highlights: CaseHighlight[];
};

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mi = Number(m) - 1;
  if (mi < 0 || mi > 11) return iso;
  return `${d} ${months[mi]} ${y}`;
}

function capitalizeSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatOpenItem(text: string): string {
  let trimmed = capitalizeSentence(text.trim());
  if (!trimmed) return trimmed;
  if (/\?\s*$/.test(trimmed)) return trimmed;
  return `${trimmed}?`;
}

/** Turn free-text case context into scannable facts + open questions. */
export function parseCaseContext(context: string): CaseContextView {
  const lines = context
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const facts: string[] = [];
  const openQuestions: string[] = [];

  for (const line of lines) {
    if (/^open:/i.test(line)) {
      const tail = line.replace(/^open:\s*/i, "");
      for (const part of tail.split(/;\s*/)) {
        const q = part.trim();
        if (q) openQuestions.push(formatOpenItem(q));
      }
      continue;
    }

    if (/^no .+ yet\.?$/i.test(line)) {
      openQuestions.push(formatOpenItem(line.replace(/\.$/, "")));
      continue;
    }

    if (/\?\s*$/.test(line)) {
      openQuestions.push(formatOpenItem(line.replace(/\?\s*$/, "")));
      continue;
    }

    facts.push(line);
  }

  const highlights: CaseHighlight[] = [];
  const dates = context.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  if (dates[0]) {
    highlights.push({
      label: `Key date · ${formatShortDate(dates[0])}`,
      tone: "accent",
    });
  }

  const weeks = context.match(/\b(\d+)\s+weeks?\b/i);
  if (weeks) {
    highlights.push({ label: `Duration · ${weeks[1]} weeks`, tone: "default" });
  }

  if (/\btwo technicians\b|\b2 technicians\b/i.test(context)) {
    highlights.push({ label: "Coverage · 2 on sick leave", tone: "warn" });
  }

  if (/\bpart-time\b/i.test(context)) {
    highlights.push({ label: "Ask · part-time return", tone: "accent" });
  }

  if (/\bremote\b/i.test(context) && /\bdays?\/week\b/i.test(context)) {
    highlights.push({ label: "Ask · hybrid exception", tone: "accent" });
  }

  if (/\b11 days\b|\bno update\b/i.test(context)) {
    highlights.push({ label: "SLA · facilities overdue", tone: "warn" });
  }

  if (openQuestions.length > 0) {
    highlights.push({
      label: `${openQuestions.length} open question${openQuestions.length === 1 ? "" : "s"}`,
      tone: "warn",
    });
  }

  return { facts, openQuestions, highlights: highlights.slice(0, 5) };
}

/** Bold dates and durations inside a fact line for HTML rendering. */
export function formatFactHtml(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, '<span class="fact-emphasis">$1</span>');
  html = html.replace(/\b(\d+)\s+(weeks?|days?)\b/gi, '<span class="fact-emphasis">$1 $2</span>');
  html = html.replace(/\b(two|three|\d+)\s+(technicians?|technician)\b/gi, '<span class="fact-emphasis">$1 $2</span>');
  return html;
}
