import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Tag, Loader2, Mail, Search, Sparkles, RefreshCw, Users, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminT } from "@/lib/admin-i18n";

export const Route = createFileRoute("/dashboard/admin/helpdesk/categories")({
  head: () => ({ meta: [{ title: "Ticket Categories & Assignees — Helpdesk" }] }),
  component: HelpdeskCategoriesPage,
});

export type SupportCategory = {
  id: string;
  value: string;
  name_en: string;
  name_ar: string;
  responsible_emails?: string;
  default_sla_policy_id: string | null;
  sort_order: number;
  active: boolean;
};

type SlaPolicy = {
  id: string;
  name_en: string;
};

const DEFAULT_CATEGORIES_PRESETS: Partial<SupportCategory>[] = [
  {
    value: "cctv",
    name_en: "CCTV & Video Surveillance",
    name_ar: "أنظمة المراقبة والكاميرات CCTV",
    responsible_emails: "cctv.support@integratedtechnics.com, security.team@integratedtechnics.com",
    sort_order: 1,
    active: true,
  },
  {
    value: "access_control",
    name_en: "Access Control & Time Attendance",
    name_ar: "التحكم في الأبواب وبصمة الحضور",
    responsible_emails: "access.control@integratedtechnics.com",
    sort_order: 2,
    active: true,
  },
  {
    value: "fire_alarm",
    name_en: "Fire Alarm & Safety Systems",
    name_ar: "إنذار الحريق وأنظمة السلامة",
    responsible_emails: "fire.safety@integratedtechnics.com",
    sort_order: 3,
    active: true,
  },
  {
    value: "networking",
    name_en: "Network Infrastructure & VoIP",
    name_ar: "البنية التحتية للشبكات والسنترال",
    responsible_emails: "network.ops@integratedtechnics.com, voip.eng@integratedtechnics.com",
    sort_order: 4,
    active: true,
  },
  {
    value: "datacenter",
    name_en: "Data Center & UPS Power",
    name_ar: "غرف الخوادم وأنظمة الطاقة UPS",
    responsible_emails: "datacenter@integratedtechnics.com",
    sort_order: 5,
    active: true,
  },
  {
    value: "sound_av",
    name_en: "Audio Visual & Public Address",
    name_ar: "الأنظمة الصوتية والمرئية والنداء العام",
    responsible_emails: "av.specialist@integratedtechnics.com",
    sort_order: 6,
    active: true,
  },
  {
    value: "maintenance",
    name_en: "General Maintenance & SLA",
    name_ar: "الصيانة الدورية وعقود التشغيل",
    responsible_emails: "maintenance@integratedtechnics.com, helpdesk.manager@integratedtechnics.com",
    sort_order: 7,
    active: true,
  },
];

