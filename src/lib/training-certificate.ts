import logoUrl from "@/assets/logo.png";

export type CertificateInput = {
  learnerName: string;
  titleEn: string;
  titleAr: string;
  trainer: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  certificateNo: string;
};

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=block";

function ensureFonts() {
  if (typeof document === "undefined" || document.getElementById("certificate-fonts")) return;
  const link = document.createElement("link");
  link.id = "certificate-fonts";
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

async function waitForFonts() {
  ensureFonts();
  const fonts = (document as any).fonts;
  if (!fonts?.load) return;
  try {
    await Promise.all([600, 700, 800].flatMap((w) => [fonts.load(`${w} 32px Cairo`), fonts.load(`${w} 32px Inter`)]));
    await fonts.ready;
  } catch {
    /* fall back to system fonts */
  }
}

function fmt(d: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}

function period(i: CertificateInput) {
  if (!i.startDate) return "";
  return i.endDate && i.endDate !== i.startDate ? `${fmt(i.startDate)} – ${fmt(i.endDate)}` : fmt(i.startDate);
}

function markup(i: CertificateInput) {
  const dates = period(i);
  return `
  <div style="position:relative;width:1123px;height:794px;background:#ffffff;font-family:Inter,Cairo,Segoe UI,Arial,sans-serif;color:#0f172a;box-sizing:border-box;">
    <div style="position:absolute;inset:0;border:14px solid #0f172a;"></div>
    <div style="position:absolute;inset:22px;border:2px solid #c9a227;"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:120px;background:linear-gradient(90deg,#0f172a 0%,#1e293b 60%,#0f172a 100%);display:flex;align-items:center;justify-content:space-between;padding:0 56px;box-sizing:border-box;">
      <img src="${logoUrl}" alt="" style="height:52px;object-fit:contain;filter:brightness(0) invert(1)" />
      <div style="color:#e2e8f0;text-align:right;font-size:13px;letter-spacing:.18em;text-transform:uppercase">Integrated Technics<br/><span style="color:#c9a227">Certificate of Attendance</span></div>
    </div>

    <div style="position:absolute;top:170px;left:0;right:0;text-align:center;padding:0 90px;box-sizing:border-box;">
      <div style="font-size:15px;letter-spacing:.34em;color:#64748b;text-transform:uppercase">Certificate of Attendance</div>
      <div style="font-family:Cairo,Inter,sans-serif;font-size:20px;color:#64748b;margin-top:6px;direction:rtl">شهادة حضور</div>
      <div style="height:2px;width:120px;background:#c9a227;margin:22px auto"></div>
      <div style="font-size:15px;color:#475569">This is to certify that</div>
      <div style="font-size:46px;font-weight:800;margin:14px 0 6px">${escapeHtml(i.learnerName)}</div>
      <div style="font-size:15px;color:#475569;line-height:1.7">has successfully attended and completed the training program</div>
      <div style="font-size:26px;font-weight:700;margin-top:10px">${escapeHtml(i.titleEn || i.titleAr)}</div>
      ${i.titleAr ? `<div style="font-family:Cairo,sans-serif;font-size:20px;color:#334155;direction:rtl;margin-top:4px">${escapeHtml(i.titleAr)}</div>` : ""}
      ${dates ? `<div style="font-size:14px;color:#64748b;margin-top:14px">${escapeHtml(dates)}${i.location ? ` &middot; ${escapeHtml(i.location)}` : ""}</div>` : ""}
    </div>

    <div style="position:absolute;bottom:86px;left:90px;right:90px;display:flex;justify-content:space-between;align-items:flex-end;font-size:13px;color:#475569">
      <div style="text-align:left">
        <div style="height:1px;width:220px;background:#94a3b8;margin-bottom:8px"></div>
        <div style="font-weight:700;color:#0f172a">${escapeHtml(i.trainer || "Training Manager")}</div>
        <div>Trainer</div>
      </div>
      <div style="text-align:center">
        <div style="font-weight:700;color:#0f172a;letter-spacing:.08em">${escapeHtml(i.certificateNo)}</div>
        <div>Certificate No.</div>
      </div>
      <div style="text-align:right">
        <div style="height:1px;width:220px;background:#94a3b8;margin-bottom:8px"></div>
        <div style="font-weight:700;color:#0f172a">${escapeHtml(fmt(i.completedAt) || fmt(new Date().toISOString()))}</div>
        <div>Date of issue</div>
      </div>
    </div>
  </div>`;
}

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/** Renders the certificate offscreen and downloads it as a landscape A4 PDF. */
export async function downloadCertificate(i: CertificateInput) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  await waitForFonts();

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:1123px;background:#fff;z-index:-1";
  host.innerHTML = markup(i);
  document.body.appendChild(host);
  try {
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, w, h);
    const safe = (i.learnerName || "certificate").replace(/[^\w\u0600-\u06FF -]/g, "").trim().replace(/\s+/g, "-");
    pdf.save(`certificate-${safe}-${i.certificateNo}.pdf`);
  } finally {
    host.remove();
  }
}
