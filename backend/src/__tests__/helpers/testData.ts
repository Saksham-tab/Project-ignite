import mongoose from 'mongoose';
import { Category } from '../../models/Category';

export async function createTestCategory(name = 'Test Category') {
  const category = new Category({
    name,
    description: 'Test category description'
  });
  return await category.save();
}

export function createValidProductData(categoryId: string, overrides: any = {}) {
  return {
    name: 'Test T-Shirt',
    description: 'A test t-shirt',
    price: 29.99,
    category_id: categoryId,
    image_url: 'https://example.com/test.jpg',
    images: [
      { url: 'https://example.com/test.jpg', alt: 'Test product image' }
    ],
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 20 }
    ],
    colors: [
      { name: 'Red', code: '#FF0000' }
    ],
    stock_quantity: 45,
    ...overrides
  };
}

export function createValidUserData(overrides: any = {}) {
  return {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    phone: '1234567890',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'India'
    },
    ...overrides
  };
}

export function createValidOrderData(userId: string, productId: string, overrides: any = {}) {
  return {
    user: new mongoose.Types.ObjectId(userId),
    items: [{
      product: new mongoose.Types.ObjectId(productId),
      name: 'Test T-Shirt',
      price: 29.99,
      quantity: 2,
      size: 'M',
      color: 'Red',
      image: 'https://example.com/test.jpg'
    }],
    pricing: {
      subtotal: 59.98,
      shipping: 0,
      tax: 0,
      total: 59.98
    },
    shippingAddress: {
      name: 'Test User',
      phone: '1234567890',
      email: 'test@example.com',
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'India'
    },
    paymentInfo: {
      method: 'cod',
      status: 'pending'
    },
    status: 'pending',
    orderNumber: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
    ...overrides
  };
}
