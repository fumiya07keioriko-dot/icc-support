import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PinAuthProvider, usePinAuth } from "./contexts/PinAuthContext";
import { MySelfProvider } from "./contexts/MySelfContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Staff from "./pages/Staff";
import Tasks from "./pages/Tasks";
import VenueMap from "./pages/VenueMap";
import Tetris from "./pages/Tetris";
import Admin from "./pages/Admin";
import { Loader2 } from "lucide-react";

function AuthGate() {
  const { authenticated, loading } = usePinAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/staff" component={Staff} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/map" component={VenueMap} />
      <Route path="/tetris" component={Tetris} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PinAuthProvider>
            <MySelfProvider>
              <AuthGate />
            </MySelfProvider>
          </PinAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
