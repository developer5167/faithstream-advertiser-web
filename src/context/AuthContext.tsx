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
  loading: boolean;
  login: (data: any) => Promise<void>;
  initiateSignup: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('advertiser_token');
    if (token) {
      try {
        const res = await api.get('/advertiser-auth/me');
        setAdvertiser(res.data);
      } catch (err) {
        localStorage.removeItem('advertiser_token');
      }
    }
    setLoading(false);
  };

  const login = async (data: any) => {
    const res = await api.post('/advertiser-auth/login', data);
    localStorage.setItem('advertiser_token', res.data.token);
    setAdvertiser(res.data.advertiser);
  };

  const initiateSignup = async (email: string) => {
    await api.post('/advertiser-auth/initiate-signup', { email });
  };

  const verifyOTP = async (email: string, otp: string) => {
    await api.post('/advertiser-auth/verify-otp', { email, otp });
  };

  const signup = async (data: any) => {
    const res = await api.post('/advertiser-auth/signup', data);
    localStorage.setItem('advertiser_token', res.data.token);
    setAdvertiser(res.data.advertiser);
  };

  const logout = () => {
    localStorage.removeItem('advertiser_token');
    setAdvertiser(null);
  };

  return (
    <AuthContext.Provider value={{ advertiser, loading, login, initiateSignup, verifyOTP, signup, logout }}>
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
