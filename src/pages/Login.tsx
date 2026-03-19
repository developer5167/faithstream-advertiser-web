import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
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
        maxWidth: '450px',
        padding: 'var(--spacing-8)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="text-center mb-8">
          <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>Welcome Back</h2>
          <p className="text-secondary">Sign in to manage your ad campaigns</p>
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

        <form onSubmit={handleSubmit} className="flex-col gap-6">
          <div className="flex-col">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                placeholder="advertiser@company.com"
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="••••••••"
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary-accent)', textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            style={{ height: '48px', marginTop: 'var(--spacing-2)' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-secondary text-sm">
            Interested in advertising? <Link to="/signup" className="font-medium text-accent">Create a business account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
