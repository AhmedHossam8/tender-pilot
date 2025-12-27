import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../contexts/authStore";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  // Wait for auth to initialize before rendering
  if (loading) return <div className="p-4 text-center">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
