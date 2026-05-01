import { useEffect, useState } from "react";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useAdminMe } from "@/hooks/use-admins";
import { useProjects } from "@/hooks/use-projects";
import { useEvents } from "@/hooks/use-events";
import { useI18n } from "@/hooks/use-i18n";
import { Link } from "wouter";
import { ArrowUpRight, Shield, FolderKanban, CalendarDays, Star, BarChart3, Gift } from "lucide-react";

const STORAGE_KEY = "prayas_team_members";

function calcAge(dob: string) {
  const today = new Date();
  const d = new Date(dob);
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
  return age;
}

function isBirthdayToday(dob: string) {
  const today = new Date();
  const d = new Date(dob);
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
}

export default function AdminDashboardPage() {
  const { lang } = useI18n();
  const adminMe = useAdminMe();
  const projects = useProjects({ lang });
  const events = useEvents({ lang });
  const featuredCount = (projects.data || []).filter((p) => p.project.isFeatured).length;

  const [birthdayMembers, setBirthdayMembers] = useState<{ name: string; designation: string; dob: string }[]>([]);
  useEffect(() => {
    try {
      const members = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setBirthdayMembers(members.filter((m: any) => m.dob && isBirthdayToday(m.dob)));
    } catch {}
  }, []);

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp">
          <div className="border border-border bg-card overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div>
                  <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-4 whitespace-nowrap">Admin</p>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Publishing dashboard</h1>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Create and maintain projects and events across EN/HI/MR.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-semibold text-foreground/80">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Role: {adminMe.data?.role || "—"}
                    </div>
                    <div className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-semibold text-foreground/80">
                      <Star className="h-4 w-4 text-[hsl(var(--kesari))]" />
                      Featured: {featuredCount}/4
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                  <Link href="/admin/projects"
                    className="border border-border bg-card p-4 hover:bg-muted/40 transition-colors group">
                    <FolderKanban className="h-5 w-5 text-[hsl(var(--kesari))] mb-3" />
                    <div className="text-sm font-bold">Projects</div>
                    <div className="text-xs text-muted-foreground mt-1">Create, feature, translate</div>
                    <div className="text-xs font-semibold text-[hsl(var(--kesari))] mt-3">Open <ArrowUpRight className="inline h-3.5 w-3.5" /></div>
                  </Link>
                  <Link href="/admin/events"
                    className="border border-border bg-card p-4 hover:bg-muted/40 transition-colors group">
                    <CalendarDays className="h-5 w-5 text-[hsl(var(--kesari))] mb-3" />
                    <div className="text-sm font-bold">Events</div>
                    <div className="text-xs text-muted-foreground mt-1">Schedule & publish</div>
                    <div className="text-xs font-semibold text-[hsl(var(--kesari))] mt-3">Open <ArrowUpRight className="inline h-3.5 w-3.5" /></div>
                  </Link>
                  <Link href="/admin/analytics"
                    className="border border-border bg-card p-4 hover:bg-muted/40 transition-colors group col-span-2">
                    <BarChart3 className="h-5 w-5 text-[hsl(var(--kesari))] mb-3" />
                    <div className="text-sm font-bold">Analytics</div>
                    <div className="text-xs text-muted-foreground mt-1">View insights & reports</div>
                    <div className="text-xs font-semibold text-[hsl(var(--kesari))] mt-3">Open <ArrowUpRight className="inline h-3.5 w-3.5" /></div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-px bg-border">
            <div className="bg-card p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Projects</div>
              <div className="text-3xl font-bold text-foreground">{(projects.data || []).length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total in catalogue</div>
            </div>
            <div className="bg-card p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Events</div>
              <div className="text-3xl font-bold text-foreground">{(events.data || []).length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total with translations</div>
            </div>
            <div className="bg-card p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Featured</div>
              <div className="text-3xl font-bold text-foreground">{featuredCount}/4</div>
              <div className="text-sm text-muted-foreground mt-1">Home page slots used</div>
            </div>
          </div>

          {birthdayMembers.length > 0 && (
            <div className="mt-6 bg-black text-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="h-5 w-5 text-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-400">🎂 Birthday Today!</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {birthdayMembers.map((m, i) => (
                  <div key={i} className="border border-white/20 px-5 py-3">
                    <p className="font-bold text-base">{m.name}</p>
                    <p className="text-xs text-white/60 mt-0.5">{m.designation}</p>
                    <p className="text-xs text-yellow-400 font-semibold mt-1">Turning {calcAge(m.dob) + 1} today 🎉</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
