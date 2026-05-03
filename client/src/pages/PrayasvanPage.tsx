import { useState, useEffect, useRef } from "react";
import { Shell } from "@/components/Shell";
import { Link } from "wouter";
import { ArrowLeft, MapPin } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const ZONES = [
  { id: "nakshatra", label: "Nakshatra Van" },
  { id: "rashi", label: "Rashi Van" },
  { id: "navgrah", label: "Navgrah Van" },
  { id: "panchvati", label: "Panchvati Van" },
  { id: "phoolapakhru", label: "Phoolapakhru Parisar" },
  { id: "pipalapanki", label: "Miyawaki" },
  { id: "pakshi", label: "Pakshi Sanvardhan Parisar" },
  { id: "ayurvedic", label: "Ayurvedic Vanaspati Parisar" },
  { id: "mati", label: "Mati Bandhara" },
  { id: "cement", label: "Cement Bandhara" },
  { id: "hill", label: "Hill View Parisar" },
  { id: "karyashala", label: "Karyashala Kaksh" },
  { id: "gulab", label: "Gulab Vatika" },
] as const;

type ZoneId = typeof ZONES[number]["id"];

const ZONE_IMAGES: Record<ZoneId, string | null> = {
  nakshatra: "/van/Nakshatrvan.jpeg",
  rashi: "/van/Rashivan.jpeg",
  navgrah: null,
  panchvati: "/van/Panchvati.jpeg",
  phoolapakhru: null,
  pipalapanki: null,
  pakshi: null,
  ayurvedic: null,
  mati: null,
  cement: null,
  hill: null,
  karyashala: null,
  gulab: null,
};

const NAKSHATRA_ROWS = [
  [1, "Ashwini", "Justice is the law.", "Adult", "2m · 25 nos"],
  [2, "Bharani", "Emblica officinalis + Cynodon dactylon", "Amala + Durva Below", "3m · 11 nos"],
  [3, "Karthika", "Ficus glomerata + Cynodon dactylon", "Umbar + Durva Below", "4m · 8 nos"],
  [4, "Rohini", "Syzygium cumini + Cynodon dactylon", "Jamoon + Durva Below", "4m · 8 nos"],
  [5, "Mruga", "Acacia catechu + Cynodon dactylon", "Khair + Durva Below", "4m · 8 nos"],
  [6, "Aardra", "Simarouba glauca + Cynodon dactylon", "Laxmitaru + Durva Below", "4m · 8 nos"],
  [7, "Punarvasu", "Bambusa vulgaris", "Bamboo", "3m · 11 nos"],
  [8, "Pushya", "Ficus religiosa + Cynodon dactylon", "Peepal + Durva Below", "4m · 8 nos"],
  [9, "Aashlesha", "Calophyllum inophyllum + Cynodon dactylon", "Undi", "4m · 8 nos"],
  [10, "Magha", "Ficus benghalensis + Cynodon dactylon", "Vad + Durva Below", "4m · 8 nos"],
  [11, "Purva", "Butea monosperma + Cynodon dactylon", "Palas + Durva Below", "4m · 8 nos"],
  [12, "Uttara", "Ficus arnottiana + Cynodon dactylon", "Payar + Durva Below", "4m · 8 nos"],
  [13, "Hasta", "Jasminum grandiflorum", "Jai", "0.45m · 350 nos"],
  [14, "Chitra", "Aegle marmelos + Cynodon dactylon", "Bel + Durva Below", "3m · 11 nos"],
  [15, "Swathi", "Terminalia arjuna + Cynodon dactylon", "Arjun + Durva Below", "4m c/c · 8 nos"],
  [16, "Vishak", "Mesua ferrea + Cynodon dactylon", "Nagkeshar + Durva Below", "3m · 11 nos"],
  [17, "Anuradha", "Saraca indica + Cynodon dactylon", "Sita Ashok + Durva Below", "3m · 11 nos"],
  [18, "Jeshta", "Bombax ceiba + Cynodon dactylon", "Savar + Durva Below", "4m c/c · 8 nos"],
  [19, "Mula", "Acacia farnesiana + Cynodon dactylon", "Dev Babhul + Durva Below", "3m · 11 nos"],
  [20, "Purva Ashada", "Calamus pseudotenuis + Cynodon dactylon", "Vet", "3m · 11 nos"],
  [21, "Uttar Ashada", "Artocarpus heterophyllus + Cynodon dactylon", "Jackfruit + Durva Below", "3m · 11 nos"],
  [22, "Shravan", "Calotropis gigantea", "Rui", "2m · 25 nos"],
  [23, "Dhanishtha", "Prosopis juliflora + Cynodon dactylon", "Shami", "3m · 11 nos"],
  [24, "Shatataraka", "Neolamarckia cadamba + Cynodon dactylon", "Kadamba + Durva Below", "4m · 8 nos"],
  [25, "Purva Bhadrapada", "Mangifera indica + Cynodon dactylon", "Mango + Durva Below", "4m · 8 nos"],
  [26, "Uttara Bhadrapada", "Azadirachta indica + Cynodon dactylon", "Neem + Durva Below", "4m · 8 nos"],
  [27, "Revathi", "Madhuca indica + Cynodon dactylon", "Moha + Durva Below", "4m · 8 nos"],
];

