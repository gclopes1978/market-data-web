import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// Global query defaults.
// - staleTime 30s: switching currency back and forth reuses cached data instead of hitting the API again.
// - retry 1: absorbs a transient network blip without making a real outage take long to show an error.
// - refetchOnWindowFocus off: market cards already poll on their own interval; focus refetches would be noise.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
