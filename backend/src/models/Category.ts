import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Virtual for id field to maintain compatibility with frontend
categorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

categorySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Category = mongoose.model('Category', categorySchema);
