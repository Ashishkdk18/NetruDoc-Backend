import { BaseRepository } from '../../../repositories/baseRepository.js';
import User from '../../users/models/userModel.js';

/**
 * Auth Repository
 * Handles authentication-related database operations
 */
export class AuthRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email with password
   * @param {String} email - User email
   * @returns {Promise<Object|null>}
   */
  async findByEmailWithPassword(email) {
    return this.findOne({ email }, { select: '+password' });
  }

  /**
   * Update user last login
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async updateLastLogin(userId) {
    return this.updateById(userId, { lastLogin: new Date() });
  }

  /**
   * Check if email exists
   * @param {String} email - User email
   * @returns {Promise<Boolean>}
   */
  async emailExists(email) {
    return this.exists({ email });
  }
}
