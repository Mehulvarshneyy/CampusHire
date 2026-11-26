import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Spinner from './components/ui/Spinner';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentOverview from './pages/student/Overview';
import StudentJobs from './pages/student/Jobs';
import JobDetail from './pages/student/JobDetail';
import StudentApplications from './pages/student/Applications';
import ApplicationDetail from './pages/student/ApplicationDetail';
import StudentProfile from './pages/student/Profile';
import RecruiterOverview from './pages/recruiter/Overview';
import RecruiterJobs from './pages/recruiter/Jobs';
import JobForm from './pages/recruiter/JobForm';
import Applicants from './pages/recruiter/Applicants';
import RecruiterProfile from './pages/recruiter/Profile';
import AdminOverview from './pages/admin/Overview';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminApplications from './pages/admin/Applications';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentOverview />} />
        <Route path="jobs" element={<StudentJobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      <Route
        path="/recruiter"
        element={
          <ProtectedRoute roles={['RECRUITER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RecruiterOverview />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="jobs/new" element={<JobForm />} />
        <Route path="jobs/:id/edit" element={<JobForm />} />
        <Route path="jobs/:id/applicants" element={<Applicants />} />
        <Route path="profile" element={<RecruiterProfile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="applications" element={<AdminApplications />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
