import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Trash2, FilePlus, Mail, Phone, ExternalLink } from "lucide-react";
import { useAdminT } from "@/lib/admin-i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/leads/$id")({
  head: () => ({ meta: [{ title: "Lead Details — Admin" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { t, lang, isRtl } = useAdminT();
  const isAr = lang === "ar";

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const loadLead = async () => {
      try {
        const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
        if (data) {
          setLead({
            id: data.id,
            name: data.full_name || (data as any).name || "",
            company: data.company || "",
            email: data.email || "",
            phone: data.phone || "",
            service: (data as any).service || (data as any).category || "",
            message: data.message || "",
            status: data.status || "new",
            createdAt: data.created_at ? new Date(data.created_at).toLocaleString(isAr ? "ar" : "en") : "",
          });
        }
      } catch (err) {
        console.warn("[lead-detail] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    void loadLead();
  }, [id, isAr]);

  if (loading) {
    return (
      <Card className="p-12 text-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
        <span>{isAr ? "جارٍ جلب تفاصيل العميل..." : "Loading lead information..."}</span>
      </Card>
    );
  }

  if (!lead) {
    return (
      <Card className="p-12 text-center text-xs text-muted-foreground">
        <p className="font-bold text-foreground mb-2">{isAr ? "العميل غير موجود" : "Lead Not Found"}</p>
        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/dashboard/admin/leads" })}>
          <ArrowLeft className={`h-4 w-4 ${isRtl ? "ms-1 rotate-180" : "me-1"}`} />
          {isAr ? "العودة للعملاء المحتملين" : "Back to Leads"}
        </Button>
      </Card>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("leads").update({
        full_name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        category: lead.service,
        message: lead.message,
        status: lead.status,
        updated_at: new Date().toISOString(),
      }).eq("id", id);

      if (error) throw error;
      toast.success(isAr ? "تم حفظ التعديلات بنجاح" : "Lead updated successfully");
      navigate({ to: "/dashboard/admin/leads" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const convertToQuotation = async () => {
    setConverting(true);
    try {
      const { data: q, error: qErr } = await (supabase as any)
        .from("quotes")
        .insert({
          full_name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
          service_name: lead.service || "Integrated Enterprise Solution",
          total: 10000,
          currency: "USD",
          status: "draft",
          message: lead.message,
        })
        .select()
        .single();

      if (qErr) throw qErr;

      // Mark lead as won
      await supabase.from("leads").update({ status: "won" }).eq("id", id);
      toast.success(isAr ? "تم تحويل الطلب إلى عرض سعر وتحديث الحالة إلى Won" : "Converted to official quotation!");

      if (q?.id) {
        navigate({ to: "/dashboard/admin/quotations/$id", params: { id: q.id } } as any);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to convert lead");
    } finally {
      setConverting(false);
    }
  };

  const removeLead = async () => {
    if (!confirm(isAr ? "هل تريد حذف هذا العميل المحتمل نهائياً؟" : "Delete this lead permanently?")) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast.success(isAr ? "تم حذف العميل" : "Lead deleted");
      navigate({ to: "/dashboard/admin/leads" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete lead");
    }
  };

  return (
    <div className="space-y-4 max-w-4xl" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/admin/leads">
            <ArrowLeft className={`h-4 w-4 me-2 ${isRtl ? "rotate-180" : ""}`} /> {isAr ? "الرجوع" : "Back"}
          </Link>
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="capitalize text-xs font-medium">
            {lead.status}
          </Badge>

          {lead.email && (
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-3.5 w-3.5 me-1.5" />
                {isAr ? "إرسال بريد" : "Send Email"}
              </a>
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={convertToQuotation} disabled={converting}>
            {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" /> : <FilePlus className="h-3.5 w-3.5 text-accent me-1.5" />}
            {isAr ? "تحويل لعرض سعر" : "Convert to Quotation"}
          </Button>

          <Button variant="ghost" size="icon" onClick={removeLead} className="text-destructive h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border shadow-xs">
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold">
            {isAr ? "بيانات العميل المحتمل" : "Lead Information"} #{lead.id.slice(0, 8)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{isAr ? "الاسم" : "Name"}</Label>
            <Input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "الشركة" : "Company"}</Label>
            <Input value={lead.company} onChange={(e) => setLead({ ...lead, company: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <Input value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "الهاتف" : "Phone"}</Label>
            <Input value={lead.phone || ""} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{isAr ? "الخدمة / الطلب" : "Service"}</Label>
            <Input value={lead.service} onChange={(e) => setLead({ ...lead, service: e.target.value })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{isAr ? "الرسالة / المتطلبات" : "Message / Requirements"}</Label>
            <Textarea rows={4} value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "الحالة" : "Status"}</Label>
            <Select value={lead.status} onValueChange={(v) => setLead({ ...lead, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["new", "qualified", "won", "lost"] as const).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "تاريخ الإنشاء" : "Created At"}</Label>
            <Input value={lead.createdAt} disabled className="bg-muted/40 font-mono text-xs" />
          </div>
          <div className="md:col-span-2 pt-3 flex items-center gap-2">
            <Button onClick={save} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
              <span>{isAr ? "حفظ التغييرات" : "Save Changes"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}