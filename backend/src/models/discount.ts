import mongoose from 'mongoose';

// IMPORTANT: When adding new discount codes directly to the database, always use UPPERCASE for 'code' and set 'isActive: true'.
const discountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['percentage', 'flat'], required: true },
  value: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: false },
}, { timestamps: true });

export const Discount = mongoose.model('Discount', discountSchema);
