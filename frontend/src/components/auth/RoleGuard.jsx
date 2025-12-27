import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../contexts/authStore";
import { ROLE_ACCESS } from "../../lib/roles";

const RoleGuard = ({ allowed = [], children }) => {
  const { role, loading } = useAuthStore();

  if (loading) return null;

  if (!role) return <Navigate to="/login" replace />;

  const permitted = allowed.flatMap(
    (r) => ROLE_ACCESS[r] || []
  );

  if (!permitted.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;
