import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
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
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import { formatPrice } from '../../lib/currency';
import PhoneInput, { validatePhone } from '../../components/PhoneInput';

const profileUpdateSchema = z.object({
  login: z.string().min(3, 'profile.edit.validation.loginMin').max(50, 'profile.edit.validation.loginMax').optional().or(z.literal('')),
  email: z.string().email('profile.edit.validation.emailInvalid').optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')).refine(
    (val) => !val || validatePhone(val) === null,
    { message: 'phone.validation.invalid' }
  ),
  name: z.string().optional(),
  surname: z.string().optional(),
  patronymic: z.string().optional(),
  password: z.string().min(8, 'profile.edit.validation.passwordMin').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(
  (data) => !data.password || data.password === data.confirmPassword,
  { message: 'profile.edit.validation.passwordMismatch', path: ['confirmPassword'] }
);

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;

type TabId = 'overview' | 'edit' | 'sessions' | 'balance';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: TabId = (['overview', 'edit', 'sessions', 'balance'] as const).includes(tabParam as any)
    ? (tabParam as TabId)
    : 'overview';

  const setActiveTab = (id: TabId) => {
    setSearchParams({ tab: id });
  };

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
            <p className="text-lg font-bold whitespace-nowrap">
              {user.balance ? formatPrice(user.balance.account, user.balance.currency) : '0.00'}
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

function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useTranslation();

  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    const levels = [
      { label: t('profile.edit.strength.weak'), color: 'bg-destructive' },
      { label: t('profile.edit.strength.fair'), color: 'bg-orange-500' },
      { label: t('profile.edit.strength.good'), color: 'bg-yellow-500' },
      { label: t('profile.edit.strength.strong'), color: 'bg-success' },
      { label: t('profile.edit.strength.veryStrong'), color: 'bg-success' },
    ];
    const lvl = levels[Math.min(s, levels.length) - 1] ?? levels[0];
    return { score: s, label: lvl.label, color: lvl.color };
  }, [password, t]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? color : 'bg-secondary'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EditTab({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const defaults = {
    login: user?.login ?? '',
    email: user?.email ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    name: user?.profile?.name ?? '',
    surname: user?.profile?.surname ?? '',
    patronymic: user?.profile?.patronymic ?? '',
    password: '',
    confirmPassword: '',
  };

  const form = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: defaults,
  });

  const watched = useWatch({ control: form.control });

  const changedFields = useMemo(() => {
    const changed = new Set<string>();
    if (watched.login && watched.login !== defaults.login) changed.add('login');
    if (watched.email && watched.email !== defaults.email) changed.add('email');
    if (watched.phoneNumber && watched.phoneNumber !== defaults.phoneNumber) changed.add('phoneNumber');
    if (watched.name !== defaults.name) changed.add('name');
    if (watched.surname !== defaults.surname) changed.add('surname');
    if (watched.patronymic !== defaults.patronymic) changed.add('patronymic');
    if (watched.password) changed.add('password');
    return changed;
  }, [watched, defaults]);

  const hasChanges = changedFields.size > 0;

  const mutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      const payload: ProfileUpdateInput = {};
      if (data.login && data.login !== user?.login) payload.login = data.login;
      if (data.email && data.email !== user?.email) payload.email = data.email;
      if (data.phoneNumber && data.phoneNumber !== user?.phoneNumber)
        payload.phoneNumber = data.phoneNumber;
      if (data.password) payload.password = data.password;

      if (
        data.name !== (user?.profile?.name ?? '') ||
        data.surname !== (user?.profile?.surname ?? '') ||
        data.patronymic !== (user?.profile?.patronymic ?? '')
      ) {
        payload.profile = {
          name: data.name || undefined,
          surname: data.surname || undefined,
          patronymic: data.patronymic || null,
        };
      }

      if (Object.keys(payload).length === 0) {
        throw new Error(t('profile.edit.noChanges'));
      }

      await userProfileApi.updateProfile(payload, { skipErrorToast: true });
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
      if (data && error?.response?.status === 409) {
        if (data.error_login) {
          form.setError('login', { message: t('profile.edit.conflict.login') });
        }
        if (data.error_email) {
          form.setError('email', { message: t('profile.edit.conflict.email') });
        }
        if (data.error_phoneNumber || data.error_phone) {
          form.setError('phoneNumber', { message: t('profile.edit.conflict.phone') });
        }
        toast.error(t('profile.edit.conflictGeneral'));
      } else if (data) {
        const messages = Object.values(data).join('. ');
        toast.error(messages || t('profile.edit.error'));
      } else {
        toast.error(error?.message || t('profile.edit.error'));
      }
    },
  });

  const handleReset = () => {
    form.reset(defaults);
    setShowPasswordSection(false);
  };

  return (
    <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
      {/* Unsaved changes banner */}
      {hasChanges && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-slide-up">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">
            {t('profile.edit.unsavedChanges', { count: changedFields.size })}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            {t('profile.edit.resetAll')}
          </button>
        </div>
      )}

      {/* Personal Information Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('profile.edit.personalInfoSection')}</h2>
            <p className="text-xs text-muted-foreground">{t('profile.edit.personalInfoSectionHint')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Surname */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
              {t('profile.edit.surname')}
              {changedFields.has('surname') && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500">
                  <Pencil className="h-3 w-3" /> {t('profile.edit.modified')}
                </span>
              )}
            </label>
            <input
              {...form.register('surname')}
              className={cn('input-base', changedFields.has('surname') && 'border-amber-500/50 ring-1 ring-amber-500/20')}
              placeholder={t('profile.edit.surnamePlaceholder')}
            />
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
              {t('profile.edit.name')}
              {changedFields.has('name') && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500">
                  <Pencil className="h-3 w-3" /> {t('profile.edit.modified')}
                </span>
              )}
            </label>
            <input
              {...form.register('name')}
              className={cn('input-base', changedFields.has('name') && 'border-amber-500/50 ring-1 ring-amber-500/20')}
              placeholder={t('profile.edit.namePlaceholder')}
            />
          </div>

          {/* Patronymic */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
              {t('profile.edit.patronymic')}
              {changedFields.has('patronymic') && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500">
                  <Pencil className="h-3 w-3" /> {t('profile.edit.modified')}
                </span>
              )}
            </label>
            <input
              {...form.register('patronymic')}
              className={cn('input-base', changedFields.has('patronymic') && 'border-amber-500/50 ring-1 ring-amber-500/20')}
              placeholder={t('profile.edit.patronymicPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* Account Information Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('profile.edit.accountSection')}</h2>
            <p className="text-xs text-muted-foreground">{t('profile.edit.accountSectionHint')}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Login */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
              {t('profile.edit.login')}
              {changedFields.has('login') && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500">
                  <Pencil className="h-3 w-3" /> {t('profile.edit.modified')}
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                {...form.register('login')}
                className={cn('input-base pl-10', changedFields.has('login') && 'border-amber-500/50 ring-1 ring-amber-500/20')}
                placeholder={t('profile.edit.loginPlaceholder')}
              />
            </div>
            {changedFields.has('login') && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('profile.edit.currentValue')}: <span className="font-medium">{defaults.login}</span>
              </p>
            )}
            {form.formState.errors.login && (
              <p className="text-destructive text-sm mt-1.5">{t(form.formState.errors.login.message!)}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
              {t('profile.edit.email')}
              {changedFields.has('email') && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500">
                  <Pencil className="h-3 w-3" /> {t('profile.edit.modified')}
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="email"
                {...form.register('email')}
                className={cn('input-base pl-10', changedFields.has('email') && 'border-amber-500/50 ring-1 ring-amber-500/20')}
                placeholder={t('profile.edit.emailPlaceholder')}
              />
            </div>
            {changedFields.has('email') && defaults.email && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('profile.edit.currentValue')}: <span className="font-medium">{defaults.email}</span>
              </p>
            )}
            {form.formState.errors.email && (
              <p className="text-destructive text-sm mt-1.5">{t(form.formState.errors.email.message!)}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
              {t('profile.edit.phoneNumber')}
              {changedFields.has('phoneNumber') && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500">
                  <Pencil className="h-3 w-3" /> {t('profile.edit.modified')}
                </span>
              )}
            </label>
            <PhoneInput
              value={form.watch('phoneNumber') ?? ''}
              onChange={(val) => form.setValue('phoneNumber', val, { shouldValidate: true })}
              hasError={!!form.formState.errors.phoneNumber}
            />
            {changedFields.has('phoneNumber') && defaults.phoneNumber && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('profile.edit.currentValue')}: <span className="font-medium">{defaults.phoneNumber}</span>
              </p>
            )}
            {form.formState.errors.phoneNumber && (
              <p className="text-destructive text-sm mt-1.5">
                {t(form.formState.errors.phoneNumber.message ?? 'phone.validation.invalid')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t('profile.edit.securitySection')}</h2>
              <p className="text-xs text-muted-foreground">{t('profile.edit.securitySectionHint')}</p>
            </div>
          </div>
          {!showPasswordSection && (
            <button
              type="button"
              onClick={() => setShowPasswordSection(true)}
              className="btn-secondary py-2 text-sm"
            >
              <Lock className="h-3.5 w-3.5" />
              {t('profile.edit.changePassword')}
            </button>
          )}
        </div>

        {showPasswordSection ? (
          <div className="mt-5 space-y-5 pt-5 border-t border-border">
            {/* New Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                {t('profile.edit.newPassword')}
                {changedFields.has('password') && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  className="input-base pl-10 pr-10"
                  placeholder={t('profile.edit.passwordPlaceholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={watched.password ?? ''} />
              {form.formState.errors.password && (
                <p className="text-destructive text-sm mt-1.5">
                  {t(form.formState.errors.password.message!)}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('profile.edit.confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...form.register('confirmPassword')}
                  className="input-base pl-10 pr-10"
                  placeholder={t('profile.edit.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-destructive text-sm mt-1.5">
                  {t(form.formState.errors.confirmPassword.message!)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                form.setValue('password', '');
                form.setValue('confirmPassword', '');
                setShowPasswordSection(false);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              {t('profile.edit.cancelPasswordChange')}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-3 ml-12">
            {t('profile.edit.passwordUnchanged')}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={mutation.isPending || !hasChanges}
          className={cn(
            'btn-primary py-2.5 flex-1 transition-all',
            !hasChanges && 'opacity-50 cursor-not-allowed'
          )}
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
              {hasChanges && (
                <span className="ml-1 text-xs opacity-75">
                  ({changedFields.size})
                </span>
              )}
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
            <p className="text-3xl font-bold text-success whitespace-nowrap">{formatPrice(balance.account, balance.currency)}</p>
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
                        : entry.operationType === 'PAYMENT'
                          ? t('profile.balance.payment')
                          : t('profile.balance.writeOff')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('profile.balance.balanceAfter', { amount: formatPrice(entry.resultAccount, balance.currency) })}
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
                  {formatPrice(entry.amount, balance.currency)}
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
