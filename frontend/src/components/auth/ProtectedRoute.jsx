import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../contexts/authStore";

const ProtectedRoute = ({ children }) => {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuthStore();

  // Wait for auth to initialize before rendering
  if (loading) return <div className="p-4 text-center">{t('common.loading')}</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
