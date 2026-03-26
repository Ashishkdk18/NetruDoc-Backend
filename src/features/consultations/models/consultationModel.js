import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required'],
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },
  diagnosis: [String],
  symptoms: [String],
  recordings: [{
    url: String,
    type: {
      type: String,
      enum: ['audio', 'video', 'screen']
    },
    duration: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'document', 'other']
    },
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Note: appointmentId index is automatically created by unique: true, no need for explicit index
consultationSchema.index({ patientId: 1, startTime: -1 });
consultationSchema.index({ doctorId: 1, startTime: -1 });
consultationSchema.index({ status: 1 });

// Virtual for duration
consultationSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return null;
  return Math.round((this.endTime - this.startTime) / 1000 / 60); // Duration in minutes
});

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
