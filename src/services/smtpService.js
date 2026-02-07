// SMTP Service for authentication emails (verification, password reset)
class SMTPService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_SUPABASE_URL;
    this.apiKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  }

  /**
   * Send email via Supabase Edge Function
   */
  async sendEmail({ to, subject, text, html }) {
    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ to, subject, text, html })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SMTP Email error:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email, verificationToken) {
    const verificationLink = `${process.env.REACT_APP_BASE_URL}/auth/verify?token=${verificationToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - DEETECH Computers',
      text: `Click this link to verify your email: ${verificationLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">
            ${verificationLink}
          </p>
          
          <p>If you didn't create an account, you can ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;"/>
          <p style="color: #666; font-size: 12px;">
            DEETECH Computers<br/>
            Email: ${process.env.REACT_APP_ADMIN_EMAIL}
          </p>
        </div>
      `
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetLink = `${process.env.REACT_APP_BASE_URL}/auth/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - DEETECH Computers',
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #EF4444; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;"/>
          <p style="color: #666; font-size: 12px;">
            DEETECH Computers<br/>
            Email: ${process.env.REACT_APP_ADMIN_EMAIL}
          </p>
        </div>
      `
    });
  }

  /**
   * Send magic link for login
   */
  async sendMagicLink(email, magicLink) {
    return this.sendEmail({
      to: email,
      subject: 'Your Login Link - DEETECH Computers',
      text: `Click this link to login: ${magicLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Login to DEETECH Computers</h2>
          <p>Click the button below to securely login to your account:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #10B981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Login to Account
            </a>
          </div>
          
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this login link, please ignore this email.</p>
        </div>
      `
    });
  }
}

export const smtpService = new SMTPService();