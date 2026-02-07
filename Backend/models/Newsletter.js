import mongoose from 'mongoose';
import validator from 'validator';

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed', 'bounced', 'complained'],
    default: 'subscribed',
  },
  source: {
    type: String,
    enum: ['website', 'checkout', 'admin', 'import', 'bulk_import'],
    default: 'website',
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  unsubscribedAt: Date,
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  preferences: {
    productUpdates: {
      type: Boolean,
      default: true,
    },
    promotions: {
      type: Boolean,
      default: true,
    },
    artistNews: {
      type: Boolean,
      default: true,
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  campaignsReceived: [{
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    sentAt: Date,
    opened: Boolean,
    clicked: Boolean,
  }],
  notificationCleared: {
    type: Boolean,
    default: false,
  },
  notificationClearedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for better performance
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ status: 1 });

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
  },
  fromName: {
    type: String,
    default: process.env.SENDGRID_FROM_NAME,
  },
  fromEmail: {
    type: String,
    default: process.env.SENDGRID_FROM_EMAIL,
  },
  content: {
    html: {
      type: String,
      required: [true, 'Email content is required'],
    },
    text: String,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft',
  },
  scheduledAt: Date,
  sentAt: Date,
  recipients: {
    type: String,
    enum: ['all', 'subscribed', 'tags', 'custom'],
    default: 'subscribed',
  },
  recipientTags: [{
    type: String,
  }],
  recipientEmails: [{
    type: String,
  }],
  stats: {
    totalSent: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: Number,
      default: 0,
    },
    opened: {
      type: Number,
      default: 0,
    },
    clicked: {
      type: Number,
      default: 0,
    },
    bounced: {
      type: Number,
      default: 0,
    },
    unsubscribed: {
      type: Number,
      default: 0,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for better performance
campaignSchema.index({ status: 1, scheduledAt: 1 });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);

export { Subscriber, Campaign };