import { PropsWithChildren, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAdminMe } from "@/hooks/use-admins";

export function AdminGuard({ children }: PropsWithChildren) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const adminMe = useAdminMe();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({ title: "Login required", description: "Redirecting to login…", variant: "destructive" });
      setTimeout(() => setLocation("/admin/login"), 500);
    }
  }, [authLoading, isAuthenticated, toast, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="rounded-lg border bg-card p-6 shadow-lg">
          <div className="h-10 w-10 rounded-lg border bg-background grid place-items-center mx-auto">
            <div className="h-4 w-4 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
          </div>
          <div className="mt-4 text-sm font-bold text-center">Checking authentication…</div>
          <div className="mt-1 text-sm text-muted-foreground text-center">Secure session required.</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (adminMe.isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="rounded-lg border bg-card p-6 shadow-lg">
          <div className="text-sm font-bold text-center">Checking admin access…</div>
          <div className="mt-2 h-2 w-64 rounded-full overflow-hidden border bg-muted">
            <div className="h-full w-2/3 bg-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (adminMe.isError) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="rounded-lg border bg-card p-6 shadow-lg max-w-lg">
          <div className="text-sm font-bold">Cannot verify admin status</div>
          <div className="mt-1 text-sm text-muted-foreground">{(adminMe.error as Error)?.message}</div>
        </div>
      </div>
    );
  }

  if (!adminMe.data?.isAdmin) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="rounded-lg border bg-card p-8 shadow-lg max-w-xl">
          <div className="text-lg font-bold">Access restricted</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Your account is authenticated, but not registered as an admin. Ask a super admin to grant access.
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-5 w-full rounded-md px-4 py-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
