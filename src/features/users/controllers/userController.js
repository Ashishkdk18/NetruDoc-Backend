import { UserService } from '../services/userService.js';
import { AuditService } from '../../audit/services/auditService.js';
import { successResponse, errorResponse, paginatedSuccessResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';

const userService = new UserService();
const auditService = new AuditService();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async (req, res) => {
  try {
    const filters = {};
    if (req.query.search) filters.search = req.query.search;
    if (req.query.role) filters.role = req.query.role;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const result = await userService.getUsers(filters, {
      page: req.query.page || 1,
      limit: req.query.limit || 10
    });

    res.status(200).json(paginatedSuccessResponse(
      RESPONSE_MESSAGES.USERS_FETCHED,
      result.data || [],
      result.pagination || {}
    ));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch users'));
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.USER_FETCHED, { user }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch user'));
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.USER_UPDATED, { user }));

    // Admin user update audit
    try {
      if (req.user && req.user._id) {
        await auditService.logAction(
          'user',
          user._id || req.params.id,
          'update',
          req.user._id.toString(),
          req.user.role,
          req,
          { updatedFields: Object.keys(req.body || {}) }
        );
      }
    } catch (auditError) {
      console.error('Failed to log user update audit event:', auditError);
    }
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('User not found'));
    }
    if (error.message === 'User with this email already exists') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to update user'));
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.USER_DELETED));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.status(500).json(errorResponse('Failed to delete user'));
  }
};

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Public
export const getDoctors = async (req, res) => {
  try {
    const result = await userService.getDoctors({
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort,
      specialization: req.query.specialization,
      search: req.query.search,
      hospitalId: req.query.hospitalId,
      minExperience: req.query.minExperience,
      maxFee: req.query.maxFee,
      availabilityDate: req.query.availabilityDate
    });

    res.status(200).json(paginatedSuccessResponse(
      RESPONSE_MESSAGES.DOCTORS_FETCHED,
      result.data || [],
      result.pagination || {}
    ));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch doctors'));
  }
};

// @desc    Get all patients
// @route   GET /api/users/patients
// @access  Private (Admin only)
export const getPatients = async (req, res) => {
  try {
    const result = await userService.getPatients({
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search
    });

    res.status(200).json(paginatedSuccessResponse(
      RESPONSE_MESSAGES.PATIENTS_FETCHED,
      result.data || [],
      result.pagination || {}
    ));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch patients'));
  }
};

// @desc    Activate user account (US8)
// @route   PUT /api/users/:id/activate
// @access  Private (Admin only)
export const activateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, { isActive: true });

    res.status(200).json(successResponse('User account activated successfully', { user }));

    // Audit activation
    try {
      await auditService.logAction(
        'user',
        user._id || req.params.id,
        'update',
        req.user._id.toString(),
        req.user.role,
        req,
        { action: 'activate' }
      );
    } catch (auditError) {
      console.error('Failed to log user activate audit event:', auditError);
    }
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.status(500).json(errorResponse('Failed to activate user account'));
  }
};

// @desc    Deactivate user account (US8)
// @route   PUT /api/users/:id/deactivate
// @access  Private (Admin only)
export const deactivateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, { isActive: false });

    res.status(200).json(successResponse('User account deactivated successfully', { user }));

    // Audit deactivation
    try {
      await auditService.logAction(
        'user',
        user._id || req.params.id,
        'update',
        req.user._id.toString(),
        req.user.role,
        req,
        { action: 'deactivate' }
      );
    } catch (auditError) {
      console.error('Failed to log user deactivate audit event:', auditError);
    }
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.status(500).json(errorResponse('Failed to deactivate user account'));
  }
};

// @desc    Get doctor availability
// @route   GET /api/users/doctor/availability
// @access  Private (Doctor only)
export const getDoctorAvailability = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);

    if (user.role !== 'doctor') {
      return res.status(403).json(errorResponse('Only doctors can access availability settings'));
    }

    res.status(200).json(successResponse('Doctor availability fetched successfully', {
      availability: user.availability || {}
    }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch doctor availability'));
  }
};

// @desc    Update doctor availability
// @route   PUT /api/users/doctor/availability
// @access  Private (Doctor only)
export const updateDoctorAvailability = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);

    if (user.role !== 'doctor') {
      return res.status(403).json(errorResponse('Only doctors can update availability settings'));
    }

    const { availability } = req.body;

    // Validate availability structure
    if (!availability || typeof availability !== 'object') {
      return res.status(400).json(errorResponse('Availability must be an object'));
    }

    // Validate each day's structure
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      if (availability[day]) {
        const dayData = availability[day];
        if (typeof dayData.available !== 'boolean') {
          return res.status(400).json(errorResponse(`${day} availability must be a boolean`));
        }
        if (dayData.available) {
          if (!dayData.start || !dayData.end) {
            return res.status(400).json(errorResponse(`${day} start and end times are required when available`));
          }
          // Validate time format (HH:MM)
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(dayData.start) || !timeRegex.test(dayData.end)) {
            return res.status(400).json(errorResponse(`${day} times must be in HH:MM format`));
          }
          // Validate that end time is after start time
          const [startHour, startMinute] = dayData.start.split(':').map(Number);
          const [endHour, endMinute] = dayData.end.split(':').map(Number);
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          if (endMinutes <= startMinutes) {
            return res.status(400).json(errorResponse(`${day} end time must be after start time`));
          }
        }
      }
    }

    const updatedUser = await userService.updateUser(req.user._id, { availability });

    res.status(200).json(successResponse('Doctor availability updated successfully', {
      availability: updatedUser.availability
    }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found') {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.status(500).json(errorResponse('Failed to update doctor availability'));
  }
};