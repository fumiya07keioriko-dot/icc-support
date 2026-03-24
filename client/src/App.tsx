import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MySelfProvider } from "./contexts/MySelfContext";
import Dashboard from "./pages/Dashboard";
import Staff from "./pages/Staff";
import Tasks from "./pages/Tasks";
import VenueMap from "./pages/VenueMap";
import Tetris from "./pages/Tetris";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <MySelfProvider>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/staff" component={Staff} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/map" component={VenueMap} />
              <Route path="/tetris" component={Tetris} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </MySelfProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
