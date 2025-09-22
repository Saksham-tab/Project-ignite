import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { Cart } from '../../models/Cart';
import { createTestCategory, createValidProductData } from '../helpers/testData';
import { connectDB, closeDB, clearDB } from '../setup';

describe('Cart Routes', () => {
  let userToken: string;
  let userId: string;
  let productId: string;

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
      });

    userToken = userRegisterResponse.body.data.token;    userId = userRegisterResponse.body.data.user._id || userRegisterResponse.body.data.user.id;

    // Create test category and product
    const category = await createTestCategory();
    const productData = createValidProductData(category._id.toString());
    const product = new Product(productData);
    const savedProduct = await product.save();
    productId = savedProduct._id.toString();
  });

  describe('GET /api/cart', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.totalAmount).toBe(0);
    });

    it('should get cart with items', async () => {
      // First add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.totalAmount).toBe(59.98);
    });

    it('should not get cart without authentication', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/cart/add', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.items[0].size).toBe('M');
      expect(response.body.data.items[0].color).toBe('Red');
    });

    it('should update quantity if same item added again', async () => {
      // Add item first time
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        });

      // Add same item again
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(5);
    });

    it('should add different variants as separate items', async () => {
      // Add first variant
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        });

      // Add different variant
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'L',
          color: 'Blue',
          quantity: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          // missing size, color, quantity
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not add item with invalid product id', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: fakeId,
          size: 'M',
          color: 'Red',
          quantity: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/cart/update', () => {
    beforeEach(async () => {
      // Add item to cart first
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        });
    });

    it('should update item quantity', async () => {
      const response = await request(app)
        .put('/api/cart/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put('/api/cart/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app)
        .put('/api/cart/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'L', // Different size
          color: 'Blue', // Different color
          quantity: 3
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/cart/remove', () => {
    beforeEach(async () => {
      // Add items to cart first
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        });

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'L',
          color: 'Blue',
          quantity: 1
        });
    });

    it('should remove specific item from cart', async () => {
      const response = await request(app)
        .delete('/api/cart/remove')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].size).toBe('L');
      expect(response.body.data.items[0].color).toBe('Blue');
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app)
        .delete('/api/cart/remove')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'XL', // Non-existent size
          color: 'Green' // Non-existent color
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/cart/clear', () => {
    beforeEach(async () => {
      // Add items to cart first
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        });

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'L',
          color: 'Blue',
          quantity: 1
        });
    });

    it('should clear all items from cart', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.totalAmount).toBe(0);
    });
  });

  describe('POST /api/cart/sync', () => {
    it('should sync cart with provided items', async () => {
      const cartItems = [
        {
          productId,
          size: 'M',
          color: 'Red',
          quantity: 2
        },
        {
          productId,
          size: 'L',
          color: 'Blue',
          quantity: 1
        }
      ];

      const response = await request(app)
        .post('/api/cart/sync')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: cartItems })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.totalAmount).toBe(89.97); // (29.99 * 2) + (29.99 * 1)
    });

    it('should replace existing cart items', async () => {
      // Add initial item
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'S',
          color: 'Red',
          quantity: 5
        });

      // Sync with new items
      const cartItems = [
        {
          productId,
          size: 'M',
          color: 'Blue',
          quantity: 1
        }
      ];

      const response = await request(app)
        .post('/api/cart/sync')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: cartItems })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].size).toBe('M');
      expect(response.body.data.items[0].color).toBe('Blue');
    });

    it('should handle empty sync (clear cart)', async () => {
      // Add initial item
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          size: 'S',
          color: 'Red',
          quantity: 2
        });

      // Sync with empty items
      const response = await request(app)
        .post('/api/cart/sync')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.totalAmount).toBe(0);
    });
  });
});
