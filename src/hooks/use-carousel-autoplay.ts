import { useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";

export function useCarouselAutoplay(delay = 4000) {
  const autoplayRef = useRef(
    Autoplay({ delay, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Embla may not be attached yet; play/stop throw before init.
        try {
          if (entry.isIntersecting) autoplayRef.current.play();
          else autoplayRef.current.stop();
        } catch {}
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { autoplayRef, containerRef };
}
