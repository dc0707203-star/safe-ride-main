import { useState, useEffect } from "react";
import { Bell, CheckCircle, PartyPopper, Info, AlertTriangle, X, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast.success(newNotification.title, {
            description: newNotification.message,
            icon: <PartyPopper className="h-5 w-5 text-green-500" />,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    
    if (open && unreadCount > 0) {
      // Mark all as read when opening
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds);

        if (!error) {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
        }
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white/5 border-white/10';
    
    switch (type) {
      case 'approval':
        return 'bg-green-500/10 border-green-500/30 hover:border-green-500/50';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50';
      default:
        return 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-white/10 transition-colors">
          <Bell className="h-5 w-5 text-emerald-400" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-gradient-to-r from-red-600 to-red-700 text-white animate-pulse shadow-lg shadow-red-500/50 font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-white/10 p-0">
        <SheetHeader className="px-6 py-4 border-b border-white/10 sticky top-0 z-10 bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/50">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white font-black text-lg">Notifications</SheetTitle>
                <p className="text-xs text-white/60 font-semibold">Stay updated</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Badge className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-lg">
                  {notifications.length}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/70 hover:text-white" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full border border-emerald-500/40 mb-4">
                <Bell className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">No Notifications</h3>
              <p className="text-white/60 text-sm">
                You're all caught up! Check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group p-4 rounded-xl border transition-all backdrop-blur-xl ${getNotificationBgColor(notification.type, notification.is_read)} cursor-pointer hover:bg-white/10`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1 p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-all">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 flex-shrink-0 mt-1.5 shadow-lg shadow-emerald-500/50" />
                        )}
                      </div>
                      <p className="text-sm text-white/70 mt-1.5 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/50 mt-2 font-semibold">
                        {format(new Date(notification.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
