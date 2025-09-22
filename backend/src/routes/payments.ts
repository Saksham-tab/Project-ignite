import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Stripe from 'stripe';
// @ts-ignore
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

// Initialize payment gateways
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize Razorpay only if keys are provided
let razorpay: any;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay credentials not found. Razorpay payment method will be disabled.');
}

// Get available payment methods
router.get('/methods', (req: Request, res: Response) => {
  const methods = ['cod']; // Cash on delivery is always available
  
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'your_stripe_secret_key_here') {
    methods.push('stripe', 'card', 'qr');
  }
  
  if (razorpay) {
    methods.push('razorpay', 'upi', 'qr');
  }
  
  res.json({
    success: true,
    data: {
      methods
    }
  });
});

// Get payment status for an order
router.get('/:orderId/status', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params;
  
  const order = await Order.findById(orderId);
  if (!order) {
    throw createError('Order not found', 404);
  }
  // Check if user owns the order or is admin
  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw createError('Order not found', 404);
  }

  const status = order.paymentInfo?.status || 'pending';
  const mappedStatus = status === 'paid' ? 'completed' : status;

  res.json({
    success: true,
    data: {
      orderId: order._id,
      paymentStatus: mappedStatus,
      paymentMethod: order.paymentInfo?.method || 'unknown',
      amount: order.pricing?.total || 0,
      transactionId: order.paymentInfo?.paymentId || order.paymentInfo?.orderId
    }
  });
}));

// Create Razorpay order
router.post('/razorpay/create-order', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  if (!razorpay) {
    throw createError('Razorpay is not configured', 503);
  }
  
  const { amount, currency = 'INR', orderId } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Valid amount is required', 400);
  }
  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paisa
      currency,
      receipt: orderId || `order_${Date.now()}`,
    });    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    throw createError('Failed to create payment order', 500);
  }
}));

// Verify Razorpay payment
router.post('/razorpay/verify', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  if (!razorpay) {
    throw createError('Razorpay is not configured', 503);
  }
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    throw createError('Missing payment verification data', 400);
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw createError('Invalid payment signature', 400);
  }

  // Update order payment status
  const order = await Order.findById(orderId);
  if (!order) {
    throw createError('Order not found', 404);
  }

  if (order.user.toString() !== req.user.id) {
    throw createError('Access denied', 403);
  }
  // Update payment info
  if (order.paymentInfo) {
    order.paymentInfo.paymentId = razorpay_payment_id;
    order.paymentInfo.orderId = razorpay_order_id;
    order.paymentInfo.signature = razorpay_signature;
    order.paymentInfo.status = 'paid';
  }
  order.status = 'confirmed';

  // Add to timeline
  order.timeline.push({
    status: 'confirmed',
    message: 'Payment successful - Order confirmed',
    timestamp: new Date()
  });

  // Reduce product stock
  for (const item of order.items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': -item.quantity } }
    );
  }

  await order.save();

  res.json({
    success: true,
    message: 'Payment verified successfully',
    data: { order }
  });
}));

// Create Stripe Payment Intent
router.post('/stripe/create-intent', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { amount, currency = 'usd', orderId } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Valid amount is required', 400);
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        orderId: orderId || `order_${Date.now()}`,
        userId: req.user.id
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error);
    throw createError('Failed to create payment intent', 500);
  }
}));

// Confirm Stripe payment
router.post('/stripe/confirm', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { paymentIntentId, orderId } = req.body;

  if (!paymentIntentId || !orderId) {
    throw createError('Payment intent ID and order ID are required', 400);
  }

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw createError('Payment not completed', 400);
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      throw createError('Order not found', 404);
    }

    if (order.user.toString() !== req.user.id) {
      throw createError('Access denied', 403);
    }    // Update payment info
    if (order.paymentInfo) {
      order.paymentInfo.paymentId = paymentIntentId;
      order.paymentInfo.status = 'paid';
    }
    order.status = 'confirmed';

    // Add to timeline
    order.timeline.push({
      status: 'confirmed',
      message: 'Payment successful - Order confirmed',
      timestamp: new Date()
    });

    // Reduce product stock
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'sizes.size': item.size },
        { $inc: { 'sizes.$.stock': -item.quantity } }
      );
    }

    await order.save();    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { 
        paymentStatus: 'completed',
        order 
      }
    });
  } catch (error: any) {
    console.error('Stripe payment confirmation error:', error);
    throw createError('Failed to confirm payment', 500);
  }
}));

