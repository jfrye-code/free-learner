import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useStudentAvatar } from '@/hooks/useStudentAvatar';
import Logo from '@/components/Logo';
import PersonalityAssessment from '@/components/onboarding/PersonalityAssessment';
import LearningPrefsAssessment from '@/components/onboarding/LearningPrefsAssessment';
import AptitudeAssessment from '@/components/onboarding/AptitudeAssessment';
import { interestOptions, strengthOptions } from '@/lib/assessmentData';

const OnboardingPage: React.FC = () => {
  const { setCurrentPage, setIsLoggedIn, setUserRole, setStudentProfile, studentProfile, saveStudentToDatabase, studentId } = useAppContext();
  const { buildAvatar } = useStudentAvatar();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<'parent' | 'educator' | 'adult'>('parent');
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState('10');
  const [gradeLevel, setGradeLevel] = useState('5');
  const [language, setLanguage] = useState('English');
  const [country, setCountry] = useState('United States');
  const [communicationPref, setCommunicationPref] = useState('text');

  // Assessment data
  const [personalityAnswers, setPersonalityAnswers] = useState<Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>>([]);
  const [learningPrefAnswers, setLearningPrefAnswers] = useState<Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [aptitudeResults, setAptitudeResults] = useState<Record<string, number>>({});

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');

  // Privacy
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [dataMinimization, setDataMinimization] = useState(false);

  // Avatar building state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStage, setBuildStage] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const [avatarResult, setAvatarResult] = useState<any>(null);

  const totalSteps = 12;
  const progress = (step / totalSteps) * 100;

  const toggleInterest = (label: string) => {
    setSelectedInterests(prev => prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]);
  };

  const toggleStrength = (label: string) => {
    setSelectedStrengths(prev => prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]);
  };

  function gradeBandFromGradeLevel(gl: string): string {
    if (gl === 'K' || gl === '1' || gl === '2') return 'K-2';
    const g = parseInt(gl);
    if (!isNaN(g)) {
      if (g <= 2) return 'K-2';
      if (g <= 5) return '3-5';
      if (g <= 8) return '6-8';
      return '9-12';
    }
    if (gl === 'college') return '9-12';
    return '6-8';
  }

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return studentName.trim().length > 0;
      case 3: return personalityAnswers.length >= 10; // All personality Qs answered
      case 4: return learningPrefAnswers.length >= 8; // All learning pref Qs answered
      case 5: return selectedInterests.length >= 3;
      case 6: return selectedStrengths.length >= 2;
      case 7: return Object.keys(aptitudeResults).length >= 3; // At least 3 domains
      case 8: return emergencyName.trim() && emergencyPhone.trim() && emergencyEmail.includes('@');
      case 9: return true;
      case 10: return privacyConsent && dataMinimization;
      default: return true;
    }
  };

  // Build the avatar (step 11)
  const buildStudentAvatar = async () => {
    setIsBuilding(true);
    setBuildError(null);
    setBuildProgress(0);

    try {
      // Stage 1: Save student to database
      setBuildStage('Creating student record...');
      setBuildProgress(10);

      const gradeBand = gradeBandFromGradeLevel(gradeLevel);

      // Compute personality traits for the student profile
      const traitScores: Record<string, number> = {};
      for (const answer of personalityAnswers) {
        for (const [trait, val] of Object.entries(answer.traits)) {
          traitScores[trait] = (traitScores[trait] || 0) + val;
        }
      }

      // Determine learning style from learning pref answers
      const modalityScores: Record<string, number> = { visual: 0, auditory: 0, kinesthetic: 0, reading_writing: 0 };
      for (const answer of learningPrefAnswers) {
        for (const [trait, val] of Object.entries(answer.traits)) {
          if (trait in modalityScores) {
            modalityScores[trait] += val;
          }
        }
      }
      const primaryModality = Object.entries(modalityScores).sort((a, b) => b[1] - a[1])[0][0];

      const updatedProfile = {
        ...studentProfile,
        name: studentName || 'Alex',
        age: parseInt(studentAge) || 10,
        gradeLevel,
        gradeBand,
        interests: selectedInterests,
        learningStyle: primaryModality,
        personalityTraits: traitScores,
        strengths: selectedStrengths,
        preferredPace: (traitScores.persistence_trait || 0) > 3 ? 'fast' : (traitScores.persistence_trait || 0) < 1.5 ? 'slow' : 'moderate',
        communicationStyle: communicationPref,
        aptitudeScores: aptitudeResults,
      };

      setStudentProfile(updatedProfile);
      setBuildProgress(25);

      // Stage 2: Save to database
      setBuildStage('Saving profile to database...');
      const savedStudentId = await saveStudentToDatabase(updatedProfile);
      setBuildProgress(40);

      if (!savedStudentId) {
        throw new Error('Failed to save student record. Please try again.');
      }

      // Stage 3: Build the avatar via edge function
      setBuildStage('Analyzing personality patterns...');
      setBuildProgress(55);

      await new Promise(r => setTimeout(r, 500)); // Brief pause for UX

      setBuildStage('Building learning profile...');
      setBuildProgress(70);

      const result = await buildAvatar({
        studentId: savedStudentId,
        basicInfo: {
          name: studentName,
          age: parseInt(studentAge) || 10,
          gradeLevel,
          gradeBand,
          language,
          country,
          communicationPref,
        },
        personalityAnswers,
        learningPrefAnswers,
        interests: selectedInterests,
        strengths: selectedStrengths,
        aptitudeResults,
        emergencyContact: {
          name: emergencyName,
          relation: emergencyRelation,
          phone: emergencyPhone,
          email: emergencyEmail,
        },
      });

      setBuildProgress(90);

      if (!result.success) {
        console.warn('Avatar build warning:', result.error);
        // Continue anyway — the student record is saved
      }

      setBuildStage('Personalizing your experience...');
      setBuildProgress(100);

      await new Promise(r => setTimeout(r, 800));

      setAvatarResult(result);
      setIsBuilding(false);
      setStep(12); // Go to summary
    } catch (err: any) {
      console.error('Avatar build error:', err);
      setBuildError(err.message || 'Something went wrong. You can still continue.');
      setIsBuilding(false);
      // Allow continuing even on error
      setStep(12);
    }
  };

  useEffect(() => {
    if (step === 11 && !isBuilding && !avatarResult && !buildError) {
      buildStudentAvatar();
    }
  }, [step]);

  const handleFinish = () => {
    setIsLoggedIn(true);
    setUserRole(accountType === 'parent' ? 'parent' : accountType === 'educator' ? 'educator' : 'student');
    setCurrentPage('student');
    window.scrollTo({ top: 0 });
  };

  const goNext = () => {
    if (step === 10) {
      setStep(11); // Go to avatar building
    } else if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    if (step === 12) setStep(10); // Skip back over building step
    else if (step > 1) setStep(prev => prev - 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }}
            className="font-body text-sm text-charcoal/40 hover:text-charcoal transition-colors">
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
          <p className="font-body text-xs text-charcoal/40 text-center py-2">Step {Math.min(step, 12)} of {totalSteps}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-2xl">

          {/* ═══════ STEP 1: Account Type ═══════ */}
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
                  <button key={opt.id} onClick={() => setAccountType(opt.id)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 ${accountType === opt.id ? 'border-teal bg-teal-50 shadow-md' : 'border-gray-200 bg-white hover:border-teal/30'}`}>
                    <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 ${accountType === opt.id ? 'bg-teal text-white' : 'bg-gray-100 text-charcoal/60'}`}>{opt.icon}</div>
                    <h3 className="font-heading font-bold text-sm text-charcoal">{opt.title}</h3>
                    <p className="font-body text-xs text-charcoal/50 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ STEP 2: Basic Info ═══════ */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">
                {accountType === 'adult' ? 'Tell us about yourself' : "Tell us about the learner"}
              </h2>
              <p className="font-body text-charcoal/60 text-center mb-8">This helps us personalize the experience.</p>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">{accountType === 'adult' ? 'Your name' : "Student's name"}</label>
                  <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" placeholder="Enter name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">{accountType === 'adult' ? 'Your age' : "Student's age"}</label>
                    <select value={studentAge} onChange={(e) => setStudentAge(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white">
                      {Array.from({ length: 18 }, (_, i) => i + 5).map(age => <option key={age} value={age}>{age} years old</option>)}
                      <option value="23">18+ (Adult Learner)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Current grade level</label>
                    <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white">
                      <option value="K">Kindergarten</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
                      <option value="college">College / Adult</option>
                    </select>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <p className="font-body text-xs text-blue-800">
                      <strong>Why separate age and grade?</strong> Many learners work above or below their age-typical grade level — and that's perfectly fine! We separate these so our AI mentor can meet each student exactly where they are.
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
                      <button key={opt.id} onClick={() => setCommunicationPref(opt.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${communicationPref === opt.id ? 'border-teal bg-teal-50' : 'border-gray-200 bg-white hover:border-teal/30'}`}>
                        <div className={`mx-auto mb-1 ${communicationPref === opt.id ? 'text-teal' : 'text-charcoal/40'}`}>{opt.icon}</div>
                        <span className="font-body text-xs font-semibold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ STEP 3: Personality Assessment (Big Five) ═══════ */}
          {step === 3 && (
            <PersonalityAssessment
              studentName={studentName || 'you'}
              initialAnswers={personalityAnswers.length > 0 ? personalityAnswers : undefined}
              onComplete={(answers) => { setPersonalityAnswers(answers); goNext(); }}
            />
          )}

          {/* ═══════ STEP 4: Learning Preferences ═══════ */}
          {step === 4 && (
            <LearningPrefsAssessment
              studentName={studentName || 'you'}
              initialAnswers={learningPrefAnswers.length > 0 ? learningPrefAnswers : undefined}
              onComplete={(answers) => { setLearningPrefAnswers(answers); goNext(); }}
            />
          )}

          {/* ═══════ STEP 5: Interests ═══════ */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">What interests {studentName || 'you'}?</h2>
              <p className="font-body text-charcoal/60 text-center mb-1">Pick at least 3 topics. The more the better!</p>
              <p className="font-body text-xs text-teal text-center mb-6">Our AI weaves your interests into every lesson to keep things engaging.</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {interestOptions.map(opt => (
                  <button key={opt.label} onClick={() => toggleInterest(opt.label)}
                    className={`p-3 rounded-xl text-center transition-all duration-200 ${selectedInterests.includes(opt.label) ? 'bg-teal text-white shadow-md scale-105' : 'bg-white border border-gray-200 hover:border-teal/30 hover:bg-teal-50'}`}>
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

          {/* ═══════ STEP 6: Strengths ═══════ */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">What are {studentName || 'your'} strengths?</h2>
              <p className="font-body text-charcoal/60 text-center mb-1">Pick at least 2 things {studentName || 'you'} are naturally good at.</p>
              <p className="font-body text-xs text-teal text-center mb-8">Everyone has unique strengths — this helps our AI play to them!</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {strengthOptions.map(s => (
                  <button key={s} onClick={() => toggleStrength(s)}
                    className={`px-4 py-3 rounded-xl text-center transition-all duration-200 font-body text-xs font-semibold ${selectedStrengths.includes(s) ? 'bg-orange text-white shadow-md' : 'bg-white border border-gray-200 text-charcoal/70 hover:border-orange/30 hover:bg-orange-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="font-body text-xs text-charcoal/40 text-center mt-4">
                {selectedStrengths.length} selected {selectedStrengths.length < 2 ? `(pick at least ${2 - selectedStrengths.length} more)` : ''}
              </p>
            </div>
          )}

          {/* ═══════ STEP 7: Aptitude Assessment ═══════ */}
          {step === 7 && (
            <AptitudeAssessment
              studentName={studentName || 'you'}
              onComplete={(results) => { setAptitudeResults(results); goNext(); }}
            />
          )}

          {/* ═══════ STEP 8: Emergency Contact ═══════ */}
          {step === 8 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">Emergency Contact</h2>
              <p className="font-body text-charcoal/60 text-center mb-4">This is required for student safety.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="flex-shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <p className="font-body text-sm text-amber-800">
                    <strong>Why is this required?</strong> If our AI ever detects that a student may be in distress, we need to be able to alert a trusted adult immediately.
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

          {/* ═══════ STEP 9: Language & Country ═══════ */}
          {step === 9 && (
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

          {/* ═══════ STEP 10: Privacy & Consent ═══════ */}
          {step === 10 && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">Privacy & Data Protection</h2>
              <p className="font-body text-charcoal/60 text-center mb-8">Your family's privacy is our highest priority.</p>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h3 className="font-heading font-bold text-green-800">FreeLearner Privacy Guarantee</h3>
                  </div>
                  <ul className="space-y-2">
                    {['COPPA, FERPA, and HIPAA-grade data protection', 'All data encrypted at rest (AES-256) and in transit (TLS 1.3)', 'Student conversations never used to train AI models', 'No third-party data sharing or advertising — ever', 'Parents can view, export, or delete all data at any time'].map(item => (
                      <li key={item} className="flex items-start gap-2">
                        <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="font-body text-xs text-green-800/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal" />
                    <span className="font-body text-sm text-charcoal/80">
                      I have read and agree to the Privacy Policy and Terms of Service. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={dataMinimization} onChange={(e) => setDataMinimization(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal" />
                    <span className="font-body text-sm text-charcoal/80">
                      I consent to FreeLearner collecting only the minimum data necessary to provide personalized educational experiences. <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ STEP 11: Building Avatar (Loading) ═══════ */}
          {step === 11 && (
            <div className="animate-fade-in text-center py-12">
              <div className="w-24 h-24 mx-auto mb-8 relative">
                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full border-4 border-teal/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-orange/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-4 rounded-full border-4 border-teal/30 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <h2 className="font-heading font-bold text-2xl text-charcoal mb-2">
                Building {studentName}'s Learning Avatar
              </h2>
              <p className="font-body text-charcoal/50 mb-6">
                Our AI is analyzing personality, learning style, and aptitudes to create a personalized learning profile...
              </p>

              {/* Progress bar */}
              <div className="max-w-sm mx-auto mb-4">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal via-orange to-teal rounded-full transition-all duration-700"
                    style={{ width: `${buildProgress}%` }} />
                </div>
              </div>
              <p className="font-body text-sm text-teal font-semibold">{buildStage}</p>

              {buildError && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md mx-auto">
                  <p className="font-body text-sm text-amber-800">
                    <strong>Note:</strong> {buildError}
                  </p>
                  <button onClick={() => setStep(12)} className="mt-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg font-body text-xs font-bold text-amber-800 transition-colors">
                    Continue Anyway
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════ STEP 12: Summary + Avatar Preview ═══════ */}
          {step === 12 && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal to-teal-dark rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="font-heading font-bold text-3xl text-charcoal mb-2">
                {studentName}'s Avatar is Ready!
              </h2>
              <p className="font-body text-lg text-charcoal/60 mb-6">
                We've built a personalized learning profile that will evolve with every session.
              </p>

              {/* Profile Summary Cards */}
              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-6 text-left">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </div>
                    <span className="font-body text-xs font-semibold text-charcoal/50">Personality</span>
                  </div>
                  <p className="font-body text-xs text-charcoal/70">
                    {personalityAnswers.length > 0 ? 'Big Five profile mapped' : 'Default profile'}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                    </div>
                    <span className="font-body text-xs font-semibold text-charcoal/50">Learning Style</span>
                  </div>
                  <p className="font-body text-xs text-charcoal/70">
                    {learningPrefAnswers.length > 0 ? 'Preferences calibrated' : 'Default preferences'}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <span className="font-body text-xs font-semibold text-charcoal/50">Aptitude</span>
                  </div>
                  <p className="font-body text-xs text-charcoal/70">
                    {Object.keys(aptitudeResults).length} domains assessed
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <span className="font-body text-xs font-semibold text-charcoal/50">Interests</span>
                  </div>
                  <p className="font-body text-xs text-charcoal/70">
                    {selectedInterests.length} topics mapped
                  </p>
                </div>
              </div>

              {/* Interests & Strengths */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-lg mx-auto mb-6 text-left">
                <div className="mb-4">
                  <p className="font-body text-xs text-charcoal/40 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInterests.slice(0, 8).map(i => (
                      <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal font-body text-xs font-semibold rounded-full">{i}</span>
                    ))}
                    {selectedInterests.length > 8 && <span className="px-2.5 py-1 bg-gray-100 text-charcoal/50 font-body text-xs rounded-full">+{selectedInterests.length - 8} more</span>}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="font-body text-xs text-charcoal/40 mb-2">Strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStrengths.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-orange-50 text-orange font-body text-xs font-semibold rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
                {Object.keys(aptitudeResults).length > 0 && (
                  <div>
                    <p className="font-body text-xs text-charcoal/40 mb-2">Aptitude Baselines</p>
                    <div className="space-y-1.5">
                      {Object.entries(aptitudeResults).filter(([k]) => !k.startsWith('_')).map(([domain, score]) => (
                        <div key={domain} className="flex items-center gap-2">
                          <span className="font-body text-xs text-charcoal/60 w-20 capitalize">{domain}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal to-teal-dark rounded-full transition-all" style={{ width: `${score * 100}%` }} />
                          </div>
                          <span className="font-body text-xs text-charcoal/40 w-8">{Math.round(score * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar evolution notice */}
              <div className="bg-gradient-to-r from-teal-50 to-orange-50 border border-teal/10 rounded-xl p-4 max-w-lg mx-auto mb-6">
                <div className="flex items-start gap-3">
                  <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                  <div className="text-left">
                    <p className="font-body text-sm font-semibold text-charcoal/80">This profile evolves with every session</p>
                    <p className="font-body text-xs text-charcoal/50 mt-0.5">
                      As {studentName} learns, our AI continuously refines this avatar — adjusting tone, pacing, challenge level, and teaching strategy based on real performance data.
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={handleFinish}
                className="px-10 py-4 bg-orange hover:bg-orange-dark text-white font-body font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Start Exploring!
              </button>
            </div>
          )}

          {/* ═══════ Navigation (for steps that don't self-advance) ═══════ */}
          {![3, 4, 7, 11, 12].includes(step) && step <= 10 && (
            <div className="flex items-center justify-between mt-8">
              <button onClick={goBack}
                className={`px-6 py-3 font-body font-semibold text-sm rounded-xl transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-charcoal/60 hover:text-charcoal hover:bg-gray-100'}`}>
                Back
              </button>
              <button onClick={goNext} disabled={!canProceed()}
                className="px-8 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {step === 10 ? 'Build My Avatar' : 'Continue'}
              </button>
            </div>
          )}

          {/* Back button for self-advancing steps */}
          {[3, 4, 7].includes(step) && (
            <div className="mt-4">
              <button onClick={goBack}
                className="px-6 py-3 font-body font-semibold text-sm text-charcoal/40 hover:text-charcoal hover:bg-gray-100 rounded-xl transition-all">
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
