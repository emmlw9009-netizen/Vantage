#!/usr/bin/env node
/**
 * End-to-end verification loop for Vantage.
 *   npm run build && npm start   (in another terminal)
 *   npm run verify               (BASE_URL=http://localhost:3000 SHOTS=./verify-shots)
 *
 * Drives every core flow in a real browser and fails loudly on:
 *   - JS errors / console errors on any page
 *   - broken internal links
 *   - horizontal overflow on phone width
 *   - wrong trading math (fills, brackets, OCO, P&L, cash)
 *   - coach, course, community and mission behaviour regressions
 * Screenshots of every page (dark + light, desktop + phone) land in SHOTS for visual review.
 */
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = path.resolve(process.env.SHOTS || "verify-shots");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const errors = [];
let failed = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("sp-app") || "{}").state);
const price = (page, sym) => page.evaluate((s) => JSON.parse(localStorage.getItem("sp-market")).state.prices[s], sym);
async function waitFor(fn, timeout = 30000, step = 500) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, step));
  }
  return false;
}
function watch(page, label) {
  page.on("pageerror", (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`[${label}] console: ${m.text()}`));
}

const LEGAL_ROUTES = [
  ["/terms", "Terms of service"],
  ["/privacy", "Privacy policy"],
  ["/disclaimer", "Investment and simulation disclaimer"],
  ["/community-guidelines", "Community guidelines"],
  ["/copyright", "Copyright and DMCA policy"],
  ["/accessibility", "Accessibility statement"],
];
const ROUTES = ["/", "/dashboard", "/markets", "/markets/NVDA", "/markets/SPY", "/learn", "/learn/position-sizing", "/coach", "/community", "/settings", ...LEGAL_ROUTES.map((r) => r[0])];
const TERMS_VERSION = "2026-11-24";
/** Onboarding step 1 now requires the consent checkbox before Continue or Skip. */
async function consent(page) {
  await page.getByLabel(/I.m 18 or older/).check();
}

