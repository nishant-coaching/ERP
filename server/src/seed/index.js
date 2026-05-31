import 'dotenv/config';
import bcrypt from 'bcryptjs';
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
import { computeFeeStatus } from '../utils/feeStatus.js';

async function seed() {
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
  ]);

  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await User.create({
    email: 'admin@nishantclasses.com',
    passwordHash,
    role: 'admin',
    name: 'Admin User',
  });

  const class9 = await Class.create({ name: 'Class 9' });
  const class10 = await Class.create({ name: 'Class 10' });
  const batch9A = await Batch.create({ name: 'Morning A', classId: class9._id });
  const batch10B = await Batch.create({ name: 'Evening B', classId: class10._id });

  const parentsData = [
    { name: 'Rajesh Sharma', phone: '9876543210', email: 'rajesh@email.com' },
    { name: 'Priya Verma', phone: '9876543211', email: 'priya@email.com' },
    { name: 'Amit Patel', phone: '9876543212', email: 'amit@email.com' },
  ];

  const parents = [];
  const parentUsers = [];

  for (let i = 0; i < parentsData.length; i++) {
    const p = await Parent.create(parentsData[i]);
    const u = await User.create({
      email: `parent${i + 1}@email.com`,
      passwordHash,
      role: 'parent',
      parentId: p._id,
      name: parentsData[i].name,
    });
    p.userId = u._id;
    await p.save();
    parents.push(p);
    parentUsers.push(u);
  }

  const studentsData = [
    { admissionNo: 'NCC001', name: 'Arjun Sharma', classId: class10._id, batchId: batch10B._id, parentId: parents[0]._id },
    { admissionNo: 'NCC002', name: 'Kavya Sharma', classId: class9._id, batchId: batch9A._id, parentId: parents[0]._id },
    { admissionNo: 'NCC003', name: 'Rohan Verma', classId: class10._id, batchId: batch10B._id, parentId: parents[1]._id },
    { admissionNo: 'NCC004', name: 'Ananya Verma', classId: class9._id, batchId: batch9A._id, parentId: parents[1]._id },
    { admissionNo: 'NCC005', name: 'Dev Patel', classId: class10._id, batchId: batch10B._id, parentId: parents[2]._id },
  ];

  const students = [];
  for (const s of studentsData) {
    const st = await Student.create({
      ...s,
      contact: { phone: parents.find((p) => p._id.equals(s.parentId))?.phone },
    });
    students.push(st);
    await Parent.findByIdAndUpdate(s.parentId, { $addToSet: { students: st._id } });
  }

  const now = new Date();
  for (const st of students) {
    for (let m = 0; m < 4; m++) {
      const due = new Date(now.getFullYear(), now.getMonth() - m, 5);
      const paid = m > 1 ? null : new Date(due.getFullYear(), due.getMonth(), 3);
      const fee = await Fee.create({
        studentId: st._id,
        amount: 3500,
        dueDate: due,
        paidDate: paid,
        month: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`,
        receiptNo: paid ? `NCC-R${st.admissionNo}-${m}` : undefined,
        paymentMode: paid ? 'upi' : undefined,
      });
      fee.status = computeFeeStatus(fee);
      await fee.save();
    }
  }

  const test1 = await Test.create({
    name: 'Unit Test 1',
    classId: class10._id,
    batchId: batch10B._id,
    date: new Date(now.getFullYear(), now.getMonth() - 2, 15),
    type: 'unit',
    isPublished: true,
  });
  const test2 = await Test.create({
    name: 'Monthly Test - May',
    classId: class10._id,
    batchId: batch10B._id,
    date: new Date(now.getFullYear(), now.getMonth(), 10),
    type: 'monthly',
    isPublished: true,
  });

  const subjects = [
    { name: 'Mathematics', maxMarks: 100 },
    { name: 'Physics', maxMarks: 100 },
    { name: 'Chemistry', maxMarks: 100 },
    { name: 'English', maxMarks: 100 },
  ];

  const class10Students = students.filter((s) => s.classId.equals(class10._id));
  const marksMap = [
    [72, 68, 80, 75],
    [85, 82, 88, 90],
    [55, 60, 58, 62],
    [78, 80, 76, 82],
  ];

  const test9 = await Test.create({
    name: 'Class 9 Monthly',
    classId: class9._id,
    batchId: batch9A._id,
    date: new Date(now.getFullYear(), now.getMonth(), 5),
    type: 'monthly',
    isPublished: true,
  });
  const class9Students = students.filter((s) => s.classId.equals(class9._id));

  for (const st of class9Students) {
    const subs = subjects.map((s, i) => ({
      name: s.name,
      maxMarks: s.maxMarks,
      marks: 70 + i * 3,
    }));
    const total = subs.reduce((a, b) => a + b.marks, 0);
    const max = subs.reduce((a, b) => a + b.maxMarks, 0);
    await Mark.create({
      studentId: st._id,
      testId: test9._id,
      classId: class9._id,
      subjects: subs,
      totalMarks: total,
      percentage: Number(((total / max) * 100).toFixed(2)),
      rankInClass: 1,
      teacherRemarks: 'Good effort.',
      uploadedBy: admin._id,
    });
  }

  for (let t = 0; t < 2; t++) {
    const test = t === 0 ? test1 : test2;
    const results = [];
    class10Students.forEach((st, idx) => {
      const base = marksMap[idx][t];
      const subs = subjects.map((s, i) => ({
        name: s.name,
        maxMarks: s.maxMarks,
        marks: base + i * 2 + (t === 1 ? 5 : 0),
      }));
      const total = subs.reduce((a, b) => a + b.marks, 0);
      const max = subs.reduce((a, b) => a + b.maxMarks, 0);
      results.push({
        studentId: st._id,
        testId: test._id,
        classId: class10._id,
        subjects: subs,
        totalMarks: total,
        percentage: Number(((total / max) * 100).toFixed(2)),
        teacherRemarks: base >= 80 ? 'Excellent work!' : base < 60 ? 'Needs more practice.' : 'Good progress.',
        uploadedBy: admin._id,
      });
    });
    results.sort((a, b) => b.percentage - a.percentage);
    results.forEach((r, i) => { r.rankInClass = i + 1; });
    await Mark.insertMany(results);
  }

  for (const u of parentUsers) {
    await Notification.create({
      userId: u._id,
      type: 'fee_due',
      title: 'Fee Due Soon',
      message: 'Your ward fee is due within 5 days.',
      link: '/parent/fees',
    });
    await Notification.create({
      userId: u._id,
      type: 'marks_uploaded',
      title: 'New Marks Uploaded',
      message: 'Monthly Test - May results are available.',
      link: '/parent/performance',
      read: true,
    });
  }

  await Announcement.create({
    title: 'Summer Vacation Schedule',
    body: 'Classes will resume on 15th June. Please check the notice board.',
    targetRoles: ['parent', 'admin'],
    createdBy: admin._id,
  });

  console.log('\n✅ Seed completed!\n');
  console.log('Admin: admin@nishantclasses.com / password123');
  console.log('Parent 1: parent1@email.com / password123');
  console.log('Parent 2: parent2@email.com / password123');
  console.log('Parent 3: parent3@email.com / password123\n');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
