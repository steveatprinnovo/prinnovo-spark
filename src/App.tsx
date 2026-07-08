import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// TooltipProvider removed to fix hook runtime issue
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Implementations from "./pages/Implementations";
import Investments from "./pages/Investments";
import Projections from "./pages/Projections";
import FocusAreas from "./pages/FocusAreas";
import BoardMode from "./pages/BoardMode";
import Settings from "./pages/Settings";
import Dealflow from "./pages/Dealflow";
import DealDetail from "./pages/DealDetail";
import Taskboard from "./pages/Taskboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    
  </QueryClientProvider>
);

export default App;
