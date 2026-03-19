import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface Advertiser {
  id: string;
  company_name: string;
  email: string;
  phone?: string;
  status: string;
}

interface AuthContextType {
  advertiser: Advertiser | null;
  walletBalance: number;
  loading: boolean;
  login: (data: any) => Promise<void>;
  initiateSignup: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  sendPasswordResetOtp: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<{ reset_token: string }>;
  resetAdvertiserPassword: (resetToken: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshWallet = async () => {
    try {
      const res = await api.get('/wallet');
      setWalletBalance(Number(res.data.balance));
    } catch (err) {
      console.error('Failed to refresh wallet', err);
    }
  };

  const checkAuth = async () => {
    try {
      // ✅ Cookie is sent automatically by the browser (withCredentials: true).
      // No localStorage check needed — if the HttpOnly cookie is valid, this succeeds.
      const res = await api.get('/advertiser-auth/me');
      setAdvertiser(res.data);
      await refreshWallet();
    } catch {
      // Cookie missing or expired — user is not logged in
      setAdvertiser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: any) => {
    // Backend sets the HttpOnly cookie — we only receive the advertiser object
    const res = await api.post('/advertiser-auth/login', data);
    setAdvertiser(res.data.advertiser);
    await refreshWallet();
  };

  const initiateSignup = async (email: string) => {
    await api.post('/advertiser-auth/initiate-signup', { email });
  };

  const verifyOTP = async (email: string, otp: string) => {
    await api.post('/advertiser-auth/verify-otp', { email, otp });
  };

  const signup = async (data: any) => {
    // Backend sets the HttpOnly cookie — we only receive the advertiser object
    const res = await api.post('/advertiser-auth/signup', data);
    setAdvertiser(res.data.advertiser);
    await refreshWallet();
  };

  const sendPasswordResetOtp = async (email: string) => {
    await api.post('/advertiser-auth/forgot-password/send-otp', { email });
  };

  const verifyPasswordResetOtp = async (email: string, otp: string) => {
    const res = await api.post('/advertiser-auth/forgot-password/verify-otp', { email, otp });
    return res.data; // { reset_token: "..." }
  };

  const resetAdvertiserPassword = async (resetToken: string, newPassword: string) => {
    await api.post('/advertiser-auth/forgot-password/reset', {
      reset_token: resetToken,
      new_password: newPassword,
    });
  };

  const logout = async () => {
    try {
      // Backend clears the HttpOnly cookie via Set-Cookie with a past expiry date
      await api.post('/advertiser-auth/logout');
    } finally {
      setAdvertiser(null);
      setWalletBalance(0);
    }
  };

  return (
    <AuthContext.Provider value={{
      advertiser, walletBalance, loading, login, initiateSignup, verifyOTP, signup,
      sendPasswordResetOtp, verifyPasswordResetOtp, resetAdvertiserPassword,
      logout, refreshWallet
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
