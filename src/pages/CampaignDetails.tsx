import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, ArrowLeft, Eye, MousePointerClick, CreditCard, Activity, Pause, Play, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdDetails();
  }, [id]);

  const fetchAdDetails = async () => {
    try {
      const res = await api.get(`/ads/my/${id}`);
      setAd(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async () => {
    try {
      const action = ad.status === 'PAUSED' ? 'resume' : 'pause';
      await api.patch(`/ads/my/${id}/${action}`);
      fetchAdDetails();
    } catch (err) {
      alert('Action failed. Ensure your wallet has funds if resuming.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this campaign?')) return;
    try {
      await api.delete(`/ads/my/${id}`);
      navigate('/');
    } catch (err) {
      alert('Failed to delete ad');
    }
  };

  if (loading) return <div className="flex-row items-center justify-center h-64"><Loader2 className="animate-spin text-accent" /></div>;
  if (error) return <div className="text-danger p-8 text-center">{error}</div>;
  if (!ad) return <div className="p-8 text-center">Campaign not found</div>;

  // Format chart data based on the event queries
  const chartData = (ad.analytics || []).map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    views: Number(item.views),
    clicks: Number(item.clicks)
  }));

  const isActive = ad.status === 'APPROVED' || ad.status === 'PENDING';
  const isPaused = ad.status === 'PAUSED';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex-row items-center gap-4 mb-6">
        <button className="btn btn-secondary p-2" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex-row items-center gap-3">
             <h1 style={{ margin: 0 }}>{ad.title}</h1>
             <span className={`badge badge-${isActive ? 'success' : isPaused ? 'danger' : 'warning'}`}>
               {ad.status}
             </span>
          </div>
          <p className="text-secondary mt-1">Campaign ID: {ad.id} • {ad.ad_type.replace('_', ' ')}</p>
        </div>
        
        <div className="flex-row gap-2" style={{ marginLeft: 'auto' }}>
          {(isActive || isPaused) && (
             <button 
                className={`btn ${isPaused ? 'btn-primary' : 'btn-secondary'} flex-row items-center gap-2`}
                onClick={handlePauseResume}
             >
                {isPaused ? <><Play size={16}/> Resume</> : <><Pause size={16}/> Pause</>}
             </button>
          )}
          <button className="btn btn-secondary text-danger" onClick={handleDelete} title="Delete Campaign">
             <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Views" value={ad.views_count || 0} icon={Eye} />
        <StatCard title="Total Clicks" value={ad.clicks_count || 0} icon={MousePointerClick} />
        <StatCard 
          title="Avg. CTR" 
          value={ad.views_count > 0 ? ((ad.clicks_count / ad.views_count) * 100).toFixed(2) + '%' : '0%'} 
          icon={Activity} 
        />
        <StatCard title="Spend / Budget" value={`₹${Number(ad.total_spend || 0).toLocaleString()} / ₹${Number(ad.daily_budget_limit || 0).toLocaleString()}`} icon={CreditCard} />
      </div>

      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="col-span-2 card">
          <h3 className="mb-6">7-Day Performance Timeline</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="views" stroke="var(--primary-accent)" fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="clicks" stroke="var(--success)" fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex-col">
          <h3 className="mb-4">Ad Creative</h3>
          <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ad.ad_type === 'COVER_OVERLAY' ? (
               <img src={ad.media_url} alt="creative" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
               <video src={ad.media_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls muted />
            )}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
             <p className="text-secondary text-sm mb-1">Destination URL</p>
             <a href={ad.landing_url} target="_blank" rel="noreferrer" className="text-accent text-sm" style={{ wordBreak: 'break-all' }}>{ad.landing_url || 'No link provided'}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="card flex-col justify-center" style={{ padding: 'var(--spacing-4)' }}>
      <div className="flex-row items-center gap-2 mb-2">
         <div className="icon-wrapper" style={{ width: 32, height: 32, minWidth: 32, backgroundColor: 'rgba(255,255,255,0.05)' }}>
           <Icon className="text-secondary" size={16} />
         </div>
         <span className="text-secondary text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
