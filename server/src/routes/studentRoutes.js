import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/studentController.js';

const router = Router();

router.get('/class-names', authenticate, authorize('admin'), ctrl.listClassNames);
router.get('/classes', authenticate, ctrl.listClasses);
router.get('/parents', authenticate, authorize('admin'), ctrl.listParents);
router.get('/', authenticate, authorize('admin'), ctrl.listStudents);
router.get('/:id', authenticate, authorize('admin'), ctrl.getStudent);
router.post('/', authenticate, authorize('admin'), ctrl.createStudent);
router.put('/:id', authenticate, authorize('admin'), ctrl.updateStudent);
router.delete('/:id', authenticate, authorize('admin'), ctrl.deleteStudent);

export default router;
