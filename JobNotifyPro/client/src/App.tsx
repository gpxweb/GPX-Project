import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/ui/navbar";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import Subscribers from "@/pages/subscribers";
import Campaigns from "@/pages/campaigns";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/jobs" component={Jobs} />
      <ProtectedRoute path="/subscribers" component={Subscribers} />
      <ProtectedRoute path="/campaigns" component={Campaigns} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-background flex flex-col mx-auto max-w-7xl">
            <Navbar />
            <main className="flex-1 w-full mx-auto">
              <Router />
            </main>
            <Toaster />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;