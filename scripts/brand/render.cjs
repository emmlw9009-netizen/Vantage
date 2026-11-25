#!/usr/bin/env node
/**
 * Renders the brand SVGs in public/brand/ to PNG with Playwright's Chromium (exact pixel sizes).
 *   node scripts/brand/render.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const DIR = path.resolve(__dirname, "..", "..", "public", "brand");
const JOBS = [
  ["app-icon.svg", "app-icon-1024.png", 1024, 1024],
  ["app-icon.svg", "icon-512.png", 512, 512],
  ["app-icon.svg", "icon-192.png", 192, 192],
  ["app-icon.svg", "apple-touch-icon.png", 180, 180],
  ["favicon.svg", "icon-32.png", 32, 32],
  ["social-avatar.svg", "social-avatar.png", 800, 800],
  ["social-banner.svg", "social-banner.png", 1500, 500],
  ["og.svg", "og.png", 1200, 630],
  ["business-card-front.svg", "business-card-front.png", 1050, 600],
  ["business-card-back.svg", "business-card-back.png", 1050, 600],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [src, out, w, h] of JOBS) {
    const data = fs.readFileSync(path.join(DIR, src)).toString("base64");
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${data}" width="${w}" height="${h}" style="display:block"></body></html>`);
    await page.waitForFunction(() => document.images[0].complete);
    await page.screenshot({ path: path.join(DIR, out), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    console.log("rendered", out);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
