import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['prescription', 'consultation', 'appointment', 'user', 'other']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['create', 'view', 'update', 'delete', 'download']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  userRole: {
    type: String,
    required: [true, 'User role is required'],
    enum: ['patient', 'doctor', 'admin']
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We use custom timestamp field
});

// Compound indexes for efficient queries
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
