import * as React from "react";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";

type Props = {
  api: CarouselApi | undefined;
  className?: string;
  label?: string;
  itemLabel?: (index: number) => string;
};

export function CarouselDots({ api, className, label = "Slide navigation", itemLabel }: Props) {
  const [snaps, setSnaps] = React.useState<number[]>([]);
  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const update = () => {
      setSnaps(api.scrollSnapList());
      setSelected(api.selectedScrollSnap());
    };
    update();
    api.on("reInit", update);
    api.on("select", update);
    return () => {
      api.off("reInit", update);
      api.off("select", update);
    };
  }, [api]);

  if (!api || snaps.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("mt-5 flex items-center justify-center gap-2", className)}
    >
      {snaps.map((_, i) => {
        const active = i === selected;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={itemLabel ? itemLabel(i) : `Go to slide ${i + 1}`}
            onClick={() => api.scrollTo(i)}
            className={cn(
              "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active ? "w-6 bg-accent" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60",
            )}
          />
        );
      })}
    </div>
  );
}