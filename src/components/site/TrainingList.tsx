import { useState } from "react";
import { Section } from "@/components/site/Section";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, MapPin, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { registerForTraining, useTrainings, type TrainingKind, type TrainingRow } from "@/lib/trainings";

function fmt(d: string | null, isAr: boolean) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function TrainingList({ kind }: { kind: TrainingKind }) {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const { items, loading } = useTrainings(kind, true);

  const copy = {
    eyebrow: kind === "event" ? (isAr ? "الفعاليات" : "Events") : isAr ? "التدريب" : "Training",
    title:
      kind === "event"
        ? isAr
          ? "الفعاليات القادمة"
          : "Upcoming Events"
        : isAr
          ? "البرامج التدريبية"
          : "Training Programs",
    sub:
      kind === "event"
        ? isAr
          ? "انضم إلى ورش العمل والفعاليات التقنية التي ننظمها."
          : "Join our technical workshops, meetups and industry events."
        : isAr
          ? "برامج تدريبية عملية يقدمها مهندسون معتمدون. سجّل الآن لحجز مقعدك."
          : "Hands-on programs delivered by certified engineers. Register to reserve your seat.",
    empty: isAr ? "لا يوجد محتوى منشور حالياً." : "Nothing published yet. Please check back soon.",
  };

  return (
    <div dir={dir}>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className={`container mx-auto px-4 lg:px-8 py-24 relative ${isAr ? "text-right" : "text-left"}`}>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">{copy.eyebrow}</div>
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${isAr ? "font-arabic leading-[1.3]" : ""}`}>{copy.title}</h1>
          <p className={`text-lg text-muted-foreground max-w-2xl ${isAr ? "font-arabic leading-loose ms-auto" : ""}`}>{copy.sub}</p>
        </div>
      </section>

      <Section>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <TrainingCard key={it.id} item={it} isAr={isAr} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function TrainingCard({ item, isAr }: { item: TrainingRow; isAr: boolean }) {
  const title = (isAr ? item.title_ar : item.title_en) || item.title_en || item.title_ar;
  const details = (isAr ? item.details_ar : item.details_en) || "";
  const benefits = (isAr ? item.benefits_ar : item.benefits_en) || "";
  const benefitLines = benefits.split("\n").map((b) => b.trim()).filter(Boolean);

  return (
    <article className="rounded-xl border bg-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      <div className="aspect-[16/9] bg-muted overflow-hidden">
        {item.banner_url ? (
          <img src={item.banner_url} alt={title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid-bg opacity-60" />
        )}
      </div>
      <div className={`p-5 flex flex-col gap-3 flex-1 ${isAr ? "text-right font-arabic" : ""}`}>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {item.start_date && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {fmt(item.start_date, isAr)}
              {item.end_date ? ` — ${fmt(item.end_date, isAr)}` : ""}
            </span>
          )}
          {item.trainer && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {item.trainer}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {item.location}
            </span>
          )}
        </div>
        {details && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{details}</p>}
        {benefitLines.length > 0 && (
          <ul className="space-y-1 text-sm">
            {benefitLines.slice(0, 4).map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-3">
          <RegisterDialog item={item} isAr={isAr} />
        </div>
      </div>
    </article>
  );
}

function RegisterDialog({ item, isAr }: { item: TrainingRow; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    gender: "",
    email: "",
    phone: "",
    education_field: "",
    city: "",
    district: "",
  });

  const L = (en: string, ar: string) => (isAr ? ar : en);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return toast.error(L("Please enter your full name", "من فضلك أدخل اسمك بالكامل"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return toast.error(L("Enter a valid email", "أدخل بريداً إلكترونياً صحيحاً"));
    setBusy(true);
    try {
      await registerForTraining({
        training_id: item.id,
        full_name: form.full_name.trim().slice(0, 120),
        gender: form.gender,
        email: form.email.trim().slice(0, 255),
        phone: form.phone.trim().slice(0, 40),
        education_field: form.education_field.trim().slice(0, 120),
        city: form.city.trim().slice(0, 80),
        district: form.district.trim().slice(0, 80),
      });
      setDone(true);
      toast.success(L("Registration received", "تم استلام تسجيلك"));
    } catch (err: any) {
      toast.error(err?.message ?? L("Registration failed", "فشل التسجيل"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDone(false); }}>
      <DialogTrigger asChild>
        <Button className="w-full">{L("Register now", "سجّل الآن")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir={isAr ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className={isAr ? "font-arabic text-right" : ""}>
            {L("Register", "التسجيل")} — {(isAr ? item.title_ar : item.title_en) || item.title_en}
          </DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 mx-auto text-accent" />
            <p className={`font-medium ${isAr ? "font-arabic" : ""}`}>
              {L("Thank you! We'll contact you with the details.", "شكراً لك! سنتواصل معك بالتفاصيل.")}
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>{L("Close", "إغلاق")}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>{L("Full name", "الاسم بالكامل")}</Label>
              <Input value={form.full_name} maxLength={120} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>{L("Gender", "النوع")}</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder={L("Select", "اختر")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{L("Male", "ذكر")}</SelectItem>
                  <SelectItem value="female">{L("Female", "أنثى")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{L("Phone", "رقم الهاتف")}</Label>
              <Input value={form.phone} maxLength={40} dir="ltr" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>{L("Email", "البريد الإلكتروني")}</Label>
              <Input type="email" value={form.email} maxLength={255} dir="ltr" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>{L("Education field", "المجال الدراسي")}</Label>
              <Input value={form.education_field} maxLength={120} onChange={(e) => setForm({ ...form, education_field: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{L("City", "المدينة")}</Label>
              <Input value={form.city} maxLength={80} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{L("District", "الحي / المنطقة")}</Label>
              <Input value={form.district} maxLength={80} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-2">
              <Badge variant="secondary">{item.kind === "event" ? L("Event", "فعالية") : L("Training", "تدريب")}</Badge>
              <Button type="submit" disabled={busy}>{busy ? L("Submitting…", "جارٍ الإرسال…") : L("Submit registration", "إرسال التسجيل")}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
