// models/Wishlist.js
import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Index for better performance
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'items.product': 1 });

// Virtual for items count
wishlistSchema.virtual('itemsCount').get(function() {
  return this.items.length;
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;