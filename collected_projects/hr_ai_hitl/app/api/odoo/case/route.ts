import { NextResponse } from "next/server";
import { fetchOdooCase } from "@/lib/odoo";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id=case-ref" }, { status: 400 });
  }

  const data = await fetchOdooCase(id);
  if (!data) {
    return NextResponse.json({ error: "Unknown case" }, { status: 404 });
  }

  return NextResponse.json(data);
}
