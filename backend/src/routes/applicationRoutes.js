import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getApplication,
  updateApplicationStatus,
  withdrawApplication
} from '../controllers/applicationController.js';

const router = Router();
router.get('/:id', authenticate, getApplication);
router.patch('/:id/withdraw', authenticate, authorize('STUDENT'), withdrawApplication);
router.patch('/:id/status', authenticate, authorize('RECRUITER'), updateApplicationStatus);
export default router;
