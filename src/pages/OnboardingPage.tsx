import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Logo from '@/components/Logo';

const interestOptions = [
  { label: 'Gaming', icon: '🎮' }, { label: 'Music', icon: '🎵' }, { label: 'Animals', icon: '🐾' },
  { label: 'Space', icon: '🌌' }, { label: 'Art', icon: '🎨' }, { label: 'Cooking', icon: '🍳' },
  { label: 'Sports', icon: '⚽' }, { label: 'Nature', icon: '🌿' }, { label: 'Technology', icon: '💡' },
  { label: 'History', icon: '📜' }, { label: 'Stories', icon: '📖' }, { label: 'Building', icon: '🔧' },
  { label: 'Fashion', icon: '👗' }, { label: 'Science', icon: '🔬' }, { label: 'Travel', icon: '✈️' },
  { label: 'Movies', icon: '🎬' }, { label: 'Photography', icon: '📷' }, { label: 'Robots', icon: '🤖' },
  { label: 'Dance', icon: '💃' }, { label: 'Dinosaurs', icon: '🦕' }, { label: 'Ocean', icon: '🌊' },
  { label: 'Cars', icon: '🏎️' }, { label: 'Magic', icon: '✨' }, { label: 'Comics', icon: '💬' },
  { label: 'Puzzles', icon: '🧩' }, { label: 'Gardening', icon: '🌻' }, { label: 'Weather', icon: '⛈️' },
  { label: 'Crafts', icon: '✂️' }, { label: 'Languages', icon: '🗣️' }, { label: 'Astronomy', icon: '🔭' },
  { label: 'Skateboarding', icon: '🛹' }, { label: 'Business', icon: '💼' }, { label: 'Fishing', icon: '🎣' },
  { label: 'Hiking', icon: '🥾' }, { label: 'Painting', icon: '🖌️' }, { label: 'Yoga', icon: '🧘' },
];

// Expanded aptitude & personality assessment questions
const aptitudeQuestions = [
  {
    id: 'saturday',
    question: "What would you rather do on a Saturday?",
    options: [
      { text: 'Build something with my hands', traits: { kinesthetic: 2, handsOn: 2, creative: 1 } },
      { text: 'Watch a documentary', traits: { visual: 2, analytical: 1, curious: 1 } },
      { text: 'Play video games', traits: { strategic: 1, tech: 1, competitive: 1 } },
      { text: 'Go outside and explore', traits: { kinesthetic: 1, adventurous: 2, nature: 1 } },
    ],
  },
  {
    id: 'learning',
    question: "When you find something interesting, you usually...",
    options: [
      { text: 'Research everything about it', traits: { analytical: 2, reading: 1, curious: 2 } },
      { text: 'Try to make or create something', traits: { creative: 2, handsOn: 2, entrepreneurial: 1 } },
      { text: 'Talk to someone about it', traits: { social: 2, verbal: 1, collaborative: 1 } },
      { text: 'Imagine new possibilities', traits: { creative: 2, visionary: 2, innovative: 1 } },
    ],
  },
  {
    id: 'learnStyle',
    question: "Your favorite way to learn something new is...",
    options: [
      { text: 'Watching videos', traits: { visual: 2, auditory: 1 } },
      { text: 'Reading about it', traits: { reading: 2, analytical: 1 } },
      { text: 'Trying it yourself', traits: { kinesthetic: 2, handsOn: 1 } },
      { text: 'Having someone explain it', traits: { auditory: 2, social: 1 } },
    ],
  },
  {
    id: 'proud',
    question: "You feel most proud when you...",
    options: [
      { text: 'Solve a hard problem', traits: { analytical: 2, persistent: 2, math: 1 } },
      { text: 'Create something beautiful', traits: { creative: 2, artistic: 2 } },
      { text: 'Help someone else', traits: { empathetic: 2, social: 2, leadership: 1 } },
      { text: 'Discover something new', traits: { curious: 2, adventurous: 1, science: 1 } },
    ],
  },
  {
    id: 'project',
    question: "If you could start any project right now, it would be...",
    options: [
      { text: 'Start a small business or sell something', traits: { entrepreneurial: 3, leadership: 1, math: 1 } },
      { text: 'Build an invention or gadget', traits: { engineering: 2, handsOn: 2, innovative: 1 } },
      { text: 'Write a story, song, or make art', traits: { creative: 2, artistic: 2, verbal: 1 } },
      { text: 'Plan an event or organize a group', traits: { leadership: 2, social: 2, organized: 1 } },
    ],
  },
  {
    id: 'challenge',
    question: "When something is really hard, you usually...",
    options: [
      { text: 'Keep trying until I figure it out', traits: { persistent: 3, independent: 1 } },
      { text: 'Ask someone for help', traits: { social: 1, collaborative: 2 } },
      { text: 'Try a completely different approach', traits: { creative: 2, innovative: 1, flexible: 1 } },
      { text: 'Take a break and come back later', traits: { mindful: 2, patient: 1 } },
    ],
  },
  {
    id: 'group',
    question: "In a group project, you naturally...",
    options: [
      { text: 'Take charge and organize everyone', traits: { leadership: 3, organized: 1 } },
      { text: 'Come up with the creative ideas', traits: { creative: 2, visionary: 2 } },
      { text: 'Do the hands-on building/making', traits: { handsOn: 2, kinesthetic: 1, practical: 1 } },
      { text: 'Research and gather information', traits: { analytical: 2, reading: 1, detail: 1 } },
    ],
  },
  {
    id: 'dream',
    question: "If you could be amazing at one thing, it would be...",
    options: [
      { text: 'Inventing things that change the world', traits: { engineering: 2, innovative: 2, visionary: 1 } },
      { text: 'Understanding how everything works', traits: { science: 2, analytical: 2, curious: 1 } },
      { text: 'Creating art, music, or stories people love', traits: { artistic: 2, creative: 2, verbal: 1 } },
      { text: 'Leading a team or running a company', traits: { entrepreneurial: 2, leadership: 2, social: 1 } },
    ],
  },
];

