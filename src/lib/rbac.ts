/**
 * Server-Side Role-Based Access Control (RBAC) Service
 * CRITICAL: Always call these functions from backend/edge functions,
 * never trust client-side role information
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'student' | 'driver' | 'pnp' | 'rescue';

export interface RBACContext {
  userId: string;
  userRoles: UserRole[];
  isAuthenticated: boolean;
}

/**
 * Verify user authentication and fetch their roles from database
 * This should ALWAYS be called server-side, never trust client state
 */
export async function verifyUserRoles(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<RBACContext> {
  // Always fetch fresh from database - never trust client claims
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (roleError) {
    throw new Error(`Failed to verify user roles: ${roleError.message}`);
  }

  const userRoles = (roleData || []).map(r => r.role as UserRole);

  return {
    userId,
    userRoles,
    isAuthenticated: true,
  };
}

/**
 * Check if user has a specific role
 * MUST be used server-side only
 */
export function hasRole(context: RBACContext, role: UserRole): boolean {
  if (!context.isAuthenticated) return false;
  return context.userRoles.includes(role);
}

/**
 * Check if user has ANY of the specified roles
 */
export function hasAnyRole(context: RBACContext, roles: UserRole[]): boolean {
  if (!context.isAuthenticated) return false;
  return roles.some(role => context.userRoles.includes(role));
}

/**
 * Check if user has ALL of the specified roles
 */
export function hasAllRoles(context: RBACContext, roles: UserRole[]): boolean {
  if (!context.isAuthenticated) return false;
  return roles.every(role => context.userRoles.includes(role));
}

/**
 * Enforce role requirement - throws if unauthorized
 */
export function requireRole(context: RBACContext, role: UserRole): void {
  if (!hasRole(context, role)) {
    throw new Error(`Unauthorized: ${role} role required`);
  }
}

/**
 * Enforce any of multiple roles - throws if unauthorized
 */
export function requireAnyRole(context: RBACContext, roles: UserRole[]): void {
  if (!hasAnyRole(context, roles)) {
    throw new Error(`Unauthorized: One of [${roles.join(', ')}] role required`);
  }
}

/**
 * Enforce all roles - throws if unauthorized
 */
export function requireAllRoles(context: RBACContext, roles: UserRole[]): void {
  if (!hasAllRoles(context, roles)) {
    throw new Error(`Unauthorized: All of [${roles.join(', ')}] roles required`);
  }
}

/**
 * Role-based Query Filter for Supabase queries
 * Returns the appropriate WHERE clause based on user role and resource type
 */
export function getRowLevelSecurityContext(
  context: RBACContext,
  resourceType: 'alerts' | 'students' | 'drivers' | 'trips' | 'announcements'
): Record<string, any> {
  if (!context.isAuthenticated) {
    throw new Error('User must be authenticated');
  }

  // Admin can see everything
  if (hasRole(context, 'admin')) {
    return { unrestricted: true };
  }

  // PNP can see PNP-specific alerts
  if (hasRole(context, 'pnp') && resourceType === 'alerts') {
    return { alert_type: 'pnp' };
  }

  // Students can see their own data
  if (hasRole(context, 'student') && resourceType === 'students') {
    return { user_id: context.userId };
  }

  // Drivers can see their own data
  if (hasRole(context, 'driver') && resourceType === 'drivers') {
    return { user_id: context.userId };
  }

  // Default: deny access
  throw new Error(`Unauthorized access to ${resourceType}`);
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  user_id: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  status: 'success' | 'failure';
  error_message?: string;
  client_ip?: string;
  client_user_agent?: string;
}

/**
 * Log sensitive actions for compliance and security monitoring
 */
export async function logAuditEvent(
  supabaseAdmin: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      user_id: entry.user_id,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id,
      details: entry.details ? JSON.stringify(entry.details) : null,
      status: entry.status,
      error_message: entry.error_message,
      client_ip: entry.client_ip,
      client_user_agent: entry.client_user_agent,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break main flow
    }
  } catch (error) {
    console.error('Audit logging exception:', error);
  }
}

/**aysu
 * Extract client IP from Deno request
 */
export function extractClientIp(req: Request): string | null {
  // Check X-Forwarded-For header (from proxies/CDN)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address
  return req.headers.get('cf-connecting-ip') || null;
}

/**
 * Rate limiting key generator
 * Use Redis in production, Map for development
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 3600000 }) {
    this.config = config;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const record = this.store.get(key);
    if (!record) return this.config.maxRequests;
    return Math.max(0, this.config.maxRequests - record.count);
  }

  getResetTime(key: string): number | null {
    const record = this.store.get(key);
    if (!record) return null;
    return record.resetTime;
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * CORS validation helper
 */
const ALLOWED_ORIGINS = [
  'https://safe-ride.isu.edu.ph',
  'https://www.safe-ride.isu.edu.ph',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Response helper for Deno edge functions
 */
export function successResponse(
  data: any,
  corsHeaders: Record<string, string> = {},
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}

export function errorResponse(
  message: string,
  corsHeaders: Record<string, string> = {},
  status = 400
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status,
    }
  );
}
