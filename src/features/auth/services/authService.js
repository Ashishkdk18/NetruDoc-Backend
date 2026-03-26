import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/authRepository.js';
import { UserService } from '../../users/services/userService.js';
import User from '../../users/models/userModel.js';
import emailService from '../../../utils/emailService.js';

/**
 * Auth Service
 * Contains business logic for authentication operations
 */
export class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
    this.userService = new UserService();
  }

  /**
   * Generate JWT Token
   * @param {String} userId - User ID
   * @returns {String}
   */
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'netrudoc_jwt_secret_key_2025',
      {
        expiresIn: process.env.JWT_EXPIRE || '7d',
      }
    );
  }

  /**
   * Register new user - sends OTP instead of creating account immediately
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>}
   */
  async register(userData) {
    const { name, email, password, role, phone, address } = userData;

    // Check if user exists
    const userExists = await this.authRepository.emailExists(email);
    if (userExists) {
      throw new Error('User already exists');
    }

    // Validate doctor-specific requirements
    if (role === 'doctor') {
      if (!userData.licenseNumber) {
        throw new Error('License number is required for doctor registration');
      }
      if (!userData.specialization) {
        throw new Error('Specialization is required for doctor registration');
      }
    }

    // Create temporary user record with emailVerified: false
    const userPayload = {
      name,
      email,
      password,
      role: role || 'patient',
      phone,
      address,
      emailVerified: false
    };

    // Add patient-specific fields
    if (role === 'patient') {
      if (userData.dateOfBirth) {
        // Convert ISO string to Date object
        userPayload.dateOfBirth = new Date(userData.dateOfBirth);
      }
      if (userData.gender) userPayload.gender = userData.gender;
      if (userData.emergencyContact) userPayload.emergencyContact = userData.emergencyContact;
      if (userData.medicalHistory) userPayload.medicalHistory = userData.medicalHistory;
    }

    // Add doctor-specific fields
    if (role === 'doctor') {
      userPayload.licenseNumber = userData.licenseNumber;
      userPayload.specialization = userData.specialization;
      userPayload.qualifications = userData.qualifications || [];
      userPayload.experience = userData.experience || 0;

      if (userData.hospital) {
        if (typeof userData.hospital === 'string') {
            if (/^[0-9a-fA-F]{24}$/.test(userData.hospital)) {
                userPayload.hospital = userData.hospital;
            } else if (userData.hospital.trim() !== '') {
               try {
                   const mongoose = await import('mongoose');
                   const Hospital = mongoose.model('Hospital');
                   const hospital = await Hospital.findOne({ name: userData.hospital });
                   if (hospital) {
                      userPayload.hospital = hospital._id;
                   }
               } catch(err) {
                   console.error("Error looking up hospital:", err);
               }
            }
        } else if (typeof userData.hospital === 'object' && userData.hospital._id) {
            userPayload.hospital = userData.hospital._id;
        }
      }

      userPayload.consultationFee = userData.consultationFee || 0;
      userPayload.availability = userData.availability;
      userPayload.qualificationDocuments = userData.qualificationDocuments || [];
      userPayload.isVerified = false; // Doctor needs admin verification
    }

    // Create user (password will be hashed by pre-save hook)
    // Remove hospital entirely if it's not a valid 24 character hex string to prevent BSONError
    if (userPayload.hospital) {
        if (typeof userPayload.hospital === 'string') {
            if (!/^[0-9a-fA-F]{24}$/.test(userPayload.hospital)) {
                delete userPayload.hospital;
            }
        } else if (typeof userPayload.hospital !== 'object') {
             delete userPayload.hospital;
        }
    }
    const user = await this.userService.createUser(userPayload);

    // Generate and send OTP
    const otp = user.generateOTP('registration');
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendRegistrationOTP(email, otp);
    } catch (error) {
      // If email fails, delete the temporary user record
      await this.userService.deleteUser(user._id);
      throw new Error('Failed to send verification email. Please try again.');
    }

    return {
      message: 'Registration initiated. Please check your email for verification code.',
      userId: user._id,
      email: user.email
    };
  }

  /**
   * Login user - sends OTP instead of immediately logging in
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    console.log(`Login attempt for email: ${email}`);
    // Find user with password
    const user = await this.authRepository.findByEmailWithPassword(email);
    if (!user) {
      console.warn(`Login failed: User not found for email ${email}`);
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      console.warn(`Login failed: Account deactivated for email ${email}`);
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    // Validate password FIRST (security - prevent OTP spam for invalid credentials)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: Incorrect password for email ${email}`);
      throw new Error('Invalid credentials');
    }

    // Check email verification status after password validation
    if (!user.emailVerified) {
      console.log(`Email not verified for ${email}. Sending registration OTP.`);
      // Generate and send fresh registration OTP for unverified users
      const otp = user.generateOTP('registration');
      await user.save({ validateBeforeSave: false });

      try {
        await emailService.sendRegistrationOTP(email, otp);
      } catch (error) {
        console.error(`Failed to send registration OTP to ${email}:`, error);
        throw new Error('Failed to send verification email. Please try again.');
      }

      // Return OTP-required response
      return {
        message: 'Please verify your email address. A verification code has been sent to your email.',
        email: user.email,
        userId: user._id
      };
    }

    // For doctors, check if verified by admin
    if (user.role === 'doctor' && !user.isVerified) {
      console.warn(`Login failed: Doctor account not verified by admin for ${email}`);
      throw new Error('Your doctor account is pending admin verification');
    }

    // Check if user is fully verified (email + doctor verification if applicable)
    const isFullyVerified = user.emailVerified && (user.role !== 'doctor' || user.isVerified);

    if (isFullyVerified) {
      try {
        console.log(`User ${email} fully verified. Generating token.`);
        // Skip OTP for fully verified users - generate token directly
        const token = this.generateToken(user._id);
        
        if (!token) {
          throw new Error('Token generation failed');
        }

        // Update last login
        await this.authRepository.updateLastLogin(user._id);

        return {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address
          }
        };
      } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Failed to generate authentication token');
      }
    }

    console.log(`Login verification OTP required for ${email}. Sending login OTP.`);
    // Generate and send OTP for users needing additional verification (doctors pending admin verification)
    const otp = user.generateOTP('login');
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendLoginOTP(email, otp);
    } catch (error) {
      console.error(`Failed to send login OTP to ${email}:`, error);
      throw new Error('Failed to send login verification email. Please try again.');
    }

    return {
      message: 'Login verification code sent to your email',
      email: user.email
    };
  }

  /**
   * Get current user
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async getMe(userId) {
    return this.userService.getUserById(userId);
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, profileData) {
    const user = await this.userService.getUserById(userId);
    
    const fieldsToUpdate = {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address
    };

    // Add patient-specific fields (US6)
    if (user.role === 'patient') {
      if (profileData.dateOfBirth !== undefined) fieldsToUpdate.dateOfBirth = profileData.dateOfBirth;
      if (profileData.gender !== undefined) fieldsToUpdate.gender = profileData.gender;
      if (profileData.emergencyContact !== undefined) fieldsToUpdate.emergencyContact = profileData.emergencyContact;
      if (profileData.medicalHistory !== undefined) fieldsToUpdate.medicalHistory = profileData.medicalHistory;
    }

    // Add doctor-specific fields (US6 - clinic address, etc.)
    if (user.role === 'doctor') {
      if (profileData.specialization !== undefined) fieldsToUpdate.specialization = profileData.specialization;
      if (profileData.licenseNumber !== undefined) fieldsToUpdate.licenseNumber = profileData.licenseNumber;
      if (profileData.qualifications !== undefined) fieldsToUpdate.qualifications = profileData.qualifications;
      if (profileData.experience !== undefined) fieldsToUpdate.experience = profileData.experience;
      if (profileData.hospital !== undefined) fieldsToUpdate.hospital = profileData.hospital;
      if (profileData.consultationFee !== undefined) fieldsToUpdate.consultationFee = profileData.consultationFee;
      if (profileData.availability !== undefined) fieldsToUpdate.availability = profileData.availability;
      if (profileData.qualificationDocuments !== undefined) fieldsToUpdate.qualificationDocuments = profileData.qualificationDocuments;
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    return this.userService.updateUser(userId, fieldsToUpdate);
  }

  /**
   * Change password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.authRepository.findById(userId, { select: '+password' });
    if (!user) {
      throw new Error('User not found');
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Set new password - will be hashed by pre-save hook
    user.password = newPassword;
    await user.save();

    return user;
  }

  /**
   * Forgot password - sends OTP instead of reset token
   * @param {String} email - User email
   * @returns {Promise<Object>}
   */
  async forgotPassword(email) {
    const user = await this.authRepository.findByEmailWithPassword(email);
    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If an account exists with this email, a password reset code has been sent' };
    }

    // Generate and send OTP
    const otp = user.generateOTP('password-reset');
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetOTP(email, otp);
    } catch (error) {
      // Don't reveal failure for security
    }

    return { message: 'If an account exists with this email, a password reset code has been sent' };
  }

  /**
   * Reset password using OTP
   * @param {String} email - User email
   * @param {String} otp - OTP code
   * @param {String} newPassword - New password
   * @returns {Promise<Object>}
   */
  async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({ email }).select('+otpCode +otpExpires +otpType');

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.verifyOTP(otp) || user.otpType !== 'password-reset') {
      throw new Error('Invalid or expired OTP');
    }

    // Set new password and clear OTP - password will be hashed by pre-save hook
    user.password = newPassword;
    user.clearOTP();
    await user.save({ validateBeforeSave: false });

    return { message: 'Password reset successfully' };
  }

  /**
   * Verify registration OTP and complete registration
   * @param {String} email - User email
   * @param {String} otp - OTP code
   * @returns {Promise<Object>}
   */
  async verifyRegistrationOTP(email, otp) {
    const user = await User.findOne({ email }).select('+otpCode +otpExpires +otpType');

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    if (!user.verifyOTP(otp) || user.otpType !== 'registration') {
      throw new Error('Invalid or expired OTP');
    }

    // Mark email as verified and clear OTP
    user.emailVerified = true;
    user.clearOTP();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = this.generateToken(user._id);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        ...(user.role === 'doctor' && {
          specialization: user.specialization,
          licenseNumber: user.licenseNumber,
          isVerified: user.isVerified
        })
      }
    };
  }

  /**
   * Resend OTP for registration
   * @param {String} email - User email
   * @returns {Promise<Object>}
   */
  async resendRegistrationOTP(email) {
    const user = await User.findOne({ email }).select('+otpCode +otpExpires +otpType');

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new OTP
    const otp = user.generateOTP('registration');
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendRegistrationOTP(email, otp);
    } catch (error) {
      throw new Error('Failed to send verification email. Please try again.');
    }

    return {
      message: 'Verification code sent to your email',
      email: user.email
    };
  }

  /**
   * Verify login OTP and complete login
   * @param {String} email - User email
   * @param {String} otp - OTP code
   * @returns {Promise<Object>}
   */
  async verifyLoginOTP(email, otp) {
    const user = await User.findOne({ email }).select('+otpCode +otpExpires +otpType');

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.verifyOTP(otp) || user.otpType !== 'login') {
      throw new Error('Invalid or expired OTP');
    }

    // Clear OTP
    user.clearOTP();
    await user.save({ validateBeforeSave: false });

    // Update last login
    await this.authRepository.updateLastLogin(user._id);

    // Generate JWT token
    const token = this.generateToken(user._id);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    };
  }
}
