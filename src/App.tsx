// App.tsx
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


// Lazy load all pages for better performance
const Index = React.lazy(() => import("./pages/Index"));
const About = React.lazy(() => import("./pages/About"));
const Admin = React.lazy(() => import("./pages/Admin"));
const Student = React.lazy(() => import("./pages/Student"));
const Login = React.lazy(() => import("./pages/Login"));
const RegisterDriver = React.lazy(() => import("./pages/admin/RegisterDriver"));
const DriversList = React.lazy(() => import("./pages/admin/DriversList"));
const StudentsList = React.lazy(() => import("./pages/admin/StudentsList"));
const RegisterStudent = React.lazy(() => import("./pages/admin/RegisterStudent"));
const OngoingTrips = React.lazy(() => import("./pages/admin/OngoingTrips"));
const EmergencyAlerts = React.lazy(() => import("./pages/admin/EmergencyAlerts"));
const AnnouncementsHistory = React.lazy(() => import("./pages/admin/AnnouncementsHistory"));
const PNPAdmin = React.lazy(() => import("./pages/PNPAdmin"));
const PNPDashboard = React.lazy(() => import("./pages/PNPDashboard"));
const PNPHistory = React.lazy(() => import("./pages/PNPHistory"));
const PNPMap = React.lazy(() => import("./pages/PNPMap"));
const PNPReports = React.lazy(() => import("./pages/PNPReports"));
const TripHistory = React.lazy(() => import("./pages/student/TripHistory"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Developer = React.lazy(() => import("./pages/Developer"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const DriverRegister = React.lazy(() => import("./pages/DriverRegister"));
const DriverLogin = React.lazy(() => import("./pages/DriverLogin"));
const DriverDashboard = React.lazy(() => import("./pages/DriverDashboard"));
const DriverSettings = React.lazy(() => import("./pages/DriverSettings"));
const StudentSettings = React.lazy(() => import("./pages/StudentSettings"));
const DriverPortal = React.lazy(() => import("./pages/DriverPortal"));
const RescueDashboard = React.lazy(() => import("./pages/RescueDashboard"));
const RescueSettings = React.lazy(() => import("./pages/RescueSettings"));
const RescueAdmin = React.lazy(() => import("./pages/RescueAdmin"));
const Guide = React.lazy(() => import("./pages/Guide"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Security = React.lazy(() => import("./pages/Security"));
const ReportIssues = React.lazy(() => import("./pages/ReportIssues"));
const CookiePolicy = React.lazy(() => import("./pages/CookiePolicy"));
const AdminPortal = React.lazy(() => import("./pages/AdminPortal"));
const RoleSelection = React.lazy(() => import("./pages/RoleSelection"));
const LiveMapPage = React.lazy(() => import("./pages/LiveMapPage"));
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
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
                path="/admin/live-map" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <LiveMapPage />
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
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppWrapper;
