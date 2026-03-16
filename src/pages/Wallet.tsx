import { useState, useEffect } from 'react';
import { CreditCard, History, Loader2, ArrowUpRight, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  created_at: string;
  reference_id: string;
}

export default function Wallet() {
  const { advertiser } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data } = await api.get('/wallet');
      setBalance(Number(data.balance));
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to fetch wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
       setError('Please enter a valid amount'); return;
    }
    
    setIsProcessing(true);
    setError('');

    try {
      const res = await loadRazorpayScript();
      if (!res) throw new Error('Razorpay SDK failed to load.');

      // 0. Get Razorpay Public Key from backend
      const { data: config } = await api.get('/wallet/config');
      const razorpayKeyId = config.razorpayKeyId;

      // 1. Create order on backend
      const { data: orderData } = await api.post('/wallet/deposit/order', {
        amountInr: Number(depositAmount)
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId, 
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'FaithStream Ads',
        description: 'Wallet Deposit',
        order_id: orderData.order.id,
        prefill: {
          name: advertiser?.company_name,
          email: advertiser?.email,
          contact: advertiser?.phone
        },
        theme: {
          color: '#388bfd' // primary accent
        },
        handler: async function (response: any) {
          // 3. Verify payment on backend
          try {
            const verifyRes = await api.post('/wallet/deposit/verify', {
              amountInr: Number(depositAmount),
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });
            
            setBalance(Number(verifyRes.data.newBalance));
            setDepositAmount('');
            fetchWalletData(); // refresh history
          } catch (err) {
            setError('Payment verification failed.');
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="flex-row items-center justify-center h-64"><Loader2 className="animate-spin text-accent" /></div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex-row justify-between mb-8">
        <div>
          <h1 className="mb-1">Wallet & Billing</h1>
          <p className="text-secondary">Manage your ad spend and view payment history.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Balance Card */}
        <div className="card flex-col justify-center" style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(56, 139, 253, 0.05) 100%)', border: '1px solid var(--primary-accent)' }}>
          <div className="flex-row items-center gap-3 mb-2">
             <div className="icon-wrapper" style={{ background: 'rgba(56, 139, 253, 0.1)' }}>
               <CreditCard className="text-accent" size={24} />
             </div>
             <h3 style={{ margin: 0 }}>Available Balance</h3>
          </div>
          <h1 style={{ fontSize: '3rem', margin: '10px 0', color: 'var(--text-primary)' }}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h1>
          <p className="text-secondary text-sm">Funds are deducted automatically based on ad performance (CPM/CPC).</p>
        </div>

        {/* Add Funds Form */}
        <div className="card">
          <h3 className="mb-4">Add Funds</h3>
          <form onSubmit={handleAddFunds} className="flex-col gap-4">
            <div>
              <label className="input-label">Amount (INR)</label>
              <div className="input-group">
                <span className="input-prefix text-secondary">₹</span>
                <input 
                  type="number" 
                  min="100" 
                  step="100"
                  placeholder="e.g. 5000" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  style={{ paddingLeft: '30px' }}
                />
              </div>
            </div>
            
            {error && <p className="text-danger text-sm">{error}</p>}
            
            <button type="submit" className="btn btn-primary" disabled={isProcessing || !depositAmount}>
              {isProcessing ? <><Loader2 className="animate-spin" size={16}/> Processing...</> : 'Proceed to Payment Gateway'}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="flex-row items-center gap-2 mb-6"><History size={20} className="text-secondary" /> Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center text-secondary py-8 border-dashed rounded-lg" style={{ border: '2px dashed var(--border-color)' }}>
             No transactions found. Add funds to start running ads.
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th className="py-3 px-4 font-normal text-sm">Date</th>
                  <th className="py-3 px-4 font-normal text-sm">Type</th>
                  <th className="py-3 px-4 font-normal text-sm">Reference ID</th>
                  <th className="py-3 px-4 font-normal text-sm text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-3 px-4 text-sm">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {tx.type === 'DEPOSIT' ? (
                        <span className="badge badge-success flex-row items-center gap-1" style={{ width: 'fit-content' }}><ArrowUpRight size={12}/> DEPOSIT</span>
                      ) : (
                        <span className="badge badge-neutral flex-row items-center gap-1" style={{ width: 'fit-content' }}><TrendingDown size={12}/> {tx.type.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-secondary font-mono">{tx.reference_id || 'SYSTEM_DEDUCTION'}</td>
                    <td className={`py-3 px-4 text-right font-bold ${Number(tx.amount) > 0 ? 'text-success' : 'text-primary'}`}>
                      {Number(tx.amount) > 0 ? '+' : ''}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
