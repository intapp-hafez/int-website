import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import type { TrainingRegistration, TrainingRow } from "@/lib/trainings";

type Msg = { role: "user" | "bot"; text: string };

function fmt(d: string | null | undefined) {
  if (!d) return "date to be announced";
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function titleOf(t: TrainingRow) {
  return t.title_en || t.title_ar || "Untitled program";
}

function describe(t: TrainingRow) {
  const bits = [
    `**${titleOf(t)}**`,
    `• Dates: ${fmt(t.start_date)}${t.end_date ? ` → ${fmt(t.end_date)}` : ""}`,
    t.trainer ? `• Trainer: ${t.trainer}` : "",
    t.location ? `• Location: ${t.location}` : "",
    t.active ? "• Status: published — open for registration" : "• Status: hidden from the website",
  ];
  return bits.filter(Boolean).join("\n");
}

function isUpcoming(t: TrainingRow) {
  const ref = t.end_date || t.start_date;
  if (!ref) return false;
  const d = new Date(`${ref}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

/** Answers questions about the published trainings using only database rows. */
function answer(q: string, trainings: TrainingRow[], regs: TrainingRegistration[]): string {
  const s = q.toLowerCase().trim();
  if (!s) return "Ask me about dates, trainers, locations or registrations.";

  const matched = trainings.filter((t) => {
    const hay = `${t.title_en} ${t.title_ar} ${t.trainer} ${t.location}`.toLowerCase();
    return s.split(/\s+/).some((w) => w.length > 3 && hay.includes(w));
  });
  const scope = matched.length ? matched : trainings;

  const has = (...words: string[]) => words.some((w) => s.includes(w));

  if (has("how many", "count", "total")) {
    if (has("registration", "learner", "attendee", "registered")) {
      const ids = new Set(scope.map((t) => t.id));
      const n = regs.filter((r) => ids.has(r.training_id)).length;
      return `There ${n === 1 ? "is" : "are"} ${n} registration${n === 1 ? "" : "s"}${matched.length ? ` for ${titleOf(scope[0]!)}` : " across all programs"}.`;
    }
    return `There are ${trainings.length} training programs, ${trainings.filter(isUpcoming).length} of them upcoming.`;
  }

  if (has("register", "sign up", "enrol", "enroll", "apply", "seat")) {
    const t = scope[0];
    return [
      "Learners register from the public Training page — they open a program, tap “Register now” and fill in name, gender, email, phone, education field, city and district.",
      "Registration is confirmed instantly (no admin approval) and a confirmation email is sent automatically; the trainer and managers get an alert email too.",
      t ? `\nFor ${titleOf(t)}: ${fmt(t.start_date)}${t.location ? `, ${t.location}` : ""}.` : "",
    ].filter(Boolean).join("\n");
  }

  if (has("trainer", "instructor", "who teaches", "who is teaching")) {
    const lines = scope.filter((t) => t.trainer).map((t) => `• ${titleOf(t)} — ${t.trainer}`);
    return lines.length ? `Trainers:\n${lines.join("\n")}` : "No trainer has been set on these programs yet.";
  }

  if (has("where", "location", "venue", "address")) {
    const lines = scope.filter((t) => t.location).map((t) => `• ${titleOf(t)} — ${t.location}`);
    return lines.length ? `Locations:\n${lines.join("\n")}` : "No location has been set on these programs yet.";
  }

  if (has("next", "upcoming", "soon", "when", "date", "schedule", "start", "end")) {
    const up = scope.filter(isUpcoming).sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
    if (!up.length) return "There are no upcoming dated programs right now.";
    return up.slice(0, 5).map(describe).join("\n\n");
  }

  if (has("benefit", "learn", "outcome", "content", "about", "details")) {
    const t = scope[0];
    if (!t) return "No programs are published yet.";
    const body = (t.details_en || t.details_ar || "").trim();
    const benefits = (t.benefits_en || t.benefits_ar || "")
      .split("\n").map((b) => b.trim()).filter(Boolean).map((b) => `• ${b}`).join("\n");
    return [describe(t), body, benefits].filter(Boolean).join("\n\n");
  }

  if (matched.length) return matched.slice(0, 3).map(describe).join("\n\n");

  return [
    "I can answer from the published training data. Try asking:",
    "• What are the upcoming training dates?",
    "• Who is the trainer for <program name>?",
    "• Where is <program name> held?",
    "• How do learners register?",
    "• How many registrations do we have?",
  ].join("\n");
}

export function TrainingAssistant({ trainings, registrations }: { trainings: TrainingRow[]; registrations: TrainingRegistration[] }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Hi! Ask me anything about the published training programs — dates, trainers, locations or how learners register." },
  ]);
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => ["What are the upcoming training dates?", "Who are the trainers?", "How do learners register?", "How many registrations do we have?"],
    [],
  );

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const reply = answer(q, trainings, registrations);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: reply }]);
    setValue("");
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-accent" /> Training assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">Answers come straight from your published training records.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={listRef} className="max-h-[380px] overflow-y-auto space-y-3 rounded-lg border bg-muted/20 p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "bot" && <Bot className="h-4 w-4 mt-1 shrink-0 text-accent" />}
              <div className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                {m.text}
              </div>
              {m.role === "user" && <User className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button key={s} type="button" size="sm" variant="outline" className="text-xs" onClick={() => ask(s)}>
              {s}
            </Button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(value);
          }}
        >
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ask about a program, date or trainer…" aria-label="Ask the training assistant" />
          <Button type="submit" size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button>
        </form>
      </CardContent>
    </Card>
  );
}
