import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' }
  }],
  image_url: {
    type: String,
    required: true
  },
  sizes: [{
    size: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  }],
  stock_quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  colors: [{
    name: { type: String, required: true },
    code: { type: String, required: true }
  }],
  material: {
    type: String,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category_id: 1, featured: 1 });
productSchema.index({ price: 1 });

// Virtual for id field to maintain compatibility with frontend
productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for total stock across all sizes
productSchema.virtual('totalStock').get(function() {
  if (this.sizes && Array.isArray(this.sizes)) {
    return this.sizes.reduce((total: number, size: any) => total + size.stock, 0);
  }
  return 0;
});

productSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Product = mongoose.model('Product', productSchema);
