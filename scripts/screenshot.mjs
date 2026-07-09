/**
 * Visual QA: screenshots the key views of the built app (served by
 * `vite preview`) with headless Chromium. Usage: node scripts/screenshot.mjs [outDir]
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:4173";
const outDir = process.argv[2] ?? "screenshots";

const shots = [
  { name: "home", url: `${BASE}/#/`, wait: null },
  {
    name: "results",
    url: `${BASE}/#/results?cond=melanoma&lat=45.5017&lng=-73.5673&loc=Montreal&radius=100&age=54&sex=FEMALE`,
    wait: ".trial-card",
  },
  { name: "saved-empty", url: `${BASE}/#/saved`, wait: null },
  { name: "about", url: `${BASE}/#/about`, wait: null },
];

const browser = await chromium.launch();
for (const dark of [false, true]) {
  const ctx = await browser.newContext({
    viewport: { width: 1180, height: 900 },
    colorScheme: dark ? "dark" : "light",
  });
  const page = await ctx.newPage();
  for (const s of shots) {
    if (dark && s.name !== "home") continue; // dark mode: home is representative
    await page.goto(s.url);
    if (s.wait) await page.waitForSelector(s.wait, { timeout: 20000 });
    await page.waitForTimeout(400);
    const file = `${outDir}/${s.name}${dark ? "-dark" : ""}.png`;
    await page.screenshot({ path: file, fullPage: s.name !== "home" });
    console.log("📸", file);
  }
  // From results, click through to a trial detail page
  if (!dark) {
    await page.goto(shots[1].url);
    await page.waitForSelector(".trial-card-title a", { timeout: 20000 });
    await page.click(".trial-card-title a");
    await page.waitForSelector(".criteria-section, .criteria-raw", { timeout: 20000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/trial-detail.png`, fullPage: true });
    console.log("📸", `${outDir}/trial-detail.png`);
    // Mobile viewport check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/#/`);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/home-mobile.png` });
    console.log("📸", `${outDir}/home-mobile.png`);
  }
  await ctx.close();
}
await browser.close();
console.log("done");
