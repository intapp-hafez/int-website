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
import { CalendarDays, MapPin, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { registerForEvent, useEvents, type EventRow } from "@/lib/events";

function fmt(d: string | null, isAr: boolean) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function EventsList() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const { items, loading } = useEvents(true);

  const copy = {
    eyebrow: isAr ? "الفعاليات" : "Events",
    title: isAr ? "الفعاليات القادمة" : "Upcoming Events",
    sub: isAr
      ? "انضم إلى المؤتمرات وورش العمل والفعاليات التقنية التي ننظمها."
      : "Join our executive summits, technical workshops, and industry events.",
    empty: isAr ? "لا يوجد فعاليات منشورة حالياً." : "No events published yet. Please check back soon.",
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
              <Skeleton key={i} className="h-[400px] rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <EventCard key={it.id} item={it} isAr={isAr} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function EventCard({ item, isAr }: { item: EventRow; isAr: boolean }) {
  const L = (en: string, ar: string) => (isAr ? ar : en);
  
  return (
    <article className="rounded-xl border bg-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      <div className="aspect-[16/9] bg-muted overflow-hidden relative">
        {item.banner_url ? (
          <img src={item.banner_url} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid-bg opacity-60" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-orange-600 hover:bg-orange-700">{item.category}</Badge>
          {item.status !== "Registration Open" && (
            <Badge variant="secondary">{item.status}</Badge>
          )}
        </div>
      </div>
      <div className={`p-5 flex flex-col gap-3 flex-1 ${isAr ? "text-right font-arabic" : ""}`}>
        <h2 className="font-display text-lg font-bold">{item.title}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {item.start_date && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {fmt(item.start_date, isAr)}
              {item.end_date && item.end_date !== item.start_date ? ` — ${fmt(item.end_date, isAr)}` : ""}
            </span>
          )}
          {(item.start_time || item.end_time) && (
             <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {item.start_time}{item.end_time ? ` - ${item.end_time}` : ""}
            </span>
          )}
          {(item.city || item.venue) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {[item.venue, item.city].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
        
        {item.summary && (
          <div 
            className="text-sm text-muted-foreground leading-relaxed line-clamp-3 prose-sm prose-p:my-1 prose-ul:my-1" 
            dangerouslySetInnerHTML={{ __html: item.summary }} 
          />
        )}
        
        <div className="mt-auto pt-4 border-t">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              {item.capacity > 0 ? (isAr ? `السعة: ${item.capacity} مقعد` : `Capacity: ${item.capacity} seats`) : ""}
            </span>
            <RegisterDialog item={item} isAr={isAr} />
          </div>
        </div>
      </div>
    </article>
  );
}

function RegisterDialog({ item, isAr }: { item: EventRow; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    gender: "",
    email: "",
    phone: "",
    organization: "",
    job_title: "",
    number_of_representatives: 1,
    dates_to_attend: "",
    sector: "",
    willing_to_travel: "",
    transportation_requirement: "",
    check_in_details: "",
    check_out_details: "",
    special_requests: "",
    education_field: "",
    city: "",
    district: "",
  });

  const L = (en: string, ar: string) => (isAr ? ar : en);

  const disabled = item.status === "Registration Closed" || item.status === "Completed";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return toast.error(L("Please enter your full name", "من فضلك أدخل اسمك بالكامل"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return toast.error(L("Enter a valid email", "أدخل بريداً إلكترونياً صحيحاً"));
    setBusy(true);
    try {
      await registerForEvent({
        event_id: item.id,
        full_name: form.full_name.trim().slice(0, 120),
        gender: form.gender,
        email: form.email.trim().slice(0, 255),
        phone: form.phone.trim().slice(0, 40),
        organization: form.organization.trim().slice(0, 120),
        job_title: form.job_title.trim().slice(0, 120),
        number_of_representatives: form.number_of_representatives,
        dates_to_attend: form.dates_to_attend,
        sector: form.sector,
        willing_to_travel: form.willing_to_travel,
        transportation_requirement: form.transportation_requirement,
        check_in_details: form.check_in_details,
        check_out_details: form.check_out_details,
        special_requests: form.special_requests,
        education_field: "",
        city: "",
        district: "",
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
        <Button size="sm" disabled={disabled}>
          {disabled ? L("Closed", "مغلق") : L("Register now", "سجّل الآن")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className={isAr ? "font-arabic text-right text-xl" : "text-xl"}>
            Event Registration
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">INT @ {item.title}</p>
        </DialogHeader>

        {done ? (
          <div className="py-12 text-center space-y-4 px-6 flex-1">
            <CheckCircle2 className="h-12 w-12 mx-auto text-accent" />
            <p className={`font-medium text-lg ${isAr ? "font-arabic" : ""}`}>
              {L("Thank you! We'll contact you with the details.", "شكراً لك! سنتواصل معك بالتفاصيل.")}
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>{L("Close", "إغلاق")}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/50">
              
              <div className="border rounded-xl bg-white p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <h3 className="font-bold text-sm text-slate-800 tracking-wide">PRIMARY ATTENDEE (TICKET #1)</h3>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Full Access Badge</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name (as it should be on badge) <span className="text-red-500">*</span></Label>
                    <Input placeholder="Ahmed Mohamed" value={form.full_name} maxLength={120} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender <span className="text-red-500">*</span></Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Input type="email" placeholder="client@intevents.com" value={form.email} maxLength={255} dir="ltr" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mobile Number (with country code, e.g. +20) <span className="text-red-500">*</span></Label>
                    <Input placeholder="+20 1X XXX XXXX" value={form.phone} maxLength={40} dir="ltr" onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Organization <span className="text-red-500">*</span></Label>
                    <Input placeholder="ABC Corporation" value={form.organization} maxLength={120} onChange={(e) => setForm({ ...form, organization: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Job Title <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g. IT Director / Security Manager" value={form.job_title} maxLength={120} onChange={(e) => setForm({ ...form, job_title: e.target.value })} required />
                  </div>
                </div>
              </div>

              <div className="border rounded-xl bg-white p-5">
                <div className="flex items-center gap-2 mb-5 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <h3 className="font-bold text-sm text-slate-800 tracking-wide">DELEGATION & ATTENDANCE SETTINGS</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Number of Representatives who intended to attend <span className="text-red-500">*</span></Label>
                    <Select value={String(form.number_of_representatives)} onValueChange={(v) => setForm({ ...form, number_of_representatives: Number(v) })}>
                      <SelectTrigger><SelectValue placeholder="1" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 (Primary Attendee only)</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dates to attend <span className="text-red-500">*</span></Label>
                    <Select value={form.dates_to_attend} onValueChange={(v) => setForm({ ...form, dates_to_attend: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All days">All days</SelectItem>
                        <SelectItem value="Day 1 only">Day 1 only</SelectItem>
                        <SelectItem value="Day 2 only">Day 2 only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sector <span className="text-red-500">*</span></Label>
                    <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Are you willing to travel? <span className="text-red-500">*</span></Label>
                    <Select value={form.willing_to_travel} onValueChange={(v) => setForm({ ...form, willing_to_travel: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transportation Requirement <span className="text-red-500">*</span></Label>
                    <Select value={form.transportation_requirement} onValueChange={(v) => setForm({ ...form, transportation_requirement: v })}>
                      <SelectTrigger><SelectValue placeholder="Select transportation option..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None (Self arranged)</SelectItem>
                        <SelectItem value="Airport Transfer">Airport Transfer</SelectItem>
                        <SelectItem value="Hotel Shuttle">Hotel Shuttle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl bg-white p-5">
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-slate-800 tracking-wide">LOGISTICS & ADDITIONAL NOTES (OPTIONAL)</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Check-in Details</Label>
                    <Input placeholder="Expected arrival time / flight" value={form.check_in_details} onChange={(e) => setForm({ ...form, check_in_details: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Check-out Details</Label>
                    <Input placeholder="Expected departure time" value={form.check_out_details} onChange={(e) => setForm({ ...form, check_out_details: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Special Considerations or Requests</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Dietary requirements, accessibility assistance, special requests..."
                      value={form.special_requests} 
                      onChange={(e) => setForm({ ...form, special_requests: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

            </div>
            
            <div className="px-6 py-4 border-t bg-white flex items-center justify-between shrink-0">
              <div className="text-sm text-slate-500">
                Total Tickets: <span className="font-bold text-slate-900">{form.number_of_representatives}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={busy} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {busy ? L("Submitting…", "جارٍ الإرسال…") : `Confirm Registration (${form.number_of_representatives})`}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
