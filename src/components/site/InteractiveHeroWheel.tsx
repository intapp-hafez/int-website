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
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  id: string;
  title: { en: string; ar: string };
  href: string;
  startAngle: number;
  endAngle: number;
  color: string;
  bgGradient: string;
  textColor: string;
  nodes: SubServiceNode[];
}

export function InteractiveHeroWheel() {
  const { lang } = useI18n();
  const [activeHover, setActiveHover] = useState<string | null>(null);

  // 4 Major Sectors — Security expanded to 150° to accommodate all 10 items
  const sectors: SectorInfo[] = [
    {
      id: "security",
      title: { en: "INTEGRATED SECURITY SOLUTIONS", ar: "أنظمة الأمن المتكاملة" },
      href: "/services/security",
      startAngle: -25,
      endAngle: 125,
      color: "#ea580c", // Orange
      bgGradient: "from-orange-500/20 to-amber-500/10",
      textColor: "text-orange-500 dark:text-orange-400",
      nodes: [
        { id: "pos", angle: -17, icon: Calculator, title: { en: "Retail & POS Security", ar: "أمن نقاط البيع والتحصيل" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "anpr", angle: -2, icon: ScanSearch, title: { en: "ANPR / License Plate Recognition", ar: "التعرف على لوحات المركبات (LPR)" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "uvss", angle: 13, icon: ShieldAlert, title: { en: "Under Vehicle Surveillance (UVSS)", ar: "فحص وتفتيش أسفل المركبات" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "visitor", angle: 28, icon: UserCheck, title: { en: "Visitor & Identity Management", ar: "إدارة الزوار والهويات الرقمية" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "perimeter", angle: 43, icon: Radar, title: { en: "Perimeter Intrusion Detection (PIDS)", ar: "حماية وكشف التسلل المحيطي" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "fire", angle: 58, icon: Flame, title: { en: "Fire Alarm & Life Safety", ar: "إنذار الحريق والسلامة" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "mobile-access", angle: 73, icon: Smartphone, title: { en: "Mobile Credentials & Smart Access", ar: "التحكم بالوصول عبر الجوال" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "barriers", angle: 88, icon: Fence, title: { en: "Speed Gates, Turnstiles & Blockers", ar: "البوابات الأمنية والمصدات الهيدروليكية" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "face-rec", angle: 103, icon: Users, title: { en: "Facial Recognition & Video AI", ar: "التعرف على الوجوه وتحليلات الفيديو" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
        { id: "wireless-cctv", angle: 118, icon: Radio, title: { en: "Wireless CCTV Transmission", ar: "النقل اللاسلكي لكاميرات المراقبة" }, href: "/services/security", color: "#ea580c", bgColor: "bg-orange-500", borderColor: "border-orange-300" },
      ],
    },
    {
      id: "av",
      title: { en: "AUDIO / VIDEO", ar: "الأنظمة الصوتية والمرئية" },
      href: "/services/audio-video",
      startAngle: 125,
      endAngle: 190,
      color: "#9e6d21", // Bronze / Khaki
      bgGradient: "from-[#9e6d21]/20 to-[#e0c59c]/10",
      textColor: "text-[#9e6d21] dark:text-[#e0c59c]",
      nodes: [
        { id: "sound", angle: 133, icon: Volume2, title: { en: "Pro Sound Systems", ar: "الأنظمة الصوتية الاحترافية" }, href: "/services/audio-video", color: "#9e6d21", bgColor: "bg-[#9e6d21]", borderColor: "border-[#e0c59c]" },
        { id: "videowall", angle: 149, icon: Tv, title: { en: "Video Walls & Displays", ar: "شاشات العرض والجدارية" }, href: "/services/audio-video", color: "#9e6d21", bgColor: "bg-[#9e6d21]", borderColor: "border-[#e0c59c]" },
        { id: "conferencing", angle: 165, icon: Presentation, title: { en: "Smart Meeting Rooms", ar: "قاعات المؤتمرات الذكية" }, href: "/services/audio-video", color: "#9e6d21", bgColor: "bg-[#9e6d21]", borderColor: "border-[#e0c59c]" },
        { id: "signage", angle: 181, icon: Radio, title: { en: "Digital Signage & PA", ar: "الإذاعة والشاشات الرقمية" }, href: "/services/audio-video", color: "#9e6d21", bgColor: "bg-[#9e6d21]", borderColor: "border-[#e0c59c]" },
      ],
    },
    {
      id: "automation",
      title: { en: "SMART AUTOMATION", ar: "التحكم والأنظمة الذكية" },
      href: "/services/integration",
      startAngle: 190,
      endAngle: 265,
      color: "#16a34a", // Green
      bgGradient: "from-emerald-500/20 to-green-500/10",
      textColor: "text-emerald-600 dark:text-emerald-400",
      nodes: [
        { id: "smarthome", angle: 200, icon: Home, title: { en: "Smart Home & BMS", ar: "المباني والمنازل الذكية" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-400" },
        { id: "lighting", angle: 218, icon: Lightbulb, title: { en: "Lighting & Energy Control", ar: "التحكم بالطاقة والإضاءة" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-400" },
        { id: "iot", angle: 236, icon: Cpu, title: { en: "IoT & Sensors Integration", ar: "إنترنت الأشياء والحساسات" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-400" },
        { id: "workflow", angle: 254, icon: Workflow, title: { en: "Integrated Control Layer", ar: "التكامل التشغيلي الموحد" }, href: "/services/integration", color: "#16a34a", bgColor: "bg-emerald-600", borderColor: "border-emerald-400" },
      ],
    },
    {
      id: "network",
      title: { en: "NETWORK INFRASTRUCTURE", ar: "البنية التحتية للشبكات" },
      href: "/services/network",
      startAngle: 265,
      endAngle: 335,
      color: "#0284c7", // Sky blue
      bgGradient: "from-sky-500/20 to-blue-500/10",
      textColor: "text-sky-600 dark:text-sky-400",
      nodes: [
        { id: "datacenter", angle: 275, icon: Server, title: { en: "Data Center Infrastructure", ar: "مراكز البيانات والخوادم" }, href: "/services/data-centers", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-400" },
        { id: "cabling", angle: 293, icon: Cable, title: { en: "Fiber & Structured Cabling", ar: "كابلات الألياف الضوئية" }, href: "/services/network", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-400" },
        { id: "routing", angle: 311, icon: Network, title: { en: "Enterprise Switching & SDN", ar: "شبكات التبديل المتقدمة" }, href: "/services/network", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-400" },
        { id: "cloud", angle: 328, icon: Cloud, title: { en: "Cloud & Cyber Security", ar: "الحوسبة السحابية وحماية الشبكة" }, href: "/services/network", color: "#0284c7", bgColor: "bg-sky-600", borderColor: "border-sky-400" },
      ],
    },
  ];

  // Utility to calculate coordinate on circle given radius & angle (0 = top)
  const getCoordinates = (angleDeg: number, radius: number, cx = 250, cy = 250) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  };

  // Generate SVG annular sector path
  const describeArcSector = (cx: number, cy: number, rInner: number, rOuter: number, startAngle: number, endAngle: number) => {
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

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[530px] aspect-square select-none flex items-center justify-center">
        {/* Glow ambient background aura */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-accent/20 via-orange-500/10 to-sky-500/20 blur-3xl opacity-60 pointer-events-none animate-pulse" />

        {/* The SVG Diagram Base */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Sector Text Paths */}
            {sectors.map((s) => {
              // Adjust text arc orientation based on quadrant
              const isBottom = s.startAngle >= 90 && s.startAngle < 270;
              const r = 142;
              const pathD = isBottom
                ? describeTextArc(250, 250, r, s.endAngle - 2, s.startAngle + 2, 0)
                : describeTextArc(250, 250, r, s.startAngle + 2, s.endAngle - 2, 1);
              return <path key={`textpath-${s.id}`} id={`sector-arc-${s.id}`} d={pathD} fill="none" />;
            })}

            {/* Gradient patterns */}
            <linearGradient id="grad-security" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="grad-av" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b38330" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8c601b" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="grad-automation" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="grad-network" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Outer Ring guide track */}
          <circle
            cx="250"
            cy="250"
            r="205"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="text-border/60"
          />

          {/* Middle Sectors (The 4 category bands) */}
          {sectors.map((s) => {
            const isHovered = activeHover === s.id;
            // Tailor font size & tracking so longer labels like NETWORK INFRASTRUCTURE fit completely
            const textStyle =
              s.id === "network"
                ? "text-[9.5px] sm:text-[10px] tracking-normal font-bold"
                : s.id === "security"
                ? "text-[10.5px] sm:text-[11px] tracking-wider font-bold"
                : "text-[11px] sm:text-[12px] tracking-widest font-bold";

            return (
              <g
                key={s.id}
                className="transition-all duration-300 cursor-pointer group"
                onMouseEnter={() => setActiveHover(s.id)}
                onMouseLeave={() => setActiveHover(null)}
              >
                <Link to={s.href as any}>
                  <path
                    d={describeArcSector(250, 250, 105, 178, s.startAngle + 1.5, s.endAngle - 1.5)}
                    fill={`url(#grad-${s.id})`}
                    className={`transition-all duration-300 ${
                      isHovered ? "opacity-100 filter brightness-110 drop-shadow-lg" : "opacity-85 hover:opacity-100"
                    }`}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1.5"
                  />
                  {/* Curved Text Label */}
                  <text
                    className={`${textStyle} fill-white select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]`}
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

          {/* Center Circle Base (behind logo) */}
          <circle
            cx="250"
            cy="250"
            r="102"
            className="fill-card stroke-border/70 drop-shadow-xl transition-all"
            strokeWidth="4"
          />
        </svg>

        {/* Central Core: LOGO (Clickable -> Home) */}
        <Link
          to="/"
          className="absolute z-20 w-[184px] h-[184px] sm:w-[200px] sm:h-[200px] rounded-full bg-white dark:bg-card border-[3px] border-border/80 shadow-2xl flex items-center justify-center p-6 sm:p-7 hover:scale-105 active:scale-95 transition-transform duration-300 group cursor-pointer"
          title={lang === "ar" ? "الصفحة الرئيسية — إنتجريتد تكنيكس" : "Home — Integrated Technics"}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src="/ht-logo.svg"
              alt="Integrated Technics"
              className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 select-none"
              draggable={false}
            />
          </div>
        </Link>

        {/* Outer Ring: Sub-Service Orbital Icon Buttons */}
        {sectors.flatMap((sector) =>
          sector.nodes.map((node) => {
            // Coordinate in percent (0 to 100)
            const coords = getCoordinates(node.angle, 205, 250, 250);
            const leftPct = (coords.x / 500) * 100;
            const topPct = (coords.y / 500) * 100;
            const Icon = node.icon;

            return (
              <div
                key={node.id}
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={node.href as any}
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white shadow-lg border-2 ${node.borderColor} ${node.bgColor} hover:scale-125 hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-90`}
                      aria-label={node.title[lang]}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-card/95 text-foreground backdrop-blur-md border px-3 py-1.5 rounded-lg shadow-xl text-xs font-medium z-50 pointer-events-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
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
