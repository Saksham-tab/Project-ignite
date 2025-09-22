import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
// @ts-ignore
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

// Initialize Razorpay
let razorpay: any;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay credentials not found.');
}

// Create Razorpay order for redirect checkout
router.post('/razorpay/create', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  if (!razorpay) {
    throw createError('Razorpay is not configured', 503);
  }

  const { amount, currency = 'INR', orderData } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Valid amount is required', 400);
  }

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `order_${Date.now()}`,
    });

    const order = new Order({
      user: req.user.id,
      items: orderData.items || [],
      pricing: {
        subtotal: orderData.amount || amount,
        shipping: 0,
        tax: 0,
        total: amount
      },
      shippingAddress: {
        fullName: orderData.userInfo?.name || 'Customer',
        email: orderData.userInfo?.email || '',
        phone: orderData.userInfo?.phone || '',
        address: orderData.userInfo?.address || '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      },
      paymentInfo: {
        method: 'razorpay',
        status: 'pending',
        orderId: razorpayOrder.id
      },
      status: 'pending',
      timeline: [{
        status: 'pending',
        message: 'Order created, awaiting payment',
        timestamp: new Date()
      }]
    });

    await order.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        orderId: order._id
      }
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    throw createError('Failed to create payment order', 500);
  }
}));

// Confirm Razorpay payment from redirect
router.post('/razorpay/confirm', asyncHandler(async (req: Request, res: Response) => {
  const { payment_id, order_id, signature } = req.body;

  if (!payment_id || !order_id) {
    throw createError('Missing payment information', 400);
  }

  try {
    const order = await Order.findOne({ 'paymentInfo.orderId': order_id });
    if (!order) {
      throw createError('Order not found', 404);
    }

    if (signature && process.env.RAZORPAY_KEY_SECRET) {
      const body = order_id + "|" + payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== signature) {
        throw createError('Invalid payment signature', 400);
      }
    }

    // ✅ Safe update for paymentInfo
    if (!order.paymentInfo) {
      order.paymentInfo = {
        method: 'razorpay',
        status: 'paid',
        orderId: order_id,
        paymentId: payment_id
      };
    } else {
      order.paymentInfo.paymentId = payment_id;
      order.paymentInfo.status = 'paid';
    }

    order.status = 'confirmed';

    order.timeline.push({
      status: 'confirmed',
      message: 'Payment successful - Order confirmed',
      timestamp: new Date()
    });

    await order.save();

    req.app.get('io').to('admin').emit('order:new', {
      orderId: order._id,
      method: 'Razorpay',
      amount: order.pricing?.total || 0,
      customer: order.shippingAddress?.name || 'Unknown',
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { orderId: order._id }
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    throw createError('Failed to confirm payment', 500);
  }
}));

// PayU Integration
router.post('/payu/initiate', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { amount, orderId } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Amount must be greater than zero', 400);
  }

  const payuUrl = `https://secure.payu.in/_payment?amount=${amount}&txnid=${orderId || Date.now()}&productinfo=IGNITE&firstname=Customer&email=customer@example.com&phone=9999999999&key=your_payu_key&surl=https://yourdomain.com/success&furl=https://yourdomain.com/failure&hash=calculated_hash_here`;

  res.json({ success: true, payu_url: payuUrl });
}));

export default router;
