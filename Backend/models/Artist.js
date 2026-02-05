import mongoose from 'mongoose';
import slugify from 'slugify';

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Artist name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Artist name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  biography: {
    type: String,
    maxlength: [2000, 'Biography cannot exceed 2000 characters'],
  },
  profileImage: {
    type: String,
  },
  birthYear: {
    type: Number,
    min: [1800, 'Birth year must be after 1800'],
    max: [new Date().getFullYear(), 'Birth year cannot be in the future'],
  },
  nationality: {
    type: String,
    trim: true,
  },
  artStyle: [{
    type: String,
    trim: true,
  }],
  awards: [{
    title: String,
    year: Number,
    description: String,
  }],
  exhibitions: [{
    title: String,
    location: String,
    year: Number,
    description: String,
  }],
  socialMedia: {
    website: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    facebook: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
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

// Virtual for products count
artistSchema.virtual('artworksCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'artist',
  count: true,
});

// Index for better performance
artistSchema.index({ slug: 1 });
artistSchema.index({ isActive: 1 });
artistSchema.index({ isFeatured: 1 });

// Generate slug before saving
artistSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;