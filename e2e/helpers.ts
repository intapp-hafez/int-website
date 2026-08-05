import type { Page, Route } from "@playwright/test";

/** TanStack server-function calls all go through this path prefix. */
export const SERVER_FN_GLOB = "**/_serverFn/**";

export type LeadStub =
  | { ok: true; id?: string }
  | { ok: false; status?: number; message: string };

/**
 * Intercepts the submitCartLead server function so tests are deterministic
 * and never write to the real database.
 */
export async function stubLeadSubmit(page: Page, next: () => LeadStub) {
  await page.route(SERVER_FN_GLOB, async (route: Route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const stub = next();
    if (stub.ok) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { id: stub.id ?? "11111111-2222-3333-4444-555555555555" } }),
      });
    }
    return route.fulfill({
      status: stub.status ?? 400,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: stub.message }, message: stub.message }),
    });
  });
}

/** Clears the localStorage cooldown/failure state between tests. */
export async function clearCooldown(page: Page) {
  await page.evaluate(() => window.localStorage.removeItem("rp_submit_failures_v1"));
}

export async function fillProposalForm(
  page: Page,
  opts: { name?: string; email?: string; message?: string } = {},
) {
  await page.getByLabel(/Full name/i).fill(opts.name ?? "Jane Tester");
  await page.getByLabel(/^Email/i).fill(opts.email ?? "jane@example.com");
  if (opts.message !== undefined) {
    await page.getByLabel(/How can we help/i).fill(opts.message);
  }
}

/** Fills the hidden honeypot input the way a naive bot would. */
export async function fillHoneypot(page: Page, value = "http://spam.example") {
  await page.locator("#rp-website").fill(value, { force: true });
}

/**
 * Clicks until the dialog actually opens. The page is server-rendered, so a
 * click that lands before React hydration attaches the onClick handler is
 * silently swallowed — retrying is what makes the opener reliable.
 */
async function clickUntilDialog(click: () => Promise<void>, page: Page) {
  const dialog = page.getByRole("dialog");
  for (let attempt = 0; attempt < 10; attempt++) {
    await click();
    try {
      await dialog.waitFor({ state: "visible", timeout: 1500 });
      return;
    } catch {
      /* not hydrated yet — try again */
    }
  }
  await dialog.waitFor({ state: "visible", timeout: 5000 });
}

export async function openDesktopDialog(page: Page) {
  // Target the header CTA explicitly: the mobile sticky bar renders a
  // same-named button in the DOM (hidden at desktop widths), so a generic
  // role lookup can resolve to the hidden one and time out.
  const btn = page.getByTestId("header-request-proposal");
  await btn.waitFor({ state: "visible" });
  await clickUntilDialog(() => btn.click(), page);
}

export async function openMobileDialog(page: Page) {
  // The sticky bar only appears after scrolling past ~40% of the viewport.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  const bar = page.getByRole("region", { name: /Quick actions/i });
  await bar.waitFor({ state: "visible" });
  const btn = bar.getByRole("button", { name: /Request Proposal/i });
  await clickUntilDialog(() => btn.click(), page);
}