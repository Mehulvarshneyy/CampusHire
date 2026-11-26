import { query, withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { createNotification } from '../utils/notifications.js';
import { applicationSelect } from './applicationController.js';

export const getAdminOverview = asyncHandler(async (_req, res) => {
  const totals = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'STUDENT') AS students,
      (SELECT COUNT(*)::int FROM users WHERE role = 'RECRUITER') AS recruiters,
      (SELECT COUNT(*)::int FROM companies) AS companies,
      (SELECT COUNT(*)::int FROM jobs) AS jobs,
      (SELECT COUNT(*)::int FROM applications) AS applications,
      (SELECT COUNT(DISTINCT student_id)::int FROM applications WHERE status = 'SELECTED') AS placed_students
  `);

  const applicationsOverTime = await query(`
    SELECT DATE(created_at) AS day, COUNT(*)::int AS count
    FROM applications
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day
  `);

  const placementsByDepartment = await query(`
    SELECT COALESCE(sp.department, 'Unspecified') AS department, COUNT(*)::int AS count
    FROM applications a
    JOIN student_profiles sp ON sp.id = a.student_id
    WHERE a.status = 'SELECTED'
    GROUP BY 1
    ORDER BY count DESC
  `);

  const companyHiring = await query(`
    SELECT c.name, COUNT(*)::int AS hired
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.status = 'SELECTED'
    GROUP BY c.name
    ORDER BY hired DESC
    LIMIT 8
  `);

  const statusDistribution = await query(`
    SELECT status, COUNT(*)::int AS count
    FROM applications
    GROUP BY status
    ORDER BY count DESC
  `);

  const placementRate = await query(`
    SELECT
      COUNT(DISTINCT sp.id)::int AS total_students,
      COUNT(DISTINCT a.student_id)::int AS placed
    FROM student_profiles sp
    LEFT JOIN applications a ON a.student_id = sp.id AND a.status = 'SELECTED'
  `);

  const pendingRecruiters = await query(`
    SELECT COUNT(*)::int AS pending FROM recruiter_profiles WHERE approval_status = 'PENDING'
  `);

  res.json({
    totals: totals.rows[0],
    pendingRecruiters: pendingRecruiters.rows[0].pending,
    applicationsOverTime: applicationsOverTime.rows,
    placementsByDepartment: placementsByDepartment.rows,
    companyHiring: companyHiring.rows,
    statusDistribution: statusDistribution.rows,
    placement: placementRate.rows[0]
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const params = [];
  const filters = [];
  if (req.query.role) {
    params.push(req.query.role);
    filters.push(`u.role = $${params.length}`);
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    filters.push(`(u.email ILIKE $${params.length} OR COALESCE(sp.full_name, rp.full_name, '') ILIKE $${params.length})`);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const count = await query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN recruiter_profiles rp ON rp.user_id = u.id
     ${where}`,
    params
  );
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT u.id, u.email, u.role, u.is_active, u.created_at,
            COALESCE(sp.full_name, rp.full_name, 'Administrator') AS full_name,
            rp.approval_status, c.name AS company_name, sp.department
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN recruiter_profiles rp ON rp.user_id = u.id
     LEFT JOIN companies c ON c.id = rp.company_id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(paginated(rows, count.rows[0].total, page, limit));
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE users SET is_active = $1 WHERE id = $2 AND role <> 'ADMIN' RETURNING id, email, is_active, role`,
    [Boolean(req.body.isActive), req.params.id]
  );
  if (!rows[0]) throw notFound('User not found');
  res.json({ user: rows[0] });
});

export const reviewRecruiter = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw badRequest('Status must be APPROVED or REJECTED');
  }

  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE recruiter_profiles
       SET approval_status = $1, reviewed_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [status, req.params.id]
    );
    if (!rows[0]) throw notFound('Recruiter not found');
    await createNotification(client, {
      userId: req.params.id,
      title: status === 'APPROVED' ? 'Recruiter account approved' : 'Recruiter account rejected',
      message:
        status === 'APPROVED'
          ? 'You can now publish jobs and review applicants.'
          : 'Your recruiter registration was not approved. Contact placement cell for details.',
      link: '/recruiter'
    });
    return rows[0];
  });
  res.json({ recruiter: updated });
});

export const listAllJobs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const params = [];
  const filters = [];
  if (req.query.status) {
    params.push(req.query.status);
    filters.push(`j.status = $${params.length}`);
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    filters.push(`(j.title ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const count = await query(
    `SELECT COUNT(*)::int AS total FROM jobs j JOIN companies c ON c.id = j.company_id ${where}`,
    params
  );
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT j.*, c.name AS company_name,
            (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) AS applicant_count
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     ${where}
     ORDER BY j.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(paginated(rows, count.rows[0].total, page, limit));
});

export const listAllApplications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const params = [];
  const filters = [];
  if (req.query.status) {
    params.push(req.query.status);
    filters.push(`a.status = $${params.length}`);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const count = await query(`SELECT COUNT(*)::int AS total FROM applications a ${where}`, params);
  params.push(limit, offset);
  const { rows } = await query(
    `${applicationSelect()} ${where} ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(paginated(rows, count.rows[0].total, page, limit));
});
