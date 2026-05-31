/**
 * Removes all ERP data from MongoDB without inserting demo/seed data.
 * Run: npm run clear-db
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Batch from '../models/Batch.js';
import Fee from '../models/Fee.js';
import Test from '../models/Test.js';
import Mark from '../models/Mark.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';

async function clear() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Parent.deleteMany({}),
    Student.deleteMany({}),
    Class.deleteMany({}),
    Batch.deleteMany({}),
    Fee.deleteMany({}),
    Test.deleteMany({}),
    Mark.deleteMany({}),
    Notification.deleteMany({}),
    Announcement.deleteMany({}),
    (await import('../models/SyllabusProgress.js')).default.deleteMany({}),
  ]);
  console.log('\n✅ All data cleared from database. No demo data was added.\n');
  console.log('Create real accounts via your admin workflow or register API when enabled.\n');
  await mongoose.disconnect();
  process.exit(0);
}

clear().catch((e) => {
  console.error(e);
  process.exit(1);
});
