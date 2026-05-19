import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

/**
 * Route protection wrapper verifying clinic dashboard credentials before displaying private content
 */
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/dashboard/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
