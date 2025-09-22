import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { createTestCategory, createValidProductData, createValidOrderData } from '../helpers/testData';
import { connectDB, closeDB, clearDB } from '../setup';

describe('Orders Routes', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();    // Create test user
    const userRegisterResponse = await request(app)
      .post('/api/users/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        password: 'password123',
        phone: '1234567890'
      });

    userToken = userRegisterResponse.body.data.token;
    userId = userRegisterResponse.body.data.user._id || userRegisterResponse.body.data.user.id;

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '1234567890',
      role: 'admin'
    });
    await admin.save();

    const adminLoginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });    adminToken = adminLoginResponse.body.data.token;

    // Create test category and product
    const category = await createTestCategory();
    const productData = createValidProductData(category._id.toString());
    const product = new Product(productData);
    const savedProduct = await product.save();
    productId = savedProduct._id.toString();
  });

  describe('POST /api/orders', () => {
    it('should create order successfully', async () => {
      const orderData = {
        items: [
          {
            product: productId,
            quantity: 2,
            size: 'M',
            color: 'Red',
            price: 29.99
          }
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '1234567890'
        },
        paymentMethod: 'cod'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.totalAmount).toBe(59.98);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.paymentMethod).toBe('cod');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not create order without authentication', async () => {
      const orderData = {
        items: [
          {
            product: productId,
            quantity: 1,
            size: 'M',
            color: 'Red',
            price: 29.99
          }
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '1234567890'
        },
        paymentMethod: 'cod'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should check stock availability', async () => {
      const orderData = {
        items: [
          {
            product: productId,
            quantity: 100, // More than available stock
            size: 'M',
            color: 'Red',
            price: 29.99
          }
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '1234567890'
        },
        paymentMethod: 'cod'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('stock');
    });
  });
  describe('GET /api/orders', () => {
    beforeEach(async () => {      // Create test orders
      const order1 = new Order(createValidOrderData(userId, productId, {
        status: 'pending'
      }));      const order2 = new Order(createValidOrderData(userId, productId, {
        status: 'confirmed'
      }));

      await order1.save();
      await order2.save();
    });

    it('should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=confirmed')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('confirmed');
    });

    it('should not get orders without authentication', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
  describe('GET /api/orders/:id', () => {
    let orderId: string;    beforeEach(async () => {
      const order = new Order(createValidOrderData(userId, productId, {
        status: 'pending'
      }));

      const savedOrder = await order.save();
      orderId = savedOrder._id.toString();
    });

    it('should get order by id', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(orderId);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should not get order of another user', async () => {
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
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
  describe('PUT /api/orders/:id/cancel', () => {
    let orderId: string;

    beforeEach(async () => {
      const orderData = createValidOrderData(userId, productId, {
        status: 'pending'
      });
      const order = new Order(orderData);
      const savedOrder = await order.save();
      orderId = savedOrder._id.toString();
    });

    it('should cancel order', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.cancellationReason).toBe('Changed my mind');
    });

    it('should not cancel already shipped order', async () => {
      // Update order status to shipped
      await Order.findByIdAndUpdate(orderId, { status: 'shipped' });

      const response = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin Routes', () => {
    let orderId: string;    beforeEach(async () => {
      const order = new Order(createValidOrderData(userId, productId, {
        status: 'pending'
      }));

      const savedOrder = await order.save();
      orderId = savedOrder._id.toString();
    });

    describe('GET /api/orders/admin/orders', () => {
      it('should get all orders as admin', async () => {
        const response = await request(app)
          .get('/api/orders/admin/orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.orders).toHaveLength(1);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should not get all orders as regular user', async () => {
        const response = await request(app)
          .get('/api/orders/admin/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/orders/admin/:id/status', () => {
      it('should update order status as admin', async () => {
        const response = await request(app)
          .put(`/api/orders/admin/${orderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'confirmed',
            note: 'Order confirmed and ready for processing'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('confirmed');
        expect(response.body.data.timeline).toBeDefined();
      });

      it('should not update order status as regular user', async () => {
        const response = await request(app)
          .put(`/api/orders/admin/${orderId}/status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            status: 'confirmed'
          })
          .expect(403);

        expect(response.body.success).toBe(false);
      });

      it('should validate status value', async () => {
        const response = await request(app)
          .put(`/api/orders/admin/${orderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'invalid_status'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/orders/admin/stats', () => {
      it('should get order statistics as admin', async () => {
        const response = await request(app)
          .get('/api/orders/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalOrders).toBeDefined();
        expect(response.body.data.totalRevenue).toBeDefined();
        expect(response.body.data.statusCounts).toBeDefined();
      });

      it('should not get stats as regular user', async () => {
        const response = await request(app)
          .get('/api/orders/admin/stats')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/orders/:id/track', () => {
    let orderId: string;    beforeEach(async () => {
      const order = new Order(createValidOrderData(userId, productId, {
        status: 'pending',
        trackingNumber: 'TRACK123456'
      }));

      const savedOrder = await order.save();
      orderId = savedOrder._id.toString();
    });

    it('should get tracking information', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}/track`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trackingNumber).toBe('TRACK123456');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.timeline).toBeDefined();
    });

    it('should allow public tracking with tracking number', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}/track?trackingNumber=TRACK123456`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trackingNumber).toBe('TRACK123456');
    });

    it('should not allow public tracking with wrong tracking number', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}/track?trackingNumber=WRONG123`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
