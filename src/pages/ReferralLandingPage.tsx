import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

interface ReferralLandingProps {
  referralCode: string;
  onContinue: () => void;
}

const ReferralLandingPage: React.FC<ReferralLandingProps> = ({ referralCode, onContinue }) => {
  const { setShowLoginModal, setCurrentPage } = useAppContext();
  const [referrerName, setReferrerName] = useState('A FreeLearner parent');
  const [loading, setLoading] = useState(true);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    trackClick();
  }, [referralCode]);

  const trackClick = async () => {
    try {
      // Record the link click
      const { data } = await supabase.functions.invoke('track-referral', {
        body: { action: 'link-clicked', referral_code: referralCode },
      });
      if (data?.referrer_name) {
        setReferrerName(data.referrer_name);
      }
      setTracked(true);

      // Store referral code in localStorage for signup tracking
      localStorage.setItem('fl_referral_code', referralCode);
      localStorage.setItem('fl_referral_time', new Date().toISOString());

      // After a short delay, track as "visited"
      setTimeout(async () => {
        await supabase.functions.invoke('track-referral', {
          body: { action: 'visited', referral_code: referralCode },
        });
      }, 3000);
    } catch (err) {
      console.warn('Referral tracking error:', err);
    }
    setLoading(false);
  };

  const handleSignUp = () => {
    setShowLoginModal(true);
    onContinue();
  };

  const handleExplore = () => {
    onContinue();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cream to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-body text-sm text-charcoal/50">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cream to-orange-50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12 flex flex-col items-center min-h-screen justify-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        {/* Invitation Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal to-teal-dark p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" viewBox="0 0 400 200">
                <circle cx="50" cy="50" r="80" fill="white" opacity="0.1" />
                <circle cx="350" cy="150" r="60" fill="white" opacity="0.1" />
                <circle cx="200" cy="20" r="40" fill="white" opacity="0.05" />
              </svg>
            </div>
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h1 className="font-heading font-bold text-2xl mb-2">You're Invited!</h1>
              <p className="font-body text-white/80 text-sm">
                <span className="font-bold text-white">{referrerName}</span> thinks you'd love FreeLearner
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-xl text-charcoal mb-3">
                AI-Powered Homeschool Learning
              </h2>
              <p className="font-body text-sm text-charcoal/60 leading-relaxed">
                FreeLearner creates personalized learning adventures for your child, powered by AI. 
                Adaptive curriculum, real-time progress tracking, and state compliance — all in one place.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              {[
                { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'AI-personalized lessons that adapt to your child' },
                { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Real-time progress tracking & parent dashboard' },
                { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'COPPA-compliant & safe for children' },
                { icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', label: 'Join a community of homeschool families' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-teal-50/50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round">
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <span className="font-body text-sm text-charcoal/80">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Referral badge */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6 border border-amber-100 text-center">
              <p className="font-body text-xs text-amber-700 font-semibold mb-1">Referred by {referrerName}</p>
              <p className="font-body text-xs text-amber-600/70">
                Sign up to help your friend earn rewards!
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="w-full py-4 bg-teal hover:bg-teal-dark text-white font-heading font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Create Free Account
              </button>
              <button
                onClick={handleExplore}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-charcoal/70 font-body font-semibold text-sm rounded-xl transition-all"
              >
                Explore First
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 font-body text-xs text-charcoal/30 text-center">
          FreeLearner · AI-Powered Homeschool Platform · COPPA Compliant
        </p>
      </div>
    </div>
  );
};

export default ReferralLandingPage;
