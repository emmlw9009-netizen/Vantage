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
const ROUTES = ["/", "/dashboard", "/markets", "/markets/NVDA", "/markets/SPY", "/learn", "/learn/position-sizing", "/learn/risk-reward", "/learn/trends-and-candles", "/coach", "/community", "/journal", "/settings", "/lessons", "/lessons/position-sizing", "/tools/position-size-calculator", "/tools/reward-risk-calculator", "/share/score?s=92&l=Disciplined&sym=NVDA&side=buy", "/pricing", "/upgrade", "/debrief", ...LEGAL_ROUTES.map((r) => r[0])];
// the current terms version, read from the one source of truth so a legal update never leaves verify behind
const TERMS_VERSION = /termsVersion:\s*"([^"]+)"/.exec(fs.readFileSync(path.join(__dirname, "../src/lib/legal.ts"), "utf8"))[1];
/** Task 10 copy that must appear verbatim (plan, owner decision). */
const RENEWAL = "Billed monthly. Renews automatically until you cancel. Cancel anytime in Settings.";
const TEST_MODE = "Payments aren't live yet. You can preview this plan in test mode at no charge.";
/** Onboarding step 1 now requires the consent checkbox before Continue or Skip. */
async function consent(page) {
  await page.getByLabel(/I.m 18 or older/).check();
}

/**
 * Task 7 accessibility smoke test, run in the page. Returns a list of problems:
 * every visible button, link, tab and radio has an accessible name; every input, textarea and select has a label;
 * exactly one visible h1; no duplicate ids; no aria-controls, aria-labelledby or aria-describedby pointing nowhere;
 * every tab controls a tabpanel.
 */
function a11ySmoke() {
  const out = [];
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const text = (id) => document.getElementById(id)?.textContent || "";
  const name = (el) => {
    const lb = el.getAttribute("aria-labelledby");
    if (lb) return lb.split(/\s+/).map(text).join(" ").trim();
    const al = el.getAttribute("aria-label");
    if (al && al.trim()) return al.trim();
    if (el.labels && el.labels.length) return [...el.labels].map((l) => l.textContent).join(" ").trim();
    const t = (el.textContent || "").trim();
    if (t) return t;
    const img = el.querySelector("img[alt]");
    if (img && img.alt.trim()) return img.alt.trim();
    return (el.getAttribute("title") || "").trim();
  };
  for (const el of document.querySelectorAll("button, a[href], [role=button], [role=link], [role=tab], [role=radio]")) {
    if (vis(el) && !name(el)) out.push(`no accessible name: ${el.outerHTML.slice(0, 90)}`);
  }
  for (const el of document.querySelectorAll("input:not([type=hidden]), textarea, select")) {
    if ((vis(el) || /sr-only/.test(el.className)) && !name(el)) out.push(`no label: ${el.outerHTML.slice(0, 90)}`);
  }
  const h1 = [...document.querySelectorAll("h1")].filter(vis).length;
  if (h1 !== 1) out.push(`${h1} h1 elements`);
  const ids = {};
  for (const el of document.querySelectorAll("[id]")) ids[el.id] = (ids[el.id] || 0) + 1;
  for (const [k, v] of Object.entries(ids)) if (v > 1) out.push(`duplicate id ${k} x${v}`);
  for (const el of document.querySelectorAll("[aria-controls],[aria-labelledby],[aria-describedby]"))
    for (const a of ["aria-controls", "aria-labelledby", "aria-describedby"])
      for (const i of (el.getAttribute(a) || "").split(/\s+/).filter(Boolean)) if (!document.getElementById(i)) out.push(`${a}="${i}" points nowhere`);
  for (const t of document.querySelectorAll("[role=tab]")) if (!t.getAttribute("aria-controls")) out.push(`tab "${t.textContent.trim()}" controls no panel`);
  return out;
}

