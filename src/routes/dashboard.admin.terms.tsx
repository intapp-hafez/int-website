import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { demoTerms } from "@/data/demo";
import type { Bilingual } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/terms")({
  head: () => ({ meta: [{ title: "Terms — Admin" }] }),
  component: TermsPage,
});

const KEY = "site.terms";

function TermsPage() {
  const [text, setText] = useState<Bilingual>(demoTerms);
  useEffect(() => {
    const s = localStorage.getItem(KEY);
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === "object" && "en" in parsed) setText(parsed);
        else if (typeof parsed === "string") setText({ en: parsed, ar: demoTerms.ar });
      } catch {
        setText({ en: s, ar: demoTerms.ar });
      }
    }
  }, []);
  const save = () => { localStorage.setItem(KEY, JSON.stringify(text)); toast.success("Terms saved"); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mt-1">Rich text editor for legal terms — supports headings, lists, bold, links, and more (EN & AR).</p>
      </div>
      <Card><CardContent className="p-4 space-y-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>English</Label>
            <span className="text-xs text-muted-foreground">Rich Text (LTR)</span>
          </div>
          <RichTextEditor
            dir="ltr"
            value={text.en}
            onChange={(val) => setText({ ...text, en: val })}
            placeholder="Write your Terms of Service in English..."
            minHeight="300px"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>عربي</Label>
            <span className="text-xs text-muted-foreground">محرر نصوص منسقة (RTL)</span>
          </div>
          <RichTextEditor
            dir="rtl"
            value={text.ar}
            onChange={(val) => setText({ ...text, ar: val })}
            placeholder="اكتب شروط الخدمة بالعربية..."
            minHeight="300px"
          />
        </div>
        <Button onClick={save}>Save Terms</Button>
      </CardContent></Card>
    </div>
  );
}
