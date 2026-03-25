import React from 'react';
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

const AppLayout: React.FC = () => {
  const { currentPage } = useAppContext();
  const { isLoading } = useAuth();

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
