const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "frames");
const BASE = process.env.DEMO_URL || "http://127.0.0.1:3000";

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("shot", file);
  return file;
}

(async () => {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=ui: ready", { timeout: 15000 });
  await shot(page, "01-ready");

  await page.getByRole("button", { name: "Generate / revise" }).click();
  await page.waitForTimeout(400);
  await shot(page, "02-drafting");

  await page.waitForSelector("text=AI draft", { timeout: 60000 });
  // wait until drafting button returns
  await page.waitForSelector('button:has-text("Generate / revise")', { timeout: 60000 });
  await page.waitForTimeout(600);
  await shot(page, "03-draft");

  const approve = page.getByRole("button", { name: "Approve & write to Odoo" });
  await approve.click();
  await page.waitForSelector("text=mock-writes", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, "04-written");

  await browser.close();
  console.log("done frames");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
