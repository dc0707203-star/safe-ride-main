import { useState } from "react";
import { X, Building2, Shield, Ambulance, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";
import PNPLoginForm from "@/components/auth/PNPLoginForm";
import RescueLoginForm from "@/components/auth/RescueLoginForm";
import isuLogo from "@/assets/isu-logo.png";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAdminType?: 'isu' | 'pnp' | 'rescue';
}

const AdminLoginModal = ({ isOpen, onClose, initialAdminType = 'isu' }: AdminLoginModalProps) => {
  if (!isOpen) return null;

  // Use the initialAdminType directly - no tab switching needed
  const adminType = initialAdminType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="h-6 w-6 text-slate-600" />
        </button>

        {/* Login Form Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left Side - Branding & Info */}
          <div
            className={`p-4 sm:p-6 flex flex-col justify-center items-start border-b md:border-b-0 md:border-r border-slate-100 ${
              adminType === 'isu'
                ? 'bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5'
                : adminType === 'pnp'
                ? 'bg-gradient-to-br from-blue-700/15 via-blue-700/10 to-blue-700/5'
                : 'bg-gradient-to-br from-red-700/15 via-red-700/10 to-red-700/5'
            }`}
          >
            {/* Security Badge */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 border rounded-full w-fit mb-3 ${
                adminType === 'isu'
                  ? 'bg-green-50 border-green-200'
                  : adminType === 'pnp'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <CheckCircle
                className={`h-3 w-3 ${
                  adminType === 'isu'
                    ? 'text-green-600'
                    : adminType === 'pnp'
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  adminType === 'isu'
                    ? 'text-green-700'
                    : adminType === 'pnp'
                    ? 'text-blue-700'
                    : 'text-red-700'
                }`}
              >
                Secure Connection
              </span>
            </div>

            {/* Logo */}
            <div className="mb-3">
              <img src={isuLogo} alt="ISU Logo" className="h-12 w-12 rounded-full object-cover shadow-lg" />
            </div>

            {/* Header */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5">
                {adminType === 'isu'
                  ? 'ISU Admin Dashboard'
                  : adminType === 'pnp'
                  ? 'PNP Command Center'
                  : 'Rescue Admin Panel'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {adminType === 'isu'
                  ? 'Secure Campus Access'
                  : adminType === 'pnp'
                  ? 'Police Operations'
                  : 'Emergency Response'}
              </p>
              <div
                className={`h-0.5 w-8 rounded-full mt-1.5 ${
                  adminType === 'isu'
                    ? 'bg-gradient-to-r from-primary to-primary/60'
                    : adminType === 'pnp'
                    ? 'bg-gradient-to-r from-blue-700 to-blue-600'
                    : 'bg-gradient-to-r from-red-700 to-orange-600'
                }`}
              />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-4 sm:p-6 flex flex-col justify-start bg-gradient-to-br from-white via-slate-50/30 to-white">
            {adminType === 'isu' ? (
              <LoginForm userType="admin" onSuccess={onClose} />
            ) : adminType === 'pnp' ? (
              <PNPLoginForm onSuccess={onClose} />
            ) : (
              <RescueLoginForm onSuccess={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
