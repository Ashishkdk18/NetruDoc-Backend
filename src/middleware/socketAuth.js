import jwt from 'jsonwebtoken';
import User from '../features/users/models/userModel.js';

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from handshake auth or query
 * Attaches user to socket instance
 */
const socketAuth = async (socket, next) => {
    try {
        // 1. Get token from handshake auth or query
        let token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(' ')[1] ||
            socket.handshake.query?.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // 2. Strip Bearer prefix if present (handle both formats)
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'netrudoc_jwt_secret_key_2025');

        if (!decoded || !decoded.id) {
            return next(new Error('Authentication error: Invalid token'));
        }

        // 4. Get user from database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        // 5. Attach user to socket
        socket.user = user;
        socket.userId = user._id.toString();

        // Also set socket.data.userId for consultation handlers that expect it
        socket.data.userId = socket.userId;

        next();
    } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Authentication error: ' + error.message));
    }
};

export default socketAuth;