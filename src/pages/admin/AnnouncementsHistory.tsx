import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Trash2, ToggleLeft, ToggleRight, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import campusBg from "@/assets/campus-bg.jpeg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Announcement {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

const AnnouncementsHistory = () => {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/login?type=admin');
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements' as any)
          .select('*')
          .order('created_at', { ascending: false }) as { data: any[]; error: any };

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast.error("Failed to load announcements");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && userRole === 'admin') {
      fetchAnnouncements();
    }
  }, [user, userRole]);

  const toggleAnnouncementStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements' as any)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev =>
        prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a)
      );
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error("Failed to update announcement");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success("Announcement deleted");
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error("Failed to delete announcement");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full w-fit mx-auto mb-4 border border-amber-500/40">
            <Megaphone className="h-10 w-10 text-amber-400 animate-pulse" />
          </div>
          <p className="text-white/80 font-semibold">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <header className="relative z-20 bg-gradient-to-b from-black/60 to-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="gap-2 text-white hover:bg-white/10 transition-all"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/50">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Announcements</h1>
                <p className="text-xs text-white/60 font-semibold">Manage system announcements</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-8">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/40 mb-4">
              <Megaphone className="h-12 w-12 text-amber-400" />
            </div>
            <p className="text-white/60 font-semibold">No announcements yet</p>
            <p className="text-white/40 text-sm">Create your first announcement to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 max-w-4xl mx-auto">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id} 
                className={`
                  group relative rounded-2xl overflow-hidden transition-all duration-300
                  border backdrop-blur-xl shadow-lg
                  ${announcement.is_active 
                    ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-white/5 to-orange-500/10 hover:border-amber-500/60 hover:shadow-amber-500/30 shadow-amber-500/20' 
                    : 'border-white/10 bg-gradient-to-br from-white/5 to-white/3 hover:border-white/20 opacity-60 hover:opacity-75 shadow-white/10'
                  }
                `}
              >
                {/* Glow background */}
                <div className={`absolute inset-0 ${announcement.is_active ? 'bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5' : ''} transition-all`} />
                
                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2.5 rounded-lg flex-shrink-0 shadow-lg ${
                          announcement.is_active 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/60' 
                            : 'bg-white/10'
                        }`}>
                          <Megaphone className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-white uppercase italic tracking-tight line-clamp-2">{announcement.title}</h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs font-black px-3 py-1 rounded-full shadow-lg transition-all ${
                              announcement.is_active 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/50' 
                                : 'bg-white/10 text-white/60'
                            }`}>
                              {announcement.is_active ? '🔴 ACTIVE' : '⚫ INACTIVE'}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed pl-4 border-l-2 border-amber-500/30 py-2">
                        {announcement.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                        className={`gap-2 font-bold text-xs transition-all shadow-lg flex-1 sm:flex-none ${
                          announcement.is_active
                            ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white hover:shadow-green-500/50'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        }`}
                      >
                        {announcement.is_active ? (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            <span className="hidden sm:inline">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Inactive</span>
                          </>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-500/50 gap-2 font-bold text-xs flex-1 sm:flex-none transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border-2 border-slate-200 shadow-xl mx-auto w-[calc(100%-2rem)]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900">Delete Announcement?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600">
                              This action cannot be undone. This will permanently delete the announcement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold border-slate-300">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAnnouncement(announcement.id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AnnouncementsHistory;
