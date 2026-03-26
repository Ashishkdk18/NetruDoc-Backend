import { BaseRepository } from '../../../repositories/baseRepository.js';
import AuditLog from '../models/auditLogModel.js';

/**
 * Audit Repository
 * Handles database operations for audit logs
 */
export class AuditRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  /**
   * Searchable fields for audit logs when using generic search
   * Note: user details are populated from User collection
   */
  getSearchFields() {
    return ['action', 'entityType', 'ipAddress', 'userAgent'];
  }
}

export default AuditRepository;

