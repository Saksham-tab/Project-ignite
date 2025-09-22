import fetchApi from './apiConfig';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: User;
}

/**
 * Login user with credentials
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return fetchApi<AuthResponse>('users/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
};

/**
 * Register new user
 */
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  return fetchApi<AuthResponse>('users/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  return fetchApi<UserProfileResponse>('users/profile');
};

export const verifyOtp = async (data: { email: string; emailOTP: string; phone?: string; phoneOTP?: string }) => {
  return fetchApi<{ success: boolean; data: any; message?: string }>('users/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const resendOtp = async (data: { email: string; phone?: string }) => {
  return fetchApi<{ success: boolean; message?: string }>('users/resend-otp', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export default {
  loginUser,
  registerUser,
  getUserProfile,
  verifyOtp,
  resendOtp
};
