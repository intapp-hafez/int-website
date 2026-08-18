import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

type SectorKey = "security" | "av" | "automation" | "network" | null;

const SECTOR_INFO = {
  security: {
    label: { en: "Integrated Security Solutions", ar: "حلول الأمن المتكاملة" },
    href: "/services/security",
    color: "#ea6d1a",
    glow: "rgba(234, 109, 26, 0.6)",
  },
  av: {
    label: { en: "Audio / Video", ar: "الصوتيات والمرئيات" },
    href: "/services/audio-video",
    color: "#9e6d21",
    glow: "rgba(158, 109, 33, 0.6)",
  },
  automation: {
    label: { en: "Automation", ar: "أنظمة التحكم الذكي" },
    href: "/services/integration",
    color: "#179939",
    glow: "rgba(23, 153, 57, 0.6)",
  },
  network: {
    label: { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" },
    href: "/services/network",
    color: "#4e8fcc",
    glow: "rgba(78, 143, 204, 0.6)",
  },
};

export function AboutLogoWheel({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [hovered, setHovered] = useState<SectorKey>(null);

  const info = hovered ? SECTOR_INFO[hovered] : null;

  // Filter style: dim a sector when it's not the hovered one
  const sectorFilter = (key: SectorKey) => {
    if (!hovered) return {};
    if (hovered === key) {
      return {
        filter: `drop-shadow(0 0 18px ${SECTOR_INFO[key!]?.glow}) brightness(1.3) contrast(1.15) saturate(1.4)`,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      };
    }
    return {
      filter: "brightness(0.45) opacity(0.4)",
      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className}`}>
      {/* Dynamic ambient glow */}
      <div
        className="absolute inset-6 rounded-full blur-3xl opacity-75 pointer-events-none transition-all duration-700"
        style={{
          background: info
            ? `radial-gradient(circle, ${info.glow} 0%, transparent 75%)`
            : "radial-gradient(circle, rgba(234,109,26,0.15) 0%, rgba(78,143,204,0.12) 50%, transparent 75%)",
          transform: hovered ? "scale(1.2)" : "scale(1)",
        }}
      />

      {/* The actual SVG logo — inline for full CSS control over each sector */}
      <svg
        viewBox="0 0 583.45 583.45"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-[440px] sm:max-w-[480px] drop-shadow-2xl overflow-visible"
        style={{ isolation: "isolate" }}
      >
        <defs>
          <style>{`
            .lw-cls-5{fill:#aec8e7;}
            .lw-cls-6{fill:#acccae;}
            .lw-cls-7{fill:#e0c59c;}
            .lw-cls-8{fill:#f5af67;}
            .lw-cls-9{fill:#fff;}
            .lw-cls-10{fill:#e06a1b;}
            .lw-cls-11{fill:#686465;}
          `}</style>
        </defs>

        {/* ── SECTOR: Security (Orange) — largest, top-right ── */}
        <g
          className="cursor-pointer"
          style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)", ...sectorFilter("security") }}
          onMouseEnter={() => setHovered("security")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => {}}
        >
          <Link to="/services/security">
            {/* Outer light ring segment */}
            <path className="lw-cls-8" d="M291.73,291.73,113.82,64.83A288.39,288.39,0,0,1,291.73,3.4c158.17,0,288.33,130.16,288.33,288.33A288.29,288.29,0,0,1,530.76,453Z"/>
            {/* Inner darker segment */}
            <path fill="#ea6d1a" d="M291.73,291.73,154.16,116.29A222.94,222.94,0,0,1,291.73,68.78c122.3,0,222.94,100.64,222.94,223A223,223,0,0,1,476.56,416.4Z"/>
          </Link>
        </g>

        {/* ── SECTOR: Audio/Video (Bronze) — bottom-right ── */}
        <g
          className="cursor-pointer"
          style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)", ...sectorFilter("av") }}
          onMouseEnter={() => setHovered("av")}
          onMouseLeave={() => setHovered(null)}
        >
          <Link to="/services/audio-video">
            <path className="lw-cls-7" d="M291.73,291.73,531,452.63a288.31,288.31,0,0,1-405.77,74.48Z"/>
            <path fill="#9e6d21" d="M291.73,291.73l185,124.41A223,223,0,0,1,163,473.74Z"/>
          </Link>
        </g>

        {/* ── SECTOR: Automation (Green) — bottom-left ── */}
        <g
          className="cursor-pointer"
          style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)", ...sectorFilter("automation") }}
          onMouseEnter={() => setHovered("automation")}
          onMouseLeave={() => setHovered(null)}
        >
          <Link to="/services/integration">
            <path className="lw-cls-6" d="M291.73,291.73,125.22,527.12A288.37,288.37,0,0,1,5.27,258.92Z"/>
            <path fill="#179939" d="M291.73,291.73,163,473.76a222.92,222.92,0,0,1-92.77-207.4Z"/>
          </Link>
        </g>

        {/* ── SECTOR: Network Infrastructure (Blue) — top-left ── */}
        <g
          className="cursor-pointer"
          style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)", ...sectorFilter("network") }}
          onMouseEnter={() => setHovered("network")}
          onMouseLeave={() => setHovered(null)}
        >
          <Link to="/services/network">
            <path className="lw-cls-5" d="M291.73,291.73,5.22,259.35A288.35,288.35,0,0,1,113.81,64.84Z"/>
            <path fill="#4e8fcc" d="M291.73,291.73l-221.54-25a222.93,222.93,0,0,1,84-150.41Z"/>
          </Link>
        </g>

        {/* ── WHITE CENTER CIRCLE (always on top, not interactive) ── */}
        <circle fill="#fff" cx="291.73" cy="291.73" r="161.03"/>

        {/* ── CENTER LOGO CONTENT (IT logo marks) ── */}
        {/* Orange IT mark */}
        <path className="lw-cls-10" d="M292,284.59H268.39a17.31,17.31,0,0,0-7.82-12.47,21.8,21.8,0,0,0-12.91-3.49c-9.75.24-15.14,5.19-18.89,16H205c-.73-17.31,15-38.31,40.06-39.92C273.68,242.83,292.32,264.78,292,284.59Z"/>
        <path className="lw-cls-11" d="M293.89,286.87h23.5c4,11.13,10.14,15.82,20.47,15.55,9.61-.25,15.93-5.49,18.94-15.8h23.1a49.38,49.38,0,0,1-1.28,8.62,41.42,41.42,0,0,1-35.76,30.24c-16.22,1.63-30-3.25-40.38-16.13A37.2,37.2,0,0,1,293.89,286.87Z"/>
        <path className="lw-cls-11" d="M331.51,217.24v20.91H280.15V217.24Z"/>
        <path className="lw-cls-11" d="M317.24,285.33H293.89V241h23.35Z"/>
        <path className="lw-cls-10" d="M268.34,326V286.15h23.78V326Z"/>
        <path className="lw-cls-10" d="M228.78,325.85H205v-40h23.78Z"/>
        <path className="lw-cls-10" d="M229,239.4v8c-11.82,5.75-20.33,14.7-24.31,28.38V239.4Z"/>
        <polygon className="lw-cls-10" points="228.97 203.92 216.55 203.92 204.6 215.88 204.6 232.64 228.97 232.64 228.97 203.92"/>
        <polygon className="lw-cls-11" points="317.33 173.24 317.33 214.29 293.85 214.29 293.85 184.96 305.45 173.36 317.33 173.24"/>

        {/* Sector label dots/text in white center — the "integrated technics" text rows */}
        {/* Orange text row */}
        <rect className="lw-cls-10" x="290.17" y="340.63" width="2.73" height="18.19"/>
        <rect className="lw-cls-10" x="376.9" y="340.63" width="2.73" height="18.19"/>

        {/* Hover tooltip label at bottom of white circle */}
        {hovered && info && (
          <g>
            <rect
              x="191.73"
              y="418"
              width="200"
              height="24"
              rx="12"
              fill={info.color}
              opacity="0.92"
            />
            <text
              x="291.73"
              y="434"
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="700"
            >
              {info.label[lang]}
            </text>
          </g>
        )}
      </svg>

      {/* Sector label below */}
      <div
        className="mt-3 text-center text-sm font-semibold transition-all duration-300 min-h-[22px]"
        style={{ color: info?.color || "transparent" }}
      >
        {info ? info.label[lang] : ""}
      </div>
    </div>
  );
}
