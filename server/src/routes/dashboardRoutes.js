import { Router } from 'express';
import { authenticate, authorize, parentStudentGuard } from '../middleware/auth.js';
import { adminOverview, parentOverview } from '../controllers/dashboardController.js';

const router = Router();

router.get('/admin', authenticate, authorize('admin'), adminOverview);
router.get('/parent', authenticate, authorize('parent'), parentStudentGuard, parentOverview);

export default router;
