import React, { useState } from 'react';
import Logo from './Logo';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth, AuthRole } from '@/contexts/AuthContext';

type ModalView = 'login' | 'signup' | 'reset' | 'verify' | 'child-setup';

const LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, setCurrentPage, setUserRole, setIsLoggedIn } = useAppContext();
  const { signIn, signUp, resetPassword, createChildAccount, isAuthenticated, profile } = useAuth();

  const [view, setView] = useState<ModalView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AuthRole>('parent');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Child account fields
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGrade, setChildGrade] = useState('');

  if (!showLoginModal) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setSchoolName('');
    setError('');
    setSuccess('');
    setChildName('');
    setChildAge('');
    setChildGrade('');
  };

  const switchView = (newView: ModalView) => {
    resetForm();
    setView(newView);
  };

  const closeModal = () => {
    resetForm();
    setView('login');
    setShowLoginModal(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Success - auth state change will update profile
    setLoading(false);
    // Small delay to let profile load
    setTimeout(() => {
      closeModal();
      // Navigate based on role - will be set by AppContext sync
    }, 600);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (role === 'educator' && !schoolName.trim()) {
      setError('Please enter your school or organization name');
      setLoading(false);
      return;
    }

    const result = await signUp(email, password, fullName, role, schoolName || undefined);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.needsVerification) {
      setView('verify');
      setLoading(false);
      return;
    }

    // Signed up and auto-signed in
    setLoading(false);
    setTimeout(() => {
      closeModal();
    }, 600);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const result = await resetPassword(email);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Password reset email sent! Check your inbox (and spam folder).');
    }
    setLoading(false);
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!childName.trim()) {
      setError('Please enter your child\'s name');
      setLoading(false);
      return;
    }

    const result = await createChildAccount(
      childName,
      parseInt(childAge) || 10,
      childGrade || '5th',
      []
    );

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Child account created successfully!');
      setTimeout(() => closeModal(), 1500);
    }
    setLoading(false);
  };

  const roleOptions: { value: AuthRole; label: string; desc: string; icon: JSX.Element }[] = [
    {
      value: 'parent',
      label: 'Parent',
      desc: 'Manage your children\'s learning',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      value: 'educator',
      label: 'Educator',
      desc: 'School or organization account',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      value: 'student',
      label: 'Student',
      desc: 'I\'m an explorer (13+ only)',

      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-in">
        {/* Close button */}
        <button onClick={closeModal} className="absolute top-4 right-4 z-10 text-charcoal/40 hover:text-charcoal transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-8">
          {/* ===== SIGN IN VIEW ===== */}
          {view === 'login' && (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><Logo size="md" /></div>
                <h2 className="font-heading font-bold text-2xl text-charcoal">Welcome back</h2>
                <p className="font-body text-sm text-charcoal/50 mt-1">Continue your adventure</p>

              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-body text-sm font-semibold text-charcoal/70">Password</label>
                    <button
                      type="button"
                      onClick={() => switchView('reset')}
                      className="font-body text-xs text-teal hover:text-teal-dark font-semibold transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p className="text-red-600 text-sm font-body">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-center font-body text-sm text-charcoal/50">
                  Don't have an account?{' '}
                  <button onClick={() => switchView('signup')} className="text-teal font-semibold hover:underline">
                    Create one free
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ===== SIGN UP VIEW ===== */}
          {view === 'signup' && (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><Logo size="md" /></div>
                <h2 className="font-heading font-bold text-2xl text-charcoal">Create your account</h2>
                <p className="font-body text-sm text-charcoal/50 mt-1">Start your learning adventure today</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Role selector */}
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-2">I am a...</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                          role === opt.value
                            ? 'border-teal bg-teal-50 text-teal'
                            : 'border-gray-200 text-charcoal/50 hover:border-gray-300'
                        }`}
                      >
                        {opt.icon}
                        <span className="font-body text-xs font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="font-body text-xs text-charcoal/40 mt-1.5 text-center">
                    {roleOptions.find(r => r.value === role)?.desc}
                  </p>
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder={role === 'educator' ? 'Your name' : role === 'student' ? 'Your name' : 'Your name'}
                    required
                    autoComplete="name"
                  />
                </div>

                {role === 'educator' && (
                  <div>
                    <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">School / Organization</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                      placeholder="Lincoln Elementary School"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="At least 6 characters"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="Re-enter your password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                {role === 'student' && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="font-body text-xs text-amber-700">
                      <strong>Note:</strong> Students under 13 need a parent account. Ask your parent to create an account and add you as a child explorer.
                    </p>
                  </div>
                )}


                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p className="text-red-600 text-sm font-body">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="font-body text-xs text-charcoal/40 text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-center font-body text-sm text-charcoal/50">
                  Already have an account?{' '}
                  <button onClick={() => switchView('login')} className="text-teal font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ===== PASSWORD RESET VIEW ===== */}
          {view === 'reset' && (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
                <h2 className="font-heading font-bold text-2xl text-charcoal">Reset your password</h2>
                <p className="font-body text-sm text-charcoal/50 mt-1">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p className="text-red-600 text-sm font-body">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p className="text-green-700 text-sm font-body">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-center font-body text-sm text-charcoal/50">
                  Remember your password?{' '}
                  <button onClick={() => switchView('login')} className="text-teal font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ===== EMAIL VERIFICATION VIEW ===== */}
          {view === 'verify' && (
            <>
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                </div>
                <h2 className="font-heading font-bold text-2xl text-charcoal mb-2">Check your email</h2>
                <p className="font-body text-sm text-charcoal/60 mb-2">
                  We've sent a verification link to:
                </p>
                <p className="font-body text-sm font-bold text-teal mb-4">{email}</p>
                <p className="font-body text-xs text-charcoal/40 mb-6">
                  Click the link in the email to verify your account. Check your spam folder if you don't see it.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => switchView('login')}
                    className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Go to Sign In
                  </button>
                  <button
                    onClick={closeModal}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-charcoal/70 font-body font-semibold text-sm rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== ADD CHILD VIEW ===== */}
          {view === 'child-setup' && (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-orange/10 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                </div>
                <h2 className="font-heading font-bold text-2xl text-charcoal">Add a child explorer</h2>
                <p className="font-body text-sm text-charcoal/50 mt-1">
                  Set up a profile for your child
                </p>
              </div>


              <form onSubmit={handleCreateChild} className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Child's Name</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    placeholder="Alex"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Age</label>
                    <select
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white"
                    >
                      <option value="">Select</option>
                      {Array.from({ length: 13 }, (_, i) => i + 6).map(age => (
                        <option key={age} value={age}>{age} years old</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-sm font-semibold text-charcoal/70 mb-1.5">Grade</label>
                    <select
                      value={childGrade}
                      onChange={(e) => setChildGrade(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all bg-white"
                    >
                      <option value="">Select</option>
                      {['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p className="text-red-600 text-sm font-body">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p className="text-green-700 text-sm font-body">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange hover:bg-orange-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                      Creating...
                    </>
                  ) : (
                    'Add Child'
                  )}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button onClick={closeModal} className="w-full text-center font-body text-sm text-charcoal/50 hover:text-charcoal transition-colors">
                  Skip for now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
