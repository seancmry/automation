/**
 * Portfolio / README screenshots for the HR AI HITL demo.
 * Prereqs: npm run dev (ODOO_MODE=live), Odoo up, GROQ or Google key set.
 *
 * Usage: node scripts/capture-portfolio.js
 * Output: PORTFOLIO_ASSETS dir (default: scripts/gif-capture/frames) + detail-*.jpg
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { formatNoteHtml, extractDraftSummaryOnly } = require("./portfolio-note-format");

const BASE = process.env.DEMO_URL || "http://127.0.0.1:3000";
const ODOO_LOGIN = process.env.ODOO_URL || "http://localhost:8069/web/login?db=hr_hitl_demo";
const ODOO_PARTNER =
  process.env.ODOO_PARTNER_URL ||
  "http://localhost:8069/web?db=hr_hitl_demo#id=41&model=res.partner&view_type=form";
const ODOO_USER = process.env.ODOO_USERNAME || "admin";
const ODOO_PASS = process.env.ODOO_PASSWORD || "admin";
const SCALE = Number(process.env.PORTFOLIO_SCALE || 2);

const ASSETS = path.resolve(
  __dirname,
  process.env.PORTFOLIO_ASSETS || "gif-capture/frames",
);
const FRAMES = path.join(__dirname, "gif-capture/frames");
const HIGHLIGHT = "#CC0000";

function ensureDirs() {
  fs.mkdirSync(ASSETS, { recursive: true });
  fs.mkdirSync(FRAMES, { recursive: true });
}

function compressPngToJpg(pngPath, jpgPath, quality = 94) {
  execSync(`sips -s format jpeg -s formatOptions ${quality} "${pngPath}" --out "${jpgPath}"`, {
    stdio: "pipe",
  });
}

async function saveViewportShot(page, name) {
  ensureDirs();
  const png = path.join(ASSETS, `${name}.png`);
  const jpg = path.join(ASSETS, `${name}.jpg`);
  await page.screenshot({ path: png, fullPage: false });
  compressPngToJpg(png, jpg);
  fs.copyFileSync(jpg, path.join(FRAMES, `${name}.jpg`));
  fs.unlinkSync(png);
  console.log("saved", jpg);
}

async function saveClipShot(page, name, clip) {
  ensureDirs();
  const png = path.join(ASSETS, `${name}.png`);
  const jpg = path.join(ASSETS, `${name}.jpg`);
  await page.screenshot({
    path: png,
    clip: {
      x: Math.max(0, clip.x),
      y: Math.max(0, clip.y),
      width: clip.width,
      height: clip.height,
    },
  });
  compressPngToJpg(png, jpg);
  fs.copyFileSync(jpg, path.join(FRAMES, `${name}.jpg`));
  fs.unlinkSync(png);
  console.log("saved", jpg);
}

async function highlightLocators(page, selectors) {
  await page.evaluate(
    ({ selectors, color }) => {
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => {
          el.style.outline = `3px solid ${color}`;
          el.style.outlineOffset = "2px";
        });
      }
    },
    { selectors, color: HIGHLIGHT },
  );
}

async function saveRegionShot(page, name, clip, { highlightSelectors = [] } = {}) {
  ensureDirs();
  if (highlightSelectors.length) {
    await highlightLocators(page, highlightSelectors);
    await page.waitForTimeout(80);
  }
  const png = path.join(ASSETS, `${name}.png`);
  const jpg = path.join(ASSETS, `${name}.jpg`);
  await page.screenshot({
    path: png,
    clip: {
      x: Math.max(0, clip.x),
      y: Math.max(0, clip.y),
      width: clip.width,
      height: clip.height,
    },
  });
  compressPngToJpg(png, jpg, 96);
  fs.copyFileSync(jpg, path.join(FRAMES, `${name}.jpg`));
  fs.unlinkSync(png);
  console.log("saved", jpg, `${Math.round(clip.width)}x${Math.round(clip.height)}`);
}

async function saveElementShot(page, locator, name, { highlightSelectors = [] } = {}) {
  ensureDirs();
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  if (highlightSelectors.length) {
    await highlightLocators(page, highlightSelectors);
    await page.waitForTimeout(80);
  }
  const png = path.join(ASSETS, `${name}.png`);
  await locator.screenshot({ path: png });
  const jpg = path.join(ASSETS, `${name}.jpg`);
  compressPngToJpg(png, jpg, 96);
  fs.copyFileSync(jpg, path.join(FRAMES, `${name}.jpg`));
  fs.unlinkSync(png);
  const dims = execSync(`sips -g pixelWidth -g pixelHeight "${jpg}"`, { encoding: "utf8" });
  console.log("saved", jpg, dims.match(/pixelWidth: (\d+)/)?.[1], "x", dims.match(/pixelHeight: (\d+)/)?.[1]);
}

async function captureWorkbench(browser) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: SCALE,
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector('button:has-text("Generate / revise")', { timeout: 20000 });
  await page
    .waitForSelector("text=Case data · Odoo live", { timeout: 15000 })
    .catch(() => console.warn("warn: Odoo live badge not seen — is ODOO_MODE=live?"));
  await page.waitForTimeout(800);

  const caseCard = page.locator(".case-card").first();
  await caseCard.scrollIntoViewIfNeeded();
  const storyLocator = page.locator(".case-story").first();
  await storyLocator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);

  // Zoomed Facts column only — readable in a compact PDF slot.
  const factsCol = page.locator(".case-story-col").first();
  await page.evaluate(() => {
    const col = document.querySelector(".case-story-col");
    if (!col) return;
    const label = col.querySelector(".case-story-label");
    if (label) {
      label.style.fontSize = "1.05rem";
      label.style.marginBottom = "10px";
    }
    const items = [...col.querySelectorAll(".case-facts-compact li")];
    // Three facts at slightly smaller type — subtle zoom-out, still fits compact slot.
    items.forEach((el, i) => {
      if (i >= 3) el.style.display = "none";
      else {
        el.style.fontSize = "1.12rem";
        el.style.lineHeight = "1.4";
        el.style.padding = "9px 11px 9px 10px";
      }
    });
  });
  await page.waitForTimeout(80);
  await saveElementShot(page, factsCol, "detail-step-load");

  const headBox = await page.locator(".case-card-head").first().boundingBox();
  const metaBox = await page.locator("dl.case-meta").first().boundingBox();
  const storyBox = await storyLocator.boundingBox();
  const workflowBox = await page.locator(".case-workflow").first().boundingBox();

  await saveElementShot(page, page.locator("dl.case-meta").first(), "detail-case-meta", {
    highlightSelectors: ["dl.case-meta"],
  });

  const cardBox = await caseCard.boundingBox();
  if (cardBox) {
    const overviewBottom = storyBox
      ? storyBox.y + Math.min(storyBox.height, 180)
      : workflowBox
        ? workflowBox.y + workflowBox.height
        : metaBox
          ? metaBox.y + metaBox.height
          : cardBox.y + Math.min(cardBox.height, 420);
    await saveRegionShot(
      page,
      "detail-overview",
      {
        x: cardBox.x,
        y: cardBox.y,
        width: cardBox.width,
        height: overviewBottom - cardBox.y + 8,
      },
      { highlightSelectors: [".case-badges", "dl.case-meta", ".case-workflow"] },
    );
  }

  await page.getByRole("button", { name: "Generate / revise" }).click();
  await page.waitForSelector("text=AI draft", { timeout: 90000 });
  await page.waitForSelector('button:has-text("Generate / revise"):not([disabled])', {
    timeout: 90000,
  });
  await page.waitForTimeout(1000);

  // Draft strip: formatted preview (not raw textarea markdown) for PDF readability.
  const draftBubble = page.locator("article.bubble.assistant").last();
  await draftBubble.scrollIntoViewIfNeeded();
  const draftRaw = await page
    .locator("article.bubble.assistant textarea.draft-editor")
    .last()
    .inputValue();
  const previewSection = extractDraftSummaryOnly(draftRaw);
  const previewHtml = formatNoteHtml(previewSection);

  await page.evaluate(({ previewHtml }) => {
    const bubble = document.querySelector("article.bubble.assistant:last-of-type");
    const textarea = bubble?.querySelector("textarea.draft-editor");
    if (!bubble || !textarea) return;

    textarea.style.display = "none";

    let mount = bubble.querySelector(".portfolio-capture-draft");
    if (!mount) {
      mount = document.createElement("div");
      mount.className = "portfolio-capture-draft";
      textarea.after(mount);
    }

    mount.innerHTML = `
      <div class="portfolio-capture-draft-head">
        <span class="portfolio-capture-draft-title">AI draft</span>
        <span class="portfolio-capture-draft-tag">Internal case note</span>
      </div>
      <div class="content note-formatted portfolio-capture-draft-body">${previewHtml}</div>
    `;

    Object.assign(mount.style, {
      display: "grid",
      gap: "0",
    });

    const head = mount.querySelector(".portfolio-capture-draft-head");
    if (head) head.style.display = "none";

    const body = mount.querySelector(".portfolio-capture-draft-body");
    if (body) {
      Object.assign(body.style, {
        fontSize: "1.12rem",
        lineHeight: "1.44",
        padding: "8px 12px",
        maxWidth: "420px",
        borderRadius: "8px",
        border: "1px solid rgba(13, 148, 136, 0.35)",
        background: "rgba(0, 0, 0, 0.28)",
      });
    }

    const summaryBlock = mount.querySelector(".note-block");
    if (summaryBlock) {
      const heading = summaryBlock.querySelector(".note-heading");
      let text = summaryBlock.textContent.replace(/^Summary\s*/i, "").trim();
      const sentences = text.split(/(?<=\.)\s+(?=[A-Z][a-z])/).map((s) => s.trim()).filter(Boolean);
      const clipped = (sentences[0] || text).trim();
      if (heading) {
        summaryBlock.innerHTML = `${heading.outerHTML}<span class="portfolio-capture-summary-text">${clipped}</span>`;
      }
      const textSpan = summaryBlock.querySelector(".portfolio-capture-summary-text");
      if (textSpan) {
        Object.assign(textSpan.style, {
          display: "block",
          fontSize: "1.46rem",
          lineHeight: "1.3",
          color: "#f1f5f9",
        });
      }
    }

    mount.querySelectorAll(".note-heading").forEach((el) => {
      Object.assign(el.style, {
        fontSize: "1.1rem",
        fontWeight: "650",
        color: "#f8fafc",
        marginBottom: "6px",
      });
    });

    mount.querySelectorAll(".note-bullet").forEach((el) => {
      el.style.display = "none";
    });
  }, { previewHtml });

  await page.waitForTimeout(150);

  const bodyTarget = page.locator(".portfolio-capture-draft-body").last();
  if (await bodyTarget.isVisible().catch(() => false)) {
    await saveElementShot(page, bodyTarget, "detail-draft");
  } else {
    const fallback = page.locator(".portfolio-capture-draft").last();
    await saveElementShot(page, fallback, "detail-draft");
  }

  await page.getByRole("button", { name: "Approve & write to Odoo" }).click();
  await page.waitForSelector(".write-banner", { timeout: 30000 });
  await page.waitForTimeout(500);

  const hitlHead = await page.locator("section.hitl .hitl-head").first().boundingBox();
  const actionsBox = await page.locator("section.hitl .actions").first().boundingBox();
  const bannerBox = await page.locator(".write-banner").first().boundingBox();
  if (hitlHead && actionsBox) {
    const y0 = hitlHead.y - 4;
    const y1 = (bannerBox ? bannerBox.y + bannerBox.height : actionsBox.y + actionsBox.height) + 4;
    await saveRegionShot(
      page,
      "detail-eval-hitl",
      {
        x: hitlHead.x - 4,
        y: y0,
        width: hitlHead.width + 8,
        height: y1 - y0,
      },
      {
        highlightSelectors: [
          "section.hitl .hitl-head",
          "section.hitl .flags",
          "section.hitl .actions .approve",
          ".write-banner",
        ],
      },
    );
  }

  // Compact write confirmation (banner only — raw JSON lives in Telemetry)
  if (bannerBox && bannerBox.width > 0 && bannerBox.height > 0) {
    await saveRegionShot(
      page,
      "detail-write-result",
      {
        x: bannerBox.x - 4,
        y: bannerBox.y - 4,
        width: bannerBox.width + 8,
        height: bannerBox.height + 8,
      },
      { highlightSelectors: [".write-banner"] },
    );
  }

  await page.locator(".telemetry-trigger").click();
  await page.waitForSelector(".telemetry-drawer.open", { timeout: 5000 });
  await page.waitForTimeout(400);
  const payloadSection = page.locator(".telemetry-section").filter({ hasText: "Last write payload" }).first();
  if (await payloadSection.isVisible().catch(() => false)) {
    await saveElementShot(page, payloadSection, "detail-write-payload", {
      highlightSelectors: [".telemetry-section pre.result"],
    });
  }
  await saveElementShot(
    page,
    page.locator(".telemetry-drawer .telemetry-section").nth(1),
    "detail-telemetry",
    { highlightSelectors: [".telemetry-drawer .telemetry-section:nth-of-type(2) .telemetry-grid"] },
  );
  await saveViewportShot(page, "grid-telemetry");
  await page.locator(".telemetry-close").click();
  await page.waitForTimeout(300);

  // Legacy full-section shots (fallback / archive)
  await page.locator("section.context .case-card").first().scrollIntoViewIfNeeded().catch(() => {});
  const caseCardLegacy = page.locator("section.context .case-card").first();
  const caseBox = await caseCardLegacy.boundingBox();
  if (caseBox && caseBox.width > 0 && caseBox.height > 0) {
    await saveClipShot(page, "hero-case", {
      x: caseBox.x - 8,
      y: caseBox.y - 8,
      width: caseBox.width + 16,
      height: Math.min(caseBox.height + 16, 700),
    });
  }

  await page.locator("section.hitl").first().scrollIntoViewIfNeeded().catch(() => {});
  const hitlLegacy = page.locator("section.hitl").first();
  const hitlBoxLegacy = await hitlLegacy.boundingBox();
  if (hitlBoxLegacy && hitlBoxLegacy.width > 0 && hitlBoxLegacy.height > 0) {
    await saveClipShot(page, "hero-write", {
      x: hitlBoxLegacy.x - 8,
      y: hitlBoxLegacy.y - 8,
      width: hitlBoxLegacy.width + 16,
      height: Math.min(hitlBoxLegacy.height + 16, 400),
    });
  }

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Case data · Odoo live", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  await saveViewportShot(page, "grid-overview");

  await page.close();
}

