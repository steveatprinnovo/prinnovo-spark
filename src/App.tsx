import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// TooltipProvider removed to fix hook runtime issue
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/implementations" element={<Implementations />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/projections" element={<Projections />} />
          <Route path="/focus-areas" element={<FocusAreas />} />
          <Route path="/board-mode" element={<BoardMode />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dealflow" element={<Dealflow />} />
          <Route path="/dealflow/:id" element={<DealDetail />} />
          <Route path="/taskboard" element={<Taskboard />} />
          <Route path="/taskboard/archive" element={<Taskboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
