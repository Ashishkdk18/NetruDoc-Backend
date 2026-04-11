import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER || 'ashishkhadka014@gmail.com',
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Helps with some hosting provider restrictions
      }
    });
  }

  /**
   * Send registration OTP
   */
  async sendRegistrationOTP(email, otp) {
    try {
      const mailOptions = {
        from: `"NetruDoc" <${process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'}>`,
        to: email,
        subject: 'Welcome to NetruDoc - Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Welcome to NetruDoc</h2>
            <p>Thank you for signing up. Please use the following verification code to complete your registration:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #6b7280; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Nodemailer: Registration OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer: Error sending registration email:', error);
      throw error;
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
        subject: 'NetruDoc - Login Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Login Verification</h2>
            <p>Please use the following code to verify your login:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Nodemailer: Login OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer: Error sending login email:', error);
      throw error;
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
        subject: 'NetruDoc - Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Password Reset Request</h2>
            <p>We received a request to reset your password. Use the code below to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #ef4444; font-size: 13px;">If you didn't request a password reset, please secure your account immediately.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Nodemailer: Password reset OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 Nodemailer: Error sending reset email:', error);
      throw error;
    }
  }

  /**
   * Send appointment status update email
   */
  async sendAppointmentStatusEmail(email, status, details) {
    try {
      const { patientName, doctorName, date, time, reason } = details;
      const formattedDate = new Date(date).toLocaleDateString();
      
      const statusText = status === 'confirmed' ? 'Confirmed' : 'Cancelled';
      const color = status === 'confirmed' ? '#10b981' : '#ef4444';

      const mailOptions = {
        from: `"NetruDoc" <${process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'}>`,
        to: email,
        subject: `Appointment ${statusText} - NetruDoc`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: ${color}; text-align: center;">Appointment ${statusText}</h2>
            <p>Hello ${patientName || 'Patient'},</p>
            <p>Your appointment with <strong>Dr. ${doctorName || 'Doctor'}</strong> has been <strong>${status}</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${time}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            <p>For any questions, please contact our support.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Nodemailer: Appointment ${status} email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`📧 Nodemailer: Error sending appointment ${status} email:`, error);
      throw error;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('📧 Email Service: Nodemailer Ready');
      return true;
    } catch (error) {
      console.error('📧 Email Service Error:', error.message);
      return false;
    }
  }
}

export default new EmailService();
