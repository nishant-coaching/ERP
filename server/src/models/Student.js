import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    admissionNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    className: { type: String, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
    joiningDate: { type: Date },
    monthlyFeeAmount: { type: Number, min: 0 },
    contact: {
      phone: String,
      email: String,
      address: String,
    },
    profileImage: String,
    dateOfBirth: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ name: 'text', admissionNo: 'text' });
studentSchema.index({ className: 1 });

export default mongoose.model('Student', studentSchema);
