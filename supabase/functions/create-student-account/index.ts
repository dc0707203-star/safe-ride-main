import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ALLOWED_ORIGINS for CORS validation
const ALLOWED_ORIGINS = [
  'https://safe-ride.isu.edu.ph',
  'https://www.safe-ride.isu.edu.ph',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:5173',
]

// Rate limiting: 100 account creations per admin per hour
const RATE_LIMIT_STORE = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_CONFIG = { maxRequests: 100, windowMs: 3600000 }

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  }
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = RATE_LIMIT_STORE.get(key)

  if (!record || now > record.resetTime) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetTime: now + RATE_LIMIT_CONFIG.windowMs })
    return true
  }

  if (record.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return false
  }

  record.count++
  return true
}

function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  
  return req.headers.get('cf-connecting-ip') || 'unknown'
}

async function logAuditEvent(
  supabaseAdmin: any,
  userId: string,
  action: string,
  resource: string,
  status: 'success' | 'failure',
  details: any = {},
  errorMessage?: string,
  clientIp?: string
) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      resource,
      details: JSON.stringify(details),
      status,
      error_message: errorMessage,
      client_ip: clientIp,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIp = extractClientIp(req)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let callerUserId: string | null = null

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

    // 1. AUTHENTICATION: Verify token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header')
    }

    const token = authHeader.slice(7)
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !callerUser) {
      throw new Error('Invalid or expired token')
    }

    callerUserId = callerUser.id

    // 2. RATE LIMITING: Check admin's request quota
    if (!checkRateLimit(callerUser.id)) {
      await logAuditEvent(
        supabaseAdmin,
        callerUser.id,
        'CREATE_STUDENT',
        'students',
        'failure',
        {},
        'Rate limit exceeded',
        clientIp
      )
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 100 accounts per hour.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      )
    }

    // 3. AUTHORIZATION: Verify admin role from database (never trust client claims)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      await logAuditEvent(
        supabaseAdmin,
        callerUser.id,
        'CREATE_STUDENT',
        'students',
        'failure',
        {},
        'Unauthorized: admin role required',
        clientIp
      )
      
      throw new Error('Unauthorized: admin role required')
    }

    // 4. INPUT VALIDATION
    const { email, password, fullName } = await req.json()

    if (!email || !password || !fullName) {
      throw new Error('Missing required fields: email, password, fullName')
    }

    // Validate email format
    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/
    if (!emailRegex.test(email.trim())) {
      throw new Error('Invalid email format')
    }

    // Validate password strength (12+ chars with complexity)
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters')
    }

    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[!@#$%^&*]/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      throw new Error('Password must contain uppercase, lowercase, number, and symbol')
    }

    // Validate full name
    const nameRegex = /^[a-zA-Z\s\-']{2,100}$/
    if (!nameRegex.test(fullName.trim())) {
      throw new Error('Invalid full name format')
    }

    // 5. CHECK DUPLICATE
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase())

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          user_metadata: { full_name: fullName.trim() }
        }
      )
      
      if (updateError) {
        throw updateError
      }

      await logAuditEvent(
        supabaseAdmin,
        callerUser.id,
        'UPDATE_STUDENT',
        'students',
        'success',
        { studentId: existingUser.id, email },
        undefined,
        clientIp
      )

      return new Response(
        JSON.stringify({ user: updatedUser.user, existed: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // 6. CREATE NEW USER
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim()
      }
    })

    if (createError) {
      throw createError
    }

    // 7. AUDIT LOG
    await logAuditEvent(
      supabaseAdmin,
      callerUser.id,
      'CREATE_STUDENT',
      'students',
      'success',
      { studentId: userData.user.id, email },
      undefined,
      clientIp
    )

    return new Response(
      JSON.stringify({ user: userData.user, existed: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    // Log failure
    if (callerUserId) {
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
        
        await logAuditEvent(
          supabaseAdmin,
          callerUserId,
          'CREATE_STUDENT',
          'students',
          'failure',
          {},
          message,
          clientIp
        )
      } catch (logError) {
        console.error('Failed to log error:', logError)
      }
    }

    return new Response(
      JSON.stringify({ 
        error: message, 
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
