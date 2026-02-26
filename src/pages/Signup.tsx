import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Building, Phone, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Details
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    otp: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, initiateSignup, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await initiateSignup(formData.email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOTP(formData.email, formData.otp);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
      padding: 'var(--spacing-6)'
    }}>
      <div className="glass-panel slide-up" style={{
        width: '100%',
        maxWidth: '500px',
        padding: 'var(--spacing-8)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="text-center mb-8">
          <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>Partner with Us</h2>
          <p className="text-secondary">
            {step === 1 && "Enter your business email to get started"}
            {step === 2 && `Enter the code sent to ${formData.email}`}
            {step === 3 && "Finalize your partner profile"}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(207, 34, 46, 0.1)',
            border: '1px solid var(--danger)',
            color: '#ff7b72',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--spacing-6)',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="flex-col gap-5">
            <div className="flex-col">
              <label className="input-label">Business Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  placeholder="ads@company.com"
                  style={{ paddingLeft: '40px' }}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: '48px' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Generate OTP <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="flex-col gap-5">
            <div className="flex-col">
              <label className="input-label">Verification Code</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="6-digit code"
                  maxLength={6}
                  style={{ paddingLeft: '40px', letterSpacing: '8px', fontSize: '1.2rem', textAlign: 'center' }}
                  value={formData.otp}
                  onChange={(e) => setFormData({...formData, otp: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: '48px' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Email <CheckCircle2 size={18} /></>}
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary w-full">Change Email</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="flex-col gap-5">
            <div className="flex-col">
              <label className="input-label">Company Name</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Your Business Ltd."
                  style={{ paddingLeft: '40px' }}
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex-col">
              <label className="input-label">Contact Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  style={{ paddingLeft: '40px' }}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex-col">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder="Create a secure password"
                  style={{ paddingLeft: '40px' }}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" style={{ height: '48px' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Complete Registration <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        <div className="text-center mt-8">
          <p className="text-secondary text-sm">
            Already have a partner account? <Link to="/login" className="font-medium text-accent">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
