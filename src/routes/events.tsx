import { createFileRoute } from "@tanstack/react-router";
import { TrainingList } from "@/components/site/TrainingList";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Workshops — Integrated Technics" },
      { name: "description", content: "Upcoming technology events, workshops and meetups hosted by Integrated Technics. Register to attend." },
      { property: "og:title", content: "Events & Workshops — Integrated Technics" },
      { property: "og:description", content: "Upcoming technology events, workshops and meetups hosted by Integrated Technics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <TrainingList kind="event" />,
});
