import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Section({ children, className, eyebrow, title, sub, center, id }: {
  children?: ReactNode; className?: string; eyebrow?: string; title?: string; sub?: string; center?: boolean; id?: string;
}) {
  return (
    <section id={id} className={cn("py-12 md:py-16", className)}>
      <div className="container mx-auto px-4 lg:px-8">
        {(eyebrow || title || sub) && (
          <div className={cn("max-w-2xl mb-8 md:mb-10", center && "mx-auto text-center")}>
            {eyebrow && <div className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-2">{eyebrow}</div>}
            {title && <h2 className="text-3xl md:text-5xl font-bold mb-3">{title}</h2>}
            {sub && <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{sub}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
