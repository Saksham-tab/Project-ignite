import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, required: true },
    image: { type: String, required: true }
  }],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['razorpay', 'stripe', 'cod'],
      required: true
    },
    paymentId: String,
    orderId: String,
    signature: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  cancellationReason: { type: String },
  trackingInfo: {
    trackingNumber: String,
    carrier: String,
    trackingUrl: String
  },
  timeline: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    message: String,
    updatedBy: String
  }],
  notes: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  shiprocketOrderId: { type: String },
  shiprocketAwb: { type: String },
  trackingUrl: { type: String },
  trackingStatus: { type: String },
  trackingHistory: { type: Array, default: [] }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}${random}`;
  }
  next();
});

// Index for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'paymentInfo.status': 1 });

// Virtual for id field
orderSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

orderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Order = mongoose.model('Order', orderSchema);
