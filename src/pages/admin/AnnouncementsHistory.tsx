import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Trash2, ToggleLeft, ToggleRight, Calendar } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Megaphone className="h-10 w-10 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      {/* Header */}
      <header className="z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Announcements History</h1>
                <p className="text-sm text-slate-600">Manage all announcements</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-8">
        {announcements.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((announcement) => (
              <Card 
                key={announcement.id} 
                className={`
                  transition-all duration-300 overflow-hidden
                  border-2 
                  ${announcement.is_active 
                    ? 'border-amber-400/50 bg-gradient-to-br from-amber-50/40 via-white/40 to-orange-50/40 backdrop-blur-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:border-amber-400' 
                    : 'border-slate-300/30 bg-slate-50/30 backdrop-blur-xl opacity-75 hover:opacity-85'
                  }
                `}
              >
                <CardHeader className="pb-3 bg-gradient-to-r from-transparent to-transparent">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          announcement.is_active 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                            : 'bg-slate-300'
                        }`}>
                          <Megaphone className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-slate-900">{announcement.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              announcement.is_active 
                                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-md' 
                                : 'bg-slate-300 text-slate-600'
                            }`}>
                              {announcement.is_active ? '🟢 Active' : '⚪ Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 pl-10">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(announcement.created_at), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                        className={`gap-2 font-semibold transition-all ${
                          announcement.is_active
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
                            : 'bg-slate-400 hover:bg-slate-500 text-white'
                        }`}
                      >
                        {announcement.is_active ? (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            Inactive
                          </>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg gap-2 font-semibold"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border-2 border-slate-200 shadow-xl">
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
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  <p className="text-slate-700 text-sm leading-relaxed pl-10 border-l-4 border-amber-300/50 py-2">
                    {announcement.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AnnouncementsHistory;
