import { useAuthStore } from '../../store/useAuthStore';
import { Navigate, Link } from 'react-router-dom';
import { Shield, FileText, Box, Users, ArrowRight, Upload, Search, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  link: string | null;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  if (!user || user.role === 'USER') {
    return <Navigate to="/products" />;
  }

  const isAdmin = user.role === 'ADMIN';

  const features: FeatureCard[] = [
    isAdmin
      ? {
          title: t('dashboard.main.userManagement'),
          description: t('dashboard.main.userDescription'),
          icon: Users,
          status: t('dashboard.main.available'),
          link: '/dashboard/users',
        }
      : {
          title: t('dashboard.main.userSearch'),
          description: t('dashboard.main.userSearchDescription'),
          icon: Search,
          status: t('dashboard.main.available'),
          link: '/dashboard/users',
        },
    ...(isAdmin
      ? [
          {
            title: t('dashboard.main.partsUpload'),
            description: t('dashboard.main.partsUploadDescription'),
            icon: Upload,
            status: t('dashboard.main.available'),
            link: '/dashboard/parts-upload',
          },
        ]
      : []),
    {
      title: t('dashboard.orderManagement.title'),
      description: t('dashboard.orderManagement.subtitle'),
      icon: Package,
      status: t('dashboard.main.available'),
      link: '/dashboard/orders',
    },
    {
      title: t('dashboard.main.billManagement'),
      description: t('dashboard.main.billDescription'),
      icon: FileText,
      status: t('dashboard.main.comingSoon'),
      link: null,
    },
    {
      title: t('dashboard.main.boxTracking'),
      description: t('dashboard.main.boxDescription'),
      icon: Box,
      status: t('dashboard.main.available'),
      link: '/dashboard/boxes',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-start gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.main.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('dashboard.main.subtitle')}{' '}
            <span className="font-medium text-foreground capitalize">{user.role?.toLowerCase()}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature) => (
          <div key={feature.title} className="card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <feature.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className={
                feature.link
                  ? 'badge bg-success/10 text-success border-success/20 text-[10px]'
                  : 'badge bg-accent/10 text-accent border-accent/20 text-[10px]'
              }>
                {feature.status}
              </span>
            </div>
            <h3 className="font-semibold mb-1.5">{feature.title}</h3>
            <p className="text-sm text-muted-foreground flex-1">{feature.description}</p>
            {feature.link ? (
              <Link
                to={feature.link}
                className="btn-ghost text-sm text-primary mt-4 justify-start px-0 hover:text-primary/80"
              >
                {t('dashboard.main.open')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                disabled
                className="btn-ghost text-sm text-muted-foreground mt-4 justify-start px-0 opacity-50"
              >
                {t('dashboard.main.open')}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t('dashboard.main.statsPlaceholder')}
        </p>
      </div>
    </div>
  );
}
