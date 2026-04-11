import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    // Falls back to a local key if the env var is missing
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_h4H6ZA4A_BcUQseKuFT2VpkiFwLkTpQ29');
    
    // IMPORTANT: If you are using a free Resend account, you can ONLY send to your own email 
    // (ashishkhadka014@gmail.com) until you verify a domain.
    this.fromEmail = 'onboarding@resend.dev'; 
  }

  /**
   * Send registration OTP
   */
  async sendRegistrationOTP(email, otp) {
    try {
      console.log(`[DEV] OTP for ${email}: ${otp}`); // Log to console for easy testing on Render
      
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to NetruDoc - Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Welcome to NetruDoc</h2>
            <p>Your verification code is: <strong>${otp}</strong></p>
          </div>
        `
      });
      console.log(`📧 Resend: Registration OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 Resend: Error sending registration email:', error.message);
      // We don't throw here so the server doesn't crash, but it will show in logs
      return false;
    }
  }

  /**
   * Send login verification OTP
   */
  async sendLoginOTP(email, otp) {
    try {
      console.log(`[DEV] Login OTP for ${email}: ${otp}`);
      
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'NetruDoc - Login Verification Code',
        html: `<p>Your login code is: <strong>${otp}</strong></p>`
      });
      console.log(`📧 Resend: Login OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 Resend: Error sending login email:', error.message);
      return false;
    }
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetOTP(email, otp) {
    try {
      console.log(`[DEV] Password Reset OTP for ${email}: ${otp}`);
      
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'NetruDoc - Password Reset Code',
        html: `<p>Your password reset code is: <strong>${otp}</strong></p>`
      });
      console.log(`📧 Resend: Password reset OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 Resend: Error sending reset email:', error.message);
      return false;
    }
  }

  /**
   * Send appointment status update email
   */
  async sendAppointmentStatusEmail(email, status, details) {
    try {
      const { patientName, doctorName, date, time } = details;
      
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Appointment ${status} - NetruDoc`,
        html: `<p>Hello ${patientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} is ${status}.</p>`
      });
      console.log(`📧 Resend: Appointment ${status} email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`📧 Resend: Error sending appointment ${status} email:`, error.message);
      return false;
    }
  }

  async verifyConnection() {
    console.log('📧 Email Service (Resend API): Ready');
    return true;
  }
}

export default new EmailService();
