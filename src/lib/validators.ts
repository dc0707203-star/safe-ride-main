/**
 * Security-focused Input Validators
 * Implements OWASP input validation best practices
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Student Registration Form Validation
 */
export const validateStudentRegistration = (data: {
  fullName?: string;
  studentIdNumber?: string;
  email?: string;
  password?: string;
  contactNumber?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Full Name Validation
  // Allow: letters, spaces, hyphens, apostrophes
  // Length: 2-100 characters
  if (!data.fullName?.trim()) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  } else {
    const fullNameRegex = /^[a-zA-Z\s\-']{2,100}$/;
    if (!fullNameRegex.test(data.fullName.trim())) {
      errors.push({
        field: 'fullName',
        message: 'Full name must be 2-100 characters (letters, spaces, hyphens, apostrophes only)',
      });
    }
  }

  // Student ID Validation
  // Pattern: ISU-YYYY-XXXX format (alphanumeric and hyphens)
  // Length: 5-20 characters
  if (!data.studentIdNumber?.trim()) {
    errors.push({
      field: 'studentIdNumber',
      message: 'Student ID is required',
    });
  } else {
    const studentIdRegex = /^[A-Z0-9\-]{5,20}$/;
    if (!studentIdRegex.test(data.studentIdNumber.trim())) {
      errors.push({
        field: 'studentIdNumber',
        message: 'Invalid student ID format',
      });
    }
  }

  // Email Validation
  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else {
    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
      });
    }
  }

  // Password Validation
  // Minimum 12 characters (should be enforced server-side as well)
  // Must contain uppercase, lowercase, number, symbol
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (data.password.length < 12) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 12 characters',
    });
  } else {
    const hasUppercase = /[A-Z]/.test(data.password);
    const hasLowercase = /[a-z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    const hasSymbol = /[!@#$%^&*]/.test(data.password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      errors.push({
        field: 'password',
        message: 'Password must contain uppercase, lowercase, number, and symbol',
      });
    }
  }

  // Contact Number Validation (Optional)
  if (data.contactNumber?.trim()) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(data.contactNumber.trim())) {
      errors.push({
        field: 'contactNumber',
        message: 'Invalid phone number format',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Alert Response/Resolution Validation
 */
export const validateAlertResponse = (data: {
  alertId?: string;
  notes?: string;
  resolution?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Alert ID Validation (UUID format)
  if (!data.alertId?.trim()) {
    errors.push({ field: 'alertId', message: 'Alert ID is required' });
  } else {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.alertId.trim())) {
      errors.push({
        field: 'alertId',
        message: 'Invalid alert ID format',
      });
    }
  }

  // Notes Validation
  // Max 500 characters, alphanumeric and basic punctuation only
  if (data.notes?.trim()) {
    if (data.notes.length > 500) {
      errors.push({
        field: 'notes',
        message: 'Notes must not exceed 500 characters',
      });
    }
    // Allow alphanumeric, spaces, and basic punctuation
    const notesRegex = /^[a-zA-Z0-9\s\.\,\-\!\?\'\"\(\)]{1,500}$/;
    if (!notesRegex.test(data.notes)) {
      errors.push({
        field: 'notes',
        message: 'Notes contain invalid characters',
      });
    }
  }

  // Resolution Validation
  if (data.resolution?.trim()) {
    const validResolutions = ['resolved', 'dismissed', 'referred', 'escalated'];
    if (!validResolutions.includes(data.resolution.toLowerCase())) {
      errors.push({
        field: 'resolution',
        message: `Resolution must be one of: ${validResolutions.join(', ')}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * User Role Assignment Validation
 */
export const validateRoleAssignment = (data: {
  userId?: string;
  role?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // User ID Validation (UUID format)
  if (!data.userId?.trim()) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.userId.trim())) {
      errors.push({
        field: 'userId',
        message: 'Invalid user ID format',
      });
    }
  }

  // Role Validation
  if (!data.role?.trim()) {
    errors.push({ field: 'role', message: 'Role is required' });
  } else {
    const validRoles = ['admin', 'student', 'driver', 'pnp', 'rescue'];
    if (!validRoles.includes(data.role.toLowerCase())) {
      errors.push({
        field: 'role',
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize user input to prevent XSS
 * Note: This is a basic implementation. For production, use DOMPurify
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    });
};

/**
 * Validate QR Code format (ISU-DRIVER-XXX)
 */
export const validateQRCode = (qrValue: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!qrValue?.trim()) {
    errors.push({ field: 'qrValue', message: 'QR code value is required' });
  } else {
    // Expected format: ISU-DRIVER-{ID}
    const qrRegex = /^ISU-DRIVER-[A-F0-9]{8}$/i;
    if (!qrRegex.test(qrValue.trim())) {
      errors.push({
        field: 'qrValue',
        message: 'Invalid QR code format. Expected: ISU-DRIVER-XXXXXXXX',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate trip data
 */
export const validateTripData = (data: {
  studentId?: string;
  driverId?: string;
  pickupLocation?: string;
  destination?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Student ID Validation
  if (!data.studentId?.trim()) {
    errors.push({ field: 'studentId', message: 'Student ID is required' });
  } else {
    const studentIdRegex = /^[A-Z0-9\-]{5,20}$/;
    if (!studentIdRegex.test(data.studentId.trim())) {
      errors.push({
        field: 'studentId',
        message: 'Invalid student ID format',
      });
    }
  }

  // Driver ID Validation (UUID)
  if (!data.driverId?.trim()) {
    errors.push({ field: 'driverId', message: 'Driver ID is required' });
  } else {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.driverId.trim())) {
      errors.push({
        field: 'driverId',
        message: 'Invalid driver ID format',
      });
    }
  }

  // Location Validation
  if (!data.pickupLocation?.trim()) {
    errors.push({
      field: 'pickupLocation',
      message: 'Pickup location is required',
    });
  } else if (data.pickupLocation.length > 200) {
    errors.push({
      field: 'pickupLocation',
      message: 'Pickup location must not exceed 200 characters',
    });
  }


  if (!data.destination?.trim()) {
    errors.push({ field: 'destination', message: 'Destination is required' });
  } else if (data.destination.length > 200) {
    errors.push({
      field: 'destination',
      message: 'Destination must not exceed 200 characters',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Rate Limiting - In-memory store (use Redis in production)
 * OWASP A04:2021 - Insecure Design
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // New entry or window expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  // Within limit
  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  // Rate limited
  return false;
};

/**
 * Clear rate limit for key (admin override)
 */
export const clearRateLimit = (key: string): void => {
  rateLimitStore.delete(key);
};

/**
 * Get rate limit status
 */
export const getRateLimitStatus = (key: string): { count: number; remaining: number; resetTime: number } | null => {
  const record = rateLimitStore.get(key);
  if (!record) return null;

  return {
    count: record.count,
    remaining: Math.max(0, 10 - record.count),
    resetTime: record.resetTime,
  };
};
