import cron from 'node-cron';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import Parent from '../models/Parent.js';
import { computeFeeStatus, refreshAllFeeStatuses } from '../utils/feeStatus.js';
import { ensureAllMonthlyFees } from '../utils/joiningFee.js';

export function startFeeCron() {
  // Daily at 8 AM — generate monthly fees from joining dates, refresh status, send reminders
  cron.schedule('0 8 * * *', async () => {
    try {
      await ensureAllMonthlyFees(Student, Fee);
      await refreshAllFeeStatuses(Fee);

      const fees = await Fee.find({ paidDate: null }).populate('studentId', 'name joiningDate');
      for (const fee of fees) {
        const status = computeFeeStatus(fee);
        fee.status = status;
        await fee.save();

        if (status !== 'due_soon' && status !== 'overdue') continue;

        const parent = await Parent.findOne({ students: fee.studentId._id });
        if (!parent?.userId) continue;

        const exists = await Notification.findOne({
          userId: parent.userId,
          type: 'fee_due',
          message: new RegExp(fee._id.toString()),
          createdAt: { $gte: new Date(Date.now() - 86400000) },
        });
        if (exists) continue;

        const dueStr = new Date(fee.dueDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });

        await Notification.create({
          userId: parent.userId,
          type: 'fee_due',
          title: status === 'overdue' ? 'Fee Overdue' : 'Fee Due Soon',
          message: `₹${fee.amount} fee for ${fee.studentId.name} is due on ${dueStr} (monthly on joining date).`,
          link: '/parent/fees',
        });
      }
      console.log('Fee cron completed');
    } catch (e) {
      console.error('Fee cron error', e);
    }
  });
}
