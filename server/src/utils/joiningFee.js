import { computeFeeStatus } from './feeStatus.js';

/** Due date for a billing month based on the day-of-month from joining date */
export function getDueDateForMonth(joiningDate, year, monthIndex) {
  const joinDay = new Date(joiningDate).getDate();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(joinDay, daysInMonth);
  const due = new Date(year, monthIndex, day);
  due.setHours(0, 0, 0, 0);
  return due;
}

export function monthKeyFromDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function billingMonthStarted(joiningDate, year, monthIndex) {
  const join = new Date(joiningDate);
  const billingStart = new Date(year, monthIndex, 1);
  const joinMonthStart = new Date(join.getFullYear(), join.getMonth(), 1);
  return billingStart >= joinMonthStart;
}

const DEFAULT_FEE = Number(process.env.DEFAULT_MONTHLY_FEE) || 3500;

/**
 * Create the monthly fee record for a student if missing (due on joining day each month).
 */
export async function ensureStudentMonthlyFee(student, Fee, forDate = new Date()) {
  if (!student?.joiningDate) return null;

  const year = forDate.getFullYear();
  const monthIndex = forDate.getMonth();
  if (!billingMonthStarted(student.joiningDate, year, monthIndex)) return null;

  const month = monthKeyFromDate(forDate);
  const existing = await Fee.findOne({ studentId: student._id, month });
  if (existing) return existing;

  const dueDate = getDueDateForMonth(student.joiningDate, year, monthIndex);
  const amount = student.monthlyFeeAmount ?? DEFAULT_FEE;
  const fee = await Fee.create({
    studentId: student._id,
    amount,
    dueDate,
    month,
    status: 'pending',
  });
  fee.status = computeFeeStatus(fee);
  await fee.save();
  return fee;
}

/** Ensure current month fees exist for all active students with a joining date */
export async function ensureAllMonthlyFees(Student, Fee) {
  const students = await Student.find({ isActive: true, joiningDate: { $ne: null } });
  for (const student of students) {
    await ensureStudentMonthlyFee(student, Fee);
  }
}

export { DEFAULT_FEE };
