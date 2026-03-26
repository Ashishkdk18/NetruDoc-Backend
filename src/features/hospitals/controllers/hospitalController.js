import { HospitalService } from '../services/hospitalService.js';
import { successResponse, errorResponse, paginatedSuccessResponse, RESPONSE_MESSAGES } from '../../../utils/response.js';

const hospitalService = new HospitalService();

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
export const getHospitals = async (req, res) => {
  try {
    const filters = {
      city: req.query.city,
      specialization: req.query.specialization,
      type: req.query.type,
      emergencyServices: req.query.emergencyServices,
      search: req.query.search
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort || '-createdAt'
    };

    const result = await hospitalService.getHospitals(filters, pagination);

    res.status(200).json(paginatedSuccessResponse(
      RESPONSE_MESSAGES.HOSPITALS_FETCHED,
      result.data || [],
      result.pagination || {}
    ));
  } catch (error) {
    console.error(error);
    res.status(500).json(errorResponse('Failed to fetch hospitals'));
  }
};

// @desc    Get hospital by ID
// @route   GET /api/hospitals/:id
// @access  Public
export const getHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.HOSPITAL_FETCHED, { hospital }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found' || error.message === 'Hospital not found') {
      return res.status(404).json(errorResponse('Hospital not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch hospital'));
  }
};

// @desc    Get hospital by slug
// @route   GET /api/hospitals/slug/:slug
// @access  Public
export const getHospitalBySlug = async (req, res) => {
  try {
    const hospital = await hospitalService.getHospitalBySlug(req.params.slug);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.HOSPITAL_FETCHED, { hospital }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Hospital not found') {
      return res.status(404).json(errorResponse('Hospital not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch hospital'));
  }
};

// @desc    Create hospital
// @route   POST /api/hospitals
// @access  Private (Admin only)
export const createHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.createHospital(req.body);

    res.status(201).json(successResponse(RESPONSE_MESSAGES.HOSPITAL_CREATED, { hospital }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Hospital with this name already exists') {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse('Validation failed', { errors: error.errors }));
    }
    res.status(500).json(errorResponse('Failed to create hospital'));
  }
};

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private (Admin only)
export const updateHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.updateHospital(req.params.id, req.body);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.HOSPITAL_UPDATED, { hospital }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found' || error.message === 'Hospital not found') {
      return res.status(404).json(errorResponse('Hospital not found'));
    }
    if (error.message === 'Hospital with this name already exists') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to update hospital'));
  }
};

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private (Admin only)
export const deleteHospital = async (req, res) => {
  try {
    await hospitalService.deleteHospital(req.params.id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.HOSPITAL_DELETED));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found' || error.message === 'Hospital not found') {
      return res.status(404).json(errorResponse('Hospital not found'));
    }
    res.status(500).json(errorResponse('Failed to delete hospital'));
  }
};

// @desc    Get hospitals near location
// @route   GET /api/hospitals/nearby
// @access  Public
export const getNearbyHospitals = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query;

    const hospitals = await hospitalService.getNearbyHospitals(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(maxDistance)
    );

    res.status(200).json(successResponse(RESPONSE_MESSAGES.NEARBY_HOSPITALS_FETCHED, { hospitals }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Latitude and longitude are required') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to fetch nearby hospitals'));
  }
};

// @desc    Add review to hospital
// @route   POST /api/hospitals/:id/reviews
// @access  Private
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const hospital = await hospitalService.addReview(
      req.params.id,
      req.user._id,
      { rating, comment }
    );

    res.status(201).json(successResponse(RESPONSE_MESSAGES.REVIEW_ADDED, { hospital }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Hospital not found') {
      return res.status(404).json(errorResponse('Hospital not found'));
    }
    if (error.message === 'User has already reviewed this hospital') {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message === 'Rating must be between 1 and 5') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to add review'));
  }
};

// @desc    Get hospital statistics
// @route   GET /api/hospitals/:id/stats
// @access  Public
export const getHospitalStats = async (req, res) => {
  try {
    const stats = await hospitalService.getHospitalStats(req.params.id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.HOSPITAL_STATS_FETCHED, { stats }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Hospital not found') {
      return res.status(404).json(errorResponse('Hospital not found'));
    }
    res.status(500).json(errorResponse('Failed to fetch hospital statistics'));
  }
};

// @desc    Verify hospital
// @route   PUT /api/hospitals/:id/verify
// @access  Private (Admin only)
export const verifyHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.verifyHospital(req.params.id, req.user._id);

    res.status(200).json(successResponse(RESPONSE_MESSAGES.HOSPITAL_VERIFIED, { hospital }));
  } catch (error) {
    console.error(error);
    if (error.message === 'Resource not found' || error.message === 'Hospital not found') {
      return res.status(404).json(errorResponse('Hospital not found'));
    }
    if (error.message === 'Hospital is already verified') {
      return res.status(400).json(errorResponse(error.message));
    }
    res.status(500).json(errorResponse('Failed to verify hospital'));
  }
};