import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const { sendPasswordResetOtp, verifyPasswordResetOtp, resetAdvertiserPassword } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetOtp(formData.email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyPasswordResetOtp(formData.email, formData.otp);
      setResetToken(res.reset_token);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await resetAdvertiserPassword(resetToken, formData.password);
      setSuccessMsg('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
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
          <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>Reset Password</h2>
          <p className="text-secondary">
            {step === 1 && "Enter your email to receive a password reset link"}
            {step === 2 && `Enter the 6-digit code sent to ${formData.email}`}
            {step === 3 && "Create a new secure password"}
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

        {successMsg && (
          <div style={{
            backgroundColor: 'rgba(46, 160, 67, 0.1)',
            border: '1px solid var(--success)',
            color: '#56d364',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--spacing-6)',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {successMsg}
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
                  placeholder="name@company.com"
                  style={{ paddingLeft: '40px' }}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: '48px' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Send Reset Code <ArrowRight size={18} /></>}
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
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Code <CheckCircle2 size={18} /></>}
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary w-full" disabled={loading}>Change Email</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex-col gap-5">
            <div className="flex-col">
              <label className="input-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder="Enter new password"
                  style={{ paddingLeft: '40px' }}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="flex-col">
              <label className="input-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  style={{ paddingLeft: '40px' }}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: '48px' }} disabled={loading || !!successMsg}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Reset Password <CheckCircle2 size={18} /></>}
            </button>
          </form>
        )}

        <div className="text-center mt-8">
          <p className="text-secondary text-sm">
            Remembered your password? <Link to="/login" className="font-medium text-accent">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
