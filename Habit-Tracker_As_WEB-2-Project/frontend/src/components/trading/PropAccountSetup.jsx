import React, { useState } from 'react';
import { Target, TrendingDown, DollarSign, ArrowRight, ArrowLeft, AlertTriangle, Trophy, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const STEPS = ['Account Basics', 'Drawdown Rules', 'Phase Targets', 'Review'];

const PropAccountSetup = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountSize: 100000,
    failedAccounts: 0,
    dailyDrawdownPct: 5,
    maxDrawdownPct: 10,
    phase1TargetPct: 8,
    phase2TargetPct: 5,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/prop-account', { ...formData, currentPhase: 1, status: 'active' });
      if (res.data.success) {
        onComplete(res.data.data);
      }
    } catch (error) {
      console.error('Failed to save prop account config', error);
    } finally {
      setLoading(false);
    }
  };

  const phase1TargetAmount = (formData.accountSize * formData.phase1TargetPct / 100).toFixed(0);
  const phase2TargetAmount = (formData.accountSize * formData.phase2TargetPct / 100).toFixed(0);
  const dailyDrawdownAmount = (formData.accountSize * formData.dailyDrawdownPct / 100).toFixed(0);
  const maxDrawdownAmount = (formData.accountSize * formData.maxDrawdownPct / 100).toFixed(0);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Target size={28} />
            <h2 className="text-2xl font-bold">Prop Firm Account Setup</h2>
          </div>
          <p className="text-blue-100 text-sm">Configure your challenge rules — this will track your drawdowns and phase targets automatically.</p>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-6">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${i === step ? 'bg-white text-blue-700' : i < step ? 'bg-blue-500 text-white' : 'bg-blue-500/30 text-blue-200'}`}>
                  {i < step ? '✓' : i + 1}. {s}
                </div>
                {i < STEPS.length - 1 && <ChevronRight size={14} className="text-blue-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-8">

          {/* Step 0: Account Basics */}
          {step === 0 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Tell us about your account</h3>
                <p className="text-gray-500 text-sm">We'll use this to calculate exact dollar amounts for every rule.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Account Size (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="number" name="accountSize" value={formData.accountSize} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold" />
                </div>
                <p className="text-xs text-gray-400 mt-1">e.g. 10000, 25000, 100000</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" />
                  Accounts Failed Before (Be Honest!)
                </label>
                <input type="number" name="failedAccounts" value={formData.failedAccounts} onChange={handleChange} min={0}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-lg font-bold" />
                <p className="text-xs text-orange-500 mt-1">📊 Every failed account teaches you something. We track this to measure your improvement over time.</p>
              </div>
            </div>
          )}

          {/* Step 1: Drawdown Rules */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Drawdown Rules</h3>
                <p className="text-gray-500 text-sm">These apply to <strong>all phases equally</strong>. Breach either limit = account failed.</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <TrendingDown className="text-red-500 mt-0.5 shrink-0" size={20} />
                <p className="text-sm text-red-700">Drawdown rules are universal — same for Phase 1, Phase 2, and Live account. One breach and the account is gone.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Daily Drawdown Limit (%)</label>
                  <input type="number" step="0.1" name="dailyDrawdownPct" value={formData.dailyDrawdownPct} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-red-300 focus:ring-2 focus:ring-red-500 outline-none text-lg font-bold" />
                  <p className="text-xs text-gray-400 mt-1">= ${Number(dailyDrawdownAmount).toLocaleString()} max daily loss</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Max Overall Drawdown (%)</label>
                  <input type="number" step="0.1" name="maxDrawdownPct" value={formData.maxDrawdownPct} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-red-300 focus:ring-2 focus:ring-red-500 outline-none text-lg font-bold" />
                  <p className="text-xs text-gray-400 mt-1">= ${Number(maxDrawdownAmount).toLocaleString()} max total loss</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Phase Targets */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Phase Profit Targets</h3>
                <p className="text-gray-500 text-sm">Hit Phase 1 target → auto-advances to Phase 2. Hit Phase 2 → you get the Live account!</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 border-2 border-blue-200 bg-blue-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-blue-800">Phase 1 — Evaluation</p>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">Harder</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Profit Target (%)</label>
                      <input type="number" step="0.1" name="phase1TargetPct" value={formData.phase1TargetPct} onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Target</p>
                      <p className="text-2xl font-black text-blue-700">+${Number(phase1TargetAmount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                    <ArrowRight size={18} />
                    <span>Target Hit → Advance to Phase 2</span>
                  </div>
                </div>

                <div className="p-5 border-2 border-purple-200 bg-purple-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-purple-800">Phase 2 — Verification</p>
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-bold">Easier</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Profit Target (%)</label>
                      <input type="number" step="0.1" name="phase2TargetPct" value={formData.phase2TargetPct} onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-purple-300 focus:ring-2 focus:ring-purple-500 outline-none text-lg font-bold" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Target</p>
                      <p className="text-2xl font-black text-purple-700">+${Number(phase2TargetAmount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600">
                    <Trophy size={18} />
                    <span>Target Hit → 🎉 Live Funded Account!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Review & Confirm</h3>
                <p className="text-gray-500 text-sm">Everything looks correct? Let's lock it in.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Account Size</span><span className="font-bold text-gray-900">${Number(formData.accountSize).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Previously Failed</span><span className="font-bold text-orange-600">{formData.failedAccounts} accounts</span></div>
                <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="text-gray-500 font-medium">Daily Drawdown</span><span className="font-bold text-red-600">-{formData.dailyDrawdownPct}% (${Number(dailyDrawdownAmount).toLocaleString()})</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Max Drawdown</span><span className="font-bold text-red-700">-{formData.maxDrawdownPct}% (${Number(maxDrawdownAmount).toLocaleString()})</span></div>
                <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="text-gray-500 font-medium">Phase 1 Target</span><span className="font-bold text-blue-700">+{formData.phase1TargetPct}% (${Number(phase1TargetAmount).toLocaleString()})</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-medium">Phase 2 Target</span><span className="font-bold text-purple-700">+{formData.phase2TargetPct}% (${Number(phase2TargetAmount).toLocaleString()})</span></div>
              </div>

              {formData.failedAccounts > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
                  💪 <strong>{formData.failedAccounts} failed account{formData.failedAccounts > 1 ? 's' : ''}</strong> behind you. That's {formData.failedAccounts * formData.accountSize > 0 ? `$${(formData.failedAccounts * formData.accountSize * 0.1).toLocaleString()}+` : ''} in lessons learned. This time, we trade with a plan.
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? 'Saving...' : '🚀 Start Challenge!'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropAccountSetup;