// Stripe webhook
router.post('/webhooks/stripe', asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
        // Update order status if not already updated
      if (paymentIntent.metadata.orderId) {
        try {
          const order = await Order.findById(paymentIntent.metadata.orderId);
          if (order && order.paymentInfo && order.paymentInfo.status !== 'paid') {
            order.paymentInfo.paymentId = paymentIntent.id;
            order.paymentInfo.status = 'paid';
            order.status = 'confirmed';
            
            order.timeline.push({
              status: 'confirmed',
              message: 'Payment confirmed via webhook',
              timestamp: new Date()
            });

            await order.save();
          }
        } catch (error) {
          console.error('ERROR 💥', error);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;      console.log('PaymentIntent failed:', failedPayment.id);
      if (failedPayment.metadata.orderId) {
        try {
          const order = await Order.findById(failedPayment.metadata.orderId);
          if (order && order.paymentInfo) {
            order.paymentInfo.status = 'failed';
            order.timeline.push({
              status: 'pending',
              message: 'Payment failed',
              timestamp: new Date()
            });
            await order.save();
          }
        } catch (error) {
          console.error('ERROR handling failed payment:', error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}));

// Razorpay webhook
router.post('/webhooks/razorpay', asyncHandler(async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (secret) {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  const { event, payload } = req.body;

  switch (event) {
    case 'payment.captured':
      console.log('Razorpay payment captured:', payload.payment.entity.id);
      // Handle successful payment
      break;

    case 'payment.failed':
      console.log('Razorpay payment failed:', payload.payment.entity.id);
      // Handle failed payment
      break;

    default:
      console.log(`Unhandled Razorpay event: ${event}`);
  }

  res.json({ received: true });
}));

// Process COD order
router.post('/cod/confirm', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw createError('Order ID is required', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw createError('Order not found', 404);
  }

  if (order.user.toString() !== req.user.id) {
    throw createError('Access denied', 403);
  }
  if (!order.paymentInfo || order.paymentInfo.method !== 'cod') {
    throw createError('This order is not a COD order', 400);
  }

  // Update order status
  order.status = 'confirmed';
  order.timeline.push({
    status: 'confirmed',
    message: 'COD order confirmed',
    timestamp: new Date()
  });

  // Reduce product stock
  for (const item of order.items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': -item.quantity } }
    );
  }
  await order.save();
  res.json({
    success: true,
    message: 'COD order confirmed successfully',
    data: { 
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      order 
    }
  });
}));

// Create QR Code payment
router.post('/qr/create', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { amount, currency = 'INR', orderId } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Invalid amount', 400);
  }

  if (!razorpay) {
    throw createError('QR payment not available', 503);
  }

  try {
    // Create UPI QR code using Razorpay
    const qrOrder = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: currency,
      receipt: `qr_${orderId || Date.now()}`,
      payment_capture: 1
    });

    // Generate UPI QR string
    const upiString = `upi://pay?pa=${process.env.UPI_ID || 'merchant@upi'}&pn=Ignite Spiritual Store&tr=${qrOrder.id}&am=${amount}&cu=${currency}`;
    
    res.json({
      success: true,
      data: {
        qr_code_url: upiString,
        payment_url: `https://api.razorpay.com/v1/payments/qr_codes/${qrOrder.id}`,
        amount: amount,
        currency: currency,
        order_id: qrOrder.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
    });
  } catch (error: any) {
    console.error('QR payment creation error:', error);
    throw createError('Failed to create QR payment', 500);
  }
}));

// Redirect to card payment
router.post('/card/redirect', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { amount, currency = 'INR', orderId, success_url, cancel_url } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Invalid amount', 400);
  }

  try {
    if (razorpay) {
      // Use Razorpay for card payments
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: currency,
        receipt: `card_${orderId || Date.now()}`,
        payment_capture: 1
      });

      const redirectUrl = `https://checkout.razorpay.com/v1/checkout.js?key_id=${process.env.RAZORPAY_KEY_ID}&order_id=${order.id}&callback_url=${success_url}&cancel_url=${cancel_url}`;
      
      res.json({
        success: true,
        redirect_url: redirectUrl,
        order_id: order.id
      });
    } else if (stripe) {
      // Use Stripe for card payments
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Ignite Spiritual Store Purchase',
            },
            unit_amount: amount * 100, // Convert to paise/cents
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: success_url,
        cancel_url: cancel_url,
      });

      res.json({
        success: true,
        redirect_url: session.url,
        session_id: session.id
      });
    } else {
      throw createError('No payment gateway available', 503);
    }
  } catch (error: any) {
    console.error('Card payment redirect error:', error);
    throw createError('Failed to create payment redirect', 500);
  }
}));

export default router;
