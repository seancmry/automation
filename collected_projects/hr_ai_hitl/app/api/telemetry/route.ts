import { NextResponse } from "next/server";
import { resolveModel } from "@/lib/model";

/**
 * Lightweight runtime snapshot for the telemetry panel (no secrets).
 */
export async function GET() {
  try {
    const { provider, modelId } = resolveModel();
  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    provider,
    modelId,
    odooMode: process.env.ODOO_MODE || "mock",
    aiProviderEnv: process.env.AI_PROVIDER || "(auto)",
    nodeEnv: process.env.NODE_ENV || "development",
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Config error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
