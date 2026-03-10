import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || ["http://localhost:8080"];
  const requestOrigin = req.headers.get("origin") || "http://localhost:8080";
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  // If preflight included requested headers, echo them back to allow the exact set.
  const requestedHeaders = req.headers.get('access-control-request-headers');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };

  if (requestedHeaders) {
    headers['Access-Control-Allow-Headers'] = requestedHeaders;
  } else {
    // sensible defaults
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { user_id, student_id } = await req.json();
    
    if (!user_id || !student_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or student_id" }),
        { status: 400, headers }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ delete auth account
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authError) throw authError;

    // 2️⃣ delete student row
    const { error: studentError } =
      await supabaseAdmin.from("students").delete().eq("id", student_id);

    if (studentError) throw studentError;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers }
    );
  }
});