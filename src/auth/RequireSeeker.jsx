import { Navigate, useLocation } from "react-router-dom";
import { getRole } from "./auth.js";

export default function RequireSeeker({ children }) {
  const location = useLocation();
  const role = getRole();
  // Backend canonical role is 'candidate'
  if (role !== "candidate") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate to={`/login?role=candidate&redirect=${redirect}`} replace />
    );
  }
  return children;
}
