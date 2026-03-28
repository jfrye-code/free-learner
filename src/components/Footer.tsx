import React, { useState } from 'react';
import Logo from './Logo';
import { useAppContext } from '@/contexts/AppContext';

const Footer: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const nav = (page: 'home' | 'safety' | 'onboarding' | 'student' | 'parent' | 'chat' | 'school' | 'settings' | 'pricing' | 'progress' | 'shop' | 'leaderboard' | 'terms' | 'privacy' | 'referral') => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading font-bold text-xl mb-1">Stay in the loop</h3>
              <p className="font-body text-white/50 text-sm">Get tips on curiosity-driven learning, product updates, and free resources.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 lg:w-72 px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-white/35 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                required
              />
              <button type="submit" className="px-6 py-3 bg-teal hover:bg-teal-dark text-white font-body font-semibold text-sm rounded-lg transition-all duration-200 whitespace-nowrap">
                {subscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <div className="mb-4"><Logo size="md" /></div>
            <p className="font-body text-sm text-white/40 leading-relaxed max-w-xs">
              AI-powered personalized learning that follows your child's curiosity wherever it leads.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-white/70 mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'How It Works', action: () => nav('home') },
                { label: 'Features', action: () => nav('home') },
                { label: 'Pricing', action: () => nav('pricing') },
                { label: 'For Schools', action: () => nav('school') },
                { label: 'Reward Shop', action: () => nav('shop') },
                { label: 'Leaderboard', action: () => nav('leaderboard') },
                { label: 'Account Settings', action: () => nav('settings') },
              ].map(item => (
                <li key={item.label}>
                  <button onClick={item.action} className="font-body text-sm text-white/40 hover:text-teal-light transition-colors">{item.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-white/70 mb-4">Safety & Legal</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Child Safety', action: () => nav('safety') },
                { label: 'AI Guardrails', action: () => nav('safety') },
                { label: 'Privacy Policy', action: () => nav('privacy') },
                { label: 'Terms of Service', action: () => nav('terms') },
                { label: 'COPPA Compliance', action: () => nav('safety') },
                { label: 'Refer & Earn', action: () => nav('referral') },
              ].map(item => (
                <li key={item.label}>
                  <button onClick={item.action} className="font-body text-sm text-white/40 hover:text-teal-light transition-colors">{item.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-white/70 mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {['Blog', 'Research', 'Help Center', 'Community'].map(item => (
                <li key={item}><button className="font-body text-sm text-white/40 hover:text-teal-light transition-colors">{item}</button></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider text-white/70 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About Us', 'Careers', 'Contact', 'Press Kit'].map(item => (
                <li key={item}><button className="font-body text-sm text-white/40 hover:text-teal-light transition-colors">{item}</button></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/30">&copy; {new Date().getFullYear()} FreeLearner.org. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map(item => (
              <button key={item} className="font-body text-xs text-white/30 hover:text-white/60 transition-colors">{item}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {[
              <svg key="tw" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              <svg key="fb" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
              <svg key="ig" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
            ].map((icon, i) => (
              <button key={i} className="text-white/30 hover:text-teal-light transition-colors">{icon}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
