import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireProfile?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireProfile = true 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Profile required but not loaded yet
  if (requireProfile && !profile) {
    return <Navigate to="/setup" replace />;
  }

  // Check role permissions
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}