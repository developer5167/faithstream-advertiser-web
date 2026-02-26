import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, MousePointerClick, Eye, CreditCard, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { advertiser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentAds, setRecentAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, adsRes] = await Promise.all([
        api.get('/ads/my/dashboard'),
        api.get('/ads/my')
      ]);
      setStats(statsRes.data);
      setRecentAds(adsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async (adId: number, currentStatus: string) => {
    try {
      const action = currentStatus === 'PAUSED' ? 'resume' : 'pause';
      await api.patch(`/ads/my/${adId}/${action}`);
      fetchData(); // Refresh the list
    } catch (err) {
      console.error('Failed to toggle ad status', err);
      alert('Action failed. Ensure your wallet has funds if resuming.');
    }
  };

  const handleDelete = async (adId: number) => {
    if (!confirm('Are you sure you want to permanently delete this campaign?')) return;
    try {
      await api.delete(`/ads/my/${adId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete ad', err);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  // Generate some charts based on recent ads if available, else empty chart
  const mockChartData = [
    { name: 'Mon', views: 0, clicks: 0 },
    { name: 'Tue', views: 0, clicks: 0 },
    { name: 'Wed', views: 0, clicks: 0 },
    { name: 'Thu', views: 0, clicks: 0 },
    { name: 'Fri', views: 0, clicks: 0 },
    { name: 'Sat', views: 0, clicks: 0 },
    { name: 'Sun', views: 0, clicks: 0 },
  ];

  return (
    <div>
      <div className="flex-row justify-between" style={{ marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-1)' }}>Dashboard</h1>
          <p className="text-secondary">Track your campaigns and performance for {advertiser?.company_name}.</p>
        </div>
        <div className="flex-row gap-3">
          <span className={`badge ${advertiser?.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
            {advertiser?.status} Account
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
        <StatCard title="Total Impressions" value={stats?.total_views?.toLocaleString() || '0'} icon={Eye} />
        <StatCard title="Total Clicks" value={stats?.total_clicks?.toLocaleString() || '0'} icon={MousePointerClick} />
        <StatCard 
          title="CTR" 
          value={(stats?.ctr_percent || 0) + '%'} 
          icon={TrendingUp} 
        />
        <StatCard title="Total Spent" value={`₹${stats?.total_spent?.toLocaleString() || '0'}`} icon={CreditCard} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <div className="card">
          <h3 className="mb-6">Performance Trend</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="views" stroke="var(--primary-accent)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="clicks" stroke="var(--success)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-secondary mt-4 italic">Campaign-specific historical data will appear once ads accumulate impressions.</p>
        </div>

        <div className="card flex-col">
          <div className="flex-row justify-between mb-4">
            <h3 style={{ margin: 0 }}>Your Campaigns</h3>
            <span className="text-sm text-accent">{recentAds.length} Total</span>
          </div>
          <div className="flex-col gap-3" style={{ flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
            {recentAds.length === 0 ? (
              <div className="text-center text-secondary py-8">
                <p>No campaigns yet.</p>
              </div>
            ) : (
              recentAds.map(ad => (
                <div 
                  key={ad.id} 
                  onClick={() => navigate(`/campaign/${ad.id}`)}
                  style={{ 
                    padding: 'var(--spacing-3)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease'
                  }}
                  className="hover:border-accent"
                >
                  <div className="flex-row justify-between mb-2">
                    <span className="font-medium text-sm">{ad.title}</span>
                    <span className={`badge badge-${ad.status === 'APPROVED' ? 'success' : ad.status === 'PAUSED' ? 'danger' : ad.status === 'PENDING' ? 'warning' : 'neutral'}`} style={{ fontSize: '9px' }}>
                      {ad.status}
                    </span>
                  </div>
                  <div className="flex-row justify-between text-sm text-secondary mb-3" style={{ fontSize: '11px' }}>
                    <span>{ad.ad_type.replace('_', ' ')}</span>
                    <span>{ad.views_count?.toLocaleString() || 0} views</span>
                  </div>
                  
                  <div className="flex-row gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                    {ad.status === 'APPROVED' || ad.status === 'PAUSED' ? (
                      <button 
                         className="flex-row items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/10" 
                         style={{ flex: 1, justifyContent: 'center', transition: 'background 0.2s', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                         onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePauseResume(ad.id, ad.status); }}
                      >
                         {ad.status === 'PAUSED' ? <><Play size={12}/> Resume</> : <><Pause size={12}/> Pause</>}
                      </button>
                    ) : null}
                    
                    <button 
                       className="flex-row items-center justify-center text-xs px-2 py-1 rounded" 
                       style={{ width: '32px', transition: 'background 0.2s', border: '1px solid var(--danger)', backgroundColor: 'transparent', color: 'var(--danger)' }}
                       onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(ad.id); }}
                    >
                       <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, warning = false }: any) {
  return (
    <div className="card flex-col gap-3">
      <div className="flex-row justify-between">
        <span className="text-secondary text-sm font-medium uppercase">{title}</span>
        <Icon size={18} className="text-secondary" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {trend && (
        <div className={`text-sm ${warning ? 'text-warning' : 'text-success'} font-medium`}>
          {trend} from last week
        </div>
      )}
    </div>
  );
}
