import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Phone,
  Mail,
  User,
  Bell,
  Lock,
  HelpCircle,
  Download,
  FileText,
  Maximize,
  Minimize,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import isuLogo from "@/assets/isu-logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RescueSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [rescueData, setRescueData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/rescue");
      return;
    }
    if (!authLoading && user) {
      fetchRescueData();
    }

    // Close menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-menu')) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, authLoading, navigate, showMenu]);

  const fetchRescueData = async () => {
    try {
      const { data } = await supabase
        .from("users")
        .select("full_name, email, phone")
        .eq("id", user?.id)
        .single();

      if (data) {
        setRescueData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      console.error("Error fetching rescue data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // Delete from users table
      await supabase.from("users").delete().eq("id", user?.id);

      // Delete auth user
      await supabase.auth.admin.deleteUser(user?.id || "");

      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Error deleting account");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (!isFullscreen) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      toast.error("Could not toggle fullscreen");
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0' : 'min-h-screen'} bg-white`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className={`${isFullscreen ? 'px-6' : 'max-w-4xl mx-auto px-4'} py-4`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Rescue Team Member</p>
              </div>
            </div>
            
            {/* Settings Menu Dropdown */}
            <div className="relative settings-menu">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[100]">
                  <button
                    onClick={() => {
                      handleFullscreen();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors text-sm"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize className="w-4 h-4 text-gray-600" />
                        <span>Exit Fullscreen</span>
                      </>
                    ) : (
                      <>
                        <Maximize className="w-4 h-4 text-gray-600" />
                        <span>Fullscreen</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${isFullscreen ? 'px-6 py-8' : 'max-w-4xl mx-auto px-4 py-8'}`}>
        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{rescueData.full_name}</p>
                <p className="text-sm text-gray-500">Rescue Team Member</p>
              </div>
            </div>
          </div>
        </section>

        {/* Rescue Information */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Rescue Information</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-900">{rescueData.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-gray-900">{rescueData.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Account & Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Account & Settings</h2>
          <div className="space-y-3">
            <button className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Notification Preferences</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            <button className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Change Password</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </section>

        {/* Account Management */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Management</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">Delete Account</span>
              </div>
              <span className="text-red-400">→</span>
            </button>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacy & Security</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/privacy")}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Privacy Policy</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            <button
              onClick={() => navigate("/terms")}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Terms of Service</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            <button
              onClick={() => navigate("/security")}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Security Guidelines</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </section>

        {/* Support & FAQs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Support & FAQs</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/contact")}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Contact Support</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </section>

        {/* App Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">App</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Version</span>
              <span className="font-semibold text-gray-900">v8.0.0</span>
            </div>
          </div>
        </section>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-6 text-lg"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4">
              This action cannot be undone. Your account and all associated data will be permanently
              deleted from our system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RescueSettings;
