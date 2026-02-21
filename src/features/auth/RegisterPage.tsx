import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi, registerSchema, type RegisterInput } from '../../api/auth';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock, UserPlus, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PhoneInput from '../../components/PhoneInput';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success(t('auth.register.success'));
      navigate('/login');
    },
    onError: (error: any) => {
      // Handle backend errors
      const data = error?.response?.data;
      if (data && error?.response?.status === 409) {
        if (data.error_login) form.setError('login', { message: t('profile.edit.conflict.login') });
        if (data.error_email) form.setError('email', { message: t('profile.edit.conflict.email') });
        if (data.error_phoneNumber || data.error_phone_number) form.setError('phoneNumber', { message: t('profile.edit.conflict.phone') });
        toast.error(t('profile.edit.conflictGeneral'));
      } else {
        toast.error(t('auth.register.error'));
      }
      console.error(error);
    },
  });

  const onSubmit = (data: RegisterInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-10">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{t('auth.register.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('auth.register.subtitle')}</p>
        </div>

        {/* Form Card */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Login */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.register.login')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  {...form.register('login')}
                  className="input-base pl-10"
                  placeholder={t('auth.register.loginPlaceholder')}
                />
              </div>
              {form.formState.errors.login && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.login.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.register.email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  {...form.register('email')}
                  className="input-base pl-10"
                  placeholder={t('auth.register.emailPlaceholder')}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.register.phone')}</label>
              <PhoneInput
                value={form.watch('phoneNumber') ?? ''}
                onChange={(val) => form.setValue('phoneNumber', val, { shouldValidate: true })}
                hasError={!!form.formState.errors.phoneNumber}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.register.surname')}</label>
                <input
                  {...form.register('surname')}
                  className="input-base"
                  placeholder={t('auth.register.surnamePlaceholder')}
                />
                {form.formState.errors.surname && (
                  <p className="text-destructive text-xs mt-1">{form.formState.errors.surname.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.register.name')}</label>
                <input
                  {...form.register('name')}
                  className="input-base"
                  placeholder={t('auth.register.namePlaceholder')}
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.register.patronymic')}</label>
                <input
                  {...form.register('patronymic')}
                  className="input-base"
                  placeholder={t('auth.register.patronymicPlaceholder')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.register.password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  {...form.register('password')}
                  className="input-base pl-10"
                  placeholder={t('auth.register.passwordPlaceholder')}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.register.confirmPassword')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  {...form.register('confirmPassword')}
                  className="input-base pl-10"
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary w-full py-3 text-sm"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth.register.creatingAccount')}
                </>
              ) : (
                t('auth.register.createAccount')
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
