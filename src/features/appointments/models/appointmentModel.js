import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: [true, 'Appointment reason is required'],
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  preConsultationForm: {
    symptoms: {
      type: [String],
      validate: {
        validator: function(v) {
          return Array.isArray(v);
        },
        message: 'Symptoms must be an array'
      }
    },
    currentMedications: {
      type: [String],
      validate: {
        validator: function(v) {
          return Array.isArray(v);
        },
        message: 'Current medications must be an array'
      }
    },
    allergies: {
      type: [String],
      validate: {
        validator: function(v) {
          return Array.isArray(v);
        },
        message: 'Allergies must be an array'
      }
    },
    medicalHistory: {
      type: String,
      maxlength: [2000, 'Medical history cannot be more than 2000 characters']
    },
    additionalNotes: {
      type: String,
      maxlength: [1000, 'Additional notes cannot be more than 1000 characters']
    }
  },
  // Reschedule fields
  rescheduleRequestedAt: Date,
  rescheduleRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rescheduleReason: {
    type: String,
    maxlength: [500, 'Reschedule reason cannot be more than 500 characters']
  },
  rescheduleStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  rescheduleNewDate: Date,
  rescheduleNewTime: String,
  rescheduleApprovedAt: Date,
  rescheduleApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to validate pre-consultation form
appointmentSchema.pre('save', async function() {
  // Only validate on new documents (not updates)
  if (this.isNew) {
    if (!this.preConsultationForm) {
      throw new Error('Pre-consultation form is required');
    }

    // Validate that at least symptoms are provided
    if (!this.preConsultationForm.symptoms || this.preConsultationForm.symptoms.length === 0) {
      throw new Error('At least one symptom must be specified in the pre-consultation form');
    }
  }
});

// Indexes
appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, time: 1 });

// Compound index to prevent double booking
// Only one appointment per doctor per date/time slot with pending or confirmed status
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed'] }
    },
    name: 'double_booking_prevention'
  }
);

// Index for reschedule queries
appointmentSchema.index({ rescheduleStatus: 1, rescheduleRequestedAt: -1 });

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  const appointmentDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.time}`);
  return appointmentDateTime > new Date() && this.status !== 'cancelled' && this.status !== 'completed';
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
