import { useState, useEffect } from "react";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Gift, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Member = {
  id: string;
  name: string;
  designation: string;
  dob: string; // YYYY-MM-DD
  phone?: string;
  email?: string;
  photo?: string;
};

const STORAGE_KEY = "prayas_team_members";

function loadMembers(): Member[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveMembers(members: Member[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function formatDOB(dob: string) {
  if (!dob) return "—";
  const d = new Date(dob);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function isBirthdayToday(dob: string) {
  if (!dob) return false;
  const today = new Date();
  const d = new Date(dob);
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
}

function isBirthdaySoon(dob: string, days = 7) {
  if (!dob) return false;
  const today = new Date();
  const d = new Date(dob);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 && diff <= days;
}

function daysUntilBirthday(dob: string) {
  const today = new Date();
  const d = new Date(dob);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const empty: Omit<Member, "id"> = { name: "", designation: "", dob: "", phone: "", email: "", photo: "" };

export default function AdminTeamPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<Omit<Member, "id">>(empty);
  const [search, setSearch] = useState("");

  useEffect(() => { setMembers(loadMembers()); }, []);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.designation.toLowerCase().includes(search.toLowerCase())
  );

  const birthdays = members.filter(m => isBirthdayToday(m.dob));
  const upcoming  = members.filter(m => !isBirthdayToday(m.dob) && isBirthdaySoon(m.dob));

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setForm({ name: m.name, designation: m.designation, dob: m.dob, phone: m.phone || "", email: m.email || "", photo: m.photo || "" });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.designation.trim() || !form.dob) {
      toast({ title: "Required fields missing", description: "Name, designation and date of birth are required.", variant: "destructive" });
      return;
    }
    let updated: Member[];
    if (editing) {
      updated = members.map(m => m.id === editing.id ? { ...form, id: editing.id } : m);
      toast({ title: "Member updated" });
    } else {
      updated = [...members, { ...form, id: `${Date.now()}` }];
      toast({ title: "Member added" });
    }
    setMembers(updated);
    saveMembers(updated);
    setOpen(false);
  }

  function handleDelete(id: string) {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    saveMembers(updated);
    toast({ title: "Member removed" });
  }

  const field = (label: string, key: keyof typeof form, type = "text", required = false) => (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">
        {label}{required && <span className="text-[hsl(var(--kesari))] ml-1">*</span>}
      </label>
      <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full h-10 px-3 border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
    </div>
  );

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp space-y-8 pb-12">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-2 whitespace-nowrap">Admin</p>
              <h1 className="text-3xl font-bold text-foreground">Team Prayas</h1>
              <p className="text-sm text-muted-foreground mt-1">{members.length} members · Manage team, track birthdays.</p>
            </div>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 h-9 px-5 border border-foreground bg-transparent text-foreground text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-150">
              <Plus className="h-3.5 w-3.5" /> Add Member
            </button>
          </div>

          {/* Birthday alerts */}
          {birthdays.length > 0 && (
            <div className="border border-foreground bg-foreground text-background p-5">
              <div className="flex items-center gap-3 mb-3">
                <Gift className="h-5 w-5 text-[hsl(var(--kesari))]" />
                <span className="font-bold text-sm uppercase tracking-wider">🎂 Birthday Today!</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {birthdays.map(m => (
                  <div key={m.id} className="border border-white/20 px-4 py-2">
                    <p className="font-bold text-sm">{m.name}</p>
                    <p className="text-xs text-white/60">{m.designation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upcoming Birthdays (next 7 days)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {upcoming.sort((a, b) => daysUntilBirthday(a.dob) - daysUntilBirthday(b.dob)).map(m => (
                  <div key={m.id} className="border border-border px-4 py-2">
                    <p className="font-semibold text-sm text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.designation} · in {daysUntilBirthday(m.dob)} day{daysUntilBirthday(m.dob) !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or designation…"
              className="h-10 px-4 border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors w-full max-w-sm" />
            <span className="text-xs text-muted-foreground shrink-0">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Members list */}
          {filtered.length === 0 ? (
            <div className="border border-dashed border-border p-16 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">{members.length === 0 ? "No members yet" : "No results"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{members.length === 0 ? "Add your first team member above." : "Try a different search."}</p>
            </div>
          ) : (
            <div className="border border-border">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border bg-muted/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Designation</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map(m => (
                  <div key={m.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} className="h-8 w-8 object-cover shrink-0 border border-border" />
                      ) : (
                        <div className="h-8 w-8 bg-foreground flex items-center justify-center text-background text-xs font-bold shrink-0">
                          {m.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                        {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                      </div>
                    </div>
                    <p className="text-sm text-foreground truncate">{m.designation}</p>
                    <div>
                      <p className="text-sm text-foreground">{formatDOB(m.dob)}</p>
                      {isBirthdayToday(m.dob) && (
                        <span className="text-[10px] font-bold text-[hsl(var(--kesari))] uppercase tracking-wider">🎂 Today!</span>
                      )}
                      {!isBirthdayToday(m.dob) && isBirthdaySoon(m.dob) && (
                        <span className="text-[10px] text-muted-foreground">in {daysUntilBirthday(m.dob)}d</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(m)}
                        className="h-8 w-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(m.id)}
                        className="h-8 w-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add / Edit dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">{editing ? "Edit Member" : "Add Member"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {field("Full Name", "name", "text", true)}
                {field("Designation", "designation", "text", true)}
                {field("Date of Birth", "dob", "date", true)}
                {field("Phone", "phone", "tel")}
                {field("Email", "email", "email")}
                {field("Photo URL", "photo", "url")}
                <button onClick={handleSave}
                  className="w-full h-11 border border-foreground bg-transparent text-foreground text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-150">
                  {editing ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </AdminShell>
    </AdminGuard>
  );
}
