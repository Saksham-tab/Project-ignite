import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { Cart } from '../../models/Cart';
import { Order } from '../../models/Order';
import { connectDB, closeDB, clearDB } from '../setup';
import { createTestCategory, createValidProductData } from '../helpers/testData';

describe('Ecommerce Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let productId: string;
  let testCategory: any;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();    // Create admin user
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
      });

    adminToken = adminLoginResponse.body.data.token;

    // Create regular user
    const userRegisterResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890'
      });    userToken = userRegisterResponse.body.data.token;
    userId = userRegisterResponse.body.data.user._id || userRegisterResponse.body.data.user.id;
    
    // Create test category
    testCategory = await createTestCategory();
  });
  describe('Complete Ecommerce Flow', () => {
    it('should complete full ecommerce flow from product creation to order completion', async () => {
      // Step 1: Admin creates a product
      const productData = createValidProductData(testCategory._id.toString(), {
        name: 'Premium T-Shirt',
        description: 'High-quality cotton t-shirt',
        price: 49.99,
        material: 'Cotton'
      });      const productResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      productId = productResponse.body.data.id;
      expect(productResponse.body.success).toBe(true);// Step 2: User browses and searches for products
      const browseResponse = await request(app)
        .get(`/api/products?search=premium&category=${testCategory._id}`)
        .expect(200);

      expect(browseResponse.body.success).toBe(true);
      expect(browseResponse.body.data.products).toHaveLength(1);
      expect(browseResponse.body.data.products[0].name).toBe('Premium T-Shirt');

      // Step 3: User views product details
      const productDetailResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(productDetailResponse.body.success).toBe(true);
      expect(productDetailResponse.body.data.name).toBe('Premium T-Shirt');

      // Step 4: User adds items to cart
      const addToCartResponse1 = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        })
        .expect(200);

      expect(addToCartResponse1.body.success).toBe(true);
      expect(addToCartResponse1.body.data.items).toHaveLength(1);

      const addToCartResponse2 = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)        .send({
          productId,
          size: 'L',
          color: 'Red',
          quantity: 1
        })
        .expect(200);

      expect(addToCartResponse2.body.success).toBe(true);
      expect(addToCartResponse2.body.data.items).toHaveLength(2);

      // Step 5: User views cart
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.success).toBe(true);
      expect(cartResponse.body.data.items).toHaveLength(2);
      expect(cartResponse.body.data.totalAmount).toBe(149.97); // (49.99 * 2) + (49.99 * 1)

      // Step 6: User updates cart item quantity
      const updateCartResponse = await request(app)
        .put('/api/cart/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 3 // Changed from 2 to 3
        })
        .expect(200);

      expect(updateCartResponse.body.success).toBe(true);
      expect(updateCartResponse.body.data.totalAmount).toBe(199.96); // (49.99 * 3) + (49.99 * 1)

      // Step 7: User updates profile with address
      const profileUpdateResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        })
        .expect(200);

      expect(profileUpdateResponse.body.success).toBe(true);
      expect(profileUpdateResponse.body.data.address.city).toBe('New York');

      // Step 8: User creates order from cart
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              product: productId,
              quantity: 3,
              size: 'M',
              color: 'Red',
              price: 49.99
            },            {
              product: productId,
              quantity: 1,
              size: 'L',
              color: 'Red',
              price: 49.99
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
          paymentMethod: 'cod'        })
        .expect(201);

      const orderId = orderResponse.body.data.id;
      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data.totalAmount).toBe(199.96);
      expect(orderResponse.body.data.status).toBe('pending');

      // Step 9: User confirms COD payment
      const codConfirmResponse = await request(app)
        .post('/api/payments/cod/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId })
        .expect(200);

      expect(codConfirmResponse.body.success).toBe(true);
      expect(codConfirmResponse.body.data.paymentStatus).toBe('pending');

      // Step 10: User tracks order
      const trackResponse = await request(app)
        .get(`/api/orders/${orderId}/track`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(trackResponse.body.success).toBe(true);
      expect(trackResponse.body.data.status).toBe('pending');

      // Step 11: Admin views all orders
      const adminOrdersResponse = await request(app)
        .get('/api/orders/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminOrdersResponse.body.success).toBe(true);
      expect(adminOrdersResponse.body.data.orders).toHaveLength(1);

      // Step 12: Admin updates order status
      const statusUpdateResponse = await request(app)
        .put(`/api/orders/admin/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'confirmed',
          note: 'Order confirmed and ready for processing'
        })
        .expect(200);

      expect(statusUpdateResponse.body.success).toBe(true);
      expect(statusUpdateResponse.body.data.status).toBe('confirmed');

      // Step 13: Admin updates stock (optional)
      const stockUpdateResponse = await request(app)
        .put(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: { S: 8, M: 11, L: 19, XL: 5 } // Reduced based on order
        })
        .expect(200);

      expect(stockUpdateResponse.body.success).toBe(true);
      expect(stockUpdateResponse.body.data.stock.M).toBe(11);

      // Step 14: User views order history
      const orderHistoryResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(orderHistoryResponse.body.success).toBe(true);
      expect(orderHistoryResponse.body.data.orders).toHaveLength(1);
      expect(orderHistoryResponse.body.data.orders[0].status).toBe('confirmed');

      // Step 15: Admin gets order statistics
      const statsResponse = await request(app)
        .get('/api/orders/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.totalOrders).toBe(1);
      expect(statsResponse.body.data.totalRevenue).toBe(199.96);
    });
  });
  describe('User Journey Tests', () => {
    let tshirtCategory: any;
    let jeansCategory: any;

    beforeEach(async () => {
      // Create test categories
      tshirtCategory = await createTestCategory('T-Shirts');
      jeansCategory = await createTestCategory('Jeans');

      // Create test products
      const products = [
        createValidProductData(tshirtCategory._id.toString(), {
          name: 'Cotton T-Shirt',
          description: 'Comfortable cotton t-shirt',
          price: 25.99,
          brand: 'ComfortWear'
        }),
        createValidProductData(jeansCategory._id.toString(), {
          name: 'Denim Jeans',
          description: 'Classic blue denim jeans',
          price: 79.99,
          brand: 'DenimCo'
        })
      ];

      for (const productData of products) {
        await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData);
      }
    });

    it('should handle user registration, shopping, and order lifecycle', async () => {
      // New user registration
      const newUserResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          phone: '9876543210'
        })
        .expect(201);

      const newUserToken = newUserResponse.body.data.token;
      expect(newUserResponse.body.success).toBe(true);      // User browses products by category
      const tshirtsResponse = await request(app)
        .get(`/api/products?category=${tshirtCategory._id}`)
        .expect(200);

      expect(tshirtsResponse.body.data.products).toHaveLength(1);

      const jeansResponse = await request(app)
        .get(`/api/products?category=${jeansCategory._id}`)
        .expect(200);

      expect(jeansResponse.body.data.products).toHaveLength(1);

      // User adds products to cart
      const tshirtId = tshirtsResponse.body.data.products[0]._id;
      const jeansId = jeansResponse.body.data.products[0]._id;

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${newUserToken}`)        .send({
          productId: tshirtId,
          size: 'M',
          color: 'Red',
          quantity: 1
        })
        .expect(200);

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${newUserToken}`)        .send({
          productId: jeansId,
          size: 'L',
          color: 'Red',
          quantity: 1
        })
        .expect(200);

      // User views cart
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(cartResponse.body.data.items).toHaveLength(2);
      expect(cartResponse.body.data.totalAmount).toBe(105.98); // 25.99 + 79.99

      // User creates order
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          items: [
            {
              product: tshirtId,
              quantity: 1,
              size: 'M',
              color: 'White',
              price: 25.99
            },
            {
              product: jeansId,
              quantity: 1,
              size: 'L',
              color: 'Blue',
              price: 79.99
            }
          ],
          shippingAddress: {
            name: 'Jane Smith',
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA',
            phone: '9876543210'
          },
          paymentMethod: 'cod'        })
        .expect(201);

      const orderId = orderResponse.body.data.id;

      // Admin processes the order
      await request(app)
        .put(`/api/orders/admin/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'processing',
          note: 'Order is being prepared'
        })
        .expect(200);

      await request(app)
        .put(`/api/orders/admin/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped',
          note: 'Order has been shipped',
          trackingNumber: 'TRACK123456789'
        })
        .expect(200);

      // User tracks order
      const trackingResponse = await request(app)
        .get(`/api/orders/${orderId}/track`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(trackingResponse.body.data.status).toBe('shipped');
      expect(trackingResponse.body.data.trackingNumber).toBe('TRACK123456789');

      // Admin marks order as delivered
      const deliveredResponse = await request(app)
        .put(`/api/orders/admin/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'delivered',
          note: 'Order delivered successfully'
        })
        .expect(200);

      expect(deliveredResponse.body.data.status).toBe('delivered');

      // User views completed order
      const completedOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(completedOrderResponse.body.data.status).toBe('delivered');
      expect(completedOrderResponse.body.data.timeline).toHaveLength(4); // pending, processing, shipped, delivered
    });
  });
  describe('Error Handling and Edge Cases', () => {    
    beforeEach(async () => {
      // Use the product that was created in the main test suite instead of creating a new one
      const productsResponse = await request(app)
        .get('/api/products')
        .expect(200);
      
      if (productsResponse.body.data && productsResponse.body.data.products && productsResponse.body.data.products.length > 0) {
        productId = productsResponse.body.data.products[0]._id || productsResponse.body.data.products[0].id;
        console.log('Using existing product ID for edge case tests:', productId);
      } else {
        // If no products exist, we'll use the tshirt product from the main test
        console.log('No products found, using tshirt product ID');
      }
        console.log('Products response:', JSON.stringify(productsResponse.body));
    });

    it('should handle stock validation during order creation', async () => {
      // Try to order more than available stock
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              product: productId,
              quantity: 5, // More than available (2)
              size: 'M',
              color: 'Red',
              price: 99.99
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
        })
        .expect(400);

      expect(orderResponse.body.success).toBe(false);
      expect(orderResponse.body.message).toContain('stock');
    });

    it('should handle order cancellation', async () => {
      // Create order with available stock
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              product: productId,
              quantity: 1,
              size: 'M',
              color: 'Red',
              price: 99.99
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
          paymentMethod: 'cod'        })
        .expect(201);

      const orderId = orderResponse.body.data.id;

      // Cancel the order
      const cancelResponse = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'Changed my mind'
        })
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.status).toBe('cancelled');
      expect(cancelResponse.body.data.cancellationReason).toBe('Changed my mind');
    });

    it('should prevent unauthorized access to admin routes', async () => {
      // User tries to access admin-only routes
      await request(app)
        .get('/api/orders/admin/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app)
        .get('/api/orders/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Product',
          description: 'Test',
          price: 10.00,
          category: 'Test'
        })
        .expect(403);
    });
  });
});
