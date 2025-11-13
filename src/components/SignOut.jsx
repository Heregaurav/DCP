// src/components/SignOut.jsx
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await logout();
        navigate("/login", { replace: true }); // redirect to login after signout
      } catch (err) {
        console.error("Logout failed:", err);
      }
    };
    doLogout();
  }, [logout, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-700 text-lg">Signing out...</p>
    </div>
  );
}
