import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  inquiryNumber: {
    type: String,
    unique: true,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customerInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  status: {
    type: String,
    enum: ['new', 'reviewing', 'quoted', 'responded', 'converted', 'closed', 'spam'],
    default: 'new',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  quotedPrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
  },
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: Date,
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  emailsSent: [{
    type: {
      type: String,
      enum: ['confirmation', 'response', 'follow-up'],
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    success: Boolean,
  }],
  convertedToOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for better performance
inquirySchema.index({ inquiryNumber: 1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ 'customerInfo.email': 1 });
inquirySchema.index({ product: 1 });

// Generate inquiry number
inquirySchema.pre('validate', async function(next) {
  if (this.isNew && !this.inquiryNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const count = await mongoose.model('Inquiry').countDocuments();
    const inquiryNum = String(count + 1).padStart(6, '0');
    
    this.inquiryNumber = `INQ${year}${month}${inquiryNum}`;
  }
  next();
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;