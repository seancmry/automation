/** Shared note HTML formatter for portfolio capture (mirrors lib/note-format.ts). */

function escapeHtml(raw) {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function formatNoteHtml(raw) {
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

/** Summary block only — readable portfolio crop. */
function extractDraftSummaryOnly(raw) {
  const blocks = raw.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const summaryIdx = blocks.findIndex((b) => /^\*\*Summary\*\*/.test(b));
  if (summaryIdx === -1) return blocks[0] || raw;
  return blocks[summaryIdx];
}

/** Summary + Facts blocks only — readable portfolio crop. */
function extractDraftPreviewSection(raw) {
  const blocks = raw.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const summaryIdx = blocks.findIndex((b) => /^\*\*Summary\*\*/.test(b));
  if (summaryIdx === -1) return blocks.slice(0, 2).join("\n\n");
  const picked = blocks.slice(summaryIdx, summaryIdx + 2);
  return picked.join("\n\n");
}

module.exports = { formatNoteHtml, extractDraftPreviewSection, extractDraftSummaryOnly };
