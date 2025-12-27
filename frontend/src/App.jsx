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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  const { initialize } = useAuthStore();
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
              <Route path="/forgot-password" element={<ForgotPassword />} />
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
                  <RoleGuard allowed={["admin", "proposal_manager", "reviewer"]}>
                    <ProposalList />
                  </RoleGuard>
                }
              />

              <Route
                path="/proposals/:id"
                element={
                  <RoleGuard allowed={["admin", "proposal_manager", "reviewer"]}>
                    <ProposalDetail />
                  </RoleGuard>
                }
              />
            </Route>

            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </BrowserRouter>

        <Toaster position="top-right" richColors />
      </div>
    </QueryClientProvider>
  );
}

export default App;
