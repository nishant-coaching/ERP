import Student from '../models/Student.js';
import Fee from '../models/Fee.js';
import Mark from '../models/Mark.js';
import Test from '../models/Test.js';
import { computeFeeStatus } from '../utils/feeStatus.js';
import { analyzePerformance, LABEL_DISPLAY } from '../utils/performance.js';

export async function adminOverview(req, res, next) {
  try {
    const totalStudents = await Student.countDocuments({ isActive: true });
    const fees = await Fee.find().populate('studentId', 'name classId batchId');
    fees.forEach((f) => { f.status = computeFeeStatus(f); });

    const pendingFees = fees.filter((f) => f.status !== 'paid');
    const pendingAmount = pendingFees.reduce((s, f) => s + f.amount, 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const collectedThisMonth = fees
      .filter((f) => f.paidDate && new Date(f.paidDate) >= monthStart)
      .reduce((s, f) => s + f.amount, 0);

    const latestTests = await Test.find({ isPublished: true }).sort({ date: -1 }).limit(3);
    let topPerformers = [];
    let lowPerformers = [];

    if (latestTests.length) {
      const latestTestId = latestTests[0]._id;
      const marks = await Mark.find({ testId: latestTestId })
        .populate('studentId', 'name admissionNo')
        .sort({ percentage: -1 });
      topPerformers = marks.slice(0, 5).map((m) => ({
        student: m.studentId,
        percentage: m.percentage,
        rank: m.rankInClass,
      }));
      lowPerformers = [...marks].reverse().slice(0, 5).map((m) => ({
        student: m.studentId,
        percentage: m.percentage,
      }));
    }

    const upcomingDue = pendingFees
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 8)
      .map((f) => ({
        id: f._id,
        student: f.studentId,
        amount: f.amount,
        dueDate: f.dueDate,
        status: f.status,
      }));

    const monthlyCollection = await getMonthlyCollection();

    res.json({
      success: true,
      data: {
        totalStudents,
        feesPending: { count: pendingFees.length, amount: pendingAmount },
        collectedThisMonth,
        topPerformers,
        lowPerformers,
        upcomingDue,
        monthlyCollection,
        feeStatusBreakdown: {
          paid: fees.filter((f) => f.status === 'paid').length,
          due_soon: fees.filter((f) => f.status === 'due_soon').length,
          overdue: fees.filter((f) => f.status === 'overdue').length,
          pending: fees.filter((f) => f.status === 'pending').length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMonthlyCollection() {
  const sixMonths = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const collected = await Fee.aggregate([
      {
        $match: {
          paidDate: { $gte: d, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    sixMonths.push({
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      amount: collected[0]?.total || 0,
    });
  }
  return sixMonths;
}

export async function parentOverview(req, res, next) {
  try {
    const studentIds = req.parentStudentIds || [];
    const students = await Student.find({ _id: { $in: studentIds } })
      .populate('classId', 'name');

    const fees = await Fee.find({ studentId: { $in: studentIds } }).sort({ dueDate: -1 });
    fees.forEach((f) => { f.status = computeFeeStatus(f); });

    const pending = fees.filter((f) => f.status !== 'paid');
    const upcomingTests = await Test.find({
      date: { $gte: new Date() },
      isPublished: true,
    })
      .sort({ date: 1 })
      .limit(5)
      .populate('classId', 'name');

    const latestMarks = await Mark.find({ studentId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .limit(studentIds.length)
      .populate('testId', 'name date')
      .populate('studentId', 'name');

    res.json({
      success: true,
      data: {
        students,
        pendingFees: pending,
        totalPending: pending.reduce((s, f) => s + f.amount, 0),
        upcomingTests,
        latestMarks,
      },
    });
  } catch (err) {
    next(err);
  }
}

export { LABEL_DISPLAY, analyzePerformance };
