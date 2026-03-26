import jwt from 'jsonwebtoken';
import User from '../features/users/models/userModel.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route',
        data: {}
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'netrudoc_jwt_secret_key_2025');

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found',
          data: {}
        });
      }

      // Check if account is active (US8)
      if (!req.user.isActive) {
        return res.status(403).json({
          status: 'error',
          message: 'Your account has been deactivated. Please contact support.',
          data: {}
        });
      }

      next();
    } catch (error) {
      console.error('Authentication protect middleware internal error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Server error in authentication',
        data: {}
      });
    }
  } catch (error) {
    console.error('Authentication protect middleware outer error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error in authentication',
      data: {}
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route`,
        data: {}
      });
    }
    next();
  };
};

// Check if user owns resource or is admin
export const authorizeOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to access this resource',
      data: {}
    });
  }
};
