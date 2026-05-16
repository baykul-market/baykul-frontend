import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi, forgotPasswordSchema, type ForgotPasswordInput } from '../../api/auth';
import { Loader2, Mail, ArrowLeft, Wrench, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordInput) => authApi.forgotPassword(data),
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    mutation.mutate(data);
  };

  const handleBackToLogin = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{t('auth.forgotPassword.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('auth.forgotPassword.subtitle')}</p>
        </div>

        {/* Form Card */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium mb-1.5">{t('auth.forgotPassword.identifierLabel')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  {...form.register('identifier')}
                  className="input-base pl-10"
                  placeholder={t('auth.forgotPassword.identifierPlaceholder')}
                />
              </div>
              {form.formState.errors.identifier && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.identifier.message}</p>
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
                  {t('auth.forgotPassword.sending')}
                </>
              ) : (
                t('auth.forgotPassword.sendButton')
              )}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleBackToLogin}
        title={t('auth.forgotPassword.successModal.title')}
      >
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 text-success mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="text-muted-foreground mb-8">
            {t('auth.forgotPassword.successModal.description')}
          </p>
          <button
            onClick={handleBackToLogin}
            className="btn-primary w-full py-3"
          >
            {t('auth.forgotPassword.successModal.button')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
