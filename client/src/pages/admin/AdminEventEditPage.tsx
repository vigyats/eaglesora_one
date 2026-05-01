import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useEvent, useUpdateEvent, useUpsertEventTranslation } from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, Trash2, Users, Mail, Upload, X, ImagePlus, Star, Languages } from "lucide-react";
import { useRequestUploadUrl } from "@/hooks/use-uploads";
import { TranslationReviewDialog, type TranslationReviewFields } from "@/components/TranslationReviewDialog";

type FormField = { id: string; label: string; type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox"; required: boolean; options?: string[] };

function ImageUploadField({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label: string }) {
  const { toast } = useToast();
  const requestUrl = useRequestUploadUrl();
  const [busy, setBusy] = useState(false);
  async function handleFile(file: File) {
    setBusy(true);
    try {
      const resp = await requestUrl.mutateAsync({ file, name: file.name, size: file.size, contentType: file.type || "image/jpeg" });
      onChange(resp.objectPath); toast({ title: "Uploaded" });
    } catch (e) { toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>
      <div className="border rounded-lg overflow-hidden">
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="w-full h-48 object-cover" />
            <button onClick={() => onChange(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 cursor-pointer bg-muted/40 hover:bg-muted/60 transition-colors">
            <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">{busy ? "Uploading..." : "Click to upload"}</span>
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.currentTarget.value = ""; }} />
          </label>
        )}
      </div>
    </div>
  );
}

function GalleryUploadField({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const { toast } = useToast();
  const requestUrl = useRequestUploadUrl();
  const [busy, setBusy] = useState(false);
  async function handleFiles(files: FileList) {
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const resp = await requestUrl.mutateAsync({ file, name: file.name, size: file.size, contentType: file.type || "image/jpeg" });
        uploaded.push(resp.objectPath);
      }
      onChange([...values, ...uploaded]);
      toast({ title: `${uploaded.length} image(s) uploaded` });
    } catch (e) { toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Event Images</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {values.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"><X className="w-3 h-3" /></button>
          </div>
        ))}
        <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">{busy ? "..." : "Add"}</span>
          <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => { if (e.target.files?.length) void handleFiles(e.target.files); e.currentTarget.value = ""; }} />
        </label>
      </div>
    </div>
  );
}

