import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/httpError.js';
import { sanitizeStringArray } from '../utils/validate.js';

export async function getStudentProfileByUserId(userId) {
  const { rows } = await query(
    `SELECT sp.*, u.email
     FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     WHERE sp.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) throw notFound('Student profile not found');
  res.json({ profile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) throw notFound('Student profile not found');

  const skills = sanitizeStringArray(req.body.skills ?? profile.skills);
  const { rows } = await query(
    `UPDATE student_profiles SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       college = COALESCE($3, college),
       department = COALESCE($4, department),
       graduation_year = COALESCE($5, graduation_year),
       cgpa = COALESCE($6, cgpa),
       skills = $7,
       resume_url = COALESCE($8, resume_url),
       linkedin_url = COALESCE($9, linkedin_url),
       github_url = COALESCE($10, github_url)
     WHERE user_id = $11
     RETURNING *`,
    [
      req.body.fullName,
      req.body.phone,
      req.body.college,
      req.body.department,
      req.body.graduationYear ? Number(req.body.graduationYear) : null,
      req.body.cgpa !== undefined && req.body.cgpa !== '' ? Number(req.body.cgpa) : null,
      skills,
      req.body.resumeUrl,
      req.body.linkedinUrl,
      req.body.githubUrl,
      req.user.id
    ]
  );
  res.json({ profile: rows[0] });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) throw notFound('Student profile not found');

  const counts = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status IN ('APPLIED','UNDER_REVIEW','INTERVIEW_SCHEDULED'))::int AS pending,
       COUNT(*) FILTER (WHERE status = 'SHORTLISTED')::int AS shortlisted,
       COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
       COUNT(*) FILTER (WHERE status = 'SELECTED')::int AS selected
     FROM applications WHERE student_id = $1`,
    [profile.id]
  );

  const recentJobs = await query(
    `SELECT j.id, j.title, j.location, j.employment_type, j.salary_min, j.salary_max,
            j.application_deadline, j.created_at, c.name AS company_name
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
     WHERE j.status = 'OPEN' AND j.application_deadline >= NOW() AND rp.approval_status = 'APPROVED'
     ORDER BY j.created_at DESC
     LIMIT 5`
  );

  const activity = await query(
    `SELECT a.id, a.status, a.updated_at, j.title, c.name AS company_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.student_id = $1
     ORDER BY a.updated_at DESC
     LIMIT 8`,
    [profile.id]
  );

  res.json({
    profile,
    stats: counts.rows[0],
    recentJobs: recentJobs.rows,
    activity: activity.rows
  });
});
