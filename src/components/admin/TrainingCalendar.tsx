import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, User } from "lucide-react";
import type { TrainingRow } from "@/lib/trainings";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDate(v: string | null) {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmt(d: string | null) {
  const dt = toDate(d);
  return dt ? dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

/** Month grid of scheduled trainings plus an upcoming list. */
export function TrainingCalendar({ items }: { items: TrainingRow[] }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  /** dayKey -> trainings running that day */
  const byDay = useMemo(() => {
    const map = new Map<string, TrainingRow[]>();
    for (const t of items) {
      const start = toDate(t.start_date);
      if (!start) continue;
      const end = toDate(t.end_date) ?? start;
      const cur = new Date(start);
      let guard = 0;
      while (cur <= end && guard < 400) {
        const k = key(cur);
        map.set(k, [...(map.get(k) ?? []), t]);
        cur.setDate(cur.getDate() + 1);
        guard++;
      }
    }
    return map;
  }, [items]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return items
      .filter((t) => {
        const end = toDate(t.end_date) ?? toDate(t.start_date);
        return end ? end >= today : false;
      })
      .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
  }, [items]);

  const firstOfMonth = cursor;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const leading = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];
  const todayKey = key(new Date());

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-lg">
            {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); }}>
              Today
            </Button>
            <Button size="icon" variant="outline" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-[11px] font-medium text-muted-foreground mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-1 py-1 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={`x${i}`} className="min-h-[84px] rounded-md bg-muted/30" />;
              const k = key(d);
              const list = byDay.get(k) ?? [];
              return (
                <div
                  key={k}
                  className={`min-h-[84px] rounded-md border p-1.5 text-xs ${k === todayKey ? "border-accent ring-1 ring-accent/40" : ""}`}
                >
                  <div className="mb-1 font-semibold text-muted-foreground">{d.getDate()}</div>
                  <div className="space-y-1">
                    {list.slice(0, 2).map((t) => (
                      <div key={t.id} className="truncate rounded bg-accent/15 px-1 py-0.5 text-[11px]" title={t.title_en || t.title_ar}>
                        {t.title_en || t.title_ar}
                      </div>
                    ))}
                    {list.length > 2 && <div className="text-[10px] text-muted-foreground">+{list.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Upcoming ({upcoming.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming dated trainings.</p>
          ) : (
            upcoming.map((t) => (
              <div key={t.id} className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm">{t.title_en || t.title_ar}</div>
                  {t.active ? <Badge>Live</Badge> : <Badge variant="outline">Hidden</Badge>}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {fmt(t.start_date)}{t.end_date ? ` → ${fmt(t.end_date)}` : ""}
                </div>
                {t.trainer && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" />{t.trainer}</div>
                )}
                {t.location && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.location}</div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
