import { useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useProjects } from "@/hooks/use-projects";
import { useEvents } from "@/hooks/use-events";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { FolderKanban, CalendarDays, IndianRupee, Download, Image as ImageIcon, TrendingUp, Award } from "lucide-react";

const DARK   = "hsl(0,0%,10%)";
const DARK2  = "hsl(0,0%,30%)";
const MUTED  = "hsl(0,0%,88%)";
const KESARI = "hsl(var(--kesari))";

type Tab = "projects" | "events" | "revenue";
type Range = "all" | "year" | "month" | "custom";

function ghostBtn(active: boolean, onClick: () => void, label: string) {
  return (
    <button key={label} onClick={onClick}
      className={`h-8 px-4 text-xs font-bold uppercase tracking-wider border transition-all duration-150 ${
        active ? "bg-foreground text-background border-foreground" : "bg-transparent text-foreground border-border hover:border-foreground"
      }`}>
      {label}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub?: string }) {
  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-foreground/50" />
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-6 h-[2px] bg-foreground" />
      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{children}</h2>
    </div>
  );
}

function filterByRange<T extends { date: Date }>(items: T[], range: Range, customFrom?: string, customTo?: string): T[] {
  if (range === "all") return items;
  const now = new Date();
  return items.filter(({ date }) => {
    if (range === "year")  return date.getFullYear() === now.getFullYear();
    if (range === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    if (range === "custom" && customFrom && customTo) {
      const from = new Date(customFrom);
      const to   = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      return date >= from && date <= to;
    }
    return true;
  });
}

function groupByMonth<T extends { date: Date }>(items: T[], label: string): { period: string; count: number }[] {
  const map: Record<string, number> = {};
  items.forEach(({ date }) => {
    const key = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([period, count]) => ({ period, count }));
}

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState<Tab>("projects");
  const [range, setRange] = useState<Range>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: projectsRaw } = useProjects({ lang: "en" });
  const { data: eventsRaw }   = useEvents({ lang: "en" });

  // ── Projects data ────────────────────────────────────────
  const projects = useMemo(() => (projectsRaw || []).map(p => ({
    ...p,
    date: new Date((p.project as any).projectDate ?? p.project.createdAt as any),
  })), [projectsRaw]);

  const filteredProjects = useMemo(() => filterByRange(projects, range, customFrom, customTo), [projects, range, customFrom, customTo]);
  const projectTrend     = useMemo(() => groupByMonth(filteredProjects, "Projects"), [filteredProjects]);
  const featuredCount    = useMemo(() => filteredProjects.filter(p => p.project.isFeatured).length, [filteredProjects]);
  const withCover        = useMemo(() => filteredProjects.filter(p => p.project.coverImagePath).length, [filteredProjects]);
  const publishedCount   = useMemo(() => filteredProjects.filter(p =>
    p.translations.some((t: any) => t.status === "published")
  ).length, [filteredProjects]);

  const projectsByStatus = [
    { name: "Published", count: publishedCount },
    { name: "Draft",     count: filteredProjects.length - publishedCount },
    { name: "Featured",  count: featuredCount },
    { name: "With Cover",count: withCover },
  ];

  // ── Events data ──────────────────────────────────────────
  const events = useMemo(() => (eventsRaw || []).map(e => ({
    ...e,
    date: new Date(e.event.createdAt as any),
    startDate: e.event.startDate ? new Date(e.event.startDate as any) : null,
  })), [eventsRaw]);

  const filteredEvents = useMemo(() => filterByRange(events, range, customFrom, customTo), [events, range, customFrom, customTo]);
  const eventTrend     = useMemo(() => groupByMonth(filteredEvents, "Events"), [filteredEvents]);

  const withFlyer      = useMemo(() => filteredEvents.filter(e => e.event.flyerImagePath).length, [filteredEvents]);
  const freeEvents     = useMemo(() => filteredEvents.filter(e => !e.event.eventPrice || e.event.eventPrice === "Free").length, [filteredEvents]);
  const paidEvents     = useMemo(() => filteredEvents.length - freeEvents, [filteredEvents, freeEvents]);

  // Busiest month for events
  const busiestMonth = useMemo(() => {
    if (!eventTrend.length) return "—";
    return eventTrend.reduce((a, b) => a.count > b.count ? a : b).period;
  }, [eventTrend]);

  // Most photos (flyers) uploaded month
  const flyersByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEvents.forEach(e => {
      if (e.event.flyerImagePath) {
        const key = e.date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).map(([period, count]) => ({ period, count }));
  }, [filteredEvents]);

  const highestPhotoMonth = useMemo(() => {
    if (!flyersByMonth.length) return "—";
    return flyersByMonth.reduce((a, b) => a.count > b.count ? a : b).period;
  }, [flyersByMonth]);

  const eventsByType = [
    { name: "Free",  count: freeEvents },
    { name: "Paid",  count: paidEvents },
    { name: "Flyer", count: withFlyer  },
  ];

  // ── Export PDF ───────────────────────────────────────────
  async function exportPDF() {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const tabLabel = tab === "projects" ? "Projects" : tab === "events" ? "Events" : "Revenue";
    const rangeLabel = range === "all" ? "All Time" : range === "year" ? `Year ${new Date().getFullYear()}` : range === "custom" && customFrom && customTo ? `${customFrom} to ${customTo}` : `${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
    const downloadedAt = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    // ── PAGE 1: Cover ──────────────────────────────────────
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, "F");

    // Top kesari bar
    pdf.setFillColor(230, 100, 20);
    pdf.rect(0, 0, W, 4, "F");

    // Logo — try to load, fallback to text
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => {
        logoImg.onload = () => res();
        logoImg.onerror = () => rej();
        logoImg.src = "/logo.png";
      });
      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = logoImg.naturalWidth;
      logoCanvas.height = logoImg.naturalHeight;
      logoCanvas.getContext("2d")!.drawImage(logoImg, 0, 0);
      const logoData = logoCanvas.toDataURL("image/png");
      const logoH = 28;
      const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
      pdf.addImage(logoData, "PNG", W / 2 - logoW / 2, H * 0.28, logoW, logoH);
    } catch {
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(230, 100, 20);
      pdf.text("Prayas Yavatmal", W / 2, H * 0.35, { align: "center" });
    }

    // Organisation name
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Prayas Yavatmal", W / 2, H * 0.44, { align: "center" });

    // Divider
    pdf.setDrawColor(230, 100, 20);
    pdf.setLineWidth(0.5);
    pdf.line(W * 0.3, H * 0.50, W * 0.7, H * 0.50);

    // Report title
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 15, 15);
    pdf.text(`${tabLabel} Report`, W / 2, H * 0.58, { align: "center" });

    // Period
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Period: ${rangeLabel}`, W / 2, H * 0.64, { align: "center" });

    // Bottom bar
    pdf.setFillColor(230, 100, 20);
    pdf.rect(0, H - 4, W, 4, "F");

    // ── PAGE 2: Meta info ──────────────────────────────────
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, "F");
    pdf.setFillColor(230, 100, 20);
    pdf.rect(0, 0, W, 4, "F");

    let y = 22;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(230, 100, 20);
    pdf.text("REPORT DETAILS", 20, y);
    y += 8;
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(20, y, W - 20, y);
    y += 8;

    const meta = [
      ["Report Type",      `${tabLabel} Analytics`],
      ["Period Filter",    rangeLabel],
      ["Downloaded At",    downloadedAt],
      ["Organisation",     "Prayas Yavatmal"],
      ["Website",          "prayasyavatmal.com"],
    ];
    meta.forEach(([k, v]) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(k + ":", 20, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(20, 20, 20);
      pdf.text(v, 75, y);
      y += 7;
    });

    y += 6;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(20, y, W - 20, y);
    y += 10;

    // Summary stats
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(230, 100, 20);
    pdf.text("SUMMARY", 20, y);
    y += 8;

    const summaryLines: string[] = [];
    if (tab === "projects") {
      summaryLines.push(`Total Projects: ${filteredProjects.length}`);
      summaryLines.push(`Published: ${publishedCount}  |  Drafts: ${filteredProjects.length - publishedCount}`);
      summaryLines.push(`Featured on Home: ${featuredCount} / 4`);
      summaryLines.push(`With Cover Image: ${withCover}`);
      if (projectTrend.length > 0) {
        const peak = projectTrend.reduce((a, b) => a.count > b.count ? a : b);
        summaryLines.push(`Most Active Month: ${peak.period} (${peak.count} projects)`);
      }
      summaryLines.push("");
      summaryLines.push("This report covers all projects created within the selected period.");
      summaryLines.push("Featured projects appear on the home page and drive visitor engagement.");
    } else if (tab === "events") {
      summaryLines.push(`Total Events: ${filteredEvents.length}`);
      summaryLines.push(`Free Events: ${freeEvents}  |  Paid Events: ${paidEvents}`);
      summaryLines.push(`Events with Flyer: ${withFlyer}`);
      summaryLines.push(`Busiest Month: ${busiestMonth}`);
      summaryLines.push("");
      summaryLines.push("This report covers all events organised within the selected period.");
      summaryLines.push("Events with open registration are highlighted on the home page.");
    } else {
      summaryLines.push("Revenue data is not yet available.");
      summaryLines.push("Payment gateway integration is pending.");
      summaryLines.push("");
      summaryLines.push("Once integrated, this report will show total collections,");
      summaryLines.push("donor history, average donation, and monthly revenue trends.");
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
    summaryLines.forEach(line => {
      if (y > H - 30) { pdf.addPage(); y = 20; }
      pdf.text(line, 20, y);
      y += 6.5;
    });

    // ── Detailed list after summary ────────────────────────
    y += 6;
    if (y > H - 40) { pdf.addPage(); y = 20; }
    pdf.setDrawColor(220, 220, 220);
    pdf.line(20, y, W - 20, y);
    y += 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(230, 100, 20);

    if (tab === "projects") {
      pdf.text("PROJECT LIST", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      filteredProjects.forEach((p, i) => {
        if (y > H - 20) { pdf.addPage(); y = 20; }
        const tr = p.translations.find((t: any) => t.language === "en") || p.translations[0] as any;
        const title = tr?.title || p.project.slug;
        const status = tr?.status || "draft";
        const date = p.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const featured = p.project.isFeatured ? " ★" : "";
        pdf.setTextColor(40, 40, 40);
        pdf.text(`${i + 1}. ${title}${featured}`, 20, y);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`${date}  |  ${status}`, W - 20, y, { align: "right" });
        y += 6.5;
      });
    } else if (tab === "events") {
      pdf.text("EVENT LIST", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      filteredEvents.forEach((e, i) => {
        if (y > H - 20) { pdf.addPage(); y = 20; }
        const tr = e.translations.find((t: any) => t.language === "en") || e.translations[0] as any;
        const title = tr?.title || e.event.slug;
        const date = e.startDate
          ? e.startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : e.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const price = e.event.eventPrice && e.event.eventPrice !== "Free" ? `₹${e.event.eventPrice}` : "Free";
        const location = tr?.location ? ` · ${tr.location}` : "";
        pdf.setTextColor(40, 40, 40);
        pdf.text(`${i + 1}. ${title}${location}`, 20, y);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`${date}  |  ${price}`, W - 20, y, { align: "right" });
        y += 6.5;
      });
    } else {
      pdf.text("DONOR LIST", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(130, 130, 130);
      pdf.text("No donor data available. Payment gateway integration pending.", 20, y);
    }

    // ── PAGE 3+: Charts & data ─────────────────────────────
    if (printRef.current) {
      pdf.addPage();
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, W, H, "F");
      pdf.setFillColor(230, 100, 20);
      pdf.rect(0, 0, W, 4, "F");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(230, 100, 20);
      pdf.text(`${tabLabel.toUpperCase()} — DETAILED DATA`, 20, 16);

      try {
        const canvas = await html2canvas(printRef.current, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.85);
        const imgW = W - 40;
        const imgH = (canvas.height / canvas.width) * imgW;
        const maxH = H - 30;
        if (imgH <= maxH) {
          pdf.addImage(imgData, "JPEG", 20, 22, imgW, imgH);
        } else {
          // Split across pages
          const pages = Math.ceil(imgH / maxH);
          for (let i = 0; i < pages; i++) {
            if (i > 0) {
              pdf.addPage();
              pdf.setFillColor(255, 255, 255);
              pdf.rect(0, 0, W, H, "F");
            }
            const srcY = (i * maxH * canvas.width) / imgW;
            const srcH = Math.min((maxH * canvas.width) / imgW, canvas.height - srcY);
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = srcH;
            sliceCanvas.getContext("2d")!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
            const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.85);
            const sliceH = (srcH / canvas.width) * imgW;
            pdf.addImage(sliceData, "JPEG", 20, i === 0 ? 22 : 10, imgW, sliceH);
          }
        }
      } catch (err) {
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Chart rendering unavailable.", 20, 40);
      }
    }

    // Bottom bar on last page
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFillColor(230, 100, 20);
      pdf.rect(0, H - 4, W, 4, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text(`Page ${i} of ${totalPages}  ·  Prayas Yavatmal  ·  prayasyavatmal.com`, W / 2, H - 7, { align: "center" });
    }

    pdf.save(`prayas-${tab}-report-${Date.now()}.pdf`);
  }

  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try { await exportPDF(); } finally { setExporting(false); }
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "projects", label: "Projects", icon: FolderKanban },
    { key: "events",   label: "Events",   icon: CalendarDays },
    { key: "revenue",  label: "Revenue",  icon: IndianRupee  },
  ];

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp space-y-8 pb-12" ref={printRef}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-2 whitespace-nowrap">Admin</p>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Insights across projects, events and revenue.</p>
            </div>
            <button onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-2 h-9 px-5 border border-foreground bg-transparent text-foreground text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-150 disabled:opacity-50">
              <Download className="h-3.5 w-3.5" /> {exporting ? "Generating…" : "Export PDF"}
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex gap-2 flex-wrap print:hidden">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 h-10 px-6 text-xs font-bold uppercase tracking-wider border transition-all duration-150 ${
                  tab === key ? "bg-foreground text-background border-foreground" : "bg-transparent text-foreground border-border hover:border-foreground"
                }`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Range filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">Period</span>
            {ghostBtn(range === "all",   () => setRange("all"),   "All Time")}
            {ghostBtn(range === "year",  () => setRange("year"),  "This Year")}
            {ghostBtn(range === "month", () => setRange("month"), "This Month")}
            {ghostBtn(range === "custom", () => setRange("custom"), "Custom")}
            {range === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 px-3 text-xs border border-border bg-transparent text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 px-3 text-xs border border-border bg-transparent text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            )}
          </div>

          {/* ── PROJECTS TAB ── */}
          {tab === "projects" && (
            <div className="space-y-8" ref={tab === "projects" ? printRef : undefined}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                <StatCard label="Total Projects"  value={filteredProjects.length}  icon={FolderKanban} />
                <StatCard label="Published"       value={publishedCount}           icon={TrendingUp}   sub={`${filteredProjects.length - publishedCount} drafts`} />
                <StatCard label="Featured"        value={featuredCount}            icon={Award}        sub="on home page" />
                <StatCard label="With Cover"      value={withCover}                icon={ImageIcon}    sub={`${filteredProjects.length - withCover} without`} />
              </div>

              <div className="border border-border bg-card p-6">
                <SectionTitle>Projects Created Over Time</SectionTitle>
                {projectTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No data for selected period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={projectTrend} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={MUTED} />
                      <XAxis dataKey="period" style={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ border: `1px solid ${MUTED}`, borderRadius: 0, fontSize: 12 }} />
                      <Bar dataKey="count" name="Projects" radius={[2,2,0,0]}>
                        {projectTrend.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? DARK : DARK2} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="border border-border bg-card p-6">
                <SectionTitle>Project Status Breakdown</SectionTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={projectsByStatus} layout="vertical" margin={{ top: 4, right: 24, left: 60, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={MUTED} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} style={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" style={{ fontSize: 11 }} width={70} />
                    <Tooltip contentStyle={{ border: `1px solid ${MUTED}`, borderRadius: 0, fontSize: 12 }} />
                    <Bar dataKey="count" name="Count" fill={DARK} radius={[0,2,2,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="border border-border bg-card">
                <div className="px-6 py-4 border-b border-border">
                  <SectionTitle>All Projects</SectionTitle>
                </div>
                <div className="divide-y divide-border">
                  {filteredProjects.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-muted-foreground">No projects in this period.</p>
                  ) : filteredProjects.map(p => {
                    const tr = p.translations.find((t: any) => t.language === "en") || p.translations[0] as any;
                    return (
                      <div key={p.project.id} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{tr?.title || p.project.slug}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} {(p.project as any).projectDate ? "" : "(created)"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.project.isFeatured && <span className="text-[9px] font-black uppercase tracking-wider text-[hsl(var(--kesari))]">★ Featured</span>}
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                            tr?.status === "published" ? "border-foreground text-foreground" : "border-border text-muted-foreground"
                          }`}>{tr?.status || "draft"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── EVENTS TAB ── */}
          {tab === "events" && (
            <div className="space-y-8" ref={tab === "events" ? printRef : undefined}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                <StatCard label="Total Events"    value={filteredEvents.length} icon={CalendarDays} />
                <StatCard label="Free Events"     value={freeEvents}            icon={TrendingUp}   sub={`${paidEvents} paid`} />
                <StatCard label="With Flyer"      value={withFlyer}             icon={ImageIcon}    sub="photos uploaded" />
                <StatCard label="Busiest Month"   value={busiestMonth}          icon={Award}        sub="most events" />
              </div>

              <div className="border border-border bg-card p-6">
                <SectionTitle>Events Organised Over Time</SectionTitle>
                {eventTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No data for selected period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={eventTrend} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={DARK} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={DARK} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={MUTED} />
                      <XAxis dataKey="period" style={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ border: `1px solid ${MUTED}`, borderRadius: 0, fontSize: 12 }} />
                      <Area type="monotone" dataKey="count" stroke={DARK} strokeWidth={2} fill="url(#evGrad)" name="Events" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-border bg-card p-6">
                  <SectionTitle>Event Type Breakdown</SectionTitle>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={eventsByType} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={MUTED} />
                      <XAxis dataKey="name" style={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ border: `1px solid ${MUTED}`, borderRadius: 0, fontSize: 12 }} />
                      <Bar dataKey="count" name="Count" fill={DARK} radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border border-border bg-card p-6">
                  <SectionTitle>Photos Uploaded by Month</SectionTitle>
                  {flyersByMonth.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No flyers in this period.</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-4">
                        Highest: <span className="font-bold text-foreground">{highestPhotoMonth}</span>
                      </p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={flyersByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={MUTED} />
                          <XAxis dataKey="period" style={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} style={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ border: `1px solid ${MUTED}`, borderRadius: 0, fontSize: 12 }} />
                          <Bar dataKey="count" name="Flyers" fill={DARK} radius={[2,2,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              </div>

              <div className="border border-border bg-card">
                <div className="px-6 py-4 border-b border-border">
                  <SectionTitle>All Events</SectionTitle>
                </div>
                <div className="divide-y divide-border">
                  {filteredEvents.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-muted-foreground">No events in this period.</p>
                  ) : filteredEvents.map(e => {
                    const tr = e.translations.find((t: any) => t.language === "en") || e.translations[0] as any;
                    return (
                      <div key={e.event.id} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{tr?.title || e.event.slug}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {e.startDate ? e.startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date TBD"}
                            {tr?.location ? ` · ${tr.location}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.event.flyerImagePath && <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="text-xs font-semibold text-foreground">
                            {e.event.eventPrice === "Free" || !e.event.eventPrice ? "Free" : `₹${e.event.eventPrice}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── REVENUE TAB ── */}
          {tab === "revenue" && (
            <div className="space-y-8" ref={tab === "revenue" ? printRef : undefined}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                <StatCard label="Total Collected" value="₹0"          icon={IndianRupee} sub="payment gateway pending" />
                <StatCard label="Total Donors"    value="0"           icon={TrendingUp}  sub="no data yet" />
                <StatCard label="Avg Donation"    value="₹0"          icon={Award}       sub="per donor" />
                <StatCard label="Top Donor"       value="—"           icon={Award}       sub="not available" />
              </div>

              <div className="border border-border bg-card p-10 text-center">
                <IndianRupee className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                <p className="font-semibold text-foreground mb-2">Payment Gateway Not Connected</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Revenue analytics will be available once the payment gateway is integrated.
                  All donation data — total collections, donor history, highest donors, and monthly trends —
                  will appear here automatically.
                </p>
              </div>

              <div className="border border-border bg-card p-6">
                <SectionTitle>Revenue Trend (Preview)</SectionTitle>
                <p className="text-xs text-muted-foreground mb-4">Sample chart — will populate with real data after gateway integration.</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={[
                    { period: "Jan", total: 0 }, { period: "Feb", total: 0 },
                    { period: "Mar", total: 0 }, { period: "Apr", total: 0 },
                    { period: "May", total: 0 }, { period: "Jun", total: 0 },
                  ]} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={KESARI} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={KESARI} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={MUTED} />
                    <XAxis dataKey="period" style={{ fontSize: 11 }} />
                    <YAxis style={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={(v: any) => [`₹${v}`, "Revenue"]} contentStyle={{ border: `1px solid ${MUTED}`, borderRadius: 0, fontSize: 12 }} />
                    <Area type="monotone" dataKey="total" stroke={KESARI} strokeWidth={2} fill="url(#revGrad)" name="Revenue (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="border border-border bg-card">
                <div className="px-6 py-4 border-b border-border">
                  <SectionTitle>Top Donors</SectionTitle>
                </div>
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Donor data will appear here after payment gateway integration.
                </div>
              </div>
            </div>
          )}

        </div>
      </AdminShell>
    </AdminGuard>
  );
}
