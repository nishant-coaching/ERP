import { Router } from 'express';
import { authenticate, authorize, parentStudentGuard } from '../middleware/auth.js';
import * as ctrl from '../controllers/reportController.js';

const router = Router();

router.get('/summary', authenticate, authorize('admin'), ctrl.getClassSummary);
router.get('/:type', authenticate, parentStudentGuard, ctrl.exportReport);

export default router;
