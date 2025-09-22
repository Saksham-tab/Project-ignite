import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { createTestCategory, createValidProductData } from '../helpers/testData';
import { connectDB, closeDB, clearDB } from '../setup';

// Mock Razorpay and Stripe
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 5999,
        currency: 'INR',
        status: 'created'
      })
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_test123',
        order_id: 'order_test123',
        status: 'captured',
        amount: 5999
      })
    }
  }));
});

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test',
        amount: 5999,
        currency: 'usd',
        status: 'requires_payment_method'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 5999
      })
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            metadata: {
              orderId: 'test_order_id'
            }
          }
        }
      })
    }
  }))
}));

describe('Payments Routes', () => {
  let userToken: string;
  let userId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();

    // Create test user
    const userRegisterResponse = await request(app)
      .post('/api/users/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        password: 'password123',
        phone: '1234567890'
      });    userToken = userRegisterResponse.body.data.token;
    userId = userRegisterResponse.body.data.user._id || userRegisterResponse.body.data.user.id;

    // Create test category and product
    const category = await createTestCategory();
    const productData = createValidProductData(category._id.toString());
    const product = new Product(productData);
    const savedProduct = await product.save();
    productId = savedProduct._id.toString();    // Create test order
    const order = new Order({
      user: new mongoose.Types.ObjectId(userId),
      items: [
        {
          product: new mongoose.Types.ObjectId(productId),
          name: 'Test T-Shirt',
          quantity: 2,
          size: 'M',
          color: 'Red',
          price: 29.99,
          image: 'https://example.com/test.jpg'
        }
      ],
      pricing: {
        subtotal: 59.98,
        shipping: 0,
        tax: 0,
        total: 59.98
      },
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phone: '1234567890',
        email: 'user@example.com'
      },
      paymentInfo: {
        method: 'razorpay',
        status: 'pending'
      },
      status: 'pending',
      orderNumber: `ORD${Date.now()}`
    });

    const savedOrder = await order.save();
    orderId = savedOrder._id.toString();
  });

  describe('GET /api/payments/methods', () => {
    it('should get available payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.methods).toContain('cod');
      expect(response.body.data.methods).toContain('razorpay');
      expect(response.body.data.methods).toContain('stripe');
    });
  });

  describe('POST /api/payments/razorpay/create-order', () => {
    it('should create Razorpay order', async () => {
      const response = await request(app)
        .post('/api/payments/razorpay/create-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          amount: 59.98,
          currency: 'INR'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.razorpayOrderId).toBe('order_test123');
      expect(response.body.data.amount).toBe(5999); // Amount in paisa
      expect(response.body.data.currency).toBe('INR');
    });

    it('should not create order without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/razorpay/create-order')
        .send({
          orderId,
          amount: 59.98,
          currency: 'INR'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payments/razorpay/create-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/razorpay/verify', () => {
    it('should verify Razorpay payment', async () => {
      const response = await request(app)
        .post('/api/payments/razorpay/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          razorpayPaymentId: 'pay_test123',
          razorpayOrderId: 'order_test123',
          razorpaySignature: 'test_signature'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('completed');
    });

    it('should handle payment verification failure', async () => {
      const response = await request(app)
        .post('/api/payments/razorpay/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          razorpayPaymentId: 'invalid_payment',
          razorpayOrderId: 'invalid_order',
          razorpaySignature: 'invalid_signature'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/stripe/create-intent', () => {
    it('should create Stripe payment intent', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          amount: 59.98,
          currency: 'usd'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBe('pi_test123_secret_test');
      expect(response.body.data.paymentIntentId).toBe('pi_test123');
    });

    it('should not create intent without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/create-intent')
        .send({
          orderId,
          amount: 59.98,
          currency: 'usd'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/stripe/confirm', () => {
    it('should confirm Stripe payment', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          paymentIntentId: 'pi_test123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('completed');
    });

    it('should handle failed payment confirmation', async () => {
      // Mock failed payment
      const stripe = require('stripe')();
      stripe.paymentIntents.retrieve.mockResolvedValueOnce({
        id: 'pi_test123',
        status: 'requires_payment_method',
        amount: 5999
      });

      const response = await request(app)
        .post('/api/payments/stripe/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          paymentIntentId: 'pi_test123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/webhooks/stripe', () => {
    it('should handle Stripe webhook', async () => {
      const webhookPayload = JSON.stringify({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            metadata: {
              orderId: orderId
            }
          }
        }
      });

      const response = await request(app)
        .post('/api/payments/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should ignore unhandled webhook events', async () => {
      const webhookPayload = JSON.stringify({
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test123'
          }
        }
      });

      const stripe = require('stripe')();
      stripe.webhooks.constructEvent.mockReturnValueOnce({
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test123'
          }
        }
      });

      const response = await request(app)
        .post('/api/payments/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.received).toBe(true);
    });
  });

  describe('POST /api/payments/webhooks/razorpay', () => {
    it('should handle Razorpay webhook', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
              order_id: 'order_test123',
              status: 'captured',
              notes: {
                orderId: orderId
              }
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhooks/razorpay')
        .set('x-razorpay-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should ignore unhandled webhook events', async () => {
      const webhookPayload = {
        event: 'order.paid',
        payload: {
          order: {
            entity: {
              id: 'order_test123'
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhooks/razorpay')
        .set('x-razorpay-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.received).toBe(true);
    });
  });

  describe('GET /api/payments/:orderId/status', () => {
    beforeEach(async () => {      // Update order with payment info
      await Order.findByIdAndUpdate(orderId, {
        'paymentInfo.status': 'paid',
        'paymentInfo.paymentId': 'pay_test123',
        'paymentInfo.orderId': 'order_test123'
      });
    });

    it('should get payment status', async () => {
      const response = await request(app)
        .get(`/api/payments/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('completed');
      expect(response.body.data.paymentMethod).toBe('razorpay');
      expect(response.body.data.transactionId).toBe('pay_test123');
    });

    it('should not get payment status of another user\'s order', async () => {
      // Create another user
      const anotherUserResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123',
          phone: '1234567890'
        });

      const anotherUserToken = anotherUserResponse.body.data.token;

      const response = await request(app)
        .get(`/api/payments/${orderId}/status`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/payments/${fakeId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/cod/confirm', () => {
    let codOrderId: string;

    beforeEach(async () => {      // Create COD order
      const codOrder = new Order({
        user: new mongoose.Types.ObjectId(userId),
        items: [
          {
            product: new mongoose.Types.ObjectId(productId),
            name: 'Test T-Shirt',
            quantity: 1,
            size: 'M',
            color: 'Red',
            price: 29.99,
            image: 'https://example.com/test.jpg'
          }
        ],
        pricing: {
          subtotal: 29.99,
          shipping: 0,
          tax: 0,
          total: 29.99
        },
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '1234567890',
          email: 'user@example.com'
        },
        paymentInfo: {
          method: 'cod',
          status: 'pending'
        },
        status: 'pending',
        orderNumber: `ORD${Date.now()}-COD`
      });

      const savedCodOrder = await codOrder.save();
      codOrderId = savedCodOrder._id.toString();
    });

    it('should confirm COD order', async () => {
      const response = await request(app)
        .post('/api/payments/cod/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: codOrderId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('pending');
      expect(response.body.data.paymentMethod).toBe('cod');
    });

    it('should not confirm COD for non-COD order', async () => {
      const response = await request(app)
        .post('/api/payments/cod/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId // This order has razorpay as payment method
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