(async () => {
  const browser = await chromium.launch();

  // ---------------- core flows (desktop, dark) ----------------
  console.log("\nCore flows");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
  const page = await ctx.newPage();
  watch(page, "desktop");

  await page.goto(`${BASE}/dashboard`);
  await page.getByPlaceholder("Your first name").fill("Alex");
  await consent(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("A little").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start trading" }).click();
  let s = await state(page);
  check("onboarding saves profile", s.profile.onboarded && s.profile.name === "Alex" && s.profile.experience === "some");
  check("starts with $100,000 cash", s.cash === 100000);
  check("onboarding stores consent with version and timestamp", s.profile.consent?.version === TERMS_VERSION && !isNaN(Date.parse(s.profile.consent?.acceptedAt)), JSON.stringify(s.profile.consent));

  // disciplined bracket trade
  await page.goto(`${BASE}/markets/NVDA`);
  await page.getByRole("button", { name: "−5%" }).click();
  await page.getByRole("button", { name: "+16%" }).click();
  await page.getByRole("button", { name: "1% of account" }).click();
  await page.locator("#thesis").fill("I expect NVDA to keep rising because AI data-center demand is strong; I am wrong if it breaks below the stop.");
  const pre = await page.getByText("Pre-flight check").isVisible();
  check("pre-flight check renders live", pre);
  check("checklist shows 5 of 5 complete for disciplined order", await page.getByText("5 of 5 complete").isVisible());
  check("every checklist line is ticked", (await page.locator('[role="checkbox"][data-ok="true"]').count()) === 5);
  await page.getByRole("button", { name: /^Buy \d+ NVDA$/ }).click();
  await waitFor(async () => (await state(page)).trades[0]?.reviewStatus === "done", 15000);
  s = await state(page);
  const t1 = s.trades[0];
  check("market buy fills", t1 && t1.symbol === "NVDA" && t1.side === "buy" && s.positions.NVDA?.qty === t1.qty);
  check("cash debited exactly", Math.abs(s.cash - (100000 - t1.qty * t1.price)) < 0.01, `cash ${s.cash.toFixed(2)}`);
  check("disciplined trade scores ≥ 80", t1.score >= 80, `score ${t1.score}`);
  check("risk sized to ~1% of account", Math.abs((t1.metrics.riskPct ?? 0) - 0.01) < 0.002, `risk ${(t1.metrics.riskPct * 100).toFixed(2)}%`);
  const legs = s.orders.filter((o) => o.status === "open" && o.symbol === "NVDA");
  check("risk-sized bracket is not flagged as oversized", !t1.flags.some((f) => f.tone !== "good" && f.id.startsWith("size")), t1.flags.map((f) => f.id).join(","));
  check("pre-flight check resets after fill", !(await page.getByText("Pre-flight check").isVisible()));
  check("bracket creates stop + target legs", legs.some((o) => o.role === "stop-loss") && legs.some((o) => o.role === "take-profit"));
  check("coach review attached", !!t1.review && !!t1.review.headline, t1.review?.source);
  check("review card visible on page", await page.getByText("Coach review").first().isVisible());
  await page.screenshot({ path: `${SHOTS}/flow-review.png`, fullPage: true });

  // reckless trade
  await page.goto(`${BASE}/markets/TSLA`);
  await page.locator("#qty").fill("80");
  check("no-stop order shows stop line unchecked", (await page.locator('[data-check-id="stop"]').getAttribute("data-ok")) === "false");
  await page.getByRole("button", { name: /^Buy 80 TSLA$/ }).click();
  await waitFor(async () => (await state(page)).trades[0]?.symbol === "TSLA");
  s = await state(page);
  const t2 = s.trades[0];
  check("reckless trade scores < 50", t2.score < 50, `score ${t2.score}`);
  check("reckless trade flagged: no stop + concentration", t2.flags.some((f) => f.id === "no-stop") && t2.flags.some((f) => f.id.startsWith("size")));

  // validation
  await page.locator("#qty").fill("999999");
  await page.getByRole("button", { name: /^Buy 999999 TSLA$/ }).click();
  check("rejects buys beyond cash", await page.getByRole("alert").filter({ hasText: "Not enough cash" }).isVisible());

  // sell with realized P&L
  await page.getByRole("button", { name: /^sell$/i }).click();
  await page.locator("#qty").fill("30");
  await page.getByRole("button", { name: /^Sell 30 TSLA$/ }).click();
  await waitFor(async () => (await state(page)).trades[0]?.side === "sell");
  s = await state(page);
  const t3 = s.trades[0];
  check("partial sell reduces position", s.positions.TSLA?.qty === 50);
  check("realized P&L computed", Math.abs(t3.realizedPnl - (t3.price - t2.price) * 30) < 0.05, `P&L ${t3.realizedPnl?.toFixed(2)}`);
  await page.locator("#qty").fill("999");
  await page.getByRole("button", { name: /^Sell 999 TSLA$/ }).click();
  check("rejects selling more than held", await page.getByRole("alert").filter({ hasText: "only hold" }).isVisible());

  // limit order: buy limit above market fills on next tick
  await page.goto(`${BASE}/markets/KO`);
  await page.getByRole("tab", { name: "Limit" }).click();
  const ko = await price(page, "KO");
  await page.locator("#trigger").fill((ko * 1.05).toFixed(2));
  await page.locator("#qty").fill("10");
  await page.getByRole("button", { name: "Place limit buy" }).click();
  const limitFilled = await waitFor(async () => (await state(page)).positions.KO?.qty === 10, 15000);
  check("limit buy fills when price crosses", limitFilled);

  // stop-loss trigger + OCO cancel of the take-profit
  await page.goto(`${BASE}/markets/AMD`);
  const amd = await price(page, "AMD");
  await page.locator("#qty").fill("5");
  await page.locator("#stop").fill((amd * 0.9985).toFixed(2));
  await page.locator("#target").fill((amd * 1.5).toFixed(2));
  await page.getByRole("button", { name: /^Buy 5 AMD$/ }).click();
  const stopped = await waitFor(async () => (await state(page)).trades.some((t) => t.symbol === "AMD" && t.role === "stop-loss"), 90000, 1000);
  s = await state(page);
  check("stop-loss triggers automatically", stopped);
  if (stopped) {
    const tp = s.orders.find((o) => o.symbol === "AMD" && o.role === "take-profit");
    check("OCO cancels the take-profit leg", tp?.status === "cancelled");
    check("position closed after stop", !s.positions.AMD);
  }

  // learning
  const xpBefore = (await state(page)).xp;
  await page.goto(`${BASE}/learn/position-sizing`);
  const fs_ = page.locator("fieldset");
  const answers = [1, 2]; // correct answers for this lesson
  for (let i = 0; i < (await fs_.count()); i++) await fs_.nth(i).locator("button").nth(answers[i]).click();
  await page.getByRole("button", { name: "Check answers" }).click();
  s = await state(page);
  check("lesson completion + perfect quiz awards 75 XP", s.completedLessons["position-sizing"]?.quiz === 1 && s.xp - xpBefore >= 75, `+${s.xp - xpBefore} XP`);

  // coach
  await page.goto(`${BASE}/coach`);
  await page.getByRole("button", { name: /How do I figure out/ }).click();
  const replied = await waitFor(async () => {
    const c = (await state(page)).chat;
    return c.length >= 2 && c[c.length - 1].role === "assistant" && c[c.length - 1].content.length > 40;
  }, 60000);
  check("coach replies", replied);
  await page.goto(`${BASE}/coach?trade=${t2.id}`);
  check("coach pre-fills trade question", (await page.getByLabel("Message Nova").inputValue()).includes("TSLA"));

  // community
  await page.goto(`${BASE}/community`);
  await page.getByLabel("Post text").fill("Verification post: bracket on NVDA at 1% risk.");
  await page.getByRole("button", { name: "Post" }).click();
  const novaReplied = await waitFor(async () => {
    const st = await state(page);
    const id = st.posts[0]?.id;
    return !!id && (st.comments[id] ?? []).some((c) => c.authorId === "u7");
  }, 60000);
  check("community post gets a Nova reply", novaReplied);
  await page.getByRole("tab", { name: "Leaderboard" }).click();
  check("leaderboard includes you", await page.getByText("Alex").first().isVisible());

  s = await state(page);
  const expectMissions = ["first-trade", "use-stop", "write-thesis", "rr-2", "score-85", "limit-order", "ask-coach", "post-community"];
  const missing = expectMissions.filter((m) => !s.missions[m]);
  check("missions auto-complete", missing.length === 0, missing.length ? `missing ${missing.join(",")}` : `${Object.keys(s.missions).length} done`);

  // dashboard math
  await page.goto(`${BASE}/dashboard`);
  s = await state(page);
  const prices = await page.evaluate(() => JSON.parse(localStorage.getItem("sp-market")).state.prices);
  const eq = s.cash + Object.values(s.positions).reduce((a, p) => a + p.qty * prices[p.symbol], 0);
  const shown = await page.locator("text=Total value").locator("..").locator("span.tnum").first().innerText();
  const shownNum = parseFloat(shown.replace(/[$,]/g, ""));
  check("dashboard equity matches positions", Math.abs(shownNum - eq) / eq < 0.002, `${shown} vs ${eq.toFixed(2)}`);

  // persistence across reload
  const before = (await state(page)).trades.length;
  await page.reload();
  check("state persists across reload", (await state(page)).trades.length === before);


  // ---------------- legal, consent, data controls ----------------
  console.log("\nLegal pages, consent and data controls");
  const storageNow = await ctx.storageState();
  {
    // legal pages: public, 200, their h1, no app shell and no consent gate
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    watch(p, "legal");
    for (const [route, h1] of LEGAL_ROUTES) {
      const res = await p.goto(`${BASE}${route}`);
      const got = await p.locator("h1").first().innerText().catch(() => "");
      check(`${route} returns 200 with h1 "${h1}"`, res?.status() === 200 && got === h1, `status ${res?.status()} h1 "${got}"`);
      const updated = await p.getByText(/^Last updated /).first().isVisible().catch(() => false);
      if (!updated) check(`${route} shows Last updated`, false);
    }
    await p.goto(`${BASE}/terms`);
    check("legal pages are readable before consent (no modal, no onboarding)", (await p.getByRole("dialog").count()) === 0);
    check("legal layout links all six pages", (await p.getByRole("navigation", { name: "Legal pages" }).getByRole("link").count()) === 6);
    const placeholders = await p.locator("main").innerText();
    check("terms show owner placeholders as-is and the paid-plans clause", placeholders.includes("[Company legal name]") && placeholders.includes("$30 per month") && placeholders.includes("$60 per month") && placeholders.includes("[refund policy]"));
    await p.goto(`${BASE}/privacy`);
    const priv = await p.locator("main").innerText();
    check("privacy names the AI provider and planned processors", ["Anthropic", "Supabase", "Resend", "Stripe", "Meta", "[hosting provider]"].every((w) => priv.includes(w)));
    await c.close();
  }
  {
    // clickwrap: the app cannot be used before consent
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    watch(p, "consent");
    await p.goto(`${BASE}/dashboard`);
    const box = p.getByLabel(/I.m 18 or older/);
    await box.waitFor();
    check("consent checkbox starts unchecked", !(await box.isChecked()));
    check("Continue is disabled until the box is ticked", await p.getByRole("button", { name: "Continue" }).isDisabled());
    check("Skip never skips consent", await p.getByRole("button", { name: "Skip" }).isDisabled());
    const hrefs = await p.locator('label[for="consent"] a').evaluateAll((as) => as.map((a) => [a.getAttribute("href"), a.getAttribute("target")]));
    check("consent links open Terms and Privacy in a new tab", hrefs.length === 2 && hrefs[0][0] === "/terms" && hrefs[1][0] === "/privacy" && hrefs.every((h) => h[1] === "_blank"), JSON.stringify(hrefs));
    await p.getByPlaceholder("Your first name").fill("Casey");
    await p.getByPlaceholder("Your first name").press("Enter");
    check("Enter in the name field does not bypass consent", await p.getByRole("button", { name: "Continue" }).isDisabled());
    check("nothing is stored before consent", !(await state(p))?.profile?.onboarded);
    await box.check();
    check("ticking the box enables Continue", await p.getByRole("button", { name: "Continue" }).isEnabled());
    await p.getByRole("button", { name: "Skip" }).click();
    await p.waitForFunction(() => JSON.parse(localStorage.getItem("sp-app") || "{}").state?.profile?.onboarded === true);
    const st = await state(p);
    check("Skip after consent finishes with consent recorded", st.profile.consent?.version === TERMS_VERSION && st.profile.name === "Casey");
    check("offline mode shows no AI data notice", (await p.getByRole("dialog").count()) === 0 && !st.profile.aiNoticeAt);
    // footer disclaimer in the rail
    check("rail shows the simulated-data disclaimer and legal links", (await p.getByText("Simulated prices and news. Educational only, not investment advice.").first().isVisible()) && (await p.getByRole("list", { name: "Legal" }).getByRole("link").count()) === 3);
    // coach page labels
    await p.goto(`${BASE}/coach`);
    await p.getByRole("link", { name: /AI coach limits and disclaimer/ }).waitFor();
    check("coach page links the disclaimer", (await p.getByRole("link", { name: /AI coach limits and disclaimer/ }).getAttribute("href")) === "/disclaimer");
    await c.close();
  }
  {
    // existing users with missing or outdated consent are blocked by ConsentGate
    for (const [label, mutate] of [
      ["missing", (s) => { delete s.state.profile.consent; }],
      ["outdated", (s) => { s.state.profile.consent = { version: "2000-01-01", acceptedAt: new Date().toISOString() }; }],
    ]) {
      const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
      const p = await c.newPage();
      watch(p, `gate-${label}`);
      await p.addInitScript(([m]) => {
        if (sessionStorage.getItem("gate-patched")) return;
        sessionStorage.setItem("gate-patched", "1");
        const raw = localStorage.getItem("sp-app");
        if (!raw) return;
        const s = JSON.parse(raw);
        new Function("s", m)(s);
        localStorage.setItem("sp-app", JSON.stringify(s));
      }, [label === "missing" ? "delete s.state.profile.consent;" : 's.state.profile.consent = { version: "2000-01-01", acceptedAt: new Date().toISOString() };']);
      await p.goto(`${BASE}/dashboard`);
      const dlg = p.getByRole("dialog");
      await dlg.waitFor({ timeout: 8000 }).catch(() => {});
      check(`consent gate blocks the app (${label} consent)`, await dlg.isVisible());
      const agree = p.getByRole("button", { name: "Agree and continue" });
      check(`gate agree button is disabled until ticked (${label})`, await agree.isDisabled());
      await p.getByLabel(/I.m 18 or older/).check();
      await agree.click();
      await p.waitForFunction((v) => JSON.parse(localStorage.getItem("sp-app")).state.profile.consent?.version === v, TERMS_VERSION);
      check(`agreeing in the gate records the current version (${label})`, (await p.getByRole("dialog").count()) === 0);
      await c.close();
    }
  }
  {
    // AI data notice: only when the server reports AI mode
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "ai-notice");
    await p.route("**/api/coach", (route) => (route.request().method() === "GET" ? route.fulfill({ json: { mode: "ai" } }) : route.continue()));
    await p.goto(`${BASE}/dashboard`);
    const dlg = p.getByRole("dialog", { name: "Nova uses an AI service" });
    await dlg.waitFor({ timeout: 8000 }).catch(() => {});
    check("AI mode shows the data notice with what is sent and to whom", (await dlg.isVisible()) && (await dlg.innerText()).includes("Anthropic") && (await dlg.getByRole("link", { name: "Privacy Policy" }).count()) === 1);
    await dlg.getByRole("button", { name: "I understand" }).click();
    await p.waitForFunction(() => !!JSON.parse(localStorage.getItem("sp-app")).state.profile.aiNoticeAt);
    check("acknowledging stores aiNoticeAt and closes the notice", (await p.getByRole("dialog").count()) === 0);
    await p.reload();
    await p.waitForTimeout(1200);
    check("the AI notice is shown only once", (await p.getByRole("dialog").count()) === 0);
    await c.close();
  }
  {
    // settings: export, theme, reset, delete
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storageNow, acceptDownloads: true });
    const p = await c.newPage();
    watch(p, "settings");
    await p.goto(`${BASE}/settings`);
    await p.getByText("Plan: Free").waitFor({ timeout: 8000 }).catch(() => {});
    check("settings shows the plan placeholder", await p.getByText("Plan: Free").isVisible());
    const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Export my data" }).click()]);
    const file = await dl.path();
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    check("export downloads a timestamped JSON of both stores", /^vantage-data-\d{8}-\d{6}\.json$/.test(dl.suggestedFilename()) && !!json.stores["sp-app"]?.state?.trades && !!json.stores["sp-market"]?.state?.prices, dl.suggestedFilename());
    await p.getByRole("radio", { name: "Light" }).click();
    check("theme choice applies", (await p.evaluate(() => document.documentElement.dataset.theme)) === "light");
    await p.getByRole("button", { name: "Reset practice account" }).click();
    await p.getByRole("dialog").getByRole("button", { name: "Reset account" }).click();
    const rs = await state(p);
    check("reset practice account restores cash and clears trades", rs.cash === 100000 && rs.trades.length === 0 && rs.profile.onboarded === true);
    await p.getByRole("button", { name: "Delete all my data" }).click();
    const del = p.getByRole("dialog").getByRole("button", { name: "Delete everything" });
    check("delete is disabled until DELETE is typed", await del.isDisabled());
    await p.getByLabel("Type DELETE to confirm").fill("delete");
    check("delete requires the exact word DELETE", await del.isDisabled());
    await p.getByLabel("Type DELETE to confirm").fill("DELETE");
    await del.click();
    await p.getByLabel(/I.m 18 or older/).waitFor({ timeout: 10000 });
    const after = await state(p);
    const marketAfter = await p.evaluate(() => localStorage.getItem("sp-market"));
    check("delete clears both stores and returns to onboarding", (!after || (!after.profile.onboarded && !after.profile.consent && after.trades.length === 0 && after.profile.name === "")) && (await p.getByText("Welcome to Vantage").isVisible()), `sp-market ${marketAfter ? "rewritten fresh" : "empty"}`);
    check("delete also removes the saved theme", (await p.evaluate(() => localStorage.getItem("sp-theme"))) === null);
    await c.close();
  }
  {
    // phone menu: settings, disclaimer, legal links
    const c = await browser.newContext({ ...devices["iPhone 14"], storageState: storageNow });
    const p = await c.newPage();
    watch(p, "phone-menu");
    await p.goto(`${BASE}/dashboard`);
    await p.getByRole("button", { name: "Menu" }).click();
    const m = p.getByRole("dialog");
    check("phone menu has Settings, the disclaimer and legal links", (await m.getByRole("link", { name: "Settings" }).isVisible()) && (await m.getByText("Simulated prices and news. Educational only, not investment advice.").isVisible()) && (await m.getByRole("link", { name: "Terms" }).isVisible()) && (await m.getByRole("link", { name: "Privacy" }).isVisible()) && (await m.getByRole("link", { name: "Disclaimer" }).isVisible()));
    await c.close();
  }

  // ---------------- every page × theme × device ----------------
  console.log("\nPages, themes, devices, links");
  const storage = await ctx.storageState();
  const links = new Set();
  for (const [label, opts] of [
    ["desktop-dark", { viewport: { width: 1440, height: 1000 }, colorScheme: "dark" }],
    ["desktop-light", { viewport: { width: 1440, height: 1000 }, colorScheme: "light" }],
    ["phone-dark", { ...devices["iPhone 14"], colorScheme: "dark" }],
    ["phone-light", { ...devices["iPhone 14"], colorScheme: "light" }],
  ]) {
    const c = await browser.newContext({ ...opts, storageState: storage });
    const p = await c.newPage();
    watch(p, label);
    for (const r of ROUTES) {
      const res = await p.goto(`${BASE}${r}`);
      await p.waitForTimeout(700);
      const ok = res && res.status() === 200;
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (!ok || overflow > 1) check(`${label} ${r}`, false, `status ${res?.status()} overflow ${overflow}px`);
      const name = `${label}${r.replace(/\//g, "_") || "_home"}.png`;
      await p.screenshot({ path: `${SHOTS}/${name}`, fullPage: true });
      for (const h of await p.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute("href")))) links.add(h.split("?")[0]);
    }
    check(`${label}: all ${ROUTES.length} pages render, no overflow`, true);
    await c.close();
  }
  // phone search overlay
  {
    const c = await browser.newContext({ ...devices["iPhone 14"], storageState: storage });
    const p = await c.newPage();
    watch(p, "phone-search");
    await p.goto(`${BASE}/markets`);
    await p.getByRole("button", { name: "Search stocks" }).click();
    await p.locator("#ticker-search-mobile").fill("nvid");
    await p.keyboard.press("Enter");
    await p.waitForURL("**/markets/NVDA", { timeout: 5000 }).catch(() => {});
    check("phone search opens and navigates", p.url().endsWith("/markets/NVDA"));
    const headerFits = await p.evaluate(() => {
      const h = document.querySelector("header");
      return [...h.querySelectorAll("*")].every((el) => el.getBoundingClientRect().right <= window.innerWidth + 1);
    });
    check("phone header fits the screen", headerFits);
    await c.close();
  }

  const bad = [];
  for (const l of links) {
    const r = await fetch(`${BASE}${l}`);
    if (r.status !== 200) bad.push(`${l} (${r.status})`);
  }
  check(`no broken internal links (${links.size} checked)`, bad.length === 0, bad.join(", "));

  check("no JS or console errors anywhere", errors.length === 0, errors.slice(0, 5).join(" | "));

  await browser.close();
  console.log(`\n${results.length - failed}/${results.length} checks passed. Screenshots: ${SHOTS}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
