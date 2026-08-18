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
    tint: "rgba(234, 109, 26, 0.22)",
    glow: "rgba(234, 109, 26, 0.5)",
  },
  av: {
    label: { en: "Audio / Video", ar: "الصوتيات والمرئيات" },
    href: "/services/audio-video" as any,
    color: "#9e6d21",
    tint: "rgba(158, 109, 33, 0.22)",
    glow: "rgba(158, 109, 33, 0.5)",
  },
  automation: {
    label: { en: "Automation", ar: "أنظمة التحكم الذكي" },
    href: "/services/integration" as any,
    color: "#179939",
    tint: "rgba(23, 153, 57, 0.22)",
    glow: "rgba(23, 153, 57, 0.5)",
  },
  network: {
    label: { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" },
    href: "/services/network" as any,
    color: "#4e8fcc",
    tint: "rgba(78, 143, 204, 0.22)",
    glow: "rgba(78, 143, 204, 0.5)",
  },
};

// Exact sector path data from Artboard 39.svg (viewBox 0 0 583.45 583.45)
// Each sector combines outer ring + inner ring for a full hit area
const SECTOR_PATHS: Record<NonNullable<SectorKey>, string[]> = {
  security: [
    "M291.73,291.73,113.82,64.83A288.39,288.39,0,0,1,291.73,3.4c158.17,0,288.33,130.16,288.33,288.33A288.29,288.29,0,0,1,530.76,453Z",
    "M291.73,291.73,154.16,116.29A222.94,222.94,0,0,1,291.73,68.78c122.3,0,222.94,100.64,222.94,223A223,223,0,0,1,476.56,416.4Z",
  ],
  av: [
    "M291.73,291.73,531,452.63a288.31,288.31,0,0,1-405.77,74.48Z",
    "M291.73,291.73l185,124.41A223,223,0,0,1,163,473.74Z",
  ],
  automation: [
    "M291.73,291.73,125.22,527.12A288.37,288.37,0,0,1,5.27,258.92Z",
    "M291.73,291.73,163,473.76a222.92,222.92,0,0,1-92.77-207.4Z",
  ],
  network: [
    "M291.73,291.73,5.22,259.35A288.35,288.35,0,0,1,113.81,64.84Z",
    "M291.73,291.73l-221.54-25a222.93,222.93,0,0,1,84-150.41Z",
  ],
};

export function AboutLogoWheel({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [hovered, setHovered] = useState<SectorKey>(null);

  const info = hovered ? SECTOR_INFO[hovered] : null;

  return (
    <div className={`relative mx-auto w-full max-w-[440px] sm:max-w-[480px] flex flex-col items-center ${className}`}>
      {/* Ambient glow behind logo reacts to hovered sector */}
      <div
        className="absolute inset-4 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
        style={{
          background: info
            ? `radial-gradient(circle, ${info.glow} 0%, transparent 70%)`
            : "radial-gradient(circle, rgba(234,109,26,0.1) 0%, rgba(78,143,204,0.08) 60%, transparent 80%)",
          transform: hovered ? "scale(1.18)" : "scale(1)",
        }}
      />

      <div className="relative w-full aspect-square">
        {/* ── LAYER 1: Original SVG image — always at full brightness ── */}
        <img
          src={artboard39Logo}
          alt="Integrated Technics — Systems Wheel"
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
          style={{
            // Subtle dim on non-hovered state; stays mostly bright
            filter: hovered ? "brightness(0.82) saturate(0.8)" : "brightness(1) saturate(1)",
            transition: "filter 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* ── LAYER 2: Tint + brightness overlay on hovered sector only ──
            Fills the hovered sector with a semi-transparent color tint (low opacity)
            so the original SVG detail (text, icons, gradients) shows through.
            Also acts as the brightness re-boost for just that sector. */}
        <svg
          viewBox="0 0 583.45 583.45"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          {(Object.keys(SECTOR_PATHS) as NonNullable<SectorKey>[]).map((key) => {
            const sInfo = SECTOR_INFO[key];
            const isActive = hovered === key;
            return (
              <g
                key={key}
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 22px ${sInfo.glow}) brightness(1.35) contrast(1.1) saturate(1.3)`
                    : "none",
                  transition: "filter 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: isActive ? 1 : 0,
                }}
              >
                {SECTOR_PATHS[key].map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill={sInfo.tint}
                    stroke={isActive ? sInfo.color : "none"}
                    strokeWidth={isActive ? "2.5" : "0"}
                    strokeOpacity="0.7"
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* ── LAYER 3: Transparent SVG — exact hit areas per sector ── */}
        <svg
          viewBox="0 0 583.45 583.45"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
        >
          {(Object.keys(SECTOR_PATHS) as NonNullable<SectorKey>[]).map((key) => (
            <Link key={key} to={SECTOR_INFO[key].href}>
              <g
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                {SECTOR_PATHS[key].map((d, i) => (
                  <path key={i} d={d} fill="transparent" stroke="none" />
                ))}
              </g>
            </Link>
          ))}
        </svg>
      </div>

      {/* Sector name label — fades in below the logo on hover */}
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
