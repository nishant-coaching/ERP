import { Router } from 'express';
import { authenticate, authorize, parentStudentGuard } from '../middleware/auth.js';
import * as ctrl from '../controllers/feeController.js';

const router = Router();

router.use(authenticate);
router.get('/', parentStudentGuard, ctrl.listFees);
router.get('/analytics', authorize('admin'), ctrl.feeAnalytics);
router.post('/', authorize('admin'), ctrl.createFee);
router.patch('/:id/pay', authorize('admin'), ctrl.markPaid);
router.post('/reminders', authorize('admin'), ctrl.sendFeeReminders);

export default router;
