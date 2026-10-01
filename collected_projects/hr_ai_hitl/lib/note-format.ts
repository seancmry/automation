/** Escape text for safe HTML insertion. */
export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** Workbench UI: class-based blocks for app CSS. */
export function formatNoteHtml(raw: string): string {
  return raw
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((line) => {
        const heading = line.match(/^\*\*(.+?)\*\*\s*$/);
        if (heading) {
          return `<div class="note-heading">${escapeHtml(heading[1])}</div>`;
        }
        const bullet = line.match(/^[-*]\s+(.+)$/);
        if (bullet) {
          return `<div class="note-bullet">${inlineMarkdown(bullet[1])}</div>`;
        }
        const numbered = line.match(/^\d+\.\s+(.+)$/);
        if (numbered) {
          return `<div class="note-bullet numbered">${inlineMarkdown(numbered[1])}</div>`;
        }
        return inlineMarkdown(line);
      });
      return `<div class="note-block">${lines.join("")}</div>`;
    })
    .join("");
}

/** Odoo chatter: semantic HTML Odoo mail can render without app CSS. */
export function formatNoteOdooHtml(raw: string): string {
  const blocks = raw.split(/\n{2,}/);
  const parts: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    let listOpen = false;

    const flushList = () => {
      if (listOpen) {
        parts.push("</ul>");
        listOpen = false;
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const heading = trimmed.match(/^\*\*(.+?)\*\*\s*$/);
      if (heading) {
        flushList();
        parts.push(
          `<h4 style="margin:14px 0 6px;font-size:14px;font-weight:600;color:#111;">${escapeHtml(heading[1])}</h4>`,
        );
        continue;
      }

      const bullet = trimmed.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        if (!listOpen) {
          parts.push('<ul style="margin:0 0 10px 18px;padding:0;">');
          listOpen = true;
        }
        parts.push(`<li style="margin-bottom:4px;">${inlineMarkdown(bullet[1])}</li>`);
        continue;
      }

      const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
      if (numbered) {
        flushList();
        parts.push(`<p style="margin:0 0 6px 18px;">${inlineMarkdown(numbered[1])}</p>`);
        continue;
      }

      flushList();
      parts.push(`<p style="margin:0 0 8px;line-height:1.45;">${inlineMarkdown(trimmed)}</p>`);
    }

    flushList();
  }

  return parts.join("");
}

export function formatOdooChatterHtml(input: {
  caseId: string;
  caseTitle: string;
  employeeLabel: string;
  approvedBy: string;
  noteBody: string;
}): string {
  const header = [
    '<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #dee2e6;">',
    `<p style="margin:0 0 4px;"><strong>HR case:</strong> ${escapeHtml(input.caseTitle)}</p>`,
    `<p style="margin:0 0 4px;"><strong>Employee:</strong> ${escapeHtml(input.employeeLabel)}</p>`,
    `<p style="margin:0 0 4px;"><strong>Approved by:</strong> ${escapeHtml(input.approvedBy)}</p>`,
    `<p style="margin:0;font-size:12px;color:#6c757d;"><strong>Case ref:</strong> ${escapeHtml(input.caseId)}</p>`,
    "</div>",
  ].join("");

  return `${header}${formatNoteOdooHtml(input.noteBody)}`;
}

/** Plain-text fallback for mock writes / logs. */
export function formatOdooChatterPlain(input: {
  caseId: string;
  caseTitle: string;
  employeeLabel: string;
  approvedBy: string;
  noteBody: string;
}): string {
  return [
    `HR case: ${input.caseTitle}`,
    `Employee: ${input.employeeLabel}`,
    `Approved by: ${input.approvedBy}`,
    `Case ref: ${input.caseId}`,
    "",
    input.noteBody,
  ].join("\n");
}
