import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Rol } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  children: ReactNode;
  roles: Rol[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.rol)) {
    // Redirect to the user's home based on role
    if (user.rol === 'cocina') return <Navigate to="/cocina" replace />;
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
}
