import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import OfflineIndicator from "@/components/layout/offline-indicator";
import Landing from "@/pages/landing";
import Demo from "@/pages/demo";
import Dashboard from "@/pages/dashboard";
import AISummaries from "@/pages/ai-summaries";
import Patients from "@/pages/patients";
import Analytics from "@/pages/analytics";
import ConsentManagement from "@/pages/consent-management";
import AuditLogs from "@/pages/audit-logs";
import NotFound from "@/pages/not-found";
import WorkflowBuilder from "@/pages/workflow-builder";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-clinical-gray-50">
      <OfflineIndicator />
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/demo" component={Demo} />
      <Route path="/dashboard" component={() => <AppLayout><Dashboard /></AppLayout>} />
      <Route path="/summaries" component={() => <AppLayout><AISummaries /></AppLayout>} />
      <Route path="/patients" component={() => <AppLayout><Patients /></AppLayout>} />
      <Route path="/analytics" component={() => <AppLayout><Analytics /></AppLayout>} />
      <Route path="/consent" component={() => <AppLayout><ConsentManagement /></AppLayout>} />
      <Route path="/audit" component={() => <AppLayout><AuditLogs /></AppLayout>} />
      <Route path="/workflow-builder/:id?" component={() => <AppLayout><WorkflowBuilder /></AppLayout>} />
      <Route path="/workflows" component={() => <AppLayout><WorkflowBuilder /></AppLayout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="medflect-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
