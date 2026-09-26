/* Optional browser regression checks. Start Jekyll on port 4000 first. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = (process.env.SITE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const out = path.resolve(".artifacts");
fs.mkdirSync(out, { recursive: true });
const errors = [];
const routes = ["/", "/archive/", "/projects/", "/about/", "/tags/", "/thanks/", "/404.html",
  "/dork-me-honey/", "/usable-security-phishing-simulations/",
  "/projects/bin2shell/", "/projects/learn-ttps/", "/projects/profile-doktor/"];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
    // Preferences saved by the old toggle must not restore the removed light theme.
    await context.addInitScript(() => localStorage.setItem("theme", "light"));
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    const requests = [];
    page.on("request", request => requests.push(request.url()));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of routes) {
        const response = await page.goto(base + route);
        assert.equal(response.status(), 200, route);
        assert.equal(await page.locator(".theme-toggle").count(), 0);
        assert.equal(await page.locator(".brand-mark").count(), 0);
        assert.equal(await page.locator("h1").count(), 1, route + " heading");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(overflow, false, route + " overflows at " + width);
        if (route === "/") {
          assert.equal(await page.locator(".project-card").count(), 3);
          await page.screenshot({ path: path.join(out, "home-" + width + ".png"), fullPage: true });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    requests.length = 0;
    await page.goto(base + "/");
    await page.waitForLoadState("networkidle");
    assert(!requests.some(url => /mermaid|fonts.googleapis/.test(url)), "Home should not load Mermaid or remote fonts");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.equal(await page.locator("html").evaluate(node => getComputedStyle(node).colorScheme), "dark");
    assert.equal(await page.locator(".project-card").first().evaluate(node => getComputedStyle(node).borderRadius), "0px");

    // Identity belongs to the project's title/date, not its position or viewport.
    const artwork = () => page.locator(".project-card").evaluateAll(cards => cards.map(card => ({
      title: card.dataset.projectTitle, seed: card.dataset.artSeed,
      palette: ["--art-a", "--art-b", "--art-c", "--art-ax", "--art-bx"].map(name => card.style.getPropertyValue(name))
    })));
    const originals = await artwork();
    assert.equal(new Set(originals.map(card => card.seed)).size, 3);
    assert.equal(new Set(originals.map(card => JSON.stringify(card.palette))).size, 3);
    assert(originals.every(card => card.palette.every(Boolean)));
    await page.reload();
    assert.deepEqual(await artwork(), originals, "Reload preserves artwork");
    await page.goto(base + "/projects/");
    assert.deepEqual(await artwork(), originals, "Gallery and home share artwork");
    await page.screenshot({ path: path.join(out, "projects-1440.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 1000 });
    assert.deepEqual(await artwork(), originals, "Responsive resizing preserves artwork");
    await page.screenshot({ path: path.join(out, "projects-390.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.evaluate(() => {
      const original = document.querySelector(".project-card");
      for (const [title, date] of [[original.dataset.projectTitle, original.dataset.projectCreated],
        [original.dataset.projectTitle + " changed", original.dataset.projectCreated],
        [original.dataset.projectTitle, "2025-01-01"], ["Café <&> 安全", "2025-01-01"]]) {
        const card = original.cloneNode(true);
        card.hidden = true;
        card.dataset.testArt = "true";
        card.dataset.projectTitle = title;
        card.dataset.projectCreated = date;
        card.removeAttribute("style");
        document.querySelector(".projects-grid").prepend(card);
      }
    });
    await page.addScriptTag({ path: path.resolve("assets/js/project-art.js") });
    const variants = (await artwork()).slice(0, 4).reverse();
    assert.deepEqual(variants[0], originals[0], "Order cannot affect seed or palette");
    assert.equal(new Set(variants.map(card => card.seed)).size, 4, "Both title and creation date affect the hash");
    assert.equal(new Set(variants.map(card => JSON.stringify(card.palette))).size, 4);
    let expectedHash = 0x811c9dc5;
    for (const byte of Buffer.from("Café <&> 安全\0" + "2025-01-01")) expectedHash = Math.imul(expectedHash ^ byte, 0x01000193);
    assert.equal(variants[3].seed, (expectedHash >>> 0).toString(16).padStart(8, "0"), "UTF-8 hash contract");
    await page.evaluate(() => document.querySelectorAll("[data-test-art]").forEach(card => card.remove()));

    const firstCard = page.locator(".project-card").first();
    await firstCard.locator("a").focus();
    await page.waitForTimeout(1300);
    assert.equal(await firstCard.locator(".project-art").evaluate(node => getComputedStyle(node).opacity), "1", "Keyboard focus reveals artwork");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const stillDrift = () => firstCard.locator(".project-art").evaluate(node => getComputedStyle(node, "::before").animationName);
    assert.equal(await stillDrift(), "none", "Reduced motion stops the gradient");
    await firstCard.hover();
    assert.equal(await stillDrift(), "none");
    assert.equal(await firstCard.evaluate(node => getComputedStyle(node).transform), "none");
    await firstCard.click({ position: { x: 15, y: 90 } });
    await page.waitForURL(base + "/projects/bin2shell/");
    assert.equal(await page.locator('script[src*="project-art"]').count(), 0, "Article pages skip gallery code");
    await page.emulateMedia({ reducedMotion: "no-preference" });

    await page.goto(base + "/archive/");
    const search = page.getByRole("searchbox", { name: "Find an article" });
    await search.fill("honeypot");
    assert.equal(await page.locator(".post-card:visible").count(), 1);
    await search.fill("  THREAT   intelligence  ");
    assert.equal(await page.locator(".post-card:visible").count(), 1);
    await search.fill("nothingmatches987");
    assert.equal(await page.locator(".post-card:visible").count(), 0);
    assert(await page.locator("#search-empty").isVisible());
    await search.press("Escape");
    assert.equal(await page.locator(".post-card:visible").count(), 2);

    for (const route of ["/dork-me-honey/", "/usable-security-phishing-simulations/", "/projects/bin2shell/", "/projects/profile-doktor/"]) {
      await page.goto(base + route);
      const figures = page.locator("figure.diagram");
      for (let i = 0; i < await figures.count(); i++) {
        const figure = figures.nth(i);
        await figure.scrollIntoViewIfNeeded();
        await figure.locator(".diagram-canvas svg").waitFor({ timeout: 45000 });
        assert(await figure.locator(".diagram-canvas").isVisible(), route);
        const expand = figure.getByRole("button", { name: /^Expand / });
        await expand.click();
        assert(await page.locator("dialog").isVisible());
        assert.equal(await page.locator("dialog svg").count(), 1);
        await page.getByRole("button", { name: "Zoom in", exact: true }).click();
        await page.getByRole("button", { name: "Fit", exact: true }).click();
        await page.getByRole("button", { name: "Close ×", exact: true }).press("Tab");
        assert(await page.evaluate(() => document.querySelector("dialog").contains(document.activeElement)), "Focus must stay in dialog");
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("dialog").isVisible(), false);
        assert(await expand.evaluate(node => node === document.activeElement), "Focus must return to Expand");
        assert.equal(await figure.locator("svg").count(), 1);
      }
      await page.screenshot({ path: path.join(out, route.split("/").filter(Boolean).pop() + ".png"), fullPage: true });
      const tag = page.locator(".tag").first();
      assert.equal(await tag.evaluate(node => getComputedStyle(node).borderWidth), "0px");
    }

    await page.goto(base + "/projects/bin2shell/");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const copy = page.getByRole("button", { name: "Copy code", exact: true }).first();
    await copy.click();
    assert((await page.evaluate(() => navigator.clipboard.readText())).includes("bin2shell"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/usable-security-phishing-simulations/");
    assert.equal(await page.locator(".toc").getAttribute("open"), null);
    const mobileFigure = page.locator("figure.diagram").first();
    await mobileFigure.scrollIntoViewIfNeeded();
    await mobileFigure.locator("svg").waitFor({ timeout: 45000 });
    await page.screenshot({ path: path.join(out, "diagram-mobile.png"), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);

    const blocked = await browser.newContext();
    await blocked.route("**/mermaid.tiny.js", route => route.abort());
    const fallback = await blocked.newPage();
    await fallback.goto(base + "/usable-security-phishing-simulations/");
    await fallback.locator("figure.diagram").first().scrollIntoViewIfNeeded();
    await fallback.getByText("The diagram could not load. Its description and source are available below.").first().waitFor();
    assert(await fallback.locator(".diagram-source").first().getAttribute("open") !== null);
    await blocked.close();

    const noStorage = await browser.newContext();
    await noStorage.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } }); });
    const storagePage = await noStorage.newPage();
    storagePage.on("pageerror", error => errors.push(error.message));
    await storagePage.goto(base + "/");
    assert.equal(await storagePage.locator("html").getAttribute("data-theme"), "dark");
    await noStorage.close();

    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await noJS.newPage();
    await staticPage.goto(base + "/");
    assert.equal(await staticPage.locator(".project-card h3 a").count(), 3);
    await staticPage.goto(base + "/projects/bin2shell/");
    assert(await staticPage.locator("pre.mermaid").isVisible());
    assert.equal(await staticPage.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await noJS.close();
    assert.deepEqual(errors, [], "Browser errors");
    console.log("Passed: 12 routes at 3 widths; seeded artwork identity, variation, Unicode, motion and links; fixed dark appearance; sharp corners; unframed tags; search; diagrams; modal focus/zoom; copying; no-JS, storage and CDN fallbacks.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
