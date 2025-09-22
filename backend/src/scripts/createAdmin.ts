import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../../dist/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists:', existingAdmin.email);
      return process.exit(0);
    }

    const adminUser = new User({
      email: process.env.ADMIN_EMAIL,
      password: 'ignite1234',
      firstName: 'Ignite',
      lastName: 'Admin',
      role: 'admin',
      isEmailVerified: true
    });

    await adminUser.save();
    console.log(`🎉 Admin created: ${adminUser.email}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();

