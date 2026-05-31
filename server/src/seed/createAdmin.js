/**
 * Create one admin user (no demo students/fees).
 * Usage: node src/seed/createAdmin.js email@example.com YourPassword "Admin Name"
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
  console.log('\nUsage: npm run create-admin -- email@example.com password "Admin Name"\n');
  process.exit(1);
}

async function run() {
  await connectDB();
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    console.error('User with this email already exists.');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: 'admin',
    name: name || 'Administrator',
    isActive: true,
  });
  console.log(`\n✅ Admin created: ${email}\n`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
