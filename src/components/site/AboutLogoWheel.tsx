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
    glow: "rgba(234, 109, 26, 0.65)",
    glowColor: "#ea6d1a",
  },
  av: {
    label: { en: "Audio / Video", ar: "الصوتيات والمرئيات" },
    href: "/services/audio-video" as any,
    color: "#9e6d21",
    glow: "rgba(158, 109, 33, 0.65)",
    glowColor: "#c48a2a",
  },
  automation: {
    label: { en: "Automation", ar: "أنظمة التحكم الذكي" },
    href: "/services/integration" as any,
    color: "#179939",
    glow: "rgba(23, 153, 57, 0.65)",
    glowColor: "#1fb84a",
  },
  network: {
    label: { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" },
    href: "/services/network" as any,
    color: "#4e8fcc",
    glow: "rgba(78, 143, 204, 0.65)",
    glowColor: "#60a8e8",
  },
};

// Exact sector path data extracted from Artboard 39.svg (583.45×583.45 viewBox)
// Each sector uses the UNION of both outer (light) + inner (dark) ring paths for a precise hit area
const SECTOR_PATHS: Record<NonNullable<SectorKey>, { outer: string; inner: string }> = {
  security: {
    // Orange — large top-right + right + bottom-right sector
    outer: "M291.73,291.73,113.82,64.83A288.39,288.39,0,0,1,291.73,3.4c158.17,0,288.33,130.16,288.33,288.33A288.29,288.29,0,0,1,530.76,453Z",
    inner: "M291.73,291.73,154.16,116.29A222.94,222.94,0,0,1,291.73,68.78c122.3,0,222.94,100.64,222.94,223A223,223,0,0,1,476.56,416.4Z",
  },
  av: {
    // Bronze — bottom sector
    outer: "M291.73,291.73,531,452.63a288.31,288.31,0,0,1-405.77,74.48Z",
    inner: "M291.73,291.73l185,124.41A223,223,0,0,1,163,473.74Z",
  },
  automation: {
    // Green — left + bottom-left sector
    outer: "M291.73,291.73,125.22,527.12A288.37,288.37,0,0,1,5.27,258.92Z",
    inner: "M291.73,291.73,163,473.76a222.92,222.92,0,0,1-92.77-207.4Z",
  },
  network: {
    // Blue — top-left sector
    outer: "M291.73,291.73,5.22,259.35A288.35,288.35,0,0,1,113.81,64.84Z",
    inner: "M291.73,291.73l-221.54-25a222.93,222.93,0,0,1,84-150.41Z",
  },
};

/**
 * About page logo: shows the actual Artboard 39.svg with a precise
 * transparent SVG overlay that captures hover events using the EXACT
 * sector path shapes from the original file.
 */
export function AboutLogoWheel({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [hovered, setHovered] = useState<SectorKey>(null);

  const info = hovered ? SECTOR_INFO[hovered] : null;

  return (
    <div className={`relative mx-auto w-full max-w-[440px] sm:max-w-[480px] flex flex-col items-center ${className}`}>
      {/* Ambient glow aura */}
      <div
        className="absolute inset-4 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-70"
        style={{
          background: info
            ? `radial-gradient(circle, ${info.glow} 0%, transparent 72%)`
            : "radial-gradient(circle, rgba(234,109,26,0.1) 0%, rgba(78,143,204,0.08) 50%, transparent 72%)",
          transform: hovered ? "scale(1.2)" : "scale(1)",
        }}
      />

      <div className="relative w-full aspect-square">
        {/* ── LAYER 1: Actual SVG file image ── */}
        <img
          src={artboard39Logo}
          alt="Integrated Technics — Systems Wheel"
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
          style={{
            // When hovering, dim the overall image so the glowing sector stands out
            filter: hovered ? "brightness(0.62) saturate(0.55)" : "brightness(1) saturate(1)",
            transition: "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* ── LAYER 2: Bright highlight of ONLY the hovered sector ──
            Uses the same SVG viewBox as Artboard 39 so paths line up pixel-perfect */}
        <svg
          viewBox="0 0 583.45 583.45"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          {hovered && info && (
            <g style={{ filter: `drop-shadow(0 0 20px ${info.glow})` }}>
              {/* Re-fill just the hovered sector at boosted brightness */}
              <path
                d={SECTOR_PATHS[hovered].outer}
                fill={info.glowColor}
                opacity="0.9"
              />
              <path
                d={SECTOR_PATHS[hovered].inner}
                fill={info.color}
                opacity="0.92"
              />
            </g>
          )}
        </svg>

        {/* ── LAYER 3: Transparent SVG overlay — exact sector paths as click/hover targets ── */}
        <svg
          viewBox="0 0 583.45 583.45"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          style={{ cursor: hovered ? "pointer" : "default" }}
        >
          {(Object.keys(SECTOR_PATHS) as NonNullable<SectorKey>[]).map((key) => {
            const sInfo = SECTOR_INFO[key];
            return (
              <Link key={key} to={sInfo.href}>
                <g
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                >
                  {/* Transparent outer ring hit area */}
                  <path
                    d={SECTOR_PATHS[key].outer}
                    fill="transparent"
                    stroke="none"
                  />
                  {/* Transparent inner ring hit area */}
                  <path
                    d={SECTOR_PATHS[key].inner}
                    fill="transparent"
                    stroke="none"
                  />
                </g>
              </Link>
            );
          })}
        </svg>
      </div>

      {/* Sector name label below */}
      <div
        className="mt-3 text-center text-sm font-bold tracking-wide min-h-[22px] transition-all duration-300"
        style={{
          color: info?.color ?? "transparent",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(5px)",
        }}
      >
        {info?.label[lang] ?? ""}
      </div>
    </div>
  );
}
