import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from './LoginModal';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import StudentDashboard from '@/pages/StudentDashboard';
import AIChatPage from '@/pages/AIChatPage';
import SafetyPage from '@/pages/SafetyPage';
import OnboardingPage from '@/pages/OnboardingPage';
import ParentPortal from '@/pages/ParentPortal';
import SchoolPortal from '@/pages/SchoolPortal';
import AccountSettingsPage from '@/pages/AccountSettingsPage';
import BillingPage from '@/pages/BillingPage';
import PricingPage from '@/pages/PricingPage';
import LearningProgressPage from '@/pages/LearningProgressPage';
import ShopPage from '@/pages/ShopPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ExplorePage from '@/pages/ExplorePage';
import StateCompliancePage from '@/pages/StateCompliancePage';
import PortfolioPage from '@/pages/PortfolioPage';
import AdminPage from '@/pages/AdminPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ReferralPage from '@/pages/ReferralPage';
import ReferralLandingPage from '@/pages/ReferralLandingPage';
import RegistrationPage from '@/pages/RegistrationPage';
import { supabase } from '@/lib/supabase';



const AppLayout: React.FC = () => {
  const { currentPage, setCurrentPage, setShowLoginModal } = useAppContext();
  const { isLoading, isAuthenticated } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showReferralLanding, setShowReferralLanding] = useState(false);

  // Check for ?ref= parameter on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Store in localStorage for signup tracking
      localStorage.setItem('fl_referral_code', ref);
      localStorage.setItem('fl_referral_time', new Date().toISOString());
      // Show referral landing page if user is not authenticated
      if (!isAuthenticated) {
        setShowReferralLanding(true);
      }
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAuthenticated]);

  // Track referral signup when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const storedRef = localStorage.getItem('fl_referral_code');
      const storedTime = localStorage.getItem('fl_referral_time');
      if (storedRef && storedTime) {
        // Only track if the referral was stored within the last 24 hours
        const refTime = new Date(storedTime).getTime();
        const now = Date.now();
        if (now - refTime < 24 * 60 * 60 * 1000) {
          trackReferralSignup(storedRef);
        }
        // Clear the stored referral
        localStorage.removeItem('fl_referral_code');
        localStorage.removeItem('fl_referral_time');
      }
      // Hide referral landing if showing
      setShowReferralLanding(false);
    }
  }, [isAuthenticated]);

  const trackReferralSignup = async (code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.functions.invoke('track-referral', {
          body: {
            action: 'signup-completed',
            referral_code: code,
            new_user_email: session.user.email,
            new_user_id: session.user.id,
          },
        });
      }
    } catch (err) {
      console.warn('Referral signup tracking error:', err);
    }
  };

  const handleReferralContinue = () => {
    setShowReferralLanding(false);
    setCurrentPage('home');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-body text-sm text-charcoal/50">Loading FreeLearner...</p>
        </div>
      </div>
    );
  }

  // Show referral landing page
  if (showReferralLanding && referralCode && !isAuthenticated) {
    return (
      <>
        <LoginModal />
        <ReferralLandingPage referralCode={referralCode} onContinue={handleReferralContinue} />
      </>
    );
  }

  if (currentPage === 'onboarding') {
    return (<><LoginModal /><OnboardingPage /></>);
  }
  if (currentPage === 'student') {
    return (<><LoginModal /><ProtectedRoute pageName="Student Dashboard"><StudentDashboard /></ProtectedRoute></>);
  }
  if (currentPage === 'chat') {
    return (<><LoginModal /><ProtectedRoute pageName="AI Chat"><AIChatPage /></ProtectedRoute></>);
  }
  if (currentPage === 'parent') {
    return (<><LoginModal /><ProtectedRoute pageName="Parent Portal"><ParentPortal /></ProtectedRoute></>);
  }
  if (currentPage === 'school') {
    return (<><LoginModal /><ProtectedRoute pageName="School Portal"><SchoolPortal /></ProtectedRoute></>);
  }
  if (currentPage === 'settings') {
    return (<><LoginModal /><ProtectedRoute pageName="Account Settings"><Navbar /><AccountSettingsPage /><Footer /></ProtectedRoute></>);
  }
  if (currentPage === 'billing') {
    return (<><LoginModal /><ProtectedRoute pageName="Billing"><Navbar /><BillingPage /><Footer /></ProtectedRoute></>);
  }

  if (currentPage === 'progress') {
    return (<><LoginModal /><ProtectedRoute pageName="Learning Progress"><Navbar /><LearningProgressPage /><Footer /></ProtectedRoute></>);
  }
  if (currentPage === 'shop') {
    return (<><LoginModal /><ProtectedRoute pageName="Reward Shop"><Navbar /><ShopPage /><Footer /></ProtectedRoute></>);
  }
  if (currentPage === 'leaderboard') {
    return (<><LoginModal /><ProtectedRoute pageName="Leaderboard"><Navbar /><LeaderboardPage /><Footer /></ProtectedRoute></>);
  }
  if (currentPage === 'explore') {
    return (<><LoginModal /><ProtectedRoute pageName="Explore Topics"><ExplorePage /></ProtectedRoute></>);
  }
  if (currentPage === 'compliance') {
    return (<><LoginModal /><ProtectedRoute pageName="State Compliance"><StateCompliancePage /></ProtectedRoute></>);
  }
  if (currentPage === 'portfolio') {
    return (<><LoginModal /><ProtectedRoute pageName="Portfolio"><PortfolioPage /></ProtectedRoute></>);
  }
  if (currentPage === 'admin') {
    return (<><LoginModal /><ProtectedRoute pageName="Admin Panel"><Navbar /><AdminPage /><Footer /></ProtectedRoute></>);
  }
  if (currentPage === 'referral') {
    return (<><LoginModal /><ProtectedRoute pageName="Referral"><Navbar /><ReferralPage /><Footer /></ProtectedRoute></>);
  }
  if (currentPage === 'registration') {
    return (<><LoginModal /><ProtectedRoute pageName="Registration"><Navbar /><RegistrationPage /><Footer /></ProtectedRoute></>);
  }


  if (currentPage === 'terms') {
    return (<><LoginModal /><Navbar /><TermsPage /><Footer /></>);
  }
  if (currentPage === 'privacy') {
    return (<><LoginModal /><Navbar /><PrivacyPage /><Footer /></>);
  }
  if (currentPage === 'pricing') {
    return (<><LoginModal /><Navbar /><PricingPage /><Footer /></>);
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'safety': return <SafetyPage />;
      case 'home':
      default: return <HomePage />;
    }
  };

  return (<><LoginModal /><Navbar />{renderPage()}<Footer /></>);
};

export default AppLayout;