function HelpdeskCategoriesPage() {
  const _perms = useCurrentPagePerms();
  const { lang, isRtl } = useAdminT();
  const isAr = lang === "ar";

  const [items, setItems] = useState<SupportCategory[]>([]);
  const [slas, setSlas] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<SupportCategory> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, slaRes] = await Promise.all([
        (supabase as any).from("support_categories").select("*").order("sort_order").order("name_en"),
        (supabase as any).from("support_sla_policies").select("id,name_en").order("name_en"),
      ]);

      if (catRes.error) console.warn("[categories] load error:", catRes.error);
      setItems((catRes.data as any[]) ?? []);
      setSlas((slaRes.data as any[]) ?? []);
    } catch (err: any) {
      console.warn("[categories] exception:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    const channel = (supabase as any)
      .channel("support_categories_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_categories" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (it) =>
        it.value.toLowerCase().includes(term) ||
        it.name_en.toLowerCase().includes(term) ||
        it.name_ar.toLowerCase().includes(term) ||
        (it.responsible_emails && it.responsible_emails.toLowerCase().includes(term))
    );
  }, [items, q]);

  const toggleActive = async (cat: SupportCategory, nextActive: boolean) => {
    if (!_perms.edit) return;
    setItems((prev) => prev.map((x) => (x.id === cat.id ? { ...x, active: nextActive } : x)));
    try {
      const { error } = await (supabase as any)
        .from("support_categories")
        .update({ active: nextActive, updated_at: new Date().toISOString() })
        .eq("id", cat.id);
      if (error) throw error;
      toast.success(isAr ? (nextActive ? "تم تفعيل الفئة" : "تم تعطيل الفئة") : (nextActive ? "Category activated" : "Category disabled"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to update category status");
      void load();
    }
  };

  const save = async () => {
    if (!editing) return;
    const payload: any = {
      value: (editing.value || "").trim().toLowerCase().replace(/\s+/g, "_"),
      name_en: editing.name_en?.trim() || "",
      name_ar: editing.name_ar?.trim() || editing.name_en?.trim() || "",
      responsible_emails: editing.responsible_emails?.trim() || "",
      default_sla_policy_id: editing.default_sla_policy_id || null,
      sort_order: Number(editing.sort_order) || 0,
      active: editing.active ?? true,
    };

    if (!payload.value || !payload.name_en) {
      toast.error(isAr ? "يرجى تعبئة المعرّف والاسم بالإنجليزي" : "Value and English name are required");
      return;
    }

    setSaving(true);
    try {
      const q = editing.id
        ? (supabase as any).from("support_categories").update(payload).eq("id", editing.id)
        : (supabase as any).from("support_categories").insert(payload);
      const { error } = await q;
      if (error) throw error;

      toast.success(isAr ? "تم حفظ الفئة بنجاح" : "Category saved successfully");
      setEditing(null);
      void load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!_perms.delete) return;
    if (!confirm(isAr ? `هل تريد حذف فئة "${name}"؟` : `Delete category "${name}"?`)) return;

    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      const { error } = await (supabase as any).from("support_categories").delete().eq("id", id);
      if (error) throw error;
      toast.success(isAr ? "تم حذف الفئة" : "Category deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category");
      void load();
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const { error } = await (supabase as any).from("support_categories").insert(DEFAULT_CATEGORIES_PRESETS);
      if (error) throw error;
      toast.success(isAr ? "تم تحميل الفئات الافتراضية ومسؤوليها بنجاح!" : "Default categories & assignees loaded successfully!");
      void load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to seed categories");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-accent" />
              <span>{isAr ? "فئات التذاكر ومسؤولو الدعم" : "Ticket Categories & Responsible Persons"}</span>
            </h1>
            <Badge variant="secondary" className="text-xs font-mono">
              {items.length} {isAr ? "فئات" : "Categories"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? "إدارة تصنيفات تذاكر الدعم الفني وتعيين عناوين البريد الإلكتروني للمسؤولين والفنيين لكل فئة."
              : "Manage support categories, SLA policies, and assign designated responsible engineers & notification emails."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {items.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={seeding || loading}
              className="text-xs"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" /> : <Sparkles className="h-3.5 w-3.5 text-accent me-1.5" />}
              {isAr ? "تحميل الفئات القياسية" : "Load Standard Categories"}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 me-1.5 ${loading ? "animate-spin" : ""}`} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>

          <Button
            size="sm"
            disabled={!_perms.add}
            onClick={() =>
              setEditing({
                value: "",
                name_en: "",
                name_ar: "",
                responsible_emails: "",
                default_sla_policy_id: null,
                active: true,
                sort_order: items.length + 1,
              })
            }
            className="rounded-xl"
          >
            <Plus className="h-4 w-4 me-1.5" />
            {isAr ? "إضافة فئة جديدة" : "Add Category"}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? "بحث بالفئة أو البريد..." : "Search categories or emails..."}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ps-9 h-9 text-xs rounded-xl"
        />
      </div>

      {/* Main Categories Table */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
            <span>{isAr ? "جارٍ جلب فئات التذاكر..." : "Loading categories..."}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {isAr ? "لا توجد فئات مطابقة." : "No categories found."}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold">{isAr ? "المعرّف (Slug)" : "Value / Key"}</TableHead>
                <TableHead className="text-xs font-semibold">{isAr ? "الاسم (EN)" : "Name (EN)"}</TableHead>
                <TableHead className="text-xs font-semibold">{isAr ? "الاسم (AR)" : "Name (AR)"}</TableHead>
                <TableHead className="text-xs font-semibold">{isAr ? "المسؤولون (Emails)" : "Responsible Persons / Emails"}</TableHead>
                <TableHead className="text-xs font-semibold">{isAr ? "اتفاقية SLA" : "Default SLA"}</TableHead>
                <TableHead className="text-xs font-semibold text-center">{isAr ? "الترتيب" : "Order"}</TableHead>
                <TableHead className="text-xs font-semibold text-center">{isAr ? "مفعّلة" : "Active"}</TableHead>
                <TableHead className="text-xs font-semibold text-end">{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((it) => {
                const slaName = slas.find((s) => s.id === it.default_sla_policy_id)?.name_en || "—";
                const emailsList = (it.responsible_emails || "")
                  .split(",")
                  .map((e) => e.trim())
                  .filter(Boolean);

                return (
                  <TableRow key={it.id} className="hover:bg-muted/30 transition">
                    <TableCell className="font-mono text-xs font-bold text-accent">
                      {it.value}
                    </TableCell>
                    <TableCell className="font-medium text-xs">{it.name_en}</TableCell>
                    <TableCell className="text-xs" dir="rtl">{it.name_ar}</TableCell>
                    <TableCell>
                      {emailsList.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          {isAr ? "غير محدد" : "Unassigned"}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {emailsList.map((email, idx) => (
                            <a
                              key={idx}
                              href={`mailto:${email}`}
                              className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted hover:bg-accent/10 hover:text-accent border transition"
                              title={`Email: ${email}`}
                            >
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[160px]">{email}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {slaName !== "—" ? (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {slaName}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {it.sort_order}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={it.active}
                        onCheckedChange={(v) => toggleActive(it, v)}
                        disabled={!_perms.edit}
                      />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          disabled={!_perms.edit}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditing(it)}
                          title="Edit Category"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          disabled={!_perms.delete}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => remove(it.id, it.name_en)}
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add / Edit Category Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.id
                ? (isAr ? "تعديل فئة التذاكر والمسؤولين" : "Edit Ticket Category & Assignees")
                : (isAr ? "إضافة فئة تذاكر جديدة" : "New Ticket Category")}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label>{isAr ? "معرّف الفئة (Slug) *" : "Category Value / Slug *"}</Label>
                <Input
                  value={editing.value || ""}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  placeholder="e.g. cctv_surveillance"
                  dir="ltr"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isAr ? "الاسم بالإنجليزي *" : "Name (English) *"}</Label>
                  <Input
                    value={editing.name_en || ""}
                    onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                    placeholder="e.g. CCTV & Surveillance"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? "الاسم بالعربي" : "Name (Arabic)"}</Label>
                  <Input
                    dir="rtl"
                    value={editing.name_ar || ""}
                    onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })}
                    placeholder="مثال: كاميرات المراقبة"
                  />
                </div>
              </div>

              {/* Responsible Persons Emails */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-accent" />
                  <span>{isAr ? "البريد الإلكتروني للمسؤولين / الفنيين" : "Responsible Persons Emails"}</span>
                </Label>
                <Input
                  value={editing.responsible_emails || ""}
                  onChange={(e) => setEditing({ ...editing, responsible_emails: e.target.value })}
                  placeholder="cctv.lead@company.com, tech2@company.com"
                  dir="ltr"
                />
                <p className="text-[11px] text-muted-foreground">
                  {isAr
                    ? "افصل بين العناوين بفاصلة (,) لإرسال الإشعارات وتعيين المسؤولين تلقائيًا."
                    : "Separate multiple emails with commas (,). Notifications & routing will target these engineers."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>{isAr ? "اتفاقية مستوى الخدمة الافتراضية (SLA)" : "Default SLA Policy"}</Label>
                <Select
                  value={editing.default_sla_policy_id || "none"}
                  onValueChange={(v) =>
                    setEditing({ ...editing, default_sla_policy_id: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {isAr ? "بدون (استخدم الأولوية الافتراضية)" : "None (use priority default)"}
                    </SelectItem>
                    {slas.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div className="space-y-1.5">
                  <Label>{isAr ? "ترتيب الفرز" : "Sort Order"}</Label>
                  <Input
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="cat-active-sw"
                    checked={editing.active ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                  />
                  <Label htmlFor="cat-active-sw" className="cursor-pointer">
                    {isAr ? "فئة مفعّلة" : "Active Category"}
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button disabled={!_perms.edit || saving} onClick={save}>
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
