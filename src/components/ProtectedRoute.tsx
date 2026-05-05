import { Navigate } from "react-router-dom";
import type { Role } from "../constants/Role";

export default function ProtectedRoute({ role, children }: { role: Role, children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    return <Navigate to="/" />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Check strict role matching
    if (user.role !== role) {
      return <Navigate to="/" />; // Or to an unauthorized page
    }

    return <>{children}</>;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/" />;
  }
}
