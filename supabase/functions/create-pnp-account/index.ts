import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !callerUser) {
      throw new Error('Unauthorized')
    }

    // Check if caller is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      throw new Error('Only admins can create PNP accounts')
    }

    const { email, password, fullName, badgeNumber, rank, station } = await req.json()

    if (!email || !password || !fullName || !badgeNumber) {
      throw new Error('Missing required fields: email, password, fullName, badgeNumber')
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // User already exists - update their password and metadata
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          user_metadata: { 
            full_name: fullName,
            badge_number: badgeNumber,
            rank: rank || 'Officer',
            station: station || 'Unknown'
          }
        }
      )
      
      if (updateError) {
        throw updateError
      }

      // Assign PNP role if not already assigned
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', existingUser.id)
        .eq('role', 'pnp')
        .single()

      if (!existingRole) {
        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: existingUser.id, role: 'pnp' })

        if (roleInsertError && !roleInsertError.message.includes('duplicate')) {
          throw roleInsertError
        }
      }

      return new Response(
        JSON.stringify({ user: updatedUser.user, existed: true, pnpCreated: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create new user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        badge_number: badgeNumber,
        rank: rank || 'Officer',
        station: station || 'Unknown'
      }
    })

    if (createError) {
      throw createError
    }

    // Assign PNP role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userData.user.id, role: 'pnp' })

    if (roleInsertError) {
      throw roleInsertError
    }

    // Create PNP officer profile
    const { error: profileError } = await supabaseAdmin
      .from('pnp_officers')
      .insert({
        user_id: userData.user.id,
        badge_number: badgeNumber,
        rank: rank || 'Officer',
        station: station || 'Unknown',
        full_name: fullName
      })
      .select()

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError)
      // Don't throw - user is already created, profile is secondary
    }

    return new Response(
      JSON.stringify({ user: userData.user, existed: false, pnpCreated: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
