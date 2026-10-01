/**
 * CI golden fixture — eval heuristics must pass on a known-good draft.
 */
import { evaluateHrNote, evalSummary } from "../lib/eval";

const GOLDEN_DRAFT = `Summary
Employee requested parental leave; Line B coverage is tight.

Facts
- Leave start 2026-09-15, 8 weeks requested.
- Two technicians already on long-term sick leave.

Recommended next steps
- HRBP review policy on unpaid extension.
- Confirm contractor requisition status with ops.

Risks / compliance flags
- Coverage risk on Line B if leave overlaps peak volume.`;

const result = evalSummary(evaluateHrNote(GOLDEN_DRAFT));

if (!result.pass) {
  console.error("eval:check failed:", result.notes);
  process.exit(1);
}

console.log("eval:check passed");
