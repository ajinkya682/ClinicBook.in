import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage.jsx";
import HomePage from "./pages/dashboard/HomePage.jsx";
import {
  Patients,
  Doctors,
  Prescriptions,
  Reviews,
  Settings,
} from "./pages/Placeholders.jsx";

/**
 * Main application React Router structure
 */
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root landing redirection */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public auth routes */}
        <Route path="/dashboard/login" element={<LoginPage />} />
        <Route path="/dashboard/register" element={<RegisterPage />} />

        {/* Protected dashboard shell */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Nested routes mapped inside DashboardLayout shell */}
          <Route index element={<HomePage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="patients" element={<Patients />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all 404 redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
