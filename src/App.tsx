import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, LogOut, User, CreditCard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CreateAd from './pages/CreateAd';
import Wallet from './pages/Wallet';
import CampaignDetails from './pages/CampaignDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

const Sidebar = () => {
  const { advertiser, logout } = useAuth();
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Create Ad', path: '/create', icon: PlusCircle },
    { name: 'Wallet & Billing', path: '/wallet', icon: CreditCard },
  ];

  return (
    <aside style={{
      width: '260px',
      borderRight: '1px solid var(--border-color)',
      padding: 'var(--spacing-6) var(--spacing-4)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      backgroundColor: 'var(--bg-color)'
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
          return (
            <Link 
              key={item.path} 
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--border-radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
              }}
            >
              <item.icon size={20} style={{ color: isActive ? 'var(--primary-accent)' : 'inherit' }} />
              {item.name}
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
