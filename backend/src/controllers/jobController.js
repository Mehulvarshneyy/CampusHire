import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { requireFields, sanitizeIntArray, sanitizeStringArray } from '../utils/validate.js';
import { getStudentProfileByUserId } from './studentController.js';
import { isEligible } from '../utils/eligibility.js';

function jobSelect() {
  return `SELECT j.*, c.name AS company_name, c.website AS company_website,
                 c.industry AS company_industry, c.location AS company_location,
                 c.description AS company_description, rp.full_name AS recruiter_name,
                 (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) AS applicant_count
          FROM jobs j
          JOIN companies c ON c.id = j.company_id
          JOIN recruiter_profiles rp ON rp.id = j.recruiter_id`;
}

async function expireOpenJobs() {
  await query(
    `UPDATE jobs SET status = 'EXPIRED'
     WHERE status = 'OPEN' AND application_deadline < NOW()`
  );
}

export const listJobs = asyncHandler(async (req, res) => {
  await expireOpenJobs();
  const { page, limit, offset } = parsePagination(req.query);
  const filters = ['rp.approval_status = \'APPROVED\''];
  const params = [];

  if (req.query.includeClosed !== 'true') {
    filters.push(`j.status = 'OPEN'`);
    filters.push(`j.application_deadline >= NOW()`);
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    filters.push(`(j.title ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }
  if (req.query.location) {
    params.push(`%${req.query.location}%`);
    filters.push(`j.location ILIKE $${params.length}`);
  }
  if (req.query.employmentType) {
    params.push(req.query.employmentType);
    filters.push(`j.employment_type = $${params.length}`);
  }
  if (req.query.company) {
    params.push(`%${req.query.company}%`);
    filters.push(`c.name ILIKE $${params.length}`);
  }
  if (req.query.minSalary) {
    params.push(Number(req.query.minSalary));
    filters.push(`COALESCE(j.salary_max, j.salary_min, 0) >= $${params.length}`);
  }
  if (req.query.eligible === 'true' && req.user?.role === 'STUDENT') {
    const student = await getStudentProfileByUserId(req.user.id);
    if (student) {
      params.push(student.department || '');
      filters.push(
        `(cardinality(j.eligible_departments) = 0 OR $${params.length} = ANY (j.eligible_departments))`
      );
      params.push(Number(student.graduation_year || 0));
      filters.push(
        `(cardinality(j.eligible_graduation_years) = 0 OR $${params.length} = ANY (j.eligible_graduation_years))`
      );
      params.push(Number(student.cgpa || 0));
      filters.push(`j.min_cgpa <= $${params.length}`);
    }
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const sort = req.query.sort === 'deadline' ? 'j.application_deadline ASC' : 'j.created_at DESC';

  const count = await query(
    `SELECT COUNT(*)::int AS total
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
     ${where}`,
    params
  );

  params.push(limit, offset);
  const { rows } = await query(
    `${jobSelect()} ${where} ORDER BY ${sort} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json(paginated(rows, count.rows[0].total, page, limit));
});

export const getJob = asyncHandler(async (req, res) => {
  const { rows } = await query(`${jobSelect()} WHERE j.id = $1`, [req.params.id]);
  const job = rows[0];
  if (!job) throw notFound('Job not found');

  let applied = false;
  let eligible = true;
  if (req.user?.role === 'STUDENT') {
    const student = await getStudentProfileByUserId(req.user.id);
    eligible = isEligible(job, student);
    if (student) {
      const existing = await query(
        `SELECT id FROM applications WHERE job_id = $1 AND student_id = $2`,
        [job.id, student.id]
      );
      applied = Boolean(existing.rowCount);
    }
  }
  res.json({ job, applied, eligible });
});

async function requireApprovedRecruiter(userId) {
  const { rows } = await query(
    `SELECT * FROM recruiter_profiles WHERE user_id = $1`,
    [userId]
  );
  const recruiter = rows[0];
  if (!recruiter) throw notFound('Recruiter profile not found');
  if (recruiter.approval_status !== 'APPROVED') {
    throw forbidden('Your recruiter account is pending admin approval');
  }
  if (!recruiter.company_id) throw badRequest('Complete your company profile before publishing jobs');
  return recruiter;
}

function jobPayload(body) {
  requireFields(body, ['title', 'description', 'location', 'employmentType', 'applicationDeadline']);
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    responsibilities: body.responsibilities || null,
    requiredSkills: sanitizeStringArray(body.requiredSkills),
    location: body.location.trim(),
    employmentType: body.employmentType,
    salaryMin: body.salaryMin ? Number(body.salaryMin) : null,
    salaryMax: body.salaryMax ? Number(body.salaryMax) : null,
    minCgpa: body.minCgpa !== undefined && body.minCgpa !== '' ? Number(body.minCgpa) : 0,
    eligibleDepartments: sanitizeStringArray(body.eligibleDepartments),
    eligibleGraduationYears: sanitizeIntArray(body.eligibleGraduationYears),
    applicationDeadline: body.applicationDeadline,
    openings: Number(body.openings || 1),
    status: body.status || 'OPEN'
  };
}

export const createJob = asyncHandler(async (req, res) => {
  const recruiter = await requireApprovedRecruiter(req.user.id);
  const data = jobPayload(req.body);
  const { rows } = await query(
    `INSERT INTO jobs (
       recruiter_id, company_id, title, description, responsibilities, required_skills,
       location, employment_type, salary_min, salary_max, min_cgpa, eligible_departments,
       eligible_graduation_years, application_deadline, openings, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      recruiter.id,
      recruiter.company_id,
      data.title,
      data.description,
      data.responsibilities,
      data.requiredSkills,
      data.location,
      data.employmentType,
      data.salaryMin,
      data.salaryMax,
      data.minCgpa,
      data.eligibleDepartments,
      data.eligibleGraduationYears,
      data.applicationDeadline,
      data.openings,
      data.status
    ]
  );
  res.status(201).json({ job: rows[0] });
});

export const updateJob = asyncHandler(async (req, res) => {
  const recruiter = await requireApprovedRecruiter(req.user.id);
  const existing = await query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
  const job = existing.rows[0];
  if (!job) throw notFound('Job not found');
  if (job.recruiter_id !== recruiter.id) throw forbidden('You can only edit your own jobs');

  const data = jobPayload({
    title: req.body.title ?? job.title,
    description: req.body.description ?? job.description,
    responsibilities: req.body.responsibilities ?? job.responsibilities,
    requiredSkills: req.body.requiredSkills ?? job.required_skills,
    location: req.body.location ?? job.location,
    employmentType: req.body.employmentType || job.employment_type,
    salaryMin: req.body.salaryMin ?? job.salary_min,
    salaryMax: req.body.salaryMax ?? job.salary_max,
    minCgpa: req.body.minCgpa ?? job.min_cgpa,
    eligibleDepartments: req.body.eligibleDepartments ?? job.eligible_departments,
    eligibleGraduationYears: req.body.eligibleGraduationYears ?? job.eligible_graduation_years,
    applicationDeadline: req.body.applicationDeadline ?? job.application_deadline,
    openings: req.body.openings ?? job.openings,
    status: req.body.status || job.status
  });
  const { rows } = await query(
    `UPDATE jobs SET
       title=$1, description=$2, responsibilities=$3, required_skills=$4, location=$5,
       employment_type=$6, salary_min=$7, salary_max=$8, min_cgpa=$9, eligible_departments=$10,
       eligible_graduation_years=$11, application_deadline=$12, openings=$13, status=COALESCE($14, status)
     WHERE id=$15 RETURNING *`,
    [
      data.title,
      data.description,
      data.responsibilities,
      data.requiredSkills,
      data.location,
      data.employmentType,
      data.salaryMin,
      data.salaryMax,
      data.minCgpa,
      data.eligibleDepartments,
      data.eligibleGraduationYears,
      data.applicationDeadline,
      data.openings,
      req.body.status || job.status,
      job.id
    ]
  );
  res.json({ job: rows[0] });
});

export const closeJob = asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
  const job = existing.rows[0];
  if (!job) throw notFound('Job not found');

  if (req.user.role === 'RECRUITER') {
    const recruiter = await requireApprovedRecruiter(req.user.id);
    if (job.recruiter_id !== recruiter.id) throw forbidden('You can only close your own jobs');
  }

  const { rows } = await query(
    `UPDATE jobs SET status = 'CLOSED' WHERE id = $1 RETURNING *`,
    [job.id]
  );
  res.json({ job: rows[0] });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const recruiter = await requireApprovedRecruiter(req.user.id);
  const existing = await query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
  const job = existing.rows[0];
  if (!job) throw notFound('Job not found');
  if (job.recruiter_id !== recruiter.id) throw forbidden('You can only delete your own jobs');

  const apps = await query('SELECT COUNT(*)::int AS total FROM applications WHERE job_id = $1', [job.id]);
  if (apps.rows[0].total > 0) {
    const { rows } = await query(`UPDATE jobs SET status = 'CLOSED' WHERE id = $1 RETURNING *`, [job.id]);
    res.json({
      job: rows[0],
      closed: true,
      message: 'This listing already has applications, so it was closed instead of deleted'
    });
    return;
  }

  await query('DELETE FROM jobs WHERE id = $1', [job.id]);
  res.json({ deleted: true });
});

export const recruiterJobs = asyncHandler(async (req, res) => {
  const recruiter = await query('SELECT id FROM recruiter_profiles WHERE user_id = $1', [req.user.id]);
  if (!recruiter.rowCount) throw notFound('Recruiter profile not found');
  const { rows } = await query(
    `${jobSelect()} WHERE j.recruiter_id = $1 ORDER BY j.created_at DESC`,
    [recruiter.rows[0].id]
  );
  res.json({ jobs: rows });
});

