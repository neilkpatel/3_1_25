import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/lib/notifications";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { NavBar } from "@/components/nav-bar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Friends from "@/pages/friends";
import AuthPage from "@/pages/auth";

function Router() {
  return (
    <div>
      <NavBar />
      <Switch>
        <ProtectedRoute path="/" component={Home} />
        <ProtectedRoute path="/friends" component={Friends} />
        <Route path="/auth" component={AuthPage} />
        <Route path="*" component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router />
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;