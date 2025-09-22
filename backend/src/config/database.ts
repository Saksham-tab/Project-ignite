import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🍃 MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('🍃 MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};

// Database table names (for consistency with existing code)
export const TABLES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  USERS: 'users'
} as const;

// Legacy Supabase support for fallback
import { createClient } from '@supabase/supabase-js';

// Check if we're in development mode and create a mock client
const isDevelopment = process.env.NODE_ENV === 'development';
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'mock-service-key';

// For development, we'll use a mock client
let supabase: any;

if (isDevelopment && (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'your_supabase_url_here')) {
  // Mock Supabase client for local development
  console.log('🔧 Using mock Supabase client for fallback');
  supabase = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: (data: any) => Promise.resolve({ data: [{ id: Date.now(), ...data }], error: null }),
      update: (data: any) => Promise.resolve({ data: [data], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export { supabase };
