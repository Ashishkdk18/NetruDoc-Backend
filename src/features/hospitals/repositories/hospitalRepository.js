import { BaseRepository } from '../../../repositories/baseRepository.js';
import Hospital from '../models/hospitalModel.js';

/**
 * Hospital Repository
 * Handles all database operations for hospitals
 */
export class HospitalRepository extends BaseRepository {
  constructor() {
    super(Hospital);
  }

  /**
   * Find hospitals with advanced filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>}
   */
  async findWithFilters(filters = {}, options = {}) {
    const {
      city,
      specialization,
      type,
      emergencyServices,
      search,
      isActive = true,
      isVerified
    } = filters;

    // Build query
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }

    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    if (specialization) {
      query.specializations = specialization;
    }

    if (type) {
      query.type = type;
    }

    if (emergencyServices === 'true' || emergencyServices === true) {
      query.emergencyServices = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Default select to exclude reviews for list view
    const selectOptions = {
      ...options,
      select: options.select || '-reviews'
    };

    return this.findAll(query, selectOptions);
  }

  /**
   * Find hospitals near a location (geospatial query)
   * @param {Number} longitude - Longitude coordinate
   * @param {Number} latitude - Latitude coordinate
   * @param {Number} maxDistance - Maximum distance in meters
   * @param {Number} limit - Maximum number of results
   * @returns {Promise<Array>}
   */
  async findNearby(longitude, latitude, maxDistance = 10000, limit = 20) {
    return this.model.find({
      isActive: true,
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).limit(parseInt(limit));
  }

  /**
   * Find hospital by slug
   * @param {String} slug - Hospital slug
   * @param {Object} options - Population and selection options
   * @returns {Promise<Object|null>}
   */
  async findBySlug(slug, options = {}) {
    return this.findOne({ slug }, options);
  }

  /**
   * Add review to hospital
   * @param {String} hospitalId - Hospital ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>}
   */
  async addReview(hospitalId, reviewData) {
    const hospital = await this.findById(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Check if user already reviewed
    const existingReview = hospital.reviews.find(
      review => review.userId.toString() === reviewData.userId.toString()
    );

    if (existingReview) {
      throw new Error('User has already reviewed this hospital');
    }

    hospital.reviews.push(reviewData);
    hospital.calculateRating();
    return hospital.save();
  }

  /**
   * Update hospital statistics
   * @param {String} hospitalId - Hospital ID
   * @param {Object} stats - Statistics to update
   * @returns {Promise<Object>}
   */
  async updateStats(hospitalId, stats) {
    return this.updateById(hospitalId, stats);
  }

  /**
   * Verify hospital
   * @param {String} hospitalId - Hospital ID
   * @param {String} verifiedBy - Admin user ID who verified
   * @returns {Promise<Object>}
   */
  async verify(hospitalId, verifiedBy) {
    return this.updateById(
      hospitalId,
      {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date()
      }
    );
  }

  /**
   * Get hospital statistics
   * @param {String} hospitalId - Hospital ID
   * @returns {Promise<Object>}
   */
  async getStats(hospitalId) {
    const hospital = await this.findById(hospitalId, {
      select: 'totalBeds availableBeds totalDoctors rating totalReviews'
    });

    if (!hospital) {
      throw new Error('Hospital not found');
    }

    return {
      totalBeds: hospital.totalBeds || 0,
      availableBeds: hospital.availableBeds || 0,
      totalDoctors: hospital.totalDoctors || 0,
      rating: hospital.rating,
      totalReviews: hospital.totalReviews,
      bedOccupancyRate: hospital.totalBeds
        ? parseFloat(((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds * 100).toFixed(2))
        : 0
    };
  }

  /**
   * Search hospitals by text
   * @param {String} searchTerm - Search term
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async search(searchTerm, options = {}) {
    const query = {
      isActive: true,
      $text: { $search: searchTerm }
    };

    return this.findAll(query, {
      ...options,
      select: options.select || '-reviews'
    });
  }
}
