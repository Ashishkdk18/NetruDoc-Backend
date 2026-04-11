import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }
    
    // IMPORTANT: In SendGrid, you MUST use a verified Sender email address
    // This is usually your own email or a domain email you verified in SendGrid dashboard
    this.fromEmail = process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'; 
  }

  /**
   * Send registration OTP
   */
  async sendRegistrationOTP(email, otp) {
    try {
      console.log(`📧 Sending Registration OTP to ${email}...`);
      
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'Welcome to NetruDoc - Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Welcome to NetruDoc</h2>
            <p>Your verification code is: <b style="font-size: 24px;">${otp}</b></p>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      };

      if (!this.apiKey) {
        console.warn('⚠️ SendGrid: API Key missing. Skipping email send.');
        return false;
      }

      await sgMail.send(msg);
      console.log(`📧 SendGrid: Registration OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 SendGrid Error:', error.response ? error.response.body : error.message);
      return false;
    }
  }

  /**
   * Send login verification OTP
   */
  async sendLoginOTP(email, otp) {
    try {
      console.log(`📧 Sending Login OTP to ${email}...`);
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'NetruDoc - Login Verification',
        html: `<p>Your login verification code is: <b>${otp}</b></p>`,
      };
      await sgMail.send(msg);
      console.log(`📧 SendGrid: Login OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 SendGrid Login Error:', error.message);
      return false;
    }
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetOTP(email, otp) {
    try {
      console.log(`📧 Sending Reset OTP to ${email}...`);
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'NetruDoc - Password Reset',
        html: `<p>Your password reset code is: <b>${otp}</b></p>`,
      };
      await sgMail.send(msg);
      console.log(`📧 SendGrid: Reset OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 SendGrid Reset Error:', error.message);
      return false;
    }
  }

  async sendAppointmentStatusEmail(email, status, details) {
    try {
      const { patientName, doctorName, date, time } = details;
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: `Appointment ${status} - NetruDoc`,
        html: `<p>Hello ${patientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} is ${status}.</p>`,
      };
      await sgMail.send(msg);
      console.log(`📧 SendGrid: Appointment ${status} email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 SendGrid Appointment Error:', error.message);
      return false;
    }
  }

  async verifyConnection() {
    if (!this.apiKey) {
      console.log('⚠️ SendGrid: API Key missing. Email service will not work until SENDGRID_API_KEY is set.');
      return false;
    }
    console.log('📧 Email Service (SendGrid API): Ready');
    return true;
  }
}

export default new EmailService();
