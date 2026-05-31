import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    academicYear: { type: String, default: '2025-26' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

batchSchema.index({ classId: 1 });

export default mongoose.model('Batch', batchSchema);
