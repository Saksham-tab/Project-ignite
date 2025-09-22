import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
      console.log('🗑️ Dropping database...');
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('✅ Database dropped successfully');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanDatabase();
