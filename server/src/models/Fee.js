import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paidDate: Date,
    status: {
      type: String,
      enum: ['paid', 'due_soon', 'overdue', 'pending'],
      default: 'pending',
    },
    month: { type: String, required: true },
    receiptNo: String,
    paymentMode: String,
    remarks: String,
  },
  { timestamps: true }
);

feeSchema.index({ studentId: 1, month: 1 }, { unique: true });
feeSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model('Fee', feeSchema);
