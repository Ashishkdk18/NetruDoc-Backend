import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      maxlength: [500, 'Last message preview cannot exceed 500 characters'],
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient user conversation lookup and sorting
conversationSchema.index({ participants: 1, isArchived: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Helper to ensure participants are unique per conversation (for simple 1:1/limited group chats)
conversationSchema.statics.findByParticipants = function (participantIds) {
  const ids = participantIds.map((id) => id.toString());
  return this.findOne({
    participants: {
      $size: ids.length,
      $all: ids,
    },
  });
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

