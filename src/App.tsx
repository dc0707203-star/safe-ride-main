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
import StudentRegister from "./pages/StudentRegister";
import AdminRegister from "./pages/AdminRegister";
import Login from "./pages/Login";
import RegisterDriver from "./pages/admin/RegisterDriver";
import DriversList from "./pages/admin/DriversList";
import StudentsList from "./pages/admin/StudentsList";
import RegisterStudent from "./pages/admin/RegisterStudent";
import OngoingTrips from "./pages/admin/OngoingTrips";
import EmergencyAlerts from "./pages/admin/EmergencyAlerts";
import AnnouncementsHistory from "./pages/admin/AnnouncementsHistory";
import TripHistory from "./pages/student/TripHistory";
import Contact from "./pages/Contact";
import Developer from "./pages/Developer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student-register" element={<StudentRegister />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route path="/student" element={<Student />} />
          <Route path="/student/history" element={<TripHistory />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/register-driver" element={<RegisterDriver />} />
          <Route path="/admin/drivers" element={<DriversList />} />
          <Route path="/admin/students" element={<StudentsList />} />
          <Route path="/admin/register-student" element={<RegisterStudent />} />
          <Route path="/admin/trips" element={<OngoingTrips />} />
          <Route path="/admin/alerts" element={<EmergencyAlerts />} />
          <Route path="/admin/announcements" element={<AnnouncementsHistory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppWrapper;
