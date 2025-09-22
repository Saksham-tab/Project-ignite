import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    await connectDB();
    const adminEmail = 'admin@ignitestore.com';
    const newPassword = 'saksham@1234';
    const hashed = await bcrypt.hash(newPassword, 12);
    const admin = await User.findOneAndUpdate(
      { role: 'admin', email: adminEmail },
      { password: hashed },
      { new: true }
    );
    if (admin) {
      console.log(`✅ Admin password reset for ${admin.email}`);
    } else {
      console.log('❌ Admin user not found.');
    }
  } catch (err) {
    console.error('❌ Error resetting admin password:', err);
  } finally {
    mongoose.connection.close();
  }
};

resetAdminPassword();
