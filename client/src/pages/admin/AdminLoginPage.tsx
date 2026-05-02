import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "", rememberMe: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: formData.identifier, password: formData.password, rememberMe: formData.rememberMe }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Login failed");
      toast({ title: "Welcome back!" });
      setLocation("/admin");
    } catch (err) {
      toast({ title: "Login failed", description: err instanceof Error ? err.message : "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-2">Username or Email</label>
              <input
                type="text" required
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--kesari))] transition-colors"
                placeholder="Username or email"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-2">Password</label>
              <input
                type="password" required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--kesari))] transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" className="sr-only peer"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })} />
                <div className="w-4 h-4 border-2 border-border peer-checked:bg-[hsl(var(--kesari))] peer-checked:border-[hsl(var(--kesari))] transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {formData.rememberMe && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">Remember me for 30 days</span>
            </label>
            <button
              type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[hsl(var(--kesari))] text-white font-semibold text-sm border-2 border-[hsl(var(--kesari))] hover:bg-[hsl(var(--kesari-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-2"
            >
              {isLoading ? "Signing in…" : "Sign In"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <button onClick={() => setLocation("/")} className="mt-6 text-sm text-muted-foreground hover:text-[hsl(var(--kesari))] transition-colors">
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Right — dark panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col justify-between p-14">
        <div />
        <div>
          <div className="w-10 h-0.5 bg-[hsl(var(--kesari))] mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug">Admin Panel<br />Prayas Yavatmal</h2>
          <p className="text-white/50 text-sm leading-relaxed">Manage projects, events, and community content from one place.</p>
        </div>
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} Prayas Yavatmal</p>
      </div>
    </div>
  );
}
