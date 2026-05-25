/**
 * One-time fix: Reset the double-hashed password for rahul.b@talentsteer.com
 * Run: node backend/scripts/fix-talentsteer-password.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

const MONGO_URI = process.env.MONGODB_URI;

// Load User model
const User = require('../models/User');

async function fixPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.\n');

    const email = 'rahul.b@talentsteer.com';
    const newPassword = 'bhanu@123';

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email}`);
    console.log(`Role: ${user.role} | isActive: ${user.isActive} | Org: ${user.organization}`);
    console.log(`Current password hash (first 30): ${user.password?.substring(0, 30)}...`);

    // Directly set plaintext — pre('save') hook will hash it correctly
    user.password = newPassword;
    await user.save();

    // Verify the fix worked
    const updated = await User.findOne({ email }).select('+password');
    const isValid = await bcrypt.compare(newPassword, updated.password);
    console.log(`\n✅ Password reset. Verification: ${isValid ? 'SUCCESS ✓' : 'FAILED ✗'}`);
    console.log(`New hash (first 30): ${updated.password?.substring(0, 30)}...`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  }
}

fixPassword();
