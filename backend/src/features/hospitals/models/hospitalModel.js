import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a hospital name'],
    trim: true,
    maxlength: [100, 'Hospital name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Please add street address']
    },
    city: {
      type: String,
      required: [true, 'Please add city']
    },
    state: {
      type: String,
      required: [true, 'Please add state']
    },
    zipCode: String,
    country: {
      type: String,
      default: 'Nepal'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Please add phone number']
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    website: String,
    emergencyContact: String
  },
  type: {
    type: String,
    enum: ['public', 'private', 'government', 'clinic', 'hospital'],
    default: 'hospital'
  },
  specializations: [{
    type: String,
    enum: [
      'general-medicine', 'cardiology', 'cardiac-surgery', 'dermatology', 'neurology',
      'orthopedics', 'pediatrics', 'psychiatry', 'radiology',
      'surgery', 'urology', 'gynecology', 'ophthalmology',
      'emergency', 'icu', 'oncology', 'dental'
    ]
  }],
  facilities: [{
    name: String,
    available: {
      type: Boolean,
      default: true
    }
  }],
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  emergencyServices: {
    type: Boolean,
    default: false
  },
  ambulanceService: {
    type: Boolean,
    default: false
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalBeds: Number,
  availableBeds: Number,
  totalDoctors: {
    type: Number,
    default: 0
  },
  // Status fields
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from name before saving
hospitalSchema.pre('save', function() {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Virtual for full address
hospitalSchema.virtual('fullAddress').get(function() {
  const { street, city, state, zipCode, country } = this.address;
  return `${street || ''}, ${city || ''}, ${state || ''} ${zipCode || ''}, ${country || ''}`.replace(/^, |, $/, '');
});

// Indexes
hospitalSchema.index({ name: 'text', description: 'text', 'address.city': 'text' });
hospitalSchema.index({ 'address.coordinates': '2dsphere' }); // Geospatial index
hospitalSchema.index({ type: 1 });
hospitalSchema.index({ specializations: 1 });
hospitalSchema.index({ isActive: 1, isVerified: 1 });
// Note: slug index is automatically created by unique: true, no need for explicit index

// Calculate average rating
hospitalSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.totalReviews = 0;
    return;
  }

  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = parseFloat((sum / this.reviews.length).toFixed(1));
  this.totalReviews = this.reviews.length;
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;
