import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
  const user = useAuthStore(state => state.user);

  if (!user || user.role === 'USER') {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-muted-foreground">Admin features (Bills, Box Management) coming soon.</p>
    </div>
  );
}
