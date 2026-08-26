import { createFileRoute } from "@tanstack/react-router";
import { TrainingList } from "@/components/site/TrainingList";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Training Programs — Integrated Technics" },
      { name: "description", content: "Hands-on IT, networking and security training programs delivered by certified engineers. Register online." },
      { property: "og:title", content: "Training Programs — Integrated Technics" },
      { property: "og:description", content: "Hands-on IT, networking and security training programs delivered by certified engineers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <TrainingList kind="training" />,
});
