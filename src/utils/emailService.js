import nodemailer from 'nodemailer';

/**
 * Email Service using Google SMTP
 * Handles sending OTP emails for authentication
 */
export class EmailService {
  constructor() {
    // Create transporter with hardcoded Google SMTP credentials
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ashishkhadka014@gmail.com',
        pass: 'xcuj guqb vyll rsuo'
      }
    });
  }

  /**
   * Send OTP email for registration verification
   * @param {String} email - Recipient email
   * @param {String} otp - 6-digit OTP code
   * @returns {Promise<void>}
   */
  async sendRegistrationOTP(email, otp) {
    const mailOptions = {
      from: 'ashishkhadka014@gmail.com',
      to: email,
      subject: 'NetruDoc - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Welcome to NetruDoc!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #333; margin: 0;">Your Verification Code</h3>
            <div style="font-size: 32px; font-weight: bold; color: #1976d2; margin: 10px 0;">${otp}</div>
            <p style="color: #666; margin: 10px 0;">This code will expire in 10 minutes</p>
          </div>
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br>The NetruDoc Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Registration OTP sent to ${email}`);
    } catch (error) {
      console.error('Failed to send registration OTP:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send OTP email for login verification
   * @param {String} email - Recipient email
   * @param {String} otp - 6-digit OTP code
   * @returns {Promise<void>}
   */
  async sendLoginOTP(email, otp) {
    const mailOptions = {
      from: 'ashishkhadka014@gmail.com',
      to: email,
      subject: 'NetruDoc - Login Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">NetruDoc Login Verification</h2>
          <p>You are attempting to log in to your NetruDoc account.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #333; margin: 0;">Your Login Code</h3>
            <div style="font-size: 32px; font-weight: bold; color: #1976d2; margin: 10px 0;">${otp}</div>
            <p style="color: #666; margin: 10px 0;">This code will expire in 10 minutes</p>
          </div>
          <p>If you didn't request this login, please ignore this email and contact support if you have concerns.</p>
          <p>Best regards,<br>The NetruDoc Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Login OTP sent to ${email}`);
    } catch (error) {
      console.error('Failed to send login OTP:', error);
      throw new Error('Failed to send login verification email');
    }
  }

  /**
   * Send OTP email for password reset
   * @param {String} email - Recipient email
   * @param {String} otp - 6-digit OTP code
   * @returns {Promise<void>}
   */
  async sendPasswordResetOTP(email, otp) {
    const mailOptions = {
      from: 'ashishkhadka014@gmail.com',
      to: email,
      subject: 'NetruDoc - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">NetruDoc Password Reset</h2>
          <p>You have requested to reset your password for your NetruDoc account.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #333; margin: 0;">Your Reset Code</h3>
            <div style="font-size: 32px; font-weight: bold; color: #1976d2; margin: 10px 0;">${otp}</div>
            <p style="color: #666; margin: 10px 0;">This code will expire in 10 minutes</p>
          </div>
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          <p>Best regards,<br>The NetruDoc Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset OTP:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Generic OTP email sender
   * @param {String} email - Recipient email
   * @param {String} otp - 6-digit OTP code
   * @param {String} type - OTP type ('registration', 'login', 'password-reset')
   * @returns {Promise<void>}
   */
  async sendOTP(email, otp, type) {
    switch (type) {
      case 'registration':
        return this.sendRegistrationOTP(email, otp);
      case 'login':
        return this.sendLoginOTP(email, otp);
      case 'password-reset':
        return this.sendPasswordResetOTP(email, otp);
      default:
        throw new Error('Invalid OTP type');
    }
  }

  /**
   * Send appointment status email (confirmed / cancelled)
   * @param {String} email - Recipient email
   * @param {String} status - 'confirmed' or 'cancelled'
   * @param {Object} context - Additional context (patientName, doctorName, date, time, reason)
   * @returns {Promise<void>}
   */
  async sendAppointmentStatusEmail(email, status, context = {}) {
    const { patientName, doctorName, date, time, reason } = context;

    const isConfirmed = status === 'confirmed';
    const subject = isConfirmed
      ? 'Your NetruDoc appointment has been confirmed'
      : 'Your NetruDoc appointment has been cancelled';

    const dateObj = date ? new Date(date) : null;
    const formattedDate = dateObj && !Number.isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString()
      : 'the scheduled date';

    const timeText = time || 'the scheduled time';

    const reasonHtml = reason
      ? `<p><strong>Reason:</strong> ${reason}</p>`
      : '';

    const statusLine = isConfirmed
      ? 'has been <strong style=\"color:#2e7d32;\">confirmed</strong>.'
      : 'has been <strong style=\"color:#c62828;\">cancelled</strong>.';

    const greetingName = patientName || 'Patient';

    const html = `
      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
        <h2 style=\"color: #1976d2;\">NetruDoc Appointment Update</h2>
        <p>Dear ${greetingName},</p>
        <p>Your appointment with Dr. ${doctorName || 'your doctor'} on <strong>${formattedDate}</strong> at <strong>${timeText}</strong> ${statusLine}</p>
        ${reasonHtml}
        <p>If you have any questions, please log in to NetruDoc to review your appointments.</p>
        <p>Best regards,<br/>The NetruDoc Team</p>
      </div>
    `;

    const mailOptions = {
      from: 'ashishkhadka014@gmail.com',
      to: email,
      subject,
      html
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Appointment ${status} email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send appointment ${status} email:`, error);
      // Do not throw here – appointment flow should not fail because email failed
    }
  }
}

// Export singleton instance
export default new EmailService();
