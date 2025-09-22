import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services';
import type { User as ApiUser } from '../services/userService';
import type { RegisterData } from '../services/userService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: RegisterData) => Promise<{ user: User | null; needsVerification: boolean }>;
  logout: () => void;
  isLoading: boolean;
  pendingVerificationUser: User | null;
  verifyOtp: (data: { email: string; emailOTP: string; phone?: string; phoneOTP?: string }) => Promise<boolean>;
  resendOtp: (data: { email: string; phone?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerificationUser, setPendingVerificationUser] = useState<User | null>(null);

  const apiUserToLocalUser = (apiUser: ApiUser): User => ({
    id: apiUser._id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    role: apiUser.role
  });

  useEffect(() => {
    // Check for stored token
    const token = localStorage.getItem('ignite_token');
    const storedUser = localStorage.getItem('ignite_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      
      // Optionally verify token with backend
      userService.getUserProfile().catch(() => {
        // Token invalid or expired
        localStorage.removeItem('ignite_token');
        localStorage.removeItem('ignite_user');
        setUser(null);
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await userService.loginUser({ email, password });
      
      const userData = apiUserToLocalUser(response.data.user);
      
      // Store token and user data
      localStorage.setItem('ignite_token', response.data.token);
      localStorage.setItem('ignite_user', JSON.stringify(userData));
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: RegisterData): Promise<{ user: User | null; needsVerification: boolean }> => {
    setIsLoading(true);
    try {
      const response = await userService.registerUser(userData);
      const newUser = apiUserToLocalUser(response.data.user);
      setPendingVerificationUser(newUser);
      return { user: newUser, needsVerification: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { user: null, needsVerification: false };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (data: { email: string; emailOTP: string; phone?: string; phoneOTP?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await userService.verifyOtp(data);
      if (response.success) {
        // After verification, log in user
        const profile = await userService.getUserProfile();
        const userData = apiUserToLocalUser(profile.data);
        localStorage.setItem('ignite_user', JSON.stringify(userData));
        setUser(userData);
        setPendingVerificationUser(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('OTP verification failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (data: { email: string; phone?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await userService.resendOtp(data);
      return response.success;
    } catch (error) {
      console.error('Resend OTP failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ignite_user');
    localStorage.removeItem('ignite_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, pendingVerificationUser, verifyOtp, resendOtp }}>
      {children}
    </AuthContext.Provider>
  );
};