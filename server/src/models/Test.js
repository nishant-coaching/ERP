import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    className: { type: String, required: true, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    date: { type: Date, required: true },
    totalMarks: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['unit', 'monthly', 'exam'], default: 'monthly' },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

testSchema.index({ className: 1, date: -1 });

export default mongoose.model('Test', testSchema);
