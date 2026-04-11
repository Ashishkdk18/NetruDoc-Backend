import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Port 587 uses STARTTLS
      auth: {
        user: process.env.EMAIL_USER || 'ashishkhadka014@gmail.com',
        pass: process.env.EMAIL_PASS,
      },
      pool: true, // Use pooling to keep connection alive
      maxConnections: 1,
      maxMessages: Infinity,
      connectionTimeout: 60000, // Long timeout for Render Free Tier
      greetingTimeout: 30000,
      socketTimeout: 60000,
      debug: true, // IMPORTANT: Enables full conversation logs
      logger: true, // IMPORTANT: Logs everything to console
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });
  }

  /**
   * Send registration OTP
   */
  async sendRegistrationOTP(email, otp) {
    try {
      console.log(`📧 Attempting to send Registration OTP to ${email}...`);
      const mailOptions = {
        from: `"NetruDoc" <${process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'}>`,
        to: email,
        subject: 'Welcome to NetruDoc - Verify Your Email',
        html: `<div style="padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2>Account Verification</h2>
          <p>Your verification code is: <b style="font-size: 24px;">${otp}</b></p>
        </div>`,
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Nodemailer: Success! Message sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer Error during Registration:', error.message);
      return false;
    }
  }

  /**
   * Send login verification OTP
   */
  async sendLoginOTP(email, otp) {
    try {
      const mailOptions = {
        from: `"NetruDoc" <${process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'}>`,
        to: email,
        subject: 'NetruDoc - Login Code',
        html: `<p>Your login code is: <b>${otp}</b></p>`,
      };
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer Login Error:', error.message);
      return false;
    }
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetOTP(email, otp) {
    try {
      const mailOptions = {
        from: `"NetruDoc" <${process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'}>`,
        to: email,
        subject: 'NetruDoc - Password Reset',
        html: `<p>Your password reset code is: <b>${otp}</b></p>`,
      };
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer Reset Error:', error.message);
      return false;
    }
  }

  async sendAppointmentStatusEmail(email, status, details) {
    try {
      const { patientName, doctorName, date, time } = details;
      const mailOptions = {
        from: `"NetruDoc" <${process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'}>`,
        to: email,
        subject: `Appointment ${status}`,
        html: `<p>Hi ${patientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} is ${status}.</p>`,
      };
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer Appointment Error:', error.message);
      return false;
    }
  }

  async verifyConnection() {
    console.log('📧 Nodemailer: Starting SMTP connection test...');
    try {
      await this.transporter.verify();
      console.log('📧 Nodemailer: Success! Connection Verified.');
      return true;
    } catch (error) {
      console.error('📧 Nodemailer Connection Check Failed:', error.message);
      return false;
    }
  }
}

export default new EmailService();
