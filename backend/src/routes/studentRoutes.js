import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDashboard, getProfile, updateProfile } from '../controllers/studentController.js';
import { myApplications } from '../controllers/applicationController.js';

const router = Router();
router.use(authenticate, authorize('STUDENT'));
router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/applications', myApplications);
export default router;
