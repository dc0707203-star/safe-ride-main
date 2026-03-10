/**
 * Audit Logging Service
 * OWASP A09:2021 - Logging and Monitoring Failures
 * 
 * Tracks all security-sensitive operations for compliance and forensics
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_CREATE'
  | 'ACCOUNT_DELETE'
  | 'ACCOUNT_UPDATE'
  | 'ROLE_ASSIGN'
  | 'ROLE_REVOKE'
  | 'ALERT_CREATE'
  | 'ALERT_RESOLVE'
  | 'ALERT_ACKNOWLEDGE'
  | 'DATA_ACCESS'
  | 'DATA_EXPORT'
  | 'ADMIN_ACTION'
  | 'UNAUTHORIZED_ACCESS'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'
  | 'MFA_ENABLE'
  | 'MFA_DISABLE'
  | 'API_KEY_CREATE'
  | 'API_KEY_REVOKE';

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Create audit log entry
 * Uses server-side function for security (never trust client)
 */
export const auditLog = async (entry: Omit<AuditLogEntry, 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> => {
  try {
    // Get current user from session
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get client information
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    
    // Note: IP address should be extracted on backend from request headers
    // Client-side gets from either X-Forwarded-For or direct connection
    
    const logEntry = {
      user_id: userId,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId,
      status: entry.status,
      details: entry.details ? JSON.stringify(entry.details) : null,
      user_agent: userAgent,
      severity: entry.severity || 'low',
      created_at: new Date().toISOString(),
    };

    // Insert into audit_logs table via edge function
    const { error } = await supabase.functions.invoke('audit-log', {
      body: logEntry,
    });

    if (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit failures shouldn't break application
    }
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Silently fail to not disrupt user experience
  }
};

/**
 * Log failed login attempt
 */
export const logFailedLogin = async (email: string, reason: string): Promise<void> => {
  await auditLog({
    action: 'LOGIN_FAILED',
    resource: 'auth',
    status: 'failure',
    details: { email, reason },
    severity: 'medium',
  });
};

/**
 * Log successful login
 */
export const logSuccessfulLogin = async (method: 'email' | 'google' | 'oauth'): Promise<void> => {
  await auditLog({
    action: 'LOGIN',
    resource: 'auth',
    status: 'success',
    details: { method },
    severity: 'low',
  });
};

/**
 * Log account deletion
 */
export const logAccountDeletion = async (targetUserId: string): Promise<void> => {
  await auditLog({
    action: 'ACCOUNT_DELETE',
    resource: 'users',
    resourceId: targetUserId,
    status: 'success',
    severity: 'critical',
  });
};

/**
 * Log password change
 */
export const logPasswordChange = async (targetUserId: string): Promise<void> => {
  await auditLog({
    action: 'PASSWORD_CHANGE',
    resource: 'auth',
    resourceId: targetUserId,
    status: 'success',
    severity: 'high',
  });
};

/**
 * Log role assignment
 */
export const logRoleAssignment = async (targetUserId: string, newRole: string): Promise<void> => {
  await auditLog({
    action: 'ROLE_ASSIGN',
    resource: 'user_roles',
    resourceId: targetUserId,
    status: 'success',
    details: { newRole },
    severity: 'high',
  });
};

/**
 * Log unauthorized access attempt
 */
export const logUnauthorizedAccess = async (resource: string, reason: string): Promise<void> => {
  await auditLog({
    action: 'UNAUTHORIZED_ACCESS',
    resource,
    status: 'failure',
    details: { reason },
    severity: 'critical',
  });
};

/**
 * Log alert resolution
 */
export const logAlertResolution = async (alertId: string, resolution: string): Promise<void> => {
  await auditLog({
    action: 'ALERT_RESOLVE',
    resource: 'alerts',
    resourceId: alertId,
    status: 'success',
    details: { resolution },
    severity: 'high',
  });
};

/**
 * Log data access
 */
export const logDataAccess = async (resource: string, count: number): Promise<void> => {
  await auditLog({
    action: 'DATA_ACCESS',
    resource,
    status: 'success',
    details: { recordsAccessed: count },
    severity: 'low',
  });
};

/**
 * Log admin action
 */
export const logAdminAction = async (
  action: AuditAction,
  resource: string,
  resourceId: string,
  details?: Record<string, any>
): Promise<void> => {
  await auditLog({
    action,
    resource,
    resourceId,
    status: 'success',
    details,
    severity: 'medium',
  });
};

/**
 * Retrieve audit logs (admin only)
 * Server-side filtering should be applied
 */
export const getAuditLogs = async (
  limit: number = 100,
  offset: number = 0,
  filters?: {
    action?: AuditAction;
    userId?: string;
    resource?: string;
    status?: 'success' | 'failure';
    startDate?: string;
    endDate?: string;
  }
): Promise<any[]> => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.resource) {
      query = query.eq('resource', filters.resource);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    return [];
  }
};

/**
 * Generate audit report
 */
export const generateAuditReport = async (startDate: string, endDate: string) => {
  try {
    const logs = await getAuditLogs(1000, 0, { startDate, endDate });

    const report = {
      period: { startDate, endDate },
      totalEvents: logs.length,
      byAction: {} as Record<AuditAction, number>,
      byResource: {} as Record<string, number>,
      byStatus: { success: 0, failure: 0 },
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      failureReasons: [] as string[],
    };

    logs.forEach(log => {
      // Count by action
      report.byAction[log.action] = (report.byAction[log.action] || 0) + 1;

      // Count by resource
      report.byResource[log.resource] = (report.byResource[log.resource] || 0) + 1;

      // Count by status
      report.byStatus[log.status]++;

      // Count by severity
      report.bySeverity[log.severity]++;

      // Collect failures
      if (log.status === 'failure' && !report.failureReasons.includes(log.action)) {
        report.failureReasons.push(log.action);
      }
    });

    return report;
  } catch (error) {
    console.error('Error generating audit report:', error);
    return null;
  }
};
