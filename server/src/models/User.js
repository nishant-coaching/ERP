import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'parent'], required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    refreshTokenHash: { type: String, select: false },
    rememberMe: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

// userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
