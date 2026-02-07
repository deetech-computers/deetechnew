/**
 * Security Utilities for DEETECH
 * Implements rate limiting, brute force protection, and security logging
 */

const SECURITY_CONFIG = {
  // Rate limiting settings
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  MAX_SIGNUP_ATTEMPTS: 3,
  SIGNUP_LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  MAX_PASSWORD_RESET_ATTEMPTS: 3,
  PASSWORD_RESET_LOCKOUT_DURATION: 60 * 60 * 1000, // 1 hour
  
  // Session security
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  ADMIN_SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours for admin
  
  // Security monitoring
  SUSPICIOUS_ACTIVITY_THRESHOLD: 10, // Failed attempts before flagging
  IP_BAN_DURATION: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Rate Limiter Class
 */
class RateLimiter {
  constructor() {
    this.attempts = this.loadAttempts();
    this.bannedIPs = this.loadBannedIPs();
    this.lastCleanup = Date.now();
  }

  loadAttempts() {
    try {
      const stored = localStorage.getItem('security_attempts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveAttempts() {
    try {
      localStorage.setItem('security_attempts', JSON.stringify(this.attempts));
    } catch (error) {
      console.error('Failed to save security attempts:', error);
    }
  }

  loadBannedIPs() {
    try {
      const stored = localStorage.getItem('security_banned_ips');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveBannedIPs() {
    try {
      localStorage.setItem('security_banned_ips', JSON.stringify(this.bannedIPs));
    } catch (error) {
      console.error('Failed to save banned IPs:', error);
    }
  }

  cleanup() {
    // Clean up old entries every hour
    const now = Date.now();
    if (now - this.lastCleanup < 60 * 60 * 1000) return;

    // Remove expired attempts
    Object.keys(this.attempts).forEach(key => {
      if (this.attempts[key].resetAt < now) {
        delete this.attempts[key];
      }
    });

    // Remove expired bans
    Object.keys(this.bannedIPs).forEach(ip => {
      if (this.bannedIPs[ip].bannedUntil < now) {
        delete this.bannedIPs[ip];
      }
    });

    this.saveAttempts();
    this.saveBannedIPs();
    this.lastCleanup = now;
  }

  getKey(type, identifier) {
    return `${type}_${identifier}`;
  }

  isIPBanned(identifier) {
    this.cleanup();
    const banned = this.bannedIPs[identifier];
    if (!banned) return false;
    
    if (Date.now() < banned.bannedUntil) {
      return {
        banned: true,
        remainingTime: Math.ceil((banned.bannedUntil - Date.now()) / 1000 / 60),
        reason: banned.reason
      };
    }
    
    delete this.bannedIPs[identifier];
    this.saveBannedIPs();
    return false;
  }

  banIP(identifier, reason = 'Suspicious activity') {
    const bannedUntil = Date.now() + SECURITY_CONFIG.IP_BAN_DURATION;
    this.bannedIPs[identifier] = {
      bannedUntil,
      reason,
      bannedAt: Date.now()
    };
    this.saveBannedIPs();
    
    // Log to console for monitoring
    console.warn(`🚨 IP/User banned: ${identifier}. Reason: ${reason}`);
  }

  checkRateLimit(type, identifier, maxAttempts, lockoutDuration) {
    this.cleanup();
    
    // Check if IP is banned
    const banned = this.isIPBanned(identifier);
    if (banned) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: banned.remainingTime * 60 * 1000,
        reason: `Account temporarily locked: ${banned.reason}`
      };
    }

    const key = this.getKey(type, identifier);
    const now = Date.now();
    
    if (!this.attempts[key]) {
      this.attempts[key] = {
        count: 0,
        firstAttempt: now,
        resetAt: now + lockoutDuration
      };
    }

    const attempt = this.attempts[key];
    
    // Reset if lockout period has passed
    if (now >= attempt.resetAt) {
      this.attempts[key] = {
        count: 0,
        firstAttempt: now,
        resetAt: now + lockoutDuration
      };
      this.saveAttempts();
      return { allowed: true, remaining: maxAttempts };
    }

    // Check if limit exceeded
    if (attempt.count >= maxAttempts) {
      const resetIn = attempt.resetAt - now;
      
      // Ban if too many failed attempts
      if (attempt.count >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
        this.banIP(identifier, 'Too many failed attempts');
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetIn,
        reason: `Too many attempts. Try again in ${Math.ceil(resetIn / 1000 / 60)} minutes.`
      };
    }

    return {
      allowed: true,
      remaining: maxAttempts - attempt.count
    };
  }

  recordAttempt(type, identifier, success = false) {
    const key = this.getKey(type, identifier);
    
    if (!this.attempts[key]) {
      const now = Date.now();
      const lockoutDuration = this.getLockoutDuration(type);
      this.attempts[key] = {
        count: 0,
        firstAttempt: now,
        resetAt: now + lockoutDuration
      };
    }

    if (success) {
      // Reset on success
      delete this.attempts[key];
    } else {
      // Increment on failure
      this.attempts[key].count++;
      
      // Log suspicious activity
      if (this.attempts[key].count >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
        console.warn(`🚨 Suspicious activity detected: ${type} for ${identifier}`);
      }
    }
    
    this.saveAttempts();
  }

  getLockoutDuration(type) {
    switch (type) {
      case 'login':
        return SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION;
      case 'signup':
        return SECURITY_CONFIG.SIGNUP_LOCKOUT_DURATION;
      case 'password_reset':
        return SECURITY_CONFIG.PASSWORD_RESET_LOCKOUT_DURATION;
      case 'admin_access_attempt':
        return 15 * 60 * 1000; // 15 minutes for admin attempts
      case 'unauthorized_access':
        return 60 * 60 * 1000; // 1 hour for unauthorized access
      default:
        return SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION;
    }
  }

  getMaxAttempts(type) {
    switch (type) {
      case 'login':
        return SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
      case 'signup':
        return SECURITY_CONFIG.MAX_SIGNUP_ATTEMPTS;
      case 'password_reset':
        return SECURITY_CONFIG.MAX_PASSWORD_RESET_ATTEMPTS;
      case 'admin_access_attempt':
        return 3; // 3 attempts for admin access
      case 'unauthorized_access':
        return 10; // 10 attempts for unauthorized access
      default:
        return SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
    }
  }
}

/**
 * Session Manager Class
 */
class SessionManager {
  constructor() {
    this.sessionKey = 'deetech_session';
  }

  createSession(user, isAdmin = false) {
    const timeout = isAdmin 
      ? SECURITY_CONFIG.ADMIN_SESSION_TIMEOUT 
      : SECURITY_CONFIG.SESSION_TIMEOUT;
    
    const session = {
      userId: user.id,
      email: user.email,
      isAdmin,
      createdAt: Date.now(),
      expiresAt: Date.now() + timeout,
      lastActivity: Date.now(),
      lastPath: null,
      browserFingerprint: null // Added to match your code
    };

    this.saveSession(session);
    return session;
  }

  saveSession(session) {
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  getSession() {
    try {
      const stored = sessionStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  updateActivity() {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      this.saveSession(session);
    }
  }

  isSessionValid() {
    const session = this.getSession();
    if (!session) return false;

    const now = Date.now();
    
    // Check if session expired
    if (now >= session.expiresAt) {
      this.clearSession();
      return false;
    }

    // Check if session is inactive (30 minutes for admin, 2 hours for users)
    const inactivityTimeout = session.isAdmin ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000;
    if (now - session.lastActivity > inactivityTimeout) {
      this.clearSession();
      return false;
    }

    return true;
  }

  clearSession() {
    try {
      sessionStorage.removeItem(this.sessionKey);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
}

/**
 * Security Logger
 */
class SecurityLogger {
  constructor() {
    this.logKey = 'security_logs';
    this.maxLogs = 100;
  }

  log(event, details = {}) {
    try {
      const logs = this.getLogs();
      const logEntry = {
        timestamp: Date.now(),
        event,
        details,
        userAgent: navigator.userAgent
      };

      logs.unshift(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > this.maxLogs) {
        logs.splice(this.maxLogs);
      }

      localStorage.setItem(this.logKey, JSON.stringify(logs));
      
      // Also log to console for development
      console.log(`🔐 Security Event: ${event}`, details);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  getLogs() {
    try {
      const stored = localStorage.getItem(this.logKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearOldLogs(daysToKeep = 7) {
    try {
      const logs = this.getLogs();
      const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      const filtered = logs.filter(log => log.timestamp > cutoff);
      localStorage.setItem(this.logKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  }
}

/**
 * Input Sanitizer
 */
class InputSanitizer {
  static sanitizeEmail(email) {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  static sanitizeText(text) {
    if (!text) return '';
    // Remove potential XSS characters
    return text.replace(/[<>\"']/g, '').trim();
  }

  static validatePassword(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static detectSQLInjection(input) {
    const sqlPatterns = [
      /(\bOR\b|\bAND\b).*?[=<>]/i,
      /UNION.*?SELECT/i,
      /DROP.*?TABLE/i,
      /INSERT.*?INTO/i,
      /DELETE.*?FROM/i,
      /UPDATE.*?SET/i,
      /--/,
      /\/\*/,
      /xp_/i,
      /sp_/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static detectXSS(input) {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /onclick=/i,
      /<iframe/i,
      /eval\(/i,
      /alert\(/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  static isSuspicious(input) {
    return this.detectSQLInjection(input) || this.detectXSS(input);
  }
}

// Create singleton instances
const rateLimiter = new RateLimiter();
const sessionManager = new SessionManager();
const securityLogger = new SecurityLogger();

// Export everything as named exports
export { 
  rateLimiter, 
  sessionManager, 
  securityLogger, 
  InputSanitizer as inputSanitizer,
  SECURITY_CONFIG 
};

// Also export the classes if needed elsewhere
export { 
  RateLimiter, 
  SessionManager, 
  SecurityLogger, 
  InputSanitizer 
};