/** Contrast of every text token against every surface token, both themes, straight from globals.css. */
function tokenContrast() {
  const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  const grab = (start) => {
    const i = css.indexOf(start);
    return Object.fromEntries([...css.slice(i, css.indexOf("}", i)).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
  };
  const themes = { light: grab(":root {\n  color-scheme: light"), dark: grab(':root[data-theme="dark"] {') };
  const lum = (h) => {
    const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = [1, 3, 5].map((i) => f(parseInt(h.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const bad = [];
  for (const [theme, t] of Object.entries(themes)) {
    for (const fg of ["ink", "ink-2", "muted", "pencil", "red"]) for (const bg of ["paper", "sheet", "well", "field"]) if (ratio(t[fg], t[bg]) < 4.5) bad.push(`${theme} ${fg} on ${bg} ${ratio(t[fg], t[bg]).toFixed(2)}`);
    if (ratio(t["on-ink"], t.ink) < 4.5) bad.push(`${theme} on-ink on ink`);
    if (ratio(t["on-ink"], t.red) < 4.5) bad.push(`${theme} on-ink on red`);
    for (const bg of ["paper", "sheet", "well", "field"]) if (ratio(t.edge, t[bg]) < 3) bad.push(`${theme} edge on ${bg} (non-text 3:1)`);
  }
  return bad;
}

(async () => {
  const browser = await chromium.launch();

  // ---------------- core flows (desktop, dark) ----------------
  console.log("\nCore flows");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
  await ctx.addInitScript(() => {
    window.__VANTAGE_TEST__ = true; // enables the test-only price driver (never set for real users)
  });
  const page = await ctx.newPage();
  watch(page, "desktop");

  await page.goto(`${BASE}/dashboard`);
  await page.getByPlaceholder("Your first name").fill("Alex");
  await consent(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("A little").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start trading" }).click();
  // writes are batched by store/sync.ts (about 50 ms): wait for this one to land before reading storage
  await waitFor(async () => !!(await state(page))?.profile?.onboarded, 3000, 50);
  let s = await state(page);
  check("onboarding saves profile", s.profile.onboarded && s.profile.name === "Alex" && s.profile.experience === "some");
  check("starts with $100,000 cash", s.cash === 100000);
  check("onboarding stores consent with version and timestamp", s.profile.consent?.version === TERMS_VERSION && !isNaN(Date.parse(s.profile.consent?.acceptedAt)), JSON.stringify(s.profile.consent));
  check("a new profile starts on the Free plan", s.profile.plan === "free");

  // Task 10: the core flow runs on Premium (test mode, set here at the start) so the Free daily limits never cap it
  await page.goto(`${BASE}/upgrade`);
  await page.getByRole("button", { name: "Preview Premium" }).first().click();
  const tmDialog = page.getByTestId("test-mode-dialog");
  await tmDialog.waitFor({ timeout: 8000 });
  const tmText = await tmDialog.innerText();
  check("Preview Premium opens the test-mode dialog first: payments not live, no charge, renewal terms shown", tmText.includes(TEST_MODE) && tmText.includes(RENEWAL), tmText.slice(0, 120));
  await page.getByRole("dialog").getByRole("button", { name: "Preview Premium" }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("sp-app")).state.profile.plan === "premium", null, { timeout: 8000 });
  s = await state(page);
  check("previewing Premium sets profile.plan, the test-mode source and the change time", s.profile.plan === "premium" && s.profile.planSource === "test" && !isNaN(Date.parse(s.profile.planChangedAt)), JSON.stringify({ plan: s.profile.plan, src: s.profile.planSource }));

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
  await page.getByRole("alert").filter({ hasText: "Not enough cash" }).waitFor({ timeout: 5000 }).catch(() => {});
  check("rejects buys beyond cash", await page.getByRole("alert").filter({ hasText: "Not enough cash" }).isVisible());

  // sell with realized P&L
  await page.getByRole("radio", { name: "Sell" }).click();
  await page.locator("#qty").fill("30");
  await page.getByRole("button", { name: /^Sell 30 TSLA$/ }).click();
  await waitFor(async () => (await state(page)).trades[0]?.side === "sell");
  s = await state(page);
  const t3 = s.trades[0];
  check("partial sell reduces position", s.positions.TSLA?.qty === 50);
  check("realized P&L computed", Math.abs(t3.realizedPnl - (t3.price - t2.price) * 30) < 0.05, `P&L ${t3.realizedPnl?.toFixed(2)}`);
  await page.locator("#qty").fill("999");
  await page.getByRole("button", { name: /^Sell 999 TSLA$/ }).click();
  await page.getByRole("alert").filter({ hasText: "only hold" }).waitFor({ timeout: 5000 }).catch(() => {});
  check("rejects selling more than held", await page.getByRole("alert").filter({ hasText: "only hold" }).isVisible());

  // limit order: buy limit above market fills on next tick
  await page.goto(`${BASE}/markets/KO`);
  await page.getByRole("radio", { name: "Limit" }).click();
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
  const amdStop = amd * 0.95;
  await page.locator("#stop").fill(amdStop.toFixed(2));
  await page.locator("#target").fill((amd * 1.5).toFixed(2));
  await page.getByRole("button", { name: /^Buy 5 AMD$/ }).click();
  await waitFor(async () => !!(await state(page)).positions.AMD, 10000, 250);
  // Deterministic: drive the price through the test hook to just under the stop (the real tick path is covered by the limit-order check above).
  await page.evaluate((px) => window.__vantageTest.setPrices({ AMD: px }), amdStop * 0.99);
  const stopped = await waitFor(async () => (await state(page)).trades.some((t) => t.symbol === "AMD" && t.role === "stop-loss"), 10000, 250);
  s = await state(page);
  check("stop-loss triggers automatically", stopped);
  if (stopped) {
    const tp = s.orders.find((o) => o.symbol === "AMD" && o.role === "take-profit");
    check("OCO cancels the take-profit leg", tp?.status === "cancelled");
    check("position closed after stop", !s.positions.AMD);
  }
  // toasts never cover the ticket's submit button (the stop-loss toast is on screen now)
  const toastsShown = await page.locator("[data-toaster] [role=status]").count();
  const buyCovered = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /^Buy \d+ AMD$/.test(x.textContent.trim()));
    if (!b) return "no Buy button";
    b.scrollIntoView({ block: "center" });
    const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return b.contains(el) ? "" : `covered by ${el?.closest("[data-toaster]") ? "a toast" : el?.tagName}`;
  });
  check("toasts never cover the ticket's Buy button", buyCovered === "", `${buyCovered || "clear"}, ${toastsShown} toast(s) on screen`);

  // double submit: a double click or Enter pressed twice places exactly one order
  await page.goto(`${BASE}/markets/JPM`);
  await page.locator("#qty").fill("4");
  const jpmCount = async () => (await state(page)).trades.filter((t) => t.symbol === "JPM").length;
  const jpm0 = await jpmCount();
  await page.getByRole("button", { name: /^Buy 4 JPM$/ }).dblclick();
  await page.waitForTimeout(1200);
  const jpm1 = await jpmCount();
  check("double-clicking Buy places exactly one order", jpm1 - jpm0 === 1, `${jpm1 - jpm0} orders`);
  await page.locator("#qty").fill("3");
  await page.getByRole("button", { name: /^Buy 3 JPM$/ }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  const jpm2 = await jpmCount();
  check("pressing Enter twice on Buy places exactly one order", jpm2 - jpm1 === 1, `${jpm2 - jpm1} orders`);

  // learning
  const xpBefore = (await state(page)).xp;
  await page.goto(`${BASE}/learn/position-sizing`);
  const fs_ = page.locator("fieldset");
  const answers = [1, 2]; // correct answers for this lesson
  for (let i = 0; i < (await fs_.count()); i++) await fs_.nth(i).locator("button").nth(answers[i]).click();
  await page.getByRole("button", { name: "Check answers" }).click();
  await waitFor(async () => (await state(page)).completedLessons["position-sizing"]?.quiz === 1, 3000, 50);
  s = await state(page);
  check("lesson completion + perfect quiz awards 75 XP", s.completedLessons["position-sizing"]?.quiz === 1 && s.xp - xpBefore >= 75, `+${s.xp - xpBefore} XP`);

  // lesson widgets (Task 4)
  {
    const w = page.getByTestId("widget-position-size");
    check("position-size widget is on the position sizing lesson", await w.isVisible());
    await w.getByLabel("Account size").fill("100000");
    await w.getByLabel(/Risk per trade/).fill("1");
    await w.getByLabel("Entry price").fill("100");
    await w.getByLabel("Stop price").fill("95");
    check("position-size widget: 100000 account, 1% risk, entry 100, stop 95 gives 200 shares", (await w.getByTestId("ps-shares").innerText()) === "200", await w.getByTestId("ps-shares").innerText());
    check("position-size widget: dollars at risk are $1,000.00 and the position is 20.0% of the account", (await w.getByTestId("ps-risk-usd").innerText()) === "$1,000.00" && (await w.getByTestId("ps-pct").innerText()) === "20.0%");
    await w.getByLabel("Stop price").fill("101");
    check("position-size widget: a stop above the entry explains the fix", (await w.locator("[aria-invalid=true]").count()) === 1 && /below your entry/.test(await w.innerText()));
    await w.getByLabel("Stop price").fill("95");

    await page.goto(`${BASE}/learn/risk-reward`);
    const rr = page.getByTestId("widget-reward-risk");
    check("reward-risk widget shows 2.0 for entry 100, stop 95, target 110", (await rr.getByTestId("rr-value").innerText()) === "2.0");
    check("reward-risk widget: break-even win rate is 33% and the plan meets 2 to 1", (await rr.getByTestId("rr-breakeven").innerText()) === "33%" && /meets the 2 to 1/.test(await rr.getByTestId("rr-verdict").innerText()));
    const bars = await rr.evaluate((el) => ({ risk: el.querySelector('[data-testid="rr-risk-bar"]').getBoundingClientRect().width, reward: el.querySelector('[data-testid="rr-reward-bar"]').getBoundingClientRect().width }));
    check("reward-risk diagram is drawn to scale (reward bar is twice the risk bar)", Math.abs(bars.reward / bars.risk - 2) < 0.02, `${bars.reward.toFixed(1)} / ${bars.risk.toFixed(1)}`);
    await rr.getByLabel("Target price").fill("107.5");
    check("reward-risk widget: a 1.5 plan says it is below 2 to 1 and names the target to reach", (await rr.getByTestId("rr-value").innerText()) === "1.5" && /below 2 to 1.*\$110\.00/.test(await rr.getByTestId("rr-verdict").innerText()));
    await rr.getByLabel("Stop price").fill("100");
    check("reward-risk widget: a stop at the entry shows a fix and no diagram", (await rr.getByTestId("rr-diagram").count()) === 0 && /below your entry/.test(await rr.innerText()));

    await page.goto(`${BASE}/learn/trends-and-candles`);
    const ts = page.getByTestId("widget-trend-spotter");
    check("trend spotter shows three charts", (await ts.locator("svg[role=img]").count()) === 3);
    check("trend spotter shows no score before the answers are checked", (await ts.getByTestId("ts-score").innerText()) === "" && (await ts.getByTestId("ts-check").isDisabled()));
    // answer all three from the charts' own swing prices, so the check also proves the labels are right
    const truth = await ts.locator("svg[role=img]").evaluateAll((svgs) =>
      svgs.map((svg) => {
        const nums = (k) => (svg.getAttribute("aria-label").match(new RegExp(k + ": ([^.]*)\\.")) || [])[1].split(",").map((x) => Number(x.replace(/[$,\s]/g, "")));
        const lo = nums("Swing lows"), hi = nums("Swing highs");
        const up = (a) => a.every((v, i) => !i || v > a[i - 1]), down = (a) => a.every((v, i) => !i || v < a[i - 1]);
        return up(lo) && up(hi) ? "Uptrend" : down(lo) && down(hi) ? "Downtrend" : "Range";
      }),
    );
    check("trend spotter's three charts are one uptrend, one downtrend and one range", [...truth].sort().join() === "Downtrend,Range,Uptrend", truth.join());
    for (let i = 0; i < 3; i++) await ts.locator("fieldset").nth(i).getByLabel(truth[i], { exact: true }).check({ force: true });
    await ts.getByTestId("ts-check").click();
    check("trend spotter reveals a score after three answers", /^\d of 3 correct$/.test(await ts.getByTestId("ts-score").innerText()), await ts.getByTestId("ts-score").innerText());
    check("trend spotter: correct answers score 3 of 3", (await ts.getByTestId("ts-score").innerText()) === "3 of 3 correct");
    await ts.getByRole("button", { name: "Try three new charts" }).click();
    check("trend spotter: new charts reset the score", (await ts.getByTestId("ts-score").innerText()) === "");
    const wrong = await ts.locator("fieldset").evaluateAll((fs) => fs.length);
    for (let i = 0; i < wrong; i++) await ts.locator("fieldset").nth(i).getByLabel("Range", { exact: true }).check({ force: true });
    await ts.getByTestId("ts-check").click();
    check("trend spotter: labelling every chart a range scores 1 of 3", (await ts.getByTestId("ts-score").innerText()) === "1 of 3 correct", await ts.getByTestId("ts-score").innerText());
    await page.goto(`${BASE}/learn/position-sizing`);
  }

  // coach
  await page.goto(`${BASE}/coach`);
  await page.getByRole("button", { name: /How do I figure out/ }).click();
  const replied = await waitFor(async () => {
    const c = (await state(page)).chat;
    return c.length >= 2 && c[c.length - 1].role === "assistant" && c[c.length - 1].content.length > 40;
  }, 60000);
  check("coach replies", replied);
  await page.goto(`${BASE}/coach?trade=${t2.id}`);
  await waitFor(async () => (await page.getByLabel("Message Nova").inputValue().catch(() => "")).includes("TSLA"), 8000, 200);
  check("coach pre-fills trade question", (await page.getByLabel("Message Nova").inputValue()).includes("TSLA"));

  // community
  await page.goto(`${BASE}/community`);
  await page.getByLabel("Post text").fill("Verification post: bracket on NVDA at 1% risk.");
  await page.getByRole("button", { name: "Post", exact: true }).click();
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
  const shown = await page.locator("text=Account value").locator("..").locator("span.tnum").first().innerText();
  const shownNum = parseFloat(shown.replace(/[$,]/g, ""));
  check("dashboard equity matches positions", Math.abs(shownNum - eq) / eq < 0.002, `${shown} vs ${eq.toFixed(2)}`);

  // journal: trade count and the mistakes chart reflect the core flow
  await page.goto(`${BASE}/journal`);
  await page.getByTestId("journal-trade-count").first().waitFor({ timeout: 10000 });
  s = await state(page);
  const jCount = (await page.getByTestId("journal-trade-count").first().innerText()).trim();
  check("journal shows the correct trade count", jCount === String(s.trades.length), `${jCount} vs ${s.trades.length}`);
  check("journal lists No stop-loss among the most common mistakes", await page.getByTestId("mistakes").getByText("No stop-loss").first().isVisible());
  check("journal check record ticks or empties every check cell (5 per planned trade)", (await page.locator("table tbody tr").first().locator("td [data-cell]").count()) === 5);
  await page.goto(`${BASE}/dashboard`);

  // persistence across reload
  const before = (await state(page)).trades.length;
  await page.reload();
  check("state persists across reload", (await state(page)).trades.length === before);


  // ---------------- round-2 logic fixes ----------------
  console.log("\nRound 2 logic: multi-tab, brackets, sizing, input parsing");
  const checkOf = (p, id) => p.locator(`[data-check-id="${id}"]`).getAttribute("data-ok");
  {
    // N1: a second tab must not erase trades made in the first (stale tab used to overwrite storage within ~10s)
    const tabA = await ctx.newPage();
    const tabB = await ctx.newPage();
    watch(tabA, "tabA");
    watch(tabB, "tabB");
    await tabA.goto(`${BASE}/dashboard`);
    await tabB.goto(`${BASE}/markets/SPY`);
    await tabA.waitForTimeout(1500);
    await tabB.locator("#qty").fill("3");
    await tabB.getByRole("button", { name: /^Buy 3 SPY$/ }).click();
    await waitFor(async () => ((await state(tabB)).positions.SPY?.qty ?? 0) === 3, 5000, 100); // the order now takes a cross-tab lock first
    const spyBefore = (await state(tabB)).positions.SPY?.qty ?? 0;
    const entries = (st) => st.trades.filter((t) => t.role === "entry").length; // exit fills of earlier brackets are legitimate new trades
    const tradesBefore = entries(await state(tabB));
    check("tab B trade is saved", spyBefore === 3);
    await tabA.bringToFront(); // the user switches back to the stale tab, which is visible again and ticking
    // tab A stays open and its 10s equity snapshot fires. Sample storage every 500ms: a stale write may be repaired a moment later by another tab, so one late read is not enough.
    let lost = 0;
    for (let i = 0; i < 30; i++) {
      await tabA.waitForTimeout(500);
      const st = await state(tabA);
      if (st.positions.SPY?.qty !== 3 || entries(st) < tradesBefore) lost++;
    }
    const afterA = await state(tabA);
    check("multi-tab: trade made in tab B survives while tab A stays open 15s", lost === 0 && afterA.positions.SPY?.qty === 3 && entries(afterA) === tradesBefore, `SPY ${afterA.positions.SPY?.qty}, entry trades ${entries(afterA)}/${tradesBefore} (new: ${afterA.trades.slice(0, 3).map((t) => `${t.role} ${t.symbol}`).join(", ")}), ${lost}/30 samples missing it`);
    // tab A's in-memory state caught up too (storage events rehydrate it), so its next write cannot lose the trade
    await tabA.reload();
    check("multi-tab: a fresh load of tab A still has the trade", (await state(tabA)).positions.SPY?.qty === 3);
    const mA = await price(tabA, "SPY");
    await tabA.waitForTimeout(4500);
    check("multi-tab: the market keeps ticking with two tabs open", (await price(tabB, "SPY")) !== undefined && (await tabB.evaluate(() => JSON.parse(localStorage.getItem("sp-market")).state.intraday.SPY.length)) > 40, `SPY ${mA}`);
    await tabA.close();
    await tabB.close();
  }
  {
    // N4: a limit buy whose stop sits between market and limit is rejected up front, and the checklist says so
    await page.goto(`${BASE}/markets/KO`);
    await page.getByRole("radio", { name: "Limit" }).click();
    const kp = await price(page, "KO");
    await page.locator("#trigger").fill((kp * 1.05).toFixed(2));
    await page.locator("#qty").fill("5");
    await page.locator("#stop").fill((kp * 1.02).toFixed(2));
    await page.locator("#target").fill((kp * 1.3).toFixed(2));
    await page.locator("#thesis").fill("Testing that a stop above the price this order fills at is caught before I place it.");
    check("N4 checklist does not tick a stop above the expected fill", (await checkOf(page, "stop")) === "false");
    const before = (await state(page)).orders.length;
    await page.getByRole("button", { name: "Place limit buy" }).click();
    await page.getByRole("alert").filter({ hasText: "stop-loss must be below" }).waitFor({ timeout: 5000 }).catch(() => {});
    check("N4 limit buy with stop above the fill price is rejected with a reason", await page.getByRole("alert").filter({ hasText: "stop-loss must be below" }).isVisible() && (await state(page)).orders.length === before);

    // fill-time: price gaps below the stop, so no valid stop leg can exist. It is cancelled, noted and toasted, never dropped silently.
    await page.goto(`${BASE}/markets/JNJ`);
    await page.getByRole("radio", { name: "Limit" }).click();
    const jp = await price(page, "JNJ");
    await page.locator("#trigger").fill(jp.toFixed(2));
    await page.locator("#qty").fill("4");
    await page.locator("#stop").fill((jp * 0.99).toFixed(2));
    await page.locator("#target").fill((jp * 1.3).toFixed(2));
    await page.getByRole("button", { name: "Place limit buy" }).click();
    await waitFor(async () => (await state(page)).orders.some((o) => o.symbol === "JNJ" && o.status === "open" && o.type === "limit"), 5000, 100);
    const jOrder = (await state(page)).orders.find((o) => o.symbol === "JNJ" && o.status === "open" && o.type === "limit");
    check("N4 limit buy with a valid stop is accepted", !!jOrder);
    await page.evaluate((px) => window.__vantageTest.setPrices({ JNJ: px }), jp * 0.96);
    await waitFor(async () => (await state(page)).positions.JNJ?.qty === 4, 8000, 200);
    s = await state(page);
    const jEntry = s.orders.find((o) => o.id === jOrder?.id);
    check("N4 fill below the stop cancels the stop leg and records why", s.positions.JNJ?.qty === 4 && !s.orders.some((o) => o.symbol === "JNJ" && o.role === "stop-loss" && o.status === "open") && /Stop-loss at .* was cancelled/.test(jEntry?.note ?? ""), jEntry?.note);
    check("N4 the take-profit leg is still created", s.orders.some((o) => o.symbol === "JNJ" && o.role === "take-profit" && o.status === "open"));
    check("N4 the user is told with a toast", await page.getByText(/filled without a stop-loss/).first().isVisible());
  }
  for (const sym of ["NVDA", "AAPL", "SPY", "JPM"]) {
    // N3: "2% of account" must give risk at or under 2% at the actual fill (fresh $100k account per ticker so cash never caps the size)
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const p = await c.newPage();
    watch(p, `n3-${sym}`);
    await p.goto(`${BASE}/dashboard`);
    await p.getByPlaceholder("Your first name").fill("Sam");
    await consent(p);
    await p.getByRole("button", { name: "Continue" }).click();
    await p.getByText("A little").click();
    await p.getByRole("button", { name: "Continue" }).click();
    await p.getByRole("button", { name: "Start trading" }).click();
    await p.goto(`${BASE}/markets/${sym}`);
    await p.getByRole("button", { name: "−3%" }).click();
    await p.getByRole("button", { name: "+10%" }).click();
    await p.getByRole("button", { name: "2% of account" }).click();
    await p.locator("#thesis").fill("Sizing check: I expect a bounce because the stop is defined; I am wrong if it breaks the stop.");
    const riskTick = await checkOf(p, "risk");
    await p.getByRole("button", { name: new RegExp(`^Buy \\d+ ${sym}$`) }).click();
    await waitFor(async () => (await state(p)).trades[0]?.symbol === sym, 8000, 200);
    const t = (await state(p)).trades[0];
    check(`N3 ${sym}: 2% sizing fills at risk ≤ 2% and the review agrees`, riskTick === "true" && t.metrics.riskPct <= 0.02 && t.metrics.riskPct > 0.018 && !t.flags.some((f) => f.id === "risk-high"), `risk ${(t.metrics.riskPct * 100).toFixed(3)}%`);
    await c.close();
  }
  {
    // F9: stop and target accept only valid positive numbers
    await page.goto(`${BASE}/markets/NVDA`);
    await page.locator("#qty").fill("2");
    await page.locator("#thesis").fill("Parsing check for stop input so I know exactly what the ticket understood from my text.");
    for (const bad of ["5abc", "1e3", "0.001", "-5", "Infinity", "1,10"]) {
      await page.locator("#stop").fill(bad);
      const msg = await page.locator('[data-field-error="stop"]').isVisible();
      const ok = await checkOf(page, "stop");
      if (!msg || ok !== "false") check(`F9 "${bad}" is treated as unset with a visible message`, false, `message ${msg}, ticked ${ok}`);
    }
    check("F9 invalid stops show a message and leave the stop unset", true);
    await page.locator("#stop").fill("5abc");
    await page.locator("#target").fill("12x");
    check("F9 invalid target shows its own message", await page.locator('[data-field-error="target"]').isVisible());
    const np = await price(page, "NFLX");
    await page.goto(`${BASE}/markets/NFLX`);
    await page.locator("#qty").fill("1");
    await page.locator("#stop").fill((np * 0.95).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    check("F9 a stop with thousands separators is read correctly", (await checkOf(page, "stop")) === "true" && !(await page.locator('[data-field-error="stop"]').isVisible()), `NFLX ${np}`);
    await page.locator("#stop").fill("5.5");
    check("F9 a valid number clears the message", !(await page.locator('[data-field-error="stop"]').isVisible()));
    // N20: emoji count as one character each
    await page.locator("#thesis").fill("🚀".repeat(20));
    check("N20 20 emoji do not count as a 40 character reason", (await checkOf(page, "reason")) === "false");
  }
  {
    // N2: a double click places one order
    await page.goto(`${BASE}/markets/V`);
    await page.locator("#qty").fill("2");
    await page.getByRole("button", { name: /^Buy 2 V$/ }).click();
    await waitFor(async () => ((await state(page)).positions.V?.qty ?? 0) === 2, 5000, 100);
    // the redesigned ticket locks Buy after a fill until the next edit, so make an edit (and let the 1.5s repeat window pass) first
    await page.locator("#qty").fill("1");
    await page.locator("#qty").fill("2");
    await page.waitForTimeout(1600);
    await page.getByRole("button", { name: /^Buy 2 V$/ }).dblclick(); // repeat of the same order, no edit in between
    await page.waitForTimeout(1200);
    const vq = (await state(page)).positions.V?.qty ?? 0;
    check("N2 double-clicking Buy places one more order, not two", vq === 4, `V qty ${vq}`);
  }
  {
    // N10: malformed saved state recovers instead of crashing every page
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c.addInitScript(() => {
      if (!localStorage.getItem("seeded")) {
        localStorage.setItem("seeded", "1");
        localStorage.setItem("sp-app", JSON.stringify({ state: { positions: null, trades: {}, orders: "x", cash: "100" }, version: 1 }));
      }
    });
    const p = await c.newPage();
    await p.goto(`${BASE}/dashboard`);
    await p.waitForTimeout(1500);
    const crashed = await p.getByText("Application error").count();
    check("N10 malformed saved state does not crash the app", crashed === 0);
    await c.close();
  }

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
    // C1: first-run keyboard cannot reach or use anything behind the consent modal
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    c.on("page", (np) => np !== p && np.close().catch(() => {})); // consent links open new tabs
    watch(p, "keyboard-trap");
    await p.goto(`${BASE}/markets/NVDA`);
    await p.getByLabel(/I.m 18 or older/).waitFor();
    let escaped = 0;
    for (let i = 0; i < 90; i++) {
      await p.keyboard.press("Tab");
      const where = await p.evaluate(() => {
        const a = document.activeElement;
        return { inside: !!a?.closest('[role="dialog"]'), tag: a?.tagName, link: a?.tagName === "A" };
      });
      if (!where.inside) escaped++;
      if (!where.link) await p.keyboard.press("Enter");
    }
    const st = await state(p);
    check("first-run: Tab never leaves the consent dialog (90 tabs)", escaped === 0, `${escaped} escapes`);
    check("first-run: Tab and Enter cannot place an order or reach app controls", !st || ((st.trades ?? []).length === 0 && (st.orders ?? []).length === 0 && Object.keys(st.positions ?? {}).length === 0 && !st.profile?.onboarded), JSON.stringify({ trades: st?.trades?.length, onboarded: st?.profile?.onboarded }));
    check("first-run: app behind the dialog is inert", await p.evaluate(() => [...document.body.children].filter((el) => !el.hasAttribute("data-dialog-host") && el.tagName !== "SCRIPT" && el.querySelector("aside, main")).every((el) => el.hasAttribute("inert"))));
    await c.close();
  }
  {
    // privacy promise: with the probe failing, nothing is POSTed to the AI routes
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    p.on("pageerror", (e) => errors.push(`[probe-fails] pageerror: ${e.message}`)); // the aborted probe always logs a network console error
    const posts = [];
    p.on("request", (r) => r.method() === "POST" && /\/api\/(coach|review)/.test(r.url()) && posts.push(r.url()));
    await p.route("**/api/coach", (route) => (route.request().method() === "GET" ? route.abort() : route.continue()));
    await p.goto(`${BASE}/coach`);
    const chatBefore = (await state(p)).chat.length;
    await p.getByLabel("Message Nova").fill("How do I figure out how many shares to buy?");
    await p.getByLabel("Message Nova").press("Enter");
    const replied = await waitFor(async () => {
      const ch = (await state(p)).chat;
      return ch.length >= chatBefore + 2 && ch[ch.length - 1].role === "assistant" && ch[ch.length - 1].content.length > 20;
    }, 20000);
    check("probe failure: coach still answers locally", replied);
    await p.goto(`${BASE}/markets/KO`);
    await p.getByRole("button", { name: /^Buy \d+ KO$/ }).click();
    await waitFor(async () => (await state(p)).trades.some((t) => t.symbol === "KO" && t.reviewStatus === "done"), 15000);
    await p.goto(`${BASE}/community`);
    await p.getByLabel("Post text").fill("Probe failure test post.");
    await p.getByRole("button", { name: "Post", exact: true }).click();
    await waitFor(async () => { const st2 = await state(p); const id = st2.posts[0]?.id; return !!id && (st2.comments[id] ?? []).some((cm) => cm.authorId === "u7"); }, 20000);
    check("probe failure: no POST to /api/coach or /api/review (chat, review, Nova reply)", posts.length === 0, posts.join(","));
    await c.close();
  }
  {
    // AI mode without the notice: the notice shows before any POST; after it, POSTs carry the acknowledgement
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "ai-gate");
    const posts = [];
    await p.route("**/api/coach", (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: { mode: "ai" } });
      posts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "text/plain", body: "Mock AI reply for verification of the notice gate." });
    });
    await p.goto(`${BASE}/coach`);
    const dlg = p.getByRole("dialog", { name: "Nova uses an AI service" });
    await dlg.waitFor({ timeout: 8000 });
    await p.waitForTimeout(1200);
    check("AI mode, no notice yet: the notice is shown and nothing has been POSTed", (await dlg.isVisible()) && posts.length === 0);
    await dlg.getByRole("button", { name: "I understand" }).click();
    await p.getByLabel("Message Nova").fill("How do I figure out how many shares to buy?");
    await p.getByLabel("Message Nova").press("Enter");
    await waitFor(async () => posts.length > 0, 8000, 250);
    check("after the notice, the POST carries aiNoticeAck and the reply shows", posts.length === 1 && posts[0].aiNoticeAck === true && (await p.getByText("Mock AI reply for verification").first().isVisible().catch(() => false)));
    await c.close();
  }
  {
    // I-A: chat written before the AI notice was acknowledged must never reach the provider
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "ai-history");
    let mode = "offline";
    const posts = [];
    await p.route("**/api/coach", (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: { mode } });
      posts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "text/plain", body: "Mock AI reply for the history check." });
    });
    await p.goto(`${BASE}/coach`);
    await p.getByText(/Offline playbook/).waitFor({ timeout: 8000 });
    await p.getByLabel("Message Nova").fill("SECRET-OFFLINE-NOTE about my plan");
    await p.getByLabel("Message Nova").press("Enter");
    await waitFor(async () => { const ch = (await state(p)).chat; return ch.length >= 2 && ch[ch.length - 1].role === "assistant" && ch[ch.length - 1].content.length > 10; }, 15000, 250);
    check("offline mode: nothing is POSTed while chatting", posts.length === 0);
    mode = "ai";
    await p.reload();
    const dlg = p.getByRole("dialog", { name: "Nova uses an AI service" });
    await dlg.waitFor({ timeout: 8000 });
    await dlg.getByRole("button", { name: "I understand" }).click();
    await p.getByLabel("Message Nova").fill("A brand new question after the notice");
    await p.getByLabel("Message Nova").press("Enter");
    await waitFor(async () => posts.length > 0, 8000, 250);
    const body = JSON.stringify(posts[0] ?? {});
    check("AI history: messages written before the notice are never sent", posts.length === 1 && !body.includes("SECRET-OFFLINE-NOTE") && body.includes("A brand new question after the notice"), body.slice(0, 200));
    const earlier = (await state(p)).chat.filter((m) => m.content && body.includes(m.content) === false).length;
    check("AI history: no earlier chat text appears in the request", earlier > 0 && (posts[0].messages ?? []).length === 1, `${(posts[0]?.messages ?? []).length} messages sent`);
    check("earlier messages are visibly marked as kept on this device", (await p.getByText("Kept on this device").count()) >= 1);
    await c.close();
  }
  {
    // I-B: a failed probe is "unknown" on /coach: no offline claim, nothing sent until a probe succeeds
    const c0 = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p0 = await c0.newPage();
    watch(p0, "probe-ack");
    await p0.route("**/api/coach", (route) => (route.request().method() === "GET" ? route.fulfill({ json: { mode: "ai" } }) : route.continue()));
    await p0.goto(`${BASE}/coach`);
    await p0.getByRole("dialog", { name: "Nova uses an AI service" }).getByRole("button", { name: "I understand" }).click();
    await p0.waitForFunction(() => !!JSON.parse(localStorage.getItem("sp-app")).state.profile.aiNoticeAt);
    const acked = await c0.storageState();
    await c0.close();
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: acked });
    const p = await c.newPage();
    p.on("pageerror", (e) => errors.push(`[probe-unknown] pageerror: ${e.message}`)); // aborted probes log a network console error
    let probeOk = false;
    const posts = [];
    await p.route("**/api/coach", (route) => {
      if (route.request().method() === "GET") return probeOk ? route.fulfill({ json: { mode: "ai" } }) : route.abort();
      posts.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: "text/plain", body: "Mock AI reply after the probe recovered." });
    });
    await p.goto(`${BASE}/coach`);
    await p.getByText(/Can.t tell yet whether the AI coach is on/).waitFor({ timeout: 8000 });
    const page1 = await p.locator("main").innerText();
    check("failed probe: header and footer say unknown, never offline or not sent anywhere", !/Offline playbook|not sent anywhere|stays on this device|Nova can see your/.test(page1) && /nothing you write is sent until the check succeeds/.test(page1), page1.slice(0, 160).replace(/\s+/g, " "));
    await p.getByLabel("Message Nova").fill("Message while the probe is failing");
    await p.getByLabel("Message Nova").press("Enter");
    await waitFor(async () => { const ch = (await state(p)).chat; return ch.some((m) => m.content === "Message while the probe is failing") && ch[ch.length - 1].role === "assistant" && ch[ch.length - 1].content.length > 10; }, 15000, 250);
    check("failed probe: the message is answered locally and nothing is POSTed", posts.length === 0);
    probeOk = true;
    await p.getByLabel("Message Nova").fill("Message after the probe recovered");
    await p.getByLabel("Message Nova").press("Enter");
    await waitFor(async () => posts.length > 0, 8000, 250);
    const sent = JSON.stringify(posts[0] ?? {});
    check("after a successful probe the POST is made, without the message typed during the failure", posts.length === 1 && sent.includes("Message after the probe recovered") && !sent.includes("Message while the probe is failing"), sent.slice(0, 200));
    check("after a successful probe the footer states what is sent", await p.getByText(/are sent to our AI provider/).first().isVisible());
    await c.close();
  }
  {
    // M-1: no trade review (AI or local) while the terms gate is up
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "review-gate");
    const reqs = [];
    p.on("request", (r) => /\/api\/(coach|review)/.test(r.url()) && reqs.push(`${r.method()} ${new URL(r.url()).pathname}`));
    await p.route("**/api/coach", (route) => (route.request().method() === "GET" ? route.fulfill({ json: { mode: "ai" } }) : route.continue()));
    await p.route("**/api/review", (route) => route.fulfill({ json: { offline: true } }));
    await p.addInitScript(() => {
      if (sessionStorage.getItem("rg-patched")) return;
      sessionStorage.setItem("rg-patched", "1");
      const raw = localStorage.getItem("sp-app");
      if (!raw) return;
      const s = JSON.parse(raw);
      s.state.profile.consent = { version: "2000-01-01", acceptedAt: new Date().toISOString() };
      s.state.profile.aiNoticeAt = new Date().toISOString();
      const t = { ...s.state.trades[0], id: "pending-review-test", reviewStatus: "pending" };
      delete t.review;
      s.state.trades = [t, ...s.state.trades];
      localStorage.setItem("sp-app", JSON.stringify(s));
    });
    await p.goto(`${BASE}/dashboard`);
    await p.getByRole("dialog").waitFor({ timeout: 8000 });
    await p.waitForTimeout(6000);
    const st1 = (await state(p)).trades.find((t) => t.id === "pending-review-test");
    check("terms gate up: no review is requested and the trade stays pending", st1?.reviewStatus === "pending" && !reqs.some((r) => r.startsWith("POST")), reqs.join(","));
    await p.getByLabel(/I.m 18 or older/).check();
    await p.getByRole("button", { name: "Agree and continue" }).click();
    await waitFor(async () => (await state(p)).trades.find((t) => t.id === "pending-review-test")?.reviewStatus === "done", 15000, 250);
    check("after agreeing, the pending review is requested", reqs.includes("POST /api/review"), reqs.join(","));
    await c.close();
  }
  {
    // status bar must not cover the Buy button or the end of a long page (1440x900)
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "statusbar");
    await p.goto(`${BASE}/markets/NVDA`);
    const buy = p.getByRole("button", { name: /^Buy \d+ NVDA$/ });
    await buy.waitFor();
    const probe = () => p.evaluate(() => {
      const bar = document.querySelector("footer.fixed").getBoundingClientRect();
      const b = [...document.querySelectorAll("button")].find((x) => /^Buy \d+ NVDA$/.test(x.textContent.trim()))?.getBoundingClientRect();
      return { barTop: bar.top, buyBottom: b?.bottom, buyTop: b?.top };
    });
    const ys = [];
    for (const y of [400, 100000]) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await p.waitForTimeout(250);
      ys.push(await probe());
    }
    check("1440x900: the Buy button scrolls fully into view above the status bar", ys.every((r) => r.buyBottom <= r.barTop - 4 && r.buyTop >= 0), JSON.stringify(ys));
    const risk = await p.getByRole("group", { name: "Size by risk" }).getByRole("button").evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().top)));
    check("1440x900: the three size-by-risk buttons sit on one row", risk.length === 3 && new Set(risk).size === 1, risk.join(","));
    const links = await p.locator("footer.fixed a, footer.fixed button").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    const barH = await p.evaluate(() => Math.round(document.querySelector("footer.fixed").getBoundingClientRect().height));
    check("status bar links are at least 40px tall and the bar stays light (at most 52px)", links.length >= 4 && links.every((h) => h >= 40) && barH <= 52, `links ${links.join(",")} bar ${barH}`);
    for (const route of ["/dashboard", "/journal", "/learn"]) {
      await p.goto(`${BASE}${route}`);
      await p.waitForTimeout(1200);
      await p.evaluate(() => window.scrollTo(0, 1e6));
      await p.waitForTimeout(300);
      const gap = await p.evaluate(() => {
        const bar = document.querySelector("footer.fixed").getBoundingClientRect();
        let el = document.querySelector("main");
        for (;;) {
          const kids = [...el.children].filter((k) => k.getBoundingClientRect().height > 0 && getComputedStyle(k).display !== "none");
          if (!kids.length) break;
          el = kids[kids.length - 1];
        }
        return { barTop: Math.round(bar.top), bottom: Math.round(el.getBoundingClientRect().bottom), tag: el.tagName };
      });
      check(`1440x900: the last element of ${route} scrolls fully above the status bar`, gap.bottom <= gap.barTop - 8, JSON.stringify(gap));
    }
    await c.close();
  }
  {
    // F1: a new user sees "Start here" instead of an empty template; it hides after the first buy with a stop-loss
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    watch(p, "start-here");
    await p.goto(`${BASE}/dashboard`);
    await p.getByPlaceholder("Your first name").fill("Riley");
    await consent(p);
    await p.getByRole("button", { name: "Skip" }).click();
    const sh = p.getByTestId("start-here");
    await sh.waitFor({ timeout: 10000 });
    const rows = await sh.locator("li").count();
    check("new user: Start here shows three steps and an Open SPY link to /markets/SPY", rows === 3 && (await sh.getByRole("link", { name: "Open SPY" }).getAttribute("href")) === "/markets/SPY");
    check("new user: no empty chart frame, zero deltas or zeroed stats", (await p.getByText("Realized P&L").count()) === 0 && (await p.locator('svg[aria-label="Account value over time"], [aria-label="Account value over time"]').count()) === 0 && (await p.getByText("since you started with $100,000").count()) === 0);
    await p.goto(`${BASE}/markets/SPY`);
    await p.getByLabel(/Why are you making this trade/).fill("I expect the broad market to keep rising because earnings are steady, and I am wrong if it closes under the recent low.");
    await p.locator("#stop").waitFor();
    await p.getByRole("button", { name: "−5%" }).first().click();
    await p.getByRole("button", { name: /^Buy \d+ SPY$/ }).click();
    await waitFor(async () => (await state(p)).orders.some((o) => o.role === "stop-loss"), 10000, 250);
    await p.goto(`${BASE}/dashboard`);
    await p.getByText("Realized P&L").waitFor({ timeout: 10000 });
    check("after the first buy with a stop-loss, Start here is gone and the stats are shown", (await p.getByTestId("start-here").count()) === 0);
    await c.close();
  }
  {
    // F2: every app route has its own descriptive title
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "titles");
    const titles = {};
    for (const r of ["/dashboard", "/markets", "/markets/NVDA", "/markets/SPY", "/learn", "/learn/position-sizing", "/coach", "/community", "/journal", "/settings", "/upgrade", "/debrief"]) {
      await p.goto(`${BASE}${r}`);
      titles[r] = await p.title();
    }
    const vals = Object.values(titles);
    check("every app route has a unique title ending in Vantage, with no middle dot", new Set(vals).size === vals.length && vals.every((t) => /Vantage$/.test(t) && !t.includes("\u00b7")), JSON.stringify(titles));
    check("titles name the page (Markets, NVDA, Coach)", /^Markets/.test(titles["/markets"]) && /NVDA/.test(titles["/markets/NVDA"]) && /^Coach/.test(titles["/coach"]));
    await c.close();
  }
  {
    // F3: Settings shows no raw bracketed placeholder; the Terms mark placeholders as to be completed
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "placeholders");
    await p.goto(`${BASE}/settings`);
    await p.getByText("Membership").waitFor();
    check("settings shows no raw bracketed placeholder", !/\[[^\]]+@[^\]]+\]|\[legal/.test(await p.locator("main").innerText()));
    await p.goto(`${BASE}/terms`);
    await p.locator("mark.ph").first().waitFor({ timeout: 8000 });
    check("terms render bracketed placeholders with a visible to-be-completed mark", (await p.locator("mark.ph").count()) >= 2);
    await c.close();
  }
  {
    // F4: no emoji in seed content
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "zero-delta");
    await p.goto(`${BASE}/community`);
    check("community seed posts contain no emoji", !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(await p.locator("main").innerText()));
    await c.close();
  }
  {
    // I-1: every quick-button plan, and random plans, give one consistent answer in the ticket, review, journal and missions
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    await c.addInitScript(() => { window.__VANTAGE_TEST__ = true; });
    const p = await c.newPage();
    watch(p, "rr-cents");
    await p.goto(`${BASE}/markets/NVDA`);
    await p.locator("#stop").waitFor();
    await p.waitForFunction(() => !!window.__vantageTest?.modules);
    const rows = [];
    for (const px of [190.4, 151.07, 77.77, 412.31]) {
      await p.evaluate((v) => window.__vantageTest.setPrices({ NVDA: v }), px);
      await p.waitForTimeout(200);
      for (const sp of ["−3%", "−5%", "−8%"]) {
        for (const tp of ["+6%", "+10%", "+16%"]) {
          const r = await p.evaluate(async ([s, t]) => {
            const btn = (txt) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === txt);
            const quoteText = () => document.querySelector('aside[aria-label="Order ticket"] h2 + span')?.textContent;
            const before = quoteText();
            btn(s).click();
            btn(t).click();
            await new Promise((res) => setTimeout(res, 80));
            const stop = Number(document.querySelector("#stop").value);
            const target = Number(document.querySelector("#target").value);
            const ok = document.querySelector('[data-check-id="target"]')?.getAttribute("data-ok") === "true";
            const shown = quoteText();
            return { stop, target, ok, before, shown };
          }, [sp, tp]);
          const q = Number((r.shown ?? "").replace(/[$,]/g, ""));
          const entry = Math.round(q * 1.0002 * 100) / 100;
          const e = Math.round(entry * 100), risk = e - Math.round(r.stop * 100), reward = Math.round(r.target * 100) - e;
          rows.push({ px, sp, tp, ok: r.ok, expected: risk > 0 && reward >= 2 * risk, diagonal: (sp === "−3%" && tp === "+6%") || (sp === "−5%" && tp === "+10%") || (sp === "−8%" && tp === "+16%"), same: r.before === r.shown });
        }
      }
    }
    const stable = rows.filter((r) => r.same);
    check("every −3/−5/−8% × +6/+10/+16% plan: the ticket's target check matches exact cents", stable.length >= 30 && stable.every((r) => r.ok === r.expected), JSON.stringify(stable.filter((r) => r.ok !== r.expected).slice(0, 3)));
    check("the 2:1 quick-button pairs always pass the target check", stable.filter((r) => r.diagonal).length >= 10 && stable.filter((r) => r.diagonal).every((r) => r.ok), JSON.stringify(stable.filter((r) => r.diagonal && !r.ok).slice(0, 3)));
    // property check over 200 random triples: preflight, review, journal record and missions agree with exact cents
    const prop = await p.evaluate(() => {
      const { preflightChecks, analyzeTrade, tradeChecks, missionDone } = window.__vantageTest.modules;
      const thesis = "I expect steady earnings to lift the shares because demand is strong, and I am wrong if they close below the low.";
      let seed = 12345;
      const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
      const bad = [];
      let passes = 0;
      for (let i = 0; i < 200; i++) {
        const entry = Math.round((50 + rnd() * 950) * 100) / 100;
        const stop = Math.round(entry * (1 - (0.01 + rnd() * 0.14)) * 100) / 100;
        const target = Math.round(entry * (1 + (0.01 + rnd() * 0.3)) * 100) / 100;
        const e = Math.round(entry * 100), risk = e - Math.round(stop * 100), reward = Math.round(target * 100) - e;
        const expected = risk > 0 && reward > 0 && reward >= 2 * risk;
        if (expected) passes++;
        const qty = 1;
        const pf = preflightChecks({ side: "buy", qty, entry, stopLoss: stop, takeProfit: target, thesis, equity: 100000 }).find((c) => c.id === "target");
        const ctx = { equity: 100000, cash: 100000, positions: {}, prices: { NVDA: entry }, prevClose: { NVDA: entry }, recentTradeCount: 0 };
        const a = analyzeTrade({ symbol: "NVDA", side: "buy", qty, price: entry, role: "entry", thesis, stopLoss: stop, takeProfit: target }, ctx);
        const review = a.flags.some((f) => f.id === "rr-good");
        const trade = { id: "x", symbol: "NVDA", side: "buy", qty, price: entry, role: "entry", thesis, stopLoss: stop, takeProfit: target, score: a.score, flags: a.flags, metrics: a.metrics, at: 0, orderId: "o", reviewStatus: "done" };
        const journal = tradeChecks(trade).target === "done";
        const mission = missionDone("rr-2", { trades: [trade], orders: [], positions: {}, chat: [], posts: [] });
        const wording = !pf.ok && pf.fix && /^Set a target of \$([\d,.]+) or more$/.test(pf.fix) ? Number(pf.fix.match(/\$([\d,.]+)/)[1].replace(/,/g, "")) > target : pf.ok || !pf.fix?.startsWith("Set a target");
        if (pf.ok !== expected || review !== expected || journal !== expected || mission !== expected || !wording) bad.push({ entry, stop, target, expected, pf: pf.ok, review, journal, mission, fix: pf.fix });
      }
      return { bad: bad.slice(0, 3), n: bad.length, passes };
    });
    check("200 random plans: ticket, review, journal and missions all agree with exact cents, and the fix text never asks for the target already set", prop.n === 0 && prop.passes > 20, JSON.stringify(prop));
    // a real −5% / +10% trade: recorded ratio, journal tick and mission
    await p.evaluate((v) => window.__vantageTest.setPrices({ NVDA: v }), 190.4);
    await p.getByLabel(/Why are you making this trade/).fill("I expect the chip leader to keep winning orders because demand is strong, and I am wrong if it falls below the recent low.");
    await p.getByRole("button", { name: "−5%" }).first().click();
    await p.getByRole("button", { name: "+10%" }).first().click();
    await p.getByRole("button", { name: "1% of account" }).click().catch(() => {});
    await p.getByRole("button", { name: /^Buy \d+ NVDA$/ }).click();
    await waitFor(async () => (await state(p)).trades.some((t) => t.thesis?.startsWith("I expect the chip leader") && t.takeProfit), 10000, 250);
    await waitFor(async () => !!(await state(p)).missions["rr-2"], 8000, 250);
    const st = await state(p);
    const tr = st.trades.find((t) => t.thesis?.startsWith("I expect the chip leader"));
    check("a −5% / +10% trade records a ratio of at least 2, ticks the target in the journal and completes the 2:1 mission", tr.metrics.rewardRisk >= 2 - 1e-9 && !!st.missions["rr-2"], `rr ${tr?.metrics.rewardRisk}`);
    await c.close();
  }
  {
    // I-2a: a full page load right after a trade must not lose the next confirmed order
    let lost = 0;
    const trials = 5;
    for (let i = 0; i < trials; i++) {
      const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
      const a = await c.newPage();
      const b = await c.newPage();
      watch(a, "lost-A");
      watch(b, "lost-B");
      await a.goto(`${BASE}/dashboard`);
      await b.goto(`${BASE}/markets/AAPL`);
      const n0 = (await state(b)).trades.length;
      await b.getByRole("button", { name: /^Buy \d+ AAPL$/ }).click();
      await waitFor(async () => (await state(b)).trades.length === n0 + 1, 5000, 20); // confirmed, then navigate at once
      await b.goto(`${BASE}/markets/KO`, { waitUntil: "commit" });
      const buyKo = b.getByRole("button", { name: /^Buy \d+ KO$/ });
      await buyKo.click({ timeout: 15000 });
      await b.getByText(/Bought \d+ KO/).waitFor({ timeout: 10000 }).catch(() => {});
      await b.waitForTimeout(1500);
      const sa = await state(a), sb = await state(b);
      const syms = (st) => st.trades.slice(0, st.trades.length - n0).map((t) => t.symbol);
      const stored = syms(sb);
      if (!(sb.trades.length === n0 + 2 && stored.includes("AAPL") && stored.includes("KO") && sa.trades.length === n0 + 2)) lost++;
      await c.close();
    }
    check(`reload right after a trade: no confirmed order is lost (${trials} trials)`, lost === 0, `${lost} lost`);
  }
  {
    // I-2b: two tabs click Buy at the same moment, 10 trials: both orders are kept
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const a = await c.newPage();
    const b = await c.newPage();
    watch(a, "simul-A");
    watch(b, "simul-B");
    await a.goto(`${BASE}/markets/AAPL`);
    await b.goto(`${BASE}/markets/KO`);
    await a.locator("#qty").waitFor();
    await b.locator("#qty").waitFor();
    const n0 = (await state(a)).trades.length;
    let wrong = 0;
    for (let i = 1; i <= 10; i++) {
      await a.locator("#qty").fill(String(i));
      await b.locator("#qty").fill(String(i));
      await Promise.all([a.getByRole("button", { name: /^Buy \d+ AAPL$/ }).click(), b.getByRole("button", { name: /^Buy \d+ KO$/ }).click()]);
      await a.waitForTimeout(700);
      const st = await state(a);
      if (st.trades.length !== n0 + i * 2) wrong++;
    }
    await a.waitForTimeout(1500);
    const fa = await state(a), fb = await state(b);
    const held = (st) => (st.positions.AAPL?.qty ?? 0) + (st.positions.KO?.qty ?? 0);
    check("two tabs buying at the same moment (10 trials): zero lost orders, both tabs agree", wrong === 0 && fa.trades.length === n0 + 20 && fb.trades.length === n0 + 20 && held(fa) === held(fb), `A ${fa.trades.length - n0}, B ${fb.trades.length - n0}, wrong rounds ${wrong}`);
    await waitFor(async () => (await state(a)).trades.slice(0, 20).every((t) => t.reviewStatus === "done"), 20000, 500);
    check("two tabs: every one of the 20 trades gets its review exactly once (none left pending)", (await state(a)).trades.slice(0, 20).every((t) => t.reviewStatus === "done" && !!t.review));
    await c.close();
  }
  {
    // I-3: no HTML-entity residue or doubled words in the visible text of any page
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "entities");
    const routes = ["/", ...ROUTES.filter((r) => r !== "/")];
    const bad = [];
    for (const r of routes) {
      await p.goto(`${BASE}${r}`);
      await p.waitForTimeout(600);
      const txt = await p.evaluate(() => document.body.innerText);
      const ent = txt.match(/&apos;|apos;|&amp;|&quot;|quot;|&lt;|&gt;|&#\d+;/);
      // doubled words inside one text block (a tag followed by text, such as "Simulated" + "Simulated prices", is two blocks)
      const dbl = await p.evaluate(() => {
        for (const el of document.querySelectorAll("p, li, h1, h2, h3, h4, td, dd, dt, label, summary")) {
          if (el.querySelector("p, li, h1, h2, h3, ul, ol, td")) continue;
          const m = el.innerText.match(/\b([A-Za-z]{3,})\s+\1\b/i);
          if (m && m[1] !== m[1].toUpperCase()) return m; // repeated tickers (AMD AMD) are symbol plus name
        }
        return null;
      });
      if (ent) bad.push(`${r}: entity ${ent[0]}`);
      if (dbl && !/^(had|that|very)$/i.test(dbl[1])) bad.push(`${r}: doubled "${dbl[0].replace(/\s+/g, " ")}"`);
    }
    check(`no entity residue ("&apos;", "apos;", "&amp;") or doubled words on ${routes.length} pages`, bad.length === 0, bad.slice(0, 4).join(" | "));
    await c.close();
  }
  {
    // I-4: the journal check record fits on phones: every header and label is inside the viewport
    for (const w of [360, 390]) {
      const c = await browser.newContext({ ...devices["iPhone 14"], viewport: { width: w, height: 800 }, storageState: storageNow });
      const p = await c.newPage();
      watch(p, `journal-${w}`);
      await p.goto(`${BASE}/journal`);
      await p.getByTestId("record-phone").waitFor({ timeout: 10000 });
      const r = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const vis = (el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed";
        const root = document.querySelector('[data-testid="record-phone"]');
        const labels = ["Reason", "Stop", "Risk", "Target", "Size"].map((l) => [...root.querySelectorAll("span")].filter((s) => s.textContent.trim() === l && vis(s)).map((s) => Math.round(s.getBoundingClientRect().right)));
        const heads = [...document.querySelectorAll("th")].filter(vis).map((th) => Math.round(th.getBoundingClientRect().right));
        return { vw, labels, heads, scrollW: document.documentElement.scrollWidth };
      });
      check(`journal at ${w}px: Reason, Stop, Risk, Target and Size are all inside the screen, with no sideways scrolling`, r.labels.every((l) => l.length > 0 && l.every((x) => x <= r.vw)) && r.heads.every((x) => x <= r.vw) && r.scrollW <= r.vw + 1, JSON.stringify(r));
      await c.close();
    }
  }
  // ---- fix round 5: one locked, merging writer for every persisted write; deletion tombstone; toasts; typing during submit ----
  const STREAM_INIT = ([n, ms]) => {
    // a slow chunked AI reply, delivered through the real fetch path of the coach page
    const orig = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      if (/\/api\/coach/.test(url) && init && init.method === "POST") {
        let i = 0;
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async pull(c) {
            if (i >= n) return c.close();
            await new Promise((r) => setTimeout(r, ms));
            c.enqueue(enc.encode(`w${i} `));
            i++;
          },
        });
        return Promise.resolve(new Response(stream, { status: 200, headers: { "content-type": "text/plain" } }));
      }
      return orig(input, init);
    };
  };
  const routeAi = (pg) => pg.route("**/api/coach", (route) => (route.request().method() === "GET" ? route.fulfill({ json: { mode: "ai" } }) : route.continue()));
  let ackedState;
  {
    const c0 = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const p0 = await c0.newPage();
    await routeAi(p0);
    await p0.goto(`${BASE}/coach`);
    await p0.getByRole("dialog", { name: "Nova uses an AI service" }).getByRole("button", { name: "I understand" }).click();
    await p0.waitForFunction(() => !!JSON.parse(localStorage.getItem("sp-app")).state.profile.aiNoticeAt);
    ackedState = await c0.storageState();
    await c0.close();
  }
  {
    // (a) 50 orders in tab A while tab B streams an AI reply: zero lost orders, the reply intact
    const N = 300;
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ackedState });
    const tabA = await c.newPage();
    const tabB = await c.newPage();
    watch(tabA, "stream-A");
    watch(tabB, "stream-B");
    await routeAi(tabA);
    await routeAi(tabB);
    await tabB.addInitScript(STREAM_INIT, [N, 45]);
    await tabA.goto(`${BASE}/markets/KO`);
    await tabB.goto(`${BASE}/coach`);
    await tabA.locator("#qty").waitFor();
    const n0 = (await state(tabA)).trades.length;
    await tabB.getByLabel("Message Nova").fill("Stream me a long reply while I trade");
    await tabB.getByLabel("Message Nova").press("Enter");
    let placed = 0;
    for (let i = 0; i < 50; i++) {
      await tabA.locator("#qty").fill(i % 2 ? "2" : "1");
      await tabA.getByRole("button", { name: /^Buy \d+ KO$/ }).click();
      placed++;
      await tabA.waitForTimeout(110);
    }
    const expected = Array.from({ length: N }, (_, i) => `w${i}`).join(" ");
    await waitFor(async () => (await state(tabB)).chat.some((m) => m.role === "assistant" && m.content.trim() === expected), 40000, 500);
    await tabA.waitForTimeout(1500);
    const sa = await state(tabA), sb = await state(tabB);
    const reply = (st) => st.chat.filter((m) => m.role === "assistant").map((m) => m.content.trim()).pop();
    check("trading 50 orders in one tab while another streams a reply: zero lost orders", sa.trades.length === n0 + 50 && sb.trades.length === n0 + 50, `A ${sa.trades.length - n0}, B ${sb.trades.length - n0} of ${placed}`);
    check("the streamed reply and the question are intact in storage and in both tabs", reply(sb) === expected && sb.chat.some((m) => m.role === "user" && m.content.startsWith("Stream me a long reply")) && reply(sa) === expected, `${(reply(sb) ?? "").length}/${expected.length} chars`);
    await c.close();
  }
  {
    // (b) delete in tab A while tab B streams or trades, 10 rounds: the deleted data never comes back
    let back = 0;
    const notes = [];
    for (let r = 0; r < 10; r++) {
      const streaming = r % 2 === 0;
      const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ackedState });
      const tabA = await c.newPage();
      const tabB = await c.newPage();
      watch(tabA, `del-A${r}`);
      watch(tabB, `del-B${r}`);
      await routeAi(tabB);
      if (streaming) await tabB.addInitScript(STREAM_INIT, [200, 45]);
      await tabA.goto(`${BASE}/settings`);
      await tabA.getByText("Membership").waitFor();
      let stop = false;
      let busyLoop;
      if (streaming) {
        await tabB.goto(`${BASE}/coach`);
        await tabB.getByLabel("Message Nova").fill("Stream while the other tab deletes");
        await tabB.getByLabel("Message Nova").press("Enter");
      } else {
        await tabB.goto(`${BASE}/markets/KO`);
        await tabB.locator("#qty").waitFor();
        busyLoop = (async () => {
          for (let i = 0; !stop && i < 40; i++) {
            await tabB.locator("#qty").fill(i % 2 ? "2" : "1").catch(() => {});
            await tabB.getByRole("button", { name: /^Buy \d+ KO$/ }).click({ timeout: 1500 }).catch(() => {});
            await tabB.waitForTimeout(90);
          }
        })();
      }
      await tabA.waitForTimeout(1200);
      await tabA.getByRole("button", { name: "Delete all my data" }).click();
      await tabA.getByLabel("Type DELETE to confirm").fill("DELETE");
      await tabA.getByRole("dialog").getByRole("button", { name: "Delete everything" }).click();
      await tabA.getByLabel(/I.m 18 or older/).waitFor({ timeout: 10000 });
      let dirty = 0;
      for (let k = 0; k < 8; k++) {
        await tabA.waitForTimeout(400);
        for (const pg of [tabA, tabB]) {
          const st = await state(pg).catch(() => undefined);
          if (st && (st.trades?.length > 0 || st.profile?.onboarded || st.profile?.consent || (st.chat?.length ?? 0) > 0)) dirty++;
        }
      }
      stop = true;
      await busyLoop;
      const bOnboarding = await tabB.getByLabel(/I.m 18 or older/).isVisible().catch(() => false);
      if (dirty > 0 || !bOnboarding) {
        back++;
        notes.push(`round ${r} ${streaming ? "stream" : "trade"}: dirty samples ${dirty}, B onboarding ${bOnboarding}`);
      }
      await c.close();
    }
    check("delete in one tab while another streams or trades (10 rounds): the deleted data never comes back", back === 0, notes.join("; "));
  }
  {
    // (c) toasts never overlap the ticket's controls, or the coach composer, at 1440x900
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    await c.addInitScript(() => { window.__VANTAGE_TEST__ = true; });
    const p = await c.newPage();
    watch(p, "toast-overlap");
    const overlaps = async (toastSel, targetSel) =>
      p.evaluate(([ts, gs]) => {
        const hit = [];
        const toasts = [...document.querySelectorAll(ts)].map((e) => e.getBoundingClientRect());
        for (const el of document.querySelectorAll(gs)) {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          if (toasts.some((t) => t.left < r.right && t.right > r.left && t.top < r.bottom && t.bottom > r.top)) hit.push((el.getAttribute("aria-label") || el.textContent || el.id || el.tagName).trim().slice(0, 24));
        }
        return { toasts: toasts.length, hit };
      }, [toastSel, targetSel]);
    await p.goto(`${BASE}/markets/NVDA`);
    await p.waitForFunction(() => !!window.__vantageTest?.toast);
    await p.evaluate(() => {
      const t = window.__vantageTest.toast;
      t({ title: "Limit order filled", body: "Bought 3 NVDA at $189.00.", tone: "good" });
      t({ title: "NVDA filled without a stop-loss", body: "Add one next time.", tone: "risk" });
      t({ title: "Mission done: Place your first trade", tone: "default" });
    });
    await p.waitForTimeout(400);
    const a = await overlaps('[data-toaster] [role="status"], [data-toaster] [role="alert"]', 'aside[aria-label="Order ticket"] button, aside[aria-label="Order ticket"] input, aside[aria-label="Order ticket"] textarea');
    check("symbol page: toasts never cover the ticket's Buy/Sell, order type or fields", a.toasts >= 2 && a.hit.length === 0, JSON.stringify(a));
    await p.goto(`${BASE}/coach`);
    await p.waitForFunction(() => !!window.__vantageTest?.toast);
    await p.evaluate(() => {
      window.__vantageTest.toast({ title: "Mission done: Ask your coach a question", tone: "good" });
      window.__vantageTest.toast({ title: "A second note", tone: "default" });
    });
    await p.waitForTimeout(400);
    const b = await overlaps('[data-toaster] [role="status"], [data-toaster] [role="alert"]', 'textarea, form button, form a');
    check("coach page: toasts never cover the composer", b.toasts >= 2 && b.hit.length === 0, JSON.stringify(b));
    await p.waitForTimeout(13000);
    check("toasts, risk ones included, go away on their own", (await p.locator('[data-toaster] [role="status"], [data-toaster] [role="alert"]').count()) === 0);
    await c.close();
  }
  {
    // (d) text typed while the order waits for the cross-tab lock is kept
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storageNow });
    const holder = await c.newPage();
    const p = await c.newPage();
    watch(holder, "hold");
    watch(p, "typing");
    await holder.goto(`${BASE}/dashboard`);
    await p.goto(`${BASE}/markets/KO`);
    await p.locator("#qty").waitFor();
    await holder.evaluate(() => new Promise((res) => {
      navigator.locks.request("vantage-write", () => new Promise((rel) => { window.__release = rel; res(true); }));
    }));
    const n0 = (await state(p)).trades.length;
    await p.locator("#qty").fill("4");
    await p.getByRole("button", { name: /^Buy 4 KO$/ }).click(); // waits for the lock the other tab holds
    await p.locator("#thesis").fill("Typed while the order was still waiting for its turn.");
    await p.waitForTimeout(300);
    await holder.evaluate(() => window.__release());
    await waitFor(async () => (await state(p)).trades.length === n0 + 1, 8000, 100);
    await p.waitForTimeout(400);
    check("text typed after Buy was clicked, before the order completed, is kept", (await p.locator("#thesis").inputValue()) === "Typed while the order was still waiting for its turn." && (await state(p)).trades.length === n0 + 1);
    await c.close();
  }
  {
    // settings: export, theme, reset, delete
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storageNow, acceptDownloads: true });
    const p = await c.newPage();
    watch(p, "settings");
    await p.goto(`${BASE}/settings`);
    // the core flow runs on Premium (test mode), so Settings shows that plan and labels it
    await p.getByText("Plan: Premium").waitFor({ timeout: 8000 }).catch(() => {});
    check("settings shows the current plan (Premium, labelled test mode)", (await p.getByText("Plan: Premium").isVisible()) && (await p.locator("#membership").getByText("Test mode", { exact: true }).isVisible()));
    const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Export my data" }).click()]);
    const file = await dl.path();
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    check("export downloads a timestamped JSON of both stores", /^vantage-data-\d{8}-\d{6}\.json$/.test(dl.suggestedFilename()) && !!json.stores["sp-app"]?.state?.trades && !!json.stores["sp-market"]?.state?.prices && ["profile", "cash", "positions", "orders", "equityHistory", "watchlist", "xp", "completedLessons", "missions", "posts", "comments", "chat", "reported"].every((k) => k in json.stores["sp-app"].state), dl.suggestedFilename());
    await p.getByRole("radio", { name: "Light" }).click();
    check("theme choice applies", (await p.evaluate(() => document.documentElement.dataset.theme)) === "light");
    await p.getByRole("button", { name: "Reset practice account" }).click();
    await p.getByRole("dialog").getByRole("button", { name: "Reset account" }).click();
    // writes are batched by store/sync.ts (about 50 ms), so give the reset its flush before reading storage
    await waitFor(async () => (await state(p)).trades.length === 0, 3000, 50);
    const rs = await state(p);
    check("reset practice account restores cash, clears trades, keeps profile and consent", rs.cash === 100000 && rs.trades.length === 0 && rs.profile.onboarded === true && rs.profile.consent?.version === TERMS_VERSION);
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
    check("delete leaves no personal data (only fresh simulated prices may be rewritten)", !/Alex|Casey|consent|acceptedAt/.test(marketAfter ?? ""));
    check("delete clears both stores and returns to onboarding", (!after || (!after.profile.onboarded && !after.profile.consent && after.trades.length === 0 && after.profile.name === "")) && (await p.getByText("Welcome to Vantage").isVisible()), `sp-market ${marketAfter ? "rewritten fresh" : "empty"}`);
    check("delete also removes the saved theme", (await p.evaluate(() => localStorage.getItem("sp-theme"))) === null);
    await c.close();
  }
  {
    // delete in one tab must clear every tab: a stale tab must not restore the name, consent or trades
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storageNow });
    const tabA = await c.newPage();
    const tabB = await c.newPage();
    watch(tabA, "delete-A");
    watch(tabB, "delete-B");
    await tabA.goto(`${BASE}/dashboard`);
    await tabB.goto(`${BASE}/settings`);
    await tabA.waitForTimeout(1500);
    const had = (await state(tabA)).trades.length;
    await tabB.getByRole("button", { name: "Delete all my data" }).click();
    await tabB.getByLabel("Type DELETE to confirm").fill("DELETE");
    await tabB.getByRole("dialog").getByRole("button", { name: "Delete everything" }).click();
    await tabB.getByLabel(/I.m 18 or older/).waitFor({ timeout: 10000 });
    await tabA.bringToFront();
    await tabA.waitForTimeout(15000);
    const sa = await state(tabA);
    const sb = await state(tabB);
    const clean = (st) => !st || (st.trades.length === 0 && !st.profile.consent && !st.profile.onboarded && st.profile.name === "");
    check("multi-tab delete: both tabs show onboarding and storage keeps no trades or consent", had > 0 && clean(sa) && clean(sb) && (await tabA.getByLabel(/I.m 18 or older/).isVisible()) && (await tabB.getByLabel(/I.m 18 or older/).isVisible()), `had ${had} trades, A trades ${sa?.trades.length}, B trades ${sb?.trades.length}`);
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
    await m.getByRole("link", { name: "Settings" }).waitFor({ timeout: 8000 }).catch(() => {});
    check("phone menu has Settings, the disclaimer and legal links", (await m.getByRole("link", { name: "Settings" }).isVisible()) && (await m.getByText("Simulated prices and news. Educational only, not investment advice.").isVisible()) && (await m.getByRole("link", { name: "Terms" }).isVisible()) && (await m.getByRole("link", { name: "Privacy" }).isVisible()) && (await m.getByRole("link", { name: "Disclaimer" }).isVisible()));
    await c.close();
  }

  // ---------------- Task 8B: simulated news, no fake social proof, citations, report, bad responses ----------------
  console.log("\nSimulated news, community honesty, citations, report, bad responses");
  {
    // news: every headline is tagged Simulated; stale persisted headlines are dropped on load
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "news");
    await p.addInitScript(() => {
      if (sessionStorage.getItem("news-patched")) return;
      sessionStorage.setItem("news-patched", "1");
      const raw = localStorage.getItem("sp-market");
      if (!raw) return;
      const st = JSON.parse(raw);
      st.state.news = [{ id: "old1", symbol: "TSLA", headline: "Regulators open an inquiry into Tesla", kind: "product", impact: -0.03, at: Date.now() }, { id: "old2", symbol: "AAPL", headline: "Apple CFO departs unexpectedly", kind: "guidance", impact: -0.03, at: Date.now() }, ...st.state.news];
      localStorage.setItem("sp-market", JSON.stringify(st));
    });
    await p.goto(`${BASE}/markets`);
    await p.getByText("Simulated headlines").waitFor();
    await p.waitForTimeout(1500);
    const heads = await p.evaluate(() => JSON.parse(localStorage.getItem("sp-market")).state.news.map((n) => n.headline));
    check("stale stored headlines (regulator inquiry, CFO departs) are dropped on load", heads.length > 0 && !heads.some((h) => /inquiry|CFO|delays|cuts outlook|misses on revenue|margins shrink/i.test(h)), heads.slice(0, 2).join(" | "));
    check("every stored headline matches a simulation template", heads.every((h) => /simulat|hypothetical/i.test(h)), heads.find((h) => !/simulat|hypothetical/i.test(h)) || "");
    const items = await p.locator("section:has-text('Simulated headlines') ul > li").count();
    const tags = await p.locator("section:has-text('Simulated headlines') [data-testid=sim-tag]").allInnerTexts();
    check("every headline carries a visible Simulated tag", items > 0 && tags.length === items && tags.every((t) => t.trim() === "Simulated"), `${tags.length} tags for ${items} headlines`);
    check("news panel says it is fictional and not affiliated", (await p.getByText(/Fictional scenarios for practice\. Not real news/).first().isVisible()) && (await p.getByText(/Not affiliated with or endorsed by any company named/).first().isVisible()));
    await p.goto(`${BASE}/markets/NVDA`);
    const lineBox = await p.getByText("Simulated trade. Prices are generated and are not real market prices.").boundingBox();
    const buyBox = await p.getByRole("button", { name: /^Buy \d+ NVDA$/ }).boundingBox();
    check("ticket shows the simulated-trade line above the buy button", !!lineBox && !!buyBox && lineBox.y + lineBox.height <= buyBox.y + 1, JSON.stringify({ line: lineBox?.y, buy: buyBox?.y }));
    await p.goto(`${BASE}/dashboard`);
    check("dashboard return is labelled as simulated results", await p.getByTestId("sim-results-note").isVisible());
    await c.close();
  }
  {
    // landing: mock content is labelled Example
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const p = await c.newPage();
    watch(p, "landing-example");
    await p.goto(`${BASE}/`);
    check("landing labels the mock quote and mock review as examples", (await p.getByText("Example, simulated price").isVisible()) && (await p.getByText(/Example, not a real user review/).isVisible()) && (await p.getByText(/Example screen with made-up numbers/).isVisible()));
    await p.waitForTimeout(3000);
    check("landing hero motion finishes and never leaves content hidden", (await p.evaluate(() => document.documentElement.dataset.hero ?? "")) === "" && (await p.getByRole("heading", { level: 1 }).isVisible()));
    check("landing hero states it is a simulator, not advice", await p.getByText("Vantage is an educational simulator. No real money, no real trades. Not investment advice.").first().isVisible());
    await c.close();
  }
  {
    // brand: favicon, app icons, manifest, default Open Graph image, and the logo in every header
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    watch(p, "brand");
    await p.goto(`${BASE}/`);
    const get = async (u) => {
      const r = await fetch(new URL(u, BASE));
      return { ok: r.status === 200, type: r.headers.get("content-type") || "", r };
    };
    const icon = (await p.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute("href")) || "";
    const apple = (await p.locator('link[rel="apple-touch-icon"]').first().getAttribute("href")) || "";
    const og = (await p.locator('meta[property="og:image"]').first().getAttribute("content")) || "";
    const tw = (await p.locator('meta[name="twitter:card"]').getAttribute("content")) || "";
    const fi = await get(icon);
    const ap = await get(apple);
    const ogr = await get(og);
    check("favicon is the brand SVG and loads", icon.includes("/brand/favicon.svg") && fi.ok && fi.type.includes("svg"), icon);
    check("apple touch icon is the 180px brand PNG and loads", apple.includes("/brand/apple-touch-icon.png") && ap.ok && ap.type.includes("png"), apple);
    check("default Open Graph image is the brand card (1200x630) and loads", og.endsWith("/brand/og.png") && ogr.ok && ogr.type.includes("png") && tw === "summary_large_image", og);
    const manifestHref = (await p.locator('link[rel="manifest"]').getAttribute("href")) || "/manifest.webmanifest";
    const man = await (await fetch(new URL(manifestHref, BASE))).json();
    const iconsLoad = await Promise.all((man.icons || []).map(async (i) => (await fetch(new URL(i.src, BASE))).status === 200));
    check("web manifest lists 192 and 512 brand icons that load", man.icons?.some((i) => i.sizes === "192x192") && man.icons?.some((i) => i.sizes === "512x512") && iconsLoad.length > 0 && iconsLoad.every(Boolean));
    check("landing header shows the logo (monogram + name)", (await p.getByRole("link", { name: "Vantage home" }).first().locator("svg").count()) === 1);
    await p.goto(`${BASE}/terms`);
    check("legal header shows the logo", (await p.getByRole("link", { name: "Vantage home" }).locator("svg").count()) === 1);
    await p.goto(`${BASE}/dashboard`);
    check("app shell header shows the logo", (await p.locator('header a[aria-label="Vantage home"] svg').count()) === 1);
    await c.close();
  }
  {
    // citations
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "sources");
    for (const [slug, frag] of [["index-vs-picking", "spglobal.com/spdji/en/research-insights/spiva"], ["overtrading", "doi.org/10.1111/0022-1082.00226"], ["loss-aversion", "doi.org/10.2307/1914185"], ["loss-aversion", "doi.org/10.1007/BF00122574"]]) {
      await p.goto(`${BASE}/learn/${slug}`);
      await p.getByTestId("lesson-sources").waitFor({ timeout: 10000 }).catch(() => {});
      const a = p.getByTestId("lesson-sources").getByRole("link");
      const hrefs = await a.evaluateAll((as) => as.map((x) => [x.getAttribute("href"), x.getAttribute("target")]));
      const href = hrefs.map((h) => h[0]).find((h) => h.includes(frag)) ?? "";
      check(`/learn/${slug} ends with a Sources line linking ${frag}`, href.includes(frag) && hrefs.every((h) => h[1] === "_blank") && (await p.getByTestId("lesson-sources").innerText()).startsWith("Sources:"), href);
    }
    await p.goto(`${BASE}/learn/stop-losses`);
    check("lessons without statistics have no Sources line", (await p.getByTestId("lesson-sources").count()) === 0);
    await c.close();
  }
  {
    // community: no fabricated social proof, Demo labels, AI labels, Report
    const c = await browser.newContext({ viewport: { width: 1440, height: 1400 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "community-honesty");
    await p.goto(`${BASE}/community`);
    await p.getByLabel("Post text").waitFor();
    const demoArticles = p.locator("article:has([data-demo])");
    const nDemo = await demoArticles.count();
    check("all seeded posts carry a Demo label", nDemo === 7, `${nDemo} demo posts`);
    check("no demo post shows a like count", (await p.locator("article:has([data-demo]) [data-like-count]").count()) === 0);
    const likeTexts = await demoArticles.locator("button[data-like]").allInnerTexts();
    check("no seeded like number appears on any demo post", likeTexts.every((t) => t.trim() === ""), JSON.stringify(likeTexts));
    const first = demoArticles.first();
    await first.getByRole("button", { name: "Like this post", pressed: false }).click();
    check("liking a demo post shows only your own like (1)", (await first.locator("[data-like-count]").innerText()) === "1");
    await first.getByRole("button", { name: "Like this post", pressed: true }).click();
    check("unliking hides the count again", (await first.locator("[data-like-count]").count()) === 0);
    check("composer links to the community guidelines", (await p.locator('main a[href="/community-guidelines"]').count()) >= 1);
    // Nova label on seeded and real comments
    const p2 = p.locator("article", { hasText: "bought TSLA after a +7% day" });
    await p2.getByRole("button", { name: /^Comments/ }).click();
    const novaBubble = p2.locator("div.rounded-2xl", { hasText: "Great reflection" });
    check("Nova's comments carry an AI-generated label", (await novaBubble.getByText("AI-generated").count()) === 1);
    check("seeded comments carry a Demo label", (await p2.locator("div.rounded-2xl [data-demo]").count()) === 2);
    // Report on a post: hides it, toast, undo, persists
    const q = p.locator("article", { hasText: "why does my stock drop the moment I buy it" });
    await q.getByRole("button", { name: "Report post" }).click();
    check("Report shows the toast and hides the post", (await p.getByText("Reported. Thanks for flagging it.").isVisible()) && (await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).count()) === 0);
    check("report is stored as reported[id] = true", (await state(p)).reported?.p4 === true);
    await p.getByRole("button", { name: "Undo" }).click();
    const undoOk = await waitFor(async () => (await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).count()) === 1 && !(await state(p)).reported?.p4, 5000, 100);
    check("Undo in the toast restores the post", undoOk, `articles ${await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).count()}, reported ${JSON.stringify((await state(p)).reported)}, toasts ${await p.locator("[data-toaster]").innerText()}`);
    await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).getByRole("button", { name: "Report post" }).click();
    await p.reload();
    await p.getByLabel("Post text").waitFor();
    check("a reported post stays hidden after reload", (await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).count()) === 0);
    // Report on a comment
    const p2b = p.locator("article", { hasText: "bought TSLA after a +7% day" });
    await p2b.getByRole("button", { name: /^Comments/ }).click();
    await p2b.getByRole("button", { name: "Report comment" }).first().click();
    await waitFor(async () => (await state(p)).reported?.["p2-0"] === true, 3000, 50);
    check("Report on a comment hides that comment only", (await p.getByText("Respect for posting this").count()) === 0 && (await p2b.getByText("Great reflection").count()) === 1 && (await state(p)).reported?.["p2-0"] === true);
    // leaderboard and challenges
    await p.getByRole("tab", { name: "Leaderboard" }).click();
    const rows = p.locator("ol > li", { has: p.locator("[data-demo]") });
    check("every demo leaderboard row has a Demo label and your row has none", (await rows.count()) === 6 && (await p.locator("ol > li").filter({ hasText: "Alex" }).locator("[data-demo]").count()) === 0);
    check("every leaderboard row except yours carries a Demo label (no unlabelled extras)", await p.locator("ol > li").evaluateAll((lis) => lis.length > 1 && lis.filter((li) => !li.textContent.includes("Alex")).every((li) => li.querySelector("[data-demo]"))));
    await p.getByRole("tab", { name: "Feed" }).click();
    const sideRows = p.locator('section[aria-labelledby="ml-h"] li');
    check("sidebar process leaders: every row is a labelled demo member except yours", (await sideRows.count()) >= 3 && (await sideRows.evaluateAll((lis) => lis.filter((li) => !li.textContent.includes("Alex")).every((li) => li.querySelector("[data-demo]")))));
    await p.getByRole("tab", { name: "Leaderboard" }).click();
    check("leaderboard states results are simulated", await p.getByTestId("sim-results-note").isVisible());
    await p.getByRole("tab", { name: "Challenges" }).click();
    const ch = await p.locator("main").innerText();
    check("challenges show no participant numbers", !/\d[\d,]*\s+joined/i.test(ch) && !/1,284|3,410|\b742\b/.test(ch) && (await p.locator("section:has([data-demo])").count()) === 3);
    await c.close();
  }
  {
    // a non-OK /api/coach response is never shown as AI text
    for (const [label, status, body] of [["500 HTML", 500, "<html><body>Internal Server Error</body></html>"], ["404 HTML", 404, "<!DOCTYPE html><html><body>404 This page could not be found</body></html>"]]) {
      const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storageNow });
      const p = await c.newPage();
      p.on("pageerror", (e) => errors.push(`[bad-${status}] pageerror: ${e.message}`)); // the mocked 4xx/5xx logs a console error by design
      await p.route("**/api/coach", (route) => (route.request().method() === "POST" ? route.fulfill({ status, contentType: "text/html", body }) : route.continue()));
      await p.goto(`${BASE}/coach`);
      const before = (await state(p)).chat.length;
      await p.getByLabel("Message Nova").fill("How do I figure out how many shares to buy?");
      await p.getByRole("button", { name: "Send" }).click();
      await waitFor(async () => {
        const ch = (await state(p)).chat;
        return ch.length >= before + 2 && ch[ch.length - 1].role === "assistant" && ch[ch.length - 1].content.length > 40;
      }, 15000);
      const last = (await state(p)).chat.at(-1).content;
      check(`coach: ${label} is treated as offline mode, not shown as an answer`, last.length > 40 && !/<html|<!DOCTYPE|Internal Server Error|could not be found/i.test(last), last.slice(0, 80));
      await p.goto(`${BASE}/community`);
      await p.getByLabel("Post text").fill(`Bad response post ${status}: sizing a trade at 1% risk.`);
      await p.getByRole("button", { name: "Post", exact: true }).click();
      const nova = await waitFor(async () => {
        const st = await state(p);
        const id = st.posts[0]?.id;
        return (st.comments[id] ?? []).some((cm) => cm.authorId === "u7");
      }, 15000);
      const st2 = await state(p);
      const reply = (st2.comments[st2.posts[0].id] ?? []).find((cm) => cm.authorId === "u7")?.body ?? "";
      const why = reply ? reply.slice(0, 80) : JSON.stringify({ first: st2.posts[0]?.body?.slice(0, 32), firstAt: st2.posts[0]?.at, comments: (st2.comments[st2.posts[0]?.id] ?? []).map((cm) => cm.authorId), posts: st2.posts.length, url: p.url(), typing: await p.getByText("Nova is replying.").count(), box: await p.getByLabel("Post text").inputValue().catch(() => "?") });
      check(`community: ${label} gets the canned Nova reply, not HTML`, nova && reply.includes("Love that you shared this") && !/<html|<!DOCTYPE|Internal Server Error|could not be found/i.test(reply), why);
      await c.close();
    }
  }


  // ---------------- growth: public pages, calculators, share cards, tracking ----------------
  console.log("\nGrowth features (public pages)");
  const PUBLIC_PAGES = ["/lessons", "/lessons/position-sizing", "/lessons/risk-reward", "/tools/position-size-calculator", "/tools/reward-risk-calculator", "/share/score?s=92&l=Disciplined&sym=NVDA&side=buy"];
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    watch(p, "public");
    const titles = new Map();
    const descs = new Map();
    const problems = [];
    for (const r of PUBLIC_PAGES) {
      const res = await p.goto(`${BASE}${r}`);
      if (res?.status() !== 200) problems.push(`${r} status ${res?.status()}`);
      const h1s = await p.locator("h1").count();
      const title = await p.title();
      const desc = (await p.locator('meta[name="description"]').getAttribute("content").catch(() => null)) ?? "";
      if (h1s !== 1) problems.push(`${r} has ${h1s} h1`);
      if (!title || titles.has(title)) problems.push(`${r} title not unique ("${title}")`);
      if (desc.length < 50 || descs.has(desc)) problems.push(`${r} meta description missing or duplicate`);
      titles.set(title, r);
      descs.set(desc, r);
      const body = await p.locator("body").innerText();
      if (!/educational simulator/i.test(body) || !/not investment advice/i.test(body)) problems.push(`${r} lacks the simulator disclaimer`);
      const legal = await p.locator('footer a[href="/terms"], footer a[href="/privacy"], footer a[href="/disclaimer"]').count();
      if (legal !== 3) problems.push(`${r} footer lacks legal links`);
      if ((await p.getByRole("dialog").count()) > 0) problems.push(`${r} shows a dialog (consent gate)`);
    }
    check(`${PUBLIC_PAGES.length} public pages: 200, exactly one h1, unique title and meta description, disclaimer and legal links, no consent gate`, problems.length === 0, problems.join(" | "));

    await p.goto(`${BASE}/lessons/position-sizing`);
    const h1 = await p.locator("h1").innerText();
    const ld = await p.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent));
    let ldType = "";
    try {
      ldType = JSON.parse(ld[0]).name + "|" + JSON.parse(ld[0])["@type"];
    } catch {}
    const canon = await p.locator('link[rel="canonical"]').getAttribute("href");
    check("/lessons/position-sizing: lesson h1, LearningResource JSON-LD, canonical, no quiz, CTA to /learn/position-sizing", h1 === "Position sizing: the 1–2% rule" && ldType === "Position sizing: the 1–2% rule|LearningResource" && /\/lessons\/position-sizing$/.test(canon ?? "") && (await p.getByText("Check your understanding").count()) === 0 && (await p.getByRole("link", { name: "Practice this lesson" }).getAttribute("href")) === "/learn/position-sizing", `${h1} ${ldType} ${canon}`);
    await p.goto(`${BASE}/lessons`);
    check("/lessons lists every lesson as a link to /lessons/<slug>", (await p.locator('main a[href^="/lessons/"]').count()) === 19);

    // calculators
    await p.goto(`${BASE}/tools/position-size-calculator`);
    await p.getByTestId("ps-account").fill("100000");
    await p.getByTestId("ps-entry").fill("100");
    await p.getByTestId("ps-stop").fill("95");
    await p.getByTestId("ps-risk").evaluate((el) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      set.call(el, "1");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    check("position size calculator: 100000 account, 1% risk, entry 100, stop 95 gives 200 shares", (await p.getByTestId("ps-shares").innerText()).trim() === "200", await p.getByTestId("ps-shares").innerText());
    await p.getByTestId("ps-stop").fill("105");
    check("position size calculator: a stop above the entry shows a fix message, not a number", await p.getByText(/Your stop must be below your entry/).first().isVisible());
    await p.goto(`${BASE}/tools/reward-risk-calculator`);
    await p.getByTestId("rr-entry").fill("100");
    await p.getByTestId("rr-stop").fill("95");
    await p.getByTestId("rr-target").fill("110");
    const rrText = await p.locator("main").innerText();
    check("reward to risk calculator: 100 / 95 / 110 reads 2 : 1 and a 33% break-even win rate", /2(\.0)? ?: ?1/.test(rrText) && /33(\.\d)?%/.test(rrText));

    // sitemap, robots
    const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
    check("/sitemap.xml lists the landing page, all 19 lessons, both tools and the legal pages", sm.includes("/lessons/position-sizing") && (sm.match(/\/lessons\/[a-z0-9-]+<\/loc>/g) || []).length === 19 && sm.includes("/tools/position-size-calculator") && sm.includes("/tools/reward-risk-calculator") && LEGAL_ROUTES.every(([r]) => sm.includes(`${r}</loc>`)));
    const rb = await (await fetch(`${BASE}/robots.txt`)).text();
    check("/robots.txt allows the public site, blocks the app routes and points to the sitemap", /Allow: \//.test(rb) && ["/dashboard", "/markets", "/coach", "/community", "/journal", "/settings"].every((r) => rb.includes(`Disallow: ${r}`)) && /Sitemap: .*\/sitemap\.xml/.test(rb), rb);

    // share page and card
    await p.goto(`${BASE}/share/score?s=92&l=Disciplined&sym=NVDA&side=buy`);
    const card = await p.getByTestId("share-card").innerText();
    check("/share/score renders the card: symbol, side, score and label", /Bought NVDA/.test(card) && (await p.getByTestId("share-label").innerText()) === "Disciplined" && (await p.getByRole("img", { name: /Process score 92 out of 100, Disciplined/ }).count()) === 1, card);
    check("share card shows no P&L or returns, and carries the simulated-trade line", !/[$%]|profit|return|gain|loss|P&L/i.test(card.replace("Educational only, not investment advice.", "")) && card.includes("Simulated trade. Educational only, not investment advice."), card);
    await p.goto(`${BASE}/share/score?s=999&sym=%3Cscript%3E&side=x`);
    check("share page with hostile or out-of-range values falls back to a safe example", (await p.getByTestId("share-card").innerText()).includes("Bought SPY"));
    await p.goto(`${BASE}/share/score?s=40&sym=TSLA&side=sell`);
    check("share page: label follows the score (40 is High risk), not the link text", (await p.getByTestId("share-label").innerText()) === "High risk");
    const og = await p.locator('meta[property="og:image"]').getAttribute("content");
    const img = await fetch(`${BASE}/share/score/card?s=92&sym=NVDA&side=buy`);
    const buf = Buffer.from(await img.arrayBuffer());
    const isPng = buf.slice(1, 4).toString() === "PNG";
    const w = isPng ? buf.readUInt32BE(16) : 0;
    const h = isPng ? buf.readUInt32BE(20) : 0;
    check("share card image: PNG 1200×630 rendered with local fonts, and the page's og:image points at it", img.status === 200 && isPng && w === 1200 && h === 630 && buf.length > 8000 && /\/share\/score\/card\?/.test(og ?? ""), `${img.status} ${w}x${h} ${buf.length}B ${og}`);
    fs.writeFileSync(`${SHOTS}/share-card-og.png`, buf);

    // tracking is a no-op without a Pixel ID
    await p.goto(`${BASE}/`);
    await p.waitForTimeout(400);
    check("no Pixel ID: no cookie banner, no fbq, no Meta script, nothing stored", (await p.getByTestId("cookie-consent").count()) === 0 && (await p.evaluate(() => typeof window.fbq)) === "undefined" && (await p.locator('script[src*="facebook"]').count()) === 0 && (await p.evaluate(() => localStorage.getItem("sp-marketing-consent"))) === null);
    await c.close();
  }
  {
    // track(): compile the real module and run it against fake browsers
    const ts = require("typescript");
    const vm = require("vm");
    const src = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/track.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const load = (pixelId, stored) => {
      const store = stored ? { "sp-marketing-consent": stored } : {};
      const scripts = [];
      const win = {};
      const sandbox = {
        window: win,
        localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v) },
        document: { createElement: () => ({}), head: { appendChild: (s) => scripts.push(s) } },
        process: { env: { NEXT_PUBLIC_META_PIXEL_ID: pixelId } },
        module: { exports: {} },
      };
      sandbox.exports = sandbox.module.exports;
      vm.runInNewContext(src, sandbox);
      return { api: sandbox.module.exports, scripts, win };
    };
    let threw = false;
    const a = load("", undefined);
    try {
      a.api.track("FirstTrade", { symbol: "SPY" });
      a.api.track("ShareScore");
      a.api.saveMarketingChoice("granted");
    } catch {
      threw = true;
    }
    check("track() without a Pixel ID does not throw, loads nothing and sends nothing", !threw && a.scripts.length === 0 && !a.win.fbq);
    const b = load("123456789", undefined);
    b.api.track("FirstTrade", { symbol: "SPY" });
    check("track() with a Pixel ID but no consent loads no script", b.scripts.length === 0 && !b.win.fbq);
    const d = load("123456789", "denied");
    d.api.track("FirstTrade");
    check("track() after 'Only necessary' loads no script", d.scripts.length === 0 && !d.win.fbq);
    const g = load("123456789", undefined);
    g.api.saveMarketingChoice("granted");
    g.api.track("LessonComplete", { lesson: "position-sizing", email: "a@b.co", name: "Riley", thesis: "my secret reason", score: 88 });
    const queued = (g.win.fbq?.queue ?? []).map((x) => JSON.stringify(x)).join(" ");
    check("track() after consent loads the Pixel once and sends only whitelisted, non-identifying props", g.scripts.length === 1 && /connect\.facebook\.net/.test(g.scripts[0].src) && queued.includes("LessonComplete") && queued.includes("position-sizing") && !/a@b\.co|Riley|secret/.test(queued), queued);
  }
  {
    // referral capture, stored once; Settings shows the invite link
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    watch(p, "referral");
    await p.goto(`${BASE}/lessons?ref=Ana_7`);
    await waitFor(async () => (await p.evaluate(() => localStorage.getItem("sp-app"))) !== null, 5000, 200);
    check("?ref= on a public page is stored once as profile.referredBy", (await state(p)).profile.referredBy === "ana_7");
    await p.goto(`${BASE}/?ref=bob`);
    await p.waitForTimeout(300);
    check("a second ?ref= does not replace the first", (await state(p)).profile.referredBy === "ana_7");
    await p.goto(`${BASE}/lessons?ref=${encodeURIComponent("<b>x</b>")}`);
    await p.waitForTimeout(300);
    check("a malformed ref code is ignored", (await state(p)).profile.referredBy === "ana_7");
    await p.goto(`${BASE}/dashboard`);
    await p.getByPlaceholder("Your first name").fill("Riley");
    await consent(p);
    await p.getByRole("button", { name: "Skip" }).click();
    await p.goto(`${BASE}/settings`);
    const inv = await p.getByTestId("invite-link").innerText();
    check("Settings shows 'Your invite link' (/?ref=<handle>) and onboarding kept referredBy", inv.includes("/?ref=riley") && (await state(p)).profile.referredBy === "ana_7" && (await p.getByRole("button", { name: "Copy invite link" }).isVisible()), inv);
    await c.close();
  }
  {
    // Share score from a real review card (Web Share API stubbed)
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c.addInitScript(() => {
      navigator.share = async (d) => {
        window.__shared = d;
      };
    });
    const p = await c.newPage();
    watch(p, "share-score");
    await p.goto(`${BASE}/dashboard`);
    await p.getByPlaceholder("Your first name").fill("Sam");
    await consent(p);
    await p.getByRole("button", { name: "Skip" }).click();
    await p.goto(`${BASE}/markets/SPY`);
    await p.getByLabel(/Why are you making this trade/).fill("I expect the broad market to keep rising because earnings are steady, and I am wrong if it closes under the recent low.");
    await p.locator("#stop").waitFor();
    await p.getByRole("button", { name: "−5%" }).first().click();
    await p.getByRole("button", { name: /^Buy \d+ SPY$/ }).click();
    const btn = p.getByRole("button", { name: "Share score" }).first();
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    const shared = await p.evaluate(() => window.__shared);
    check("Share score opens the Web Share API with a /share/score link: score, label, symbol, side and no money", !!shared && /\/share\/score\?s=\d+&l=[A-Za-z+%0-9]+&sym=SPY&side=buy$/.test(shared.url) && !/pnl|profit|return/i.test(shared.url + shared.text), JSON.stringify(shared));
    await c.close();
  }

  // ---------------- Task 10: memberships, daily limits, honest paywalls ----------------
  console.log("\nMemberships and paywalls (Task 10)");
  /** Every paywall, pricing and dialog text seen below, scanned at the end for confirmshaming and fake-charge wording. */
  const planCopy = [];
  const grabPaywalls = async (p) => {
    for (const t of await p.locator("[data-paywall]").allInnerTexts()) planCopy.push(t);
  };
  const onboardAs = async (p, name) => {
    await p.goto(`${BASE}/dashboard`);
    await p.getByPlaceholder("Your first name").fill(name);
    await consent(p);
    await p.getByRole("button", { name: "Skip" }).click();
    await p.waitForFunction(() => JSON.parse(localStorage.getItem("sp-app") || "{}").state?.profile?.onboarded === true);
  };
  const todayCount = (st, key) => {
    const d = new Date();
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return (st.usage?.[key] ?? []).filter((x) => {
      const e = new Date(x.at);
      return `${e.getFullYear()}-${e.getMonth()}-${e.getDate()}` === k;
    }).length;
  };
  /** Every visible button that starts a plan must have the renewal terms in the same plan cell. */
  const renewalProblems = (p) =>
    p.evaluate((renewal) => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      };
      const out = [];
      const buttons = [...document.querySelectorAll("button")].filter((b) => vis(b) && /^Preview (Premium|Elite)$/.test(b.textContent.trim()));
      for (const b of buttons) {
        const cell = b.closest("[data-plan-cta]");
        const txt = cell ? [...cell.querySelectorAll("[data-renewal]")].filter(vis).map((e) => e.textContent).join(" ") : "";
        if (!txt.includes(renewal)) out.push(`${b.textContent.trim()} has no renewal text beside it`);
      }
      return { n: buttons.length, out };
    }, RENEWAL);
  {
    // plans.ts, merge and CSV, compiled from source and run here: the entitlement rules themselves
    const ts = require("typescript");
    const vm = require("vm");
    const cache = {};
    const load = (rel) => {
      const file = path.join(__dirname, "../src", rel);
      if (cache[file]) return cache[file];
      const src = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const mod = { exports: {} };
      cache[file] = mod.exports;
      const req = (r) => {
        if (r === "@/store/sync") return { markDeleted() {}, withWriteLock: (f) => Promise.resolve(f()) };
        if (r.startsWith("./")) return load(path.join(path.dirname(rel), r.slice(2) + ".ts"));
        if (r.startsWith("@/")) return load(r.slice(2) + ".ts");
        throw new Error(`unexpected import ${r}`);
      };
      vm.runInNewContext(src, { module: mod, exports: mod.exports, require: req, Blob: function () {}, URL: {}, document: {} });
      return (cache[file] = mod.exports);
    };
    const P = load("lib/plans.ts");
    const feats = ["unlimited-trades", "all-lessons", "lesson-tools", "unlimited-coach", "journal-insights", "ma-overlay", "challenges", "csv-export", "weekly-debrief", "learning-plan", "elite-badge"];
    const elite = ["weekly-debrief", "learning-plan", "elite-badge"];
    const matrixOk = feats.every((f) => !P.can("free", f) && P.can("premium", f) === !elite.includes(f) && P.can("elite", f));
    check("plans.ts: Free has none of the paid features, Premium has all but the Elite three, Elite has everything", matrixOk);
    check("plans.ts: an unknown or tampered plan is Free", ["ultra", "Premium", null, undefined, {}, "__proto__", 1].every((x) => P.planOf(x) === "free" && !P.can(x, "unlimited-trades")));
    check(
      "plans.ts: Free buys stop at 10 a day, sells are always allowed and still count, Premium has no limit",
      P.orderGate("free", "buy", 9).allowed && !P.orderGate("free", "buy", 10).allowed && P.orderGate("free", "sell", 50).allowed && P.orderGate("free", "sell", 50).counts && P.orderGate("premium", "buy", 500).allowed && P.tradesLeft("premium", []) === null,
    );
    const now = Date.now();
    const mid = new Date(now);
    mid.setHours(0, 0, 0, 0);
    const log = [{ id: "a", at: mid.getTime() - 60_000 }, { id: "b", at: mid.getTime() }, { id: "c", at: now }];
    check("plans.ts: the daily count uses the local date (a stamp at 23:59 yesterday doesn't count, 00:00 today does)", P.usedToday(log, now) === 2 && P.stampToday(log, "d", now).length === 3 && P.tradesLeft("free", Array.from({ length: 14 }, (_, i) => ({ id: String(i), at: now }))) === 0);
    check("plans.ts: modules 1 and 2 are free, the rest need Premium", P.canOpenLesson("free", "position-sizing") && P.canOpenLesson("free", "diversification") && !P.canOpenLesson("free", "trends-and-candles") && !P.canOpenLesson("free", "build-your-plan") && P.canOpenLesson("premium", "build-your-plan") && P.canOpenLesson("free", "no-such-lesson"));
    check("plans.ts: Free coach messages stop at 10; Premium and Elite are unlimited", P.coachGate("free", 9).allowed && !P.coachGate("free", 10).allowed && P.coachGate("premium", 999).allowed && P.coachLeft("elite", []) === null);
    check(
      "plans.ts: owner prices (Free $0, Premium $30 most popular, Elite $60), verbatim renewal and test-mode text, no test switch over a server plan",
      P.PLANS.free.price === 0 && P.PLANS.premium.price === 30 && P.PLANS.premium.popular === true && P.PLANS.elite.price === 60 && !P.PLANS.elite.popular && P.RENEWAL_TEXT === RENEWAL && P.TEST_MODE_TEXT === TEST_MODE && P.canPreviewInTestMode("test") && !P.canPreviewInTestMode("server"),
    );
    const M = load("store/merge.ts");
    const merged = M.merge3({ usage: { tradeLog: [{ id: "a", at: 1 }] } }, { usage: { tradeLog: [{ id: "a", at: 1 }, { id: "b", at: 2 }] } }, { usage: { tradeLog: [{ id: "a", at: 1 }, { id: "c", at: 3 }] } });
    check("two tabs' usage logs merge by id: no stamp is lost or doubled", JSON.stringify(merged.usage.tradeLog.map((x) => x.id)) === '["a","b","c"]', JSON.stringify(merged));
    const D = load("lib/data-controls.ts");
    const csv = D.tradesCsv([{ at: now, side: "buy", symbol: "NVDA", qty: 3, price: 187.5, role: "entry", stopLoss: 180, score: 92, thesis: '=HYPERLINK("http://x") and a "quote", too' }, { at: now - 1000, side: "sell", symbol: "KO", qty: 2, price: 70.1, role: "stop-loss", realizedPnl: -6.25, score: 60 }]);
    const lines = csv.trim().split("\r\n");
    check("CSV export: a header, one row per trade (oldest first), formula text neutralised and quotes escaped", lines.length === 3 && lines[0].startsWith("Date,Side,Symbol,Shares,Price") && lines[1].includes("Stop-loss (automatic)") && lines[1].includes("-6.25") && lines[2].includes(`"'=HYPERLINK(""http://x"") and a ""quote"", too"`), lines.join(" | "));
  }
  let eliteState;
  {
    // Free plan, one user, desktop light: the daily trade limit end to end
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce", acceptDownloads: true });
    await c.addInitScript(() => {
      window.__VANTAGE_TEST__ = true;
    });
    const p = await c.newPage();
    watch(p, "free-plan");
    await onboardAs(p, "Pat");
    await p.goto(`${BASE}/markets/KO`);
    await p.locator("#qty").waitFor();
    const allowance = p.getByTestId("trade-allowance");
    check("Free: the ticket shows 10 of 10 free trades left today", (await allowance.innerText()).trim() === "10 of 10 free trades left today");
    const trades = async () => (await state(p)).trades.filter((t) => t.role === "entry" || t.role === "exit").length;
    // order 1: a buy with a stop-loss, so an automatic exit can fire later at the limit
    await p.locator("#qty").fill("1");
    await p.getByRole("button", { name: "−5%" }).click();
    await p.getByRole("button", { name: /^Buy 1 KO$/ }).click();
    await waitFor(async () => (await state(p)).orders.some((o) => o.role === "stop-loss" && o.status === "open"), 8000, 100);
    // orders 2 to 9: market buys
    for (let i = 0; i < 8; i++) {
      const q = i % 2 ? "1" : "2";
      const n0 = await trades();
      await p.locator("#qty").fill(q);
      await p.getByRole("button", { name: new RegExp(`^Buy ${q} KO$`) }).click();
      await waitFor(async () => (await trades()) === n0 + 1, 8000, 100);
    }
    check("Free: after 9 orders the ticket shows 1 of 10 left", (await allowance.innerText()).trim() === "1 of 10 free trades left today", await allowance.innerText());
    // order 10: a limit buy far under the market counts when it is placed, not when it fills
    const ko = await price(p, "KO");
    await p.getByRole("radio", { name: "Limit" }).click();
    await p.locator("#trigger").fill((ko * 0.5).toFixed(2));
    await p.locator("#qty").fill("3");
    await p.getByRole("button", { name: "Place limit buy" }).click();
    await waitFor(async () => (await state(p)).orders.some((o) => o.type === "limit" && o.role === "entry" && o.status === "open"), 8000, 100);
    let st = await state(p);
    check("Free: 10 orders placed today are recorded (a limit buy counts when placed)", todayCount(st, "tradeLog") === 10, `${todayCount(st, "tradeLog")} stamps`);
    const pw = p.locator('[data-paywall="trades"]');
    await pw.waitFor({ timeout: 5000 }).catch(() => {});
    check("Free: the 11th buy shows the paywall in the ticket instead of a Buy button", (await pw.isVisible()) && (await p.getByRole("button", { name: /^(Buy \d+ KO|Place limit buy)$/ }).count()) === 0 && (await pw.getByRole("link", { name: "See plans" }).getAttribute("href")) === "/upgrade");
    await grabPaywalls(p);
    await p.screenshot({ path: `${SHOTS}/t10-paywall-ticket-desktop-light.png`, fullPage: true });
    const refused = await p.evaluate(async (px) => [await window.__vantageTest.placeOrder({ symbol: "KO", side: "buy", type: "market", qty: 1 }), await window.__vantageTest.placeOrder({ symbol: "KO", side: "buy", type: "limit", qty: 1, limitPrice: px })], Number((ko * 0.5).toFixed(2)));
    st = await state(p);
    check("Free: at the limit the store itself refuses a market buy and a limit buy, and records nothing", refused.every((r) => !r.ok && r.code === "limit") && todayCount(st, "tradeLog") === 10, JSON.stringify(refused));
    // selling to close is always allowed at the limit, and it still counts
    await pw.getByRole("button", { name: "Sell instead" }).click();
    await p.getByRole("radio", { name: "Market" }).click();
    await p.locator("#qty").fill("1");
    const sellsBefore = (await state(p)).trades.filter((t) => t.side === "sell" && t.role === "exit").length;
    await p.getByRole("button", { name: /^Sell 1 KO$/ }).click();
    await waitFor(async () => (await state(p)).trades.filter((t) => t.side === "sell" && t.role === "exit").length === sellsBefore + 1, 8000, 100);
    st = await state(p);
    check("Free: selling a held position at the limit goes through, and still counts", st.trades.filter((t) => t.side === "sell" && t.role === "exit").length === sellsBefore + 1 && todayCount(st, "tradeLog") === 11 && /^0 of 10 free trades left today\. Selling to close a position is always allowed$/.test((await allowance.innerText()).trim()), (await allowance.innerText()).trim());
    // an automatic stop-loss exit at the limit runs and does not count
    const leg = st.orders.find((o) => o.role === "stop-loss" && o.status === "open");
    await p.evaluate((px) => window.__vantageTest.setPrices({ KO: px }), (leg?.stopPrice ?? ko * 0.95) * 0.99);
    const exited = await waitFor(async () => (await state(p)).trades.some((t) => t.role === "stop-loss"), 8000, 100);
    st = await state(p);
    check("Free: an automatic stop-loss exit at the limit still executes and is not counted", exited && todayCount(st, "tradeLog") === 11, `${todayCount(st, "tradeLog")} stamps`);
    // local midnight: yesterday's orders no longer count
    await p.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("sp-app"));
      raw.state.usage.tradeLog = raw.state.usage.tradeLog.map((x) => ({ ...x, at: x.at - 24 * 60 * 60 * 1000 }));
      localStorage.setItem("sp-app", JSON.stringify(raw));
      localStorage.setItem("sp-app:stamp", `manual-${Date.now()}`);
    });
    await p.reload();
    await p.getByRole("radio", { name: "Buy" }).click();
    await p.getByTestId("trade-allowance").waitFor();
    check("Free: the count resets at local midnight (10 of 10 left, Buy is back)", (await p.getByTestId("trade-allowance").innerText()).trim() === "10 of 10 free trades left today" && (await p.getByRole("button", { name: /^Buy \d+ KO$/ }).isVisible()));

    // Free paywalls in context
    await p.goto(`${BASE}/learn`);
    await p.getByRole("heading", { name: /Market foundations/ }).waitFor();
    const lockedRows = await p.locator("main ol li:has(.tag-plan)").count();
    const lockedMods = await p.locator("main h2:has(.tag-plan)").count();
    check("Free: Learn tags the 12 lessons in modules 3 to 6 (and those 4 modules) as Premium, with no lock icons", lockedRows === 12 && lockedMods === 4 && (await p.locator("main svg.lucide-lock").count()) === 0, `${lockedRows} rows, ${lockedMods} modules`);
    check("Free: the learning plan slot shows the Elite paywall, quietly", await p.locator('[data-paywall="learning-plan"]').isVisible());
    await grabPaywalls(p);
    await p.goto(`${BASE}/learn/trends-and-candles`);
    const lp = p.locator('[data-paywall="lesson"]');
    await lp.waitFor({ timeout: 8000 }).catch(() => {});
    check("Free: a module 3 lesson opens a preview (first section only) and the paywall, with no quiz or tool", (await lp.isVisible()) && (await p.locator(".prose-lesson section").count()) === 1 && (await p.getByText("Check your understanding").count()) === 0 && (await p.getByTestId("widget-trend-spotter").count()) === 0);
    check("Free: the lesson paywall points to the free public text and back to the course", (await lp.getByRole("link", { name: "public lesson page" }).getAttribute("href")) === "/lessons/trends-and-candles" && (await lp.getByRole("link", { name: "Back to the course" }).getAttribute("href")) === "/learn");
    await grabPaywalls(p);
    await p.screenshot({ path: `${SHOTS}/t10-paywall-lesson-desktop-light.png`, fullPage: true });
    await p.goto(`${BASE}/learn/position-sizing`);
    await p.locator('[data-paywall="tools"]').waitFor({ timeout: 8000 }).catch(() => {});
    check("Free: a free lesson keeps its quiz, and its interactive tool shows the paywall", (await p.locator('[data-paywall="tools"]').isVisible()) && (await p.getByTestId("widget-position-size").count()) === 0 && (await p.getByText("Check your understanding").isVisible()));
    await p.locator('[data-paywall="tools"]').getByRole("button", { name: "Not now" }).click();
    check("Free: Not now folds the paywall into one quiet line", (await p.locator('[data-paywall="tools"][data-collapsed]').isVisible()) && (await p.getByRole("link", { name: "See plans" }).count()) >= 1);
    await grabPaywalls(p);
    await p.goto(`${BASE}/markets/NVDA`);
    await p.getByRole("radio", { name: "1M" }).click();
    await p.getByRole("button", { name: /Show 50-day average/ }).click();
    const maDlg = p.getByRole("dialog");
    await maDlg.waitFor({ timeout: 5000 }).catch(() => {});
    check("Free: the 50-day average toggle opens the paywall, and the overlay stays off", (await maDlg.locator('[data-paywall="ma"]').isVisible()) && (await p.getByRole("list", { name: "Legend" }).count()) === 0);
    await grabPaywalls(p);
    await maDlg.getByRole("button", { name: "Not now" }).click();
    check("Free: Not now closes the paywall dialog", (await p.getByRole("dialog").count()) === 0);
    await p.goto(`${BASE}/journal`);
    await p.getByTestId("mistakes").waitFor();
    const mz = await p.getByTestId("mistakes").innerText();
    check("Free: the journal's mistakes chart is a preview (real categories, no bars or counts) with the paywall", (await p.locator('[data-paywall="mistakes"]').isVisible()) && !/\d+ of \d+/.test(mz) && (await p.getByTestId("mistakes-preview").count()) === 1 && (await p.getByTestId("mistakes").locator(".bg-series-1").count()) === 0);
    check("Free: Patterns Nova sees shows the paywall instead of the patterns", (await p.locator('[data-paywall="patterns"]').isVisible()) && (await p.locator('aside[aria-labelledby="patterns-h"] .nova-note').count()) === 0);
    await grabPaywalls(p);
    await p.screenshot({ path: `${SHOTS}/t10-paywall-journal-desktop-light.png`, fullPage: true });
    await p.getByRole("button", { name: "Export CSV" }).click();
    await p.getByRole("dialog").locator('[data-paywall="csv"]').waitFor({ timeout: 5000 }).catch(() => {});
    check("Free: Export CSV opens the paywall and downloads nothing", await p.getByRole("dialog").locator('[data-paywall="csv"]').isVisible());
    await grabPaywalls(p);
    await p.keyboard.press("Escape");
    await p.goto(`${BASE}/community`);
    await p.getByRole("tab", { name: "Challenges" }).click();
    await p.getByRole("button", { name: "Join challenge" }).first().click();
    await p.getByRole("dialog").locator('[data-paywall="challenges"]').waitFor({ timeout: 5000 }).catch(() => {});
    st = await state(p);
    check("Free: Join challenge opens the paywall and joins nothing", (await p.getByRole("dialog").locator('[data-paywall="challenges"]').isVisible()) && !Object.keys(st.following ?? {}).some((k) => k.startsWith("challenge:")));
    await grabPaywalls(p);
    await p.keyboard.press("Escape");
    await p.goto(`${BASE}/debrief`);
    await p.locator('[data-paywall="debrief"]').waitFor({ timeout: 8000 }).catch(() => {});
    check("Free: /debrief shows the Elite paywall", (await p.locator('[data-paywall="debrief"]').isVisible()) && (await p.getByTestId("debrief-stats").count()) === 0);
    await grabPaywalls(p);
    // coach: the counter, then the limit
    await p.goto(`${BASE}/coach`);
    const coachLeftEl = p.getByTestId("coach-allowance");
    await coachLeftEl.waitFor();
    check("Free: the coach shows 10 of 10 free messages left today", (await coachLeftEl.innerText()).trim() === "10 of 10 free messages left today");
    await p.getByRole("button", { name: /How do I figure out/ }).click();
    await waitFor(async () => { const ch = (await state(p)).chat; return ch.length >= 2 && ch[ch.length - 1].content.length > 20; }, 20000, 250);
    await p.waitForTimeout(300);
    check("Free: sending a message counts it (9 of 10 left)", (await coachLeftEl.innerText()).trim() === "9 of 10 free messages left today", await coachLeftEl.innerText());
    const nine = await p.evaluate(async () => { const r = []; for (let i = 0; i < 9; i++) r.push((await window.__vantageTest.noteCoach()).ok); return r; });
    const tenth = await p.evaluate(() => window.__vantageTest.noteCoach());
    await p.locator('[data-paywall="coach"]').waitFor({ timeout: 5000 }).catch(() => {});
    check("Free: after 10 messages the composer becomes the paywall, and an 11th message is refused", nine.every(Boolean) && !tenth.ok && (await p.locator('[data-paywall="coach"]').isVisible()) && (await p.getByLabel("Message Nova").count()) === 0 && (await p.getByTestId("coach-allowance").innerText()).trim() === "0 of 10 free messages left today");
    await grabPaywalls(p);
    await p.evaluate(() => {
      window.__vantageTest.toast({ title: "Mission done: Ask your coach a question", body: "30 XP added.", tone: "good" });
      window.__vantageTest.toast({ title: "A second note with a longer title that wraps onto two lines", tone: "default" });
    });
    await p.waitForTimeout(400);
    const coachCover = await p.evaluate(() => {
      const toasts = [...document.querySelectorAll('[data-toaster] [role="status"], [data-toaster] [role="alert"]')].map((e) => e.getBoundingClientRect());
      const hit = [];
      for (const el of document.querySelectorAll('[data-paywall="coach"] h3, [data-paywall="coach"] p, [data-paywall="coach"] a, [data-paywall="coach"] button, [data-paywall="coach"] .tag')) {
        const r = el.getBoundingClientRect();
        if (toasts.some((t) => t.left < r.right && t.right > r.left && t.top < r.bottom && t.bottom > r.top)) hit.push((el.textContent || "").trim().slice(0, 30));
      }
      return { toasts: toasts.length, hit };
    });
    check("Free: toasts never cover the coach paywall (1440x1000)", coachCover.toasts >= 2 && coachCover.hit.length === 0, JSON.stringify(coachCover));
    await p.screenshot({ path: `${SHOTS}/t10-paywall-coach-desktop-light.png`, fullPage: true });

    // /upgrade on Free: every buy button has its renewal terms; previewing Premium unlocks the gates
    await p.goto(`${BASE}/upgrade`);
    await p.getByTestId("plan-ledger").waitFor();
    const up = await renewalProblems(p);
    check("/upgrade: the renewal terms sit beside every button that starts a plan (desktop)", up.n === 2 && up.out.length === 0, JSON.stringify(up));
    check("/upgrade: test mode is labelled on the page", (await p.getByTestId("test-mode-note").innerText()).includes("Payments aren't live yet"));
    planCopy.push(await p.locator("main").innerText());
    await p.screenshot({ path: `${SHOTS}/t10-upgrade-desktop-light.png`, fullPage: true });
    await p.getByRole("button", { name: "Preview Premium" }).first().click();
    const dlg = p.getByTestId("test-mode-dialog");
    await dlg.waitFor();
    planCopy.push(await dlg.innerText());
    const dr = await renewalProblems(p);
    check("the test-mode dialog's Preview button has the renewal terms beside it, and says there is no charge", dr.out.length === 0 && (await dlg.innerText()).includes(TEST_MODE) && (await dlg.innerText()).includes("nothing is charged"), JSON.stringify(dr));
    await p.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await p.waitForTimeout(300); // long enough for any write to have landed
    check("Cancel in the test-mode dialog changes nothing", (await state(p)).profile.plan === "free" && (await p.getByRole("dialog").count()) === 0);
    await p.getByRole("button", { name: "Preview Premium" }).first().click();
    await p.getByRole("dialog").getByRole("button", { name: "Preview Premium" }).click();
    await p.waitForFunction(() => JSON.parse(localStorage.getItem("sp-app")).state.profile.plan === "premium");
    await p.locator("[data-toaster]").getByText(/Previewing Premium/).waitFor({ timeout: 5000 }).catch(() => {});
    const toast = await p.locator("[data-toaster]").innerText();
    planCopy.push(toast);
    check("previewing shows a test-mode toast that says nothing was charged", /Previewing Premium in test mode/.test(toast) && /Nothing was charged/.test(toast), toast);
    await p.goto(`${BASE}/learn/trends-and-candles`);
    await p.getByText("Check your understanding").waitFor({ timeout: 8000 }).catch(() => {});
    check("Premium: the module 3 lesson opens in full with its quiz and tool", (await p.getByText("Check your understanding").isVisible()) && (await p.getByTestId("widget-trend-spotter").isVisible()) && (await p.locator("[data-paywall]").count()) === 0);
    await p.goto(`${BASE}/markets/NVDA`);
    await p.getByRole("radio", { name: "1M" }).click();
    await p.getByLabel("Show 50-day average").check();
    check("Premium: the 50-day average overlay turns on", (await p.getByRole("list", { name: "Legend" }).getByText("50-day average").count()) === 1 && (await p.getByRole("dialog").count()) === 0);
    check("Premium: the ticket has Buy and no daily counter", (await p.getByRole("button", { name: /^Buy \d+ NVDA$/ }).isVisible()) && (await p.getByTestId("trade-allowance").count()) === 0);
    await p.goto(`${BASE}/journal`);
    await p.getByTestId("mistakes").waitFor();
    check("Premium: the journal shows mistake counts and Nova's patterns", /\d+ of \d+/.test(await p.getByTestId("mistakes").innerText()) && (await p.locator("[data-paywall]").count()) === 0 && (await p.locator('aside[aria-labelledby="patterns-h"] .nova-note').count()) === 1);
    const [csvDl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Export CSV" }).click()]);
    const csvText = fs.readFileSync(await csvDl.path(), "utf8");
    st = await state(p);
    check("Premium: Export CSV downloads every trade as a CSV file", /^vantage-simulated-trades-\d{8}-\d{6}\.csv$/.test(csvDl.suggestedFilename()) && csvText.trim().split("\r\n").length === st.trades.length + 1 && csvText.startsWith("Date,Side,Symbol"), `${csvDl.suggestedFilename()} ${csvText.trim().split("\r\n").length - 1} rows of ${st.trades.length}`);
    await p.goto(`${BASE}/community`);
    await p.getByRole("tab", { name: "Challenges" }).click();
    await p.getByRole("button", { name: "Join challenge" }).first().click();
    check("Premium: Join challenge joins", (await p.getByRole("button", { name: "Joined" }).count()) === 1 && (await p.getByRole("dialog").count()) === 0);
    await p.goto(`${BASE}/coach`);
    await p.getByLabel("Message Nova").waitFor();
    check("Premium: the coach has its composer back and no counter", (await p.getByTestId("coach-allowance").count()) === 0);

    // Elite: debrief, learning plan, badge
    await p.goto(`${BASE}/upgrade`);
    await p.getByRole("button", { name: "Preview Elite" }).first().click();
    await p.getByRole("dialog").getByRole("button", { name: "Preview Elite" }).click();
    await p.waitForFunction(() => JSON.parse(localStorage.getItem("sp-app")).state.profile.plan === "elite");
    await p.goto(`${BASE}/journal`);
    await p.getByTestId("mistakes").waitFor();
    const topMistake = (await p.getByTestId("mistakes").locator("li span.truncate").first().innerText()).trim();
    await p.goto(`${BASE}/debrief`);
    await p.getByTestId("debrief-stats").waitFor({ timeout: 8000 }).catch(() => {});
    st = await state(p);
    const weekTrades = st.trades.filter((t) => Date.now() - t.at < 7 * 864e5).length;
    check("Elite: /debrief shows the last 7 days: trade count, trend, top mistakes, best and worst decision, three focus points", (await p.getByTestId("debrief-trade-count").innerText()) === String(weekTrades) && (await p.getByTestId("debrief-trend").isVisible()) && (await p.getByTestId("debrief-mistakes").getByText(topMistake).count()) >= 1 && (await p.getByText("Best decision", { exact: true }).isVisible()) && (await p.getByText("Worst decision", { exact: true }).isVisible()) && (await p.getByTestId("debrief-focus").locator("ol > li").count()) >= 1 && (await p.locator("[data-paywall]").count()) === 0, `${weekTrades} trades, top ${topMistake}`);
    await p.screenshot({ path: `${SHOTS}/t10-debrief-desktop-light.png`, fullPage: true });
    await p.goto(`${BASE}/learn`);
    const plan = p.getByTestId("learning-plan");
    await plan.waitFor({ timeout: 8000 }).catch(() => {});
    const steps = plan.locator("ol > li");
    const firstWhy = await steps.first().innerText().catch(() => "");
    check("Elite: Learn opens with a learning plan built from the most frequent mistake (lessons and missions)", (await steps.count()) >= 2 && firstWhy.includes(topMistake) && (await plan.locator('a[href^="/learn/"]').count()) >= 1 && (await p.locator("main ol li:has(.tag-plan)").count()) === 0, `${await steps.count()} steps, first: ${firstWhy.replace(/\s+/g, " ")}`);
    const planBox = await plan.boundingBox();
    const mapBox = await p.getByRole("heading", { name: /Market foundations/ }).boundingBox();
    check("Elite: the plan sits at the top of Learn, beside the course map on desktop", !!planBox && !!mapBox && planBox.y <= mapBox.y + 40 && planBox.x > mapBox.x, JSON.stringify({ plan: planBox, map: mapBox }));
    await p.screenshot({ path: `${SHOTS}/t10-learn-plan-desktop-light.png`, fullPage: true });
    await p.goto(`${BASE}/community`);
    await p.getByLabel("Post text").fill("Elite badge check: sized from the stop at 1% risk.");
    await p.getByRole("button", { name: "Post", exact: true }).click();
    await p.locator("article").first().locator("[data-elite-badge]").waitFor({ timeout: 5000 }).catch(() => {});
    const badgeOnPost = await p.locator("article").first().locator("[data-elite-badge]").count();
    const badgeOnDemo = await p.locator("article:has([data-demo]) [data-elite-badge]").count();
    await p.getByRole("tab", { name: "Leaderboard" }).click();
    const lbBadges = await p.locator("ol > li [data-elite-badge]").count();
    const myRowBadge = await p.locator("ol > li").filter({ hasText: "Pat" }).locator("[data-elite-badge]").count();
    check("Elite: the badge shows on your own post and your leaderboard row, never on demo members", badgeOnPost === 1 && badgeOnDemo === 0 && lbBadges === 1 && myRowBadge === 1, JSON.stringify({ badgeOnPost, badgeOnDemo, lbBadges, myRowBadge }));
    eliteState = await c.storageState();

    // cancel: one click in Settings, back to Free
    await p.goto(`${BASE}/settings`);
    await p.getByText("Plan: Elite").waitFor();
    planCopy.push(await p.locator("#membership").innerText());
    check("Settings labels the preview as test mode with no charge", (await p.locator("#membership").getByText("Test mode", { exact: true }).isVisible()) && /nothing is charged/.test(await p.getByTestId("plan-detail").innerText()));
    await p.getByRole("button", { name: "Cancel plan" }).click();
    await p.waitForFunction(() => JSON.parse(localStorage.getItem("sp-app")).state.profile.plan === "free", null, { timeout: 5000 }).catch(() => {});
    st = await state(p);
    check("Cancel plan works in one click: no confirm step, back to Free, toast says so", st.profile.plan === "free" && (await p.getByRole("dialog").count()) === 0 && (await p.getByText("Plan cancelled. You're on Free.").isVisible()) && (await p.getByText("Plan: Free").isVisible()) && (await p.getByRole("button", { name: "Cancel plan" }).count()) === 0);
    await p.goto(`${BASE}/debrief`);
    check("after cancelling, Elite pages are locked again", await p.locator('[data-paywall="debrief"]').isVisible());
    await c.close();
  }
  {
    // Elite pages on a phone in dark mode: screenshots, no overflow, accessibility smoke
    const c = await browser.newContext({ ...devices["iPhone 14"], colorScheme: "dark", reducedMotion: "reduce", storageState: eliteState });
    const p = await c.newPage();
    watch(p, "elite-phone");
    const issues = [];
    for (const [r, shot] of [["/debrief", "t10-debrief-phone-dark"], ["/learn", "t10-learn-plan-phone-dark"], ["/upgrade", "t10-upgrade-phone-dark"]]) {
      await p.goto(`${BASE}${r}`);
      await p.waitForTimeout(700);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 1) issues.push(`${r} overflows ${over}px`);
      for (const i of await p.evaluate(a11ySmoke)) issues.push(`${r}: ${i}`);
      await p.screenshot({ path: `${SHOTS}/${shot}.png`, fullPage: true });
    }
    check("Elite phone dark: /debrief, /learn with the plan and /upgrade fit the screen and pass the accessibility smoke", issues.length === 0, issues.slice(0, 4).join(" | "));
    const planTop = await p.goto(`${BASE}/learn`).then(() => p.waitForTimeout(500)).then(() => p.evaluate(() => {
      const plan = document.querySelector('[data-testid="learning-plan"]')?.getBoundingClientRect().top ?? 1e9;
      const map = [...document.querySelectorAll("main h2")].find((h) => /Market foundations/.test(h.textContent))?.getBoundingClientRect().top ?? 0;
      return { plan, map };
    }));
    check("Elite phone: the learning plan comes before the course map", planTop.plan < planTop.map, JSON.stringify(planTop));
    await p.goto(`${BASE}/upgrade`);
    await p.getByRole("radio", { name: "Premium" }).click();
    const phoneR = await renewalProblems(p);
    check("/upgrade on a phone: the plan selector shows one plan, with the renewal terms under its button", phoneR.n === 1 && phoneR.out.length === 0 && (await p.getByRole("radiogroup", { name: "Plan" }).isVisible()), JSON.stringify(phoneR));
    await c.close();
  }
  {
    // two tabs on Free can never together place more than 10 orders (store level, fired at the same moment)
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await c.addInitScript(() => {
      window.__VANTAGE_TEST__ = true;
    });
    const a = await c.newPage();
    const b = await c.newPage();
    watch(a, "limit-A");
    watch(b, "limit-B");
    await onboardAs(a, "Tab");
    await a.goto(`${BASE}/markets/KO`);
    await b.goto(`${BASE}/markets/AAPL`);
    await a.waitForFunction(() => !!window.__vantageTest?.placeOrder);
    await b.waitForFunction(() => !!window.__vantageTest?.placeOrder);
    const burst = (pg, sym) => pg.evaluate((s) => Promise.all(Array.from({ length: 8 }, () => window.__vantageTest.placeOrder({ symbol: s, side: "buy", type: "market", qty: 1 }))), sym);
    const [ra, rb] = await Promise.all([burst(a, "KO"), burst(b, "AAPL")]);
    await a.waitForTimeout(800);
    const okN = [...ra, ...rb].filter((r) => r.ok).length;
    const sa = await state(a), sb = await state(b);
    const entries = (st) => st.trades.filter((t) => t.role === "entry").length;
    check("two tabs on Free, 16 buys fired at once: exactly 10 go through and both tabs agree", okN === 10 && [...ra, ...rb].filter((r) => !r.ok).every((r) => r.code === "limit") && entries(sa) === 10 && entries(sb) === 10 && todayCount(sa, "tradeLog") === 10 && todayCount(sb, "tradeLog") === 10, `ok ${okN}, A entries ${entries(sa)}, B entries ${entries(sb)}, stamps ${todayCount(sa, "tradeLog")}/${todayCount(sb, "tradeLog")}`);
    await a.bringToFront();
    await a.locator('[data-paywall="trades"]').waitFor({ timeout: 5000 }).catch(() => {});
    await b.bringToFront();
    await b.locator('[data-paywall="trades"]').waitFor({ timeout: 5000 }).catch(() => {});
    check("two tabs on Free: both tickets show the paywall once the shared limit is reached", (await a.locator('[data-paywall="trades"]').isVisible()) && (await b.locator('[data-paywall="trades"]').isVisible()));
    const sells = await Promise.all([a.evaluate(() => window.__vantageTest.placeOrder({ symbol: "KO", side: "sell", type: "market", qty: 1 })), b.evaluate(() => window.__vantageTest.placeOrder({ symbol: "AAPL", side: "sell", type: "market", qty: 1 }))]);
    check("two tabs on Free at the limit: selling from both tabs still works", sells.every((r) => r.ok), JSON.stringify(sells));
    const coachBurst = (pg) => pg.evaluate(() => Promise.all(Array.from({ length: 7 }, () => window.__vantageTest.noteCoach())));
    const [ca, cb] = await Promise.all([coachBurst(a), coachBurst(b)]);
    await a.waitForTimeout(500);
    check("two tabs on Free, 14 coach messages at once: exactly 10 are allowed", [...ca, ...cb].filter((r) => r.ok).length === 10 && todayCount(await state(a), "coachLog") === 10 && todayCount(await state(b), "coachLog") === 10);
    await c.close();
  }
  {
    // two tabs on Free, real clicks on both tickets at the same moment: the combined count still stops at 10
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const a = await c.newPage();
    const b = await c.newPage();
    watch(a, "limit-ui-A");
    watch(b, "limit-ui-B");
    await onboardAs(a, "Two");
    await a.goto(`${BASE}/markets/KO`);
    await b.goto(`${BASE}/markets/AAPL`);
    await a.locator("#qty").waitFor();
    await b.locator("#qty").waitFor();
    const clickBuy = async (pg, sym, q) => {
      await pg.locator("#qty").fill(q).catch(() => {});
      return pg.getByRole("button", { name: new RegExp(`^Buy ${q} ${sym}$`) }).click({ timeout: 1500 }).then(() => true).catch(() => false);
    };
    for (let i = 0; i < 7; i++) {
      const q = i % 2 ? "1" : "2";
      await Promise.all([clickBuy(a, "KO", q), clickBuy(b, "AAPL", q)]);
      await a.waitForTimeout(700);
    }
    await a.waitForTimeout(800);
    const sa = await state(a), sb = await state(b);
    const entries = (st) => st.trades.filter((t) => t.role === "entry").length;
    check("two tabs on Free, 14 simultaneous Buy clicks: exactly 10 orders are placed", entries(sa) === 10 && entries(sb) === 10 && todayCount(sa, "tradeLog") === 10, `A ${entries(sa)}, B ${entries(sb)}, stamps ${todayCount(sa, "tradeLog")}`);
    await c.close();
  }
  {
    // /pricing: public, three plans, renewal terms under every button, test mode, Terms link (desktop light, then phone dark)
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce" });
    const p = await c.newPage();
    watch(p, "pricing");
    const res = await p.goto(`${BASE}/pricing`);
    await p.getByTestId("plan-ledger").waitFor();
    const heads = await p.locator("thead th").allInnerTexts();
    check("/pricing is public (200, no consent gate) and shows three plans at $0, $30 and $60 a month", res?.status() === 200 && (await p.getByRole("dialog").count()) === 0 && heads.length === 3 && /^Free/.test(heads[0]) && /^Premium/.test(heads[1]) && /^Elite/.test(heads[2]) && heads[0].includes("$0") && heads[1].includes("$30") && heads[2].includes("$60") && heads.every((h) => h.includes("a month")), heads.map((h) => h.split("\n")[0]).join(","));
    check("/pricing: Premium carries the Most popular tag, and only Premium", heads[1].includes("Most popular") && !heads[0].includes("Most popular") && !heads[2].includes("Most popular"));
    const pr = await renewalProblems(p);
    check("/pricing: the renewal terms sit under every button that starts a plan", pr.n === 2 && pr.out.length === 0, JSON.stringify(pr));
    check("/pricing: test mode is labelled and the Terms' paid-plans section is linked", (await p.getByTestId("test-mode-note").innerText()).includes("Payments aren't live yet") && (await p.locator('main a[href="/terms#paid-plans"]').count()) >= 1);
    check("/pricing: the comparison lists only features that exist (ink ticks, dashes read as Not included)", (await p.locator("tbody th[scope=row]").count()) >= 12 && (await p.getByText("Not included").count()) > 0 && (await p.locator("tbody svg path[stroke='var(--pencil)']").count()) === 0);
    planCopy.push(await p.locator("main").innerText());
    await p.screenshot({ path: `${SHOTS}/t10-pricing-desktop-light.png`, fullPage: true });
    await p.getByRole("button", { name: "Preview Elite" }).click();
    await p.getByTestId("test-mode-dialog").waitFor();
    planCopy.push(await p.getByTestId("test-mode-dialog").innerText());
    check("/pricing: Preview opens the same test-mode dialog", (await p.getByTestId("test-mode-dialog").innerText()).includes(TEST_MODE));
    await p.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await c.close();
    const c2 = await browser.newContext({ ...devices["iPhone 14"], colorScheme: "dark", reducedMotion: "reduce" });
    const p2 = await c2.newPage();
    watch(p2, "pricing-phone");
    await p2.goto(`${BASE}/pricing`);
    await p2.getByRole("radiogroup", { name: "Plan" }).waitFor();
    const per = [];
    for (const name of ["Free", "Premium", "Elite"]) {
      await p2.getByRole("radio", { name }).click();
      const r = await renewalProblems(p2);
      per.push(`${name}:${r.n}/${r.out.length}`);
      if (r.out.length) per.push("BAD");
    }
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("/pricing on a phone: one plan at a time, renewal terms under its button, no sideways scrolling", !per.includes("BAD") && per.join() === "Free:0/0,Premium:1/0,Elite:1/0" && over <= 1, `${per.join()} overflow ${over}`);
    await p2.getByRole("radio", { name: "Premium" }).click();
    await p2.screenshot({ path: `${SHOTS}/t10-pricing-phone-dark.png`, fullPage: true });
    await c2.close();
  }
  {
    // honest copy: no confirmshaming, urgency, countdowns or wording that makes a preview look like a charge
    const SHAME = /no thanks|i don.t want|i.d rather (not|stay)|miss(ing)? out|don.t miss|last chance|limited time|only today|today only|\bhurry\b|act now|buy now|upgrade now|before it.s gone|you.ll lose|you will lose|don.t lose|are you sure|offer ends|expires? (in|soon|tonight)|countdown|only \d+ (left|spots)|spots left|people (are )?(viewing|upgrading)|ends (in|tonight|soon)|\bregret\b|serious traders|real traders|smart traders|\blosers?\b|\bstay behind\b|just \$\d+/i;
    const CHARGE = /\byou (were|have been|will be) charged\b|payment (successful|received|complete)|\breceipt\b|card number|\bsubscribed\b|thank you for your (purchase|payment)|purchase complete|order total/i;
    const all = planCopy.join("\n");
    const shame = planCopy.map((t) => t.match(SHAME)?.[0]).filter(Boolean);
    const charge = planCopy.map((t) => t.match(CHARGE)?.[0]).filter(Boolean);
    check(`no paywall or pricing copy matches a confirmshaming or fake-urgency phrase (${planCopy.length} texts)`, planCopy.length >= 15 && shame.length === 0, shame.join(", "));
    check("previewing never reads like a real charge (no receipt, card or payment-success wording)", charge.length === 0 && /no charge|nothing is charged|Nothing was charged/i.test(all), charge.join(", "));
    check("no countdown or timer element on any plan surface", !/\d{1,2}:\d{2}:\d{2}|\bhours? left\b|\bminutes? left\b/i.test(all));
  }
  {
    // legal: the Terms describe what is live, the Privacy Policy the referral code, under a new version
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    watch(p, "legal-t10");
    await p.goto(`${BASE}/terms`);
    const terms = await p.locator("#paid-plans").locator("..").innerText();
    check("Terms section 15 describes the live plans: test mode at no charge, one-click cancel in Settings, when it takes effect, the Free limits", /Payments are not live yet/.test(terms) && /test mode/.test(terms) && /no card is asked for or charged/.test(terms) && /one click/.test(terms) && /returns you to the Free plan at once/.test(terms) && /Selling to close or reduce a position is always allowed/.test(terms) && /midnight/.test(terms) && terms.includes("[refund policy]") && !/when paid plans are offered/i.test(terms));
    check(`the legal pages carry the new version (${TERMS_VERSION})`, (await p.getByText(new RegExp(`Version ${TERMS_VERSION}`)).first().isVisible()));
    await p.goto(`${BASE}/privacy`);
    const priv = await p.locator("main").innerText();
    check("Privacy: the referral code from an invite link is stored in the browser and identifies no one; the plan and daily counts are listed too", /referral code in that link is stored in your browser/.test(priv) && /identifies no one/.test(priv) && /your plan \(Free, or the plan you are previewing in test mode\)/.test(priv));
    await c.close();
  }

  // ---------------- every page × theme × device ----------------
  // Screenshots use reduced motion so they show final states (and exercise the reduced-motion paths);
  // the landing hero animation is checked separately with motion on.
  console.log("\nPages, themes, devices, links");
  const storage = await ctx.storageState();
  const links = new Set();
  const smokeIssues = [];
  check("text and surface tokens meet 4.5:1 in light and dark (edge 3:1)", tokenContrast().length === 0, tokenContrast().join(", "));
  for (const [label, opts] of [
    ["desktop-dark", { viewport: { width: 1440, height: 1000 }, colorScheme: "dark", reducedMotion: "reduce" }],
    ["desktop-light", { viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce" }],
    ["phone-dark", { ...devices["iPhone 14"], colorScheme: "dark", reducedMotion: "reduce" }],
    ["phone-light", { ...devices["iPhone 14"], colorScheme: "light", reducedMotion: "reduce" }],
  ]) {
    const c = await browser.newContext({ ...opts, storageState: storage });
    const p = await c.newPage();
    watch(p, label);
    for (const r of ROUTES) {
      const res = await p.goto(`${BASE}${r}`);
      await p.waitForTimeout(700);
      const ok = res && res.status() === 200;
      // Measure against the layout viewport (clientWidth), not innerWidth: in phone emulation Chromium zooms
      // out to fit a too-wide page, so innerWidth grows with the page and hides the overflow.
      const { px: overflow, who } = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const clippers = new Set([...document.querySelectorAll("body *")].filter((el) => !["visible", ""].includes(getComputedStyle(el).overflowX)));
        let worst = document.documentElement.scrollWidth - vw;
        let who = worst > 1 ? "document scrollWidth" : "";
        for (const el of document.querySelectorAll("body *")) {
          let a = el.parentElement;
          let inScroller = false;
          while (a && a !== document.body) {
            if (clippers.has(a)) {
              inScroller = true;
              break;
            }
            a = a.parentElement;
          }
          if (inScroller) continue;
          const rect = el.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          if (rect.right - vw > worst) {
            worst = rect.right - vw;
            who = `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : ""}`;
          }
        }
        return { px: Math.round(worst), who };
      });
      if (!ok || overflow > 1) check(`${label} ${r}`, false, `status ${res?.status()} overflow ${overflow}px (${who})`);
      for (const issue of await p.evaluate(a11ySmoke)) smokeIssues.push(`${label} ${r}: ${issue}`);
      const name = `${label}${r.replace(/\//g, "_") || "_home"}.png`;
      await p.screenshot({ path: `${SHOTS}/${name}`, fullPage: true });
      for (const h of await p.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute("href")))) links.add(h.split("?")[0]);
    }
    check(`${label}: all ${ROUTES.length} pages render, no overflow`, true);
    check(`${label}: accessibility smoke on ${ROUTES.length} pages (names, labels, one h1, unique ids, tab panels)`, smokeIssues.length === 0, smokeIssues.slice(0, 4).join(" | "));
    smokeIssues.length = 0;
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
  // phone header at the two most common widths: every control fits and keeps a 40px target
  for (const w of [360, 390]) {
    const c = await browser.newContext({ ...devices["iPhone 14"], viewport: { width: w, height: 800 }, storageState: storage });
    const p = await c.newPage();
    watch(p, `phone-header-${w}`);
    await p.goto(`${BASE}/dashboard`);
    await p.waitForTimeout(600);
    const bad = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const h = document.querySelector("header");
      return [...h.querySelectorAll("a,button")]
        .filter((el) => el.offsetParent !== null)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { name: el.getAttribute("aria-label") || el.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), vw };
        })
        .filter((x) => x.w < 40 || x.h < 40 || x.right > x.vw + 1);
    });
    check(`phone header at ${w}px: every control fits and is at least 40×40`, bad.length === 0, JSON.stringify(bad));
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
