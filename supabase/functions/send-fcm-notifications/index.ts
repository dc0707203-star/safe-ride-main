import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v5.4.0/index.ts";

const FIREBASE_API_URL = "https://fcm.googleapis.com/v1/projects";

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

interface SendNotificationRequest {
  userType: "driver" | "student" | "both";
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface FCMToken {
  id: string;
  user_id: string;
  fcm_token: string;
  user_type: string;
}

/**
 * Generate Firebase OAuth 2.0 access token using service account credentials
 */
async function getFirebaseAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Import the private key
  const privateKey = await jose.importPKCS8(
    serviceAccount.private_key,
    "RS256"
  );

  // Sign the JWT
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    throw new Error("Failed to generate Firebase access token");
  }

  return tokenData.access_token;
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userType, title, body, data } = (await req.json()) as SendNotificationRequest;

    console.log("[FCM] Preparing to send notifications", {
      userType,
      title,
      body,
    });

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID");
    const firebaseCredentials = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

    console.log("[FCM] Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      hasProjectId: !!firebaseProjectId,
      hasCredentials: !!firebaseCredentials,
    });

    if (!firebaseProjectId || !firebaseCredentials) {
      console.error("[FCM] Missing Firebase credentials");
      console.error("[FCM] FIREBASE_PROJECT_ID:", firebaseProjectId);
      console.error("[FCM] FIREBASE_SERVICE_ACCOUNT exists:", !!firebaseCredentials);
      
      return new Response(
        JSON.stringify({
          error: "Firebase credentials not configured",
          details: {
            projectId: !!firebaseProjectId,
            credentials: !!firebaseCredentials,
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Parse service account credentials
    const serviceAccount = JSON.parse(firebaseCredentials);

    // Generate access token
    const firebaseAccessToken = await getFirebaseAccessToken(serviceAccount);

    // Fetch tokens from database
    const filterQuery = `user_type=in.("${userType}","both")`;
    const tokenUrl = `${supabaseUrl}/rest/v1/push_tokens?${filterQuery}`;
    
    console.log("[FCM] Fetching tokens with URL:", tokenUrl.split('?')[0] + "?...");
    
    const tokenResponse = await fetch(tokenUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[FCM] Error fetching tokens:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
      });
      return new Response(
        JSON.stringify({
          error: "Failed to fetch tokens",
          details: {
            status: tokenResponse.status,
            message: errorText,
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const tokens: FCMToken[] = await tokenResponse.json();
    console.log(`[FCM] Found ${tokens.length} tokens for userType: ${userType}`);

    let sentCount = 0;
    let failedCount = 0;

    // Send notification to each token
    for (const token of tokens) {
      try {
        const message = {
          message: {
            token: token.fcm_token,
            notification: {
              title,
              body,
            },
            data: data || {},
            android: {
              priority: "high",
            },
          },
        };

        const sendResponse = await fetch(
          `${FIREBASE_API_URL}/${firebaseProjectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firebaseAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          }
        );

        if (sendResponse.ok) {
          console.log(`[FCM] Notification sent to token: ${token.fcm_token.substring(0, 20)}...`);
          sentCount++;

          // Update last_verified timestamp
          await fetch(
            `${supabaseUrl}/rest/v1/push_tokens?id=eq.${token.id}`,
            {
              method: "PATCH",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                last_verified: new Date().toISOString(),
              }),
            }
          );
        } else {
          const errorText = await sendResponse.text();
          console.error(
            `[FCM] Failed to send to token ${token.fcm_token.substring(0, 20)}...:`,
            errorText
          );
          failedCount++;
        }
      } catch (error) {
        console.error("[FCM] Error sending to token:", error);
        failedCount++;
      }
    }

    console.log("[FCM] Notification send complete", {
      sent: sentCount,
      failed: failedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: tokens.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("[FCM] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        stack: errorStack,
      }),
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
