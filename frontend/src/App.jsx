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
import PublicLayout from "@/layouts/PublicLayout";

// Public pages
import LandingPage from "@/pages/public/LandingPage";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgetPassword from "@/pages/auth/ForgetPassword";

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

// Dashboard pages
import { ClientDashboard, ProviderDashboard } from "./pages/dashboard";

// Profile pages
import { EditProfilePage, PublicProfilePage } from "./pages/Profile";

// Search pages
import SearchResultsPage from "./pages/search/SearchResultsPage";

// Messages pages
import { MessagesList, ChatPage } from "./pages/messages";

// Settings & Help pages
import SettingsPage from "./pages/settings/SettingsPage";
import HelpPage from "./pages/help/HelpPage";
import NotFoundPage from "./pages/NotFoundPage";

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
            {/* -------- PUBLIC ROUTES -------- */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

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
              <Route path="/app" element={<ProjectList />} />

              {/* AI */}
              <Route path="/app/ai/dashboard" element={<AIDashboard />} />
              <Route path="/app/ai/results/:responseId" element={<AIResultPanel />} />

              {/* Search */}
              <Route path="/app/search" element={<SearchResultsPage />} />

              {/* Dashboards */}
              <Route path="/app/dashboard/client" element={<ClientDashboard />} />
              <Route path="/app/dashboard/provider" element={<ProviderDashboard />} />

              {/* Profile */}
              <Route path="/app/profile/edit" element={<EditProfilePage />} />
              <Route path="/app/profiles/:userId" element={<PublicProfilePage />} />

              {/* Bids */}
              <Route
                path="/app/bids"
                element={
                  <RoleGuard allowed={["admin", "client", "provider"]}>
                    <BidList />
                  </RoleGuard>
                }
              />
              <Route
                path="/app/bids/create"
                element={
                  <RoleGuard allowed={["provider"]}>
                    <BidCreate />
                  </RoleGuard>
                }
              />
              <Route
                path="/app/bids/:id"
                element={
                  <RoleGuard allowed={["admin", "client", "provider"]}>
                    <BidDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/app/bids/:id/preview"
                element={
                  <RoleGuard allowed={["client"]}>
                    <BidPreview />
                  </RoleGuard>
                }
              />
              <Route
                path="/app/bids/:id/review"
                element={
                  <RoleGuard allowed={["client"]}>
                    <BidReview />
                  </RoleGuard>
                }
              />

              {/* Projects */}
              <Route path="/app/projects">
                <Route index element={<ProjectList />} /> {/* /app/projects */}
                <Route path=":id" element={<ProjectDetail />} /> {/* /app/projects/:id */}
              </Route>

              {/* Services */}
              <Route path="/app/services" element={<ServicesList />} />
              <Route path="/app/services/:id/book" element={<BookServicePage />} />
              <Route path="/app/bookings" element={<BookingsList />} />

              {/* Messages */}
              <Route path="/app/messages" element={<MessagesList />} />
              <Route path="/app/messages/:id" element={<ChatPage />} />

              {/* Settings & Help */}
              <Route path="/app/settings" element={<SettingsPage />} />
              <Route path="/app/help" element={<HelpPage />} />
            </Route>

            {/* 404 and other routes */}
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>

        <Toaster position="top-right" richColors />
      </div>
    </QueryClientProvider>
  );
}

export default App;
