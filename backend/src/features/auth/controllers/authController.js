import { validationResult } from 'express-validator';
import { AuthService } from '../services/authService.js';
import { AuditService } from '../../audit/services/auditService.js';
import { successResponse, errorResponse, infoResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';

const authService = new AuthService();
const auditService = new AuditService();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errorResponse('Validation failed', { errors: errors.array() }));
    }

    const result = await authService.register(req.body);

    res.status(201).json(successResponse(RESPONSE_MESSAGES.REGISTER_SUCCESS, result));
  } catch (error) {
    console.error(error);
    if (error.message === 'User already exists') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse(`Server error during registration: ${error.message}`));
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errorResponse('Validation failed', { errors: errors.array() }));
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Check if result is OTP-required response or direct login
    if (result.message && result.email && !result.token) {
      // OTP required - email verification needed
      return res.status(200).json(successResponse(result.message, {
        email: result.email,
        userId: result.userId
      }));
    }

    // Direct login success
    res.status(200).json(successResponse(RESPONSE_MESSAGES.LOGIN_SUCCESS, result));

    // Best-effort audit log for successful login
    try {
      if (result.user && result.user._id) {
        await auditService.logAction(
          'user',
          result.user._id,
          'view',
          result.user._id.toString(),
          result.user.role || 'patient',
          req,
          { email }
        );
      }
    } catch (auditError) {
      // Do not block login on audit failures
      console.error('Failed to log login audit event:', auditError);
    }
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json(errorResponse(error.message));
    }
    if (error.message.includes('deactivated') || error.message.includes('pending admin verification')) {
      return res.status(403).json(errorResponse(error.message));
    }
    if (error.message.includes('verify your email')) {
      return res.status(200).json(successResponse(error.message, {
        email: req.body.email
      }));
    }
    
    res.status(500).json(errorResponse(`Login failed: ${error.message || 'Server error during login'}`));
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user._id);

    res.status(200).json(successResponse('User profile retrieved successfully', { user }));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Server error'));
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PROFILE_UPDATED, { user }));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Server error'));
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );

    res.status(200).json(successResponse(RESPONSE_MESSAGES.PASSWORD_CHANGED));
  } catch (error) {
    console.error(error);
    if (error.message === 'Current password is incorrect') {
      return res.status(401).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Server error'));
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.status(200).json(successResponse(RESPONSE_MESSAGES.LOGOUT_SUCCESS));
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const resetToken = await authService.forgotPassword(req.body.email);
    
    // Don't reveal if email exists for security
    // In production, always return success message
    res.status(200).json(infoResponse('If an account exists with this email, a password reset link has been sent'));
    
    // For development: include token in response (remove in production)
    if (process.env.NODE_ENV === 'development' && resetToken) {
      return res.status(200).json(infoResponse('Password reset token generated', { 
        resetToken, 
        message: 'In production, this token would be sent via email' 
      }));
    }
  } catch (error) {
    // Don't reveal if email exists
    res.status(200).json(infoResponse('If an account exists with this email, a password reset link has been sent'));
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json(errorResponse('Email, OTP, and password are required'));
    }

    const result = await authService.resetPassword(email, otp, password);
    res.status(200).json(successResponse(result.message));
  } catch (error) {
    console.error(error);
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message === 'User not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to reset password'));
  }
};

// @desc    Verify registration OTP
// @route   POST /api/auth/verify-registration-otp
// @access  Public
export const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(errorResponse('Email and OTP are required'));
    }

    const result = await authService.verifyRegistrationOTP(email, otp);
    res.status(200).json(successResponse('Registration completed successfully', result));
  } catch (error) {
    console.error(error);
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message === 'Email already verified') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to verify registration'));
  }
};

// @desc    Resend registration OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse('Email is required'));
    }

    const result = await authService.resendRegistrationOTP(email);
    res.status(200).json(successResponse(result.message));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to resend verification code'));
  }
};

// @desc    Verify login OTP
// @route   POST /api/auth/verify-login-otp
// @access  Public
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(errorResponse('Email and OTP are required'));
    }

    const result = await authService.verifyLoginOTP(email, otp);
    res.status(200).json(successResponse('Login successful', result));
  } catch (error) {
    console.error(error);
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to verify login'));
  }
};