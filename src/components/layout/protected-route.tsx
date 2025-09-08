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

  console.log('ProtectedRoute - State:', { 
    user: !!user, 
    profile: !!profile, 
    loading, 
    requireProfile, 
    allowedRoles,
    userRole: profile?.role 
  });

  if (loading) {
    console.log('ProtectedRoute - Still loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // Profile required but not loaded yet
  if (requireProfile && !profile) {
    console.log('ProtectedRoute - No profile, redirecting to /setup');
    return <Navigate to="/setup" replace />;
  }

  // Check role permissions
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    console.log('ProtectedRoute - Role not allowed, redirecting to /unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute - Access granted');
  return <>{children}</>;
}