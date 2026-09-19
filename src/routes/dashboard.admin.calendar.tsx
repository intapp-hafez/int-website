import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingCalendar } from "@/components/admin/TrainingCalendar";
import { useTrainings, type TrainingRow } from "@/lib/trainings";
import { useEvents } from "@/lib/events";

export const Route = createFileRoute("/dashboard/admin/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Admin" }] }),
  component: AdminCalendarPage,
});

function AdminCalendarPage() {
  const { items: trainings, loading: loadingTrainings } = useTrainings();
  const { items: events, loading: loadingEvents } = useEvents();

  /** Events are mapped onto the training row shape so both share one grid. */
  const combined = useMemo<TrainingRow[]>(() => {
    const mappedEvents = events.map(
      (e) =>
        ({
          id: `event-${e.id}`,
          kind: "event",
          title_en: e.title,
          title_ar: e.title,
          details_en: e.summary,
          details_ar: e.summary,
          benefits_en: "",
          benefits_ar: "",
          trainer: "",
          start_date: e.start_date,
          end_date: e.end_date,
          location: [e.venue, e.city].filter(Boolean).join(", "),
          banner_url: e.banner_url,
          active: e.active,
          sort_order: e.sort_order,
        }) as TrainingRow,
    );
    return [...trainings, ...mappedEvents];
  }, [trainings, events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">All scheduled trainings and events in one view.</p>
      </div>

      {loadingTrainings || loadingEvents ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Loading…</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Fetching trainings and events.</CardContent>
        </Card>
      ) : (
        <TrainingCalendar items={combined} />
      )}
    </div>
  );
}
