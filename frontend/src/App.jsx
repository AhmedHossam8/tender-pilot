import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";

import ComponentShowcase from "./pages/ComponentShowcase";
import ProposalList from "./pages/ProposalList";
import ProposalDetail from "./pages/ProposalDetail";
import AppLayout from "@/layouts/AppLayout";

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
  const { i18n } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <div dir={i18n.language === "ar" ? "rtl" : "ltr"} className="min-h-screen">
        <BrowserRouter>
          <Routes>
            {/* Routes with AppLayout */}
            <Route element={<AppLayout user={user} showFooter={true} />}>
              <Route path="/" element={<ComponentShowcase />} />
              <Route path="/proposals" element={<ProposalList />} />
              <Route path="/proposals/:id" element={<ProposalDetail />} />
              <Route path="/components" element={<ComponentShowcase />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </QueryClientProvider>
  );
}

export default App;
