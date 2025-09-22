import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { createTestCategory, createValidProductData } from '../helpers/testData';
import { connectDB, closeDB, clearDB } from '../setup';

describe('Products Routes', () => {  let adminToken: string;
  let userToken: string;
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
        name: 'Regular User',
        email: 'user@example.com',
        password: 'user123',
        phone: '1234567890'      });

    userToken = userRegisterResponse.body.data.token;
    
    // Create test category
    testCategory = await createTestCategory();
  });
  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const productData = createValidProductData(testCategory._id.toString(), {
        name: 'Test T-Shirt',
        description: 'A comfortable cotton t-shirt',
        price: 29.99,
        material: 'Cotton'
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.price).toBe(productData.price);
    });

    it('should not create product as regular user', async () => {
      const productData = {
        name: 'Test T-Shirt',
        description: 'A comfortable cotton t-shirt',
        price: 29.99,
        category: 'T-Shirts'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        createValidProductData(testCategory._id.toString(), {
          name: 'Red T-Shirt',
          description: 'Red cotton t-shirt',
          price: 25.99
        }),
        createValidProductData(testCategory._id.toString(), {
          name: 'Blue Jeans',
          description: 'Classic blue jeans',
          price: 59.99
        })
      ];

      for (const product of products) {
        await new Product(product).save();
      }
    });

    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/products?category=${testCategory._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=20&maxPrice=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].price).toBeLessThanOrEqual(30);
      expect(response.body.data.products[0].price).toBeGreaterThanOrEqual(20);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products?search=red')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name.toLowerCase()).toContain('red');
    });

    it('should sort products by price', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=price&sortOrder=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.products[0].price).toBeLessThan(response.body.data.products[1].price);
    });
  });
  describe('GET /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const productData = createValidProductData(testCategory._id.toString(), {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99
      });
      const product = new Product(productData);
      const savedProduct = await product.save();
      productId = savedProduct._id.toString();
    });

    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(productId);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
  describe('PUT /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const productData = createValidProductData(testCategory._id.toString(), {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99
      });
      const product = new Product(productData);
      const savedProduct = await product.save();
      productId = savedProduct._id.toString();
    });    it('should update product as admin', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 39.99,
        colors: [
          { name: 'Red', code: '#FF0000' },
          { name: 'Blue', code: '#0000FF' }
        ]
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product');
      expect(response.body.data.price).toBe(39.99);
      expect(response.body.data.colors).toHaveLength(2);
      expect(response.body.data.colors[0].name).toBe('Red');
    });

    it('should not update product as regular user', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 39.99
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
  describe('DELETE /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const productData = createValidProductData(testCategory._id.toString(), {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99
      });
      const product = new Product(productData);
      const savedProduct = await product.save();
      productId = savedProduct._id.toString();
    });

    it('should delete product as admin', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify product is deleted
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('should not delete product as regular user', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
  describe('PUT /api/products/:id/stock', () => {
    let productId: string;

    beforeEach(async () => {
      const productData = createValidProductData(testCategory._id.toString(), {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99
      });
      const product = new Product(productData);
      const savedProduct = await product.save();
      productId = savedProduct._id.toString();
    });

    it('should update stock as admin', async () => {
      const stockUpdate = {
        stock: { S: 15, M: 25, L: 10 }
      };

      const response = await request(app)
        .put(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(stockUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stock.S).toBe(15);
      expect(response.body.data.stock.M).toBe(25);
      expect(response.body.data.stock.L).toBe(10);
    });

    it('should not update stock as regular user', async () => {
      const stockUpdate = {
        stock: { S: 15, M: 25 }
      };

      const response = await request(app)
        .put(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(stockUpdate)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
