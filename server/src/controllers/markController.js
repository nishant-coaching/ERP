import Mark from '../models/Mark.js';
import Test from '../models/Test.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import Parent from '../models/Parent.js';
import { analyzePerformance, LABEL_DISPLAY } from '../utils/performance.js';

function pct(obtained, total) {
  if (!total) return 0;
  return Number(((obtained / total) * 100).toFixed(2));
}

function markPercentage(m) {
  if (m.obtainedMarks != null && m.totalMarks) return pct(m.obtainedMarks, m.totalMarks);
  if (m.percentage != null) return m.percentage;
  if (m.subjects?.length) {
    const obtained = m.subjects.reduce((s, x) => s + x.marks, 0);
    const total = m.subjects.reduce((s, x) => s + x.maxMarks, 0);
    return pct(obtained, total);
  }
  return 0;
}

async function assignRanks(testId, className) {
  const marks = await Mark.find({ testId, className });
  marks.sort((a, b) => markPercentage(b) - markPercentage(a));
  marks.forEach((m, i) => {
    m.rankInClass = i + 1;
  });
  await Promise.all(marks.map((m) => m.save()));
}

export async function listClassNames(req, res, next) {
  try {
    const names = await Student.distinct('className', { isActive: true, className: { $nin: [null, ''] } });
    res.json({ success: true, data: names.sort() });
  } catch (err) {
    next(err);
  }
}

