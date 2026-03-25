import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const ReferralPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { user, profile } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState([
    { name: '', email: '' },
    { name: '', email: '' },
    { name: '', email: '' },
  ]);

  useEffect(() => {
    if (user?.id) {
      const code = `FL-${user.id.slice(0, 6).toUpperCase()}`;
      setReferralCode(code);
      loadReferrals();
    }
  }, [user?.id]);

  const loadReferrals = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false });
      if (data) setReferrals(data);
    } catch { /* table may not exist yet */ }
  };

  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const discountPercent = Math.min(activeReferrals * 10, 100);
  const isFree = discountPercent >= 100;

  const copyLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setSent(false);
    setError('Referral link copied!');
    setTimeout(() => setError(''), 3000);
  };

  const sendInvites = async () => {
    const validFriends = friends.filter(f => f.email.includes('@') && f.name.trim());
    if (validFriends.length === 0) { setError('Please enter at least one name and email.'); return; }
    setSending(true);
    setError('');
    try {
      for (const friend of validFriends) {
        await supabase.functions.invoke('send-parent-alert', {
          body: {
            alertType: 'referral',
            parentEmail: friend.email,
            parentName: friend.name,
            childName: profile?.full_name || 'A FreeLearner parent',
            data: {
              referralCode,
              referrerName: profile?.full_name || 'A friend',
              signupLink: `${window.location.origin}?ref=${referralCode}`,
            },
          },
        });
        // Record the referral
        await supabase.from('referrals').insert({
          referrer_id: user?.id,
          referred_email: friend.email,
          referred_name: friend.name,
          referral_code: referralCode,
          status: 'pending',
        }).select();
      }
      setSent(true);
      setFriends([{ name: '', email: '' }, { name: '', email: '' }, { name: '', email: '' }]);
      loadReferrals();
    } catch (err: any) {
      setError(err.message || 'Failed to send invites. Please try again.');
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-xl text-charcoal">Refer & Earn</h1>
              <p className="font-body text-xs text-charcoal/40">Share FreeLearner and save on your subscription</p>
            </div>
            <button onClick={() => { setCurrentPage('parent'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-teal to-teal-dark rounded-2xl p-8 text-center text-white">
          <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h2 className="font-heading font-bold text-2xl mb-2">Earn Free Access</h2>
          <p className="font-body text-white/70 max-w-lg mx-auto mb-4">
            For every friend who signs up and stays active, you get 10% off your monthly subscription. Refer 10 active families and your account is completely free!
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="font-heading font-bold text-3xl">{activeReferrals}</p>
              <p className="font-body text-xs text-white/60">Active Referrals</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="font-heading font-bold text-3xl">{discountPercent}%</p>
              <p className="font-body text-xs text-white/60">Your Discount</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="font-heading font-bold text-3xl">{isFree ? 'FREE' : `${10 - activeReferrals}`}</p>
              <p className="font-body text-xs text-white/60">{isFree ? 'Your Account' : 'Until Free'}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-sm font-semibold text-charcoal">Progress to Free Account</span>
            <span className="font-body text-sm font-bold text-teal">{activeReferrals}/10 referrals</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal to-green-400 rounded-full transition-all duration-500" style={{ width: `${discountPercent}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className={`text-center ${i <= activeReferrals ? 'text-teal' : 'text-charcoal/20'}`}>
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${i <= activeReferrals ? 'bg-teal' : 'bg-gray-200'}`} />
                <span className="font-body text-[9px]">{i === 0 ? '0%' : i === 10 ? 'FREE' : `${i * 10}%`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Your Referral Link */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Your Referral Link</h3>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}?ref=${referralCode}`}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream text-charcoal/70"
            />
            <button onClick={copyLink} className="px-5 py-3 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy
            </button>
          </div>
        </div>

        {/* Send Invites */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-1">Invite Friends by Email</h3>
          <p className="font-body text-sm text-charcoal/40 mb-6">Enter up to 3 friends' names and emails. We'll send them a personalized invitation with your referral link.</p>

          <div className="space-y-4">
            {friends.map((friend, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={friend.name}
                  onChange={(e) => {
                    const updated = [...friends];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setFriends(updated);
                  }}
                  placeholder={`Friend ${i + 1}'s name`}
                  className="px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                <input
                  type="email"
                  value={friend.email}
                  onChange={(e) => {
                    const updated = [...friends];
                    updated[i] = { ...updated[i], email: e.target.value };
                    setFriends(updated);
                  }}
                  placeholder={`Friend ${i + 1}'s email`}
                  className="px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className={`font-body text-sm mt-3 ${error.includes('copied') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>
          )}
          {sent && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="font-body text-sm text-green-700">Invitations sent successfully!</span>
            </div>
          )}

          <button
            onClick={sendInvites}
            disabled={sending || !friends.some(f => f.email.includes('@') && f.name.trim())}
            className="w-full mt-4 py-3 bg-orange hover:bg-orange-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Invitations'}
          </button>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Referral History</h3>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              <p className="font-body text-sm text-charcoal/40">No referrals yet. Share your link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-cream rounded-xl">
                  <div>
                    <p className="font-body text-sm font-semibold text-charcoal">{r.referred_name || r.referred_email}</p>
                    <p className="font-body text-xs text-charcoal/40">{r.referred_email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-body text-xs font-bold ${
                    r.status === 'active' ? 'bg-green-50 text-green-700' :
                    r.status === 'signed_up' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-100 text-charcoal/40'
                  }`}>
                    {r.status === 'active' ? 'Active (10% credit)' : r.status === 'signed_up' ? 'Signed Up' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-6">How It Works</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Share Your Link', desc: 'Send your unique referral link to friends via email or copy it to share anywhere.' },
              { step: '2', title: 'They Sign Up', desc: 'When a friend signs up using your link, they appear in your referral history.' },
              { step: '3', title: 'You Save 10%', desc: 'For each active referral, you get 10% off. 10 referrals = completely free account!' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-teal-50 rounded-full flex items-center justify-center">
                  <span className="font-heading font-bold text-lg text-teal">{item.step}</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-charcoal mb-1">{item.title}</h4>
                <p className="font-body text-xs text-charcoal/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
