import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { MotionConfig } from "framer-motion";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// CarbonLens is a dark-only theme
if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
}

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Portfolio = lazy(() => import("./components/dashboard-shell.tsx"));
const Marketplace = lazy(() =>
  import("./components/marketplace.tsx").then((m) => ({ default: m.MarketplaceScreen })),
);
const Scans = lazy(() =>
  import("./components/marketplace.tsx").then((m) => ({ default: m.CorridorScans })),
);
const Analytics = lazy(() =>
  import("./components/insights.tsx").then((m) => ({ default: m.AnalyticsScreen })),
);
const Terminal = lazy(() =>
  import("./components/insights.tsx").then((m) => ({ default: m.TerminalScreen })),
);
const Ledger = lazy(() =>
  import("./components/ledger.tsx").then((m) => ({ default: m.LedgerScreen })),
);
const NewTrade = lazy(() =>
  import("./components/ledger.tsx").then((m) => ({ default: m.BuySellWorkspace })),
);
const CreditPage = lazy(() =>
  import("./components/credit-detail.tsx").then((m) => ({ default: m.CreditDetailScreen })),
);

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        {/* Respect the OS reduced-motion preference for all framer-motion animations */}
        <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <RequireAuth>
                    <Portfolio />
                  </RequireAuth>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <RequireAuth>
                    <Marketplace />
                  </RequireAuth>
                }
              />
              <Route
                path="/scans"
                element={
                  <RequireAuth>
                    <Scans />
                  </RequireAuth>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireAuth>
                    <Analytics />
                  </RequireAuth>
                }
              />
              <Route
                path="/ledger"
                element={
                  <RequireAuth>
                    <Ledger />
                  </RequireAuth>
                }
              />
              <Route
                path="/terminal"
                element={
                  <RequireAuth>
                    <Terminal />
                  </RequireAuth>
                }
              />
              <Route
                path="/credit/:creditId"
                element={
                  <RequireAuth>
                    <CreditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/portfolio/new"
                element={
                  <RequireAuth>
                    <NewTrade />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
        </MotionConfig>
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
