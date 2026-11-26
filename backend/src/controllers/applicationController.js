import { query, withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { createNotification } from '../utils/notifications.js';
import { getStudentProfileByUserId } from './studentController.js';
import { isEligible } from '../utils/eligibility.js';

const STATUSES = [
  'APPLIED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED',
  'WITHDRAWN'
];

const RECRUITER_STATUSES = [
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED'
];

function applicationSelect() {
  return `SELECT a.*, j.title, j.location, j.employment_type, j.status AS job_status,
                 c.name AS company_name, sp.full_name AS student_name, sp.department,
                 sp.graduation_year, sp.cgpa, sp.skills, sp.resume_url, sp.linkedin_url,
                 sp.github_url, u.email AS student_email, j.recruiter_id
          FROM applications a
          JOIN jobs j ON j.id = a.job_id
          JOIN companies c ON c.id = j.company_id
          JOIN student_profiles sp ON sp.id = a.student_id
          JOIN users u ON u.id = sp.user_id`;
}

export const applyToJob = asyncHandler(async (req, res) => {
  const student = await getStudentProfileByUserId(req.user.id);
  if (!student) throw notFound('Student profile not found');

  const result = await withTransaction(async (client) => {
    const jobRes = await client.query(
      `SELECT j.*, rp.approval_status, rp.user_id AS recruiter_user_id, c.name AS company_name
       FROM jobs j
       JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
       JOIN companies c ON c.id = j.company_id
       WHERE j.id = $1
       FOR UPDATE`,
      [req.params.jobId || req.body.jobId]
    );
    const job = jobRes.rows[0];
    if (!job) throw notFound('Job not found');
    if (job.status !== 'OPEN' || new Date(job.application_deadline) < new Date()) {
      throw badRequest('This job is closed or the application deadline has passed');
    }
    if (job.approval_status !== 'APPROVED') throw forbidden('Job is not available');
    if (!isEligible(job, student)) {
      throw forbidden('You do not meet the eligibility criteria for this role');
    }

    const duplicate = await client.query(
      `SELECT id FROM applications WHERE job_id = $1 AND student_id = $2`,
      [job.id, student.id]
    );
    if (duplicate.rowCount) throw conflict('You have already applied to this job');

    const inserted = await client.query(
      `INSERT INTO applications (job_id, student_id, cover_letter)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [job.id, student.id, req.body.coverLetter || null]
    );
    const application = inserted.rows[0];
    await client.query(
      `INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, note)
       VALUES ($1, NULL, 'APPLIED', $2, 'Student applied')`,
      [application.id, req.user.id]
    );
    await createNotification(client, {
      userId: job.recruiter_user_id,
      title: 'New application received',
      message: `${student.full_name} applied for ${job.title}.`,
      link: `/recruiter/jobs/${job.id}/applicants`
    });
    return application;
  });

  res.status(201).json({ application: result });
});

export const myApplications = asyncHandler(async (req, res) => {
  const student = await getStudentProfileByUserId(req.user.id);
  const { page, limit, offset } = parsePagination(req.query);
  const params = [student.id];
  let where = 'WHERE a.student_id = $1';
  if (req.query.status) {
    params.push(req.query.status);
    where += ` AND a.status = $${params.length}`;
  }
  const count = await query(`SELECT COUNT(*)::int AS total FROM applications a ${where}`, params);
  params.push(limit, offset);
  const { rows } = await query(
    `${applicationSelect()} ${where} ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(paginated(rows, count.rows[0].total, page, limit));
});

export const getApplication = asyncHandler(async (req, res) => {
  const { rows } = await query(`${applicationSelect()} WHERE a.id = $1`, [req.params.id]);
  const application = rows[0];
  if (!application) throw notFound('Application not found');

  if (req.user.role === 'STUDENT') {
    const student = await getStudentProfileByUserId(req.user.id);
    if (application.student_id !== student.id) throw forbidden();
  } else if (req.user.role === 'RECRUITER') {
    const recruiter = await query('SELECT id FROM recruiter_profiles WHERE user_id = $1', [req.user.id]);
    if (application.recruiter_id !== recruiter.rows[0]?.id) throw forbidden();
  }

  const history = await query(
    `SELECT h.*, u.email AS changed_by_email
     FROM application_status_history h
     LEFT JOIN users u ON u.id = h.changed_by
     WHERE h.application_id = $1
     ORDER BY h.created_at ASC`,
    [application.id]
  );
  res.json({ application, history: history.rows });
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const student = await getStudentProfileByUserId(req.user.id);
  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT * FROM applications WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const application = rows[0];
    if (!application) throw notFound('Application not found');
    if (application.student_id !== student.id) throw forbidden();
    if (['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
      throw badRequest('This application can no longer be withdrawn');
    }
    const next = await client.query(
      `UPDATE applications SET status = 'WITHDRAWN' WHERE id = $1 RETURNING *`,
      [application.id]
    );
    await client.query(
      `INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, 'WITHDRAWN', $3, 'Withdrawn by student')`,
      [application.id, application.status, req.user.id]
    );
    return next.rows[0];
  });
  res.json({ application: updated });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note, interviewAt } = req.body;
  if (!RECRUITER_STATUSES.includes(status)) {
    throw badRequest(`Status must be one of: ${RECRUITER_STATUSES.join(', ')}`);
  }

  const recruiter = await query(
    `SELECT * FROM recruiter_profiles WHERE user_id = $1`,
    [req.user.id]
  );
  if (!recruiter.rowCount || recruiter.rows[0].approval_status !== 'APPROVED') {
    throw forbidden('Approved recruiter access required');
  }

  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `${applicationSelect()} WHERE a.id = $1`,
      [req.params.id]
    );
    const application = rows[0];
    if (!application) throw notFound('Application not found');
    if (application.recruiter_id !== recruiter.rows[0].id) throw forbidden();

    const next = await client.query(
      `UPDATE applications
       SET status = $1, recruiter_note = COALESCE($2, recruiter_note), interview_at = COALESCE($3, interview_at)
       WHERE id = $4
       RETURNING *`,
      [status, note || null, interviewAt || null, application.id]
    );

    await client.query(
      `INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [application.id, application.status, status, req.user.id, note || null]
    );

    const studentUser = await client.query(
      `SELECT user_id FROM student_profiles WHERE id = $1`,
      [application.student_id]
    );
    await createNotification(client, {
      userId: studentUser.rows[0].user_id,
      title: 'Application status updated',
      message: `Your application for ${application.title} at ${application.company_name} is now ${status.replace(/_/g, ' ').toLowerCase()}.`,
      link: `/student/applications/${application.id}`
    });
    return next.rows[0];
  });

  res.json({ application: updated });
});

export const listJobApplicants = asyncHandler(async (req, res) => {
  const recruiter = await query('SELECT id FROM recruiter_profiles WHERE user_id = $1', [req.user.id]);
  const job = await query('SELECT * FROM jobs WHERE id = $1', [req.params.jobId]);
  if (!job.rowCount) throw notFound('Job not found');
  if (req.user.role === 'RECRUITER' && job.rows[0].recruiter_id !== recruiter.rows[0]?.id) {
    throw forbidden();
  }

  const { page, limit, offset } = parsePagination(req.query);
  const params = [req.params.jobId];
  let where = 'WHERE a.job_id = $1';
  if (req.query.status) {
    params.push(req.query.status);
    where += ` AND a.status = $${params.length}`;
  }
  const count = await query(`SELECT COUNT(*)::int AS total FROM applications a ${where}`, params);
  params.push(limit, offset);
  const { rows } = await query(
    `${applicationSelect()} ${where} ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ job: job.rows[0], ...paginated(rows, count.rows[0].total, page, limit) });
});

export { STATUSES, applicationSelect };
