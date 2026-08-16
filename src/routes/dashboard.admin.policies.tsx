import { createFileRoute } from "@tanstack/react-router";
import { useCurrentPagePerms } from "@/components/admin/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useLegalContent, DEFAULT_POLICIES } from "@/lib/legal-store";
import { useAdminT } from "@/lib/admin-i18n";
import { toast } from "sonner";
import { Save, Loader2, Lock, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/policies")({
  head: () => ({ meta: [{ title: "Privacy Policy — Admin" }] }),
  component: PoliciesAdminPage,
});

function PoliciesAdminPage() {
  const _perms = useCurrentPagePerms();
  const { lang } = useAdminT();
  const ar = lang === "ar";
  const { content, setContent, save, saving, loading } = useLegalContent("policies_content", DEFAULT_POLICIES);

  const handleSave = async () => {
    const ok = await save(content);
    if (ok) {
      toast.success(ar ? "تم حفظ سياسة الخصوصية وتحديث قاعدة البيانات بنجاح!" : "Privacy Policy saved and synced to database!");
    } else {
      toast.info(ar ? "تم الحفظ محلياً بنجاح (سيتم المزامنة تلقائياً)" : "Saved locally (will sync with database)");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {ar ? "سياسة الخصوصية (Privacy Policy)" : "Privacy Policy & Governance"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {ar
              ? "محرر نصوص متقدم لصياغة سياسات الخصوصية وحماية البيانات والامتثال للمعايير باللغتين العربية والإنجليزية."
              : "Rich text editor for data privacy, compliance, and governance policies (EN & AR) synced with the database."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs">
            <Link to="/policies" target="_blank">
              <ExternalLink className="h-3.5 w-3.5 me-1.5 text-accent" />
              {ar ? "معاينة الصفحة العامة" : "View Public Page"}
            </Link>
          </Button>

          <Button disabled={!_perms.edit || saving || loading} onClick={handleSave} size="sm">
            {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
            {ar ? "حفظ التعديلات" : "Save Policy"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{ar ? "السياسة باللغة الإنجليزية (English)" : "English (LTR)"}</Label>
              <span className="text-xs text-muted-foreground">HTML / Rich Text</span>
            </div>
            <RichTextEditor
              dir="ltr"
              value={content.en}
              onChange={(val) => setContent({ ...content, en: val })}
              placeholder="Write your Privacy Policy in English..."
              minHeight="320px"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{ar ? "السياسة باللغة العربية (العربية)" : "Arabic (RTL)"}</Label>
              <span className="text-xs text-muted-foreground">محرر نصوص منسقة</span>
            </div>
            <RichTextEditor
              dir="rtl"
              value={content.ar}
              onChange={(val) => setContent({ ...content, ar: val })}
              placeholder="اكتب سياسة الخصوصية بالعربية..."
              minHeight="320px"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button disabled={!_perms.edit || saving || loading} onClick={handleSave}>
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
              {ar ? "حفظ التعديلات" : "Save Policy"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
