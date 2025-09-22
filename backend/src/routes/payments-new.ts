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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create Razorpay order
router.post('/razorpay/create-order', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const { amount, currency = 'INR', orderId } = req.body;

  if (!amount || amount <= 0) {
    throw createError('Valid amount is required', 400);
  }
  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paisa
      currency,
      receipt: orderId || `order_${Date.now()}`,
    });

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
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

    await order.save();

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { order }
    });
  } catch (error: any) {
    console.error('Stripe payment confirmation error:', error);
    throw createError('Failed to confirm payment', 500);
  }
}));

// Stripe webhook
router.post('/stripe/webhook', asyncHandler(async (req: Request, res: Response) => {
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
        const order = await Order.findById(paymentIntent.metadata.orderId);        if (order && order.paymentInfo && order.paymentInfo.status !== 'paid') {
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
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed:', failedPayment.id);
        if (failedPayment.metadata.orderId) {
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
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}));

// Razorpay webhook
router.post('/razorpay/webhook', asyncHandler(async (req: Request, res: Response) => {
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

  res.json({ status: 'ok' });
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
    data: { order }
  });
}));

// Get payment methods
router.get('/methods', asyncHandler(async (req: Request, res: Response) => {
  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Pay with Credit/Debit Card, Net Banking, UPI, Wallets',
      enabled: !!process.env.RAZORPAY_KEY_ID,
      currencies: ['INR']
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Pay with Credit/Debit Card',
      enabled: !!process.env.STRIPE_SECRET_KEY,
      currencies: ['USD', 'EUR', 'GBP']
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      enabled: true,
      currencies: ['INR', 'USD']
    }
  ];

  res.json({
    success: true,
    data: { paymentMethods: paymentMethods.filter(method => method.enabled) }
  });
}));

export default router;
