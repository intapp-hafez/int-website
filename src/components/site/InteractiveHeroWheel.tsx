import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import {
  Flame,
  Volume2,
  Tv,
  Presentation,
  Radio,
  Home,
  Lightbulb,
  Cpu,
  Workflow,
  Network,
  Server,
  Cable,
  Cloud,
  Calculator,
  ScanSearch,
  ShieldAlert,
  UserCheck,
  Radar,
  Smartphone,
  Fence,
  Users,
  Sparkles,
  ArrowUpRight,
  Shield,
  Layers,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type SectorId = "security" | "av" | "automation" | "network";

interface SubServiceNode {
  id: string;
  angle: number; // degrees from top (0 deg is top)
  icon: any;
  title: { en: string; ar: string };
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface SectorInfo {
  id: SectorId;
  title: { en: string; ar: string };
  shortName: { en: string; ar: string };
  subtitle: { en: string; ar: string };
  href: string;
  startAngle: number;
  endAngle: number;
  color: string;
  activeGlow: string;
  bgGradient: string;
  textColor: string;
  nodes: SubServiceNode[];
}

export function InteractiveHeroWheel({ className = "" }: { className?: string }) {
  const { lang, dir } = useI18n();
  const isRtl = dir === "rtl";
  const [activeHover, setActiveHover] = useState<SectorId | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // 4 Major Sectors
  const sectors: SectorInfo[] = [
    {
      id: "security",
      title: { en: "INTEGRATED SECURITY SOLUTIONS", ar: "أنظمة الأمن المتكاملة" },
      shortName: { en: "Security Systems", ar: "الأنظمة الأمنية" },
      subtitle: { en: "10 Specialized Surveillance & Life Safety Systems", ar: "١٠ أنظمة أمن وسلامة ومراقبة متطورة" },
      href: "/services/security",
      startAngle: -25,
      endAngle: 125,
      color: "#ea580c", // Vibrant Orange
      activeGlow: "rgba(234, 88, 12, 0.55)",
      bgGradient: "from-orange-500/30 via-amber-500/20 to-transparent",
      textColor: "text-orange-500 dark:text-orange-400",
      nodes: [
        { id: "pos", angle: -17, icon: Calculator, title: { en: "Retail & POS Security", ar: "أمن نقاط البيع والتحصيل" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "anpr", angle: -2, icon: ScanSearch, title: { en: "ANPR / License Plate Recognition", ar: "التعرف على لوحات المركبات (LPR)" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "uvss", angle: 13, icon: ShieldAlert, title: { en: "Under Vehicle Surveillance (UVSS)", ar: "فحص وتفتيش أسفل المركبات" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "visitor", angle: 28, icon: UserCheck, title: { en: "Visitor & Identity Management", ar: "إدارة الزوار والهويات الرقمية" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "perimeter", angle: 43, icon: Radar, title: { en: "Perimeter Intrusion Detection (PIDS)", ar: "حماية وكشف التسلل المحيطي" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "fire", angle: 58, icon: Flame, title: { en: "Fire Alarm & Life Safety", ar: "إنذار الحريق والسلامة" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "mobile-access", angle: 73, icon: Smartphone, title: { en: "Mobile Credentials & Smart Access", ar: "التحكم بالوصول عبر الجوال" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "barriers", angle: 88, icon: Fence, title: { en: "Speed Gates, Turnstiles & Blockers", ar: "البوابات الأمنية والمصدات الهيدروليكية" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "face-rec", angle: 103, icon: Users, title: { en: "Facial Recognition & Video AI", ar: "التعرف على الوجوه وتحليلات الفيديو" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
        { id: "wireless-cctv", angle: 118, icon: Radio, title: { en: "Wireless CCTV Transmission", ar: "النقل اللاسلكي لكاميرات المراقبة" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-200" },
      ],
    },
    {
      id: "av",
      title: { en: "AUDIO / VIDEO", ar: "الأنظمة الصوتية والمرئية" },
      shortName: { en: "Audio & Video", ar: "الصوتيات والمرئيات" },
      subtitle: { en: "6 Immersive AV, Video Wall & PA Systems", ar: "٦ أنظمة مرئية وشاشات جدارية وصوتية" },
      href: "/services/audio-video",
      startAngle: 125,
      endAngle: 190,
      color: "#a16207", // Warm Bronze/Gold
      activeGlow: "rgba(161, 98, 7, 0.55)",
      bgGradient: "from-amber-600/30 via-yellow-600/20 to-transparent",
      textColor: "text-amber-600 dark:text-amber-400",
      nodes: [
        { id: "sound", angle: 133, icon: Volume2, title: { en: "Pro Sound Systems & PA", ar: "الأنظمة الصوتية الاحترافية والإذاعة" }, href: "/services/audio-video", color: "#a16207", bgColor: "bg-[#a16207]", borderColor: "border-amber-200" },
        { id: "videowall", angle: 149, icon: Tv, title: { en: "LED Video Walls & Displays", ar: "شاشات العرض والجدارية LED" }, href: "/services/audio-video", color: "#a16207", bgColor: "bg-[#a16207]", borderColor: "border-amber-200" },
        { id: "conferencing", angle: 165, icon: Presentation, title: { en: "Smart Meeting Rooms & Telepresence", ar: "قاعات المؤتمرات الذكية" }, href: "/services/audio-video", color: "#a16207", bgColor: "bg-[#a16207]", borderColor: "border-amber-200" },
        { id: "signage", angle: 181, icon: Radio, title: { en: "Digital Signage & Kiosks", ar: "الشاشات الرقمية التفاعلية" }, href: "/services/audio-video", color: "#a16207", bgColor: "bg-[#a16207]", borderColor: "border-amber-200" },
      ],
    },
    {
      id: "automation",
      title: { en: "AUTOMATION & SMART BMS", ar: "التحكم والأنظمة الذكية" },
      shortName: { en: "Smart Automation", ar: "أنظمة التحكم الذكي" },
      subtitle: { en: "4 Intelligent IoT & Energy Optimization Modules", ar: "٤ حلول للأتمتة الذكية والتحكم بالطاقة" },
      href: "/services/integration",
      startAngle: 190,
      endAngle: 265,
      color: "#16a34a", // Emerald Green
      activeGlow: "rgba(22, 163, 74, 0.55)",
      bgGradient: "from-emerald-500/30 via-green-600/20 to-transparent",
      textColor: "text-emerald-600 dark:text-emerald-400",
      nodes: [
        { id: "smarthome", angle: 200, icon: Home, title: { en: "Smart Home & Building BMS", ar: "المباني والمنازل الذكية" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-200" },
        { id: "lighting", angle: 218, icon: Lightbulb, title: { en: "Lighting & Energy Control", ar: "التحكم بالطاقة والإضاءة" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-200" },
        { id: "iot", angle: 236, icon: Cpu, title: { en: "IoT & Environmental Sensors", ar: "إنترنت الأشياء والحساسات" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-200" },
        { id: "workflow", angle: 254, icon: Workflow, title: { en: "Unified Central Automation Layer", ar: "التكامل التشغيلي الموحد" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-200" },
      ],
    },
    {
      id: "network",
      title: { en: "NETWORK INFRASTRUCTURE", ar: "البنية التحتية للشبكات" },
      shortName: { en: "Network Infrastructure", ar: "الشبكات والبنية التحتية" },
      subtitle: { en: "4 High-Speed Data Center & Fiber Backbones", ar: "٤ ركائز لغرف الخوادم وشبكات الألياف" },
      href: "/services/network",
      startAngle: 265,
      endAngle: 335,
      color: "#0284c7", // Electric Sky Blue
      activeGlow: "rgba(2, 132, 199, 0.55)",
      bgGradient: "from-sky-500/30 via-blue-600/20 to-transparent",
      textColor: "text-sky-600 dark:text-sky-400",
      nodes: [
        { id: "datacenter", angle: 275, icon: Server, title: { en: "Data Center Infrastructure & Racks", ar: "مراكز البيانات والخوادم" }, href: "/services/data-centers", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-200" },
        { id: "cabling", angle: 293, icon: Cable, title: { en: "Fiber Optic & Structured Cabling", ar: "كابلات الألياف الضوئية" }, href: "/services/network", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-200" },
        { id: "routing", angle: 311, icon: Network, title: { en: "Enterprise Switching & SDN Core", ar: "شبكات التبديل المتقدمة" }, href: "/services/network", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-200" },
        { id: "cloud", angle: 328, icon: Cloud, title: { en: "Cloud Security & Cyber Gateways", ar: "الحوسبة السحابية وحماية الشبكة" }, href: "/services/network", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-200" },
      ],
    },
  ];

  // Coordinate helper (0 = top)
  const getCoordinates = (angleDeg: number, radius: number, cx = 250, cy = 250) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  };

  // Generate SVG annular sector path
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

  // Curved text path
  const describeTextArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number, sweep = 1) => {
    const p1 = getCoordinates(startAngle, r, cx, cy);
    const p2 = getCoordinates(endAngle, r, cx, cy);
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`;
  };

  const currentSector = sectors.find((s) => s.id === activeHover);

  return (
    <TooltipProvider delayDuration={50}>
      <div className={`relative mx-auto w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[560px] aspect-square select-none flex flex-col items-center justify-center ${className}`}>
        
        {/* Dynamic Glow Aura reacting to active sector color */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-75 transition-all duration-500 pointer-events-none"
          style={{
            background: currentSector
              ? `radial-gradient(circle, ${currentSector.activeGlow} 0%, rgba(0,0,0,0) 72%)`
              : "radial-gradient(circle, rgba(234,88,12,0.2) 0%, rgba(2,132,199,0.15) 50%, rgba(0,0,0,0) 72%)",
            transform: activeHover ? "scale(1.2)" : "scale(1)",
          }}
        />

        {/* The SVG Diagram Base */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full drop-shadow-2xl overflow-visible pointer-events-auto"
        >
          <defs>
            {/* Sector Text Paths */}
            {sectors.map((s) => {
              const isBottom = s.startAngle >= 90 && s.startAngle < 270;
              const r = 143;
              const pathD = isBottom
                ? describeTextArc(250, 250, r, s.endAngle - 2, s.startAngle + 2, 0)
                : describeTextArc(250, 250, r, s.startAngle + 2, s.endAngle - 2, 1);
              return <path key={`textpath-${s.id}`} id={`sector-arc-${s.id}`} d={pathD} fill="none" />;
            })}

            {/* High-Resolution Dynamic Gradients (Standard and High-Definition Saturated Hover) */}
            <linearGradient id="grad-security" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-security-active" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7a18" stopOpacity="1" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="1" />
              <stop offset="100%" stopColor="#7c2d12" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="grad-av" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b45309" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-av-active" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="50%" stopColor="#b45309" stopOpacity="1" />
              <stop offset="100%" stopColor="#451a03" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="grad-automation" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#14532d" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-automation-active" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
              <stop offset="50%" stopColor="#16a34a" stopOpacity="1" />
              <stop offset="100%" stopColor="#052e16" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="grad-network" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0c4a6e" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-network-active" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="1" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Outer Guide Track Circle */}
          <circle
            cx="250"
            cy="250"
            r="205"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="text-border/40 transition-colors duration-500"
          />

          {/* 4 Interactive Category Sector Arcs */}
          {sectors.map((s) => {
            const isHovered = activeHover === s.id;
            const isDimmed = activeHover !== null && !isHovered;

            // Expand radius slightly when hovered for pop-out 3D action
            const rInner = isHovered ? 101 : 106;
            const rOuter = isHovered ? 184 : 177;

            const textStyle =
              s.id === "network"
                ? "text-[9.5px] sm:text-[10px] tracking-normal font-bold"
                : s.id === "security"
                ? "text-[10.5px] sm:text-[11px] tracking-wider font-bold"
                : "text-[11px] sm:text-[12px] tracking-widest font-bold";

            return (
              <g
                key={s.id}
                className="transition-all duration-300 cursor-pointer pointer-events-auto"
                onMouseEnter={() => setActiveHover(s.id)}
                onMouseLeave={() => setActiveHover(null)}
                style={{
                  filter: isHovered
                    ? `drop-shadow(0 0 16px ${s.color}) brightness(1.2) contrast(1.15)`
                    : isDimmed
                    ? "brightness(0.6) opacity(0.35)"
                    : "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <Link to={s.href as any} className="outline-none">
                  {/* Sector Arc Wedge */}
                  <path
                    d={describeArcSector(250, 250, rInner, rOuter, s.startAngle + 1.2, s.endAngle - 1.2)}
                    fill={isHovered ? `url(#grad-${s.id}-active)` : `url(#grad-${s.id})`}
                    stroke={isHovered ? "#ffffff" : "rgba(255,255,255,0.45)"}
                    strokeWidth={isHovered ? "3" : "1.5"}
                    className="transition-all duration-300 transform-gpu origin-center cursor-pointer"
                  />

                  {/* Curved Text Label */}
                  <text
                    className={`${textStyle} fill-white select-none pointer-events-none transition-all duration-300 ${
                      isHovered
                        ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] font-black"
                        : "drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    }`}
                  >
                    <textPath
                      href={`#sector-arc-${s.id}`}
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
            r="102"
            className="fill-card stroke-border/80 drop-shadow-xl transition-all duration-300"
            strokeWidth={activeHover ? "4" : "3"}
            style={{
              stroke: currentSector ? currentSector.color : undefined,
            }}
          />
        </svg>

        {/* Central Core Logo (Interactive -> Home) */}
        <Link
          to="/"
          className="absolute z-20 w-[184px] h-[184px] sm:w-[196px] sm:h-[196px] rounded-full bg-card border-2 border-border/80 shadow-2xl flex flex-col items-center justify-center p-5 sm:p-6 transition-all duration-500 group cursor-pointer overflow-hidden"
          style={{
            boxShadow: currentSector
              ? `0 0 28px ${currentSector.activeGlow}, inset 0 0 16px ${currentSector.activeGlow}`
              : undefined,
            borderColor: currentSector ? currentSector.color : undefined,
          }}
          title={lang === "ar" ? "الصفحة الرئيسية — إنتجريتد تكنيكس" : "Home — Integrated Technics"}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
            <img
              src="/ht-logo.svg"
              alt="Integrated Technics"
              className={`w-full h-auto max-h-[85px] sm:max-h-[92px] object-contain filter drop-shadow-md select-none transition-transform duration-500 ${
                activeHover ? "scale-105" : "group-hover:scale-105"
              }`}
              draggable={false}
            />
            {currentSector && (
              <div className="absolute -bottom-1 inset-x-0 text-center animate-in fade-in zoom-in-95 duration-200">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-md"
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

        {/* Outer Ring: Sub-Service Orbital Icon Nodes */}
        {sectors.flatMap((sector) =>
          sector.nodes.map((node) => {
            const coords = getCoordinates(node.angle, 205, 250, 250);
            const leftPct = (coords.x / 500) * 100;
            const topPct = (coords.y / 500) * 100;
            const Icon = node.icon;

            const isSectorActive = activeHover === sector.id;
            const isNodeActive = activeNode === node.id;
            const isOtherSector = activeHover !== null && !isSectorActive;

            return (
              <div
                key={node.id}
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-auto"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  opacity: isOtherSector ? 0.3 : 1,
                  transform: `translate(-50%, -50%) scale(${isNodeActive ? 1.4 : isSectorActive ? 1.2 : 1})`,
                }}
                onMouseEnter={() => {
                  setActiveHover(sector.id);
                  setActiveNode(node.id);
                }}
                onMouseLeave={() => {
                  setActiveNode(null);
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={node.href as any}
                      className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-white shadow-lg border-2 ${node.borderColor} ${node.bgColor} transition-all duration-300 cursor-pointer active:scale-90`}
                      style={{
                        boxShadow: isSectorActive
                          ? `0 0 14px ${node.color}, 0 4px 8px rgba(0,0,0,0.35)`
                          : undefined,
                      }}
                      aria-label={node.title[lang]}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-card/95 text-foreground backdrop-blur-md border px-3 py-1.5 rounded-xl shadow-2xl text-xs font-semibold z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: node.color }}
                      />
                      <span>{node.title[lang]}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })
        )}
      </div>
    </TooltipProvider>
  );
}
