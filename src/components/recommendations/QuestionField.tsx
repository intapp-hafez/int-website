import type { Question } from "@/lib/recommendation-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = { q: Question; value: any; onChange: (v: any) => void; lang: "en" | "ar"; invalid?: boolean };

export function QuestionField({ q, value, onChange, lang, invalid }: Props) {
  const label = lang === "ar" ? q.label_ar : q.label_en;
  const helper = lang === "ar" ? q.helper_ar : q.helper_en;
  const isAr = lang === "ar";
  const invalidCls = invalid ? "ring-2 ring-destructive ring-offset-1 rounded-md" : "";

  const field = (() => {
    if (q.type === "number") {
      return <Input type="number" min={q.min} max={q.max} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} dir={isAr ? "rtl" : "ltr"} className={`${isAr ? "text-right" : ""} ${invalidCls}`} aria-invalid={invalid || undefined} />;
    }
    if (q.type === "text") {
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} dir={isAr ? "rtl" : "ltr"} className={`${isAr ? "font-arabic text-right" : ""} ${invalidCls}`} aria-invalid={invalid || undefined} />;
    }
    if (q.type === "boolean") {
      return (
        <div className={`flex items-center gap-2 ${invalidCls}`}>
          <Switch checked={!!value} onCheckedChange={onChange} />
          <span className="text-sm text-muted-foreground">{value ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</span>
        </div>
      );
    }
    if (q.type === "select") {
      return (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger className={invalidCls} aria-invalid={invalid || undefined}><SelectValue placeholder={isAr ? "اختر…" : "Select…"} /></SelectTrigger>
          <SelectContent>
            {(q.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>{isAr ? o.label_ar : o.label_en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (q.type === "multi-select") {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <div className={`flex flex-wrap gap-2 ${invalid ? "p-2 rounded-md ring-2 ring-destructive" : ""}`}>
          {(q.options ?? []).map((o) => {
            const active = arr.includes(o.value);
            return (
              <button key={o.value} type="button"
                onClick={() => onChange(active ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${active ? "bg-accent text-accent-foreground border-accent" : "bg-background hover:bg-muted"}`}>
                {isAr ? o.label_ar : o.label_en}
              </button>
            );
          })}
        </div>
      );
    }
    return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} dir={isAr ? "rtl" : "ltr"} className={`${isAr ? "font-arabic text-right" : ""} ${invalidCls}`} aria-invalid={invalid || undefined} />;
  })();

  return (
    <div className="space-y-1.5" dir={isAr ? "rtl" : "ltr"} data-question-key={q.key}>
      <Label className={`block ${isAr ? "text-right font-arabic" : "text-left"} ${invalid ? "text-destructive" : ""}`}>
        {label}{q.required && <span className="text-destructive ms-1">*</span>}
      </Label>
      {field}
      {helper && <p className={`text-xs text-muted-foreground ${isAr ? "font-arabic text-right" : ""}`}>{helper}</p>}
      {invalid && (
        <p className={`text-xs text-destructive ${isAr ? "font-arabic text-right" : "text-left"}`}>
          {isAr ? "هذا الحقل مطلوب" : "This field is required"}
        </p>
      )}
    </div>
  );
}