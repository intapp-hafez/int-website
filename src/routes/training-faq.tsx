import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { TrainingChatWidget } from "@/components/site/TrainingChatWidget";

export const Route = createFileRoute("/training-faq")({
  head: () => ({
    meta: [
      { title: "Training FAQ — Registration, Dates & Certificates" },
      { name: "description", content: "Answers about registering for Integrated Technics training: how to book a seat, program dates, trainers, attendance certificates and calendar invites." },
      { property: "og:title", content: "Training FAQ — Integrated Technics" },
      { property: "og:description", content: "How to register, when programs run, who teaches them and how attendance certificates are issued." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingFaqPage,
});

const FAQS: { q: { en: string; ar: string }; a: { en: string; ar: string } }[] = [
  {
    q: { en: "How do I register for a training program?", ar: "كيف أسجل في برنامج تدريبي؟" },
    a: {
      en: "Open the Training page, choose a program and tap “Register now”. Fill in your name, gender, email, phone, education field, city and district. Your seat is confirmed instantly — no approval step is needed.",
      ar: "افتح صفحة التدريب، اختر البرنامج ثم اضغط «سجّل الآن». أدخل الاسم والنوع والبريد الإلكتروني ورقم الهاتف والمجال التعليمي والمدينة والحي. يتم تأكيد مقعدك فوراً دون الحاجة إلى موافقة.",
    },
  },
  {
    q: { en: "Will I receive a confirmation?", ar: "هل أستلم رسالة تأكيد؟" },
    a: {
      en: "Yes. A confirmation email is sent to the address you registered with as soon as you submit the form, and the trainer and program managers are notified with your details.",
      ar: "نعم. تصلك رسالة تأكيد على بريدك فور إرسال النموذج، كما يتم إشعار المدرب ومسؤولي البرنامج ببياناتك.",
    },
  },
  {
    q: { en: "When do programs run and how do I add them to my calendar?", ar: "متى تُقام البرامج وكيف أضيفها إلى التقويم؟" },
    a: {
      en: "Each program card shows its start and end dates plus the venue. Use the “Add to calendar” button on the card to download a calendar file that works with Google Calendar, Outlook and Apple Calendar.",
      ar: "تعرض بطاقة كل برنامج تاريخ البداية والنهاية والمكان. استخدم زر «أضف إلى التقويم» لتنزيل ملف يعمل مع تقويم Google وOutlook وApple.",
    },
  },
  {
    q: { en: "Who delivers the training?", ar: "من يقدّم التدريب؟" },
    a: {
      en: "Programs are delivered by certified Integrated Technics engineers. The trainer's name is listed on each program card, and you can ask the assistant on the Training page about a specific program.",
      ar: "يقدّم البرامج مهندسون معتمدون من Integrated Technics. يظهر اسم المدرب على بطاقة كل برنامج، ويمكنك سؤال المساعد في صفحة التدريب عن أي برنامج.",
    },
  },
  {
    q: { en: "Do I get a certificate?", ar: "هل أحصل على شهادة؟" },
    a: {
      en: "Yes. Once the team marks your attendance as completed, an attendance certificate with a unique certificate number is issued and can be sent to you as a PDF.",
      ar: "نعم. بعد تسجيل حضورك كمكتمل، تُصدر شهادة حضور برقم فريد ويمكن إرسالها إليك بصيغة PDF.",
    },
  },
  {
    q: { en: "Is there a fee, and can I cancel?", ar: "هل هناك رسوم وهل يمكنني الإلغاء؟" },
    a: {
      en: "Fees depend on the program and are stated in the program details. To cancel or move to another date, reply to your confirmation email or contact us and we will update your registration.",
      ar: "تعتمد الرسوم على البرنامج وتُذكر ضمن تفاصيله. للإلغاء أو النقل إلى موعد آخر، رد على رسالة التأكيد أو تواصل معنا وسنقوم بتحديث تسجيلك.",
    },
  },
];

function TrainingFaqPage() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";

  return (
    <div dir={dir}>
      <section className="gradient-surface relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className={`container mx-auto px-4 lg:px-8 py-20 relative ${isAr ? "text-right" : "text-left"}`}>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
            {isAr ? "التدريب" : "Training"}
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isAr ? "font-arabic leading-[1.3]" : ""}`}>
            {isAr ? "الأسئلة الشائعة عن التدريب" : "Training FAQ"}
          </h1>
          <p className={`text-lg text-muted-foreground max-w-2xl ${isAr ? "font-arabic leading-loose ms-auto" : ""}`}>
            {isAr
              ? "كل ما تحتاج معرفته عن التسجيل والمواعيد والمدربين والشهادات."
              : "Everything you need to know about registration, dates, trainers and certificates."}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-16">
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {FAQS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className={`${isAr ? "font-arabic text-right" : "text-left"}`}>
                {isAr ? item.q.ar : item.q.en}
              </AccordionTrigger>
              <AccordionContent className={`text-muted-foreground ${isAr ? "font-arabic leading-loose text-right" : ""}`}>
                {isAr ? item.a.ar : item.a.en}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="max-w-3xl mx-auto mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/training">{isAr ? "تصفح البرامج التدريبية" : "Browse training programs"}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">{isAr ? "تواصل معنا" : "Contact us"}</Link>
          </Button>
        </div>
      </section>

      <TrainingChatWidget />
    </div>
  );
}
