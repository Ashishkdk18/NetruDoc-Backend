import mongoose from 'mongoose';

const MESSAGE_CONTENT_TYPES = ['text', 'image', 'file', 'system'];
const MESSAGE_STATUSES = ['sent', 'delivered', 'read'];

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
    },
    contentType: {
      type: String,
      enum: MESSAGE_CONTENT_TYPES,
      default: 'text',
    },
    status: {
      type: String,
      enum: MESSAGE_STATUSES,
      default: 'sent',
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient history queries
messageSchema.index({ conversationId: 1, sentAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

