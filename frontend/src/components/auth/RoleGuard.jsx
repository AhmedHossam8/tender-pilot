import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../contexts/authStore";
import { ROLE_ACCESS } from "../../lib/roles";

const RoleGuard = ({ allowed = [], children }) => {
  const { role, userType, loading } = useAuthStore();

  if (loading) return null;

  if (!role && !userType) return <Navigate to="/login" replace />;

  // Check if allowed contains user_type values (client, provider) or role values (admin, etc)
  // First check userType (client/provider/both)
  if (userType && allowed.includes(userType)) {
    return children;
  }

  // If userType is "both", allow access to both client and provider routes
  if (userType === "both" && (allowed.includes("client") || allowed.includes("provider"))) {
    return children;
  }

  // Then check role-based permissions using ROLE_ACCESS mapping
  const permitted = allowed.flatMap(
    (r) => ROLE_ACCESS[r] || []
  );

  if (permitted.includes(role)) {
    return children;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default RoleGuard;
