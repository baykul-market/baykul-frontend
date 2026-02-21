import { api } from './client';

// === Interfaces ===

export interface UserProfile {
  id: string;
  surname: string;
  name: string;
  patronymic: string | null;
}

export interface UserBalance {
  id: string;
  account: number;
}

export interface RefreshTokenInfo {
  id: string;
  name: string;
  userAgent: string;
  ipAddress: string;
}

export interface UserFull {
  id: string;
  createdTs: string;
  updatedTs: string;
  login: string;
  email: string | null;
  phoneNumber: string | null;
  role: 'USER' | 'ADMIN' | 'MANAGER';
  blocked: boolean;
  refreshTokens?: RefreshTokenInfo[];
  profile: UserProfile | null;
  balance: UserBalance | null;
  cart?: { id: string } | null;
}

export interface UserBasic {
  id: string;
  createdTs: string;
  updatedTs: string;
  login: string;
  email: string | null;
  phoneNumber: string | null;
  role: 'USER' | 'ADMIN' | 'MANAGER';
  blocked: boolean;
  profile: UserProfile | null;
}

export interface ProfileUpdateInput {
  login?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  blocked?: boolean;
  profile?: {
    name?: string;
    surname?: string;
    patronymic?: string | null;
  };
}

export interface BalanceHistory {
  id: string;
  amount: number;
  operationType: 'REPLENISHMENT' | 'WITHDRAWAL' | 'PAYMENT';
  resultAccount: number;
  description?: string;
}

export interface BalanceOperationDto {
  userId?: string;
  balanceId?: string;
  amount: number;
  operationType: 'REPLENISHMENT' | 'WITHDRAWAL' | 'PAYMENT';
  description?: string;
}

export interface BalanceFull {
  id: string;
  createdTs: string;
  updatedTs: string;
  account: number;
  user: {
    id: string;
    login: string;
    email: string;
    profile: UserProfile | null;
  };
  balanceHistoryList: BalanceHistory[];
}

// === Authenticated User's Profile API ===

export const userProfileApi = {
  /** GET /users/profile — get current user's full profile */
  getProfile: async (): Promise<UserFull> => {
    const response = await api.get<UserFull>('/users/profile');
    return response.data;
  },

  /** PUT /users/profile — update current user's profile */
  updateProfile: async (data: ProfileUpdateInput): Promise<void> => {
    await api.put('/users/profile', data);
  },

  /** GET /users/profile/balance — get current user's balance */
  getBalance: async (): Promise<BalanceFull> => {
    const response = await api.get<BalanceFull>('/users/profile/balance');
    return response.data;
  },

  /** GET /users/profile/refresh-token — get current user's refresh tokens */
  getRefreshTokens: async (): Promise<RefreshTokenInfo[]> => {
    const response = await api.get<RefreshTokenInfo[]>('/users/profile/refresh-token');
    return response.data;
  },
};

// === Interfaces for Admin CRUD ===

export interface UserCreateInput {
  login: string;
  password: string;
  email?: string;
  phoneNumber?: string;
  role?: 'USER' | 'MANAGER' | 'ADMIN';
  blocked?: boolean;
  profile?: {
    name?: string;
    surname?: string;
    patronymic?: string | null;
  };
}

export interface UserUpdateInput {
  login?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  blocked?: boolean;
  profile?: {
    name?: string;
    surname?: string;
    patronymic?: string | null;
  };
}

export interface UserCreateResponse {
  create_user: string;
  id: string;
}

// === Admin User CRUD API (requires users:write — ADMIN only) ===

export const userAdminApi = {
  /** GET /users — list all users (paginated) */
  getAll: async (page = 0, size = 20, sort = 'createdTs,desc'): Promise<UserBasic[]> => {
    const response = await api.get<UserBasic[]>('/users', {
      params: { page, size, sort },
    });
    return response.data;
  },

  /** GET /users/id — get user by ID */
  getById: async (id: string): Promise<UserFull> => {
    const response = await api.get<UserFull>('/users/id', {
      params: { id },
    });
    return response.data;
  },

  /** POST /users — create new user */
  create: async (data: UserCreateInput): Promise<UserCreateResponse> => {
    const response = await api.post<UserCreateResponse>('/users', data);
    return response.data;
  },

  /** PATCH /users/id — update user */
  update: async (id: string, data: UserUpdateInput): Promise<void> => {
    await api.patch('/users/id', data, {
      params: { id },
    });
  },

  /** DELETE /users/id — delete user */
  delete: async (id: string): Promise<void> => {
    await api.delete('/users/id', {
      params: { id },
    });
  },
};

// === User Search API (requires users:write — ADMIN only) ===

export const userSearchApi = {
  /** Search users by login, email, or phone number */
  search: async (text: string): Promise<UserBasic[]> => {
    const response = await api.get<UserBasic[]>('/users/search', {
      params: { text },
    });
    return response.data;
  },

  /** Search users by login */
  searchByLogin: async (login: string): Promise<UserBasic[]> => {
    const response = await api.get<UserBasic[]>('/users/search/login', {
      params: { login },
    });
    return response.data;
  },

  /** Search users by email */
  searchByEmail: async (email: string): Promise<UserBasic[]> => {
    const response = await api.get<UserBasic[]>('/users/search/email', {
      params: { email },
    });
    return response.data;
  },

  /** Search users by phone number */
  searchByPhoneNumber: async (phone: string): Promise<UserBasic[]> => {
    const response = await api.get<UserBasic[]>('/users/search/phoneNumber', {
      params: { phoneNumber: phone },
    });
    return response.data;
  },

  /** Get user by exact login */
  getByLogin: async (login: string): Promise<UserBasic> => {
    const response = await api.get<UserBasic>('/users/search/exact/login', {
      params: { login },
    });
    return response.data;
  },

  /** Get user by exact email */
  getByEmail: async (email: string): Promise<UserBasic> => {
    const response = await api.get<UserBasic>('/users/search/exact/email', {
      params: { email },
    });
    return response.data;
  },

  /** Get user by exact phone number */
  getByPhoneNumber: async (phone: string): Promise<UserBasic> => {
    const response = await api.get<UserBasic>('/users/search/exact/phoneNumber', {
      params: { phoneNumber: phone },
    });
    return response.data;
  },
};

// === Balance Admin API (requires balances:write — ADMIN/MANAGER) ===

export const balanceAdminApi = {
  /** GET /balance — list all balances (paginated) */
  getAll: async (page = 0, size = 50, sort = 'createdTs,desc'): Promise<BalanceFull[]> => {
    const response = await api.get<BalanceFull[]>('/balance', {
      params: { page, size, sort },
    });
    return response.data;
  },

  /** GET /balance/user?userId= — get balance by user ID */
  getByUserId: async (userId: string): Promise<BalanceFull> => {
    const response = await api.get<BalanceFull>('/balance/user', {
      params: { userId },
    });
    return response.data;
  },

  /** GET /balance/id?id= — get balance by balance ID */
  getById: async (id: string): Promise<BalanceFull> => {
    const response = await api.get<BalanceFull>('/balance/id', {
      params: { id },
    });
    return response.data;
  },

  /** POST /balance/operation — perform balance operation */
  operation: async (data: BalanceOperationDto): Promise<void> => {
    await api.post('/balance/operation', data);
  },
};
