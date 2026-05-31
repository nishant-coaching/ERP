import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    marks: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
  },
  { _id: false }
);

const markSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    className: { type: String, required: true, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    obtainedMarks: { type: Number, min: 0 },
    totalMarks: { type: Number, min: 1 },
    subjects: [subjectSchema],
    percentage: Number,
    rankInClass: Number,
    teacherRemarks: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

markSchema.index({ studentId: 1, testId: 1 }, { unique: true });
markSchema.index({ testId: 1, className: 1, percentage: -1 });

export default mongoose.model('Mark', markSchema);
