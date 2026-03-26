import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getAuditLogs,
  getEntityAuditLogs,
  getUserAuditLogs,
  getAuditHealth
} from './controllers/auditController.js';

const router = express.Router();

// All audit routes are admin-only
router.use(protect, authorize('admin'));

router.get('/health', getAuditHealth);
router.get('/logs', getAuditLogs);
router.get('/entities/:entityType/:entityId', getEntityAuditLogs);
router.get('/users/:userId', getUserAuditLogs);

export default router;

