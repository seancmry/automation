import { generateText } from "ai";
import { HR_NOTE_SYSTEM_PROMPT } from "@/lib/prompts";
import { resolveModel } from "@/lib/model";
import type { GenerationTelemetry, TokenUsage } from "@/lib/telemetry";

export const maxDuration = 30;

function fallbackDraft(caseContext?: string): string {
  const ctx = (caseContext || "No case context provided.").trim();
  return [
    "Summary",
    "Draft generated in offline/fallback mode because the LLM provider call failed or is unavailable. Review carefully before any system write.",
    "",
    "Facts (from case context only)",
    ctx,
    "",
    "Recommended next steps",
    "1. Confirm missing documentation / policy inputs listed as open questions.",
    "2. Align with manager and HRBP on exception vs standard path.",
    "3. Record decision and owners after human approval.",
    "",
    "Risks / compliance flags",
    "- Do not invent policy outcomes.",
    "- Human approval required before write-back to the system of record.",
    "",
    "Open questions",
    "- Any facts not explicit in the case context above.",
  ].join("\n");
}

function toUsage(usage?: {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}): TokenUsage | undefined {
  if (!usage) return undefined;
  return {
    promptTokens: usage.promptTokens ?? 0,
    completionTokens: usage.completionTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

export async function GET() {
  return Response.json(
    {
      ok: false,
      hint: "POST JSON to this route from the workbench at http://localhost:3000",
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages?: { role: "user" | "assistant" | "system"; content: string }[];
      caseContext?: string;
    };

    const messages = body.messages ?? [];
    const caseContext = body.caseContext;
    const started = Date.now();

    try {
      const { model, provider, modelId } = resolveModel();
      const result = await generateText({
        model,
        system: [
          HR_NOTE_SYSTEM_PROMPT,
          caseContext
            ? `\n\nCASE CONTEXT (source of truth — do not invent beyond this):\n${caseContext}`
            : "",
        ].join(""),
        messages,
      });

      const text = result.text.trim();
      const latencyMs = Date.now() - started;
      const telemetry: GenerationTelemetry = {
        kind: "generation",
        at: new Date().toISOString(),
        provider,
        modelId,
        latencyMs,
        fallback: false,
        finishReason: result.finishReason,
        usage: toUsage(result.usage),
        draftWords: text.split(/\s+/).filter(Boolean).length,
      };

      return Response.json({
        text,
        provider,
        modelId,
        fallback: false,
        telemetry,
      });
    } catch (providerErr) {
      const warning =
        providerErr instanceof Error ? providerErr.message : "Provider call failed";
      console.error("[api/chat] provider error:", warning);

      const text = fallbackDraft(caseContext);
      const latencyMs = Date.now() - started;
      const telemetry: GenerationTelemetry = {
        kind: "generation",
        at: new Date().toISOString(),
        provider: "fallback",
        modelId: "offline-template",
        latencyMs,
        fallback: true,
        draftWords: text.split(/\s+/).filter(Boolean).length,
        warning,
      };

      return Response.json({
        text,
        provider: "fallback",
        modelId: "offline-template",
        fallback: true,
        warning,
        telemetry,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("[api/chat]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
