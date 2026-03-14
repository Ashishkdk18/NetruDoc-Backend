/**
 * Base Repository Class
 * Provides common CRUD operations for all repositories
 */
export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all documents with optional query, pagination, and sorting
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Options for pagination, sorting, population, and search
   * @returns {Promise<Object>} - Object containing data and pagination info
   */
  async findAll(query = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      select = '',
      populate = [],
      skip = null,
      search = null
    } = options;

    let finalQuery = { ...query };

    // Apply search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchFields = this.getSearchFields ? this.getSearchFields() : ['name', 'email'];

      finalQuery = {
        ...finalQuery,
        $or: searchFields.map(field => ({ [field]: searchRegex }))
      };
    }

    const queryBuilder = this.model.find(finalQuery);

    // Apply select fields
    if (select) {
      queryBuilder.select(select);
    }

    // Apply population
    if (populate.length > 0) {
      populate.forEach(pop => {
        if (typeof pop === 'string') {
          queryBuilder.populate(pop);
        } else {
          // Handle populate with options object or simple path/select
          if (pop.path) {
            const populateOptions = {
              path: pop.path,
              select: pop.select || ''
            };
            queryBuilder.populate(populateOptions);
          } else {
            queryBuilder.populate(pop);
          }
        }
      });
    }

    // Apply sorting
    queryBuilder.sort(sort);

    // Apply pagination
    const calculatedSkip = skip !== null ? skip : (parseInt(page) - 1) * parseInt(limit);
    queryBuilder.skip(calculatedSkip).limit(parseInt(limit));

    const [data, total] = await Promise.all([
      queryBuilder.exec(),
      this.model.countDocuments(finalQuery)
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Find a single document by ID
   * @param {String} id - Document ID
   * @param {Object} options - Options for population and selection
   * @returns {Promise<Object|null>}
   */
  async findById(id, options = {}) {
    const { populate = [], select = '' } = options;
    const query = this.model.findById(id);

    if (select) {
      query.select(select);
    }

    if (populate.length > 0) {
      populate.forEach(pop => {
        if (typeof pop === 'string') {
          query.populate(pop);
        } else {
          query.populate(pop.path, pop.select);
        }
      });
    }

    return query.exec();
  }

  /**
   * Find a single document by query
   * @param {Object} query - MongoDB query object
   * @param {Object} options - Options for population and selection
   * @returns {Promise<Object|null>}
   */
  async findOne(query, options = {}) {
    const { populate = [], select = '' } = options;
    const queryBuilder = this.model.findOne(query);

    if (select) {
      queryBuilder.select(select);
    }

    if (populate.length > 0) {
      populate.forEach(pop => {
        if (typeof pop === 'string') {
          queryBuilder.populate(pop);
        } else {
          queryBuilder.populate(pop.path, pop.select);
        }
      });
    }

    return queryBuilder.exec();
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return this.model.create(data);
  }

  /**
   * Update a document by ID
   * @param {String} id - Document ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>}
   */
  async updateById(id, data, options = {}) {
    const { new: returnNew = true, runValidators = true } = options;
    return this.model.findByIdAndUpdate(
      id,
      data,
      {
        new: returnNew,
        runValidators
      }
    );
  }

  /**
   * Update a document by query
   * @param {Object} query - MongoDB query object
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>}
   */
  async updateOne(query, data, options = {}) {
    const { new: returnNew = true, runValidators = true } = options;
    return this.model.findOneAndUpdate(
      query,
      data,
      {
        new: returnNew,
        runValidators
      }
    );
  }

  /**
   * Delete a document by ID
   * @param {String} id - Document ID
   * @returns {Promise<Object|null>}
   */
  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  /**
   * Delete documents by query
   * @param {Object} query - MongoDB query object
   * @returns {Promise<Object>}
   */
  async deleteMany(query) {
    return this.model.deleteMany(query);
  }

  /**
   * Count documents matching query
   * @param {Object} query - MongoDB query object
   * @returns {Promise<Number>}
   */
  async count(query = {}) {
    return this.model.countDocuments(query);
  }

  /**
   * Check if document exists
   * @param {Object} query - MongoDB query object
   * @returns {Promise<Boolean>}
   */
  async exists(query) {
    const count = await this.model.countDocuments(query);
    return count > 0;
  }
}
