import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [50, 'Coupon code cannot exceed 50 characters'],
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: [true, 'Discount type is required'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase cannot be negative'],
  },
  maximumDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  usageLimit: {
    type: Number,
    min: [0, 'Usage limit cannot be negative'],
  },
  usagePerUser: {
    type: Number,
    default: 1,
    min: [1, 'Usage per user must be at least 1'],
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    orderNumber: String,
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for checking if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual for checking if coupon is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.expiryDate >= now &&
         (!this.usageLimit || this.usedCount < this.usageLimit);
});

// Index for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 });

// Validate expiry date is after start date
couponSchema.pre('save', function(next) {
  if (this.expiryDate <= this.startDate) {
    next(new Error('Expiry date must be after start date'));
  }
  next();
});

// Validate discount value for percentage type
couponSchema.pre('save', function(next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Percentage discount cannot exceed 100%'));
  }
  next();
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;