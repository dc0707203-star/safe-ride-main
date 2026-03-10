import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, LogOut, User, Mail, Phone, Car, Bell, Lock, HelpCircle, 
  FileText, Shield, Smartphone, ChevronRight, Download, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  license_number: string;
  photo_url?: string;
}

const DriverSettings = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/driver-login");
          return;
        }

        const { data: driverData, error: driverError } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (driverError) {
          navigate("/driver-login");
          return;
        }

        setDriver(driverData);
      } catch (error) {
        console.error("Error fetching driver data:", error);
        navigate("/driver-login");
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Delete from drivers table
      if (driver) {
        const { error: deleteDriverError } = await supabase
          .from('drivers')
          .delete()
          .eq('id', driver.id);

        if (deleteDriverError) {
          throw deleteDriverError;
        }
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Delete from auth
      if (user) {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteAuthError) {
          console.error('Auth deletion error:', deleteAuthError);
        }
      }

      toast.success("Account deleted successfully");
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const SettingItem = ({ icon: Icon, title, description, onClick, badge }: any) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2.5 rounded-xl bg-gray-100">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <p className="text-black font-semibold text-sm">{title}</p>
            {badge && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-gray-600 text-xs mt-0.5">{description}</p>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  );

  const SectionHeader = ({ title }: any) => (
    <h3 className="px-4 mt-6 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
      {title}
    </h3>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4 animate-spin">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full"></div>
          </div>
          <p className="text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => navigate("/driver-dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft className="h-6 w-6 text-black" />
            </button>
            <div>
              <h1 className="text-xl font-black text-black">Settings & Support</h1>
              <p className="text-xs text-gray-500">Settings Hub</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-24 max-w-2xl">
        {/* Profile Section */}
        <div className="mb-8 p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-md">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-black font-bold text-base">{driver?.full_name}</p>
              <p className="text-gray-600 text-xs mt-0.5">Driver Account</p>
            </div>
          </div>
        </div>

        {/* Driver Info Section */}
        <SectionHeader title="Driver Information" />
        <div className="space-y-0 mb-6 rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <div className="flex items-start gap-4 p-4 border-b border-gray-100">
            <Mail className="h-5 w-5 text-gray-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-xs font-semibold uppercase">Email</p>
              <p className="text-black font-semibold text-sm mt-1 break-all">{driver?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border-b border-gray-100">
            <Phone className="h-5 w-5 text-gray-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-xs font-semibold uppercase">Phone</p>
              <p className="text-black font-semibold text-sm mt-1">{driver?.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border-b border-gray-100">
            <Car className="h-5 w-5 text-gray-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-xs font-semibold uppercase">Vehicle Type</p>
              <p className="text-black font-semibold text-sm mt-1">{driver?.vehicle_type}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4">
            <FileText className="h-5 w-5 text-gray-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-xs font-semibold uppercase">License Number</p>
              <p className="text-black font-semibold text-sm mt-1 break-all">{driver?.license_number}</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <SectionHeader title="Account & Settings" />
        <div className="space-y-0 mb-6 rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <SettingItem 
            icon={Smartphone}
            title="Session Status"
            description="Active"
          />
          <div className="border-b border-gray-100" />
          <SettingItem 
            icon={Lock}
            title="Change Password"
            description="Secure your account"
          />
          <div className="border-b border-gray-100" />
          <SettingItem 
            icon={Bell}
            title="Notifications"
            description="Manage alerts"
          />
        </div>

        {/* Account Management */}
        <SectionHeader title="Account Management" />
        <div className="space-y-0 mb-6 rounded-2xl border border-red-200 overflow-hidden bg-red-50">
          <SettingItem 
            icon={AlertCircle}
            title="Delete Account"
            description="Permanently delete"
            onClick={() => setShowDeleteConfirm(true)}
          />
        </div>

        {/* Privacy & Security */}
        <SectionHeader title="Privacy & Security" />
        <div className="space-y-0 mb-6 rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <SettingItem 
            icon={Shield}
            title="Privacy Policy"
            description="Read our policies"
            onClick={() => navigate('/privacy')}
          />
          <div className="border-b border-gray-100" />
          <SettingItem 
            icon={FileText}
            title="Terms of Service"
            description="View terms"
            onClick={() => navigate('/terms')}
          />
          <div className="border-b border-gray-100" />
          <SettingItem 
            icon={Lock}
            title="Data & Privacy"
            description="Manage your data"
            onClick={() => navigate('/security')}
          />
        </div>

        {/* Support & FAQs */}
        <SectionHeader title="Support & FAQs" />
        <div className="space-y-0 mb-6 rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <SettingItem 
            icon={Mail}
            title="Contact Support"
            description="Get help"
            onClick={() => navigate('/contact')}
          />
        </div>

        {/* App */}
        <SectionHeader title="App" />
        <div className="space-y-0 mb-6 rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <SettingItem 
            icon={Download}
            title="App Updates"
            description="v8.0.0"
          />
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              This action cannot be undone. Your account and all associated data will be permanently deleted from our database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1 bg-gray-200 hover:bg-gray-300 text-black">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DriverSettings;
