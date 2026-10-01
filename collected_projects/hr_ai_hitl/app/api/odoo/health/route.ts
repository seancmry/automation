import { NextResponse } from "next/server";
import { odooHealth } from "@/lib/odoo";

export async function GET() {
  const health = await odooHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
