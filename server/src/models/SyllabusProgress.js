import mongoose from 'mongoose';

const syllabusProgressSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    currentChapter: { type: String, required: true, trim: true },
    totalChapters: { type: Number, required: true, min: 1 },
    completedChapters: { type: Number, required: true, min: 0, default: 0 },
    teacherName: { type: String, trim: true },
    notes: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

syllabusProgressSchema.index({ className: 1, subject: 1 }, { unique: true });

syllabusProgressSchema.virtual('completionPercent').get(function () {
  if (!this.totalChapters) return 0;
  return Math.min(100, Math.round((this.completedChapters / this.totalChapters) * 100));
});

syllabusProgressSchema.set('toJSON', { virtuals: true });
syllabusProgressSchema.set('toObject', { virtuals: true });

export default mongoose.model('SyllabusProgress', syllabusProgressSchema);
