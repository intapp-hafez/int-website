import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import artboard39Logo from "@/assets/artboard-39.svg";

type SectorKey = "security" | "av" | "automation" | "network" | null;

const SECTOR_INFO = {
  security: {
    label: { en: "Integrated Security Solutions", ar: "حلول الأمن المتكاملة" },
    href: "/services/security" as any,
    color: "#ea6d1a",
    glow: "rgba(234, 109, 26, 0.55)",
  },
  av: {
    label: { en: "Audio / Video", ar: "الصوتيات والمرئيات" },
    href: "/services/audio-video" as any,
    color: "#9e6d21",
    glow: "rgba(158, 109, 33, 0.55)",
  },
  automation: {
    label: { en: "Automation", ar: "أنظمة التحكم الذكي" },
    href: "/services/integration" as any,
    color: "#179939",
    glow: "rgba(23, 153, 57, 0.55)",
  },
  network: {
    label: { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" },
    href: "/services/network" as any,
    color: "#4e8fcc",
    glow: "rgba(78, 143, 204, 0.55)",
  },
};

/**
 * About page logo display using the actual Artboard 39 SVG file.
 * Hover regions are transparent absolute-positioned overlays clipped to each sector.
 * On hover: the entire logo image dims and only the relevant sector glows through.
 */
export function AboutLogoWheel({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [hovered, setHovered] = useState<SectorKey>(null);

  const info = hovered ? SECTOR_INFO[hovered] : null;

  // Sector clip-paths defined as polygon percentages matching each SVG sector position
  // (approximate bounding regions for each of the 4 sectors in the 583×583 viewBox)
  // These are clip regions relative to the 100%×100% container
  const sectors: {
    key: SectorKey;
    // polygon points as "x% y%" pairs
    clip: string;
    // approximate sector center for glow positioning
    glowX: string;
    glowY: string;
  }[] = [
    {
      key: "security",
      // Large top-right orange sector (~60% of the circle)
      clip: "polygon(50% 50%, 28% 0%, 100% 0%, 100% 100%, 91% 100%)",
      glowX: "75%",
      glowY: "30%",
    },
    {
      key: "av",
      // Bottom-right bronze sector
      clip: "polygon(50% 50%, 91% 100%, 20% 100%)",
      glowX: "75%",
      glowY: "82%",
    },
    {
      key: "automation",
      // Bottom-left green sector
      clip: "polygon(50% 50%, 20% 100%, 0% 60%, 0% 0%, 5% 0%)",
      glowX: "18%",
      glowY: "72%",
    },
    {
      key: "network",
      // Top-left blue sector
      clip: "polygon(50% 50%, 5% 0%, 28% 0%)",
      glowX: "22%",
      glowY: "25%",
    },
  ];

  return (
    <div className={`relative mx-auto w-full max-w-[440px] sm:max-w-[480px] flex flex-col items-center ${className}`}>
      {/* Ambient radial glow behind whole logo */}
      <div
        className="absolute inset-4 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-70"
        style={{
          background: info
            ? `radial-gradient(circle, ${info.glow} 0%, transparent 75%)`
            : "radial-gradient(circle, rgba(234,109,26,0.12) 0%, rgba(78,143,204,0.10) 50%, transparent 75%)",
          transform: hovered ? "scale(1.18)" : "scale(1)",
        }}
      />

      {/* Actual SVG logo image */}
      <div className="relative w-full aspect-square">
        <img
          src={artboard39Logo}
          alt="Integrated Technics — Systems Diagram"
          className="w-full h-full object-contain select-none"
          draggable={false}
          style={{
            // When a sector is hovered, darken/desaturate the whole image slightly
            // so the glow overlay stands out
            filter: hovered
              ? "brightness(0.72) saturate(0.7)"
              : "none",
            transition: "filter 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Transparent hover overlay regions — one per sector */}
        {sectors.map(({ key, clip, glowX, glowY }) => {
          const isActive = hovered === key;
          const sectorInfo = SECTOR_INFO[key!];
          return (
            <div
              key={key}
              className="absolute inset-0 cursor-pointer"
              style={{ clipPath: clip }}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link to={sectorInfo.href} className="block w-full h-full outline-none">
                {/* Glow overlay that appears only on hovered sector */}
                <div
                  className="absolute inset-0 transition-opacity duration-350"
                  style={{
                    background: isActive
                      ? `radial-gradient(ellipse 60% 55% at ${glowX} ${glowY}, ${sectorInfo.glow} 0%, transparent 80%)`
                      : "transparent",
                    opacity: isActive ? 1 : 0,
                    mixBlendMode: "screen",
                  }}
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Sector label that appears below the logo */}
      <div
        className="mt-3 text-center text-sm font-bold transition-all duration-300 min-h-[22px] tracking-wide"
        style={{
          color: info?.color ?? "transparent",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(4px)",
        }}
      >
        {info?.label[lang] ?? ""}
      </div>
    </div>
  );
}
