import { promises as fs } from "fs";
import path from "path";
import type { HrCaseRecord } from "@/data/hr-cases";
import { HR_CASES, HR_DEMO_STAFF } from "@/data/hr-cases";
import {
  authenticate,
  executeKw,
  jsonRpc,
  odooConfigFromEnv,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import {
  formatOdooChatterHtml,
  formatOdooChatterPlain,
} from "@/lib/note-format";

const PARTNER_CASE_FIELDS = [
  "id",
  "name",
  "ref",
  "email",
  "phone",
  "function",
  "comment",
  "x_hr_case_ref",
  "x_hr_case_title",
  "x_hr_case_status",
  "x_hr_case_priority",
  "x_hr_case_context",
  "x_hr_case_opened",
  "x_hr_department",
  "x_hr_manager",
  "x_hr_site",
] as const;

type OdooPartnerRow = {
  id: number;
  name: string;
  ref: string | false;
  email: string | false;
  phone: string | false;
  function: string | false;
  comment: string | false;
  x_hr_case_ref?: string | false;
  x_hr_case_title?: string | false;
  x_hr_case_status?: HrCaseRecord["status"] | false;
  x_hr_case_priority?: HrCaseRecord["priority"] | false;
  x_hr_case_context?: string | false;
  x_hr_case_opened?: string | false;
  x_hr_department?: string | false;
  x_hr_manager?: string | false;
  x_hr_site?: string | false;
};

function str(v: string | false | undefined, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function partnerToCase(staticCase: HrCaseRecord, row: OdooPartnerRow): HrCaseRecord {
  const ctx =
    str(row.x_hr_case_context, "") ||
    (typeof row.comment === "string" && row.comment.trim()) ||
    staticCase.context;

  return {
    ...staticCase,
    employeeName: row.name || staticCase.employeeName,
    employee: row.name
      ? `${row.name}${row.function ? ` (${row.function})` : ""}`
      : staticCase.employee,
    title: str(row.x_hr_case_title, staticCase.title),
    context: ctx,
    department: str(row.x_hr_department, staticCase.department),
    manager: str(row.x_hr_manager, staticCase.manager),
    site: str(row.x_hr_site, staticCase.site),
    email: str(row.email, staticCase.email),
    phone: str(row.phone, staticCase.phone),
    status: row.x_hr_case_status || staticCase.status,
    priority: row.x_hr_case_priority || staticCase.priority,
    openedOn: str(row.x_hr_case_opened, staticCase.openedOn),
  };
}

export async function ensurePartnerTag(cfg: OdooConfig, uid: number): Promise<number> {
  const tagName = "HR Demo Case";
  const found = await executeKw<{ id: number }[]>(
    cfg,
    uid,
    "res.partner.category",
    "search_read",
    [[["name", "=", tagName]]],
    { fields: ["id"], limit: 1 },
  );
  if (found[0]) return found[0].id;
  return executeKw<number>(cfg, uid, "res.partner.category", "create", [{ name: tagName }]);
}

export type OdooWriteResult = {
  mode: "mock" | "live";
  ok: boolean;
  message: string;
  externalId?: string | number;
  payload: Record<string, unknown>;
};

export type HrNoteWriteInput = {
  caseId: string;
  caseTitle: string;
  employeeLabel: string;
  noteBody: string;
  approvedBy: string;
};

export type OdooCaseMapEntry = {
  partnerId: number;
  partnerName: string;
  odooUrl: string;
};

export type OdooCaseMap = Record<string, OdooCaseMapEntry>;

const CASE_MAP_FILE = path.join(process.cwd(), "data", "odoo-case-map.json");

function mode(): "mock" | "live" {
  return process.env.ODOO_MODE === "live" ? "live" : "mock";
}

function odooWebUrl(cfg: OdooConfig, hash: string): string {
  const base = cfg.url.replace(/\/$/, "");
  return `${base}/web?db=${encodeURIComponent(cfg.db)}#${hash}`;
}

export async function loadCaseMap(): Promise<OdooCaseMap | null> {
  try {
    return JSON.parse(await fs.readFile(CASE_MAP_FILE, "utf8")) as OdooCaseMap;
  } catch {
    return null;
  }
}

async function mockWrite(input: HrNoteWriteInput): Promise<OdooWriteResult> {
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "mock-writes.json");
  await fs.mkdir(dir, { recursive: true });

  let existing: unknown[] = [];
  try {
    existing = JSON.parse(await fs.readFile(file, "utf8")) as unknown[];
  } catch {
    existing = [];
  }

  const record = {
    id: `mock-${Date.now()}`,
    writtenAt: new Date().toISOString(),
    model: "mail.message",
    bodyPlain: formatOdooChatterPlain(input),
    ...input,
  };
  existing.push(record);
  await fs.writeFile(file, JSON.stringify(existing, null, 2));

  return {
    mode: "mock",
    ok: true,
    message: "Saved to data/mock-writes.json (no Odoo required).",
    externalId: record.id,
    payload: record,
  };
}

async function resolvePartnerId(
  cfg: OdooConfig,
  uid: number,
  caseId: string,
): Promise<{ partnerId: number; partnerName: string }> {
  const map = await loadCaseMap();
  const mapped = map?.[caseId];
  if (mapped?.partnerId) {
    return { partnerId: mapped.partnerId, partnerName: mapped.partnerName };
  }

  const found = await executeKw<
    { id: number; name: string }[]
  >(cfg, uid, "res.partner", "search_read", [[["ref", "=", caseId]]], {
    fields: ["id", "name"],
    limit: 1,
  });

  if (found[0]) {
    return { partnerId: found[0].id, partnerName: found[0].name };
  }

  const fallback = Number(process.env.ODOO_DEFAULT_PARTNER_ID || "0");
  if (fallback > 0) {
    return { partnerId: fallback, partnerName: `res.partner/${fallback}` };
  }

  throw new Error(
    `No Odoo partner for case "${caseId}". Run: npm run odoo:seed`,
  );
}

async function liveWrite(input: HrNoteWriteInput): Promise<OdooWriteResult> {
  const cfg = odooConfigFromEnv();
  const uid = await authenticate(cfg);
  const { partnerId, partnerName } = await resolvePartnerId(cfg, uid, input.caseId);

  const bodyHtml = formatOdooChatterHtml(input);
  const bodyPlain = formatOdooChatterPlain(input);

  const messageId = await executeKw<number>(
    cfg,
    uid,
    "res.partner",
    "message_post",
    [[partnerId]],
    {
      body: bodyHtml,
      message_type: "comment",
      subtype_xmlid: "mail.mt_note",
    },
  );

  const partnerUrl = odooWebUrl(cfg, `id=${partnerId}&model=res.partner&view_type=form`);

  return {
    mode: "live",
    ok: true,
    message: `Wrote mail.message #${messageId} on ${partnerName} (res.partner/${partnerId}).`,
    externalId: messageId,
    payload: { partnerId, partnerName, messageId, partnerUrl, bodyPlain, bodyHtml },
  };
}

export async function writeHrNote(input: HrNoteWriteInput): Promise<OdooWriteResult> {
  if (mode() === "live") {
    return liveWrite(input);
  }
  return mockWrite(input);
}

export async function fetchOdooCase(caseId: string): Promise<{
  case: HrCaseRecord;
  partnerId?: number;
  partnerUrl?: string;
  source: "odoo" | "static";
} | null> {
  const staticCase = HR_CASES.find((c) => c.id === caseId);
  if (!staticCase) return null;

  if (mode() !== "live") {
    return { case: staticCase, source: "static" };
  }

  try {
    const cfg = odooConfigFromEnv();
    const uid = await authenticate(cfg);
    const rows = await executeKw<OdooPartnerRow[]>(
      cfg,
      uid,
      "res.partner",
      "search_read",
      [[["ref", "=", caseId]]],
      {
        fields: [...PARTNER_CASE_FIELDS],
        limit: 1,
      },
    );

    const row = rows[0];
    if (!row) {
      return { case: staticCase, source: "static" };
    }

    const partnerUrl = odooWebUrl(cfg, `id=${row.id}&model=res.partner&view_type=form`);
    return {
      case: partnerToCase(staticCase, row),
      partnerId: row.id,
      partnerUrl,
      source: "odoo",
    };
  } catch {
    return { case: staticCase, source: "static" };
  }
}

export async function odooHealth(): Promise<{
  mode: "mock" | "live";
  ok: boolean;
  detail: string;
  odooVersion?: string;
  seededCases?: number;
}> {
  if (mode() === "mock") {
    return {
      mode: "mock",
      ok: true,
      detail: "Mock mode. Writes go to data/mock-writes.json.",
    };
  }
  try {
    const cfg = odooConfigFromEnv();
    const version = await jsonRpc(cfg.url, "common", "version", []);
    const map = await loadCaseMap();
    const seededCases = map ? Object.keys(map).length : 0;
    const rawVersion =
      version && typeof version === "object" && "server_version" in version
        ? String((version as { server_version?: string }).server_version ?? "")
        : "";
    const odooVersion = rawVersion.split("-")[0] || rawVersion || "unknown";
    return {
      mode: "live",
      ok: true,
      detail: "Connected to local Odoo.",
      odooVersion,
      seededCases,
    };
  } catch (err) {
    return {
      mode: "live",
      ok: false,
      detail: err instanceof Error ? err.message : "Unknown Odoo error",
    };
  }
}

/** Used by seed script — create/update partner per HR case. */
export async function upsertHrCasePartner(
  cfg: OdooConfig,
  uid: number,
  hrCase: HrCaseRecord,
  tagId?: number,
): Promise<OdooCaseMapEntry> {
  const existing = await executeKw<{ id: number; name: string }[]>(
    cfg,
    uid,
    "res.partner",
    "search_read",
    [[["ref", "=", hrCase.id]]],
    { fields: ["id", "name"], limit: 1 },
  );

  const values: Record<string, unknown> = {
    name: hrCase.employeeName,
    function: hrCase.department,
    ref: hrCase.id,
    email: hrCase.email,
    phone: hrCase.phone,
    type: "contact",
    comment: [`HR case: ${hrCase.title}`, `Case ref: ${hrCase.id}`, "", hrCase.context].join(
      "\n",
    ),
    x_hr_case_ref: hrCase.id,
    x_hr_case_title: hrCase.title,
    x_hr_case_status: hrCase.status,
    x_hr_case_priority: hrCase.priority,
    x_hr_case_context: hrCase.context,
    x_hr_case_opened: hrCase.openedOn,
    x_hr_department: hrCase.department,
    x_hr_manager: hrCase.manager,
    x_hr_site: hrCase.site,
  };

  if (tagId) {
    values.category_id = [[6, 0, [tagId]]];
  }

  let partnerId: number;
  let partnerName: string;

  if (existing[0]) {
    partnerId = existing[0].id;
    partnerName = existing[0].name;
    await executeKw(cfg, uid, "res.partner", "write", [[partnerId], values]);
  } else {
    partnerId = await executeKw<number>(cfg, uid, "res.partner", "create", [values]);
    partnerName = hrCase.employeeName;
  }

  return {
    partnerId,
    partnerName,
    odooUrl: odooWebUrl(cfg, `id=${partnerId}&model=res.partner&view_type=form`),
  };
}

export async function upsertStaffPartner(
  cfg: OdooConfig,
  uid: number,
  staff: (typeof HR_DEMO_STAFF)[number],
): Promise<void> {
  const existing = await executeKw<{ id: number }[]>(
    cfg,
    uid,
    "res.partner",
    "search_read",
    [[["ref", "=", staff.ref]]],
    { fields: ["id"], limit: 1 },
  );

  const values = {
    name: staff.name,
    ref: staff.ref,
    function: staff.function,
    email: staff.email,
    type: "contact",
  };

  if (existing[0]) {
    await executeKw(cfg, uid, "res.partner", "write", [[existing[0].id], values]);
  } else {
    await executeKw(cfg, uid, "res.partner", "create", [values]);
  }
}

const INTAKE_MARKER = "[demo-intake]";

/** One historical manager note per case so Odoo chatter is not empty on first open. */
export async function ensureDemoIntakeNote(
  cfg: OdooConfig,
  uid: number,
  partnerId: number,
  hrCase: HrCaseRecord,
): Promise<void> {
  const existing = await executeKw<{ id: number }[]>(
    cfg,
    uid,
    "mail.message",
    "search_read",
    [
      [
        ["model", "=", "res.partner"],
        ["res_id", "=", partnerId],
        ["body", "ilike", INTAKE_MARKER],
      ],
    ],
    { fields: ["id"], limit: 1 },
  );
  if (existing[0]) return;

  const body = [
    INTAKE_MARKER,
    `Case opened: ${hrCase.openedOn}`,
    `Priority: ${hrCase.priority} · Status: ${hrCase.status}`,
    `Manager: ${hrCase.manager}`,
    "",
    "Manager intake (demo seed):",
    hrCase.context.split("\n")[0] ?? hrCase.title,
    "",
    "Awaiting HRBP case note via HITL workbench.",
  ].join("\n");

  await executeKw<number>(cfg, uid, "res.partner", "message_post", [[partnerId]], {
    body,
    message_type: "comment",
    subtype_xmlid: "mail.mt_note",
  });
}

export async function saveCaseMap(map: OdooCaseMap): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CASE_MAP_FILE, JSON.stringify(map, null, 2));
}
