import { api } from './client';
import { z } from 'zod';
import type { UserFull } from './user';

export const loginSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
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
      ...data,
      login: data.email,
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
