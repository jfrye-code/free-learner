import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';

const HERO_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292391161_bcd0b278.png';
const TABLET_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292435035_77d36c31.png';
const GUITAR_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292484314_5b1fa275.jpg';
const SAFETY_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292502804_25de00ff.jpg';
const TESTIMONIAL_IMGS = [
  'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292455087_1b3bc3f2.png',
  'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292459392_950c333c.png',
  'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292459112_dc5276c3.png',
];

// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection: React.FC<{ onTrial: () => void; onHowItWorks: () => void }> = ({ onTrial, onHowItWorks }) => (
  <section className="relative overflow-hidden bg-gradient-to-br from-cream via-white to-teal-50">
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange rounded-full blur-3xl" />
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 rounded-full mb-6">
            <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
            <span className="font-body text-xs font-semibold text-teal uppercase tracking-wider">AI-Powered Discovery</span>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-charcoal leading-tight mb-6">
            What if your child{' '}
            <span className="text-teal relative">
              LOVED
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" fill="none"><path d="M2 8C40 2 80 2 100 6C120 10 160 10 198 4" stroke="#F4A261" strokeWidth="3" strokeLinecap="round"/></svg>
            </span>{' '}
            learning?
          </h1>

          <p className="font-body text-lg text-charcoal/60 leading-relaxed mb-8 max-w-lg">
            FreeLearner meets kids where they are — following their passions and curiosity, secretly teaching everything they need to know along the way.

          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={onTrial} className="px-8 py-4 bg-orange hover:bg-orange-dark text-white font-body font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              Start Free Trial
            </button>
            <button onClick={onHowItWorks} className="px-8 py-4 bg-white border-2 border-teal/20 text-teal font-body font-bold rounded-full hover:border-teal/40 hover:bg-teal-50 transition-all duration-300">
              See How It Works
            </button>
          </div>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex -space-x-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-teal-100 overflow-hidden">
                  <img src={TESTIMONIAL_IMGS[i]} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="font-body text-sm text-charcoal/50">
              <span className="font-bold text-charcoal">10,000+</span> families already exploring

            </p>
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img src={HERO_IMG} alt="Students exploring their passions" className="w-full h-auto" />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4A261" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <p className="font-body text-xs text-charcoal/50">Today's streak</p>
                <p className="font-heading font-bold text-sm text-charcoal">12 days!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ProblemSection: React.FC = () => {
  const painPoints = [
    { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F4A261" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, title: 'Boredom', desc: 'One-size-fits-all lessons leave curious minds unstimulated and disengaged.' },
    { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F4A261" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="#F4A261"/></svg>, title: 'Anxiety', desc: 'High-pressure testing and social dynamics create stress that blocks growth.' },
    { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F4A261" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: 'Falling Behind', desc: 'Students who explore differently get labeled as "behind" instead of "different."' },

  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-4">
            Traditional school isn't working for <span className="text-teal">every child</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="font-heading font-black text-4xl text-orange">1 in 5</p>
              <p className="font-body text-sm text-charcoal/50 mt-1">students are disengaged</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-black text-4xl text-orange">8.5M</p>
              <p className="font-body text-sm text-charcoal/50 mt-1">kids chronically absent each year</p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {painPoints.map((p) => (
            <div key={p.title} className="bg-cream rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {p.icon}
              </div>
              <h3 className="font-heading font-bold text-xl text-charcoal mb-2">{p.title}</h3>
              <p className="font-body text-sm text-charcoal/60 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── SOLUTION ────────────────────────────────────────────────────────────────
const SolutionSection: React.FC = () => (
  <section className="py-20 bg-gradient-to-br from-teal-50 to-cream">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block px-3 py-1 bg-teal/10 text-teal text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">The FreeLearner Difference</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-6 leading-tight">
            Every day, your child is asked one simple question:
          </h2>
          <p className="font-heading font-bold text-2xl text-teal mb-6 italic">
            "What fascinates you today?"
          </p>
          <p className="font-body text-charcoal/60 leading-relaxed mb-6">
            Our AI takes their answer and builds an entire day's adventure around it. No textbooks. No worksheets. Just pure, passion-driven discovery that secretly covers every standard they need.
          </p>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-teal/10">
            <div className="flex items-start gap-4">
              <img src={GUITAR_IMG} alt="Guitar and math" className="w-20 h-20 rounded-xl object-cover" />
              <div>
                <p className="font-heading font-bold text-charcoal mb-1">Hates math? Loves guitar?</p>
                <p className="font-body text-sm text-charcoal/60">
                  We'll teach them music theory... which IS math. Fractions become time signatures. Ratios become chord progressions. And they'll never even notice they're picking it up.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <img src={TABLET_IMG} alt="FreeLearner on tablet" className="w-full rounded-2xl shadow-2xl" />
        </div>
      </div>
    </div>
  </section>
);


// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const HowItWorksSection: React.FC = () => {
  const steps = [
    { num: '01', title: 'Share your curiosity', desc: 'Student logs in and answers "What interests you today?" — anything goes!', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="white"/></svg> },
    { num: '02', title: 'AI builds your path', desc: 'In seconds, AI creates a personalized learning journey around their answer.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
    { num: '03', title: 'Explore & discover', desc: 'Engaging content keeps them hooked — videos, interactive challenges, creative projects.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    { num: '04', title: 'Standards? Covered.', desc: 'AI quietly tracks progress against K-12 standards in the background. Parents see everything.', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 bg-orange-50 text-orange text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Simple & Powerful</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal">How FreeLearner Works</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="relative group">
              <div className="bg-gradient-to-br from-teal to-teal-dark rounded-2xl p-6 h-full hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-5">
                  {s.icon}
                </div>
                <span className="font-heading font-black text-5xl text-white/10 absolute top-4 right-4">{s.num}</span>
                <h3 className="font-heading font-bold text-lg text-white mb-2">{s.title}</h3>
                <p className="font-body text-sm text-white/70 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FEATURES ────────────────────────────────────────────────────────────────
const FeaturesSection: React.FC = () => {
  const features = [
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 3-2 5-3.5 7S13 19 13 21h-2c0-2-1.5-3-3-5S5 12 5 9a7 7 0 017-7z"/><path d="M10 21h4"/></svg>, title: 'AI Curriculum Builder', desc: 'Real-time personalized lessons generated from your child\'s interests.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>, title: 'Progress Dashboard', desc: 'Parents see exactly which standards are being met — without hovering.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, title: 'Daily Check-ins', desc: 'Gentle daily reminders that feel like an invitation, not an obligation.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, title: 'Multi-language', desc: 'Supports any country\'s standards with localized curriculum mapping.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Safe AI Guardrails', desc: 'Child-safe, trauma-informed AI responses. Always age-appropriate.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title: 'Emergency Safety', desc: 'AI detects distress signals and immediately alerts emergency contacts.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>, title: 'Achievement System', desc: 'Badges, streaks, and open loops that keep kids coming back for more.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, title: 'Parent Portal', desc: 'Full visibility into your child\'s learning journey without hovering.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, title: 'Beyond K-12', desc: 'Lifelong learning for adults too — it\'s never too late to follow your curiosity.' },
  ];

  return (
    <section id="features" className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 bg-teal-50 text-teal text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Everything You Need</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal">Powerful Features, Friendly Experience</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group border border-gray-100">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal group-hover:text-white transition-all duration-300 [&_svg]:group-hover:stroke-white">
                {f.icon}
              </div>
              <h3 className="font-heading font-bold text-charcoal mb-2">{f.title}</h3>
              <p className="font-body text-sm text-charcoal/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
const TestimonialsSection: React.FC = () => {
  const testimonials = [
    { img: TESTIMONIAL_IMGS[0], name: 'Sarah M.', role: 'Parent', quote: 'My son refused to go to school for 2 years. Now he logs into FreeLearner every morning before I even wake up.' },
    { img: TESTIMONIAL_IMGS[1], name: 'Jake, age 13', role: 'Student', quote: "It actually listens to me. I told it I only care about Minecraft and now I'm learning geometry and I don't even mind." },
    { img: TESTIMONIAL_IMGS[2], name: 'Dr. Lisa Chen', role: 'Educator', quote: 'I recommend FreeLearner to families when traditional approaches have failed. The results speak for themselves.' },

  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 bg-orange-50 text-orange text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Real Stories</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal">Families Love FreeLearner</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-cream rounded-2xl p-8 relative hover:shadow-lg transition-all duration-300">
              <svg className="absolute top-6 right-6 text-orange/20" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z"/></svg>
              <div className="flex items-center gap-3 mb-5">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-heading font-bold text-charcoal text-sm">{t.name}</p>
                  <p className="font-body text-xs text-teal font-semibold">{t.role}</p>
                </div>
              </div>
              <p className="font-body text-charcoal/70 leading-relaxed italic">"{t.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection: React.FC<{ onTrial: () => void }> = ({ onTrial }) => {
  const { setCurrentPage } = useAppContext();
  const [annual, setAnnual] = useState(false);
  const plans = [
    { name: 'Explorer', price: 0, period: '/month', desc: 'Perfect for trying out FreeLearner', features: ['1 student profile', 'Basic AI-guided lessons', 'Parent dashboard', 'Community access', '5 lessons per week'], cta: 'Start Free', popular: false },
    { name: 'Family', price: annual ? 15 : 19, period: '/month', desc: 'Everything your homeschool family needs', features: ['Up to 3 students', 'Full AI curriculum', 'Unlimited daily lessons', 'Progress reports', 'Standards tracking', 'Safety features', 'Achievement system'], cta: 'Start Free Trial', popular: true },
    { name: 'Academy', price: annual ? 59 : 79, period: '/month', desc: 'For co-ops, learning pods & larger families', features: ['Up to 30 students', 'Educator dashboard', 'Curriculum mapping', 'API access', 'Custom standards', 'Dedicated support', 'Admin controls', 'Bulk reporting'], cta: 'Start Free Trial', popular: false },
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-cream to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 bg-teal-50 text-teal text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Simple Pricing</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-2">Plans for Every Family</h2>
          <p className="font-body text-charcoal/50 max-w-lg mx-auto mb-6">Whether you're homeschooling one child or running a learning pod, we've got you covered.</p>
          <div className="flex items-center justify-center gap-3">
            <span className={`font-body text-sm font-semibold ${!annual ? 'text-charcoal' : 'text-charcoal/40'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-teal' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`font-body text-sm font-semibold ${annual ? 'text-charcoal' : 'text-charcoal/40'}`}>Annual <span className="text-teal text-xs">(Save 20%)</span></span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-8 transition-all duration-300 hover:shadow-xl ${p.popular ? 'bg-teal text-white shadow-xl scale-105 border-0' : 'bg-white border border-gray-200'}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange text-white text-xs font-body font-bold rounded-full whitespace-nowrap">
                  Most Popular for Families
                </div>
              )}
              <h3 className={`font-heading font-bold text-xl mb-1 ${p.popular ? 'text-white' : 'text-charcoal'}`}>{p.name}</h3>
              <p className={`font-body text-sm mb-4 ${p.popular ? 'text-white/70' : 'text-charcoal/50'}`}>{p.desc}</p>
              <div className="mb-6">
                <span className={`font-heading font-black text-4xl ${p.popular ? 'text-white' : 'text-charcoal'}`}>${p.price}</span>
                <span className={`font-body text-sm ${p.popular ? 'text-white/70' : 'text-charcoal/50'}`}>{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.popular ? '#F4A261' : '#0D7377'} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className={`font-body text-sm ${p.popular ? 'text-white/90' : 'text-charcoal/70'}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (p.name === 'Academy') {
                    setCurrentPage('pricing');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    onTrial();
                  }
                }}
                className={`w-full py-3 rounded-xl font-body font-bold text-sm transition-all duration-200 ${
                  p.popular
                    ? 'bg-orange hover:bg-orange-dark text-white shadow-md'
                    : 'bg-teal hover:bg-teal-dark text-white'
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 font-body text-sm text-charcoal/40">
          All paid plans include a 30-day money-back guarantee.{' '}
          <button onClick={() => { setCurrentPage('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-teal hover:underline font-semibold">
            Compare all features
          </button>
        </p>
      </div>
    </section>
  );
};


// ─── SAFETY PROMISE ──────────────────────────────────────────────────────────
const SafetyPromiseSection: React.FC<{ onLearnMore: () => void }> = ({ onLearnMore }) => {
  const pillars = [
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'No Harmful Content', desc: 'Strict AI guardrails prevent any inappropriate content.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title: 'Emergency Detection', desc: 'AI monitors for distress signals and alerts contacts immediately.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, title: 'Mandatory Contacts', desc: 'Emergency contacts required during setup for every student.' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, title: 'Human Review', desc: 'Flagged sessions reviewed by trained staff within 24 hours.' },
  ];

  return (
    <section className="py-20 bg-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto bg-teal/10 rounded-2xl flex items-center justify-center mb-4">
            <img src={SAFETY_IMG} alt="Safety" className="w-10 h-10 rounded-lg object-cover" />
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-3">Child Safety Is Non-Negotiable</h2>
          <p className="font-body text-charcoal/60 max-w-2xl mx-auto">
            We built FreeLearner with safety as the foundation, not an afterthought. Every interaction is monitored, filtered, and protected.
          </p>

        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-12 h-12 mx-auto bg-teal-50 rounded-xl flex items-center justify-center mb-4">{p.icon}</div>
              <h3 className="font-heading font-bold text-charcoal mb-2 text-sm">{p.title}</h3>
              <p className="font-body text-xs text-charcoal/50 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button onClick={onLearnMore} className="px-6 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-full transition-all">
            Learn More About Our Safety Systems
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── SCHOOL INTEGRATION ──────────────────────────────────────────────────────
const SchoolIntegrationSection: React.FC<{ onSchoolPortal: () => void }> = ({ onSchoolPortal }) => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">

        <div>
          <span className="inline-block px-3 py-1 bg-orange/10 text-orange text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">For Schools & Educators</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-6 leading-tight">
            Bring FreeLearner to your <span className="text-teal">school</span>
          </h2>

          <p className="font-body text-charcoal/60 leading-relaxed mb-6">
            Upload student records and let our AI personalize learning for every student. We analyze transcripts, report cards, and assessments to identify strengths, gaps, and the perfect starting point for each learner.
          </p>
          <div className="space-y-4 mb-8">
            {[
              { title: 'Upload Student Records', desc: 'Securely upload transcripts, IEPs, report cards, and assessments' },
              { title: 'AI-Powered Analysis', desc: 'Our AI identifies academic strengths and areas needing attention' },
              { title: 'Personalized Pathways', desc: 'Each student gets a tailored learning experience based on their records' },
              { title: 'Standards Mapping', desc: 'Track progress against Common Core, Cambridge, IB, or national standards' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-charcoal">{item.title}</p>
                  <p className="font-body text-xs text-charcoal/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onSchoolPortal}
            className="px-8 py-4 bg-teal hover:bg-teal-dark text-white font-body font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Explore School Portal
          </button>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-cream rounded-3xl p-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-charcoal">Student Records Upload</p>
                <p className="font-body text-xs text-charcoal/40">Drag & drop or browse files</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-teal/20 rounded-xl p-6 text-center bg-teal-50/30">
              <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              <p className="font-body text-xs text-charcoal/50">PDF, CSV, Excel, Word</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Students', value: '247', color: 'bg-teal-50 text-teal' },
              { label: 'Active', value: '198', color: 'bg-green-50 text-green-600' },
              { label: 'Documents', value: '412', color: 'bg-orange/10 text-orange' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className={`font-heading font-bold text-lg ${stat.color.split(' ')[1]}`}>{stat.value}</p>
                <p className="font-body text-[10px] text-charcoal/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── MAIN HOMEPAGE ───────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const { setCurrentPage } = useAppContext();

  const goToOnboarding = () => {
    setCurrentPage('onboarding');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToSchoolPortal = () => {
    setCurrentPage('school');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <HeroSection onTrial={goToOnboarding} onHowItWorks={scrollToHowItWorks} />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <SchoolIntegrationSection onSchoolPortal={goToSchoolPortal} />
      <TestimonialsSection />
      <PricingSection onTrial={goToOnboarding} />
      <SafetyPromiseSection onLearnMore={() => { setCurrentPage('safety'); window.scrollTo({ top: 0 }); }} />
    </div>
  );
};

export default HomePage;
