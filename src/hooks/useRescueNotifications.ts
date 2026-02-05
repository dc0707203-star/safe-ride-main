import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "alert" | "update" | "info";
  read: boolean;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  message: string;
  timestamp: string;
  alertId?: string;
}

export const useRescueNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Create notification for new alert
  const createNotification = async (
    title: string,
    message: string,
    type: "alert" | "update" | "info" = "info"
  ) => {
    try {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title,
        message,
        timestamp: new Date().toLocaleTimeString(),
        type,
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);

      // In real implementation, save to database
      // await supabase.from("notifications").insert({ ...newNotif, user_id: user?.id });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Subscribe to new alerts for notifications
  const subscribeToAlerts = () => {
    const subscription = supabase
      .channel("new-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload: any) => {
          createNotification(
            "New Emergency Alert",
            `Alert ${payload.new.id} - ${payload.new.message}`,
            "alert"
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  // Send chat message
  const sendChatMessage = async (message: string, alertId: string) => {
    if (!user) return;

    try {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderName: user.email?.split("@")[0] || "You",
        senderId: user.id,
        message,
        timestamp: new Date().toLocaleTimeString(),
        alertId,
      };

      setChatMessages((prev) => [...prev, newMessage]);

      // Save to database if needed
      // await supabase.from("rescue_messages").insert({
      //   alert_id: alertId,
      //   user_id: user.id,
      //   message,
      // });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Subscribe to chat messages for specific alert
  const subscribeToChatMessages = (alertId: string) => {
    const subscription = supabase
      .channel(`chat-${alertId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rescue_messages",
          filter: `alert_id=eq.${alertId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newMsg: ChatMessage = {
              id: payload.new.id,
              senderName: payload.new.sender_name,
              senderId: payload.new.user_id,
              message: payload.new.message,
              timestamp: new Date(payload.new.created_at).toLocaleTimeString(),
              alertId,
            };
            setChatMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  useEffect(() => {
    setLoading(false);
    return subscribeToAlerts();
  }, []);

  return {
    notifications,
    chatMessages,
    loading,
    createNotification,
    sendChatMessage,
    subscribeToChatMessages,
    markAsRead,
  };
};
