// src/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  return user ? children : <Navigate to="/login" />;
}
