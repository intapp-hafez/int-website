import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useAdminT } from "@/lib/admin-i18n";
import { ADMIN_PAGES, PERM_ACTIONS, usePermissions, type PermAction } from "@/lib/permissions-store";
import { useGrantExpiryNotifier, pageLabel } from "@/lib/grant-expiry-notify";
import { Paginator } from "@/components/admin/Paginator";

const PAGE_SIZES = [10, 25, 50];

/** Live countdown label for a grant expiry. */
function countdown(expiresAt: string | null, ar: boolean) {
  if (!expiresAt) return ar ? "دائم" : "Permanent";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return ar ? "منتهية" : "Expired";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return ar ? `${d} يوم ${h} س` : `${d}d ${h}h`;
  if (h > 0) return ar ? `${h} س ${m} د` : `${h}h ${m}m`;
  return ar ? `${m} د` : `${m}m`;
}

type Window = "all" | "24h" | "7d" | "30d" | "permanent";

/** Admin table of active time-limited grants: search, filters, pagination, revoke. */
export function ActiveGrantsTable() {
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const { grants, revokeGrant } = usePermissions();
  useGrantExpiryNotifier(ar);

  const [q, setQ] = useState("");
  const [page, setPage] = useState("all");
  const [action, setAction] = useState("all");
  const [approver, setApprover] = useState("all");
  const [win, setWin] = useState<Window>("all");
  const [pageNum, setPageNum] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const approvers = useMemo(
    () => Array.from(new Set(grants.map((g) => g.grantedBy).filter(Boolean) as string[])),
    [grants],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = Date.now();
    return grants
      .filter((g) => {
        if (page !== "all" && g.pageKey !== page) return false;
        if (action !== "all" && !g.actions.includes(action as PermAction)) return false;
        if (approver !== "all" && (g.grantedBy || "") !== approver) return false;
        if (win !== "all") {
          if (win === "permanent") {
            if (g.expiresAt) return false;
          } else {
            if (!g.expiresAt) return false;
            const left = new Date(g.expiresAt).getTime() - now;
            const max = win === "24h" ? 86_400_000 : win === "7d" ? 7 * 86_400_000 : 30 * 86_400_000;
            if (left > max) return false;
          }
        }
        if (!term) return true;
        return [g.userId, g.pageKey, pageLabel(g.pageKey, ar), g.grantedBy || "", g.note || "", g.actions.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        const av = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const bv = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        return av - bv;
      });
  }, [grants, q, page, action, approver, win, ar]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(pageNum, pageCount);
  const start = (current - 1) * perPage;
  const rows = filtered.slice(start, start + perPage);

  const reset = (fn: () => void) => {
    fn();
    setPageNum(1);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="font-display text-base inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          {ar ? "الصلاحيات المؤقتة النشطة" : "Active grants"}
          <Badge variant="outline">{grants.length}</Badge>
        </CardTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => reset(() => setQ(e.target.value))}
              placeholder={ar ? "بحث بالمستخدم أو الصفحة…" : "Search user, page, note…"}
              className="ps-8"
              aria-label={ar ? "بحث" : "Search grants"}
            />
          </div>
          <Select value={page} onValueChange={(v) => reset(() => setPage(v))}>
            <SelectTrigger aria-label={ar ? "الصفحة" : "Page"}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "كل الصفحات" : "All pages"}</SelectItem>
              {ADMIN_PAGES.map((p) => (
                <SelectItem key={p.key} value={p.key}>{ar ? p.ar : p.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={(v) => reset(() => setAction(v))}>
            <SelectTrigger aria-label={ar ? "الإجراء" : "Action"}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "كل الإجراءات" : "All actions"}</SelectItem>
              {PERM_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={approver} onValueChange={(v) => reset(() => setApprover(v))}>
            <SelectTrigger aria-label={ar ? "المُصدِر" : "Approver"}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "كل المُصدِرين" : "All approvers"}</SelectItem>
              {approvers.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={win} onValueChange={(v) => reset(() => setWin(v as Window))}>
            <SelectTrigger aria-label={ar ? "نافذة الانتهاء" : "Expiration window"}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "أي مدة" : "Any expiry"}</SelectItem>
              <SelectItem value="24h">{ar ? "خلال ٢٤ ساعة" : "Within 24 hours"}</SelectItem>
              <SelectItem value="7d">{ar ? "خلال ٧ أيام" : "Within 7 days"}</SelectItem>
              <SelectItem value="30d">{ar ? "خلال ٣٠ يومًا" : "Within 30 days"}</SelectItem>
              <SelectItem value="permanent">{ar ? "دائمة فقط" : "Permanent only"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {ar ? "لا توجد صلاحيات مطابقة." : "No matching grants."}
          </p>
        ) : (
          rows.map((g) => {
            const soon = g.expiresAt ? new Date(g.expiresAt).getTime() - Date.now() <= 86_400_000 : false;
            return (
              <div key={g.id} className="flex items-center justify-between gap-3 text-xs border rounded-lg px-3 py-2 flex-wrap">
                <div className="min-w-0">
                  <span className="font-medium">{pageLabel(g.pageKey, ar)}</span>{" "}
                  <span className="font-mono text-muted-foreground">{g.userId}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {g.actions.map((a) => (
                      <Badge key={a} variant="outline" className="font-mono text-[10px]">{a}</Badge>
                    ))}
                    <span
                      className={`ms-1 inline-flex items-center gap-1 ${soon ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      <Clock className="h-3 w-3" />
                      {countdown(g.expiresAt, ar)}
                      {g.expiresAt && (
                        <span className="text-muted-foreground">
                          · {new Date(g.expiresAt).toLocaleString(ar ? "ar-EG" : "en-GB")}
                        </span>
                      )}
                    </span>
                    {g.grantedBy && (
                      <span className="text-muted-foreground ms-1">
                        · {ar ? "بواسطة" : "by"} {g.grantedBy}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void revokeGrant(g.id);
                    toast.success(ar ? "تم سحب الصلاحية" : "Grant revoked");
                  }}
                >
                  <ShieldOff className="h-4 w-4 me-1" />{ar ? "سحب" : "Revoke"}
                </Button>
              </div>
            );
          })
        )}

        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">{ar ? "لكل صفحة" : "Per page"}</span>
          <Select value={String(perPage)} onValueChange={(v) => reset(() => setPerPage(Number(v)))}>
            <SelectTrigger className="h-8 w-20" aria-label={ar ? "لكل صفحة" : "Rows per page"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Paginator
          page={current}
          pageCount={pageCount}
          total={total}
          start={start}
          end={Math.min(start + perPage, total)}
          onPageChange={setPageNum}
        />
      </CardContent>
    </Card>
  );
}
