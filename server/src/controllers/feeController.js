import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Parent from '../models/Parent.js';
import { computeFeeStatus } from '../utils/feeStatus.js';

function applyStatus(fees) {
  return fees.map((f) => {
    const obj = f.toObject ? f.toObject() : f;
    obj.status = computeFeeStatus(f);
    return obj;
  });
}

export async function listFees(req, res, next) {
  try {
    const { sort, className, status } = req.query;
    let studentFilter = {};
    if (className) {
      const ids = await Student.find({ className: new RegExp(className, 'i') }).distinct('_id');
      studentFilter = { studentId: { $in: ids } };
    }

    if (req.user.role === 'parent') {
      studentFilter.studentId = { $in: req.parentStudentIds };
    }

    let fees = await Fee.find(studentFilter)
      .populate({
        path: 'studentId',
        populate: [{ path: 'classId', select: 'name' }],
      })
      .lean();

    fees = applyStatus(fees);

    if (status) fees = fees.filter((f) => f.status === status);

    if (sort === 'delay') {
      fees.sort((a, b) => {
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (b.status === 'paid' && a.status !== 'paid') return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sort === 'upcoming') {
      fees = fees.filter((f) => f.status !== 'paid');
      fees.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    res.json({ success: true, data: fees });
  } catch (err) {
    next(err);
  }
}

export async function markPaid(req, res, next) {
  try {
    const { paymentMode, remarks } = req.body;
    const fee = await Fee.findById(req.params.id).populate('studentId');
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });

    fee.paidDate = new Date();
    fee.status = 'paid';
    fee.receiptNo = `NCC-${Date.now().toString(36).toUpperCase()}`;
    fee.paymentMode = paymentMode || 'cash';
    fee.remarks = remarks;
    await fee.save();

    res.json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
}

export async function createFee(req, res, next) {
  try {
    const fee = await Fee.create(req.body);
    fee.status = computeFeeStatus(fee);
    await fee.save();
    res.status(201).json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
}

export async function feeAnalytics(req, res, next) {
  try {
    const fees = await Fee.find({ paidDate: { $ne: null } });
    const byMonth = {};
    fees.forEach((f) => {
      const d = new Date(f.paidDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + f.amount;
    });
    res.json({ success: true, data: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })) });
  } catch (err) {
    next(err);
  }
}

export async function sendFeeReminders(req, res, next) {
  try {
    const fees = await Fee.find({ paidDate: null }).populate('studentId');
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const fee of fees) {
      const status = computeFeeStatus(fee);
      if (status !== 'due_soon' && status !== 'overdue') continue;
      const parent = await Parent.findOne({ students: fee.studentId._id });
      if (!parent?.userId) continue;
      await Notification.create({
        userId: parent.userId,
        type: 'fee_due',
        title: status === 'overdue' ? 'Fee Overdue' : 'Fee Due Soon',
        message: `Fee of ₹${fee.amount} for ${fee.studentId.name} is ${status === 'overdue' ? 'overdue' : 'due soon'}.`,
        link: '/parent/fees',
      });
      count++;
    }
    res.json({ success: true, message: `${count} reminders sent` });
  } catch (err) {
    next(err);
  }
}
