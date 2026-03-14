/**
 * Base Service Class
 * Provides common service methods for all services
 */
export class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Get all items with pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>}
   */
  async getAll(filters = {}, options = {}) {
    return this.repository.findAll(filters, options);
  }

  /**
   * Get item by ID
   * @param {String} id - Item ID
   * @param {Object} options - Population and selection options
   * @returns {Promise<Object>}
   */
  async getById(id, options = {}) {
    const item = await this.repository.findById(id, options);
    if (!item) {
      throw new Error('Resource not found');
    }
    return item;
  }

  /**
   * Create new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return this.repository.create(data);
  }

  /**
   * Update item by ID
   * @param {String} id - Item ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const item = await this.repository.updateById(id, data);
    if (!item) {
      throw new Error('Resource not found');
    }
    return item;
  }

  /**
   * Delete item by ID
   * @param {String} id - Item ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const item = await this.repository.deleteById(id);
    if (!item) {
      throw new Error('Resource not found');
    }
    return item;
  }

  /**
   * Check if item exists
   * @param {Object} query - Query criteria
   * @returns {Promise<Boolean>}
   */
  async exists(query) {
    return this.repository.exists(query);
  }

  /**
   * Count items matching query
   * @param {Object} query - Query criteria
   * @returns {Promise<Number>}
   */
  async count(query = {}) {
    return this.repository.count(query);
  }
}
