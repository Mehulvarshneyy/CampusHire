import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAdminOverview,
  listAllApplications,
  listAllJobs,
  listUsers,
  reviewRecruiter,
  setUserActive
} from '../controllers/adminController.js';
import { closeJob } from '../controllers/jobController.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));
router.get('/overview', getAdminOverview);
router.get('/users', listUsers);
router.patch('/users/:id/active', setUserActive);
router.patch('/recruiters/:id/review', reviewRecruiter);
router.get('/jobs', listAllJobs);
router.patch('/jobs/:id/close', closeJob);
router.get('/applications', listAllApplications);
export default router;
