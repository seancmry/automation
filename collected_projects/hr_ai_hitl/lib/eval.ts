/**
 * Lightweight evaluation helpers — demo of an eval mindset
 * without pretending to be a full LLMOps platform.
 */

export type EvalFlags = {
  inventedPolicyLanguage: boolean;
  missingStructure: boolean;
  tooLong: boolean;
  claimsSystemWrite: boolean;
};

const POLICY_GUESS =
  /\b(always|never|must|company policy (states|says)|as per policy)\b/i;
const STRUCTURE =
  /summary|recommended next steps|open questions|risks/i;
const WRITE_CLAIM =
  /\b(I have (saved|written|logged|updated)|note has been (saved|written))\b/i;

export function evaluateHrNote(note: string): EvalFlags {
  return {
    inventedPolicyLanguage: POLICY_GUESS.test(note) && !/open questions/i.test(note),
    missingStructure: !STRUCTURE.test(note),
    tooLong: note.split(/\s+/).length > 350,
    claimsSystemWrite: WRITE_CLAIM.test(note),
  };
}

export function evalSummary(flags: EvalFlags): { pass: boolean; notes: string[] } {
  const notes: string[] = [];
  if (flags.inventedPolicyLanguage) notes.push("Possible invented/overconfident policy language");
  if (flags.missingStructure) notes.push("Missing expected headings (Summary / next steps / questions)");
  if (flags.tooLong) notes.push("Note is very long for an HRBP skim");
  if (flags.claimsSystemWrite) notes.push("Draft claims a system write — HITL not reflected");
  return { pass: notes.length === 0, notes };
}
