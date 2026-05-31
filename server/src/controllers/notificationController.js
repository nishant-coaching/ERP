import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import Parent from '../models/Parent.js';

export async function listNotifications(req, res, next) {
  try {
    const filter = { userId: req.user._id };
    if (req.query.unread === 'true') filter.read = false;
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const roles = req.body.targetRoles || ['parent', 'admin'];
    const users = await User.find({ role: { $in: roles }, isActive: true });

    for (const u of users) {
      await Notification.create({
        userId: u._id,
        type: 'announcement',
        title: announcement.title,
        message: announcement.body.slice(0, 120),
        link: u.role === 'admin' ? '/admin' : '/parent',
      });
    }

    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
}

export async function listAnnouncements(req, res, next) {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}
