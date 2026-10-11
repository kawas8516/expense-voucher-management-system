import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// roles = which roles can open this page
function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={"/" + user.role} />;
  }
  return children;
}

export default ProtectedRoute;
