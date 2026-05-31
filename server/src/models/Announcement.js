import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetRoles: [{ type: String, enum: ['admin', 'parent'] }],
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Announcement', announcementSchema);
