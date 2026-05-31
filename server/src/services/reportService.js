import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Fee from '../models/Fee.js';
import Mark from '../models/Mark.js';
import Student from '../models/Student.js';
import { computeFeeStatus } from '../utils/feeStatus.js';
import { LABEL_DISPLAY } from '../utils/performance.js';

export function streamPDF(res, filename, buildFn) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  buildFn(doc);
  doc.end();
}

export async function generateFeeReportPDF(res, filters = {}) {
  let query = {};
  if (filters.classId) {
    const ids = await Student.find({ classId: filters.classId }).distinct('_id');
    query.studentId = { $in: ids };
  }
  const fees = await Fee.find(query).populate('studentId', 'name admissionNo').sort({ dueDate: -1 });

  streamPDF(res, 'fee-report.pdf', (doc) => {
    doc.fontSize(20).text('Nishant Coaching Classes', { align: 'center' });
    doc.fontSize(14).text('Fee Report', { align: 'center' });
    doc.moveDown();
    fees.forEach((f) => {
      const status = computeFeeStatus(f);
      doc.fontSize(10).text(
        `${f.studentId?.name} | ₹${f.amount} | Due: ${new Date(f.dueDate).toLocaleDateString()} | ${status.toUpperCase()}`
      );
    });
  });
}

export async function generateFeeReportExcel(res, filters = {}) {
  let query = {};
  if (filters.classId) {
    const ids = await Student.find({ classId: filters.classId }).distinct('_id');
    query.studentId = { $in: ids };
  }
  const fees = await Fee.find(query).populate('studentId', 'name admissionNo');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Fees');
  sheet.columns = [
    { header: 'Student', key: 'student', width: 25 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Receipt', key: 'receipt', width: 15 },
  ];
  fees.forEach((f) => {
    sheet.addRow({
      student: f.studentId?.name,
      amount: f.amount,
      dueDate: new Date(f.dueDate).toLocaleDateString(),
      status: computeFeeStatus(f),
      receipt: f.receiptNo || '-',
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=fee-report.xlsx');
  await workbook.xlsx.write(res);
}

export async function generateReportCardPDF(res, studentId) {
  const student = await Student.findById(studentId).populate('classId', 'name');
  const marks = await Mark.find({ studentId })
    .populate('testId', 'name date totalMarks className')
    .sort({ createdAt: -1 })
    .limit(1);

  const latest = marks[0];
  const classLabel = student.className || student.classId?.name || '—';
  const obtained = latest?.obtainedMarks;
  const total = latest?.totalMarks ?? latest?.testId?.totalMarks;
  const pct =
    latest?.percentage ??
    (obtained != null && total ? Number(((obtained / total) * 100).toFixed(2)) : null);

  streamPDF(res, `report-card-${student.admissionNo}.pdf`, (doc) => {
    doc.fontSize(22).text('Nishant Coaching Classes', { align: 'center' });
    doc.fontSize(16).text('Student Report Card', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${student.name}`);
    doc.text(`Class: ${classLabel}`);
    doc.text(`Admission No: ${student.admissionNo}`);
    doc.moveDown();
    if (latest) {
      doc.text(`Test: ${latest.testId?.name}`);
      doc.text(`Date: ${new Date(latest.testId?.date).toLocaleDateString()}`);
      if (obtained != null && total) {
        doc.text(`Marks: ${obtained} / ${total} (${pct}%)`);
      } else if (pct != null) {
        doc.text(`Overall: ${pct}%`);
      }
      doc.text(`Rank in class: ${latest.rankInClass ?? '—'}`);
      doc.moveDown();
      if (latest.subjects?.length) {
        latest.subjects.forEach((s) => {
          doc.text(`${s.name}: ${s.marks}/${s.maxMarks}`);
        });
      }
      if (latest.teacherRemarks) {
        doc.moveDown().text(`Remarks: ${latest.teacherRemarks}`);
      }
    } else {
      doc.text('No marks recorded yet.');
    }
  });
}

export async function generateReceiptPDF(res, feeId) {
  const fee = await Fee.findById(feeId).populate('studentId', 'name admissionNo');
  if (!fee?.paidDate) throw new Error('Fee not paid');

  streamPDF(res, `receipt-${fee.receiptNo}.pdf`, (doc) => {
    doc.fontSize(22).text('Nishant Coaching Classes', { align: 'center' });
    doc.fontSize(14).text('Fee Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Receipt No: ${fee.receiptNo}`);
    doc.text(`Student: ${fee.studentId?.name}`);
    doc.text(`Amount: ₹${fee.amount}`);
    doc.text(`Paid on: ${new Date(fee.paidDate).toLocaleDateString()}`);
    doc.text(`Mode: ${fee.paymentMode || 'N/A'}`);
  });
}
