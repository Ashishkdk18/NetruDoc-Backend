import { BaseService } from '../../../services/baseService.js';
import { HospitalRepository } from '../repositories/hospitalRepository.js';

/**
 * Hospital Service
 * Contains business logic for hospital operations
 */
export class HospitalService extends BaseService {
  constructor() {
    super(new HospitalRepository());
  }

  /**
   * Get all hospitals with filters
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getHospitals(filters = {}, pagination = {}) {
    const {
      city,
      specialization,
      type,
      emergencyServices,
      search,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = { ...filters, ...pagination };

    const filterCriteria = {
      city,
      specialization,
      type,
      emergencyServices,
      search,
      isActive: true
    };

    const options = {
      page,
      limit,
      sort
    };

    return this.repository.findWithFilters(filterCriteria, options);
  }

  /**
   * Get hospital by ID
   * @param {String} id - Hospital ID
   * @returns {Promise<Object>}
   */
  async getHospitalById(id) {
    return this.getById(id, {
      populate: [
        { path: 'reviews.userId', select: 'name email' },
        { path: 'verifiedBy', select: 'name email' }
      ]
    });
  }

  /**
   * Get hospital by slug
   * @param {String} slug - Hospital slug
   * @returns {Promise<Object>}
   */
  async getHospitalBySlug(slug) {
    const hospital = await this.repository.findBySlug(slug, {
      populate: [
        { path: 'reviews.userId', select: 'name email' },
        { path: 'verifiedBy', select: 'name email' }
      ]
    });

    if (!hospital) {
      throw new Error('Hospital not found');
    }

    return hospital;
  }

  /**
   * Create new hospital
   * @param {Object} hospitalData - Hospital data
   * @returns {Promise<Object>}
   */
  async createHospital(hospitalData) {
    // Check if hospital with same name already exists
    const exists = await this.repository.exists({ name: hospitalData.name });
    if (exists) {
      throw new Error('Hospital with this name already exists');
    }

    return this.create(hospitalData);
  }

  /**
   * Update hospital
   * @param {String} id - Hospital ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateHospital(id, updateData) {
    // If name is being updated, check for duplicates
    if (updateData.name) {
      const existingHospital = await this.repository.findOne({
        name: updateData.name,
        _id: { $ne: id }
      });

      if (existingHospital) {
        throw new Error('Hospital with this name already exists');
      }
    }

    return this.update(id, updateData);
  }

  /**
   * Delete hospital
   * @param {String} id - Hospital ID
   * @returns {Promise<Object>}
   */
  async deleteHospital(id) {
    return this.delete(id);
  }

  /**
   * Get nearby hospitals
   * @param {Number} latitude - Latitude coordinate
   * @param {Number} longitude - Longitude coordinate
   * @param {Number} maxDistance - Maximum distance in meters
   * @returns {Promise<Array>}
   */
  async getNearbyHospitals(latitude, longitude, maxDistance = 10000) {
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    return this.repository.findNearby(longitude, latitude, maxDistance);
  }

  /**
   * Add review to hospital
   * @param {String} hospitalId - Hospital ID
   * @param {String} userId - User ID
   * @param {Object} reviewData - Review data (rating, comment)
   * @returns {Promise<Object>}
   */
  async addReview(hospitalId, userId, reviewData) {
    const { rating, comment } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const reviewPayload = {
      userId,
      rating: parseInt(rating),
      comment: comment || ''
    };

    const hospital = await this.repository.addReview(hospitalId, reviewPayload);

    return hospital;
  }

  /**
   * Get hospital statistics
   * @param {String} hospitalId - Hospital ID
   * @returns {Promise<Object>}
   */
  async getHospitalStats(hospitalId) {
    return this.repository.getStats(hospitalId);
  }

  /**
   * Verify hospital
   * @param {String} hospitalId - Hospital ID
   * @param {String} adminId - Admin user ID
   * @returns {Promise<Object>}
   */
  async verifyHospital(hospitalId, adminId) {
    const hospital = await this.getById(hospitalId);

    if (hospital.isVerified) {
      throw new Error('Hospital is already verified');
    }

    return this.repository.verify(hospitalId, adminId);
  }

  /**
   * Search hospitals
   * @param {String} searchTerm - Search term
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async searchHospitals(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim() === '') {
      throw new Error('Search term is required');
    }

    return this.repository.search(searchTerm, options);
  }

  /**
   * Update hospital statistics (beds, doctors, etc.)
   * @param {String} hospitalId - Hospital ID
   * @param {Object} stats - Statistics to update
   * @returns {Promise<Object>}
   */
  async updateHospitalStats(hospitalId, stats) {
    const allowedStats = ['totalBeds', 'availableBeds', 'totalDoctors'];
    const updateData = {};

    allowedStats.forEach(key => {
      if (stats[key] !== undefined) {
        updateData[key] = stats[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid statistics provided');
    }

    return this.repository.updateStats(hospitalId, updateData);
  }
}
