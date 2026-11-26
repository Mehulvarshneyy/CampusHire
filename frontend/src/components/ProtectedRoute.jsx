import { Navigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';
import Spinner from './ui/Spinner';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
