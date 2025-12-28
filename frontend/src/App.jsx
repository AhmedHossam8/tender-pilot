import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/contexts/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";

import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";

// pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgetPassword from "@/pages/auth/ForgetPassword";

import ComponentShowcase from "@/pages/ComponentShowcase";
import ProposalList from "@/pages/proposals/ProposalList";
import ProposalDetail from "@/pages/proposals/ProposalDetail";
import ProposalCreate from "./pages/proposals/ProposalCreate";
import ProposalReview from "./pages/proposals/ProposalReview";
import ProposalPreview from "./pages/proposals/ProposalPreview";

import TendersPage from "./pages/Tenders/TendersListPage";
import TenderCreatePage from "./pages/Tenders/TenderCreatePage";
import TenderDeletePage from "./pages/Tenders/TenderDeletePage";
import TenderEditPage from "./pages/Tenders/TenderEditPage";
import TenderDetailPage from "./pages/Tenders/TenderDetailPage";
import { AIDashboard, AIResultPanel } from "./pages/ai";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  const { initialize, user } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div dir={i18n.language === "ar" ? "rtl" : "ltr"} className="min-h-screen">
        <BrowserRouter>
          <Routes>
            {/* -------- AUTH ROUTES -------- */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgetPassword />} />
            </Route>

            {/* -------- PROTECTED APP -------- */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout showFooter />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<ComponentShowcase />} />

              <Route
                path="/proposals"
                element={
                  <RoleGuard allowed={["admin", "proposal_manager", "reviewer", "writer"]}>
                    <ProposalList />
                  </RoleGuard>
                }
              />

              <Route
                path="/proposals/:id/preview"
                element={
                  <RoleGuard allowed={["proposal_manager"]}>
                    <ProposalPreview />
                  </RoleGuard>
                }
              />

              <Route
                path="/proposals/:id/review"
                element={
                  <RoleGuard allowed={["reviewer"]}>
                    <ProposalReview />
                  </RoleGuard>
                }
              />

              <Route
                path="/proposals/create"
                element={
                  <RoleGuard allowed={["admin", "proposal_manager", "reviewer", "writer"]}>
                    <ProposalCreate />
                  </RoleGuard>
                }
              />

              <Route
                path="/proposals/:id"
                element={
                  <RoleGuard allowed={["admin", "proposal_manager", "reviewer", "writer"]}>
                    <ProposalDetail />
                  </RoleGuard>
                }
              />
              <Route path="/ai/dashboard" element={<AIDashboard />} />
              <Route path="/ai/results/:responseId" element={<AIResultPanel />} />
            </Route>

            <Route path="/unauthorized" element={<div>Unauthorized</div>} />

            {/* -------- TENDERS ROUTES -------- */}
            <Route
              path="/tenders"
              element={
                <ProtectedRoute>
                  <AppLayout showFooter />
                </ProtectedRoute>
              }
            >
              <Route index element={<TendersPage />} /> {/* /tenders */}
              <Route path="create" element={<TenderCreatePage />} /> {/* /tenders/create */}
              <Route path=":id" element={<TenderDetailPage />} /> {/* /tenders/:id */}
              <Route path=":id/edit" element={<TenderEditPage />} /> {/* /tenders/:id/edit */}
              <Route path=":id/delete" element={<TenderDeletePage />} /> {/* /tenders/:id/delete */}
            </Route>
          </Routes>
        </BrowserRouter>

        <Toaster position="top-right" richColors />
      </div>
    </QueryClientProvider>
  );
}

export default App;
