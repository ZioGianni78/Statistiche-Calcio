import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // This will be our Dashboard
import NotFound from "./pages/NotFound";
import MatchesPage from "./pages/Matches";
import PlayerStatsPage from "./pages/PlayerStatsPage";
import StopwatchPage from "./pages/StopwatchPage";
import LoginPage from "./pages/LoginPage"; // Import LoginPage
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import AppLayout from "./components/AppLayout";


const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* The background gradient is now applied to the main container */}
          <div className="flex min-h-screen bg-gradient-to-br from-white to-blue-100 dark:from-gray-900 dark:to-blue-900">
            <Routes>
              {/* Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              {/* Use ProtectedRoute as the element for the routes that require authentication */}
              <Route element={<ProtectedRoute />}>
                 {/* AppLayout contains the sidebar and renders the nested routes via Outlet */}
                <Route element={<AppLayout />}>
                  <Route index element={<Index />} /> {/* Dashboard is the index route */}
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/player-stats" element={<PlayerStatsPage />} />
                  <Route path="/stopwatch" element={<StopwatchPage />} />
                </Route>
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              {/* Catch-all for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;