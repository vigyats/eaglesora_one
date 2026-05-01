import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as ShadToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import PrayasvanPage from "@/pages/PrayasvanPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailPage from "@/pages/EventDetailPage";
import AboutPage from "@/pages/AboutPage";
import DonatePage from "@/pages/DonatePage";
import GalleryPage from "@/pages/GalleryPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminProjectsPage from "@/pages/admin/AdminProjectsPage";
import AdminProjectCreatePage from "@/pages/admin/AdminProjectCreatePage";
import AdminProjectEditPage from "@/pages/admin/AdminProjectEditPage";
import AdminEventsPage from "@/pages/admin/AdminEventsPage";
import AdminEventCreatePage from "@/pages/admin/AdminEventCreatePage";
import AdminEventEditPage from "@/pages/admin/AdminEventEditPage";
import SuperAdminAdminsPage from "@/pages/admin/SuperAdminAdminsPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminTeamPage from "@/pages/admin/AdminTeamPage";
import AdminYouTubePage from "@/pages/admin/AdminYouTubePage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { RouteTricolourLoader } from "@/components/RouteTricolourLoader";
import { useRouteLoader } from "@/hooks/use-route-loader";
import { I18nProvider } from "@/hooks/use-i18n";
import { ThemeProvider } from "@/components/ThemeProvider";

function Router() {
  const { isRouteLoading } = useRouteLoader();

  return (
    <>
      <RouteTricolourLoader show={isRouteLoading} />
      <Switch>
        {/* Public */}
        <Route path="/" component={HomePage} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/projects/prayas-one" component={PrayasvanPage} />
        <Route path="/projects/:id" component={ProjectDetailPage} />
        <Route path="/events" component={EventsPage} />
        <Route path="/events/:id" component={EventDetailPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/donate" component={DonatePage} />
        <Route path="/gallery" component={GalleryPage} />

        {/* Admin */}
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/admin" component={AdminDashboardPage} />
        <Route path="/admin/analytics" component={AdminAnalyticsPage} />
        <Route path="/admin/projects" component={AdminProjectsPage} />
        <Route path="/admin/projects/new" component={AdminProjectCreatePage} />
        <Route path="/admin/projects/:id" component={AdminProjectEditPage} />
        <Route path="/admin/events" component={AdminEventsPage} />
        <Route path="/admin/events/new" component={AdminEventCreatePage} />
        <Route path="/admin/events/:id" component={AdminEventEditPage} />
        <Route path="/admin/admins" component={SuperAdminAdminsPage} />
        <Route path="/admin/team" component={AdminTeamPage} />
        <Route path="/admin/youtube" component={AdminYouTubePage} />

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <I18nProvider>
            <ShadToaster />
            <Router />
          </I18nProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
