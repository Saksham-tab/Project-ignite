import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Cart } from '../models/Cart';
import { User } from '../models/User';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateOrder, validateObjectId } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Create new order
router.post('/', authenticateToken, validateOrder, asyncHandler(async (req: any, res: Response) => {
  const { items, shippingAddress, paymentInfo, pricing } = req.body;

  // Validate and process items
  const processedItems = [];
  let calculatedSubtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      throw createError(`Product ${item.product} not found or inactive`, 400);
    }

    // Check size and stock
    const sizeOption = product.sizes.find(s => s.size === item.size);
    if (!sizeOption) {
      throw createError(`Size ${item.size} not available for ${product.name}`, 400);
    }

    if (sizeOption.stock < item.quantity) {
      throw createError(`Insufficient stock for ${product.name} in size ${item.size}`, 400);
    }

    processedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      size: item.size,
      image: product.image_url
    });

    calculatedSubtotal += product.price * item.quantity;
  }

  // Validate pricing
  if (Math.abs(calculatedSubtotal - pricing.subtotal) > 0.01) {
    throw createError('Price mismatch detected', 400);
  }

  // Create order
  const order = await Order.create({
    user: req.user.id,
    items: processedItems,
    shippingAddress,
    paymentInfo: {
      ...paymentInfo,
      status: 'pending'
    },
    pricing,
    status: 'pending',
    timeline: [{
      status: 'pending',
      message: 'Order placed successfully',
      timestamp: new Date()
    }]
  });

  // Clear user's cart
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $set: { items: [], total: 0 } }
  );

  await order.populate('user', 'name email phone');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
}));

// Get user's orders
router.get('/', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.product', 'name image_url');

  const total = await Order.countDocuments({ user: req.user.id });

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get specific order
router.get('/:id', authenticateToken, validateObjectId(), asyncHandler(async (req: any, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name image_url category_id');

  if (!order) {
    throw createError('Order not found', 404);
  }

  // Check if user owns this order or is admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    throw createError('Access denied', 403);
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// Track order by order number
router.get('/track/:orderNumber', asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .select('orderNumber status timeline trackingInfo estimatedDelivery')
    .populate('items.product', 'name image_url');

  if (!order) {
    throw createError('Order not found', 404);
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// Cancel order
router.patch('/:id/cancel', authenticateToken, validateObjectId(), asyncHandler(async (req: any, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw createError('Order not found', 404);
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user.id) {
    throw createError('Access denied', 403);
  }

  // Check if order can be cancelled
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw createError('Order cannot be cancelled at this stage', 400);
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': item.quantity } }
    );
  }

  order.status = 'cancelled';
  order.timeline.push({
    status: 'cancelled',
    message: 'Order cancelled by customer',
    timestamp: new Date(),
    updatedBy: req.user.email
  });

  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order }
  });
}));

// ==================== ADMIN ROUTES ====================

// Get all orders (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by payment status
  if (req.query.paymentStatus) {
    query['paymentInfo.status'] = req.query.paymentStatus;
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate as string);
    }
  }

  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .populate('items.product', 'name image_url')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Update order status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, validateObjectId(), asyncHandler(async (req: any, res: Response) => {
  const { status, message, trackingNumber, carrier, trackingUrl } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    throw createError('Invalid status', 400);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw createError('Order not found', 404);
  }

  // Update order status
  order.status = status;
  
  // Add to timeline
  order.timeline.push({
    status,
    message: message || `Order status updated to ${status}`,
    timestamp: new Date(),
    updatedBy: req.user.email
  });
  // Update tracking info if provided
  if (trackingNumber && order.trackingInfo) {
    order.trackingInfo.trackingNumber = trackingNumber;
  }
  if (carrier && order.trackingInfo) {
    order.trackingInfo.carrier = carrier;
  }
  if (trackingUrl && order.trackingInfo) {
    order.trackingInfo.trackingUrl = trackingUrl;
  }

  // Set delivery dates
  if (status === 'shipped' && !order.estimatedDelivery) {
    order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  }
  if (status === 'delivered') {
    order.actualDelivery = new Date();
  }

  // Handle stock for cancelled/returned orders
  if (status === 'cancelled' || status === 'returned') {
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'sizes.size': item.size },
        { $inc: { 'sizes.$.stock': item.quantity } }
      );
    }
  }

  await order.save();
  await order.populate('user', 'name email phone');

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
}));

// Get order statistics (Admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalOrders,
    todayOrders,
    weekOrders,
    monthOrders,
    pendingOrders,
    shippedOrders,
    deliveredOrders,
    totalRevenue,
    monthRevenue
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'shipped' }),
    Order.countDocuments({ status: 'delivered' }),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]),
    Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
        pending: pendingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0
      }
    }
  });
}));

export default router;
