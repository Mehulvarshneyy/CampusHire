import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getRecruiterDashboard, updateRecruiterProfile } from '../controllers/recruiterController.js';

const router = Router();
router.use(authenticate, authorize('RECRUITER'));
router.get('/dashboard', getRecruiterDashboard);
router.put('/profile', updateRecruiterProfile);
export default router;
