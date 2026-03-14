import mongoose from 'mongoose';

/**
 * Database Migration Helper
 * Provides utilities for safe database migrations with rollback capabilities
 */
export class MigrationHelper {
  constructor() {
    this.backupData = new Map();
    this.migrationSteps = [];
  }

  /**
   * Execute a migration step with automatic rollback on failure
   * @param {String} stepName - Name of the migration step
   * @param {Function} migrationFunction - Async function to execute
   * @param {Function} rollbackFunction - Async function to rollback changes
   */
  async executeStep(stepName, migrationFunction, rollbackFunction = null) {
    try {
      console.log(`▶️  Executing: ${stepName}`);
      await migrationFunction();
      this.migrationSteps.push({ name: stepName, rollback: rollbackFunction });
      console.log(`✅ Completed: ${stepName}`);
    } catch (error) {
      console.log(`❌ Failed: ${stepName} - ${error.message}`);

      // Attempt rollback
      if (rollbackFunction) {
        try {
          console.log(`🔄 Rolling back: ${stepName}`);
          await rollbackFunction();
          console.log(`✅ Rollback completed: ${stepName}`);
        } catch (rollbackError) {
          console.log(`❌ Rollback failed: ${stepName} - ${rollbackError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Backup a collection before migration
   * @param {String} collectionName - Name of collection to backup
   * @param {Object} query - Query to filter documents (optional)
   */
  async backupCollection(collectionName, query = {}) {
    try {
      const collection = mongoose.connection.db.collection(collectionName);
      const documents = await collection.find(query).toArray();

      this.backupData.set(collectionName, documents);
      console.log(`💾 Backed up ${documents.length} documents from ${collectionName}`);

      return documents;
    } catch (error) {
      console.log(`⚠️  Failed to backup ${collectionName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore a collection from backup
   * @param {String} collectionName - Name of collection to restore
   */
  async restoreCollection(collectionName) {
    try {
      if (!this.backupData.has(collectionName)) {
        console.log(`⚠️  No backup found for ${collectionName}`);
        return;
      }

      const collection = mongoose.connection.db.collection(collectionName);
      const backupData = this.backupData.get(collectionName);

      // Clear collection
      await collection.deleteMany({});

      // Restore data
      if (backupData.length > 0) {
        await collection.insertMany(backupData);
      }

      console.log(`🔄 Restored ${backupData.length} documents to ${collectionName}`);
    } catch (error) {
      console.log(`❌ Failed to restore ${collectionName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create index with error handling
   * @param {String} collectionName - Collection name
   * @param {Object} indexSpec - Index specification
   * @param {Object} options - Index options
   */
  async createIndex(collectionName, indexSpec, options = {}) {
    try {
      const collection = mongoose.connection.db.collection(collectionName);

      // Check if index already exists
      const indexes = await collection.listIndexes().toArray();
      const indexName = options.name || Object.keys(indexSpec).join('_');

      const existingIndex = indexes.find(idx => idx.name === indexName);

      if (existingIndex) {
        console.log(`ℹ️  Index '${indexName}' already exists on ${collectionName}`);
        return;
      }

      await collection.createIndex(indexSpec, options);
      console.log(`✅ Created index '${indexName}' on ${collectionName}`);
    } catch (error) {
      if (error.code === 85) { // Index already exists
        console.log(`ℹ️  Index already exists on ${collectionName}`);
      } else {
        console.log(`❌ Failed to create index on ${collectionName}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Drop index safely
   * @param {String} collectionName - Collection name
   * @param {String} indexName - Index name
   */
  async dropIndex(collectionName, indexName) {
    try {
      const collection = mongoose.connection.db.collection(collectionName);
      await collection.dropIndex(indexName);
      console.log(`🗑️  Dropped index '${indexName}' from ${collectionName}`);
    } catch (error) {
      if (error.code === 27) { // Index not found
        console.log(`ℹ️  Index '${indexName}' not found on ${collectionName}`);
      } else {
        console.log(`❌ Failed to drop index '${indexName}' from ${collectionName}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Validate collection structure
   * @param {String} collectionName - Collection name
   * @param {Array} requiredFields - Array of required field names
   */
  async validateCollection(collectionName, requiredFields = []) {
    try {
      const collection = mongoose.connection.db.collection(collectionName);
      const sampleDoc = await collection.findOne({});

      if (!sampleDoc) {
        console.log(`ℹ️  Collection ${collectionName} is empty`);
        return true;
      }

      let isValid = true;
      for (const field of requiredFields) {
        if (!(field in sampleDoc)) {
          console.log(`⚠️  Missing field '${field}' in ${collectionName}`);
          isValid = false;
        }
      }

      if (isValid) {
        console.log(`✅ Collection ${collectionName} structure is valid`);
      }

      return isValid;
    } catch (error) {
      console.log(`❌ Failed to validate ${collectionName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get migration summary
   */
  getSummary() {
    return {
      stepsExecuted: this.migrationSteps.length,
      backedUpCollections: Array.from(this.backupData.keys()),
      steps: this.migrationSteps.map(step => step.name)
    };
  }

  /**
   * Rollback all executed steps
   */
  async rollbackAll() {
    console.log('\n🔄 Starting rollback of all migration steps...');

    // Rollback in reverse order
    for (let i = this.migrationSteps.length - 1; i >= 0; i--) {
      const step = this.migrationSteps[i];
      if (step.rollback) {
        try {
          await step.rollback();
          console.log(`✅ Rolled back: ${step.name}`);
        } catch (error) {
          console.log(`❌ Failed to rollback: ${step.name} - ${error.message}`);
        }
      }
    }

    // Restore backed up collections
    for (const collectionName of this.backupData.keys()) {
      try {
        await this.restoreCollection(collectionName);
      } catch (error) {
        console.log(`❌ Failed to restore collection ${collectionName}: ${error.message}`);
      }
    }

    console.log('🔄 Rollback completed');
  }
}

export default MigrationHelper;