import { api } from './client';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string(), // Login can be email or username
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
    // Backend expects 'login' field, but our form has 'email'
    const response = await api.post('/auth/login', {
      login: data.email, 
      password: data.password
    });
    return response.data;
  },
  register: async (data: RegisterInput) => {
    // Backend likely expects specific structure for registration
    // Looking at UserRegistrationRestController
    const response = await api.post('/users/registration', {
      ...data,
      login: data.email // Use email as login for now
    });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  getProfile: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }
};