export async function studentsByClass(req, res, next) {
  try {
    const { className } = req.params;
    const students = await Student.find({ isActive: true, className }).sort({ name: 1 });
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
}

export async function listTests(req, res, next) {
  try {
    const filter = {};
    if (req.query.className) filter.className = req.query.className;
    const tests = await Test.find(filter).sort({ date: -1 });
    res.json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
}

/** Create test + marks for one class only */
export async function addMarksEntry(req, res, next) {
  try {
    const { className, testName, testDate, totalMarks, type, marks } = req.body;

    if (!className?.trim()) {
      return res.status(400).json({ success: false, message: 'Class is required' });
    }
    if (!testName?.trim() || !testDate || !totalMarks) {
      return res.status(400).json({ success: false, message: 'Test name, date and total marks are required' });
    }
    if (!marks?.length) {
      return res.status(400).json({ success: false, message: 'Add marks for at least one student' });
    }

    const classStudents = await Student.find({ isActive: true, className: className.trim() });
    const allowedIds = new Set(classStudents.map((s) => s._id.toString()));

    for (const row of marks) {
      if (!allowedIds.has(row.studentId)) {
        return res.status(400).json({
          success: false,
          message: 'All students must belong to the selected class',
        });
      }
      if (row.obtainedMarks > totalMarks) {
        return res.status(400).json({
          success: false,
          message: 'Obtained marks cannot exceed total marks',
        });
      }
    }

    const test = await Test.create({
      name: testName.trim(),
      className: className.trim(),
      date: new Date(testDate),
      totalMarks: Number(totalMarks),
      type: type || 'monthly',
      isPublished: true,
    });

    const results = [];
    for (const row of marks) {
      const obtained = Number(row.obtainedMarks);
      const mark = await Mark.findOneAndUpdate(
        { studentId: row.studentId, testId: test._id },
        {
          studentId: row.studentId,
          testId: test._id,
          className: className.trim(),
          obtainedMarks: obtained,
          totalMarks: Number(totalMarks),
          percentage: pct(obtained, Number(totalMarks)),
          teacherRemarks: row.teacherRemarks,
          uploadedBy: req.user._id,
        },
        { upsert: true, new: true }
      );
      results.push(mark);
    }

    await assignRanks(test._id, className.trim());

    const studentIds = marks.map((m) => m.studentId);
    const parents = await Parent.find({ students: { $in: studentIds } });
    for (const p of parents) {
      if (p.userId) {
        await Notification.create({
          userId: p.userId,
          type: 'marks_uploaded',
          title: 'New Marks Uploaded',
          message: `${testName} (${className}) results published.`,
          link: '/parent/performance',
        });
      }
    }

    res.status(201).json({ success: true, data: { test, marks: results } });
  } catch (err) {
    next(err);
  }
}

export async function getStudentPerformance(req, res, next) {
  try {
    const { studentId } = req.params;
    if (req.user.role === 'parent' && !req.parentStudentIds.includes(studentId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const student = await Student.findById(studentId);
    const className = student?.className;

    const marks = await Mark.find({ studentId })
      .populate('testId', 'name date type totalMarks className')
      .sort({ createdAt: 1 });

    const classMarks = className
      ? marks.filter((m) => m.className === className || m.testId?.className === className)
      : marks;

    const enriched = classMarks.map((m, i) => {
      const percentage = markPercentage(m);
      const prev = classMarks[i - 1];
      const analysis = analyzePerformance(percentage, prev ? markPercentage(prev) : undefined);
      return {
        ...m.toObject(),
        percentage,
        obtainedMarks: m.obtainedMarks ?? m.subjects?.reduce((s, x) => s + x.marks, 0),
        totalMarks: m.totalMarks ?? m.testId?.totalMarks,
        delta: analysis.delta,
        label: analysis.label,
        labelDisplay: LABEL_DISPLAY[analysis.label],
      };
    });

    res.json({ success: true, data: enriched, className });
  } catch (err) {
    next(err);
  }
}

export async function performanceAnalytics(req, res, next) {
  try {
    const { className, testId, sort = 'topper', order = 'desc' } = req.query;

    if (!className?.trim()) {
      return res.status(400).json({ success: false, message: 'Select a class to view performance' });
    }

    const cn = className.trim();
    const test = testId
      ? await Test.findOne({ _id: testId, className: cn })
      : await Test.findOne({ className: cn, isPublished: true }).sort({ date: -1 });

    if (!test) return res.json({ success: true, data: [], meta: { className: cn, test: null } });

    const prevTest = await Test.findOne({
      className: cn,
      date: { $lt: test.date },
      isPublished: true,
    }).sort({ date: -1 });

    const currentMarks = await Mark.find({ testId: test._id, className: cn }).populate(
      'studentId',
      'name admissionNo className'
    );

    const results = [];
    for (const m of currentMarks) {
      const currentPercentage = markPercentage(m);
      let prevPct;
      if (prevTest) {
        const prevMark = await Mark.findOne({ studentId: m.studentId, testId: prevTest._id, className: cn });
        prevPct = prevMark ? markPercentage(prevMark) : undefined;
      }
      const analysis = analyzePerformance(currentPercentage, prevPct);
      results.push({
        student: m.studentId,
        obtainedMarks: m.obtainedMarks,
        totalMarks: m.totalMarks ?? test.totalMarks,
        currentPercentage,
        previousPercentage: prevPct,
        delta: analysis.delta,
        label: analysis.label,
        labelDisplay: LABEL_DISPLAY[analysis.label],
        rankInClass: m.rankInClass,
        teacherRemarks: m.teacherRemarks,
      });
    }

    if (sort === 'improvement') {
      results.sort((a, b) => (order === 'asc' ? a.delta - b.delta : b.delta - a.delta));
    } else {
      results.sort((a, b) =>
        order === 'asc' ? a.currentPercentage - b.currentPercentage : b.currentPercentage - a.currentPercentage
      );
    }

    res.json({
      success: true,
      data: results,
      meta: { className: cn, test, prevTest },
    });
  } catch (err) {
    next(err);
  }
}

export async function classReport(req, res, next) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const marks = await Mark.find({ testId, className: test.className })
      .populate('studentId', 'name admissionNo className')
      .sort({ percentage: -1 });
    res.json({ success: true, data: marks, meta: { test } });
  } catch (err) {
    next(err);
  }
}
