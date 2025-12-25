import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { Web3Provider } from "@/lib/web3";
import { initializeAppKit } from "@/lib/appkit";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing wallet connection...</p>
      </div>
    </div>
  );
}

function InitErrorBanner({ error }: { error: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/90 text-destructive-foreground px-4 py-2 text-center text-sm">
      Wallet connection unavailable: {error}
    </div>
  );
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeAppKit()
      .then(() => {
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error("Failed to initialize:", error);
        setInitError(error.message);
        setIsInitialized(true);
      });
  }, []);

  if (!isInitialized) {
    return (
      <ThemeProvider>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Web3Provider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {initError && <InitErrorBanner error={initError} />}
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
