import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { closeJob, createJob, deleteJob, getJob, listJobs, recruiterJobs, updateJob } from '../controllers/jobController.js';
import { applyToJob, listJobApplicants } from '../controllers/applicationController.js';

const router = Router();
router.get('/', optionalAuth, listJobs);
router.get('/mine', authenticate, authorize('RECRUITER'), recruiterJobs);
router.get('/:id', optionalAuth, getJob);
router.post('/', authenticate, authorize('RECRUITER'), createJob);
router.put('/:id', authenticate, authorize('RECRUITER'), updateJob);
router.patch('/:id/close', authenticate, authorize('RECRUITER', 'ADMIN'), closeJob);
router.delete('/:id', authenticate, authorize('RECRUITER'), deleteJob);
router.post('/:jobId/apply', authenticate, authorize('STUDENT'), applyToJob);
router.get('/:jobId/applicants', authenticate, authorize('RECRUITER', 'ADMIN'), listJobApplicants);
export default router;
