import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/notificationController.js';

const router = Router();

router.use(authenticate);
router.get('/', ctrl.listNotifications);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);
router.get('/announcements', ctrl.listAnnouncements);
router.post('/announcements', authorize('admin'), ctrl.createAnnouncement);

export default router;
