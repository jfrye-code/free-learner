import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

const SafetyPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();

  return (
    <div className="bg-cream">
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-teal-50 via-cream to-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-96 h-96 bg-teal rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl text-charcoal mb-4">
            The Safest AI Tutor for Your Child
          </h1>
          <p className="font-body text-lg text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
            We built FreeLearner with safety as the foundation, not an afterthought. Every interaction is monitored, filtered, and protected by multiple layers of security.
          </p>
        </div>
      </section>

      {/* HIPAA-Grade Privacy Section */}
      <section className="py-16 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4 border border-green-200">HIPAA-Grade Protection</span>
            <h2 className="font-heading font-bold text-3xl text-charcoal">Healthcare-Level Data Privacy</h2>
            <p className="font-body text-charcoal/60 mt-2 max-w-2xl mx-auto">We protect your child's data with the same rigor that hospitals protect medical records. Your family's privacy is non-negotiable.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Data Protection */}
            <div className="bg-white rounded-2xl p-8 border border-green-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">Data Encryption & Storage</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'AES-256 encryption at rest — military-grade standard',
                  'TLS 1.3 encryption in transit for all communications',
                  'Database-level encryption with rotating keys',
                  'Isolated data environments per user account',
                  'Automatic data purging after account deletion',
                  'No data stored on local devices or browser cache',
                  'Encrypted backups with geographic redundancy',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="font-body text-sm text-charcoal/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Privacy */}
            <div className="bg-white rounded-2xl p-8 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">AI Privacy Safeguards</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'AI never asks for personal identifying information',
                  'Conversations are NOT used to train AI models',
                  'AI actively redirects personal info sharing attempts',
                  'No student data is shared with third-party AI providers',
                  'Each session is processed in isolated, encrypted containers',
                  'AI is instructed to protect student privacy above all else',
                  'Voice data is processed and immediately discarded',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="font-body text-sm text-charcoal/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Zero Data Sharing Pledge */}
          <div className="bg-gradient-to-r from-green-600 to-teal rounded-2xl p-8 text-white text-center">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="font-heading font-bold text-2xl mb-3">Our Zero Data Sharing Pledge</h3>
            <p className="font-body text-white/80 max-w-2xl mx-auto leading-relaxed mb-6">
              We will <strong>never</strong> sell, share, rent, or monetize your child's personal data, learning history, conversation logs, or any information collected through our platform. Not to advertisers. Not to data brokers. Not to anyone. Period.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { label: 'Data Sold', value: 'ZERO' },
                { label: 'Third-Party Sharing', value: 'NONE' },
                { label: 'Ad Tracking', value: 'ZERO' },
              ].map(item => (
                <div key={item.label} className="bg-white/10 rounded-xl p-4">
                  <p className="font-heading font-black text-2xl">{item.value}</p>
                  <p className="font-body text-xs text-white/60">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Guardrails */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Content Safety</span>
            <h2 className="font-heading font-bold text-3xl text-charcoal">Content Guardrails</h2>
            <p className="font-body text-charcoal/60 mt-2 max-w-xl mx-auto">Clear boundaries on what our AI will and won't discuss with your child.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-green-800">AI WILL Discuss</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Any age-appropriate educational topic',
                  'Emotional support and encouragement',
                  'Life skills and practical knowledge',
                  'Creative expression and arts',
                  'Science, history, math, and language',
                  'Career exploration and future planning',
                  'Social skills and communication',
                  'Health and wellness (age-appropriate)',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="font-body text-sm text-green-800/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-red-800">AI WILL NOT Discuss</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Violence or graphic content',
                  'Self-harm or suicidal content',
                  'Weapons or dangerous activities',
                  'Adult or sexual content',
                  'Substance use or drug information',
                  'Hate speech or discrimination',
                  'Personal data collection from minors',
                  'Anything violating COPPA regulations',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span className="font-body text-sm text-red-800/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Distress Detection */}
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-orange-50 text-orange text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Active Monitoring</span>
            <h2 className="font-heading font-bold text-3xl text-charcoal">Distress Detection System</h2>
            <p className="font-body text-charcoal/60 mt-2 max-w-xl mx-auto">Our AI continuously monitors conversations for warning signs and takes immediate action.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                title: 'Suicidal Ideation Detection',
                desc: 'AI immediately detects concerning language, shares crisis resources, and sends an instant alert to parents/guardians.',
                severity: 'Critical',
                color: 'bg-red-50 border-red-200',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>,
                title: 'Bullying & Abuse Indicators',
                desc: 'Patterns suggesting bullying or abuse trigger parent notifications with conversation context for review.',
                severity: 'High',
                color: 'bg-amber-50 border-amber-200',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
                title: 'Threat-to-Others Detection',
                desc: 'Any indication of threats to others triggers our emergency services alert protocol immediately.',
                severity: 'Emergency',
                color: 'bg-red-50 border-red-200',
              },
            ].map(item => (
              <div key={item.title} className={`${item.color} border rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">{item.icon}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-body font-bold ${
                    item.severity === 'Emergency' ? 'bg-red-100 text-red-700' :
                    item.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{item.severity}</span>
                </div>
                <h3 className="font-heading font-bold text-charcoal mb-2">{item.title}</h3>
                <p className="font-body text-sm text-charcoal/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contact System */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Required Setup</span>
              <h2 className="font-heading font-bold text-3xl text-charcoal mb-4">Emergency Contact System</h2>
              <p className="font-body text-charcoal/60 leading-relaxed mb-6">
                Every student account requires at least one emergency contact before they can start learning. This isn't optional — it's how we keep your child safe.
              </p>
              <ul className="space-y-4">
                {[
                  'Emergency contacts are required during account setup',
                  'Parents receive instant alerts for any flagged interactions',
                  'Multiple contacts can be added for redundancy',
                  'Contacts receive detailed context about the concern',
                  'Crisis hotline numbers are automatically shared when needed',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span className="font-body text-sm text-charcoal/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-cream rounded-2xl p-8">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-4">How Alerts Work</h3>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'AI Detects Concern', desc: 'Our system identifies potentially concerning language or patterns.' },
                  { step: '2', title: 'Immediate Response', desc: 'AI provides appropriate resources and support to the student.' },
                  { step: '3', title: 'Parent Notification', desc: 'Emergency contacts receive an instant notification with context.' },
                  { step: '4', title: 'Human Review', desc: 'Trained staff review the flagged session within 24 hours.' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="font-heading font-bold text-xs text-white">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-charcoal">{item.title}</p>
                      <p className="font-body text-xs text-charcoal/50">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Compliance</span>
            <h2 className="font-heading font-bold text-3xl text-charcoal">Regulatory Compliance</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: 'COPPA', desc: 'Children\'s Online Privacy Protection Act', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { title: 'FERPA', desc: 'Family Educational Rights & Privacy Act', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
              { title: 'HIPAA-Grade', desc: 'Healthcare-level data protection standards', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
              { title: 'SOC 2', desc: 'Service Organization Control audit standards', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
              { title: 'GDPR', desc: 'EU General Data Protection Regulation', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 text-center hover:shadow-md transition-all border border-gray-100">
                <div className="w-12 h-12 mx-auto bg-teal-50 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
                <h3 className="font-heading font-bold text-sm text-charcoal mb-2">{item.title}</h3>
                <p className="font-body text-xs text-charcoal/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Rights */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Your Rights</span>
            <h2 className="font-heading font-bold text-3xl text-charcoal">Parent Data Rights</h2>
            <p className="font-body text-charcoal/60 mt-2 max-w-xl mx-auto">You have complete control over your family's data at all times.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Right to Access', desc: 'View all data collected about your child at any time through your parent dashboard.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
              { title: 'Right to Export', desc: 'Download a complete copy of all your family\'s data in standard formats.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
              { title: 'Right to Delete', desc: 'Request complete deletion of all data. We comply within 30 days.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> },
              { title: 'Right to Restrict', desc: 'Limit how data is processed or opt out of specific features.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
            ].map(item => (
              <div key={item.title} className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">{item.icon}</div>
                <h3 className="font-heading font-bold text-sm text-charcoal mb-2">{item.title}</h3>
                <p className="font-body text-xs text-charcoal/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safe Video Recommendations */}
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-body font-bold uppercase tracking-wider rounded-full mb-4">Curated Content</span>
            <h2 className="font-heading font-bold text-3xl text-charcoal">Safe Resource Recommendations</h2>
            <p className="font-body text-charcoal/60 mt-2 max-w-2xl mx-auto">Our AI only recommends content from pre-approved, child-safe educational sources. We never send students to unvetted websites or random YouTube videos.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'Khan Academy', desc: 'Free courses', color: 'bg-green-50 border-green-200' },
              { name: 'PBS Learning', desc: 'Curated videos', color: 'bg-blue-50 border-blue-200' },
              { name: 'Nat Geo Kids', desc: 'Science & nature', color: 'bg-yellow-50 border-yellow-200' },
              { name: 'TED-Ed', desc: 'Animated lessons', color: 'bg-red-50 border-red-200' },
              { name: 'Scratch (MIT)', desc: 'Learn coding', color: 'bg-orange-50 border-orange-200' },
              { name: 'CrashCourse', desc: 'Educational series', color: 'bg-purple-50 border-purple-200' },
              { name: 'SciShow Kids', desc: 'Fun science', color: 'bg-teal-50 border-teal-200' },
              { name: 'Smithsonian', desc: 'Museum resources', color: 'bg-amber-50 border-amber-200' },
              { name: 'Numberphile', desc: 'Math videos', color: 'bg-indigo-50 border-indigo-200' },
              { name: 'Duolingo', desc: 'Languages', color: 'bg-lime-50 border-lime-200' },
            ].map(src => (
              <div key={src.name} className={`${src.color} border rounded-xl p-4 text-center`}>
                <p className="font-heading font-bold text-xs text-charcoal">{src.name}</p>
                <p className="font-body text-xs text-charcoal/50">{src.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="font-body text-sm text-amber-800">
              <strong>Why not YouTube?</strong> While some YouTube channels are excellent, the platform's recommendation algorithm can lead students to unvetted content. We only recommend specific, pre-approved educational channels and always provide direct links to the safe content.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-teal to-teal-dark">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-3xl text-white mb-4">Ready to give your child the safest learning experience?</h2>
          <p className="font-body text-white/70 mb-8">Start your free trial today. No credit card required.</p>
          <button
            onClick={() => { setCurrentPage('onboarding'); window.scrollTo({ top: 0 }); }}
            className="px-8 py-4 bg-orange hover:bg-orange-dark text-white font-body font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Start Free Trial
          </button>
        </div>
      </section>
    </div>
  );
};

export default SafetyPage;
