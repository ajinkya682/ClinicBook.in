import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage.jsx";
import HomePage from "./pages/dashboard/HomePage.jsx";
import PatientsPage from "./pages/dashboard/PatientsPage.jsx";
import PatientDetailPage from "./pages/dashboard/PatientDetailPage.jsx";
import DoctorsPage from "./pages/dashboard/DoctorsPage.jsx";
import PrescriptionsPage from "./pages/dashboard/PrescriptionsPage.jsx";
import SettingsPage from "./pages/dashboard/SettingsPage.jsx";
import {
  Reviews,
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
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all 404 redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
