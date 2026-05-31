import Test from '../models/Test.js';
import Mark from '../models/Mark.js';
import { analyzePerformance, LABEL_DISPLAY } from '../utils/performance.js';
import {
  generateReportCardPDF,
  generateReceiptPDF,
} from '../services/reportService.js';

function markPercentage(m, testTotal) {
  if (m.obtainedMarks != null && (m.totalMarks || testTotal)) {
    const total = m.totalMarks || testTotal;
    return total ? Number(((m.obtainedMarks / total) * 100).toFixed(2)) : 0;
  }
  if (m.percentage != null) return m.percentage;
  if (m.subjects?.length) {
    const obtained = m.subjects.reduce((s, x) => s + x.marks, 0);
    const total = m.subjects.reduce((s, x) => s + x.maxMarks, 0);
    return total ? Number(((obtained / total) * 100).toFixed(2)) : 0;
  }
  return 0;
}

/** Class-wise student marks summary for Reports page */
export async function getClassSummary(req, res, next) {
  try {
    const { className } = req.query;
    if (!className?.trim()) {
      return res.status(400).json({ success: false, message: 'Select a class' });
    }

    const cn = className.trim();
    const test = await Test.findOne({ className: cn, isPublished: true }).sort({ date: -1 });
    if (!test) {
      return res.json({
        success: true,
        data: {
          className: cn,
          test: null,
          allMarks: [],
          topPerformers: [],
          needsAttention: [],
        },
      });
    }

    const prevTest = await Test.findOne({
      className: cn,
      date: { $lt: test.date },
      isPublished: true,
    }).sort({ date: -1 });

    const marks = await Mark.find({ testId: test._id, className: cn }).populate(
      'studentId',
      'name admissionNo className'
    );

    const allMarks = [];
    for (const m of marks) {
      const percentage = markPercentage(m, test.totalMarks);
      let prevPct;
      if (prevTest) {
        const prevMark = await Mark.findOne({ studentId: m.studentId, testId: prevTest._id, className: cn });
        prevPct = prevMark ? markPercentage(prevMark, prevTest.totalMarks) : undefined;
      }
      const analysis = analyzePerformance(percentage, prevPct);
      allMarks.push({
        student: m.studentId,
        obtainedMarks: m.obtainedMarks,
        totalMarks: m.totalMarks ?? test.totalMarks,
        percentage,
        rankInClass: m.rankInClass,
        label: analysis.label,
        labelDisplay: LABEL_DISPLAY[analysis.label],
        delta: analysis.delta,
        teacherRemarks: m.teacherRemarks,
      });
    }

    allMarks.sort((a, b) => b.percentage - a.percentage);

    const topPerformers = allMarks.slice(0, 5);

    let needsAttention = allMarks.filter(
      (m) =>
        m.label === 'needs_attention' ||
        m.percentage < 55 ||
        (m.delta != null && m.delta <= -5)
    );
    if (needsAttention.length === 0) {
      needsAttention = [...allMarks].reverse().slice(0, 3);
    }

    res.json({
      success: true,
      data: {
        className: cn,
        test: {
          _id: test._id,
          name: test.name,
          date: test.date,
          totalMarks: test.totalMarks,
        },
        allMarks,
        topPerformers: topPerformers.slice(0, 5),
        needsAttention: needsAttention.slice(0, 8),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportReport(req, res, next) {
  try {
    const { type } = req.params;
    const format = req.query.format || 'pdf';
    const { studentId, feeId } = req.query;

    if (type === 'fees') {
      return res.status(404).json({ success: false, message: 'Fee reports are not available in this section' });
    }
    if (type === 'report-card' && studentId) {
      if (req.user.role === 'parent' && !req.parentStudentIds?.includes(studentId)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      return generateReportCardPDF(res, studentId);
    }
    if (type === 'receipt' && feeId) {
      return generateReceiptPDF(res, feeId);
    }
    res.status(400).json({ success: false, message: 'Invalid report type' });
  } catch (err) {
    next(err);
  }
}
