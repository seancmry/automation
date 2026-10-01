import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateHrNote, evalSummary } from "@/lib/eval";
import { writeHrNote } from "@/lib/odoo";

const Body = z.object({
  approved: z.literal(true),
  caseId: z.string().min(1),
  caseTitle: z.string().min(1),
  employeeLabel: z.string().min(1),
  noteBody: z.string().min(20),
  approvedBy: z.string().min(1).default("hrbp-demo"),
});

/**
 * HITL gate: refuses to write unless approved === true.
 * Runs a cheap heuristic eval before write-back (demo of monitoring mindset).
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = Body.parse(json);

    const flags = evaluateHrNote(body.noteBody);
    const summary = evalSummary(flags);

    // Soft block on the most dangerous demo failure mode: claiming a write already happened.
    if (flags.claimsSystemWrite) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          reason: "Draft claims a system write. Edit the note, then approve again.",
          eval: summary,
        },
        { status: 400 },
      );
    }

    const result = await writeHrNote({
      caseId: body.caseId,
      caseTitle: body.caseTitle,
      employeeLabel: body.employeeLabel,
      noteBody: body.noteBody,
      approvedBy: body.approvedBy,
    });

    return NextResponse.json({
      ok: true,
      result,
      eval: summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Write failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
