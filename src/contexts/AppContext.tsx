import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type PageType = 'home' | 'student' | 'chat' | 'parent' | 'safety' | 'onboarding' | 'pricing' | 'school' | 'settings' | 'billing' | 'progress' | 'shop' | 'leaderboard' | 'explore' | 'compliance' | 'portfolio' | 'admin' | 'terms' | 'privacy' | 'referral' | 'registration';









export type UserRole = 'guest' | 'student' | 'parent' | 'educator';

interface StudentGrade {
  subject: string;
  grade_letter: string;
  grade_percentage: number;
  term: string;
}

interface StudentProfile {
  name: string;
  age: number;
  gradeLevel: string;
  interests: string[];
  streak: number;
  level: number;
  badges: string[];
  grades?: StudentGrade[];
  learningStyle?: string;
  personalityTraits?: Record<string, number>;
  aptitudeScores?: Record<string, number>;
  strengths?: string[];
  preferredPace?: string;
  entrepreneurialInterest?: boolean;
  handsOnPreference?: boolean;
  socialPreference?: string;
  creativeVsAnalytical?: string;
  communicationStyle?: string;
}


interface AppContextType {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  studentProfile: StudentProfile;
  setStudentProfile: (p: StudentProfile) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  newsletterEmail: string;
  setNewsletterEmail: (e: string) => void;
  requireAuth: (page: PageType) => boolean;
}

const defaultStudent: StudentProfile = {
  name: 'Alex',
  age: 12,
  gradeLevel: '7',
  interests: ['Guitar', 'Space', 'Minecraft', 'Dinosaurs', 'Cooking'],
  streak: 12,
  level: 7,
  badges: ['Explorer', 'History Buff', 'Science Star', 'Math Ninja', 'Creative Spark', 'Bookworm', 'Nature Guide', 'Code Breaker'],
  grades: [],
  learningStyle: 'visual',
  strengths: [],
  preferredPace: 'moderate',
  socialPreference: 'mixed',
  creativeVsAnalytical: 'balanced',
  communicationStyle: 'text',
};


const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, profile, isLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(defaultStudent);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Sync auth state with app state
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && profile) {
      setIsLoggedIn(true);
      setUserRole(profile.role as UserRole);

      // Update student profile name from auth profile — use FIRST NAME only
      if (profile.full_name) {
        const firstName = profile.full_name.split(' ')[0] || profile.full_name;
        setStudentProfile(prev => ({
          ...prev,
          name: firstName,
        }));
      }

    } else {
      setIsLoggedIn(false);
      setUserRole('guest');
    }
  }, [isAuthenticated, profile, isLoading]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Protected pages that require authentication
  const protectedPages: PageType[] = ['student', 'chat', 'parent', 'school', 'settings', 'billing', 'progress', 'shop', 'leaderboard', 'compliance', 'portfolio', 'admin', 'referral', 'registration'];









  const requireAuth = (page: PageType): boolean => {
    if (!protectedPages.includes(page)) return false;
    if (isAuthenticated) return false;
    // User needs to log in
    setShowLoginModal(true);
    return true;
  };

  // Intercept page navigation for protected routes
  const handleSetCurrentPage = (page: PageType) => {
    if (protectedPages.includes(page) && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Role-based access control
    if (page === 'school' && profile?.role !== 'educator' && isAuthenticated) {
      // Allow all logged-in users to see school portal for now (educators get full access)
    }

    setCurrentPage(page);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage: handleSetCurrentPage,
        userRole,
        setUserRole,
        isLoggedIn,
        setIsLoggedIn,
        studentProfile,
        setStudentProfile,
        sidebarOpen,
        toggleSidebar,
        showLoginModal,
        setShowLoginModal,
        newsletterEmail,
        setNewsletterEmail,
        requireAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
