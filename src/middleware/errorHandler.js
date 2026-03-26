import winston from 'winston';
import { errorResponse } from '../utils/response.js';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  let statusCode = 500;
  let message = 'Internal server error';
  let data = {};

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
    data = { field: err.path, value: err.value };
  }

  // Mongoose duplicate key
  else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    const field = Object.keys(err.keyValue)[0];
    data = { field, value: err.keyValue[field] };
  }

  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    data = {
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    };
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Default error
  else {
    message = err.message || message;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    data.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse(message, data));
};

export default errorHandler;
