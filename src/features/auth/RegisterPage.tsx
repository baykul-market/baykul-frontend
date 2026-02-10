import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi, registerSchema, type RegisterInput } from '../../api/auth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error('Registration failed.');
      console.error(error);
    },
  });

  const onSubmit = (data: RegisterInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-card rounded-lg shadow-md border">
      <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              {...form.register('firstName')}
              className="w-full p-2 border rounded bg-background"
            />
            {form.formState.errors.firstName && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              {...form.register('lastName')}
              className="w-full p-2 border rounded bg-background"
            />
            {form.formState.errors.lastName && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>
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
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            {...form.register('confirmPassword')}
            className="w-full p-2 border rounded bg-background"
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-destructive text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
      </div>
    </div>
  );
}