const PROJECT_FEATURES = [
  { icon: "🌳", en: "Total area: 25 acres (10 hectares)" },
  { icon: "🌱", en: "10,000 trees of 70 varieties" },
  { icon: "🗺️", en: "Nakshatravan, Panchavativan, Rashivan & Navagrahavan" },
  { icon: "🌿", en: "Cultivation of medicinal plants" },
  { icon: "🦋", en: "Special trees for butterfly breeding & conservation" },
  { icon: "🐦", en: "Special initiatives to enhance bird habitat" },
  { icon: "🌲", en: "Miyawaki tree planting experiment" },
  { icon: "📋", en: "Workshops & dialogue sessions on tree conservation" },
  { icon: "🚶", en: "1,700 metre fire line / walking track" },
  { icon: "🍎", en: "Wild fruit trees planted for birds" },
  { icon: "💧", en: "Soil dams, stone dams & cement plugs for soil management" },
  { icon: "🚿", en: "Drip irrigation throughout the project" },
];

// phase timeline:
// "show"   0–2000ms  : fullscreen map + welcome text
// "fly"    2000–3400ms: map flies to its in-page position
// "done"   3400ms+   : overlay gone, content visible
export default function PrayasvanPage() {
  const { t } = useI18n();
  const p = (t as any).prayasvan;

  const [active, setActive] = useState<ZoneId | null>(null);
  const [imgVisible, setImgVisible] = useState(false);
  const [phase, setPhase] = useState<"show" | "fly" | "done">("show");

  // rect of the in-page map container, measured just before fly starts
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => {
      // measure where the in-page map will be
      if (mapContainerRef.current) {
        const r = mapContainerRef.current.getBoundingClientRect();
        setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
      setPhase("fly");
    }, 1500);
    const t2 = setTimeout(() => setPhase("done"), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function selectZone(id: ZoneId) {
    if (active === id) { setActive(null); setImgVisible(false); return; }
    setImgVisible(false);
    setActive(id);
    setTimeout(() => setImgVisible(true), 120);
  }

  const activeZone = ZONES.find(z => z.id === active);
  const activeImg = active ? ZONE_IMAGES[active] : null;

  // overlay map style — uses transform to move from center to target
  const overlayMapStyle: React.CSSProperties = (() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const mapW = Math.min(vw * 0.82, 900);

    if (phase === "show" || !targetRect) {
      return {
        position: "fixed" as const,
        width: mapW,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        borderRadius: 0,
        transition: "none",
        opacity: 1,
        objectFit: "contain" as const,
      };
    }
    // target center relative to viewport
    const tCx = targetRect.left + targetRect.width / 2;
    const tCy = targetRect.top + targetRect.height / 2;
    // current center (50vw, 50vh)
    const sCx = vw / 2;
    const sCy = vh / 2;
    const dx = tCx - sCx;
    const dy = tCy - sCy;
    const scaleX = targetRect.width / mapW;
    return {
      position: "fixed" as const,
      width: mapW,
      top: "50%",
      left: "50%",
      transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scaleX})`,
      transformOrigin: "center center",
      borderRadius: 16,
      transition: "transform 1.2s cubic-bezier(0.4,0,0.2,1), border-radius 1.2s ease, opacity 0.3s ease 0.9s",
      opacity: 0,
      objectFit: "contain" as const,
    };
  })();

  return (
    <>
      {/* ── CINEMATIC ENTRY OVERLAY ── */}
      {phase !== "done" && (
        <>
          {/* Black background — fades out during fly */}
          <div
            className="fixed inset-0 z-[200] bg-white"
            style={{
              pointerEvents: phase === "fly" ? "none" : "all",
              opacity: phase === "fly" ? 0 : 1,
              transition: phase === "fly" ? "opacity 0.6s ease 0.8s" : "none",
            }}
          />

          {/* Flying map — always on top of background */}
          <img
            src="/Map.png"
            alt="Prayasvan Map"
            className="fixed z-[202] pointer-events-none"
            style={{...overlayMapStyle, opacity: phase === "show" ? 0.65 : 0}}
          />

          {/* "You are entering Prayasvan" — show phase only */}
          <div
            className="fixed inset-0 z-[203] flex flex-col items-center justify-center pointer-events-none"
            style={{
              opacity: phase === "show" ? 1 : 0,
              transition: "opacity 0.4s ease",
              transitionDelay: phase === "fly" ? "0s" : "0.3s",
            }}
          >
            <p style={{
              color: "rgba(0,0,0,0.5)",
              fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
              fontWeight: 600,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: "1rem",
              textAlign: "center",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              You are entering
            </p>
            <p style={{
              color: "#000",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textAlign: "center",
              fontStyle: "italic",
            }}>
              Prayasvan
            </p>
          </div>

          {/* "Welcome to Prayasvan" — fly phase only */}
          <div
            className="fixed inset-0 z-[203] flex flex-col items-center justify-center pointer-events-none"
            style={{
              opacity: phase === "fly" ? 1 : 0,
              transition: phase === "fly" ? "opacity 0.4s ease 0.1s" : "opacity 0.3s ease",
              animation: phase === "fly" ? "fadeOutText 0.4s ease 0.6s forwards" : "none",
            }}
          >
            <p style={{
              color: "rgba(0,0,0,0.5)",
              fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
              fontWeight: 600,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: "1rem",
              textAlign: "center",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              Welcome to
            </p>
            <p style={{
              color: "#000",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textAlign: "center",
              fontStyle: "italic",
            }}>
              Prayasvan
            </p>
          </div>
        </>
      )}

      {/* ── PAGE CONTENT ── */}
      <Shell>
        <div
          style={{
            opacity: phase === "done" ? 1 : 0,
            transform: phase === "done" ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* Back button */}
          <div className="px-6 sm:px-12 md:px-20 lg:px-32 pt-8 pb-0 notranslate">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
          </div>

          {/* Header */}
          <section className="px-6 sm:px-12 md:px-20 lg:px-32 pt-10 pb-8 border-b border-border notranslate">
            <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-3 whitespace-nowrap">{p.orgLabel}</p>
            <h1 className="text-foreground font-bold mb-3" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 1.06, letterSpacing: "-0.03em" }}>
              {p.title}
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">{p.subtitle}</p>
          </section>

          <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-10 space-y-10">

            {/* Map — this is the target the overlay flies into */}
            <div ref={mapContainerRef} className="relative w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
              <img
                src="/Map.png"
                alt={p.mapAlt}
                className="w-full h-auto block"
                style={{
                  filter: active ? "drop-shadow(0 0 32px hsl(var(--kesari))) brightness(1.12) saturate(1.2)" : "none",
                  transition: "filter 1.5s ease",
                }}
              />
              {active && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at center, hsl(var(--kesari)/0.18) 0%, transparent 65%)", animation: "mapshine 2s ease-in-out infinite" }}
                />
              )}
              {active && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm">
                  <MapPin className="h-3.5 w-3.5 text-[hsl(var(--kesari))]" />
                  <span className="text-xs font-bold uppercase tracking-wider">{activeZone?.label}</span>
                </div>
              )}
            </div>

            {/* Zone buttons */}
            <div className="flex flex-wrap gap-2">
              {ZONES.map(z => (
                <button key={z.id} onClick={() => selectZone(z.id)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${active === z.id
                    ? "bg-[hsl(var(--kesari))] text-white border-[hsl(var(--kesari))] shadow-lg scale-105"
                    : "bg-transparent text-foreground border-border hover:border-[hsl(var(--kesari))] hover:text-[hsl(var(--kesari))]"
                  }`}>
                  {z.label}
                </button>
              ))}
            </div>

            {/* Zone panel */}
            <div style={{ opacity: active && imgVisible ? 1 : 0, transform: active && imgVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)", transition: "opacity 1.2s ease, transform 1.2s ease", pointerEvents: active ? "auto" : "none", minHeight: active ? undefined : 0, maxHeight: active ? undefined : 0, overflow: active ? "visible" : "hidden" }}>
              {active && (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  {activeImg ? (
                    <img src={activeImg} alt={activeZone?.label} className="w-full object-cover" style={{ maxHeight: "60vh" }} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                      <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                        <MapPin className="h-7 w-7 opacity-30" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">{activeZone?.label}</p>
                        <p className="text-xs mt-1 opacity-60">{p.imageSoon}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* About */}
            <div className="border-l-4 border-[hsl(var(--kesari))] pl-6 py-2">
              <p className="text-sm text-foreground/80 leading-[1.9]">{p.about1}</p>
              <p className="text-sm text-foreground/80 leading-[1.9] mt-4">{p.about2}</p>
            </div>

            {/* Vision */}
            <div className="border border-border bg-card p-6 rounded-2xl">
              <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-3 whitespace-nowrap">{p.visionLabel}</p>
              <p className="text-sm text-foreground/80 leading-[1.85]">{p.visionText}</p>
            </div>

            {/* Project Features */}
            <div className="border border-border bg-card p-6 rounded-2xl">
              <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-5 whitespace-nowrap">{p.featuresLabel}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROJECT_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                    <span className="text-lg shrink-0">{f.icon}</span>
                    <p className="text-sm text-foreground/80 leading-snug">{f.en}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nakshatra Table */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-black">
                <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-1 whitespace-nowrap">{p.nakshatraVanLabel}</p>
                <h3 className="text-white font-bold text-lg">{p.nakshatraTableTitle}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border">
                      {[p.colSr, p.colNakshatra, p.colBotanical, p.colCommon, p.colTotal, p.colImage].map((h: string) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {NAKSHATRA_ROWS.map(([sr, nakshatra, botanical, common, total], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="px-4 py-3 font-bold text-[hsl(var(--kesari))] tabular-nums">{sr}</td>
                        <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">{nakshatra}</td>
                        <td className="px-4 py-3 text-foreground/70 italic">{botanical}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{common}</td>
                        <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">{total}</td>
                        <td className="px-4 py-3">
                          <div className="h-8 w-12 rounded border border-dashed border-border bg-muted/40 flex items-center justify-center">
                            <span className="text-[9px] text-muted-foreground">soon</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rashi Van */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-black">
                <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-1 whitespace-nowrap">{p.rashiVanLabel}</p>
                <h3 className="text-white font-bold text-lg">{p.zodiacTitle}</h3>
              </div>
              <div className="p-6 flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--kesari))] mt-1.5 shrink-0" />
                <p className="text-base font-semibold text-foreground leading-relaxed">{p.zodiacDesc}</p>
              </div>
              <img src="/zodic.png" alt={p.zodiacTitle} className="w-full h-auto block" />
            </div>

          </section>
        </div>
      </Shell>

      <style>{`
        @keyframes mapshine {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes fadeOutText {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </>
  );
}
