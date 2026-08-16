import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Check, X, Clock, ShieldOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAdminT } from "@/lib/admin-i18n";
import { ADMIN_PAGES, PERM_ACTIONS, usePermissions, type PermAction } from "@/lib/permissions-store";
import { useAccessRequests, type AccessRequestStatus } from "@/lib/access-requests";

const STATUS_STYLE: Record<AccessRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  denied: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
  revoked: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
};

/** Selectable grant durations, in days. `0` means permanent. */
const DURATIONS: Array<{ days: number; en: string; ar: string }> = [
  { days: 1, en: "1 day", ar: "يوم واحد" },
  { days: 7, en: "7 days", ar: "٧ أيام" },
  { days: 30, en: "30 days", ar: "٣٠ يومًا" },
  { days: 90, en: "90 days", ar: "٩٠ يومًا" },
  { days: 0, en: "Permanent", ar: "دائم" },
];

/** Approval queue for admin-section access requests. Managers and admins only. */
export function AccessRequestQueue() {
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const { user } = useAuth();
  const { requests, decide } = useAccessRequests();
  const { grants, grantAccess, revokeGrant } = usePermissions();
  const [showAll, setShowAll] = useState(false);
  const [durations, setDurations] = useState<Record<string, string>>({});

  const canApprove = user?.role === "admin" || user?.role === "manager";
  if (!canApprove) return null;

  const pending = requests.filter((r) => r.status === "pending");
  const visible = showAll ? requests : pending;
  const label = (key: string) => {
    const p = ADMIN_PAGES.find((x) => x.key === key);
    return p ? (ar ? p.ar : p.en) : key;
  };

  const approve = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const days = Number(durations[id] ?? "7");
    // Granting any action implies being able to open the page.
    const actions = Array.from(
      new Set<PermAction>(["view", ...PERM_ACTIONS.filter((a) => req.actions.includes(a))]),
    );
    const grant = await grantAccess({
      userId: req.userId,
      pageKey: req.pageKey,
      actions,
      days: days > 0 ? days : null,
      grantedBy: user?.name || user?.email || "manager",
      requestId: id,
    });
    await decide(id, "approved", user?.name || user?.email || "manager", undefined, grant?.expiresAt);
    toast.success(
      grant?.expiresAt
        ? ar
          ? `تمت الموافقة حتى ${new Date(grant.expiresAt).toLocaleString("ar-EG")}`
          : `Approved until ${new Date(grant.expiresAt).toLocaleString("en-GB")}`
        : ar
          ? "تمت الموافقة ومنح صلاحية دائمة"
          : "Approved with permanent access",
    );
  };

  const deny = async (id: string) => {
    await decide(id, "denied", user?.name || user?.email || "manager");
    toast.success(ar ? "تم رفض الطلب" : "Request denied");
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 flex-wrap">
        <CardTitle className="font-display text-base inline-flex items-center gap-2">
          <Inbox className="h-4 w-4 text-accent" />
          {ar ? "طلبات الصلاحيات" : "Access requests"}
          <Badge variant="outline">{pending.length} {ar ? "قيد الانتظار" : "pending"}</Badge>
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowAll((v) => !v)}>
          {showAll ? (ar ? "قيد الانتظار فقط" : "Pending only") : (ar ? "عرض الكل" : "Show all")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {ar ? "لا توجد طلبات." : "No requests."}
          </p>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="border rounded-lg p-3 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {r.userName} <span className="text-muted-foreground font-normal">· {r.userEmail}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {label(r.pageKey)} <span className="font-mono">({r.pageKey})</span> ·{" "}
                  {r.actions.map((a) => (
                    <Badge key={a} variant="outline" className="me-1 font-mono text-[10px]">{a}</Badge>
                  ))}
                </div>
                {r.reason && <p className="text-xs mt-1 max-w-xl">{r.reason}</p>}
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(r.createdAt).toLocaleString(ar ? "ar-EG" : "en-GB")}
                  {r.decidedBy ? ` · ${ar ? "بواسطة" : "by"} ${r.decidedBy}` : ""}
                </div>
                {r.status === "approved" && (
                  <div className="text-[11px] mt-1 inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {r.expiresAt
                      ? `${ar ? "ينتهي" : "Expires"} ${new Date(r.expiresAt).toLocaleString(ar ? "ar-EG" : "en-GB")}`
                      : ar
                        ? "صلاحية دائمة"
                        : "Permanent access"}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_STYLE[r.status]}>
                  {r.status === "pending" ? (ar ? "قيد الانتظار" : "Pending")
                    : r.status === "approved" ? (ar ? "مقبول" : "Approved")
                    : (ar ? "مرفوض" : "Denied")}
                </Badge>
                {r.status === "pending" && (
                  <>
                    <Select
                      value={durations[r.id] ?? "7"}
                      onValueChange={(v) => setDurations((p) => ({ ...p, [r.id]: v }))}
                    >
                      <SelectTrigger className="h-9 w-[130px]" aria-label={ar ? "مدة الصلاحية" : "Grant duration"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => (
                          <SelectItem key={d.days} value={String(d.days)}>
                            {ar ? d.ar : d.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => deny(r.id)}>
                      <X className="h-4 w-4 me-1" />{ar ? "رفض" : "Deny"}
                    </Button>
                    <Button size="sm" onClick={() => approve(r.id)}>
                      <Check className="h-4 w-4 me-1" />{ar ? "موافقة" : "Approve"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}

        {grants.length > 0 && (
          <div className="pt-4 mt-2 border-t space-y-2">
            <div className="text-sm font-medium">{ar ? "الصلاحيات المؤقتة النشطة" : "Active grants"}</div>
            {grants.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 text-xs border rounded-lg px-3 py-2 flex-wrap">
                <div className="min-w-0">
                  <span className="font-medium">{label(g.pageKey)}</span>{" "}
                  <span className="font-mono text-muted-foreground">{g.userId}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {g.actions.map((a) => (
                      <Badge key={a} variant="outline" className="font-mono text-[10px]">{a}</Badge>
                    ))}
                    <span className="text-muted-foreground ms-1 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {g.expiresAt
                        ? `${ar ? "ينتهي" : "expires"} ${new Date(g.expiresAt).toLocaleString(ar ? "ar-EG" : "en-GB")}`
                        : ar ? "دائم" : "permanent"}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { void revokeGrant(g.id); toast.success(ar ? "تم سحب الصلاحية" : "Grant revoked"); }}>
                  <ShieldOff className="h-4 w-4 me-1" />{ar ? "سحب" : "Revoke"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}