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

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgetPassword from "@/pages/auth/ForgetPassword";

// Component showcase
import ComponentShowcase from "@/pages/ComponentShowcase";

// Proposal pages
import ProposalList from "@/pages/proposals/ProposalList";
import ProposalDetail from "@/pages/proposals/ProposalDetail";
import ProposalCreate from "./pages/proposals/ProposalCreate";
import ProposalReview from "./pages/proposals/ProposalReview";
import ProposalPreview from "./pages/proposals/ProposalPreview";

// Bid pages
import BidList from "@/pages/Bids/BidList";
import BidDetail from "@/pages/Bids/BidDetail";
import BidCreate from "./pages/Bids/BidCreate";
import BidPreview from "./pages/Bids/BidPreview";
import BidReview from "./pages/Bids/BidReview";

// Project pages (formerly Tenders)
import ProjectList from './pages/Projects/ProjectsList';
import ProjectDetail from "./pages/Projects/ProjectDetails";

// Service pages
import ServicesList from "@/pages/Services/ServicesList";
import BookServicePage from "@/pages/Services/BookServicePage";
import BookingsList from "@/pages/Services/BookingsList";

// AI pages
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

              {/* Proposals */}
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

              {/* AI */}
              <Route path="/ai/dashboard" element={<AIDashboard />} />
              <Route path="/ai/results/:responseId" element={<AIResultPanel />} />

              {/* Bids */}
              <Route
                path="/bids"
                element={
                  <RoleGuard allowed={["admin", "client", "provider"]}>
                    <BidList />
                  </RoleGuard>
                }
              />
              <Route
                path="/bids/create"
                element={
                  <RoleGuard allowed={["provider"]}>
                    <BidCreate />
                  </RoleGuard>
                }
              />
              <Route
                path="/bids/:id"
                element={
                  <RoleGuard allowed={["admin", "client", "provider"]}>
                    <BidDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/bids/:id/preview"
                element={
                  <RoleGuard allowed={["client"]}>
                    <BidPreview />
                  </RoleGuard>
                }
              />
              <Route
                path="/bids/:id/review"
                element={
                  <RoleGuard allowed={["client"]}>
                    <BidReview />
                  </RoleGuard>
                }
              />

              {/* Projects */}
              <Route path="/projects">
                <Route index element={<ProjectList />} /> {/* /projects */}
                <Route path=":id" element={<ProjectDetail />} /> {/* /projects/:id */}
              </Route>

              {/* Services */}
              <Route path="/services" element={<ServicesList />} />
              <Route path="/services/:id/book" element={<BookServicePage />} />
              <Route path="/bookings" element={<BookingsList />} />
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
