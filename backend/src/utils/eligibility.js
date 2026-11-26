export function isEligible(job, student) {
  if (!student) return false;
  if (Number(student.cgpa || 0) < Number(job.min_cgpa || 0)) return false;
  if (job.eligible_departments?.length && !job.eligible_departments.includes(student.department)) {
    return false;
  }
  if (
    job.eligible_graduation_years?.length &&
    !job.eligible_graduation_years.includes(Number(student.graduation_year))
  ) {
    return false;
  }
  return true;
}
