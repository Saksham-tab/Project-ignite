import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface IUser extends mongoose.Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'customer' | 'admin';
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isEmailVerified: boolean;
  emailOTP: string | null;
  emailOTPExpires: Date | null;
  phoneOTP: string | null;
  phoneOTPExpires: Date | null;
  isPhoneVerified: boolean;
  lastLogin?: Date;
  cart: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    size?: string;
  }>;
  generateAuthToken(): string;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOTP: {
    type: String,
    select: false,
    default: null,
  },
  emailOTPExpires: {
    type: Date,
    select: false,
    default: null,
  },
  phoneOTP: {
    type: String,
    select: false,
    default: null,
  },
  phoneOTPExpires: {
    type: Date,
    select: false,
    default: null,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    size: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      default: 'M'
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Generate JWT token
userSchema.methods.generateAuthToken = function(): string {
  const payload = { 
    id: this._id, 
    email: this.email, 
    role: this.role 
  };
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-tests';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  // @ts-ignore - JWT typing issue with expiresIn
  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};

// Compare password
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Virtual for full name
userSchema.virtual('name')
  .get(function() {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function(fullName: string) {
    const nameParts = fullName.trim().split(' ');
    this.firstName = nameParts[0] || '';
    this.lastName = nameParts.slice(1).join(' ') || '';
  });

// Virtual for id field to maintain compatibility with frontend
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Never send password in response
    return ret;
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
