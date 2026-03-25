import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface DiscountCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  applicable_plans: string[];
  free_months: number;
  is_active: boolean;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [activeTab, setActiveTab] = useState<'codes' | 'create'>('codes');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Create form
  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    max_uses: '',
    valid_until: '',
    applicable_plans: ['family', 'academy'],
    free_months: 0,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, [user?.id]);

  const checkAdmin = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'check-admin' },
      });
      setIsAdmin(data?.isAdmin || false);
      if (data?.isAdmin) loadCodes();
    } catch (err) {
      console.warn('Admin check error:', err);
    }
    setLoading(false);
  };

  const becomeAdmin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'make-admin' },
      });
      if (error) throw error;
      if (data?.success) {
        setIsAdmin(true);
        loadCodes();
        showMessage('Admin access granted!', 'success');
      }
    } catch (err: any) {
      showMessage(err.message || 'Failed to grant admin access', 'error');
    }
  };

  const loadCodes = async () => {
    try {
      const { data } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'list' },
      });
      if (data?.codes) setCodes(data.codes);
    } catch (err) {
      console.warn('Load codes error:', err);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const createCode = async () => {
    if (!newCode.code.trim()) { showMessage('Code is required', 'error'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-discount-codes', {
        body: {
          action: 'create',
          code: newCode.code.toUpperCase().trim(),
          description: newCode.description,
          discount_type: newCode.discount_type,
          discount_value: newCode.discount_value,
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
          valid_until: newCode.valid_until || null,
          applicable_plans: newCode.applicable_plans,
          free_months: newCode.free_months,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showMessage(`Code "${newCode.code.toUpperCase()}" created!`, 'success');
      setNewCode({ code: '', description: '', discount_type: 'percentage', discount_value: 0, max_uses: '', valid_until: '', applicable_plans: ['family', 'academy'], free_months: 0 });
      loadCodes();
      setActiveTab('codes');
    } catch (err: any) {
      showMessage(err.message || 'Failed to create code', 'error');
    }
    setCreating(false);
  };

  const toggleCode = async (id: string, active: boolean) => {
    try {
      await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'toggle', code_id: id, is_active: active },
      });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: active } : c));
      showMessage(active ? 'Code activated' : 'Code deactivated', 'success');
    } catch (err) {
      showMessage('Failed to update code', 'error');
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    try {
      await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'delete', code_id: id },
      });
      setCodes(prev => prev.filter(c => c.id !== id));
      showMessage('Code deleted', 'success');
    } catch (err) {
      showMessage('Failed to delete code', 'error');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'FL-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(prev => ({ ...prev, code }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 className="font-heading font-bold text-xl text-charcoal mb-2">Admin Access Required</h2>
          <p className="font-body text-sm text-charcoal/50 mb-6">You need admin privileges to access this page. If you are the site owner, click below to set up admin access.</p>
          <button onClick={becomeAdmin} className="px-6 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold rounded-xl transition-all mb-3 w-full">
            Set Up Admin Access
          </button>
          <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }} className="font-body text-sm text-charcoal/40 hover:text-charcoal transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Message */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-body font-semibold text-sm flex items-center gap-2 ${
          messageType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {messageType === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          {message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-xl text-charcoal">Admin Panel</h1>
              <p className="font-body text-xs text-charcoal/40">Manage discount codes and site settings</p>
            </div>
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </button>
          </div>
          <div className="flex gap-1 mt-3 -mb-px">
            {[
              { id: 'codes' as const, label: 'Discount Codes' },
              { id: 'create' as const, label: 'Create New Code' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2 font-body text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
              }`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CODES LIST */}
        {activeTab === 'codes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg text-charcoal">All Discount Codes ({codes.length})</h3>
              <button onClick={() => setActiveTab('create')} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Code
              </button>
            </div>

            {codes.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <p className="font-heading font-bold text-charcoal mb-2">No discount codes yet</p>
                <p className="font-body text-sm text-charcoal/40">Create your first discount code to offer promotions or free access.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map(code => (
                  <div key={code.id} className={`bg-white rounded-xl p-5 border transition-all ${code.is_active ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-60'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-charcoal rounded-lg">
                          <span className="font-heading font-bold text-white text-lg tracking-wider">{code.code}</span>
                        </div>
                        <div>
                          <p className="font-body text-sm font-semibold text-charcoal">{code.description || 'No description'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-0.5 rounded-full font-body text-xs font-semibold ${
                              code.discount_type === 'free_access' ? 'bg-green-50 text-green-700' :
                              code.discount_type === 'percentage' ? 'bg-blue-50 text-blue-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {code.discount_type === 'free_access' ? 'Free Access' :
                               code.discount_type === 'percentage' ? `${code.discount_value}% off` :
                               `$${code.discount_value} off`}
                              {code.free_months > 0 ? ` · ${code.free_months} months` : ''}
                            </span>
                            <span className="font-body text-xs text-charcoal/40">
                              {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''} uses
                            </span>
                            <span className="font-body text-xs text-charcoal/40">
                              Plans: {code.applicable_plans?.join(', ')}
                            </span>
                            {code.valid_until && (
                              <span className="font-body text-xs text-charcoal/40">
                                Expires: {new Date(code.valid_until).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleCode(code.id, !code.is_active)} className={`w-10 h-5 rounded-full transition-all relative ${code.is_active ? 'bg-teal' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${code.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(code.code); showMessage('Code copied!', 'success'); }} className="p-2 hover:bg-gray-100 rounded-lg text-charcoal/40 transition-all" title="Copy code">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                        <button onClick={() => deleteCode(code.id)} className="p-2 hover:bg-red-50 rounded-lg text-charcoal/30 hover:text-red-500 transition-all" title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE CODE */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-xl text-charcoal mb-1">Create Discount Code</h3>
              <p className="font-body text-sm text-charcoal/40 mb-6">Create codes for influencers, early adopters, or promotional campaigns.</p>

              <div className="space-y-5">
                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={newCode.code} onChange={e => setNewCode(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="FREELEARNER50" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-heading font-bold text-lg tracking-wider bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 uppercase" />
                    <button onClick={generateRandomCode} className="px-4 py-3 bg-charcoal/5 hover:bg-charcoal/10 rounded-xl font-body text-sm font-semibold text-charcoal transition-all">Generate</button>
                  </div>
                </div>

                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Description</label>
                  <input type="text" value={newCode.description} onChange={e => setNewCode(p => ({ ...p, description: e.target.value }))} placeholder="e.g., Early influencer access, Launch promo..." className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>

                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Discount Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'free_access', label: 'Free Access', desc: 'Full free access', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { id: 'percentage', label: 'Percentage Off', desc: '% discount', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z' },
                      { id: 'fixed', label: 'Fixed Amount', desc: '$ off', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                    ].map(type => (
                      <button key={type.id} onClick={() => setNewCode(p => ({ ...p, discount_type: type.id }))} className={`p-4 rounded-xl border-2 text-center transition-all ${
                        newCode.discount_type === type.id ? 'border-teal bg-teal-50' : 'border-gray-200 hover:border-teal/30'
                      }`}>
                        <svg className="mx-auto mb-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={newCode.discount_type === type.id ? '#0D7377' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"><path d={type.icon}/></svg>
                        <p className="font-body text-xs font-semibold text-charcoal">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {newCode.discount_type !== 'free_access' && (
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">
                      {newCode.discount_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount ($)'}
                    </label>
                    <input type="number" value={newCode.discount_value} onChange={e => setNewCode(p => ({ ...p, discount_value: Number(e.target.value) }))} min={0} max={newCode.discount_type === 'percentage' ? 100 : 9999} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                )}

                {newCode.discount_type === 'free_access' && (
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Free Months</label>
                    <select value={newCode.free_months} onChange={e => setNewCode(p => ({ ...p, free_months: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30">
                      <option value={0}>Unlimited (lifetime)</option>
                      <option value={1}>1 month</option>
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Max Uses (optional)</label>
                    <input type="number" value={newCode.max_uses} onChange={e => setNewCode(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited" min={1} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Expires (optional)</label>
                    <input type="date" value={newCode.valid_until} onChange={e => setNewCode(p => ({ ...p, valid_until: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                </div>

                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-2 block">Applicable Plans</label>
                  <div className="flex gap-3">
                    {['family', 'academy'].map(plan => (
                      <label key={plan} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newCode.applicable_plans.includes(plan)} onChange={e => {
                          setNewCode(p => ({
                            ...p,
                            applicable_plans: e.target.checked ? [...p.applicable_plans, plan] : p.applicable_plans.filter(pp => pp !== plan),
                          }));
                        }} className="w-4 h-4 text-teal rounded border-gray-300 focus:ring-teal" />
                        <span className="font-body text-sm text-charcoal capitalize">{plan}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-teal-50 to-cream rounded-xl p-5 border border-teal/10">
                  <p className="font-body text-xs font-semibold text-teal mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-charcoal rounded-lg">
                      <span className="font-heading font-bold text-white tracking-wider">{newCode.code || 'CODE'}</span>
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-charcoal">
                        {newCode.discount_type === 'free_access' ? `Free access${newCode.free_months > 0 ? ` for ${newCode.free_months} months` : ' (lifetime)'}` :
                         newCode.discount_type === 'percentage' ? `${newCode.discount_value}% off` :
                         `$${newCode.discount_value} off`}
                      </p>
                      <p className="font-body text-xs text-charcoal/40">
                        {newCode.applicable_plans.join(', ')} plans
                        {newCode.max_uses ? ` · ${newCode.max_uses} max uses` : ' · Unlimited uses'}
                      </p>
                    </div>
                  </div>
                </div>

                <button onClick={createCode} disabled={creating || !newCode.code.trim()} className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Discount Code'}
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-heading font-bold text-sm text-charcoal mb-4">Quick Templates</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Influencer Free Access', code: 'INFLUENCER', type: 'free_access', value: 0, months: 6, uses: '50', desc: 'Free 6-month access for influencers' },
                  { label: 'Early Adopter 50% Off', code: 'EARLYBIRD50', type: 'percentage', value: 50, months: 0, uses: '100', desc: '50% off for early adopters' },
                  { label: 'Friend Referral', code: 'FRIEND25', type: 'percentage', value: 25, months: 0, uses: '', desc: '25% off referral code' },
                  { label: 'Lifetime Free Access', code: 'VIP-FREE', type: 'free_access', value: 0, months: 0, uses: '10', desc: 'Lifetime free access for VIPs' },
                ].map(t => (
                  <button key={t.label} onClick={() => setNewCode({ code: t.code, description: t.desc, discount_type: t.type, discount_value: t.value, max_uses: t.uses, valid_until: '', applicable_plans: ['family', 'academy'], free_months: t.months })} className="p-4 bg-cream rounded-xl text-left hover:bg-teal-50 transition-all border border-gray-100">
                    <p className="font-body text-sm font-semibold text-charcoal">{t.label}</p>
                    <p className="font-body text-xs text-charcoal/40 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
