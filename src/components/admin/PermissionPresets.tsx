import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Layers, Pencil, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { demoUsers } from "@/data/demo";
import { useAdminT } from "@/lib/admin-i18n";
import {
  ADMIN_PAGES,
  PERM_ACTIONS,
  usePermissions,
  noPerms,
  type UserPerms,
  type PermAction,
  type PermPreset,
} from "@/lib/permissions-store";

const ROLE_BADGE_STYLE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  agent: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  seo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  technician: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
};

const ROLE_DISPLAY: Record<string, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مدير" },
  manager: { en: "Manager", ar: "مشرف" },
  agent: { en: "Agent", ar: "موظف" },
  seo: { en: "SEO Specialist", ar: "مسؤول SEO" },
  technician: { en: "Technician", ar: "فني تقني" },
};

function presetSummary(p: PermPreset) {
  return ADMIN_PAGES.reduce(
    (sum, page) => sum + PERM_ACTIONS.filter((a) => p.perms[page.key]?.[a]).length,
    0,
  );
}

export function PermissionPresets({ activeUserId }: { activeUserId?: string }) {
  const { lang } = useAdminT();
  const { presets, applyPreset, saveCustomPreset, updateCustomPreset, duplicatePreset, deleteCustomPreset } =
    usePermissions();

  const [selectedPreset, setSelectedPreset] = useState<string>(presets[0]?.id ?? "");
  const [targetUsers, setTargetUsers] = useState<string[]>(activeUserId ? [activeUserId] : []);
  const [openApply, setOpenApply] = useState(false);
  const [openSave, setOpenSave] = useState(false);
  const [presetNameEn, setPresetNameEn] = useState("");
  const [presetNameAr, setPresetNameAr] = useState("");

  const [editing, setEditing] = useState<PermPreset | null>(null);
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editPerms, setEditPerms] = useState<UserPerms>({});

  const ACTION_LABEL: Record<PermAction, { en: string; ar: string }> = {
    view: { en: "View", ar: "عرض" },
    add: { en: "Add", ar: "إضافة" },
    edit: { en: "Edit", ar: "تعديل" },
    delete: { en: "Delete", ar: "حذف" },
  };

  const openEditor = (p: PermPreset) => {
    const cloned: UserPerms = {};
    for (const page of ADMIN_PAGES) cloned[page.key] = { ...(p.perms[page.key] ?? noPerms()) };
    setEditing(p);
    setEditPerms(cloned);
    setEditNameEn(p.builtin ? `${p.name.en} (copy)` : p.name.en);
    setEditNameAr(p.builtin ? `${p.name.ar} (نسخة)` : p.name.ar);
  };

  const togglePerm = (pageKey: string, action: PermAction) =>
    setEditPerms((prev) => ({
      ...prev,
      [pageKey]: { ...(prev[pageKey] ?? noPerms()), [action]: !prev[pageKey]?.[action] },
    }));

  const setRow = (pageKey: string, value: boolean) =>
    setEditPerms((prev) => ({
      ...prev,
      [pageKey]: { view: value, add: value, edit: value, delete: value },
    }));

  const onSaveEdit = () => {
    if (!editing) return;
    if (editing.builtin) {
      const created = duplicatePreset(editing.id, { en: editNameEn, ar: editNameAr }, editPerms);
      if (!created) {
        toast.error(lang === "ar" ? "أدخل اسمًا صالحًا" : "Enter a valid name");
        return;
      }
      toast.success(lang === "ar" ? "تم إنشاء نسخة قابلة للتعديل" : "Editable copy created");
    } else {
      const ok = updateCustomPreset(editing.id, { name: { en: editNameEn, ar: editNameAr }, perms: editPerms });
      if (!ok) {
        toast.error(lang === "ar" ? "تعذّر حفظ القالب" : "Could not save preset");
        return;
      }
      toast.success(lang === "ar" ? "تم تحديث القالب" : "Preset updated");
    }
    setEditing(null);
  };

  const total = ADMIN_PAGES.length * PERM_ACTIONS.length;
  const eligible = demoUsers.filter((u) => u.role !== "admin");

  const toggleUser = (id: string) =>
    setTargetUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onApply = () => {
    const preset = presets.find((p) => p.id === selectedPreset);
    if (!preset) return;
    const n = applyPreset(preset.id, targetUsers);
    if (n === 0) {
      toast.error(lang === "ar" ? "اختر مستخدمًا واحدًا على الأقل" : "Pick at least one user");
      return;
    }
    toast.success(
      lang === "ar"
        ? `تم تطبيق «${preset.name.ar}» على ${n} مستخدم`
        : `Applied "${preset.name.en}" to ${n} user${n === 1 ? "" : "s"}`,
    );
    setOpenApply(false);
  };

  const onSavePreset = () => {
    if (!activeUserId) return;
    const created = saveCustomPreset({ en: presetNameEn, ar: presetNameAr }, activeUserId);
    if (!created) {
      toast.error(lang === "ar" ? "أدخل اسمًا صالحًا" : "Enter a valid name");
      return;
    }
    toast.success(lang === "ar" ? "تم حفظ القالب" : "Preset saved");
    setPresetNameEn("");
    setPresetNameAr("");
    setOpenSave(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 flex-wrap">
        <div>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            {lang === "ar" ? "قوالب الصلاحيات" : "Permission presets"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            {lang === "ar"
              ? "طبّق مجموعة صلاحيات جاهزة على عدة مستخدمين بضغطة واحدة، أو احفظ صلاحيات المستخدم الحالي كقالب جديد."
              : "Apply a ready-made permission set to many users at once, or save the current user's permissions as a new preset."}
          </p>
        </div>
        <Dialog open={openSave} onOpenChange={setOpenSave}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!activeUserId}>
              <Sparkles className="h-4 w-4 me-1" />
              {lang === "ar" ? "احفظ كقالب" : "Save as preset"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {lang === "ar" ? "حفظ الصلاحيات الحالية كقالب" : "Save current permissions as preset"}
              </DialogTitle>
              <DialogDescription>
                {lang === "ar"
                  ? "ستُحفظ صلاحيات هذا المستخدم وتصبح متاحة للتطبيق على غيره."
                  : "This user's permissions will be captured and become available to apply to others."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="preset-en">{lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                <Input id="preset-en" value={presetNameEn} onChange={(e) => setPresetNameEn(e.target.value)} placeholder="e.g. Sales lead" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="preset-ar">{lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input id="preset-ar" value={presetNameAr} onChange={(e) => setPresetNameAr(e.target.value)} placeholder="مثلاً: مسؤول مبيعات" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenSave(false)}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={onSavePreset}>{lang === "ar" ? "حفظ" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => {
            const granted = presetSummary(p);
            return (
              <div
                key={p.id}
                className="rounded-md border p-3 flex flex-col gap-2 bg-card hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {lang === "ar" ? p.name.ar : p.name.en}
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {lang === "ar" ? p.description.ar : p.description.en}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-accent"
                      onClick={() => openEditor(p)}
                      aria-label={p.builtin ? "Duplicate and edit preset" : "Edit preset"}
                      title={
                        p.builtin
                          ? lang === "ar"
                            ? "نسخ وتعديل"
                            : "Duplicate & edit"
                          : lang === "ar"
                            ? "تعديل"
                            : "Edit"
                      }
                    >
                      {p.builtin ? <Copy className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    </Button>
                    {p.builtin ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {lang === "ar" ? "مدمج" : "Built-in"}
                      </Badge>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          deleteCustomPreset(p.id);
                          toast.success(lang === "ar" ? "تم حذف القالب" : "Preset deleted");
                        }}
                        aria-label="Delete preset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {granted}/{total} {lang === "ar" ? "إجراء" : "actions"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedPreset(p.id);
                      setTargetUsers(activeUserId ? [activeUserId] : []);
                      setOpenApply(true);
                    }}
                  >
                    <Users className="h-3.5 w-3.5 me-1" />
                    {lang === "ar" ? "تطبيق" : "Apply"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Dialog open={openApply} onOpenChange={setOpenApply}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {lang === "ar" ? "تطبيق القالب على المستخدمين" : "Apply preset to users"}
              </DialogTitle>
              <DialogDescription>
                {lang === "ar"
                  ? "سيتم استبدال صلاحيات المستخدمين المحددين بصلاحيات القالب."
                  : "Selected users' permissions will be replaced by the preset's permissions."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">{lang === "ar" ? "القالب" : "Preset"}</Label>
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {lang === "ar" ? p.name.ar : p.name.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {lang === "ar" ? "المستخدمون" : "Users"} ({targetUsers.length}/{eligible.length})
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setTargetUsers(eligible.map((u) => u.id))}
                    >
                      {lang === "ar" ? "الكل" : "Select all"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setTargetUsers([])}
                    >
                      {lang === "ar" ? "مسح" : "Clear"}
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
                  {eligible.map((u) => {
                    const checked = targetUsers.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleUser(u.id)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${ROLE_BADGE_STYLE[u.role] ?? ""}`}>
                          {lang === "ar" ? ROLE_DISPLAY[u.role]?.ar ?? u.role : ROLE_DISPLAY[u.role]?.en ?? u.role}
                        </Badge>
                      </label>
                    );
                  })}
                  {eligible.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {lang === "ar" ? "لا يوجد مستخدمون قابلون للتعديل." : "No eligible users."}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar"
                    ? "ملاحظة: المدراء يحصلون على الوصول الكامل تلقائيًا ولا يظهرون هنا."
                    : "Note: admin-role users always have full access and are excluded from this list."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenApply(false)}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={onApply} disabled={targetUsers.length === 0}>
                {lang === "ar" ? "تطبيق" : "Apply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}