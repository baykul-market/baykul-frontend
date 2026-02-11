import { useAuthStore } from '../../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { Shield, FileText, Box, Users, ArrowRight } from 'lucide-react';

const UPCOMING_FEATURES = [
  {
    title: 'Bill Management',
    description: 'Create and manage delivery bills, scan incoming boxes, and track shipments.',
    icon: FileText,
    status: 'Coming Soon',
  },
  {
    title: 'Box Tracking',
    description: 'View and update box statuses from arrival to warehouse placement.',
    icon: Box,
    status: 'Coming Soon',
  },
  {
    title: 'User Management',
    description: 'Manage user accounts, roles, and access permissions.',
    icon: Users,
    status: 'Planned',
  },
];

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);

  if (!user || user.role === 'USER') {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your warehouse, logistics, and team. Logged in as{' '}
            <span className="font-medium text-foreground capitalize">{user.role?.toLowerCase()}</span>.
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {UPCOMING_FEATURES.map((feature) => (
          <div key={feature.title} className="card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <feature.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="badge bg-accent/10 text-accent border-accent/20 text-[10px]">
                {feature.status}
              </span>
            </div>
            <h3 className="font-semibold mb-1.5">{feature.title}</h3>
            <p className="text-sm text-muted-foreground flex-1">{feature.description}</p>
            <button
              disabled
              className="btn-ghost text-sm text-muted-foreground mt-4 justify-start px-0 opacity-50"
            >
              Open
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Stats Placeholder */}
      <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Dashboard analytics and quick stats will appear here once features are implemented.
        </p>
      </div>
    </div>
  );
}