export default function AdminEventEditPage() {
  const params = useParams() as { id?: string };
  const id = Number(params.id);
  const { toast } = useToast();

  const q = useEvent(id, {});
  const upd = useUpdateEvent();
  const upsertTr = useUpsertEventTranslation();

  const [slug, setSlug] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationEndDate, setRegistrationEndDate] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [flyer, setFlyer] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [eventPrice, setEventPrice] = useState("");
  const [participationType, setParticipationType] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingReg, setLoadingReg] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"basics" | "content" | "form" | "participants">("basics");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [requirements, setRequirements] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [reviewOpen, setReviewOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const data: any = q.data;
    if (!data?.event || initialized.current) return;
    initialized.current = true;
    setSlug(data.event.slug || "");
    setCover(data.event.coverImagePath ?? null);
    setFlyer(data.event.flyerImagePath ?? null);
    setGallery(data.event.galleryImages || []);
    setEventPrice(data.event.eventPrice || "");
    setParticipationType(data.event.participationType || "");
    setIsFeatured(Boolean(data.event.isFeatured));
    setFormFields(data.event.registrationFormFields || []);
    setStartDate(data.event.startDate ? new Date(data.event.startDate).toISOString().slice(0, 16) : "");
    setEndDate(data.event.endDate ? new Date(data.event.endDate).toISOString().slice(0, 16) : "");
    setRegistrationStartDate(data.event.registrationStartDate ? new Date(data.event.registrationStartDate).toISOString().slice(0, 16) : "");
    setRegistrationEndDate(data.event.registrationEndDate ? new Date(data.event.registrationEndDate).toISOString().slice(0, 16) : "");
    const tr = (data.translations || []).find((t: any) => t.language === "en") || data.translations?.[0];
    if (tr) { setTitle(tr.title || ""); setLocation(tr.location || ""); setSummary(tr.summary || ""); setIntroduction(tr.introduction || ""); setRequirements(tr.requirements || ""); setContentHtml(tr.contentHtml || ""); setStatus(tr.status || "published"); }
  }, [q.data]);

  async function saveBasics() {
    if (!slug.trim()) return toast({ title: "Slug required", variant: "destructive" });
    if (!startDate) return toast({ title: "Event start date required", variant: "destructive" });
    try {
      await upd.mutateAsync({
        id, updates: {
          slug: slug.trim(), isFeatured,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          registrationStartDate: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
          registrationEndDate: registrationEndDate ? new Date(registrationEndDate).toISOString() : null,
          coverImagePath: cover, flyerImagePath: flyer, galleryImages: gallery,
          eventPrice: eventPrice.trim() || null,
          participationType: participationType.trim() || null,
          registrationFormFields: formFields.length > 0 ? formFields : null,
        },
      });
      toast({ title: "Saved" });
    } catch (e) { toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" }); }
  }

  async function saveContent() {
    if (!title.trim()) return toast({ title: "Title required", variant: "destructive" });
    try {
      await upsertTr.mutateAsync({ id, lang: "en", input: { language: "en", status, title: title.trim(), location: location.trim() || null, summary: summary.trim() || null, introduction: introduction.trim() || null, requirements: requirements.trim() || null, contentHtml: contentHtml || "" } });
      toast({ title: "Saved" });
    } catch (e) { toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" }); }
  }

  function getReviewTranslations(): TranslationReviewFields[] {
    const data: any = q.data;
    const stored: TranslationReviewFields[] = (data?.translations || []).map((t: any) => ({
      language: t.language,
      status: t.status,
      title: t.title || "",
      summary: t.summary ?? null,
      contentHtml: t.contentHtml || "",
      location: t.location ?? null,
      introduction: t.introduction ?? null,
      requirements: t.requirements ?? null,
    }));
    const enIdx = stored.findIndex((t) => t.language === "en");
    const enEntry: TranslationReviewFields = { language: "en", status, title: title.trim(), summary: summary.trim() || null, contentHtml, location: location.trim() || null, introduction: introduction.trim() || null, requirements: requirements.trim() || null };
    if (enIdx >= 0) stored[enIdx] = enEntry; else stored.push(enEntry);
    return stored;
  }

  async function handleReviewSave(lang: "en" | "hi" | "mr", fields: TranslationReviewFields) {
    await upsertTr.mutateAsync({
      id,
      lang,
      input: { language: lang, status: fields.status ?? status, title: fields.title, summary: fields.summary ?? null, contentHtml: fields.contentHtml, location: fields.location ?? null, introduction: fields.introduction ?? null, requirements: fields.requirements ?? null },
    });
  }

  async function loadRegistrations() {
    setLoadingReg(true);
    try {
      const res = await fetch(`/api/events/${id}/registrations`, { credentials: "include" });
      if (res.ok) setRegistrations(await res.json());
    } catch { toast({ title: "Error loading registrations", variant: "destructive" }); }
    finally { setLoadingReg(false); }
  }

  const tabs = [
    { key: "basics", label: "Basics" },
    { key: "content", label: "Content" },
    { key: "form", label: "Form" },
    { key: "participants", label: `Participants (${registrations.length})` },
  ] as const;

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp pb-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to events
            </Link>
            <Link href={`/events/${id}`} className="text-sm font-semibold text-primary hover:underline">View public</Link>
          </div>

          {q.isLoading ? <div className="h-40 shimmer rounded-lg" /> : q.isError || !(q.data as any)?.event ? (
            <p className="text-muted-foreground">Event not found.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-1 border-b">
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === "participants") void loadRegistrations(); }}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "basics" && (
                <div className="rounded-lg border bg-card p-6 space-y-5">
                  <h2 className="font-bold text-lg">Event Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium block mb-1.5">Slug *</label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
                    <div><label className="text-sm font-medium block mb-1.5">Event Price (₹)</label><Input value={eventPrice} onChange={(e) => setEventPrice(e.target.value)} placeholder="Free, 500, 1000" /></div>
                  </div>
                  <div><label className="text-sm font-medium block mb-1.5">Participation Type</label><Input value={participationType} onChange={(e) => setParticipationType(e.target.value)} placeholder="Team, Individual, Both" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium block mb-1.5">Event Start *</label><Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                    <div><label className="text-sm font-medium block mb-1.5">Event End</label><Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium block mb-1.5">Registration Start</label><Input type="datetime-local" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)} /></div>
                    <div><label className="text-sm font-medium block mb-1.5">Registration End</label><Input type="datetime-local" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} /></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/40" onClick={() => setIsFeatured(v => !v)}>
                    <Star className={`h-5 w-5 ${isFeatured ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                    <div><div className="text-sm font-semibold">Featured</div><div className="text-xs text-muted-foreground">Show on home page</div></div>
                    <div className={`ml-auto w-10 h-5 rounded-full transition-colors ${isFeatured ? "bg-yellow-500" : "bg-muted"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isFeatured ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </div>
                  <ImageUploadField value={cover} onChange={setCover} label="Cover Image" />
                  <ImageUploadField value={flyer} onChange={setFlyer} label="Event Flyer" />
                  <GalleryUploadField values={gallery} onChange={setGallery} />
                  <Button onClick={() => void saveBasics()} disabled={upd.isPending} className="w-full h-11 bg-white text-black border border-black hover:bg-black hover:text-white transition-colors">
                    <Save className="mr-2 h-4 w-4" />{upd.isPending ? "Saving…" : "Save Basics"}
                  </Button>
                </div>
              )}

              {activeTab === "content" && (
                <div className="rounded-lg border bg-card p-6 space-y-5">
                  <h2 className="font-bold text-lg">Content</h2>
                  <div className="flex gap-2">
                    {(["draft", "published"] as const).map(s => (
                      <button key={s} onClick={() => setStatus(s)}
                        className={`flex-1 h-9 text-xs font-bold capitalize rounded border transition-colors ${status === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>{s}</button>
                    ))}
                  </div>
                  <div><label className="text-sm font-medium block mb-1.5">Title *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                  <div><label className="text-sm font-medium block mb-1.5">Location</label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                  <div><label className="text-sm font-medium block mb-1.5">Summary</label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} /></div>
                  <div><label className="text-sm font-medium block mb-1.5">Introduction</label><Textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} rows={3} /></div>
                  <div><label className="text-sm font-medium block mb-1.5">Requirements</label><Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={2} /></div>
                  <div><label className="text-sm font-medium block mb-1.5">Detailed Content</label><RichTextEditor value={contentHtml} onChange={setContentHtml} /></div>
                  <div className="flex gap-3">
                    <Button onClick={() => void saveContent()} disabled={upsertTr.isPending} className="flex-1 h-11 bg-white text-black border border-black hover:bg-black hover:text-white transition-colors">
                      <Save className="mr-2 h-4 w-4" />{upsertTr.isPending ? "Saving…" : "Save EN"}
                    </Button>
                    <Button onClick={() => setReviewOpen(true)} variant="outline" className="h-11 px-4" title="Review all translations">
                      <Languages className="h-4 w-4 mr-2" /> Review Translations
                    </Button>
                  </div>

                  <TranslationReviewDialog
                    open={reviewOpen}
                    onClose={() => setReviewOpen(false)}
                    translations={getReviewTranslations()}
                    onSave={handleReviewSave}
                    variant="edit"
                    mode="event"
                  />
                </div>
              )}

              {activeTab === "form" && (
                <div className="rounded-lg border bg-card p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">Registration Form</h2>
                    <Button size="sm" onClick={() => setFormFields([...formFields, { id: `field_${Date.now()}`, label: "", type: "text", required: false }])}>
                      <Plus className="h-4 w-4 mr-1" /> Add Field
                    </Button>
                  </div>
                  {formFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No fields yet. Click "Add Field" to start.</p>
                  ) : formFields.map((field, i) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Field {i + 1}</span>
                        <button onClick={() => setFormFields(formFields.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium block mb-1">Label</label>
                          <Input value={field.label} onChange={(e) => setFormFields(formFields.map((f, j) => j === i ? { ...f, label: e.target.value } : f))} placeholder="Full Name" />
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1">Type</label>
                          <Select value={field.type} onValueChange={(v: any) => setFormFields(formFields.map((f, j) => j === i ? { ...f, type: v } : f))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["text", "email", "phone", "textarea", "select", "checkbox"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={field.required} onChange={(e) => setFormFields(formFields.map((f, j) => j === i ? { ...f, required: e.target.checked } : f))} />
                        Required
                      </label>
                      {field.type === "select" && (
                        <div>
                          <label className="text-xs font-medium block mb-1">Options (comma-separated)</label>
                          <Input value={field.options?.join(", ") || ""} onChange={(e) => setFormFields(formFields.map((f, j) => j === i ? { ...f, options: e.target.value.split(",").map(s => s.trim()) } : f))} />
                        </div>
                      )}
                    </div>
                  ))}
                  <Button onClick={() => void saveBasics()} className="w-full h-11 bg-white text-black border border-black hover:bg-black hover:text-white transition-colors">
                    <Save className="mr-2 h-4 w-4" /> Save Form
                  </Button>
                </div>
              )}

              {activeTab === "participants" && (
                <div className="rounded-lg border bg-card p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Participants</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={async () => { const r = await fetch(`/api/events/${id}/send-reminders`, { method: "POST", credentials: "include" }); const d = await r.json(); toast({ title: `Reminders sent to ${d.sent}/${d.total}` }); }}>
                        <Mail className="h-4 w-4 mr-1" /> Reminders
                      </Button>
                      <Button variant="outline" size="sm" onClick={async () => { const r = await fetch(`/api/events/${id}/send-thank-you`, { method: "POST", credentials: "include" }); const d = await r.json(); toast({ title: `Thank you sent to ${d.sent}/${d.total}` }); }}>
                        <Mail className="h-4 w-4 mr-1" /> Thank You
                      </Button>
                      <Button size="sm" onClick={() => void loadRegistrations()}>Refresh</Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(`/api/events/${id}/registrations/export`, "_blank")}>Export CSV</Button>
                    </div>
                  </div>
                  {loadingReg ? <p className="text-center text-muted-foreground py-8">Loading...</p>
                    : registrations.length === 0 ? <p className="text-center text-muted-foreground py-8">No registrations yet.</p>
                    : registrations.map((reg: any) => (
                      <div key={reg.id} className="border rounded-lg p-4 cursor-pointer hover:bg-muted/40" onClick={() => setSelectedParticipant(reg)}>
                        <div className="text-xs text-muted-foreground mb-1">{new Date(reg.registeredAt).toLocaleString()}</div>
                        <div className="text-sm">{Object.values(reg.formData).slice(0, 2).join(" · ")}</div>
                        <div className="text-xs text-primary mt-1">View details →</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Participant Details</DialogTitle></DialogHeader>
              {selectedParticipant && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{new Date(selectedParticipant.registeredAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</p>
                  {Object.entries(selectedParticipant.formData).map(([k, v]) => (
                    <div key={k} className="border-b pb-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">{k}</div>
                      <div className="text-sm font-medium">{String(v)}</div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
