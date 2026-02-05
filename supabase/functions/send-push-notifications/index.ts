import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PushPayload {
  userType: "driver" | "student";
  title: string;
  body: string;
  data?: Record<string, string>;
}

const ALLOWED_ORIGINS = [
  'https://safe-ride.isu.edu.ph',
  'https://www.safe-ride.isu.edu.ph',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:5173',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload: PushPayload = await req.json();
    const { userType, title, body, data } = payload;

    console.log(`[PUSH] Sending announcement to ${userType}s: "${title}"`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get all subscriptions for the user type
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_type", userType);

    if (subscriptionError) {
      console.error("[PUSH] Error fetching subscriptions:", subscriptionError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[PUSH] No subscriptions found for", userType);
      return new Response(
        JSON.stringify({
          success: true,
          message: "No subscriptions found",
          count: 0,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`[PUSH] Found ${subscriptions.length} subscriptions for ${userType}`);

    // Send notifications to all subscribers
    let successCount = 0;
    let failureCount = 0;

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = subscription.subscription;

        if (!pushSubscription || !pushSubscription.endpoint) {
          console.warn(`[PUSH] Invalid subscription for user ${subscription.user_id}`);
          failureCount++;
          continue;
        }

        const notificationPayload = JSON.stringify({
          title,
          body,
          icon: "/favicon.png",
          badge: "/favicon.png",
          tag: "safride-notification",
          data: data || {},
        });

        // Send push notification
        const response = await fetch(pushSubscription.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": new TextEncoder().encode(notificationPayload).length.toString(),
          },
          body: notificationPayload,
        });

        if (response.ok) {
          successCount++;
          console.log(`[PUSH] ✓ Sent to ${subscription.user_id}`);
          
          // Update last_verified timestamp
          await supabase
            .from("push_subscriptions")
            .update({ last_verified: new Date().toISOString() })
            .eq("id", subscription.id);
        } else if (response.status === 410) {
          // Subscription expired or revoked
          failureCount++;
          console.log(`[PUSH] ✗ Subscription expired for ${subscription.user_id}`);
          
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        } else {
          failureCount++;
          console.error(
            `[PUSH] ✗ Failed for ${subscription.user_id}: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        console.error(`[PUSH] Error sending to subscription:`, error);
        failureCount++;
      }
    }

    const result = {
      success: true,
      message: "Push notifications sent",
      total: subscriptions.length,
      successCount,
      failureCount,
    };

    console.log(`[PUSH] Complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[PUSH] Error in send-push-notifications function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
