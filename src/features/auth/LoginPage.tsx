import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi, loginSchema, type LoginInput } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Loader2, User, Lock, Wrench } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await authApi.login(data);
      const { accessToken, refreshToken } = response;

      // Store tokens immediately so the interceptor can attach them to subsequent requests
      useAuthStore.getState().setTokens(accessToken, refreshToken);

      // Fetch full user profile using the authenticated /users/profile endpoint
      const userProfile = await authApi.getProfile();

      return {
        user: userProfile,
        accessToken,
        refreshToken,
      };
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Logged in successfully');
      navigate('/');
    },
    onError: (error) => {
      toast.error('Login failed. Please check your credentials.');
      console.error(error);
    },
  });

  const onSubmit = (data: LoginInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your Baykul account</p>
        </div>

        {/* Form Card */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Login</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  {...form.register('login')}
                  className="input-base pl-10"
                  placeholder="Enter your login"
                />
              </div>
              {form.formState.errors.login && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.login.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  {...form.register('password')}
                  className="input-base pl-10"
                  placeholder="Enter your password"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-destructive text-sm mt-1.5">{form.formState.errors.password.message}</p>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
