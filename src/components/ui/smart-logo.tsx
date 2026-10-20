import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SmartLogo({
  src,
  alt,
  name,
  align = "center",
  className,
  containerClassName,
}: {
  src: string;
  alt: string;
  name: string;
  align?: "center" | "start";
  className?: string;
  containerClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative flex items-center h-full w-full", align === "start" ? "justify-start" : "justify-center", containerClassName)}>
      {!loaded && !failed && <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />}
      {failed ? (
        <div className={cn("h-12 w-12 rounded-lg bg-accent/10 text-accent font-bold grid place-items-center text-sm", align === "start" ? "mr-auto rtl:ml-auto rtl:mr-0" : "")}>
          {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            const img = e.currentTarget;
            const domain = (src.match(/https?:\/\/logo\.clearbit\.com\/(.+)$/)?.[1]) || "";
            const fallback = domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : "";
            if (fallback && img.src !== fallback) { img.src = fallback; return; }
            setFailed(true);
          }}
          className={cn(
            "w-full h-full object-contain transition-opacity duration-300 drop-shadow-sm",
            loaded ? "opacity-100" : "opacity-0",
            align === "start" ? "mr-auto rtl:ml-auto rtl:mr-0" : "",
            className
          )}
        />
      )}
    </div>
  );
}
