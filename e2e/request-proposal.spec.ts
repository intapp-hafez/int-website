import { test, expect } from "@playwright/test";
import {
  clearCooldown,
  fillHoneypot,
  fillProposalForm,
  openDesktopDialog,
  openMobileDialog,
  stubLeadSubmit,
} from "./helpers";

const entrypoints = [
  { name: "desktop header CTA", open: openDesktopDialog, projects: ["desktop"] },
  { name: "mobile sticky CTA", open: openMobileDialog, projects: ["mobile"] },
] as const;

for (const entry of entrypoints) {
  test.describe(`Request Proposal — ${entry.name}`, () => {
    test.beforeEach(({}, testInfo) => {
      test.skip(
        !entry.projects.includes(testInfo.project.name as never),
        `only runs on ${entry.projects.join(", ")}`,
      );
    });

    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await clearCooldown(page);
    });

    test("client-side validation blocks empty submits", async ({ page }) => {
      await entry.open(page);
      await page.getByRole("button", { name: /Send request/i }).click();
      await expect(page.getByText(/Please enter your name/i)).toBeVisible();
      await expect(page.getByText(/Please enter a valid email/i)).toBeVisible();
    });

    test("server rejects submissions that fill the honeypot", async ({ page }) => {
      await entry.open(page);
      await fillProposalForm(page);
      await fillHoneypot(page);
      // Wait out the 1.5s minimum-elapsed anti-spam window so the honeypot,
      // not the timing check, is what rejects the submission.
      await page.waitForTimeout(2000);
      await page.getByRole("button", { name: /Send request/i }).click();
      await expect(page.getByText(/Spam detected|blocked|Failed to submit/i).first()).toBeVisible();
      await expect(page.getByText(/Your tracking ID/i)).toHaveCount(0);
    });

    test("server rejects submissions completed faster than a human could", async ({ page }) => {
      await entry.open(page);
      await fillProposalForm(page);
      // No delay: the form is submitted well under the 1.5s threshold.
      await page.getByRole("button", { name: /Send request/i }).click();
      await expect(
        page.getByText(/take a moment before submitting|Failed to submit/i).first(),
      ).toBeVisible();
      await expect(page.getByText(/Your tracking ID/i)).toHaveCount(0);
    });

    test("three consecutive failures trigger the guided cooldown", async ({ page }) => {
      await stubLeadSubmit(page, () => ({ ok: false, message: "Server unavailable" }));
      await entry.open(page);
      await fillProposalForm(page);

      const send = page.getByRole("button", { name: /Send request/i });
      for (let i = 0; i < 3; i++) {
        await send.click();
        await expect(send).toBeEnabled({ timeout: 15_000 }).catch(() => {});
      }

      await expect(page.getByRole("alert")).toContainText(/Too many failed attempts/i);
      await expect(page.getByRole("button", { name: /Wait \d+s/i })).toBeDisabled();

      // Cooldown persists across reopening the dialog.
      const state = await page.evaluate(() =>
        JSON.parse(window.localStorage.getItem("rp_submit_failures_v1") ?? "{}"),
      );
      expect(state.cooldownUntil).toBeGreaterThan(Date.now());
    });

    test("successful submission shows the tracking ID and clears failures", async ({ page }) => {
      await page.evaluate(() =>
        window.localStorage.setItem(
          "rp_submit_failures_v1",
          JSON.stringify({ failures: [Date.now()], cooldownUntil: 0 }),
        ),
      );
      await stubLeadSubmit(page, () => ({ ok: true, id: "abcdef12-3456-7890-abcd-ef1234567890" }));
      await entry.open(page);
      await fillProposalForm(page, { message: "We need managed IT support." });
      await page.waitForTimeout(2000);
      await page.getByRole("button", { name: /Send request/i }).click();

      await expect(page.getByText(/we'll be in touch/i)).toBeVisible();
      await expect(page.getByText(/Your tracking ID/i)).toBeVisible();
      await expect(page.getByText("ABCDEF12")).toBeVisible();
      await expect(page.getByRole("link", { name: /Track request/i })).toBeVisible();

      const state = await page.evaluate(() =>
        JSON.parse(window.localStorage.getItem("rp_submit_failures_v1") ?? "{}"),
      );
      expect(state.failures).toEqual([]);
      expect(state.cooldownUntil).toBe(0);
    });
  });
}