const strengthOptions = [
  'Good with numbers', 'Creative thinker', 'Strong reader', 'Good listener',
  'Natural leader', 'Detail-oriented', 'Fast learner', 'Good at explaining things',
  'Artistic', 'Athletic', 'Musical', 'Good with technology',
  'Patient', 'Curious about everything', 'Good memory', 'Problem solver',
];

const OnboardingPage: React.FC = () => {
  const { setCurrentPage, setIsLoggedIn, setUserRole, setStudentProfile, studentProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<'parent' | 'educator' | 'adult'>('parent');
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState('10');
  const [gradeLevel, setGradeLevel] = useState('5');
  const [language, setLanguage] = useState('English');
  const [country, setCountry] = useState('United States');
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [dataMinimization, setDataMinimization] = useState(false);
  const [communicationPref, setCommunicationPref] = useState('text');

  const totalSteps = 9;
  const progress = (step / totalSteps) * 100;

  const toggleInterest = (label: string) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const toggleStrength = (label: string) => {
    setSelectedStrengths(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const answerQuiz = (qIndex: number, aIndex: number) => {
    const updated = [...quizAnswers];
    updated[qIndex] = aIndex;
    setQuizAnswers(updated);
  };

  // Calculate personality profile from quiz answers
  const calculateProfile = () => {
    const traits: Record<string, number> = {};
    quizAnswers.forEach((answerIdx, qIdx) => {
      if (answerIdx !== undefined && aptitudeQuestions[qIdx]) {
        const selectedTraits = aptitudeQuestions[qIdx].options[answerIdx]?.traits || {};
        Object.entries(selectedTraits).forEach(([trait, score]) => {
          traits[trait] = (traits[trait] || 0) + score;
        });
      }
    });
    return traits;
  };

  const determineLearningStyle = (traits: Record<string, number>) => {
    const styles = {
      visual: (traits.visual || 0),
      auditory: (traits.auditory || 0),
      kinesthetic: (traits.kinesthetic || 0) + (traits.handsOn || 0),
      reading: (traits.reading || 0),
    };
    return Object.entries(styles).sort((a, b) => b[1] - a[1])[0][0];
  };

  const determineSocialPref = (traits: Record<string, number>) => {
    const social = (traits.social || 0) + (traits.collaborative || 0);
    const independent = (traits.independent || 0) + (traits.analytical || 0);
    if (social > independent + 2) return 'collaborative';
    if (independent > social + 2) return 'solo';
    return 'mixed';
  };

  const determineCreativeAnalytical = (traits: Record<string, number>) => {
    const creative = (traits.creative || 0) + (traits.artistic || 0) + (traits.innovative || 0);
    const analytical = (traits.analytical || 0) + (traits.science || 0) + (traits.math || 0);
    if (creative > analytical + 2) return 'creative';
    if (analytical > creative + 2) return 'analytical';
    return 'balanced';
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return studentName.trim().length > 0;
      case 3: return quizAnswers.filter(a => a !== undefined).length === aptitudeQuestions.length;
      case 4: return selectedInterests.length >= 3;
      case 5: return selectedStrengths.length >= 2;
      case 6: return emergencyName.trim() && emergencyPhone.trim() && emergencyEmail.includes('@');
      case 7: return true;
      case 8: return privacyConsent && dataMinimization;
      default: return true;
    }
  };

  const handleFinish = () => {
    const traits = calculateProfile();
    const learningStyle = determineLearningStyle(traits);
    const socialPref = determineSocialPref(traits);
    const creativeAnalytical = determineCreativeAnalytical(traits);
    const isEntrepreneurial = (traits.entrepreneurial || 0) >= 2;
    const isHandsOn = (traits.handsOn || 0) >= 3;

    setStudentProfile({
      ...studentProfile,
      name: studentName || 'Alex',
      age: parseInt(studentAge) || 10,
      gradeLevel: gradeLevel,
      interests: selectedInterests.length > 0 ? selectedInterests : studentProfile.interests,
      learningStyle,
      personalityTraits: traits,
      strengths: selectedStrengths,
      preferredPace: (traits.patient || 0) >= 2 ? 'slow' : (traits.persistent || 0) >= 3 ? 'fast' : 'moderate',
      entrepreneurialInterest: isEntrepreneurial,
      handsOnPreference: isHandsOn,
      socialPreference: socialPref,
      creativeVsAnalytical: creativeAnalytical,
      communicationStyle: communicationPref,
    });
    setIsLoggedIn(true);
    setUserRole(accountType === 'parent' ? 'parent' : accountType === 'educator' ? 'educator' : 'student');
    setCurrentPage('student');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }}
            className="font-body text-sm text-charcoal/40 hover:text-charcoal transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal to-orange rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="font-body text-xs text-charcoal/40 text-center py-2">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-2xl">
          {/* Step 1: Account Type */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">Welcome to FreeLearner!</h2>
              <p className="font-body text-charcoal/60 text-center mb-8">Tell us about yourself so we can personalize your experience.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {([
                  { id: 'parent' as const, title: "I'm a Parent", desc: 'Setting up learning for my child', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
                  { id: 'educator' as const, title: "I'm an Educator", desc: 'Setting up for my students', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
                  { id: 'adult' as const, title: "I'm an Adult Learner", desc: 'Learning for myself', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                ]).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAccountType(opt.id)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 ${
                      accountType === opt.id
                        ? 'border-teal bg-teal-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-teal/30'
                    }`}
                  >
                    <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 ${accountType === opt.id ? 'bg-teal text-white' : 'bg-gray-100 text-charcoal/60'}`}>
                      {opt.icon}
                    </div>
                    <h3 className="font-heading font-bold text-sm text-charcoal">{opt.title}</h3>
                    <p className="font-body text-xs text-charcoal/50 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Student Profile — Age & Grade SEPARATED */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">
                {accountType === 'adult' ? 'Tell us about yourself' : "Tell us about the learner"}
              </h2>
              <p className="font-body text-charcoal/60 text-center mb-8">This helps us personalize the experience.</p>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">
                    {accountType === 'adult' ? 'Your name' : "Student's name"}
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="Enter name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">
                      {accountType === 'adult' ? 'Your age' : "Student's age"}
                    </label>
                    <select
                      value={studentAge}
                      onChange={(e) => setStudentAge(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white"
                    >
                      {Array.from({ length: 18 }, (_, i) => i + 5).map(age => (
                        <option key={age} value={age}>{age} years old</option>
                      ))}
                      <option value="23">18+ (Adult Learner)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">
                      Current grade level
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white"
                    >
                      <option value="K">Kindergarten</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                        <option key={g} value={String(g)}>Grade {g}</option>
                      ))}
                      <option value="college">College / Adult</option>
                    </select>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <p className="font-body text-xs text-blue-800">
                      <strong>Why separate age and grade?</strong> Many learners work above or below their age-typical grade level — and that's perfectly fine! We separate these so our AI mentor can meet each student exactly where they are, not where a calendar says they should be.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">
                    How does {studentName || 'the student'} prefer to communicate?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'text', label: 'Typing', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg> },
                      { id: 'voice', label: 'Voice Chat', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
                      { id: 'both', label: 'Both', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setCommunicationPref(opt.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          communicationPref === opt.id
                            ? 'border-teal bg-teal-50'
                            : 'border-gray-200 bg-white hover:border-teal/30'
                        }`}
                      >
                        <div className={`mx-auto mb-1 ${communicationPref === opt.id ? 'text-teal' : 'text-charcoal/40'}`}>{opt.icon}</div>
                        <span className="font-body text-xs font-semibold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Aptitude & Personality Assessment */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">Getting to Know {studentName || 'You'}</h2>
              <p className="font-body text-charcoal/60 text-center mb-2">These fun questions help our AI understand how {studentName || 'you'} think and learn best.</p>
              <p className="font-body text-xs text-teal text-center mb-6">This isn't a test — there are no wrong answers!</p>
              <div className="space-y-5">
                {aptitudeQuestions.map((q, qi) => (
                  <div key={qi} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="font-heading font-bold text-sm text-charcoal mb-3">{qi + 1}. {q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() => answerQuiz(qi, oi)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-body font-semibold text-left transition-all ${
                            quizAnswers[qi] === oi
                              ? 'bg-teal text-white shadow-sm'
                              : 'bg-cream text-charcoal/70 hover:bg-teal-50 border border-gray-200'
                          }`}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-body text-xs text-charcoal/40 text-center mt-4">
                {quizAnswers.filter(a => a !== undefined).length} of {aptitudeQuestions.length} answered
              </p>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">What interests {studentName || 'you'}?</h2>
              <p className="font-body text-charcoal/60 text-center mb-8">Pick at least 3 topics. The more the better!</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {interestOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => toggleInterest(opt.label)}
                    className={`p-3 rounded-xl text-center transition-all duration-200 ${
                      selectedInterests.includes(opt.label)
                        ? 'bg-teal text-white shadow-md scale-105'
                        : 'bg-white border border-gray-200 hover:border-teal/30 hover:bg-teal-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{opt.icon}</span>
                    <span className="font-body text-xs font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="font-body text-xs text-charcoal/40 text-center mt-4">
                {selectedInterests.length} selected {selectedInterests.length < 3 ? `(pick at least ${3 - selectedInterests.length} more)` : '— great choices!'}
              </p>
            </div>
          )}

          {/* Step 5: Strengths */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">What are {studentName || 'your'} strengths?</h2>
              <p className="font-body text-charcoal/60 text-center mb-2">Pick at least 2 things {studentName || 'you'} are naturally good at.</p>
              <p className="font-body text-xs text-teal text-center mb-8">Everyone has unique strengths — this helps our AI play to them!</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {strengthOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleStrength(s)}
                    className={`px-4 py-3 rounded-xl text-center transition-all duration-200 font-body text-xs font-semibold ${
                      selectedStrengths.includes(s)
                        ? 'bg-orange text-white shadow-md'
                        : 'bg-white border border-gray-200 text-charcoal/70 hover:border-orange/30 hover:bg-orange-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="font-body text-xs text-charcoal/40 text-center mt-4">
                {selectedStrengths.length} selected {selectedStrengths.length < 2 ? `(pick at least ${2 - selectedStrengths.length} more)` : ''}
              </p>
            </div>
          )}

          {/* Step 6: Emergency Contact */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">Emergency Contact</h2>
              <p className="font-body text-charcoal/60 text-center mb-4">This is required for student safety.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="flex-shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <p className="font-body text-sm text-amber-800">
                    <strong>Why is this required?</strong> If our AI ever detects that a student may be in distress, we need to be able to alert a trusted adult immediately. This contact will only be used in safety-critical situations.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-4">
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Contact Name</label>
                  <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" placeholder="Full name" />
                </div>
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Relationship</label>
                  <select value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white">
                    <option value="">Select relationship</option>
                    <option>Parent</option><option>Guardian</option><option>Grandparent</option><option>Aunt/Uncle</option><option>Sibling (18+)</option><option>Other trusted adult</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Phone Number</label>
                  <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Email Address</label>
                  <input type="email" value={emergencyEmail} onChange={(e) => setEmergencyEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" placeholder="email@example.com" />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Language & Country */}
          {step === 7 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">Language & Location</h2>
              <p className="font-body text-charcoal/60 text-center mb-8">This helps us match learning to your local educational standards.</p>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Primary Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white">
                    {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Other'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white">
                    {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Brazil', 'India', 'Japan', 'South Korea', 'Mexico', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <p className="font-body text-sm text-teal">
                    <strong>Curriculum mapping:</strong> We'll align learning activities with {country === 'United States' ? 'Common Core' : country === 'United Kingdom' ? 'National Curriculum' : 'your national'} standards.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Privacy & Consent */}
          {step === 8 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">Privacy & Data Protection</h2>
              <p className="font-body text-charcoal/60 text-center mb-8">Your family's privacy is our highest priority.</p>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
                {/* Privacy Shield */}
                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h3 className="font-heading font-bold text-green-800">FreeLearner Privacy Guarantee</h3>
                  </div>
                  <ul className="space-y-2">
                    {[
                      'COPPA, FERPA, and HIPAA-grade data protection standards',
                      'All data encrypted at rest (AES-256) and in transit (TLS 1.3)',
                      'AI never stores personal identifying information in training data',
                      'Student conversations are never used to train AI models',
                      'No third-party data sharing, selling, or advertising — ever',
                      'Parents can view, export, or delete all data at any time',
                      'Automatic data purging after account deletion (30-day grace period)',
                      'Annual third-party security audits',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2">
                        <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="font-body text-xs text-green-800/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Privacy Commitment */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </div>
                    <h3 className="font-heading font-bold text-blue-800">AI Privacy Commitment</h3>
                  </div>
                  <p className="font-body text-xs text-blue-800/80 leading-relaxed">
                    Our AI mentor is explicitly instructed to <strong>never ask for</strong>, <strong>never store</strong>, and <strong>never reference</strong> personal identifying information including home addresses, phone numbers, school names, social media accounts, or photos. The AI will actively redirect any conversation where a student begins sharing such information. All AI interactions are processed in isolated, encrypted sessions that are not used for model training.
                  </p>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-4 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal"
                    />
                    <span className="font-body text-sm text-charcoal/80">
                      I have read and agree to the <button className="text-teal underline hover:text-teal-dark">Privacy Policy</button> and <button className="text-teal underline hover:text-teal-dark">Terms of Service</button>. I understand how FreeLearner collects, uses, and protects my {accountType === 'adult' ? '' : "child's "}data.
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={dataMinimization}
                      onChange={(e) => setDataMinimization(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal"
                    />
                    <span className="font-body text-sm text-charcoal/80">
                      I consent to FreeLearner collecting only the minimum data necessary to provide personalized educational experiences, and I understand I can revoke this consent at any time.
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 9: Welcome / Summary */}
          {step === 9 && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal to-teal-dark rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="font-heading font-bold text-3xl text-charcoal mb-2">You're all set!</h2>
              <p className="font-body text-lg text-charcoal/60 mb-6">
                {studentName || 'Your learner'} is ready to start exploring.
              </p>

              {/* Profile Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-lg mx-auto mb-6 text-left">
                <h3 className="font-heading font-bold text-sm text-charcoal mb-4 text-center">Learner Profile Summary</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-cream rounded-xl p-3">
                    <p className="font-body text-xs text-charcoal/40">Age</p>
                    <p className="font-heading font-bold text-sm text-charcoal">{studentAge} years old</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3">
                    <p className="font-body text-xs text-charcoal/40">Grade Level</p>
                    <p className="font-heading font-bold text-sm text-charcoal">{gradeLevel === 'K' ? 'Kindergarten' : gradeLevel === 'college' ? 'College/Adult' : `Grade ${gradeLevel}`}</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3">
                    <p className="font-body text-xs text-charcoal/40">Learning Style</p>
                    <p className="font-heading font-bold text-sm text-charcoal capitalize">{determineLearningStyle(calculateProfile())}</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3">
                    <p className="font-body text-xs text-charcoal/40">Communication</p>
                    <p className="font-heading font-bold text-sm text-charcoal capitalize">{communicationPref === 'both' ? 'Text & Voice' : communicationPref}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="font-body text-xs text-charcoal/40 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInterests.slice(0, 8).map(i => (
                      <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal font-body text-xs font-semibold rounded-full">{i}</span>
                    ))}
                    {selectedInterests.length > 8 && <span className="px-2.5 py-1 bg-gray-100 text-charcoal/50 font-body text-xs rounded-full">+{selectedInterests.length - 8} more</span>}
                  </div>
                </div>
                <div>
                  <p className="font-body text-xs text-charcoal/40 mb-2">Strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStrengths.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-orange-50 text-orange font-body text-xs font-semibold rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4 max-w-lg mx-auto mb-6">
                <div className="flex items-center gap-2 justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span className="font-body text-xs text-green-800 font-semibold">Privacy protected with HIPAA-grade encryption</span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="px-10 py-4 bg-orange hover:bg-orange-dark text-white font-body font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Exploring!
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 9 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                className={`px-6 py-3 font-body font-semibold text-sm rounded-xl transition-all ${
                  step === 1 ? 'opacity-0 pointer-events-none' : 'text-charcoal/60 hover:text-charcoal hover:bg-gray-100'
                }`}
              >
                Back
              </button>
              <button
                onClick={() => setStep(Math.min(totalSteps, step + 1))}
                disabled={!canProceed()}
                className="px-8 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === 8 ? 'Finish Setup' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
