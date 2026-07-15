import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// TooltipProvider removed to fix hook runtime issue
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleGate } from "./components/RoleGate";
import Index from "./pages/Index";

// Route-level code splitting: each page loads on demand so the initial
// bundle carries only the home route. Heavy libraries (mapbox, xlsx,
// recharts) are further isolated via manualChunks in vite.config.ts.
const Auth = lazy(() => import("./pages/Auth"));
const Implementations = lazy(() => import("./pages/Implementations"));
const Investments = lazy(() => import("./pages/Investments"));
const Projections = lazy(() => import("./pages/Projections"));
const FocusAreas = lazy(() => import("./pages/FocusAreas"));
const BoardMode = lazy(() => import("./pages/BoardMode"));
const Settings = lazy(() => import("./pages/Settings"));
const Dealflow = lazy(() => import("./pages/Dealflow"));
const DealDetail = lazy(() => import("./pages/DealDetail"));
const Taskboard = lazy(() => import("./pages/Taskboard"));
const Reporting = lazy(() => import("./pages/Reporting"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Role access per RBAC design (2026-07-14): technical users are
              limited to Taskboard + Implementations; all other roles keep
              their pages. RLS enforces the same matrix server-side. */}
          <Route path="/" element={<RoleGate allow={["admin", "user", "vo_leader"]}><Index /></RoleGate>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/implementations" element={<RoleGate allow={["admin", "user", "vo_leader", "technical"]}><Implementations /></RoleGate>} />
          <Route path="/investments" element={<RoleGate allow={["admin", "user", "vo_leader"]}><Investments /></RoleGate>} />
          <Route path="/projections" element={<RoleGate allow={["admin", "user", "vo_leader"]}><Projections /></RoleGate>} />
          <Route path="/focus-areas" element={<RoleGate allow={["admin", "user", "vo_leader"]}><FocusAreas /></RoleGate>} />
          <Route path="/board-mode" element={<RoleGate allow={["admin", "user", "vo_leader"]}><BoardMode /></RoleGate>} />
          <Route path="/settings" element={<RoleGate allow={["admin", "user", "vo_leader"]}><Settings /></RoleGate>} />
          <Route path="/dealflow" element={<RoleGate allow={["admin", "user", "vo_leader"]}><Dealflow /></RoleGate>} />
          <Route path="/dealflow/:id" element={<RoleGate allow={["admin", "user", "vo_leader"]}><DealDetail /></RoleGate>} />
          <Route path="/taskboard" element={<RoleGate allow={["admin", "user", "vo_leader", "technical"]}><Taskboard /></RoleGate>} />
          <Route path="/taskboard/archive" element={<RoleGate allow={["admin", "user", "vo_leader", "technical"]}><Taskboard /></RoleGate>} />
          <Route path="/reporting" element={<RoleGate allow={["admin", "user", "vo_leader", "technical"]}><Reporting /></RoleGate>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
