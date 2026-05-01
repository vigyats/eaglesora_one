import { useMemo, useState } from "react";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useAdminMe, useAdmins, useCreateAdmin, useUpdateAdmin } from "@/hooks/use-admins";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Shield, UserCog, Ban, CheckCircle2 } from "lucide-react";

export default function SuperAdminAdminsPage() {
  const { toast } = useToast();
  const adminMe = useAdminMe();
  const list = useAdmins();
  const create = useCreateAdmin();
  const update = useUpdateAdmin();

  const isSuper = adminMe.data?.role === "super_admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");

  const items = useMemo(() => (list.data || []).slice().sort((a, b) => b.id - a.id), [list.data]);

  async function handleCreate() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast({ title: "All fields required", description: "Username, email, and password are required.", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({ username: username.trim(), email: email.trim(), password: password.trim(), role });
      toast({ title: "Admin added", description: "Admin account created successfully.", variant: "default" });
      setCreateOpen(false);
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("admin");
    } catch (e) {
      toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function setActive(id: number, isActive: boolean) {
    try {
      await update.mutateAsync({ id, updates: { isActive } });
      toast({ title: "Updated", description: isActive ? "Admin activated." : "Admin deactivated.", variant: "default" });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function setAdminRole(id: number, next: "admin" | "super_admin") {
    try {
      await update.mutateAsync({ id, updates: { role: next } });
      toast({ title: "Updated", description: `Role set to ${next}.`, variant: "default" });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp">
            <div className="rounded-lg border bg-card shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Super admin</div>
                  <h1 className="mt-1 text-3xl font-bold">Manage admins</h1>
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                    Add admins with username, email, and password. Activate/deactivate access and assign roles.
                  </p>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setCreateOpen(true)}
                      disabled={!isSuper}
                      className="font-semibold"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add admin
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl">Add admin</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Username</div>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter username"
                        />
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Email</div>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Password</div>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                      </div>

                      <div className="text-sm font-medium mb-2">Role</div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={role === "admin" ? "default" : "outline"}
                          onClick={() => setRole("admin")}
                          className="flex-1"
                        >
                          Admin
                        </Button>
                        <Button
                          type="button"
                          variant={role === "super_admin" ? "default" : "outline"}
                          onClick={() => setRole("super_admin")}
                          className="flex-1"
                        >
                          Super admin
                        </Button>
                      </div>

                      <Button
                        onClick={() => void handleCreate()}
                        disabled={create.isPending}
                        className="w-full"
                      >
                        {create.isPending ? "Adding…" : "Add admin"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {!isSuper ? (
                <div className="mt-5 rounded-lg border bg-muted/50 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 mt-0.5" />
                    <div>
                      <div className="font-bold">Restricted</div>
                      <div className="text-muted-foreground">
                        Only super admins can manage admin accounts. If you need access, ask a super admin to update your role.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-lg border bg-card shadow-lg overflow-hidden">
            <div className="p-4 border-b">
              <div className="text-sm font-bold">Admins</div>
              <div className="text-xs text-muted-foreground">List, role changes, and activation controls.</div>
            </div>

            <div className="p-4">
              {list.isLoading ? (
                <div className="rounded-lg border bg-muted/50 p-6 animate-pulse" />
              ) : list.isError ? (
                <div className="rounded-lg border bg-card p-6">
                  <div className="text-sm font-bold">Failed to load</div>
                  <div className="mt-1 text-sm text-muted-foreground">{(list.error as Error).message}</div>
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border bg-card p-8">
                  <div className="text-lg font-bold">No admins yet</div>
                  <div className="mt-2 text-sm text-muted-foreground">Add an admin using the button above.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {items.map((a) => {
                    return (
                      <div key={a.id} className="rounded-lg border bg-card p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-semibold">
                                <UserCog className="h-4 w-4" />
                                {a.role}
                              </span>
                              <span className={cn("inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-semibold",
                                a.isActive ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400" : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
                              )}>
                                {a.isActive ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                {a.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground">Admin ID: <span className="font-semibold text-foreground">{a.id}</span></div>
                            <div className="mt-1 text-xs text-muted-foreground break-all">User ID: <span className="font-semibold text-foreground">{a.userId}</span></div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!isSuper || update.isPending}
                              onClick={() => void setActive(a.id, !a.isActive)}
                            >
                              {a.isActive ? "Deactivate" : "Activate"}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!isSuper || update.isPending}
                              onClick={() => void setAdminRole(a.id, a.role === "admin" ? "super_admin" : "admin")}
                            >
                              {a.role === "admin" ? "Make super" : "Make admin"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
