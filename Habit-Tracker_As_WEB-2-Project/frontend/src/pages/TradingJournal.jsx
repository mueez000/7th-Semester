import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Activity, X, Edit2, Trash2, Target, AlertTriangle, XCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import PropAccountSetup from '../components/trading/PropAccountSetup';

const TradingJournal = () => {
  const [propAccount, setPropAccount] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);

  const initialFormState = {
    asset: 'XAU/USD',
    position: 'Long',
    status: 'Win',
    entryPrice: '',
    exitPrice: '',
    lotSize: '',
    pnl: '',
    strategy: '',
    emotion: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchConfigAndTrades();
  }, []);

  const fetchConfigAndTrades = async () => {
    try {
      setLoadingConfig(true);
      setLoading(true);
      const [accountRes, tradesRes] = await Promise.all([
        api.get('/prop-account'),
        api.get('/trades')
      ]);
      if (accountRes.data.success && accountRes.data.data) {
        setPropAccount(accountRes.data.data);
      }
      if (tradesRes.data.success) {
        setTrades(tradesRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoadingConfig(false);
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trades');
      if (res.data.success) {
        setTrades(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        entryPrice: Number(formData.entryPrice),
        lotSize: Number(formData.lotSize),
        exitPrice: formData.exitPrice ? Number(formData.exitPrice) : null,
        pnl: formData.pnl ? Number(formData.pnl) : undefined
      };

      if (editingTrade) {
        const res = await api.put(`/trades/${editingTrade._id}`, payload);
        if (res.data.success) {
          toast.success('Trade updated!');
          if (res.data.aiMessage) toast.success(res.data.aiMessage, { icon: '🤖' });
        }
      } else {
        const res = await api.post('/trades', payload);
        if (res.data.success) {
          toast.success('Trade logged successfully!');
          if (res.data.aiMessage) toast.success(res.data.aiMessage, { icon: '🤖' });
        }
      }
      setShowModal(false);
      setEditingTrade(null);
      setFormData(initialFormState);
      fetchTrades();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save trade');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    try {
      await api.delete(`/trades/${id}`);
      toast.success('Trade deleted');
      fetchTrades();
    } catch (error) {
      toast.error('Failed to delete trade');
    }
  };

  const openEditModal = (trade) => {
    setEditingTrade(trade);
    setFormData({
      asset: trade.asset,
      position: trade.position,
      status: trade.status,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || '',
      lotSize: trade.lotSize,
      pnl: trade.pnl || '',
      strategy: trade.strategy || '',
      emotion: trade.emotion || '',
      notes: trade.notes || ''
    });
    setShowModal(true);
  };

  // Stats calculation
  const closedTrades = trades.filter(t => t.status !== 'Break-Even');
  const wins = closedTrades.filter(t => t.status === 'Win').length;
  const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
  const totalPnL = trades.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
  
  if (loadingConfig) {
    return <div className="p-10 text-center text-gray-500">Loading Account Details...</div>;
  }

  if (!propAccount) {
    return <PropAccountSetup onComplete={(data) => setPropAccount(data)} />;
  }

  const phase = propAccount.currentPhase;
  const isFunded = propAccount.status === 'funded';
  const isFailed = propAccount.status === 'failed';

  // Current phase target
  const currentTargetPct = phase === 1 ? propAccount.phase1TargetPct : propAccount.phase2TargetPct;
  const currentBalance = propAccount.accountSize + totalPnL;
  const targetBalance = propAccount.accountSize * (1 + currentTargetPct / 100);
  const maxLossBalance = propAccount.accountSize * (1 - propAccount.maxDrawdownPct / 100);
  const targetProgress = Math.max(0, Math.min(100, (totalPnL / (propAccount.accountSize * (currentTargetPct / 100))) * 100));
  const drawdownProgress = Math.max(0, Math.min(100, (Math.abs(Math.min(0, totalPnL)) / (propAccount.accountSize * (propAccount.maxDrawdownPct / 100))) * 100));
  const isBreachingDrawdown = currentBalance <= maxLossBalance;

  const handleAdvancePhase = async () => {
    try {
      const res = await api.patch('/prop-account/advance-phase');
      if (res.data.success) {
        setPropAccount(res.data.data);
        toast.success(phase === 1 ? '🎉 Promoted to Phase 2! Keep the discipline.' : '🏆 FUNDED! You passed the challenge!');
      }
    } catch (e) {
      toast.error('Failed to advance phase');
    }
  };

  const handleFailAccount = async () => {
    if (!window.confirm('Mark this account as FAILED and reset to Phase 1?')) return;
    try {
      const res = await api.patch('/prop-account/fail');
      if (res.data.success) {
        setPropAccount(res.data.data);
        toast.error(`💔 Account #${res.data.data.failedAccounts} failed. Learn from it — the next one will be different.`, { duration: 6000 });
      }
    } catch (e) {
      toast.error('Failed to update account status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#dadce0]">
        <div>
          <h1 className="text-2xl font-bold text-[#202124] flex items-center">
            <TrendingUp className="text-[#1a73e8] mr-3" size={28} /> Phase {phase} Funded Account
          </h1>
          <p className="text-[#5f6368] mt-1 ml-10">Track your XAU/USD edge. Account Size: ${propAccount.accountSize.toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isFailed ? (
            <button 
              onClick={() => { setPropAccount(null); }}
              className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#174ea6] text-white font-semibold px-5 py-2.5 rounded-full transition-all hover:shadow-lg"
            >
              Start New Challenge
            </button>
          ) : (
            <>
              <button 
                onClick={() => { setPropAccount(null); }}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-full transition-all"
              >
                Edit Config
              </button>
              <button 
                onClick={handleFailAccount}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-4 py-2.5 rounded-full border border-red-200 transition-all"
                title="Log account as failed — rule violation, drawdown breach, etc."
              >
                <XCircle size={18} />
                Account Failed
              </button>
              <button 
                onClick={() => { setEditingTrade(null); setFormData(initialFormState); setShowModal(true); }}
                className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#174ea6] text-white font-semibold px-5 py-2.5 rounded-full transition-all hover:shadow-lg"
              >
                <Plus size={18} />
                Log XAU/USD Trade
              </button>
            </>
          )}
        </div>
      </div>

      {/* Drawdown Alert */}
      {isFailed && (
        <div className="bg-red-600 text-white p-5 rounded-2xl flex items-center gap-4">
          <XCircle size={32} className="shrink-0" />
          <div>
            <p className="font-black text-xl">ACCOUNT FAILED</p>
            <p className="text-red-100 text-sm mt-1">Trading is locked. Start a new challenge to continue logging trades. Remember, every failure is a lesson.</p>
          </div>
        </div>
      )}

      {isBreachingDrawdown && !isFailed && (
        <div className="bg-red-600 text-white p-5 rounded-2xl flex items-center gap-4 animate-pulse">
          <AlertTriangle size={28} className="shrink-0" />
          <div>
            <p className="font-black text-lg">⚠️ DRAWDOWN BREACHED — STOP TRADING!</p>
            <p className="text-red-100 text-sm">Your balance (${currentBalance.toLocaleString(undefined, {maximumFractionDigits:2})}) has hit the max drawdown floor (${maxLossBalance.toLocaleString()}). This account should be marked as failed.</p>
          </div>
          <button onClick={handleFailAccount} className="ml-auto shrink-0 bg-white text-red-700 font-bold px-4 py-2 rounded-xl hover:bg-red-50 transition">Mark Failed</button>
        </div>
      )}

      {/* Phase Progress Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white ${phase === 1 ? 'bg-blue-600' : phase === 2 ? 'bg-purple-600' : 'bg-yellow-500'}`}>{isFunded ? '🏆' : phase}</div>
            <div>
              <p className="font-bold text-gray-800">{isFunded ? 'LIVE FUNDED ACCOUNT 🎉' : `Phase ${phase} — ${phase === 1 ? 'Evaluation' : 'Verification'}`}</p>
              <p className="text-xs text-gray-500">{isFunded ? 'You passed! Trade the live account.' : `Target: +${currentTargetPct}% = +$${(propAccount.accountSize * currentTargetPct / 100).toLocaleString()}`}</p>
            </div>
          </div>
          {propAccount.failedAccounts > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
              {propAccount.failedAccounts} account{propAccount.failedAccounts > 1 ? 's' : ''} failed before
            </span>
          )}
          {!isFunded && targetProgress >= 100 && (
            <button onClick={handleAdvancePhase} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all animate-bounce">
              {phase === 1 ? '→ Advance to Phase 2' : '→ Claim Funded Account!'}
            </button>
          )}
        </div>
        {/* Phase Stepper */}
        <div className="flex items-center gap-2 mb-4">
          {['Phase 1', 'Phase 2', 'Funded'].map((p, i) => (
            <React.Fragment key={p}>
              <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                (i === 0 && phase === 1 && !isFunded) ? 'bg-blue-600 text-white' :
                (i === 1 && phase === 2 && !isFunded) ? 'bg-purple-600 text-white' :
                (i === 2 && isFunded) ? 'bg-yellow-500 text-white' :
                (i < (isFunded ? 3 : phase - 1)) ? 'bg-gray-300 text-gray-700 line-through' :
                'bg-gray-100 text-gray-400'
              }`}>{i === 2 ? '🏆 ' : ''}{p}</div>
              {i < 2 && <div className={`flex-1 h-1 rounded-full ${i < phase - 1 || isFunded ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
        {/* Target progress */}
        {!isFunded && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Profit Progress: {targetProgress.toFixed(1)}%</span>
              <span>${Math.max(0, totalPnL).toLocaleString(undefined,{maximumFractionDigits:2})} / ${(propAccount.accountSize * currentTargetPct / 100).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full transition-all duration-700 ${totalPnL >= 0 ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${targetProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="google-card p-5 border-l-4 border-blue-500">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2"><DollarSign size={14}/> Current Balance</p>
          <p className="text-2xl font-black text-gray-900">${currentBalance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
          <p className={`text-xs mt-1 font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalPnL >= 0 ? '+' : ''}{((totalPnL / propAccount.accountSize) * 100).toFixed(2)}% Net</p>
        </div>
        <div className="google-card p-5 border-l-4 border-red-500">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2"><TrendingDown size={14}/> Drawdown Floor</p>
          <p className="text-2xl font-black text-gray-900">${maxLossBalance.toLocaleString()}</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${drawdownProgress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{drawdownProgress.toFixed(1)}% drawdown used</p>
        </div>
        <div className="google-card p-5 border-l-4 border-green-500">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2"><Target size={14}/> Phase {phase} Target</p>
          <p className="text-2xl font-black text-gray-900">${targetBalance.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">+{currentTargetPct}% needed</p>
        </div>
        <div className="google-card p-5 border-l-4 border-purple-500">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2"><Activity size={14}/> Win Rate</p>
          <p className="text-2xl font-black text-gray-900">{winRate}%</p>
          <p className="text-xs text-gray-400 mt-1">{trades.length} trades · {wins}W / {closedTrades.length - wins}L</p>
        </div>
      </div>

      {/* Trade History Table */}
      <div className="google-card p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-[#202124]">Trade History</h3>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading trades...</div>
        ) : trades.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-600">No trades logged yet</p>
            <p className="text-sm">Start journaling your edge to see your progress here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                  <th className="p-4">Date</th>
                  <th className="p-4">Asset</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Entry / Exit</th>
                  <th className="p-4">PnL</th>
                  <th className="p-4">Emotion</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {trades.map(trade => (
                  <tr key={trade._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600">
                      <div>{format(new Date(trade.entryDate), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-gray-400">{format(new Date(trade.entryDate), 'HH:mm')}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{trade.asset}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${trade.position === 'Long' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                        {trade.position}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold 
                        ${trade.status === 'Win' ? 'bg-green-100 text-green-700' : 
                          trade.status === 'Loss' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {trade.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>IN: <span className="font-medium">${trade.entryPrice}</span></div>
                      {trade.exitPrice && <div>OUT: <span className="font-medium">${trade.exitPrice}</span></div>}
                    </td>
                    <td className="p-4 font-bold">
                      {trade.pnl !== 0 && trade.pnl !== undefined && trade.pnl !== null ? (
                        <span className={trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}>
                          {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-gray-600 italic">
                      {trade.emotion || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(trade)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(trade._id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">{editingTrade ? 'Edit Trade' : 'Log New Trade'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Asset (Fixed) *</label>
                  <input type="text" name="asset" value={formData.asset} disabled className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-100 font-bold text-gray-700 outline-none transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Position *</label>
                    <select name="position" value={formData.position} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                      <option value="Long">Long 📈</option>
                      <option value="Short">Short 📉</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                      <option value="Win">Win</option>
                      <option value="Loss">Loss</option>
                      <option value="Break-Even">Break-Even</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Entry Price *</label>
                  <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleInputChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Exit Price</label>
                  <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lot Size *</label>
                  <input type="number" step="0.01" name="lotSize" value={formData.lotSize} onChange={handleInputChange} required placeholder="e.g. 1.5" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total PnL ($)</label>
                  <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleInputChange} placeholder="Leave blank to auto-calculate" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  <p className="text-xs text-gray-400 mt-1">If exit price is provided, PnL is auto-calculated.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Strategy / Setup</label>
                  <input type="text" name="strategy" value={formData.strategy} onChange={handleInputChange} placeholder="e.g. Pullback, Breakout" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Psychological Emotion</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Confident', 'Patient', 'FOMO', 'Greed', 'Revenge Trading', 'Anxious', 'Bored'].map(emo => (
                    <button 
                      type="button" 
                      key={emo}
                      onClick={() => setFormData(prev => ({ ...prev, emotion: emo }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.emotion === emo ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
                <input type="text" name="emotion" value={formData.emotion} onChange={handleInputChange} placeholder="Or type your own emotion..." className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" placeholder="Why did you take this trade? Did you follow your rules?" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors">
                  {editingTrade ? 'Update Trade' : 'Save Trade'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TradingJournal;
