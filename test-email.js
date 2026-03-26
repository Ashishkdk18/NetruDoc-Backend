import { EmailService } from './src/utils/emailService.js';

async function testEmailService() {
  try {
    console.log('Testing email service...');

    const emailService = new EmailService();

    // Send a test OTP to the specified email
    await emailService.sendRegistrationOTP('lexepo3952@ixospace.com', '123456');

    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email failed to send:', error.message);
  }
}

// Run the test
testEmailService();