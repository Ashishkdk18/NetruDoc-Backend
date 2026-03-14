// Generic response utility for standardized API responses
export const createResponse = (status, message, data = null) => {
  return {
    status,
    message,
    data: data || {}
  }
}

// Success responses
export const successResponse = (message, data = null) => {
  return createResponse('success', message, data)
}

// Error responses
export const errorResponse = (message, data = null) => {
  return createResponse('error', message, data)
}

// Warning responses
export const warningResponse = (message, data = null) => {
  return createResponse('warning', message, data)
}

// Info responses
export const infoResponse = (message, data = null) => {
  return createResponse('info', message, data)
}

// Common response messages
export const RESPONSE_MESSAGES = {
  // Auth messages
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Account created successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',

  // User messages
  USERS_FETCHED: 'Users fetched successfully',
  USER_FETCHED: 'User fetched successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  DOCTORS_FETCHED: 'Doctors fetched successfully',

  // Appointment messages
  APPOINTMENT_CREATED: 'Appointment booked successfully',
  APPOINTMENT_UPDATED: 'Appointment updated successfully',
  APPOINTMENT_CANCELLED: 'Appointment cancelled successfully',
  APPOINTMENT_CONFIRMED: 'Appointment confirmed successfully',
  APPOINTMENTS_FETCHED: 'Appointments fetched successfully',
  APPOINTMENT_FETCHED: 'Appointment fetched successfully',
  SLOTS_FETCHED: 'Available slots fetched successfully',

  // Consultation messages
  CONSULTATION_STARTED: 'Consultation started successfully',
  CONSULTATION_ENDED: 'Consultation ended successfully',
  CONSULTATION_NOTES_UPDATED: 'Consultation notes updated successfully',
  CONSULTATIONS_FETCHED: 'Consultations fetched successfully',
  CONSULTATION_FETCHED: 'Consultation fetched successfully',

  // Prescription messages
  PRESCRIPTION_CREATED: 'Prescription created successfully',
  PRESCRIPTION_UPDATED: 'Prescription updated successfully',
  PRESCRIPTION_DELETED: 'Prescription deleted successfully',
  PRESCRIPTIONS_FETCHED: 'Prescriptions fetched successfully',
  PRESCRIPTION_FETCHED: 'Prescription fetched successfully',
  PRESCRIPTION_DOWNLOADED: 'Prescription downloaded successfully',

  // Payment messages
  PAYMENT_INTENT_CREATED: 'Payment intent created successfully',
  PAYMENT_CONFIRMED: 'Payment confirmed successfully',
  PAYMENT_HISTORY_FETCHED: 'Payment history fetched successfully',
  PAYMENT_FETCHED: 'Payment fetched successfully',
  PAYMENT_REFUNDED: 'Payment refunded successfully',

  // Notification messages
  NOTIFICATIONS_FETCHED: 'Notifications fetched successfully',
  NOTIFICATION_MARKED_READ: 'Notification marked as read',
  NOTIFICATIONS_MARKED_READ: 'All notifications marked as read',
  NOTIFICATION_DELETED: 'Notification deleted successfully',
  NOTIFICATION_CREATED: 'Notification created successfully',

  // Hospital messages
  HOSPITALS_FETCHED: 'Hospitals fetched successfully',
  HOSPITAL_FETCHED: 'Hospital fetched successfully',
  HOSPITAL_CREATED: 'Hospital created successfully',
  HOSPITAL_UPDATED: 'Hospital updated successfully',
  HOSPITAL_DELETED: 'Hospital deleted successfully',
  HOSPITAL_VERIFIED: 'Hospital verified successfully',
  NEARBY_HOSPITALS_FETCHED: 'Nearby hospitals fetched successfully',
  REVIEW_ADDED: 'Review added successfully',
  HOSPITAL_STATS_FETCHED: 'Hospital statistics fetched successfully',

  // Error messages
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',

  // Health check
  HEALTH_CHECK: 'NetruDoc API is running',

  // Patient messages
  PATIENTS_FETCHED: 'Patients fetched successfully'
}

/**
 * Create a paginated response
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Paginated response object
 */
export const createPaginatedResponse = (data, pagination) => {
  return {
    items: data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: pagination.pages || Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasNextPage: (pagination.page || 1) < (pagination.pages || 1),
      hasPrevPage: (pagination.page || 1) > 1
    }
  }
}

/**
 * Create a success response with paginated data
 * @param {String} message - Success message
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Success response with paginated data
 */
export const paginatedSuccessResponse = (message, data, pagination) => {
  return successResponse(message, createPaginatedResponse(data, pagination))
}
