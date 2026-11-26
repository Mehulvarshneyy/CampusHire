import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';

async function seed() {
  await withTransaction(async (client) => {
    const password = await bcrypt.hash('Student@123', 12);
    const recruiterPassword = await bcrypt.hash('Recruiter@123', 12);
    const adminPassword = await bcrypt.hash(env.adminSeedPassword, 12);

    const users = [
      ['admin@campushire.edu', adminPassword, 'ADMIN'],
      ['student@university.edu', password, 'STUDENT'],
      ['priya.sharma@university.edu', password, 'STUDENT'],
      ['arjun.mehta@university.edu', password, 'STUDENT'],
      ['ananya.iyer@university.edu', password, 'STUDENT'],
      ['recruiter@technova.com', recruiterPassword, 'RECRUITER'],
      ['hiring@northwind.io', recruiterPassword, 'RECRUITER'],
      ['pending@orbitlabs.com', recruiterPassword, 'RECRUITER']
    ];

    const userIds = {};
    for (const [email, hash, role] of users) {
      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
         RETURNING id, email`,
        [email, hash, role]
      );
      userIds[email] = rows[0].id;
    }

    const companies = [
      ['TechNova', 'https://technova.example', 'Software', 'Bengaluru', 'Product engineering company building developer tools.'],
      ['Northwind Analytics', 'https://northwind.example', 'Data', 'Hyderabad', 'Analytics platform for enterprise operations.'],
      ['Orbit Labs', 'https://orbitlabs.example', 'Fintech', 'Pune', 'Payments infrastructure for campuses and SMBs.']
    ];

    const companyIds = {};
    for (const [name, website, industry, location, description] of companies) {
      const { rows } = await client.query(
        `INSERT INTO companies (name, website, industry, location, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO UPDATE SET website = EXCLUDED.website
         RETURNING id, name`,
        [name, website, industry, location, description]
      );
      companyIds[name] = rows[0].id;
    }

    const students = [
      [
        userIds['student@university.edu'],
        'Mehul Patel',
        '9876500001',
        'National Institute of Technology',
        'Computer Science',
        2026,
        8.7,
        ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
        'https://example.com/resumes/mehul.pdf',
        'https://linkedin.com/in/mehul',
        'https://github.com/mehul'
      ],
      [
        userIds['priya.sharma@university.edu'],
        'Priya Sharma',
        '9876500002',
        'National Institute of Technology',
        'Information Technology',
        2026,
        9.1,
        ['Python', 'SQL', 'Machine Learning'],
        'https://example.com/resumes/priya.pdf',
        'https://linkedin.com/in/priya',
        'https://github.com/priya'
      ],
      [
        userIds['arjun.mehta@university.edu'],
        'Arjun Mehta',
        '9876500003',
        'National Institute of Technology',
        'Electronics',
        2027,
        7.8,
        ['Java', 'Spring', 'Kafka'],
        'https://example.com/resumes/arjun.pdf',
        'https://linkedin.com/in/arjun',
        'https://github.com/arjun'
      ],
      [
        userIds['ananya.iyer@university.edu'],
        'Ananya Iyer',
        '9876500004',
        'National Institute of Technology',
        'Computer Science',
        2025,
        8.2,
        ['Go', 'Kubernetes', 'AWS'],
        'https://example.com/resumes/ananya.pdf',
        'https://linkedin.com/in/ananya',
        'https://github.com/ananya'
      ]
    ];

    const studentIds = {};
    for (const row of students) {
      const { rows } = await client.query(
        `INSERT INTO student_profiles
          (user_id, full_name, phone, college, department, graduation_year, cgpa, skills, resume_url, linkedin_url, github_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id, user_id`,
        row
      );
      studentIds[row[0]] = rows[0].id;
    }

    const recruiters = [
      [userIds['recruiter@technova.com'], companyIds.TechNova, 'Neha Kapoor', '9876501111', 'University Recruiter', 'APPROVED'],
      [userIds['hiring@northwind.io'], companyIds['Northwind Analytics'], 'Rahul Desai', '9876502222', 'Talent Partner', 'APPROVED'],
      [userIds['pending@orbitlabs.com'], companyIds['Orbit Labs'], 'Sana Qureshi', '9876503333', 'Campus Lead', 'PENDING']
    ];

    const recruiterIds = {};
    for (const [userId, companyId, fullName, phone, designation, status] of recruiters) {
      const { rows } = await client.query(
        `INSERT INTO recruiter_profiles
          (user_id, company_id, full_name, phone, designation, approval_status, reviewed_at)
         VALUES ($1,$2,$3,$4,$5,$6::recruiter_status, CASE WHEN $6::recruiter_status = 'APPROVED' THEN NOW() ELSE NULL END)
         ON CONFLICT (user_id) DO UPDATE SET approval_status = EXCLUDED.approval_status
         RETURNING id, user_id`,
        [userId, companyId, fullName, phone, designation, status]
      );
      recruiterIds[userId] = rows[0].id;
    }

    await client.query('DELETE FROM applications');
    await client.query('DELETE FROM jobs');

    const jobs = [
      {
        recruiter: recruiterIds[userIds['recruiter@technova.com']],
        company: companyIds.TechNova,
        title: 'Software Engineer Intern',
        description: 'Join TechNova’s campus program to ship production features across the developer platform.',
        responsibilities: 'Build React interfaces, contribute to Node APIs, write tests, and participate in design reviews.',
        skills: ['React', 'Node.js', 'SQL'],
        location: 'Bengaluru',
        type: 'INTERNSHIP',
        salaryMin: 400000,
        salaryMax: 700000,
        minCgpa: 7.5,
        departments: ['Computer Science', 'Information Technology'],
        years: [2026, 2027],
        deadline: '2026-12-15',
        openings: 8
      },
      {
        recruiter: recruiterIds[userIds['recruiter@technova.com']],
        company: companyIds.TechNova,
        title: 'Frontend Engineer',
        description: 'Own dashboard experiences used by thousands of engineering teams.',
        responsibilities: 'Design component systems, optimize performance, and partner with product on UX.',
        skills: ['TypeScript', 'React', 'CSS'],
        location: 'Remote',
        type: 'FULL_TIME',
        salaryMin: 1400000,
        salaryMax: 2200000,
        minCgpa: 8,
        departments: ['Computer Science', 'Information Technology'],
        years: [2025, 2026],
        deadline: '2026-11-30',
        openings: 3
      },
      {
        recruiter: recruiterIds[userIds['hiring@northwind.io']],
        company: companyIds['Northwind Analytics'],
        title: 'Data Analyst',
        description: 'Turn campus and enterprise datasets into decision-ready insights.',
        responsibilities: 'Build dashboards, write SQL models, and present findings to stakeholders.',
        skills: ['Python', 'SQL', 'Tableau'],
        location: 'Hyderabad',
        type: 'FULL_TIME',
        salaryMin: 900000,
        salaryMax: 1400000,
        minCgpa: 7,
        departments: ['Computer Science', 'Information Technology', 'Electronics'],
        years: [2025, 2026],
        deadline: '2026-12-20',
        openings: 5
      },
      {
        recruiter: recruiterIds[userIds['hiring@northwind.io']],
        company: companyIds['Northwind Analytics'],
        title: 'Backend Engineer',
        description: 'Scale ingestion pipelines that power real-time analytics.',
        responsibilities: 'Design APIs, improve query performance, and operate services in production.',
        skills: ['Java', 'Kafka', 'PostgreSQL'],
        location: 'Hyderabad',
        type: 'FULL_TIME',
        salaryMin: 1600000,
        salaryMax: 2400000,
        minCgpa: 7.5,
        departments: ['Computer Science', 'Electronics'],
        years: [2025, 2026, 2027],
        deadline: '2026-10-01',
        openings: 2,
        status: 'CLOSED'
      }
    ];

    const jobIds = [];
    for (const job of jobs) {
      const { rows } = await client.query(
        `INSERT INTO jobs (
           recruiter_id, company_id, title, description, responsibilities, required_skills,
           location, employment_type, salary_min, salary_max, min_cgpa, eligible_departments,
           eligible_graduation_years, application_deadline, openings, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING id`,
        [
          job.recruiter,
          job.company,
          job.title,
          job.description,
          job.responsibilities,
          job.skills,
          job.location,
          job.type,
          job.salaryMin,
          job.salaryMax,
          job.minCgpa,
          job.departments,
          job.years,
          job.deadline,
          job.openings,
          job.status || 'OPEN'
        ]
      );
      jobIds.push(rows[0].id);
    }

    const applications = [
      [jobIds[0], studentIds[userIds['student@university.edu']], 'UNDER_REVIEW'],
      [jobIds[1], studentIds[userIds['student@university.edu']], 'SHORTLISTED'],
      [jobIds[2], studentIds[userIds['priya.sharma@university.edu']], 'SELECTED'],
      [jobIds[0], studentIds[userIds['priya.sharma@university.edu']], 'APPLIED'],
      [jobIds[2], studentIds[userIds['arjun.mehta@university.edu']], 'REJECTED'],
      [jobIds[1], studentIds[userIds['ananya.iyer@university.edu']], 'INTERVIEW_SCHEDULED']
    ];

    for (const [jobId, studentId, status] of applications) {
      const { rows } = await client.query(
        `INSERT INTO applications (job_id, student_id, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [jobId, studentId, status]
      );
      await client.query(
        `INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, note)
         VALUES ($1, 'APPLIED', $2, $3, 'Seeded application')`,
        [rows[0].id, status, userIds['admin@campushire.edu']]
      );
    }

    await client.query(
      `INSERT INTO notifications (user_id, title, message, link)
       VALUES
         ($1, 'Welcome to CampusHire', 'Your student profile is ready. Start browsing open roles.', '/student/jobs'),
         ($2, 'Recruiter access approved', 'You can now publish jobs and review applicants.', '/recruiter/jobs')`,
      [userIds['student@university.edu'], userIds['recruiter@technova.com']]
    );
  });

  console.log('Seed data inserted.');
  console.log('Admin: admin@campushire.edu / Admin@123');
  console.log('Student: student@university.edu / Student@123');
  console.log('Recruiter: recruiter@technova.com / Recruiter@123');
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
