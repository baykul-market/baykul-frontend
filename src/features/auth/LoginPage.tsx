import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi, loginSchema, type LoginInput } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string; // login/username
  id: string; // user id
  role: string;
  exp: number;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      // 1. Login
      const response = await authApi.login(data);
      const { accessToken, refreshToken } = response;
      
      // 2. Decode token to get ID
      const decoded = jwtDecode<JwtPayload>(accessToken);
      const userId = decoded.id;
      
      if (!userId) {
        throw new Error('User ID not found in token');
      }

      // 3. Fetch user profile
      const userProfile = await authApi.getProfile(userId);
      
      return {
        user: userProfile,
        accessToken,
        refreshToken
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-card rounded-lg shadow-md border">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...form.register('email')}
            className="w-full p-2 border rounded bg-background"
          />
          {form.formState.errors.email && (
            <p className="text-destructive text-sm mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...form.register('password')}
            className="w-full p-2 border rounded bg-background"
          />
          {form.formState.errors.password && (
            <p className="text-destructive text-sm mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
      </div>
    </div>
  );
}
