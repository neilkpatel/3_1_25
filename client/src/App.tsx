import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/lib/notifications";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Friends from "@/pages/friends";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/friends" component={Friends} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Router />
        <Toaster />
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;