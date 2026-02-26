import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { advertiser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!advertiser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
