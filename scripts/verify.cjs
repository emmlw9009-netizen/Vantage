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
const ROUTES = ["/", "/dashboard", "/markets", "/markets/NVDA", "/markets/SPY", "/learn", "/learn/position-sizing", "/coach", "/community", "/journal", "/settings", ...LEGAL_ROUTES.map((r) => r[0])];
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
    const spyBefore = (await state(tabB)).positions.SPY?.qty ?? 0;
    const tradesBefore = (await state(tabB)).trades.length;
    check("tab B trade is saved", spyBefore === 3);
    await tabA.bringToFront(); // the user switches back to the stale tab, which is visible again and ticking
    // tab A stays open and its 10s equity snapshot fires. Sample storage every 500ms: a stale write may be repaired a moment later by another tab, so one late read is not enough.
    let lost = 0;
    for (let i = 0; i < 30; i++) {
      await tabA.waitForTimeout(500);
      const st = await state(tabA);
      if (st.positions.SPY?.qty !== 3 || st.trades.length < tradesBefore) lost++;
    }
    const afterA = await state(tabA);
    check("multi-tab: trade made in tab B survives while tab A stays open 15s", lost === 0 && afterA.positions.SPY?.qty === 3 && afterA.trades.length === tradesBefore, `SPY ${afterA.positions.SPY?.qty}, trades ${afterA.trades.length}/${tradesBefore}, ${lost}/30 samples missing it`);
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
    check("export downloads a timestamped JSON of both stores", /^vantage-data-\d{8}-\d{6}\.json$/.test(dl.suggestedFilename()) && !!json.stores["sp-app"]?.state?.trades && !!json.stores["sp-market"]?.state?.prices && ["profile", "cash", "positions", "orders", "equityHistory", "watchlist", "xp", "completedLessons", "missions", "posts", "comments", "chat", "reported"].every((k) => k in json.stores["sp-app"].state), dl.suggestedFilename());
    await p.getByRole("radio", { name: "Light" }).click();
    check("theme choice applies", (await p.evaluate(() => document.documentElement.dataset.theme)) === "light");
    await p.getByRole("button", { name: "Reset practice account" }).click();
    await p.getByRole("dialog").getByRole("button", { name: "Reset account" }).click();
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
    await p.getByText("Live headlines").waitFor();
    await p.waitForTimeout(1500);
    const heads = await p.evaluate(() => JSON.parse(localStorage.getItem("sp-market")).state.news.map((n) => n.headline));
    check("stale stored headlines (regulator inquiry, CFO departs) are dropped on load", heads.length > 0 && !heads.some((h) => /inquiry|CFO|delays|cuts outlook|misses on revenue|margins shrink/i.test(h)), heads.slice(0, 2).join(" | "));
    check("every stored headline matches a simulation template", heads.every((h) => /simulat|hypothetical/i.test(h)), heads.find((h) => !/simulat|hypothetical/i.test(h)) || "");
    const items = await p.locator("section:has-text('Live headlines') ul > li").count();
    const tags = await p.locator("section:has-text('Live headlines') [data-testid=sim-tag]").allInnerTexts();
    check("every headline carries a visible Simulated tag", items > 0 && tags.length === items && tags.every((t) => t.trim() === "Simulated"), `${tags.length} tags for ${items} headlines`);
    check("news panel says it is fictional and not affiliated", (await p.getByText(/Fictional scenarios for practice\. Not real news/).first().isVisible()) && (await p.getByText(/Not affiliated with or endorsed by any company named/).first().isVisible()));
    await p.goto(`${BASE}/markets/NVDA`);
    check("ticket shows the simulated-trade line above the buttons", await p.getByText("Simulated trade. Prices are generated and are not real market prices.").isVisible());
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
    // citations
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storageNow });
    const p = await c.newPage();
    watch(p, "sources");
    for (const [slug, frag] of [["index-vs-picking", "spglobal.com/spdji/en/research-insights/spiva"], ["overtrading", "doi.org/10.1111/0022-1082.00226"], ["loss-aversion", "doi.org/10.2307/1914185"]]) {
      await p.goto(`${BASE}/learn/${slug}`);
      await p.getByTestId("lesson-sources").waitFor({ timeout: 10000 }).catch(() => {});
      const a = p.getByTestId("lesson-sources").getByRole("link");
      const href = (await a.count()) === 1 ? await a.getAttribute("href") : "";
      check(`/learn/${slug} ends with a Sources line linking ${frag}`, href.includes(frag) && (await a.getAttribute("target")) === "_blank" && (await p.getByTestId("lesson-sources").innerText()).startsWith("Sources:"), href);
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
    await first.getByRole("button", { name: "Like", exact: true }).click();
    check("liking a demo post shows only your own like (1)", (await first.locator("[data-like-count]").innerText()) === "1");
    await first.getByRole("button", { name: "Unlike", exact: true }).click();
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
    check("Undo in the toast restores the post", (await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).count()) === 1 && !(await state(p)).reported?.p4);
    await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).getByRole("button", { name: "Report post" }).click();
    await p.reload();
    await p.getByLabel("Post text").waitFor();
    check("a reported post stays hidden after reload", (await p.locator("article", { hasText: "why does my stock drop the moment I buy it" }).count()) === 0);
    // Report on a comment
    const p2b = p.locator("article", { hasText: "bought TSLA after a +7% day" });
    await p2b.getByRole("button", { name: /^Comments/ }).click();
    await p2b.getByRole("button", { name: "Report comment" }).first().click();
    check("Report on a comment hides that comment only", (await p.getByText("Respect for posting this").count()) === 0 && (await p2b.getByText("Great reflection").count()) === 1 && (await state(p)).reported?.["p2-0"] === true);
    // leaderboard and challenges
    await p.getByRole("tab", { name: "Leaderboard" }).click();
    const rows = p.locator("ol > li", { has: p.locator("[data-demo]") });
    check("every demo leaderboard row has a Demo label and your row has none", (await rows.count()) === 6 && (await p.locator("ol > li").filter({ hasText: "Alex" }).locator("[data-demo]").count()) === 0);
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
      check(`community: ${label} gets the canned Nova reply, not HTML`, nova && reply.includes("Love that you shared this") && !/<html|<!DOCTYPE|Internal Server Error|could not be found/i.test(reply), reply.slice(0, 80));
      await c.close();
    }
  }

  // ---------------- every page × theme × device ----------------
  // Screenshots use reduced motion so they show final states (and exercise the reduced-motion paths);
  // the landing hero animation is checked separately with motion on.
  console.log("\nPages, themes, devices, links");
  const storage = await ctx.storageState();
  const links = new Set();
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
