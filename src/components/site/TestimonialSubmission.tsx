import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, MessageSquarePlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { pendingReview, reviewSubmissionSchema } from "@/lib/review-submission";
import { supabase } from "@/integrations/supabase/client";

export function TestimonialSubmission() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({ author: "", company: "", rating: 5, text: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || honeypot.current?.value) return;
    setError("");
    const result = reviewSubmissionSchema.safeParse(fields);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = ar ? "يرجى إدخال قيمة صحيحة ضمن الحد المسموح." : "Please enter a valid value within the allowed length.";
      setErrors(next);
      return;
    }
    setErrors({});
    submitting.current = true;
    setSaving(true);
    try {
      // No returning SELECT: visitors must not be allowed to read pending reviews.
      const { error: failure } = await supabase.from("reviews").insert(pendingReview(result.data));
      if (failure) throw failure;
      setSent(true);
      setFields({ author: "", company: "", rating: 5, text: "" });
    } catch {
      setError(ar ? "لم يتم حفظ تقييمك. يرجى المحاولة مرة أخرى لاحقاً." : "Your review wasn’t saved. Please try again later.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 flex justify-center">
      <Dialog open={open} onOpenChange={(value) => { if (!saving) { setOpen(value); if (value) { setSent(false); setError(""); } } }}>
        <DialogTrigger asChild><Button variant="outline" size="lg"><MessageSquarePlus aria-hidden="true" />{ar ? "اكتب تقييمك" : "Write a review"}</Button></DialogTrigger>
        <DialogContent dir={dir} className="w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>{ar ? "شارك تجربتك" : "Share your experience"}</DialogTitle>
            <DialogDescription>{ar ? "يظهر تقييمك بعد مراجعته واعتماده." : "Your review will appear after it’s reviewed and approved."}</DialogDescription>
          </DialogHeader>
          {sent ? <div role="status" className="space-y-4 py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
            <p className="font-semibold">{ar ? "شكراً! تم استلام تقييمك وهو بانتظار الاعتماد." : "Thank you! Your review is awaiting approval."}</p>
            <Button onClick={() => setOpen(false)}>{ar ? "تم" : "Done"}</Button>
          </div> : <form onSubmit={submit} noValidate className="space-y-5">
            <div className="hidden" aria-hidden="true"><input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" /></div>
            <fieldset disabled={saving} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="review-author">{ar ? "الاسم" : "Name"} *</Label>
                <Input id="review-author" autoComplete="name" maxLength={100} required value={fields.author} onChange={(e) => setFields({ ...fields, author: e.target.value })} aria-invalid={Boolean(errors.author)} aria-describedby={errors.author ? "review-author-error" : undefined} />
                {errors.author && <p id="review-author-error" className="text-sm text-destructive">{errors.author}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="review-company">{ar ? "الشركة (اختياري)" : "Company (optional)"}</Label>
                <Input id="review-company" autoComplete="organization" maxLength={150} value={fields.company} onChange={(e) => setFields({ ...fields, company: e.target.value })} />
              </div>
              <fieldset className="space-y-2"><legend className="text-sm font-medium">{ar ? "التقييم" : "Rating"} *</legend>
                <div className="flex gap-2">{[1, 2, 3, 4, 5].map((rating) => <label key={rating} className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-input has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                  <input className="sr-only" type="radio" name="review-rating" value={rating} checked={fields.rating === rating} onChange={() => setFields({ ...fields, rating })} aria-label={ar ? `${rating} من 5 نجوم` : `${rating} out of 5 stars`} />
                  <Star aria-hidden="true" className={`h-5 w-5 ${rating <= fields.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </label>)}</div>
              </fieldset>
              <div className="space-y-2"><Label htmlFor="review-text">{ar ? "تقييمك" : "Your review"} *</Label>
                <Textarea id="review-text" rows={5} required maxLength={2000} value={fields.text} onChange={(e) => setFields({ ...fields, text: e.target.value })} aria-invalid={Boolean(errors.text)} aria-describedby="review-text-count review-text-error" />
                <p id="review-text-count" className="text-xs text-muted-foreground text-end">{fields.text.length}/2000</p>
                <p id="review-text-error" className="text-sm text-destructive">{errors.text}</p>
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="animate-spin" aria-hidden="true" />}{saving ? (ar ? "جارٍ الإرسال..." : "Submitting…") : (ar ? "إرسال التقييم" : "Submit review")}</Button>
            </fieldset>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}