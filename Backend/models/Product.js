import mongoose from 'mongoose';
import slugify from 'slugify';

const dimensionSchema = new mongoose.Schema({
  length: {
    type: Number,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: ['inches', 'cm'],
    default: 'inches',
  },
}, { _id: false });

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'Artist is required'],
  },
  productType: {
    type: String,
    enum: ['price-based', 'ask-for-price'],
    required: [true, 'Product type is required'],
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    required: function () {
      return this.productType === 'price-based';
    },
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative'],
  },
  images: [{
    url: {
      type: String,
      required: false,
    },
    public_id: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  dimensions: {
    artwork: dimensionSchema,
    frame: dimensionSchema,
  },
  weight: {
    value: {
      type: Number,
      required: [true, 'Weight is required for shipping'],
    },
    unit: {
      type: String,
      enum: ['lbs', 'kg'],
      default: 'lbs',
    },
  },
  medium: {
    type: String,
    trim: true,
  },
  yearCreated: {
    type: Number,
    min: [1800, 'Year must be after 1800'],
    max: [new Date().getFullYear(), 'Year cannot be in the future'],
  },
  isFramed: {
    type: Boolean,
    default: false,
  },
  isOriginal: {
    type: Boolean,
    default: true,
  },
  edition: {
    total: {
      type: Number,
    },
    available: {
      type: Number,
    },
  },
  stockQuantity: {
    type: Number,
    required: function () {
      return this.productType === 'price-based';
    },
    min: [0, 'Stock quantity cannot be negative'],
    default: 1,
  },
  lowStockThreshold: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters'],
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
  },
  metaKeywords: [{
    type: String,
  }],
  viewsCount: {
    type: Number,
    default: 0,
  },
  salesCount: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviewsCount: {
    type: Number,
    default: 0,
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

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function () {
  return this.stockQuantity <= this.lowStockThreshold;
});

// Virtual for in stock status
productSchema.virtual('inStock').get(function () {
  return this.stockQuantity > 0;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.compareAtPrice && this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Index for better performance
productSchema.index({ slug: 1 });
productSchema.index({ artist: 1, isActive: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Generate slug before saving
productSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

// Ensure only one primary image
productSchema.pre('save', function (next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;