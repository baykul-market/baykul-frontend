import { api } from './client';
import { z } from 'zod';
import type { UserFull } from './user';

export const loginSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  login: z.string().min(3, 'Login is required (min 3 chars)'),
  name: z.string().min(2, 'Name is required'),
  surname: z.string().min(2, 'Surname is required'),
  patronymic: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const authApi = {
  login: async (data: LoginInput) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterInput) => {
    const response = await api.post('/users/registration', {
      login: data.login,
      password: data.password,
      email: data.email,
      phoneNumber: data.phoneNumber || undefined,
      profile: {
        name: data.name,
        surname: data.surname,
        patronymic: data.patronymic || null,
      },
    });
    return response.data;
  },
  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refreshToken });
  },
  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  /** Get authenticated user's full profile via /users/profile */
  getProfile: async (): Promise<UserFull> => {
    const response = await api.get<UserFull>('/users/profile');
    return response.data;
  },
};
