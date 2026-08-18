import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Sparkles, ArrowUpRight } from "lucide-react";

export type AboutSectorId = "security" | "av" | "automation" | "network";

interface AboutSectorInfo {
  id: AboutSectorId;
  title: { en: string; ar: string };
  shortName: { en: string; ar: string };
  href: string;
  startAngle: number;
  endAngle: number;
  color: string;
  activeGlow: string;
}

export function AboutLogoWheel({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [activeHover, setActiveHover] = useState<AboutSectorId | null>(null);

  // 4 Major Sectors corresponding directly to the logo on the About Page
  const sectors: AboutSectorInfo[] = [
    {
      id: "security",
      title: { en: "Integrated Security Solutions", ar: "حلول الأمن المتكاملة" },
      shortName: { en: "Security Solutions", ar: "الأنظمة الأمنية" },
      href: "/services/security",
      startAngle: -25,
      endAngle: 125,
      color: "#ea580c", // Brand Orange
      activeGlow: "rgba(234, 88, 12, 0.65)",
    },
    {
      id: "av",
      title: { en: "Audio / Video", ar: "الصوتيات والمرئيات" },
      shortName: { en: "Audio & Video", ar: "الصوتيات والمرئيات" },
      href: "/services/audio-video",
      startAngle: 125,
      endAngle: 190,
      color: "#a16207", // Bronze / Gold
      activeGlow: "rgba(161, 98, 7, 0.65)",
    },
    {
      id: "automation",
      title: { en: "Automation", ar: "أنظمة التحكم الذكي" },
      shortName: { en: "Automation", ar: "الأتمتة والتحكم" },
      href: "/services/integration",
      startAngle: 190,
      endAngle: 265,
      color: "#16a34a", // Emerald Green
      activeGlow: "rgba(22, 163, 74, 0.65)",
    },
    {
      id: "network",
      title: { en: "Network Infrastructure", ar: "البنية التحتية للشبكات" },
      shortName: { en: "Network Infrastructure", ar: "الشبكات والبنية التحتية" },
      href: "/services/network",
      startAngle: 265,
      endAngle: 335,
      color: "#0284c7", // Electric Sky Blue
      activeGlow: "rgba(2, 132, 199, 0.65)",
    },
  ];

  const getCoordinates = (angleDeg: number, radius: number, cx = 250, cy = 250) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  };

  const describeArcSector = (
    cx: number,
    cy: number,
    rInner: number,
    rOuter: number,
    startAngle: number,
    endAngle: number
  ) => {
    const p1 = getCoordinates(startAngle, rInner, cx, cy);
    const p2 = getCoordinates(startAngle, rOuter, cx, cy);
    const p3 = getCoordinates(endAngle, rOuter, cx, cy);
    const p4 = getCoordinates(endAngle, rInner, cx, cy);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    return `
      M ${p1.x} ${p1.y}
      L ${p2.x} ${p2.y}
      A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p3.x} ${p3.y}
      L ${p4.x} ${p4.y}
      A ${rInner} ${rInner} 0 ${largeArc} 0 ${p1.x} ${p1.y}
      Z
    `;
  };

  const describeTextArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number, sweep = 1) => {
    const p1 = getCoordinates(startAngle, r, cx, cy);
    const p2 = getCoordinates(endAngle, r, cx, cy);
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`;
  };

  const currentSector = sectors.find((s) => s.id === activeHover);

  return (
    <div className={`relative mx-auto w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[500px] aspect-square select-none flex flex-col items-center justify-center ${className}`}>
      {/* Dynamic Ambient Background Glow Aura */}
      <div
        className="absolute inset-4 rounded-full blur-3xl opacity-80 transition-all duration-700 pointer-events-none"
        style={{
          background: currentSector
            ? `radial-gradient(circle, ${currentSector.activeGlow} 0%, rgba(0,0,0,0) 75%)`
            : "radial-gradient(circle, rgba(234,88,12,0.2) 0%, rgba(2,132,199,0.15) 50%, rgba(0,0,0,0) 75%)",
          transform: activeHover ? "scale(1.25)" : "scale(1)",
        }}
      />

      {/* The SVG Diagram Base */}
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full drop-shadow-2xl overflow-visible pointer-events-auto"
      >
        <defs>
          {sectors.map((s) => {
            const isBottom = s.startAngle >= 90 && s.startAngle < 270;
            const r = 168;
            const pathD = isBottom
              ? describeTextArc(250, 250, r, s.endAngle - 3, s.startAngle + 3, 0)
              : describeTextArc(250, 250, r, s.startAngle + 3, s.endAngle - 3, 1);
            return <path key={`textpath-${s.id}`} id={`about-sector-arc-${s.id}`} d={pathD} fill="none" />;
          })}

          {/* Gradients */}
          <linearGradient id="about-grad-security" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="about-grad-security-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7a18" stopOpacity="1" />
            <stop offset="45%" stopColor="#ea580c" stopOpacity="1" />
            <stop offset="100%" stopColor="#6c2209" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="about-grad-av" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="about-grad-av-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="45%" stopColor="#b45309" stopOpacity="1" />
            <stop offset="100%" stopColor="#3d1602" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="about-grad-automation" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#14532d" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="about-grad-automation-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="45%" stopColor="#16a34a" stopOpacity="1" />
            <stop offset="100%" stopColor="#042311" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="about-grad-network" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="about-grad-network-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="45%" stopColor="#0284c7" stopOpacity="1" />
            <stop offset="100%" stopColor="#062539" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 4 Interactive Category Sector Arcs */}
        {sectors.map((s) => {
          const isHovered = activeHover === s.id;
          const isDimmed = activeHover !== null && !isHovered;

          const rInner = isHovered ? 104 : 110;
          const rOuter = isHovered ? 236 : 225;

          const textStyle =
            s.id === "network"
              ? "text-[12.5px] sm:text-[13.5px] tracking-normal font-bold"
              : s.id === "security"
              ? "text-[13px] sm:text-[14px] tracking-wide font-bold"
              : "text-[14px] sm:text-[15px] tracking-wider font-bold";

          return (
            <g
              key={s.id}
              className="cursor-pointer pointer-events-auto"
              onMouseEnter={() => setActiveHover(s.id)}
              onMouseLeave={() => setActiveHover(null)}
              style={{
                filter: isHovered
                  ? `drop-shadow(0 0 20px ${s.color}) brightness(1.25) contrast(1.2)`
                  : isDimmed
                  ? "brightness(0.55) opacity(0.35)"
                  : "none",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <Link to={s.href as any} className="outline-none">
                <path
                  d={describeArcSector(250, 250, rInner, rOuter, s.startAngle + 1.2, s.endAngle - 1.2)}
                  fill={isHovered ? `url(#about-grad-${s.id}-active)` : `url(#about-grad-${s.id})`}
                  stroke={isHovered ? "#ffffff" : "rgba(255,255,255,0.5)"}
                  strokeWidth={isHovered ? "3.5" : "2"}
                  className="transition-all duration-300 transform-gpu origin-center cursor-pointer"
                />

                <text
                  className={`${textStyle} fill-white select-none pointer-events-none transition-all duration-300 ${
                    isHovered
                      ? "drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] font-black"
                      : "drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
                  }`}
                >
                  <textPath
                    href={`#about-sector-arc-${s.id}`}
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    {s.title[lang]}
                  </textPath>
                </text>
              </Link>
            </g>
          );
        })}

        {/* Center Inner Circle Base */}
        <circle
          cx="250"
          cy="250"
          r="106"
          className="fill-card stroke-border/80 drop-shadow-2xl transition-all duration-300"
          strokeWidth={activeHover ? "4" : "3"}
          style={{
            stroke: currentSector ? currentSector.color : undefined,
          }}
        />
      </svg>

      {/* Central Core Logo (Interactive -> Home) */}
      <Link
        to="/"
        className="absolute z-20 w-[190px] h-[190px] sm:w-[205px] sm:h-[205px] rounded-full bg-card border-2 border-border/80 shadow-2xl flex flex-col items-center justify-center p-5 sm:p-6 transition-all duration-500 group cursor-pointer overflow-hidden"
        style={{
          boxShadow: currentSector
            ? `0 0 32px ${currentSector.activeGlow}, inset 0 0 18px ${currentSector.activeGlow}`
            : undefined,
          borderColor: currentSector ? currentSector.color : undefined,
        }}
        title={lang === "ar" ? "الصفحة الرئيسية — إنتجريتد تكنيكس" : "Home — Integrated Technics"}
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
          <img
            src="/ht-logo.svg"
            alt="Integrated Technics"
            className={`w-full h-auto max-h-[90px] sm:max-h-[98px] object-contain filter drop-shadow-md select-none transition-transform duration-500 ${
              activeHover ? "scale-105" : "group-hover:scale-105"
            }`}
            draggable={false}
          />
          {currentSector && (
            <div className="absolute -bottom-1 inset-x-0 text-center animate-in fade-in zoom-in-95 duration-200">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-lg"
                style={{ backgroundColor: currentSector.color }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>{currentSector.shortName[lang]}</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
