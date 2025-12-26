import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import ComponentShowcase from "./pages/ComponentShowcase";
import ProposalList from "./pages/ProposalList";
// import ProposalDetail from "./pages/ProposalDetail";
import "./index.css";
import AppLayout from "@/layouts/AppLayout"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  const user = { name: "Ahmed", role: "ADMIN" };
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Routes with AppLayout */}
          <Route element={<AppLayout user={user} showFooter={true} />}>
            <Route path="/" element={<ComponentShowcase />} />
            <Route path="/proposals" element={<ProposalList />} />
            {/* <Route path="/proposals/:id" element={<ProposalDetail />} /> */}

            <Route path="/components" element={<ComponentShowcase />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
