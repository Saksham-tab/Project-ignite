import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/User';
import { connectDB, closeDB, clearDB } from '../setup';

describe('Users Routes', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890'
      };

      // Create user first
      await request(app).post('/api/users/register').send(userData);

      // Try to register again
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '1234567890'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('john@example.com');
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '1234567890'
        });
      
      authToken = registerResponse.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('john@example.com');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '1234567890'
        });
      
      authToken = registerResponse.body.data.token;
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'John Updated',
        phone: '9876543210',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Updated');
      expect(response.body.data.phone).toBe('9876543210');
      expect(response.body.data.address.city).toBe('New York');
    });
  });

  describe('PUT /api/users/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '1234567890'
        });
      
      authToken = registerResponse.body.data.token;
    });

    it('should change password with valid current password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Test login with new password
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'john@example.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should not change password with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin Routes', () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {      // Create admin user
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
          phone: '1234567890'
        });

      userToken = userRegisterResponse.body.data.token;
    });

    describe('GET /api/users/admin/users', () => {
      it('should get all users as admin', async () => {
        const response = await request(app)
          .get('/api/users/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toHaveLength(2);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should not get users as regular user', async () => {
        const response = await request(app)
          .get('/api/users/admin/users')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/users/admin/users/:id', () => {
      it('should update user as admin', async () => {
        const users = await User.find({});
        const regularUser = users.find(u => u.role === 'customer');

        const response = await request(app)
          .put(`/api/users/admin/users/${regularUser?._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            role: 'admin',
            isActive: false
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.role).toBe('admin');
        expect(response.body.data.isActive).toBe(false);
      });

      it('should not update user as regular user', async () => {
        const users = await User.find({});
        const regularUser = users.find(u => u.role === 'customer');

        const response = await request(app)
          .put(`/api/users/admin/users/${regularUser?._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            role: 'admin'
          })
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
