import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: String,
  },
  weight: {
    value: Number,
    unit: String,
  },
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: String,
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    default: 'US',
  },
  validationData: mongoose.Schema.Types.Mixed,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: shippingAddressSchema,
    required: true,
  },
  billingAddress: {
    type: shippingAddressSchema,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  couponUsed: {
    code: String,
    discount: Number,
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially-refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    default: 'stripe',
  },
  paymentIntentId: {
    type: String,
  },
  stripeChargeId: {
    type: String,
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  shippingStatus: {
    type: String,
    enum: ['pending', 'label-created', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered', 'exception', 'returned', 'cancelled'],
    default: 'pending',
  },
   fedexShipment: {
    trackingNumber: String,
    masterId: String,
    labelUrl: String,           // Cloudinary secure URL
    labelPublicId: String,      // Cloudinary public ID for deletion
    labelStorage: { type: String, enum: ['cloudinary'], default: 'cloudinary' },
    serviceType: String,
    estimatedDelivery: Date,
    rateId: String,
  },
  trackingHistory: [{
    status: String,
    location: String,
    timestamp: Date,
    description: String,
  }],
  notes: {
    customer: String,
    admin: String,
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: String,
  }],
  emailsSent: [{
    type: {
      type: String,
      enum: ['confirmation', 'shipping', 'delivery', 'cancellation'],
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    success: Boolean,
  }],
  notificationCleared: {
    type: Boolean,
    default: false,
  },
  notificationClearedAt: {
    type: Date,
  },
  refundDetails: {
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundId: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'fedexShipment.trackingNumber': 1 });

// Generate order number
orderSchema.pre('validate', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const count = await mongoose.model('Order').countDocuments();
      const orderNum = String(count + 1).padStart(6, '0');
      
      this.orderNumber = `ORD${year}${month}${day}${orderNum}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      this.orderNumber = `ORD${Date.now()}`;
    }
  }
  next();
});

// Add status to history
orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus') && !this.isNew) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;