import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/syllabusController.js';

const router = Router();

router.use(authenticate, authorize('admin'));
router.get('/', ctrl.listSyllabus);
router.post('/', ctrl.createSyllabus);
router.put('/:id', ctrl.updateSyllabus);
router.delete('/:id', ctrl.deleteSyllabus);

export default router;
