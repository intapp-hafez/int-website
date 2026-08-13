import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Bug, X, ShieldQuestion, Check, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { demoUsers } from "@/data/demo";
import { ADMIN_PAGES, PERM_ACTIONS, resolveAdminPage, useCanAccess } from "@/lib/permissions-store";
import { useAccessRequests } from "@/lib/access-requests";

/**
 * Floating developer/admin helper: shows which permission key the current
 * admin route resolves to and what the signed-in user may do there, plus a
 * shortcut to request the missing actions.
 */
export function PermissionsDebugPanel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const resolved = resolveAdminPage(pathname);
  const pageKey = resolved?.pageKey ?? "__unknown__";
  const perms = useCanAccess(pageKey);
  const { createRequest } = useAccessRequests();
  const [open, setOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [wanted, setWanted] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  if (!user || !resolved) return null;

  const page = ADMIN_PAGES.find((p) => p.key === pageKey);
  const pageLabel = page ? (ar ? page.ar : page.en) : ar ? "غير معروف" : "Unknown";
  const matched = demoUsers.find((u) => u.email.toLowerCase() === user.email.toLowerCase());

  const submit = () => {
    if (wanted.length === 0) {
      toast.error(ar ? "اختر إجراءً واحدًا على الأقل" : "Pick at least one action");
      return;
    }
    createRequest({
      userId: matched?.id ?? user.email,
      userName: user.name || user.email,
      userEmail: user.email,
      pageKey,
      actions: wanted,
      reason: reason.trim(),
    });
    setAskOpen(false);
    setWanted([]);
    setReason("");
    toast.success(ar ? "تم إرسال طلب الصلاحية" : "Access request sent", {
      description: ar ? "سيراجعه المشرف من قائمة الطلبات." : "A manager will review it from the approvals queue.",
    });
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-4 end-4 z-50 w-[300px] rounded-xl border bg-card shadow-lg p-4 text-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-semibold inline-flex items-center gap-2">
              <Bug className="h-4 w-4 text-accent" />
              {ar ? "فحص الصلاحيات" : "Permissions debug"}
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)} aria-label={ar ? "إغلاق" : "Close"}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{ar ? "المسار" : "Route"}</dt>
              <dd className="font-mono truncate max-w-[170px]" title={pathname}>{pathname}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{ar ? "المفتاح" : "Permission key"}</dt>
              <dd className="font-mono">{pageKey}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{ar ? "الصفحة" : "Page"}</dt>
              <dd>{pageLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{ar ? "الإجراء المطلوب" : "Required action"}</dt>
              <dd className="font-mono">{resolved.action}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{ar ? "الدور" : "Role"}</dt>
              <dd>{user.role}</dd>
            </div>
          </dl>
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">{ar ? "الإجراءات المتاحة" : "Allowed actions"}</div>
            <div className="flex flex-wrap gap-1.5">
              {PERM_ACTIONS.map((a) => (
                <Badge key={a} variant={perms[a] ? "default" : "outline"} className="gap-1 font-mono text-[11px]">
                  {perms[a] ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={() => {
              setWanted(PERM_ACTIONS.filter((a) => !perms[a]));
              setAskOpen(true);
            }}
          >
            <ShieldQuestion className="h-4 w-4 me-1" />
            {ar ? "طلب صلاحية" : "Request access"}
          </Button>
        </div>
      ) : (
        <Button
          size="icon"
          variant="secondary"
          className="fixed bottom-4 end-4 z-50 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
          aria-label={ar ? "فحص الصلاحيات" : "Permissions debug"}
        >
          <Bug className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ar ? "طلب صلاحية وصول" : "Request access"}</DialogTitle>
            <DialogDescription>
              {ar ? `الصفحة: ${pageLabel} (${pageKey})` : `Section: ${pageLabel} (${pageKey})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {PERM_ACTIONS.map((a) => (
                <label key={a} className="inline-flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={wanted.includes(a)}
                    onCheckedChange={(v) =>
                      setWanted((prev) => (v ? [...new Set([...prev, a])] : prev.filter((x) => x !== a)))
                    }
                  />
                  <span className="font-mono">{a}</span>
                </label>
              ))}
            </div>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={ar ? "سبب الطلب (اختياري)" : "Why do you need this? (optional)"}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={submit}>{ar ? "إرسال الطلب" : "Send request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}