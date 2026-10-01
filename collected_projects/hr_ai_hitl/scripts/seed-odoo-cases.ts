/**
 * Seed Odoo contacts for HR demo cases + staff (ref = case id).
 * Requires hr_demo_case module: npm run odoo:install-module
 */
import { config } from "dotenv";
import path from "path";
import { HR_CASES, HR_DEMO_STAFF } from "../data/hr-cases";
import { authenticate, odooConfigFromEnv } from "../lib/odoo-rpc";
import {
  ensureDemoIntakeNote,
  ensurePartnerTag,
  saveCaseMap,
  upsertHrCasePartner,
  upsertStaffPartner,
  type OdooCaseMap,
} from "../lib/odoo";

config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  if (process.env.ODOO_MODE !== "live") {
    console.warn("Tip: set ODOO_MODE=live in .env.local before seeding.");
  }

  const cfg = odooConfigFromEnv();
  console.log(`Connecting to ${cfg.url} (db: ${cfg.db}) …`);
  const uid = await authenticate(cfg);
  console.log(`Authenticated as uid ${uid}`);

  const tagId = await ensurePartnerTag(cfg, uid);
  console.log(`Tag: HR Demo Case (id ${tagId})`);

  for (const staff of HR_DEMO_STAFF) {
    await upsertStaffPartner(cfg, uid, staff);
    console.log(`  ✓ staff ${staff.ref} → ${staff.name}`);
  }

  const map: OdooCaseMap = {};

  for (const hrCase of HR_CASES) {
    const entry = await upsertHrCasePartner(cfg, uid, hrCase, tagId);
    await ensureDemoIntakeNote(cfg, uid, entry.partnerId, hrCase);
    map[hrCase.id] = entry;
    console.log(`  ✓ ${hrCase.id} → res.partner/${entry.partnerId} (${entry.partnerName})`);
    console.log(`    ${entry.odooUrl}`);
  }

  await saveCaseMap(map);
  console.log("\nSaved data/odoo-case-map.json");
  console.log("Odoo: Contacts → open a case contact → HR case section + Case details field.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  if (String(err).includes("x_hr_case")) {
    console.error("\nRun first: npm run odoo:install-module");
  }
  process.exit(1);
});
