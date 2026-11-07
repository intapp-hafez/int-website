import { describe, it, expect, vi } from "vitest";
import { deliverSiteEmail } from "./site-email.server";
import { renderConfirmationEmail } from "./career-email.server";
import { renderRegistrationReceived, renderRegistrationApproved } from "./training-email.server";

describe("Email Delivery & Templates", () => {
  describe("deliverSiteEmail validation", () => {
    it("rejects invalid recipient email formats without network calls", async () => {
      const resEmpty = await deliverSiteEmail("", "Test Subject", "<p>Hi</p>", "Hi");
      expect(resEmpty.sent).toBe(false);
      expect(resEmpty.reason).toBe("invalid_recipient");

      const resNoAt = await deliverSiteEmail("invalid-email-address", "Test Subject", "<p>Hi</p>", "Hi");
      expect(resNoAt.sent).toBe(false);
      expect(resNoAt.reason).toBe("invalid_recipient");
    });
  });

  describe("Career Confirmation Email Template", () => {
    it("renders valid bilingual content with reference number and tracking link", () => {
      const email = renderConfirmationEmail({
        ref: "IT-2026-9876",
        fullName: "Sarah Johnson",
        email: "sarah@example.com",
        jobTitleEn: "Senior Network Engineer",
        jobTitleAr: "مهندس شبكات أول",
        trackUrl: "https://integratedtechnics.com/track-application?ref=IT-2026-9876",
        status: "new",
      });

      expect(email.subject).toContain("IT-2026-9876");
      expect(email.subject).toContain("تم استلام طلبك");
      expect(email.html).toContain("Sarah Johnson");
      expect(email.html).toContain("Senior Network Engineer");
      expect(email.html).toContain("مهندس شبكات أول");
      expect(email.html).toContain("IT-2026-9876");
      expect(email.text).toContain("IT-2026-9876");
    });

    it("escapes special characters to prevent HTML injection in emails", () => {
      const email = renderConfirmationEmail({
        ref: "REF<123>",
        fullName: "Hacker <script>alert(1)</script>",
        email: "test@example.com",
        jobTitleEn: "Dev & Test",
        jobTitleAr: "مطور & فاحص",
        trackUrl: "https://example.com/track",
        status: "new",
      });

      expect(email.html).not.toContain("<script>");
      expect(email.html).toContain("&lt;script&gt;");
      expect(email.html).toContain("Dev &amp; Test");
    });
  });

  describe("Training Email Templates", () => {
    it("renders registration received confirmation with training facts", () => {
      const email = renderRegistrationReceived({
        fullName: "Ahmed Ali",
        titleEn: "Cisco Enterprise Routing",
        titleAr: "توجيه الشبكات المؤسسية سيسكو",
        trainer: "Eng. Tarek",
        location: "Cairo Training Center",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
      });

      expect(email.subject).toContain("Registration confirmed");
      expect(email.subject).toContain("تم تأكيد تسجيلك");
      expect(email.html).toContain("Ahmed Ali");
      expect(email.html).toContain("Cisco Enterprise Routing");
      expect(email.html).toContain("Cairo Training Center");
      expect(email.html).toContain("Eng. Tarek");
    });

    it("renders approved registration email correctly", () => {
      const email = renderRegistrationApproved({
        fullName: "Fatima Omar",
        titleEn: "BMS Systems Integration",
        titleAr: "تكامل أنظمة إدارة المباني",
        trainer: "Eng. Maged",
        location: "Online Workshop",
        startDate: "2026-11-20",
        endDate: "2026-11-22",
      });

      expect(email.html).toContain("Fatima Omar");
      expect(email.html).toContain("BMS Systems Integration");
      expect(email.html).toContain("تم تأكيد مقعدك");
    });
  });
});

