import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';

dotenv.config();

// Review Schema (same as in review.ts)
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  username: { type: String, default: 'Anonymous' },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);

const seedReviews = async () => {
  try {
    console.log('🌱 Starting review seeding...');
    
    await connectDB();

    // Sample product IDs from the database (you can get these from the products API)
    const productIds = [
      '6857e4af2aeb468b7122f716', // Mindfulness Meditation Pants
      '6857e4af2aeb468b7122f71f', // Sacred Geometry Pendant
      '6857e4af2aeb468b7122f723', // Gratitude Journal T-Shirt
      '6857e4af2aeb468b7122f72b', // Chakra Alignment Sweatshirt
      '6857e4af2aeb468b7122f70c', // Spiritual Journey Hoodie
      '6857e4af2aeb468b7122f700', // Ignite Your Soul T-Shirt
    ];

    const sampleReviews = [
      {
        productId: productIds[0],
        username: 'Sarah M.',
        rating: 5,
        comment: 'Absolutely love these meditation pants! They are so comfortable and perfect for my daily yoga practice. The bamboo fabric feels amazing against the skin.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        productId: productIds[0],
        username: 'Michael R.',
        rating: 4,
        comment: 'Great quality pants for meditation. They fit perfectly and are very breathable. Would definitely recommend!',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        productId: productIds[1],
        username: 'Emma L.',
        rating: 5,
        comment: 'This pendant is absolutely stunning! The sacred geometry design is beautifully crafted and the sterling silver quality is excellent. It\'s become my favorite piece of jewelry.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        productId: productIds[2],
        username: 'David K.',
        rating: 4,
        comment: 'Love the gratitude theme on this t-shirt. The vintage style is perfect and the fabric is soft. Great reminder to practice gratitude daily.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        productId: productIds[3],
        username: 'Lisa P.',
        rating: 5,
        comment: 'The chakra design on this sweatshirt is vibrant and beautiful. It\'s comfortable and warm, perfect for spiritual practitioners. Highly recommend!',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        productId: productIds[4],
        username: 'John D.',
        rating: 5,
        comment: 'This hoodie is incredibly comfortable and the spiritual design is inspiring. The cotton blend is perfect for daily wear. Love it!',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      },
      {
        productId: productIds[5],
        username: 'Maria S.',
        rating: 5,
        comment: 'The "Ignite Your Soul" message is so powerful! The t-shirt quality is excellent and it\'s become my go-to for spreading positive vibes.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        productId: productIds[5],
        username: 'Alex T.',
        rating: 4,
        comment: 'Great motivational t-shirt! The design is inspiring and the cotton feels premium. Perfect for daily wear.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    // Clear existing reviews
    console.log('🗑️ Clearing existing reviews...');
    await Review.deleteMany({});

    // Create reviews
    console.log('📝 Creating sample reviews...');
    const reviews = await Review.insertMany(sampleReviews);
    console.log(`✅ Created ${reviews.length} reviews`);

    console.log('\n🎉 Review seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${reviews.length} reviews created`);
    console.log(`   • Reviews added to ${productIds.length} different products`);

  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedReviews();
}

export default seedReviews; 