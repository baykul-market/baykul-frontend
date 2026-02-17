import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/useAuthStore';
import { userProfileApi, type ProfileUpdateInput } from '../../api/user';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Shield,
  Wallet,
  Loader2,
  Save,
  X,
  Pencil,
  Monitor,
  Globe,
  Clock,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';

const profileUpdateSchema = z.object({
  login: z.string().min(3, 'Login must be at least 3 characters').max(50).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().min(7).max(15).optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;

type TabId = 'overview' | 'edit' | 'sessions' | 'balance';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (!isAuthenticated || !user) {
    navigate('/login', { replace: true });
    return null;
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('profile.tabs.overview'), icon: <User className="w-4 h-4" /> },
    { id: 'edit', label: t('profile.tabs.edit'), icon: <Pencil className="w-4 h-4" /> },
    { id: 'balance', label: t('profile.tabs.balance'), icon: <Wallet className="w-4 h-4" /> },
    { id: 'sessions', label: t('profile.tabs.sessions'), icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.profile
              ? `${user.profile.name} ${user.profile.surname}`
              : user.login}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="badge bg-primary/10 text-primary border-primary/20 capitalize">
              {user.role.toLowerCase()}
            </span>
            {user.blocked && (
              <span className="badge bg-destructive/10 text-destructive border-destructive/20">
                {t('profile.blocked')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'edit' && <EditTab onSuccess={() => setActiveTab('overview')} />}
      {activeTab === 'balance' && <BalanceTab />}
      {activeTab === 'sessions' && <SessionsTab />}
    </div>
  );
}

// === Overview Tab ===

function OverviewTab() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  if (!user) return null;

  const fields = [
    { label: t('profile.overview.login'), value: user.login, icon: <User className="w-4 h-4" /> },
    { label: t('profile.overview.email'), value: user.email || t('common.notSet'), icon: <Mail className="w-4 h-4" /> },
    { label: t('profile.overview.phone'), value: user.phoneNumber || t('common.notSet'), icon: <Phone className="w-4 h-4" /> },
    { label: t('profile.overview.role'), value: user.role, icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">{t('profile.overview.accountInfo')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                {field.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {field.label}
                </p>
                <p className="text-sm font-medium truncate">{field.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Name Card */}
      {user.profile && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('profile.overview.personalInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {t('profile.overview.name')}
              </p>
              <p className="text-sm font-medium">{user.profile.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {t('profile.overview.surname')}
              </p>
              <p className="text-sm font-medium">{user.profile.surname}</p>
            </div>
            {user.profile.patronymic && (
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {t('profile.overview.patronymic')}
                </p>
                <p className="text-sm font-medium">{user.profile.patronymic}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t('profile.overview.balance')}
            </p>
            <p className="text-lg font-bold">
              {user.balance ? `${user.balance.account.toFixed(2)}` : '0.00'}
            </p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t('profile.overview.memberSince')}
            </p>
            <p className="text-lg font-bold">
              {new Date(user.createdTs).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Edit Tab ===

function EditTab({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const form = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      login: user?.login ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      // Only send non-empty fields
      const payload: ProfileUpdateInput = {};
      if (data.login && data.login !== user?.login) payload.login = data.login;
      if (data.email && data.email !== user?.email) payload.email = data.email;
      if (data.phoneNumber && data.phoneNumber !== user?.phoneNumber)
        payload.phoneNumber = data.phoneNumber;
      if (data.password) payload.password = data.password;

      if (Object.keys(payload).length === 0) {
        throw new Error('No changes to save');
      }

      await userProfileApi.updateProfile(payload);
      // Refetch the profile to get updated data
      const updated = await userProfileApi.getProfile();
      return updated;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(t('profile.edit.success'));
      onSuccess();
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (data) {
        const messages = Object.values(data).join('. ');
        toast.error(messages || t('profile.edit.error'));
      } else {
        toast.error(error?.message || t('profile.edit.error'));
      }
    },
  });

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-6">{t('profile.edit.title')}</h2>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('profile.edit.login')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              {...form.register('login')}
              className="input-base pl-10"
              placeholder={t('profile.edit.loginPlaceholder')}
            />
          </div>
          {form.formState.errors.login && (
            <p className="text-destructive text-sm mt-1.5">{form.formState.errors.login.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('profile.edit.email')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="email"
              {...form.register('email')}
              className="input-base pl-10"
              placeholder={t('profile.edit.emailPlaceholder')}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-destructive text-sm mt-1.5">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('profile.edit.phoneNumber')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              {...form.register('phoneNumber')}
              className="input-base pl-10"
              placeholder={t('profile.edit.phonePlaceholder')}
            />
          </div>
          {form.formState.errors.phoneNumber && (
            <p className="text-destructive text-sm mt-1.5">
              {form.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('profile.edit.newPassword')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="password"
              {...form.register('password')}
              className="input-base pl-10"
              placeholder={t('profile.edit.passwordPlaceholder')}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-destructive text-sm mt-1.5">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary py-2.5 flex-1"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('profile.edit.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('profile.edit.saveChanges')}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onSuccess}
            className="btn-secondary py-2.5"
          >
            <X className="h-4 w-4" />
            {t('profile.edit.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

// === Balance Tab ===

function BalanceTab() {
  const { t } = useTranslation();
  const { data: balance, isLoading } = useQuery({
    queryKey: ['profile', 'balance'],
    queryFn: userProfileApi.getBalance,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('profile.balance.loadingBalance')}</p>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="card p-8 text-center">
        <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">{t('profile.balance.noBalanceTitle')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('profile.balance.noBalanceSubtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('profile.balance.currentBalance')}</h2>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/20 text-success">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{t('profile.balance.availableFunds')}</p>
            <p className="text-3xl font-bold text-success">{balance.account.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Balance History */}
      {balance.balanceHistoryList && balance.balanceHistoryList.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('profile.balance.transactionHistory')}</h2>
          <div className="space-y-3">
            {balance.balanceHistoryList.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      entry.operationType === 'REPLENISHMENT'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    <ChevronRight
                      className={cn(
                        'h-4 w-4',
                        entry.operationType === 'REPLENISHMENT'
                          ? 'rotate-[-90deg]'
                          : 'rotate-90'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {entry.operationType === 'REPLENISHMENT'
                        ? t('profile.balance.replenishment')
                        : t('profile.balance.writeOff')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('profile.balance.balanceAfter', { amount: entry.resultAccount.toFixed(2) })}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold',
                    entry.operationType === 'REPLENISHMENT' ? 'text-success' : 'text-destructive'
                  )}
                >
                  {entry.operationType === 'REPLENISHMENT' ? '+' : '-'}
                  {entry.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// === Sessions Tab ===

function SessionsTab() {
  const { t } = useTranslation();
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['profile', 'sessions'],
    queryFn: userProfileApi.getRefreshTokens,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('profile.sessions.loadingSessions')}</p>
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Monitor className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">{t('profile.sessions.noSessionsTitle')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('profile.sessions.noSessionsSubtitle')}
        </p>
      </div>
    );
  }

  const parseUserAgent = (ua: string) => {
    if (ua.includes('PostmanRuntime')) return t('profile.sessions.postman');
    if (ua.includes('Chrome')) return t('profile.sessions.chrome');
    if (ua.includes('Firefox')) return t('profile.sessions.firefox');
    if (ua.includes('Safari')) return t('profile.sessions.safari');
    if (ua.includes('Edge')) return t('profile.sessions.edge');
    return t('profile.sessions.unknownBrowser');
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">
        {t('profile.sessions.activeSessions')}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({tokens.length})
        </span>
      </h2>
      <div className="space-y-3">
        {tokens.map((token) => (
          <div
            key={token.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Monitor className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{parseUserAgent(token.userAgent)}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {token.ipAddress}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate" title={token.userAgent}>
                {token.userAgent}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
