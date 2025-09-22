import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateSignup, validateLogin, handleValidationErrors } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Register new user
router.post('/register', validateSignup, asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('User already exists with this email', 400);
  }

  // Create new user
  const userData: any = { email, password, name };
  if (phone) userData.phone = phone;
  if (role && ['customer', 'admin'].includes(role)) {
    userData.role = role;
  }

  const user = await User.create(userData);
  
  // Create empty cart for the user
  await Cart.create({ user: user._id, items: [] });

  // Generate token
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified
      },
      token
    }
  });
}));

// Login user
router.post('/login', validateLogin, asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createError('Invalid email or password', 401);
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
        id: user._id,
        email: user.email,
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
  
  res.json({
    success: true,
    data: { user }
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
    data: { user }
  });
}));

// Change password
router.put('/change-password', authenticateToken, [
  ...validateLogin.slice(0, -1), // Reuse password validation
  handleValidationErrors
], asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;

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

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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
    success: true,
    message: 'User deleted successfully'
  });
}));

export default router;
