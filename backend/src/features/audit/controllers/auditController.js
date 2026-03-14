import { AuditService } from '../services/auditService.js';
import { paginatedSuccessResponse, successResponse, errorResponse } from '../../../utils/response.js';

const auditService = new AuditService();

// @desc    Get audit logs with filters
// @route   GET /api/audit/logs
// @access  Private (Admin only)
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-timestamp',
      entityType,
      userId,
      action,
      search,
      startDate,
      endDate
    } = req.query;

    const filters = {};

    if (entityType) {
      filters.entityType = entityType;
    }
    if (userId) {
      filters.userId = userId;
    }
    if (action) {
      filters.action = action;
    }
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) {
        filters.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filters.timestamp.$lte = new Date(endDate);
      }
    }

    const result = await auditService.repository.findAll(filters, {
      page,
      limit,
      sort,
      search,
      populate: [{ path: 'userId', select: 'name email role' }]
    });

    res.status(200).json(
      paginatedSuccessResponse(
        'Audit logs fetched successfully',
        result.data || [],
        result.pagination || {}
      )
    );
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json(errorResponse('Failed to fetch audit logs'));
  }
};

// @desc    Get audit logs for specific entity
// @route   GET /api/audit/entities/:entityType/:entityId
// @access  Private (Admin only)
export const getEntityAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50, sort = '-timestamp' } = req.query;

    const result = await auditService.getEntityAuditLogs(entityType, entityId, {
      page,
      limit,
      sort
    });

    res.status(200).json(
      paginatedSuccessResponse(
        'Entity audit logs fetched successfully',
        result.data || [],
        result.pagination || {}
      )
    );
  } catch (error) {
    console.error('Failed to fetch entity audit logs:', error);
    res.status(500).json(errorResponse('Failed to fetch entity audit logs'));
  }
};

// @desc    Get audit logs for specific user
// @route   GET /api/audit/users/:userId
// @access  Private (Admin only)
export const getUserAuditLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, sort = '-timestamp' } = req.query;

    const result = await auditService.getUserAuditLogs(userId, {
      page,
      limit,
      sort
    });

    res.status(200).json(
      paginatedSuccessResponse(
        'User audit logs fetched successfully',
        result.data || [],
        result.pagination || {}
      )
    );
  } catch (error) {
    console.error('Failed to fetch user audit logs:', error);
    res.status(500).json(errorResponse('Failed to fetch user audit logs'));
  }
};

// Simple health endpoint for audit feature (optional)
// @route   GET /api/audit/health
// @access  Private (Admin only)
export const getAuditHealth = async (req, res) => {
  try {
    const count = await auditService.count({});
    res.status(200).json(successResponse('Audit service is healthy', { count }));
  } catch (error) {
    console.error('Audit health check failed:', error);
    res.status(500).json(errorResponse('Audit service health check failed'));
  }
};

