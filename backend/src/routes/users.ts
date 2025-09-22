import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateSignup, validateLogin, handleValidationErrors } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import nodemailer from 'nodemailer';

const router = Router();

// Helper: Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Send OTP via email
async function sendEmailOTP(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Your Ignite OTP Code',
    text: `Your OTP code is: ${otp}`,
    html: `<h2>Your OTP code is: <b>${otp}</b></h2>`
  });
}

// Helper: Send OTP via SMS (Twilio or similar)
async function sendSMSOTP(phone: string, otp: string) {
  // Placeholder: Integrate Twilio or other SMS provider here
  // Example:
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({
  //   body: `Your Ignite OTP code is: ${otp}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone
  // });
  console.log(`[DEV] SMS OTP to ${phone}: ${otp}`);
}

// Helper: Send SMS (Twilio or similar)
export async function sendSMS(phone: string, message: string) {
  // Placeholder: Integrate Twilio or other SMS provider here
  // Example:
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone
  // });
  console.log(`[DEV] SMS to ${phone}: ${message}`);
}

// Register new user (with OTP)
router.post('/register', validateSignup, asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, name, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('User already exists with this email', 400);
  }

  // Create new user
  const userData: any = { email, password };
  if (firstName && lastName) {
    userData.firstName = firstName;
    userData.lastName = lastName;
  } else if (name) {
    const [first, ...rest] = name.split(' ');
    userData.firstName = first;
    userData.lastName = rest.join(' ') || 'User';
  } else {
    throw createError('First name and last name are required', 400);
  }
  if (phone) userData.phone = phone;
  if (role && ['customer', 'admin'].includes(role)) {
    userData.role = role;
  }

  // Generate OTPs
  const emailOTP = generateOTP();
  const phoneOTP = phone ? generateOTP() : null;
  userData.emailOTP = emailOTP;
  userData.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  if (phoneOTP) {
    userData.phoneOTP = phoneOTP;
    userData.phoneOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  }
  userData.isEmailVerified = false;
  userData.isPhoneVerified = false;

  const user = await User.create(userData);
  await Cart.create({ user: user._id, items: [] });

  // DEV: Log OTPs to console for local testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Email OTP for ${email}: ${emailOTP}`);
    if (phone && phoneOTP) console.log(`[DEV] Phone OTP for ${phone}: ${phoneOTP}`);
  }

  // Send OTPs
  try {
    await sendEmailOTP(email, emailOTP);
    if (phone && phoneOTP) await sendSMSOTP(phone, phoneOTP);
  } catch (err) {
    // Log error but continue for dev
    console.error('OTP send error:', err);
  }

  res.status(201).json({
    success: true,
    message: 'User registered. OTP sent to email' + (phone ? ' and phone.' : '.'),
    data: {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    }
  });
}));

// Verify OTP endpoint
router.post('/verify-otp', asyncHandler(async (req: Request, res: Response) => {
  const { email, emailOTP, phone, phoneOTP } = req.body;
  const user = await User.findOne({ email }).select('+emailOTP +emailOTPExpires +phoneOTP +phoneOTPExpires');
  if (!user) throw createError('User not found', 404);

  let emailVerified = false;
  let phoneVerified = false;

  // Email OTP
  if (emailOTP) {
    if (!user.emailOTP || !user.emailOTPExpires || user.emailOTP !== emailOTP || user.emailOTPExpires < new Date()) {
      throw createError('Invalid or expired email OTP', 400);
    }
    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    emailVerified = true;
  }

  // Phone OTP
  if (phone && phoneOTP) {
    if (!user.phoneOTP || !user.phoneOTPExpires || user.phoneOTP !== phoneOTP || user.phoneOTPExpires < new Date()) {
      throw createError('Invalid or expired phone OTP', 400);
    }
    user.isPhoneVerified = true;
    user.phoneOTP = null;
    user.phoneOTPExpires = null;
    phoneVerified = true;
  }

  await user.save();

  res.json({
    success: true,
    message: `Verification successful. Email: ${emailVerified}, Phone: ${phoneVerified}`,
    data: {
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified
    }
  });
}));

// Login user
router.post('/login', validateLogin, asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createError('User not found', 404);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = user.generateAuthToken();
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin
      },
      token
    }
  });
}));

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id).populate('cart.product');
  
  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin
    }
  });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const allowedUpdates = ['name', 'phone', 'address'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    throw createError('Invalid updates', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  updates.forEach(update => {
    (user as any)[update] = req.body[update];
  });

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin
    }
  });
}));

// Change password
router.put('/change-password', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw createError('New password must be at least 6 characters long', 400);
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw createError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Admin routes
// Get all users (Admin only)
router.get('/admin/users', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments();

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Update user as admin
router.put('/admin/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { role, isActive, status } = req.body;
  
  const updateData: any = {};
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (status !== undefined) updateData.status = status;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      isActive: updateData.isActive
    }
  });
}));

// Update user role (Admin only)
router.put('/:id/role', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  
  if (!['customer', 'admin'].includes(role)) {
    throw createError('Invalid role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  });
}));

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    throw createError('User not found', 404);
  }

  // Also delete user's cart
  await Cart.findOneAndDelete({ user: user._id });

  res.json({
    success: true,    message: 'User deleted successfully'
  });
}));

// Get user by Clerk ID
router.get('/clerk/:clerkId', async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;
    console.log(`👤 GET /users/clerk/${clerkId} - Fetching user...`);

    const user = await User.findOne({ clerk_id: clerkId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ Found user: ${user.email}`);

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Update user profile
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`👤 PUT /users/${id} - Updating user profile...`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ Updated user: ${updatedUser.email}`);

    res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// Get all users (Admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('👤 GET /users - Fetching all users...');

    const { limit = 50, offset = 0 } = req.query;

    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    console.log(`✅ Found ${users.length} users`);

    res.status(200).json({
      success: true,
      data: users,
      total: users.length
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', asyncHandler(async (req: Request, res: Response) => {
  const { email, phone } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw createError('User not found', 404);

  // Only allow resend if not already verified
  if (user.isEmailVerified && (!phone || user.isPhoneVerified)) {
    throw createError('User already verified', 400);
  }

  // Generate new OTPs
  const emailOTP = generateOTP();
  const phoneOTP = phone ? generateOTP() : null;
  user.emailOTP = emailOTP;
  user.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  if (phoneOTP) {
    user.phoneOTP = phoneOTP;
    user.phoneOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  }
  await user.save();

  // DEV: Log OTPs to console for local testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Email OTP for ${email}: ${emailOTP}`);
    if (phone && phoneOTP) console.log(`[DEV] Phone OTP for ${phone}: ${phoneOTP}`);
  }

  // Send OTPs
  try {
    await sendEmailOTP(user.email, emailOTP);
    if (phone && phoneOTP) await sendSMSOTP(phone, phoneOTP);
  } catch (err) {
    // Log error but continue for dev
    console.error('OTP send error:', err);
  }

  res.json({
    success: true,
    message: 'OTP resent to email' + (phone ? ' and phone.' : '.')
  });
}));

export default router;
