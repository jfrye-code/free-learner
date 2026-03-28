import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';

const HERO_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774662902893_7274c0b4.png';
const FAMILY_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774662918393_0a2a54af.png';
const STUDENT_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774662938341_3d82f07a.png';
const TEEN_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774662984360_dcf92c14.jpg';
const TESTIMONIAL_IMGS = [
  'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774662960340_64f869f5.jpg',
  'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774662962208_4a97dc18.jpg',
  'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774662961120_1c49671d.jpg',
];

// ─── FLAT ICON COMPONENTS ────────────────────────────────────────────────────
const FlatIcon: React.FC<{ path: string; color?: string; size?: number }> = ({ path, color = '#2B7A78', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection: React.FC<{ onTrial: () => void; onHowItWorks: () => void }> = ({ onTrial, onHowItWorks }) => (
  <section className="relative bg-gradient-to-b from-slate-50 to-white overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <span className="font-body text-sm text-charcoal/60">Trusted by thousands of families</span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] text-charcoal leading-[1.1] mb-6 tracking-tight">
            A Personalized{' '}
            <span className="text-teal">Online School</span>{' '}
            That Follows Your Child's Curiosity
          </h1>

          <p className="font-body text-lg text-charcoal/60 leading-relaxed mb-8 max-w-xl">
            AI-powered learning that meets students where they are — building real knowledge through the topics they care about most. Standards-aligned. Parent-approved.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <button onClick={onTrial} className="px-8 py-3.5 bg-teal hover:bg-teal-dark text-white font-body font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              Start Free Trial
            </button>
            <button onClick={onHowItWorks} className="px-8 py-3.5 bg-white border border-slate-200 text-charcoal font-body font-semibold text-sm rounded-lg hover:border-teal/30 hover:bg-slate-50 transition-all duration-200">
              See How It Works
            </button>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex -space-x-2">
              {TESTIMONIAL_IMGS.map((img, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-sm">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="font-body text-sm text-charcoal/50">
              <span className="font-semibold text-charcoal">10,000+</span> families learning
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img src={HERO_IMG} alt="Student learning at home" className="w-full h-auto" />
          </div>
          {/* Trust badge overlay */}
          <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <FlatIcon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={22} />
              </div>
              <div>
                <p className="font-body text-xs text-charcoal/50">Standards-Aligned</p>
                <p className="font-heading font-semibold text-sm text-charcoal">K-12 Curriculum</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── VALUE PROPS ─────────────────────────────────────────────────────────────
const ValuePropsSection: React.FC = () => {
  const props = [
    {
      icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8 M16 3.13a4 4 0 010 7.75',
      title: 'EVERY STUDENT MATTERS',
      desc: 'Our AI mentor invests in your child as an individual, knowing their strengths, challenges, and potential.',
      color: '#2B7A78',
    },
    {
      icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      title: 'SAFE ENVIRONMENT',
      desc: 'Students learn from home in a supportive space without the pressures that get in the way of learning.',
      color: '#2B7A78',
    },
    {
      icon: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c0 2 4 3 6 3s6-1 6-3v-5',
      title: 'REAL ACCREDITATION',
      desc: 'Standards-aligned curriculum that maps to state requirements. Your child\'s learning counts.',
      color: '#2B7A78',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-4 tracking-tight">
            Every Student Deserves{' '}
            <span className="text-teal">Quality Education</span>{' '}
            From Home
          </h2>
        </div>

        <div className="relative mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={FAMILY_IMG} alt="Parent and child learning together" className="w-full h-auto" />
            </div>
            <div>
              <p className="font-body text-base text-charcoal/60 leading-relaxed mb-6">
                Whether your child is dealing with a school environment that isn't working for them, or you're looking for more support alongside your homeschool journey, you're not alone. Too many families are stuck choosing between quality, safety, and support when they shouldn't have to choose at all.
              </p>
              <p className="font-body text-base text-charcoal/60 leading-relaxed">
                Our program is designed to <strong className="text-charcoal font-semibold">partner with parents, not replace them.</strong> FreeLearner gives your child a personalized learning experience that adapts to who they are — not who the system expects them to be.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {props.map((p) => (
            <div key={p.title} className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
              <div className="w-14 h-14 mx-auto bg-teal-50 rounded-xl flex items-center justify-center mb-5">
                <FlatIcon path={p.icon} color={p.color} size={28} />
              </div>
              <h3 className="font-heading font-bold text-sm text-teal uppercase tracking-wider mb-3">{p.title}</h3>
              <p className="font-body text-sm text-charcoal/60 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const HowItWorksSection: React.FC = () => {
  const steps = [
    { num: '01', title: 'Share your curiosity', desc: 'Student answers "What interests you today?" — anything goes.', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { num: '02', title: 'AI builds your path', desc: 'In seconds, AI creates a personalized learning journey around their answer.', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5' },
    { num: '03', title: 'Explore & discover', desc: 'Engaging content with interactive challenges and creative projects.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { num: '04', title: 'Standards? Covered.', desc: 'AI tracks progress against K-12 standards. Parents see everything.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="font-body text-sm font-semibold text-teal uppercase tracking-wider mb-3">Simple & Powerful</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal tracking-tight">How FreeLearner Works</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="relative group">
              <div className="bg-white rounded-xl p-6 h-full border border-slate-100 hover:border-teal/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                    <FlatIcon path={s.icon} size={24} />
                  </div>
                  <span className="font-heading font-bold text-3xl text-slate-100">{s.num}</span>
                </div>
                <h3 className="font-heading font-semibold text-base text-charcoal mb-2">{s.title}</h3>
                <p className="font-body text-sm text-charcoal/55 leading-relaxed">{s.desc}</p>
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
    { icon: 'M12 2a7 7 0 017 7c0 3-2 5-3.5 7S13 19 13 21h-2c0-2-1.5-3-3-5S5 12 5 9a7 7 0 017-7z M10 21h4', title: 'AI Curriculum Builder', desc: 'Real-time personalized lessons generated from your child\'s interests.' },
    { icon: 'M18 20V10 M12 20V4 M6 20v-6', title: 'Progress Dashboard', desc: 'Parents see exactly which standards are being met — without hovering.' },
    { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Safe AI Guardrails', desc: 'Child-safe, trauma-informed AI responses. Always age-appropriate.' },
    { icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01', title: 'Emergency Safety', desc: 'AI detects distress signals and immediately alerts emergency contacts.' },
    { icon: 'M12 8a6 6 0 100 12 6 6 0 000-12z M8.21 13.89L7 23l5-3 5 3-1.21-9.12', title: 'Achievement System', desc: 'Meaningful badges and progression that reinforce real learning behaviors.' },
    { icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', title: 'Parent Portal', desc: 'Full visibility into your child\'s learning journey without hovering.' },
  ];

  return (
    <section id="features" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="font-body text-sm font-semibold text-teal uppercase tracking-wider mb-3">Everything You Need</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal tracking-tight">Powerful Features, Friendly Experience</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 hover:shadow-md transition-all duration-300 border border-slate-100 group">
              <div className="w-11 h-11 bg-teal-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal transition-colors duration-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B7A78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors duration-300">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-charcoal mb-2">{f.title}</h3>
              <p className="font-body text-sm text-charcoal/55 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── ENGAGEMENT SECTION ──────────────────────────────────────────────────────
const EngagementSection: React.FC = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="font-body text-sm font-semibold text-teal uppercase tracking-wider mb-3">The Most Engaging Approach</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-6 tracking-tight leading-tight">
            An Online School for{' '}
            <span className="text-teal">Students Who Are Ready for More</span>
          </h2>
          <div className="space-y-4">
            {[
              'Expert AI mentors trained in pedagogy and child development',
              'Interactive lessons that teach HOW to think — not WHAT to think',
              'Curriculum built around original interests and real-world connections',
              'Identity-building progression that reinforces curiosity and persistence',
              'Safe, supportive environment free from social pressure',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-teal-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2B7A78" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="font-body text-sm text-charcoal/70 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={TEEN_IMG} alt="Engaged student" className="w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
const TestimonialsSection: React.FC = () => {
  const testimonials = [
    { img: TESTIMONIAL_IMGS[0], name: 'Sarah M.', role: 'Parent', quote: 'My son refused to go to school for 2 years. Now he logs into FreeLearner every morning before I even wake up.' },
    { img: TESTIMONIAL_IMGS[1], name: 'Jake, age 13', role: 'Student', quote: "It actually listens to me. I told it I only care about Minecraft and now I'm learning geometry and I don't even mind." },
    { img: TESTIMONIAL_IMGS[2], name: 'Dr. Lisa Chen', role: 'Educator', quote: 'I recommend FreeLearner to families when traditional approaches have failed. The results speak for themselves.' },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="font-body text-sm font-semibold text-teal uppercase tracking-wider mb-3">Real Stories</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal tracking-tight">Families Love FreeLearner</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-xl p-8 relative hover:shadow-md transition-all duration-300 border border-slate-100">
              <svg className="absolute top-6 right-6 text-slate-100" width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z"/></svg>
              <div className="flex items-center gap-3 mb-5">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-heading font-semibold text-charcoal text-sm">{t.name}</p>
                  <p className="font-body text-xs text-teal font-medium">{t.role}</p>
                </div>
              </div>
              <p className="font-body text-charcoal/65 leading-relaxed">"{t.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── PRICING ─────────────────────────────────────────────────────────────────
const PricingSection: React.FC<{ onTrial: () => void }> = ({ onTrial }) => {
  const { setCurrentPage } = useAppContext();
  const [annual, setAnnual] = useState(false);
  const plans = [
    { name: 'Explorer', price: 0, period: '/month', desc: 'Perfect for trying out FreeLearner', features: ['1 student profile', 'Basic AI-guided lessons', 'Parent dashboard', 'Community access', '5 lessons per week'], cta: 'Start Free', popular: false },
    { name: 'Family', price: annual ? 15 : 19, period: '/month', desc: 'Everything your homeschool family needs', features: ['Up to 3 students', 'Full AI curriculum', 'Unlimited daily lessons', 'Progress reports', 'Standards tracking', 'Safety features', 'Achievement system'], cta: 'Start Free Trial', popular: true },
    { name: 'Academy', price: annual ? 59 : 79, period: '/month', desc: 'For co-ops, learning pods & larger families', features: ['Up to 30 students', 'Educator dashboard', 'Curriculum mapping', 'API access', 'Custom standards', 'Dedicated support', 'Admin controls', 'Bulk reporting'], cta: 'Contact Sales', popular: false },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="font-body text-sm font-semibold text-teal uppercase tracking-wider mb-3">Simple Pricing</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-2 tracking-tight">Plans for Every Family</h2>
          <p className="font-body text-charcoal/50 max-w-lg mx-auto mb-6">Whether you're homeschooling one child or running a learning pod, we've got you covered.</p>
          <div className="flex items-center justify-center gap-3">
            <span className={`font-body text-sm font-medium ${!annual ? 'text-charcoal' : 'text-charcoal/40'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-teal' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`font-body text-sm font-medium ${annual ? 'text-charcoal' : 'text-charcoal/40'}`}>Annual <span className="text-teal text-xs font-semibold">(Save 20%)</span></span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-xl p-8 transition-all duration-300 hover:shadow-lg ${p.popular ? 'bg-teal text-white shadow-lg ring-2 ring-teal/20' : 'bg-white border border-slate-200'}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange text-white text-xs font-body font-semibold rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <h3 className={`font-heading font-bold text-xl mb-1 ${p.popular ? 'text-white' : 'text-charcoal'}`}>{p.name}</h3>
              <p className={`font-body text-sm mb-4 ${p.popular ? 'text-white/70' : 'text-charcoal/50'}`}>{p.desc}</p>
              <div className="mb-6">
                <span className={`font-heading font-extrabold text-4xl ${p.popular ? 'text-white' : 'text-charcoal'}`}>${p.price}</span>
                <span className={`font-body text-sm ${p.popular ? 'text-white/70' : 'text-charcoal/50'}`}>{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.popular ? '#F9C7A2' : '#2B7A78'} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className={`font-body text-sm ${p.popular ? 'text-white/90' : 'text-charcoal/65'}`}>{f}</span>
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
                className={`w-full py-3 rounded-lg font-body font-semibold text-sm transition-all duration-200 ${
                  p.popular
                    ? 'bg-white text-teal hover:bg-slate-50 shadow-sm'
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
          <button onClick={() => { setCurrentPage('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-teal hover:underline font-medium">
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
    { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'No Harmful Content', desc: 'Strict AI guardrails prevent any inappropriate content.' },
    { icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01', title: 'Emergency Detection', desc: 'AI monitors for distress signals and alerts contacts immediately.' },
    { icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', title: 'Mandatory Contacts', desc: 'Emergency contacts required during setup for every student.' },
    { icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z', title: 'Human Review', desc: 'Flagged sessions reviewed by trained staff within 24 hours.' },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-14 h-14 mx-auto bg-teal-50 rounded-xl flex items-center justify-center mb-4">
            <FlatIcon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={28} />
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-3 tracking-tight">Child Safety Is Non-Negotiable</h2>
          <p className="font-body text-charcoal/55 max-w-2xl mx-auto">
            We built FreeLearner with safety as the foundation, not an afterthought. Every interaction is monitored, filtered, and protected.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <div key={p.title} className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-all border border-slate-100">
              <div className="w-12 h-12 mx-auto bg-teal-50 rounded-lg flex items-center justify-center mb-4">
                <FlatIcon path={p.icon} size={24} />
              </div>
              <h3 className="font-heading font-semibold text-charcoal mb-2 text-sm">{p.title}</h3>
              <p className="font-body text-xs text-charcoal/50 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button onClick={onLearnMore} className="px-6 py-3 bg-teal hover:bg-teal-dark text-white font-body font-semibold text-sm rounded-lg transition-all">
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
          <p className="font-body text-sm font-semibold text-orange uppercase tracking-wider mb-3">For Schools & Educators</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-charcoal mb-6 leading-tight tracking-tight">
            Bring FreeLearner to your <span className="text-teal">school</span>
          </h2>
          <p className="font-body text-charcoal/55 leading-relaxed mb-6">
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
                <div className="w-5 h-5 bg-teal-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2B7A78" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p className="font-heading font-semibold text-sm text-charcoal">{item.title}</p>
                  <p className="font-body text-xs text-charcoal/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onSchoolPortal}
            className="px-8 py-3.5 bg-teal hover:bg-teal-dark text-white font-body font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            Explore School Portal
          </button>
        </div>
        <div className="bg-slate-50 rounded-2xl p-8">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <FlatIcon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" size={20} />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm text-charcoal">Student Records Upload</p>
                <p className="font-body text-xs text-charcoal/40">Drag & drop or browse files</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center bg-slate-50">
              <FlatIcon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" size={28} color="#94A3B8" />
              <p className="font-body text-xs text-charcoal/40 mt-2">PDF, CSV, Excel, Word</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Students', value: '247', color: 'text-teal' },
              { label: 'Active', value: '198', color: 'text-green-600' },
              { label: 'Documents', value: '412', color: 'text-orange' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg p-3 text-center shadow-sm border border-slate-100">
                <p className={`font-heading font-bold text-lg ${stat.color}`}>{stat.value}</p>
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
      <ValuePropsSection />
      <HowItWorksSection />
      <EngagementSection />
      <FeaturesSection />
      <SchoolIntegrationSection onSchoolPortal={goToSchoolPortal} />
      <TestimonialsSection />
      <PricingSection onTrial={goToOnboarding} />
      <SafetyPromiseSection onLearnMore={() => { setCurrentPage('safety'); window.scrollTo({ top: 0 }); }} />
    </div>
  );
};

export default HomePage;
