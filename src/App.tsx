// App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


// Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Student from "./pages/Student";
import Login from "./pages/Login";
import RegisterDriver from "./pages/admin/RegisterDriver";
import DriversList from "./pages/admin/DriversList";
import StudentsList from "./pages/admin/StudentsList";
import RegisterStudent from "./pages/admin/RegisterStudent";
import OngoingTrips from "./pages/admin/OngoingTrips";
import EmergencyAlerts from "./pages/admin/EmergencyAlerts";
import AnnouncementsHistory from "./pages/admin/AnnouncementsHistory";
import PNPAdmin from "./pages/PNPAdmin";
import PNPDashboard from "./pages/PNPDashboard";
import PNPHistory from "./pages/PNPHistory";
import PNPMap from "./pages/PNPMap";
import PNPReports from "./pages/PNPReports";
import TripHistory from "./pages/student/TripHistory";
import Contact from "./pages/Contact";
import Developer from "./pages/Developer";
import NotFound from "./pages/NotFound";
import DriverRegister from "./pages/DriverRegister";
import DriverLogin from "./pages/DriverLogin";
import DriverDashboard from "./pages/DriverDashboard";
import DriverSettings from "./pages/DriverSettings";
import StudentSettings from "./pages/StudentSettings";
import DriverPortal from "./pages/DriverPortal";
import RescueDashboard from "./pages/RescueDashboard";
import RescueSettings from "./pages/RescueSettings";
import RescueAdmin from "./pages/RescueAdmin";
import Guide from "./pages/Guide";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import ReportIssues from "./pages/ReportIssues";
import CookiePolicy from "./pages/CookiePolicy";
import AdminPortal from "./pages/AdminPortal";
import RoleSelection from "./pages/RoleSelection";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="/report-issues" element={<ReportIssues />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/admin-portal" element={<AdminPortal />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute requiredRole="student">
                <Student />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/history" 
            element={
              <ProtectedRoute requiredRole="student">
                <TripHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/settings" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/register-driver" 
            element={
              <ProtectedRoute requiredRole="admin">
                <RegisterDriver />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/drivers" 
            element={
              <ProtectedRoute requiredRole="admin">
                <DriversList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/students" 
            element={
              <ProtectedRoute requiredRole="admin">
                <StudentsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/register-student" 
            element={
              <ProtectedRoute requiredRole="admin">
                <RegisterStudent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/trips" 
            element={
              <ProtectedRoute requiredRole="admin">
                <OngoingTrips />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/alerts" 
            element={
              <ProtectedRoute requiredRole="admin">
                <EmergencyAlerts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/announcements" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AnnouncementsHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pnp" 
            element={
              <ProtectedRoute requiredRole="pnp">
                <PNPAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pnp-dashboard" 
            element={
              <ProtectedRoute requiredRole="pnp">
                <PNPDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pnp-history" 
            element={
              <ProtectedRoute requiredRole="pnp">
                <PNPHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pnp-map" 
            element={
              <ProtectedRoute requiredRole="pnp">
                <PNPMap />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pnp-reports" 
            element={
              <ProtectedRoute requiredRole="pnp">
                <PNPReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rescue" 
            element={
              <ProtectedRoute requiredRole="rescue">
                <RescueDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rescue/settings" 
            element={
              <ProtectedRoute requiredRole="rescue">
                <RescueSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rescue-admin" 
            element={
              <ProtectedRoute requiredRole="rescue_admin">
                <RescueAdmin />
              </ProtectedRoute>
            } 
          />
          <Route path="/driver-portal" element={<DriverPortal />} />
          <Route path="/driver-register" element={<DriverRegister />} />
          <Route path="/driver-login" element={<DriverLogin />} />
          <Route path="/driver-dashboard" element={<DriverDashboard />} />
          <Route path="/driver-settings" element={<DriverSettings />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppWrapper;