async function captureOdoo(browser) {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: SCALE,
  });
  await page.goto(ODOO_LOGIN, { waitUntil: "networkidle", timeout: 30000 });

  const loginInput = page.locator('input[name="login"]');
  if (await loginInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginInput.fill(ODOO_USER);
    await page.locator('input[name="password"]').fill(ODOO_PASS);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/web#|web\/login/, { timeout: 30000 });
  }

  await page.goto(ODOO_PARTNER, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);

  const caseGroup = page.locator(".o_inner_group").filter({ hasText: "Case ref" }).first();
  const hasCaseGroup = await caseGroup.isVisible({ timeout: 8000 }).catch(() => false);
  if (hasCaseGroup) {
    await caseGroup.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const fields = caseGroup.locator(".o_wrap_field");
    const fieldCount = await fields.count();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = 0;
    let maxY = 0;

    for (let i = 0; i < fieldCount; i += 1) {
      const box = await fields.nth(i).boundingBox();
      if (!box) continue;
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    }

    if (fieldCount > 0 && maxX > minX && maxY > minY) {
      await saveRegionShot(
        page,
        "detail-odoo-case",
        {
          x: minX - 8,
          y: minY - 6,
          width: maxX - minX + 16,
          height: maxY - minY + 4,
        },
        { highlightSelectors: [] },
      );
    } else {
      await saveElementShot(page, caseGroup, "detail-odoo-case", { highlightSelectors: [] });
    }
  } else {
    const fallback = page.locator(".o_form_sheet").first();
    if (await fallback.isVisible({ timeout: 3000 }).catch(() => false)) {
      const sheet = await fallback.boundingBox();
      if (sheet) {
        await saveRegionShot(page, "detail-odoo-case", {
          x: sheet.x,
          y: sheet.y + sheet.height * 0.45,
          width: sheet.width,
          height: sheet.height * 0.42,
        });
      }
    }
  }

  await saveViewportShot(page, "grid-odoo");
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    await captureWorkbench(browser);
    await captureOdoo(browser).catch((err) => {
      console.warn("Odoo capture skipped:", err.message);
    });
    console.log("Portfolio assets ready in", ASSETS, `(scale ${SCALE}x)`);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
