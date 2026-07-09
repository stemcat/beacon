/** Visual QA for the v0.2 features. Usage: node scripts/screenshot-v2.mjs [outDir] */
import { chromium } from "playwright-core";

const BASE = "http://localhost:4173";
const outDir = process.argv[2] ?? "screenshots";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 } });
const page = await ctx.newPage();

// 1. French home (language switcher via localStorage)
await page.goto(`${BASE}/#/`);
await page.evaluate(() => localStorage.setItem("beacon.lang", "fr"));
await page.reload();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/home-fr.png` });
console.log("📸 home-fr");

// 2. Spanish results with expansion note + watch button ("skin cancer" lay term)
await page.evaluate(() => localStorage.setItem("beacon.lang", "es"));
await page.goto(`${BASE}/#/results?cond=skin%20cancer&lat=45.5017&lng=-73.5673&loc=Montreal&radius=100`);
await page.reload(); // re-init i18n from localStorage
await page.waitForSelector(".trial-card", { timeout: 20000 });
await page.screenshot({ path: `${outDir}/results-es-expansion.png` });
console.log("📸 results-es-expansion");

// 3. Watch the search, go home, see watched section
await page.click("text=Vigilar esta búsqueda");
await page.waitForTimeout(1500);
await page.goto(`${BASE}/#/`);
await page.waitForSelector(".watched", { timeout: 10000 });
await page.screenshot({ path: `${outDir}/home-watched.png` });
console.log("📸 home-watched");

// 4. Self-check interaction on a trial (back to EN)
await page.evaluate(() => localStorage.setItem("beacon.lang", "en"));
await page.goto(`${BASE}/#/results?cond=melanoma&lat=45.5017&lng=-73.5673&loc=Montreal&radius=100`);
await page.reload(); // re-init i18n from localStorage
await page.waitForSelector(".trial-card-title a", { timeout: 20000 });
await page.click(".trial-card-title a");
await page.waitForSelector(".selfcheck-list, .criteria-raw", { timeout: 20000 });
const btns = page.locator(".mark-btn");
if ((await btns.count()) >= 6) {
  await btns.nth(0).click(); // first criterion: true for me
  await btns.nth(5).click(); // second criterion: not sure
}
await page.waitForTimeout(300);
const checklist = page.locator(".eligibility");
await checklist.screenshot({ path: `${outDir}/selfcheck.png` });
console.log("📸 selfcheck");

// 5. Partners page with live widget preview
await page.goto(`${BASE}/#/partners`);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/partners.png`, fullPage: true });
console.log("📸 partners");

// 6. A generated SEO condition page
await page.goto(`${BASE}/c/breast-cancer/`);
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/seo-condition.png` });
console.log("📸 seo-condition");

await browser.close();
console.log("done");
