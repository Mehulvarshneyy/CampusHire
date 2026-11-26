import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/httpError.js';

export const getRecruiterDashboard = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `     SELECT rp.*, c.name AS company_name, c.industry, c.location AS company_location, c.website,
            c.description AS company_description
     FROM recruiter_profiles rp
     LEFT JOIN companies c ON c.id = rp.company_id
     WHERE rp.user_id = $1`,
    [req.user.id]
  );
  const recruiter = rows[0];
  if (!recruiter) throw notFound('Recruiter profile not found');

  const stats = await query(
    `SELECT
       COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'OPEN')::int AS active_jobs,
       COUNT(a.id)::int AS total_applicants,
       COUNT(a.id) FILTER (WHERE a.status = 'SHORTLISTED')::int AS shortlisted,
       COUNT(a.id) FILTER (WHERE a.status = 'SELECTED')::int AS selected
     FROM recruiter_profiles rp
     LEFT JOIN jobs j ON j.recruiter_id = rp.id
     LEFT JOIN applications a ON a.job_id = j.id
     WHERE rp.id = $1`,
    [recruiter.id]
  );

  const recent = await query(
    `SELECT a.id, a.status, a.created_at, sp.full_name, j.title, c.name AS company_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN student_profiles sp ON sp.id = a.student_id
     WHERE j.recruiter_id = $1
     ORDER BY a.created_at DESC
     LIMIT 8`,
    [recruiter.id]
  );

  const activity = await query(
    `SELECT DATE(a.created_at) AS day, COUNT(*)::int AS count
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE j.recruiter_id = $1 AND a.created_at >= NOW() - INTERVAL '14 days'
     GROUP BY DATE(a.created_at)
     ORDER BY day`,
    [recruiter.id]
  );

  res.json({
    recruiter,
    stats: stats.rows[0],
    recentApplications: recent.rows,
    activity: activity.rows
  });
});

export const updateRecruiterProfile = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM recruiter_profiles WHERE user_id = $1', [req.user.id]);
  if (!existing.rowCount) throw notFound('Recruiter profile not found');

  const { rows } = await query(
    `UPDATE recruiter_profiles SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       designation = COALESCE($3, designation)
     WHERE user_id = $4
     RETURNING *`,
    [req.body.fullName, req.body.phone, req.body.designation, req.user.id]
  );

  if (req.body.companyName) {
    const company = await query(
      `INSERT INTO companies (name, industry, location, website, description)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (name) DO UPDATE SET
         industry = COALESCE(EXCLUDED.industry, companies.industry),
         location = COALESCE(EXCLUDED.location, companies.location),
         website = COALESCE(EXCLUDED.website, companies.website),
         description = COALESCE(EXCLUDED.description, companies.description)
       RETURNING id`,
      [
        req.body.companyName,
        req.body.industry || null,
        req.body.companyLocation || null,
        req.body.website || null,
        req.body.companyDescription || null
      ]
    );
    await query('UPDATE recruiter_profiles SET company_id = $1 WHERE user_id = $2', [
      company.rows[0].id,
      req.user.id
    ]);
  }

  const profile = await query(
    `SELECT rp.*, c.name AS company_name, c.industry, c.location AS company_location, c.website, c.description AS company_description
     FROM recruiter_profiles rp
     LEFT JOIN companies c ON c.id = rp.company_id
     WHERE rp.user_id = $1`,
    [req.user.id]
  );
  res.json({ recruiter: profile.rows[0] || rows[0] });
});
