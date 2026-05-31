import { Router } from 'express';
import { authenticate, authorize, parentStudentGuard } from '../middleware/auth.js';
import * as ctrl from '../controllers/markController.js';

const router = Router();

router.use(authenticate);
router.get('/class-names', authorize('admin'), ctrl.listClassNames);
router.get('/students/:className', authorize('admin'), ctrl.studentsByClass);
router.get('/tests', ctrl.listTests);
router.post('/entry', authorize('admin'), ctrl.addMarksEntry);
router.get('/analytics', authorize('admin'), ctrl.performanceAnalytics);
router.get('/class/:testId', authorize('admin'), ctrl.classReport);
router.get('/student/:studentId', parentStudentGuard, ctrl.getStudentPerformance);

export default router;
