import { BaseRepository } from '../../../repositories/baseRepository.js';
import User from '../models/userModel.js';

/**
 * User Repository
 * Handles all database operations for users
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Get search fields for this repository
   * @returns {Array<String>} - Array of field names to search in
   */
  getSearchFields() {
    return ['name', 'email', 'phone'];
  }

  /**
   * Find user by email
   * @param {String} email - User email
   * @param {Object} options - Options for selection
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email, options = {}) {
    return this.findOne({ email }, options);
  }

  /**
   * Find users by role
   * @param {String} role - User role (patient, doctor, admin)
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>}
   */
  async findByRole(role, options = {}) {
    return this.findAll({ role, isActive: true }, options);
  }

  /**
   * Get all doctors
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>}
   */
  async getDoctors(options = {}) {
    return this.findAll({ role: 'doctor', isActive: true }, options);
  }

  /**
   * Get all patients
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>}
   */
  async getPatients(options = {}) {
    return this.findAll({ role: 'patient', isActive: true }, options);
  }

  /**
   * Search users by name or email
   * @param {String} searchTerm - Search term
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async search(searchTerm, options = {}) {
    const query = {
      isActive: true,
      $or: [
        { name: new RegExp(searchTerm, 'i') },
        { email: new RegExp(searchTerm, 'i') }
      ]
    };

    return this.findAll(query, options);
  }

  /**
   * Find doctors by specialization
   * @param {String} specialization - Doctor specialization
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findDoctorsBySpecialization(specialization, options = {}) {
    const query = {
      role: 'doctor',
      specialization,
      isActive: true
    };

    return this.findAll(query, options);
  }
}
