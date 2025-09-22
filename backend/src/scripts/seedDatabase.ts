import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Order } from '../models/Order';

dotenv.config();

const sampleCategories = [
  {
    name: 'Spiritual T-Shirts',
    slug: 'spiritual-t-shirts',
    description: 'Comfortable t-shirts with spiritual and motivational designs',
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400'
  },
  {
    name: 'Hoodies & Sweatshirts',
    slug: 'hoodies-sweatshirts',
    description: 'Cozy hoodies and sweatshirts for spiritual souls',
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Spiritual accessories and lifestyle products',
    image_url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400'
  },
  {
    name: 'Meditation Wear',
    slug: 'meditation-wear',
    description: 'Comfortable clothing for meditation and yoga practice',
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
  }
];

const generateProducts = (categories: any[]) => [
  {
    name: 'Ignite Your Soul T-Shirt',
    description: 'Premium cotton t-shirt with inspirational "Ignite Your Soul" design. Perfect for daily wear and spreading positive vibes.',
    price: 29.99,
    originalPrice: 39.99,
    category_id: categories[0]._id,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', alt: 'Front view' },
      { url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600', alt: 'Back view' }
    ],
    sizes: [
      { size: 'XS', stock: 10 },
      { size: 'S', stock: 25 },
      { size: 'M', stock: 30 },
      { size: 'L', stock: 25 },
      { size: 'XL', stock: 15 },
      { size: 'XXL', stock: 8 }
    ],
    stock_quantity: 113,
    colors: [
      { name: 'Black', code: '#000000' },
      { name: 'White', code: '#FFFFFF' },
      { name: 'Navy', code: '#1e3a8a' }
    ],
    material: '100% Premium Cotton',
    featured: true,
    tags: ['spiritual', 'motivational', 'cotton', 'unisex'],
    isActive: true
  },
  {
    name: 'Spiritual Journey Hoodie',
    description: 'Comfortable pullover hoodie with embroidered spiritual design. Made from premium cotton blend for ultimate comfort.',
    price: 59.99,
    originalPrice: 79.99,
    category_id: categories[1]._id,
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600',
    images: [
      { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600', alt: 'Front view' },
      { url: 'https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=600', alt: 'Side view' }
    ],
    sizes: [
      { size: 'S', stock: 15 },
      { size: 'M', stock: 20 },
      { size: 'L', stock: 18 },
      { size: 'XL', stock: 12 },
      { size: 'XXL', stock: 5 }
    ],
    stock_quantity: 70,
    colors: [
      { name: 'Charcoal', code: '#36454f' },
      { name: 'Burgundy', code: '#800020' }
    ],
    material: '80% Cotton, 20% Polyester',
    featured: true,
    tags: ['hoodie', 'spiritual', 'comfortable', 'warm'],
    isActive: true
  },
  {
    name: 'Mindfulness Meditation Pants',
    description: 'Ultra-comfortable yoga and meditation pants made from organic bamboo fiber. Perfect for spiritual practice.',
    price: 45.99,
    category_id: categories[3]._id,
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
    images: [
      { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', alt: 'Front view' }
    ],
    sizes: [
      { size: 'XS', stock: 8 },
      { size: 'S', stock: 12 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 6 }
    ],
    stock_quantity: 53,
    colors: [
      { name: 'Earth Brown', code: '#8b4513' },
      { name: 'Sage Green', code: '#9caf88' }
    ],
    material: '95% Organic Bamboo, 5% Spandex',
    featured: false,
    tags: ['meditation', 'yoga', 'bamboo', 'organic', 'comfortable'],
    isActive: true
  },
  {
    name: 'Sacred Geometry Pendant',
    description: 'Handcrafted sterling silver pendant featuring sacred geometry patterns. Includes adjustable chain.',
    price: 89.99,
    originalPrice: 119.99,
    category_id: categories[2]._id,
    image_url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600',
    images: [
      { url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600', alt: 'Pendant view' }
    ],
    sizes: [
      { size: 'M', stock: 25 }
    ],
    stock_quantity: 25,
    colors: [
      { name: 'Sterling Silver', code: '#c0c0c0' }
    ],
    material: 'Sterling Silver',
    featured: true,
    tags: ['jewelry', 'sacred geometry', 'pendant', 'silver'],
    isActive: true
  },
  {
    name: 'Gratitude Journal T-Shirt',
    description: 'Soft vintage-style t-shirt with beautiful gratitude-themed artwork. Promotes daily mindfulness and appreciation.',
    price: 24.99,
    category_id: categories[0]._id,
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600',
    images: [
      { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', alt: 'Front design' }
    ],
    sizes: [
      { size: 'S', stock: 20 },
      { size: 'M', stock: 25 },
      { size: 'L', stock: 20 },
      { size: 'XL', stock: 10 }
    ],
    stock_quantity: 75,
    colors: [
      { name: 'Vintage Blue', code: '#4a90a4' },
      { name: 'Soft Pink', code: '#f8bbd9' }
    ],
    material: '100% Ring-Spun Cotton',
    featured: false,
    tags: ['gratitude', 'mindfulness', 'vintage', 'soft'],
    isActive: true
  },
  {
    name: 'Chakra Alignment Sweatshirt',
    description: 'Premium crewneck sweatshirt featuring the seven chakras in vibrant colors. Perfect for spiritual practitioners.',
    price: 54.99,
    category_id: categories[1]._id,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=600',
    images: [
      { url: 'https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=600', alt: 'Chakra design' }
    ],
    sizes: [
      { size: 'S', stock: 12 },
      { size: 'M', stock: 18 },
      { size: 'L', stock: 15 },
      { size: 'XL', stock: 8 }
    ],
    stock_quantity: 53,
    colors: [
      { name: 'Rainbow', code: '#ff6b6b' }
    ],
    material: '85% Cotton, 15% Polyester',
    featured: false,
    tags: ['chakra', 'spiritual', 'colorful', 'sweatshirt'],
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({})
    ]);    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    const adminUser = await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@ignite.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isEmailVerified: true
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);

    // Create sample customer
    console.log('👥 Creating sample customer...');
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer = await User.create({
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      phone: '+1234567890',
      address: {
        street: '123 Spiritual Lane',
        city: 'Meditation City',
        state: 'California',
        zipCode: '90210',
        country: 'USA'      },
      isEmailVerified: true
    });
    console.log(`✅ Customer created: ${customer.email}`);

    // Create categories
    console.log('📂 Creating categories...');
    const categories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${categories.length} categories`);

    // Create products
    console.log('📦 Creating products...');
    const productsData = generateProducts(categories);
    const products = await Product.insertMany(productsData);
    console.log(`✅ Created ${products.length} products`);

    // Create sample order
    console.log('📋 Creating sample order...');
    const sampleOrder = await Order.create({
      user: customer._id,
      items: [
        {
          product: products[0]._id,
          name: products[0].name,
          price: products[0].price,
          quantity: 2,
          size: 'M',
          image: products[0].image_url
        },
        {
          product: products[1]._id,
          name: products[1].name,
          price: products[1].price,
          quantity: 1,
          size: 'L',
          image: products[1].image_url
        }
      ],
      shippingAddress: {
        name: customer.name,
        phone: customer.phone!,
        email: customer.email,
        street: customer.address!.street,
        city: customer.address!.city,
        state: customer.address!.state,
        zipCode: customer.address!.zipCode,
        country: customer.address!.country
      },
      paymentInfo: {
        method: 'razorpay',
        status: 'paid'
      },
      pricing: {
        subtotal: (products[0].price * 2) + products[1].price,
        shipping: 10,
        tax: 8.5,
        discount: 5,
        total: (products[0].price * 2) + products[1].price + 10 + 8.5 - 5
      },
      status: 'shipped',
      timeline: [
        {
          status: 'pending',
          message: 'Order placed successfully',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
          status: 'confirmed',
          message: 'Payment confirmed - Order confirmed',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
        },
        {
          status: 'processing',
          message: 'Order is being processed',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        {
          status: 'shipped',
          message: 'Order shipped via FedEx',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        }
      ],
      trackingInfo: {
        trackingNumber: 'FDX123456789',
        carrier: 'FedEx',
        trackingUrl: 'https://www.fedex.com/track'
      },
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    });
    console.log(`✅ Created sample order: ${sampleOrder.orderNumber}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${categories.length} categories created`);
    console.log(`   • ${products.length} products created`);
    console.log(`   • 2 users created (1 admin, 1 customer)`);
    console.log(`   • 1 sample order created`);
    console.log('\n🔐 Login credentials:');
    console.log(`   Admin: ${adminUser.email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`   Customer: ${customer.email} / customer123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
