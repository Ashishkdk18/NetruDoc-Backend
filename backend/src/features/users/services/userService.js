import { BaseService } from '../../../services/baseService.js';
import { UserRepository } from '../repositories/userRepository.js';

/**
 * User Service
 * Contains business logic for user operations
 */
export class UserService extends BaseService {
  constructor() {
    super(new UserRepository());
  }

  /**
   * Get all users
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getUsers(filters = {}, pagination = {}) {
    const { search, ...queryFilters } = filters;

    const options = {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      sort: pagination.sort || '-createdAt',
      search: search
    };

    return this.repository.findAll(queryFilters, options);
  }

  /**
   * Get user by ID
   * @param {String} id - User ID
   * @returns {Promise<Object>}
   */
  async getUserById(id) {
    return this.getById(id);
  }

  /**
   * Get user by email
   * @param {String} email - User email
   * @param {Boolean} includePassword - Include password field
   * @returns {Promise<Object>}
   */
  async getUserByEmail(email, includePassword = false) {
    const options = {
      select: includePassword ? '+password' : ''
    };

    const user = await this.repository.findByEmail(email, options);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get all doctors with advanced filters
   * @param {Object} filtersAndPagination - Filter + pagination options
   * @returns {Promise<Object>}
   */
  async getDoctors(filtersAndPagination = {}) {
    const {
      search,
      specialization,
      hospitalId,
      minExperience,
      maxFee,
      availabilityDate,
      ...paginationOptions
    } = filtersAndPagination;

    const query = { role: 'doctor', isActive: true };

    if (specialization) {
      query.specialization = specialization;
    }

    if (hospitalId) {
      query.hospital = hospitalId;
    }

    if (minExperience !== undefined) {
      const min = Number(minExperience);
      if (!Number.isNaN(min)) {
        query.experience = { ...(query.experience || {}), $gte: min };
      }
    }

    if (maxFee !== undefined) {
      const max = Number(maxFee);
      if (!Number.isNaN(max)) {
        query.consultationFee = { ...(query.consultationFee || {}), $lte: max };
      }
    }

    if (availabilityDate) {
      const date = new Date(availabilityDate);
      if (!Number.isNaN(date.getTime())) {
        const dayIndex = date.getDay(); // 0 (Sun) - 6 (Sat)
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayMap[dayIndex];
        if (dayKey) {
          query[`availability.${dayKey}.available`] = true;
        }
      }
    }

    const options = {
      page: paginationOptions.page || 1,
      limit: paginationOptions.limit || 10,
      sort: paginationOptions.sort || '-rating',
      search,
      populate: [{ path: 'hospital', select: 'name address.city' }]
    };

    return this.repository.findAll(query, options);
  }

  /**
   * Get all patients
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>}
   */
  async getPatients(pagination = {}) {
    const { search, ...paginationOptions } = pagination;

    const query = { role: 'patient', isActive: true };

    const options = {
      page: paginationOptions.page || 1,
      limit: paginationOptions.limit || 10,
      sort: paginationOptions.sort || '-createdAt',
      search: search
    };

    return this.repository.findAll(query, options);
  }

  /**
   * Create user
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
    // Check if user with email already exists
    const exists = await this.repository.exists({ email: userData.email });
    if (exists) {
      throw new Error('User with this email already exists');
    }

    // Explicitly delete hospital if it is undefined to prevent mongoose validation errors
    if (userData.hospital === undefined) {
        delete userData.hospital;
    }

    return this.create(userData);
  }

  /**
   * Update user
   * @param {String} id - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>}
   */
  async updateUser(id, updateData) {
    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingUser = await this.repository.findOne({
        email: updateData.email,
        _id: { $ne: id }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    return this.update(id, updateData);
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   * @param {String} id - User ID
   * @returns {Promise<Object>}
   */
  async deleteUser(id) {
    return this.update(id, { isActive: false });
  }

  /**
   * Search users
   * @param {String} searchTerm - Search term
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async searchUsers(searchTerm, options = {}) {
    return this.repository.search(searchTerm, options);
  }

  /**
   * Find doctors by specialization
   * @param {String} specialization - Specialization
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async getDoctorsBySpecialization(specialization, options = {}) {
    return this.repository.findDoctorsBySpecialization(specialization, options);
  }
}
