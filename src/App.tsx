import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, LogOut, User, CreditCard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CreateAd from './pages/CreateAd';
import Wallet from './pages/Wallet';
import CampaignDetails from './pages/CampaignDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

const Sidebar = () => {
  const { advertiser, walletBalance, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Create Ad', path: '/create', icon: PlusCircle, restricted: true },
    { name: 'Wallet & Billing', path: '/wallet', icon: CreditCard },
  ];

  const handleNavClick = (e: React.MouseEvent, item: any) => {
    if (item.restricted && walletBalance <= 0) {
      e.preventDefault();
      setShowRestrictedModal(true);
      return;
    }
  };

  return (
    <aside style={{
      width: '260px',
      borderRight: '1px solid var(--border-color)',
      padding: 'var(--spacing-6) var(--spacing-4)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      backgroundColor: 'var(--bg-color)',
      zIndex: 100
    }}>
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--primary-accent)' }}>⬡</span>
          FaithStream <span style={{ fontWeight: 300, fontSize: '0.9em', color: 'var(--text-secondary)' }}>Ads</span>
        </h2>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isLocked = item.restricted && walletBalance <= 0;

          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--border-radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                opacity: isLocked ? 0.6 : 1,
                fontWeight: isActive ? 600 : 500,
                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                position: 'relative',
              }}
            >
              <item.icon size={20} style={{ color: isActive ? 'var(--primary-accent)' : 'inherit' }} />
              {item.name}
              {isLocked && <PlusCircle size={14} style={{ position: 'absolute', right: '12px', opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      <div className="flex-col gap-4" style={{ marginTop: 'auto' }}>
        <div className="flex-row gap-3 p-3" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
            <User size={16} className="text-accent" />
          </div>
          <div className="flex-col" style={{ maxWidth: '160px' }}>
            <span className="text-sm font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{advertiser?.company_name}</span>
            <span className="text-secondary" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{advertiser?.email}</span>
          </div>
        </div>
        <button className="btn btn-secondary w-full justify-between" onClick={logout}>
          Log Out
          <LogOut size={16} />
        </button>
      </div>

      {showRestrictedModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} className="fade-in">
          <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: 'var(--spacing-10)', border: '1px solid var(--primary-accent)' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(56, 139, 253, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto var(--spacing-6)'
            }}>
              <CreditCard size={32} className="text-accent" />
            </div>
            <h2 style={{ marginBottom: 'var(--spacing-3)' }}>Insufficient Funds</h2>
            <p className="text-secondary mb-8">Please add funds to your wallet to continue creating and running ads.</p>
            <div className="flex-col gap-3">
              <button 
                className="btn btn-primary w-full" 
                onClick={() => {
                  setShowRestrictedModal(false);
                  navigate('/wallet');
                }}
              >
                Go to Wallet
              </button>
              <button 
                className="btn btn-secondary w-full" 
                onClick={() => setShowRestrictedModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

const AppLayout = () => {
  const { advertiser } = useAuth();
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {advertiser && <Sidebar />}
      <main style={{ 
        flex: 1, 
        marginLeft: advertiser ? '260px' : '0', 
        padding: advertiser ? 'var(--spacing-8) var(--spacing-12)' : '0',
        maxWidth: advertiser ? '1200px' : 'none',
        margin: advertiser ? '0 auto' : '0',
        paddingLeft: advertiser ? 'calc(260px + var(--spacing-12))' : '0'
      }}>
        <div className="fade-in">
          <Routes>
            <Route path="/login" element={!advertiser ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!advertiser ? <Signup /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={!advertiser ? <ForgotPassword /> : <Navigate to="/" />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/campaign/:id" element={
              <ProtectedRoute>
                <CampaignDetails />
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <CreateAd />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
