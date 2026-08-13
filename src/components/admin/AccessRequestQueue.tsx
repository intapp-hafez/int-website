import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAdminT } from "@/lib/admin-i18n";
import { ADMIN_PAGES, PERM_ACTIONS, usePermissions, type PermAction } from "@/lib/permissions-store";
import { useAccessRequests, type AccessRequestStatus } from "@/lib/access-requests";

const STATUS_STYLE: Record<AccessRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  denied: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
};

/** Approval queue for admin-section access requests. Managers and admins only. */
export function AccessRequestQueue() {
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const { user } = useAuth();
  const { requests, decide } = useAccessRequests();
  const { setPagePerms } = usePermissions();
  const [showAll, setShowAll] = useState(false);

  const canApprove = user?.role === "admin" || user?.role === "manager";
  if (!canApprove) return null;

  const pending = requests.filter((r) => r.status === "pending");
  const visible = showAll ? requests : pending;
  const label = (key: string) => {
    const p = ADMIN_PAGES.find((x) => x.key === key);
    return p ? (ar ? p.ar : p.en) : key;
  };

  const approve = (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const patch: Partial<Record<PermAction, boolean>> = {};
    for (const a of PERM_ACTIONS) if (req.actions.includes(a)) patch[a] = true;
    // Granting any action implies being able to open the page.
    patch.view = true;
    setPagePerms(req.userId, req.pageKey, patch);
    decide(id, "approved", user?.name || user?.email || "manager");
    toast.success(ar ? "تمت الموافقة ومنح الصلاحية" : "Approved and permissions granted");
  };

  const deny = (id: string) => {
    decide(id, "denied", user?.name || user?.email || "manager");
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
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_STYLE[r.status]}>
                  {r.status === "pending" ? (ar ? "قيد الانتظار" : "Pending")
                    : r.status === "approved" ? (ar ? "مقبول" : "Approved")
                    : (ar ? "مرفوض" : "Denied")}
                </Badge>
                {r.status === "pending" && (
                  <>
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
      </CardContent>
    </Card>
  );
}