import React, { useState } from 'react';
import Logo from './Logo';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const Navbar: React.FC = () => {
  const { currentPage, setCurrentPage, setShowLoginModal } = useAppContext();
  const { isAuthenticated, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', page: 'home' as const },
    { label: 'How It Works', page: 'home' as const, scrollTo: 'how-it-works' },
    { label: 'Safety', page: 'safety' as const },
    { label: 'Pricing', page: 'pricing' as const },
  ];


  const handleNavClick = (page: typeof navLinks[0]['page'], scrollTo?: string) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    if (scrollTo) {
      setTimeout(() => {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    setShowLoginModal(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('home');
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'parent': return 'bg-blue-100 text-blue-700';
      case 'educator': return 'bg-orange/10 text-orange';
      case 'student': return 'bg-teal-50 text-teal';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDashboardPage = () => {
    if (!profile) return 'home';
    switch (profile.role) {
      case 'student': return 'student';
      case 'parent': return 'parent';
      case 'educator': return 'school';
      default: return 'home';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <button onClick={() => handleNavClick('home')} className="flex items-center">
            <Logo size="md" />
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.page, link.scrollTo)}
                className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all duration-200 ${
                  currentPage === link.page && !link.scrollTo
                    ? 'text-teal bg-teal-50'
                    : 'text-charcoal/70 hover:text-teal hover:bg-teal-50/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && profile ? (
              <div className="relative">
                {/* Quick nav buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setCurrentPage(getDashboardPage() as any); window.scrollTo({ top: 0 }); }}
                    className="px-4 py-2 text-sm font-body font-semibold text-teal hover:bg-teal-50 rounded-lg transition-all"
                  >
                    {profile.role === 'educator' ? 'School Portal' : profile.role === 'parent' ? 'Parent Portal' : 'Dashboard'}
                  </button>

                  {profile.role === 'parent' && (
                    <button
                      onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }}
                      className="px-4 py-2 text-sm font-body font-semibold text-charcoal/60 hover:text-teal hover:bg-teal-50 rounded-lg transition-all"
                    >
                      Student View
                    </button>
                  )}

                  {/* User avatar / menu trigger */}
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white font-body font-bold text-xs">
                      {getInitials(profile.full_name || profile.email)}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                      {/* User info header */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-body font-bold text-sm">
                            {getInitials(profile.full_name || profile.email)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body font-bold text-sm text-charcoal truncate">
                              {profile.full_name || 'User'}
                            </p>
                            <p className="font-body text-xs text-charcoal/50 truncate">{profile.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-body font-bold ${getRoleBadgeColor(profile.role)}`}>
                            {profile.role}
                          </span>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        {profile.role === 'parent' && (
                          <>
                            <button
                              onClick={() => { setCurrentPage('parent'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-teal-50 hover:text-teal transition-all flex items-center gap-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                              </svg>
                              Parent Portal
                            </button>
                            <button
                              onClick={() => { setCurrentPage('student'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-teal-50 hover:text-teal transition-all flex items-center gap-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5" />
                              </svg>
                              Student Dashboard
                            </button>
                          </>
                        )}
                        {profile.role === 'student' && (
                          <>
                            <button
                              onClick={() => { setCurrentPage('student'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-teal-50 hover:text-teal transition-all flex items-center gap-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                              </svg>
                              My Dashboard
                            </button>
                            <button
                              onClick={() => { setCurrentPage('chat'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-teal-50 hover:text-teal transition-all flex items-center gap-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              Chat with Mentor
                            </button>
                            <button
                              onClick={() => { setCurrentPage('shop'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center gap-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                              </svg>
                              Reward Shop
                            </button>
                            <button
                              onClick={() => { setCurrentPage('leaderboard'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center gap-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z"/><circle cx="12" cy="8" r="6"/>
                              </svg>
                              Leaderboard
                            </button>
                          </>
                        )}



                        {profile.role === 'educator' && (
                          <button
                            onClick={() => { setCurrentPage('school'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                            className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-teal-50 hover:text-teal transition-all flex items-center gap-3"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                            School Portal
                          </button>
                        )}

                        <hr className="my-1 border-gray-100" />

                        {/* Account Settings link */}
                        <button
                          onClick={() => { setCurrentPage('settings'); setUserMenuOpen(false); window.scrollTo({ top: 0 }); }}
                          className="w-full px-4 py-2.5 text-left text-sm font-body text-charcoal/70 hover:bg-teal-50 hover:text-teal transition-all flex items-center gap-3"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                          Account Settings
                        </button>

                        <hr className="my-1 border-gray-100" />

                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-left text-sm font-body text-red-500 hover:bg-red-50 transition-all flex items-center gap-3"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 text-sm font-body font-semibold text-teal hover:bg-teal-50 rounded-lg transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setCurrentPage('onboarding'); window.scrollTo({ top: 0 }); }}
                  className="px-5 py-2.5 text-sm font-body font-bold text-white bg-orange hover:bg-orange-dark rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-charcoal hover:bg-gray-100"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {/* User info on mobile */}
              {isAuthenticated && profile && (
                <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl mx-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-body font-bold text-sm">
                      {getInitials(profile.full_name || profile.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-bold text-sm text-charcoal truncate">
                        {profile.full_name || 'User'}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-body font-bold ${getRoleBadgeColor(profile.role)}`}>
                        {profile.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.page, link.scrollTo)}
                  className="px-4 py-3 text-left text-sm font-body font-semibold text-charcoal/70 hover:text-teal hover:bg-teal-50 rounded-lg transition-all"
                >
                  {link.label}
                </button>
              ))}

              <hr className="my-2 border-gray-100" />

              {isAuthenticated && profile ? (
                <>
                  {profile.role === 'parent' && (
                    <>
                      <button onClick={() => { setCurrentPage('parent'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="px-4 py-3 text-left text-sm font-body font-semibold text-teal">Parent Portal</button>
                      <button onClick={() => { setCurrentPage('student'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="px-4 py-3 text-left text-sm font-body font-semibold text-charcoal/60">Student View</button>
                    </>
                  )}
                  {profile.role === 'student' && (
                    <>
                      <button onClick={() => { setCurrentPage('student'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="px-4 py-3 text-left text-sm font-body font-semibold text-teal">My Dashboard</button>
                      <button onClick={() => { setCurrentPage('chat'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="px-4 py-3 text-left text-sm font-body font-semibold text-teal">Chat with Mentor</button>
                      <button onClick={() => { setCurrentPage('shop'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="px-4 py-3 text-left text-sm font-body font-semibold text-purple-600 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                        Reward Shop
                      </button>
                      <button onClick={() => { setCurrentPage('leaderboard'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="px-4 py-3 text-left text-sm font-body font-semibold text-amber-600 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z"/><circle cx="12" cy="8" r="6"/></svg>
                        Leaderboard
                      </button>
                    </>
                  )}

                  {profile.role === 'educator' && (
                    <button onClick={() => { setCurrentPage('school'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="px-4 py-3 text-left text-sm font-body font-semibold text-orange">School Portal</button>
                  )}

                  <hr className="my-2 border-gray-100" />

                  {/* Account Settings - mobile */}
                  <button
                    onClick={() => { setCurrentPage('settings'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }}
                    className="px-4 py-3 text-left text-sm font-body font-semibold text-charcoal/60 hover:text-teal flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Account Settings
                  </button>

                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="px-4 py-3 text-left text-sm font-body font-semibold text-red-500"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleLogin} className="px-4 py-3 text-left text-sm font-body font-semibold text-teal">Sign In</button>
                  <button onClick={() => { setCurrentPage('onboarding'); setMobileMenuOpen(false); window.scrollTo({ top: 0 }); }} className="mx-4 mt-2 py-3 text-center text-sm font-body font-bold text-white bg-orange rounded-full">Start Free Trial</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
