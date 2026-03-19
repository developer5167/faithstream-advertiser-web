import { useEffect, useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Loader2, FileText, PlayCircle, Music, SkipForward, SkipBack, Share2, MoreVertical, Heart } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateAd() {
  const { walletBalance } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (walletBalance <= 0) {
      navigate('/');
    }
  }, [walletBalance, navigate]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'COVER_OVERLAY' as 'COVER_OVERLAY' | 'POWER_VIDEO' | 'APP_OPEN',
    landingUrl: '',
    startDate: '',
    endDate: '',
    dailyBudget: ''
  });

  const validateAspectRatio = (file: File, expectedRatio: number, tolerance = 0.05): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        URL.revokeObjectURL(img.src);
        resolve(Math.abs(ratio - expectedRatio) < tolerance);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setError('');
      
      if (formData.type === 'COVER_OVERLAY' || formData.type === 'APP_OPEN') {
        const isSquare = await validateAspectRatio(selectedFile, 1);
        if (!isSquare) {
          setError("Error: This ad format requires a strictly 1:1 (square) image. Please upload a square image.");
          return;
        }
      }

      setFile(selectedFile);
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const validateStep1 = () => {
    if (!formData.title) return "Title is required";
    if (!formData.startDate || !formData.endDate) return "Campaign dates are required";
    if (!formData.dailyBudget || isNaN(Number(formData.dailyBudget)) || Number(formData.dailyBudget) < 50) return "Minimum daily budget is ₹50";
    if (!file) return "Media attachment is required";
    return null;
  };

  const handleGoToPreview = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      // 1. Get presigned URL
      const { data: presignedData } = await api.post('/upload/presigned-url', {
        fileName: file.name,
        contentType: file.type,
        uploadType: formData.type === 'POWER_VIDEO' ? 'ad_video' : 'ad_image'
      });

      const { uploadUrl, publicUrl, s3Key: key } = presignedData.data;

      // 2. Upload to S3
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(percentCompleted);
        }
      });

      // 3. Create Ad in Backend
      await api.post('/ads', {
        title: formData.title,
        ad_type: formData.type,
        media_url: publicUrl,
        landing_url: formData.landingUrl,
        start_time: new Date(formData.startDate).toISOString(),
        end_time: new Date(formData.endDate).toISOString(),
        daily_budget_limit: Number(formData.dailyBudget),
        s3_key: key
      });
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex-row justify-between" style={{ marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-1)' }}>Create New Campaign</h1>
          <p className="text-secondary">Set up your advertisement to reach thousands of listeners.</p>
        </div>
        <div className="flex-row gap-2">
          <span className={`badge ${step === 1 ? 'badge-success' : 'badge-neutral'}`}>1. Setup</span>
          <ArrowRight size={14} className="text-secondary" />
          <span className={`badge ${step === 2 ? 'badge-warning' : 'badge-neutral'}`}>2. Preview & Confirm</span>
        </div>
      </div>

      {error && (
        <div className="mb-6" style={{ backgroundColor: 'rgba(207, 34, 46, 0.1)', border: '1px solid var(--danger)', color: '#ff7b72', padding: 'var(--spacing-4)', borderRadius: 'var(--border-radius-md)' }}>
          {error}
        </div>
      )}

      {step === 1 ? (
        <div className="card slide-up">
          <h3 className="mb-6">Campaign Details</h3>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex-col">
              <label className="input-label">Campaign Title</label>
              <input 
                type="text" 
                placeholder="e.g. Summer Gospel Fest" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="flex-col">
              <label className="input-label">Ad Format</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="COVER_OVERLAY">Cover Overlay (1:1) - ₹5.00 / Click</option>
                <option value="POWER_VIDEO">Power Video (9:16) - ₹0.15 / View</option>
                <option value="APP_OPEN">App Open Interstitial (Image) - ₹0.15 / View</option>
              </select>
            </div>
          </div>

          <div className="flex-col mb-6">
            <label className="input-label">Landing URL (Where users go when they click)</label>
            <input 
              type="url" 
              placeholder="https://example.com/tickets" 
              value={formData.landingUrl}
              onChange={e => setFormData({...formData, landingUrl: e.target.value})}
            />
          </div>

          <div className="flex-col mb-6">
            <label className="input-label">Daily Budget (INR) - Min ₹50</label>
            <div className="input-group">
               <span className="input-prefix text-secondary">₹</span>
               <input 
                 type="number" 
                 min="50"
                 placeholder="e.g. 500" 
                 value={formData.dailyBudget}
                 onChange={e => setFormData({...formData, dailyBudget: e.target.value})}
                 style={{ paddingLeft: '30px' }}
               />
            </div>
            <p className="text-secondary text-xs mt-1">Ads stop showing for the day once this budget is exhausted.</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex-col">
              <label className="input-label">Start Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="flex-col">
              <label className="input-label">End Date</label>
              <input 
                type="date" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept={formData.type === 'POWER_VIDEO' ? 'video/*' : 'image/*'}
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-col gap-4 mb-8" 
            style={{ 
              padding: 'var(--spacing-8)', 
              border: file ? '2px solid var(--primary-accent)' : '2px dashed var(--border-color)', 
              borderRadius: 'var(--border-radius-lg)', 
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: file ? 'rgba(56, 139, 253, 0.05)' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            {file ? (
              <div className="flex-col gap-2">
                {formData.type === 'COVER_OVERLAY' ? <FileText size={48} className="text-accent" style={{ margin: '0 auto' }} /> : <PlayCircle size={48} className="text-accent" style={{ margin: '0 auto' }} />}
                <h4 className="text-accent">{file.name}</h4>
                <p className="text-secondary text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB • Tap to change</p>
              </div>
            ) : (
              <>
                <UploadCloud size={48} className="text-secondary" style={{ margin: '0 auto' }} />
                <div>
                  <h4>Upload Media Attachment</h4>
                  <p className="text-secondary text-sm">
                    {formData.type === 'COVER_OVERLAY'
                      ? 'Select your strictly 1:1 square image (JPG, PNG)'
                      : formData.type === 'APP_OPEN'
                      ? 'Select a 1:1 square image (JPG, PNG) — strictly required'
                      : 'Select your 9:16 vertical video (MP4, max 30s)'}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleGoToPreview}
            >
              Continue to Preview <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="card slide-up">
          <div style={{ backgroundColor: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.3)', padding: 'var(--spacing-4)', borderRadius: 'var(--border-radius-md)' }} className="mb-6 flex-row gap-4">
            <AlertTriangle className="text-warning" size={24} />
            <div>
              <h4 className="text-warning mb-1" style={{ margin: 0 }}>Final Confirmation</h4>
              <p className="text-sm" style={{ color: '#d29922' }}>Please review your ad carefully. <strong>Once submitted, you cannot edit this campaign.</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="flex-col gap-4">
              <h3 className="flex-row gap-2"><Music size={20} /> Preview on Mobile</h3>
              
              <div className="mobile-mockup" style={{
                width: '100%',
                aspectRatio: '9/19',
                backgroundColor: '#0f172a',
                borderRadius: '32px',
                border: '8px solid #1e293b',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}>
                {/* Status Bar */}
                <div style={{ height: '24px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>9:41</span>
                  <div className="flex-row gap-1">
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', border: '1px solid white' }}></div>
                  </div>
                </div>

                {formData.type === 'COVER_OVERLAY' ? (
                  /* Music Player Mockup */
                  <div className="flex-col p-5" style={{ height: '100%' }}>
                    <div className="flex-row justify-between mb-8">
                      <ArrowLeft size={20} />
                      <span className="text-xs font-bold uppercase tracking-widest">Now Playing</span>
                      <MoreVertical size={20} />
                    </div>
                    
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', background: '#1e293b', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                      {/* Fake Album Art */}
                      <img src="https://images.unsplash.com/photo-1514525253344-781f7ad99854?w=500&auto=format&fit=crop&q=60" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} alt="" />
                      
                      {/* THE AD OVERLAY */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {filePreview ? (
                          <img src={filePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Ad" />
                        ) : (
                          <div className="text-secondary text-xs">Image Ad Here</div>
                        )}
                      </div>
                      
                      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10 }} className="badge badge-warning">SPONSORED</div>
                    </div>

                    <div className="mt-8 mb-6">
                      <div className="flex-row justify-between items-center">
                        <div>
                          <h4 style={{ margin: 0, fontSize: '18px' }}>Praise & Worship</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Hilltop United</p>
                        </div>
                        <Heart size={20} className="text-secondary" />
                      </div>
                    </div>

                    <div className="mb-6">
                      <div style={{ height: '4px', background: '#1e293b', borderRadius: '2px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%', background: 'var(--primary-accent)', borderRadius: '2px' }}></div>
                        <div style={{ position: 'absolute', left: '44%', top: '-4px', width: '12px', height: '12px', background: 'white', borderRadius: '50%' }}></div>
                      </div>
                      <div className="flex-row justify-between mt-2" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        <span>1:42</span>
                        <span>4:02</span>
                      </div>
                    </div>

                    <div className="flex-row justify-between items-center px-4 mb-8">
                      <SkipBack size={24} fill="white" />
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlayCircle size={32} color="black" fill="black" />
                      </div>
                      <SkipForward size={24} fill="white" />
                    </div>

                    <div className="flex-row justify-between px-2 text-secondary">
                      <Share2 size={18} />
                      <div style={{ width: '20px', height: '2px', background: 'white', opacity: 0.3 }}></div>
                      <div style={{ display: 'flex' }}>
                        <Music size={14} style={{ marginRight: '-4px' }} />
                        <Music size={14} />
                      </div>
                    </div>
                  </div>
                ) : formData.type === 'APP_OPEN' ? (
                  /* App Open Interstitial Mockup */
                  <div style={{ height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: '#1A1A1A', borderRadius: '12px', overflow: 'hidden', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                      <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '8px', fontWeight: 'bold', color: 'var(--primary-accent)', background: 'rgba(56,139,253,0.15)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '1px' }}>SPONSORED</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>{formData.title || 'Your Title'}</span>
                      </div>
                      <div style={{ background: '#2A2A2A', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {filePreview ? <img src={filePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Ad" /> : <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Square Image Ad</span>}
                      </div>
                      <div style={{ padding: '10px 12px 6px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '6px', textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Got It</div>
                        <p style={{ textAlign: 'center', fontSize: '8px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>Remove ads with Premium</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Video Player Mockup */
                  <div style={{ height: '100%', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
                      {filePreview && (
                        <video src={filePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted />
                      )}
                    </div>
                    
                    {/* Video HUD */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
                      <div className="flex-row justify-between items-center" style={{ marginTop: '30px' }}>
                        <span className="badge badge-warning">VIDEO AD</span>
                        <div style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', fontSize: '10px' }}>AD ENDS IN 0:15</div>
                      </div>

                      <div>
                         <h4 style={{ color: 'white', marginBottom: '8px' }}>{formData.title || 'Your Campaign Headline'}</h4>
                         <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '16px' }}>Available on FaithStream</p>
                         
                         <div className="flex-row gap-4 mb-4">
                            <div className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '12px', minWidth: '120px' }}>LEARN MORE</div>
                         </div>

                         <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: '30%', background: 'var(--primary-accent)', borderRadius: '2px' }}></div>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-col gap-4">
              <h3>Campaign Summary</h3>
              
              <div className="flex-col gap-2 p-4" style={{ backgroundColor: 'var(--bg-color)', padding: 'var(--spacing-4)', borderRadius: 'var(--border-radius-md)' }}>
                <div className="flex-row justify-between">
                  <span className="text-secondary text-sm">Title</span>
                  <span className="font-medium">{formData.title}</span>
                </div>
                <div className="flex-row justify-between">
                  <span className="text-secondary text-sm">Format</span>
                  <span className="font-medium">{formData.type.replace('_', ' ')}</span>
                </div>
                <div className="flex-row justify-between">
                  <span className="text-secondary text-sm">Duration</span>
                  <span className="font-medium">{formData.startDate} to {formData.endDate}</span>
                </div>
                <div className="flex-row justify-between">
                  <span className="text-secondary text-sm">Landing URL</span>
                  <span className="font-medium text-accent text-sm" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.landingUrl || 'None'}</span>
                </div>
                <div className="flex-row justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                   <span className="text-secondary text-sm">Media File</span>
                   <span className="text-sm">{file?.name}</span>
                </div>
                
                <hr style={{ borderColor: 'var(--border-color)', margin: 'var(--spacing-2) 0' }} />
                
                <div className="flex-row justify-between text-lg font-bold">
                  <span>Daily Budget</span>
                  <span className="text-success">₹{(Number(formData.dailyBudget) || 0).toLocaleString()} / day</span>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-secondary">Estimated Delivery: </span>
                  <span className="text-xs font-bold text-accent">
                     {formData.type === 'COVER_OVERLAY'
                        ? `~${Math.floor(Number(formData.dailyBudget) / 5)} Clicks`
                        : `~${Math.floor(Number(formData.dailyBudget) / 0.15).toLocaleString()} Views`}
                  </span>
                </div>
              </div>

              <div className="flex-col gap-3 mt-4">
                <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} /> {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Processing...'}</>
                  ) : (
                    <><CheckCircle2 size={18} /> Submit Campaign</>
                  )}
                </button>
                <button className="btn btn-secondary w-full" onClick={() => setStep(1)} disabled={loading}>
                  <ArrowLeft size={18} /> Back to Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

