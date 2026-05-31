import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    address: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Parent', parentSchema);
