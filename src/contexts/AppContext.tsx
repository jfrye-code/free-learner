import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

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
  gradeBand: string;
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
  motivationStyle?: string;
  supportNeeds?: string;
  personalitySummary?: string;
  aptitudeSummary?: string;
}

// Lightweight avatar summary for context (full avatar loaded via useStudentAvatar hook)
interface AvatarSummary {
  onboardingCompleted: boolean;
  avatarVersion: number;
  totalUpdates: number;
  personalitySummary: string | null;
  aptitudeSummary: string | null;
  motivationStyle: string | null;
  lastUpdated: string | null;
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
  studentId: string | null;
  setStudentId: (id: string | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  newsletterEmail: string;
  setNewsletterEmail: (e: string) => void;
  requireAuth: (page: PageType) => boolean;
  saveStudentToDatabase: (profile: StudentProfile) => Promise<string | null>;
  studentDbLoaded: boolean;
  avatarSummary: AvatarSummary | null;
  avatarLoading: boolean;
}

function gradeBandFromGradeLevel(gradeLevel: string): string {
  if (gradeLevel === 'K' || gradeLevel === '1' || gradeLevel === '2') return 'K-2';
  const g = parseInt(gradeLevel);
  if (!isNaN(g)) {
    if (g <= 2) return 'K-2';
    if (g <= 5) return '3-5';
    if (g <= 8) return '6-8';
    return '9-12';
  }
  if (gradeLevel === 'college') return '9-12';
  return '6-8';
}

const defaultStudent: StudentProfile = {
  name: 'Alex',
  age: 12,
  gradeLevel: '7',
  gradeBand: '6-8',
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
  motivationStyle: 'curiosity',
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, profile, isLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(defaultStudent);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentDbLoaded, setStudentDbLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [avatarSummary, setAvatarSummary] = useState<AvatarSummary | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ─── LOAD STUDENT FROM DATABASE ───
  const loadStudentFromDb = useCallback(async (userId: string) => {
    try {
      // Look up student record by user_id
      const { data: students, error: studentErr } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (studentErr) {
        console.error('Error loading student:', studentErr);
        return;
      }

      if (students && students.length > 0) {
        const s = students[0];
        setStudentId(s.student_id);

        // Load interests, strengths, and avatar in parallel
        const [interestsRes, strengthsRes, avatarRes] = await Promise.all([
          supabase.from('student_interests').select('topic, score').eq('student_id', s.student_id).order('score', { ascending: false }).limit(20),
          supabase.from('student_strengths').select('strength_name, confidence_score').eq('student_id', s.student_id).order('confidence_score', { ascending: false }).limit(10),
          supabase.from('student_avatar').select('onboarding_completed, avatar_version, total_updates, last_avatar_update_at').eq('student_id', s.student_id).limit(1),
        ]);

        const interests = interestsRes.data;
        const strengths = strengthsRes.data;
        const avatarData = avatarRes.data;

        // Set avatar summary
        if (avatarData && avatarData.length > 0) {
          const av = avatarData[0];
          setAvatarSummary({
            onboardingCompleted: av.onboarding_completed || false,
            avatarVersion: av.avatar_version || 1,
            totalUpdates: av.total_updates || 0,
            personalitySummary: s.personality_summary || null,
            aptitudeSummary: s.aptitude_summary || null,
            motivationStyle: s.motivation_style || null,
            lastUpdated: av.last_avatar_update_at || null,
          });
        } else {
          setAvatarSummary(null);
        }

        // Merge database data into student profile
        const registrationAnswers = s.registration_answers || {};
        setStudentProfile(prev => ({
          ...prev,
          name: s.name || prev.name,
          gradeBand: s.grade_band || prev.gradeBand,
          gradeLevel: registrationAnswers.gradeLevel || prev.gradeLevel,
          age: registrationAnswers.age || prev.age,
          interests: interests && interests.length > 0
            ? interests.map((i: any) => i.topic)
            : prev.interests,
          strengths: strengths && strengths.length > 0
            ? strengths.map((st: any) => st.strength_name)
            : prev.strengths,
          motivationStyle: s.motivation_style || prev.motivationStyle,
          supportNeeds: s.support_needs || prev.supportNeeds,
          personalitySummary: s.personality_summary || prev.personalitySummary,
          aptitudeSummary: s.aptitude_summary || prev.aptitudeSummary,
          personalityTraits: registrationAnswers.personalityTraits || prev.personalityTraits,
          aptitudeScores: registrationAnswers.aptitudeScores || prev.aptitudeScores,
          learningStyle: registrationAnswers.learningStyle || prev.learningStyle,
          communicationStyle: registrationAnswers.communicationStyle || prev.communicationStyle,
          preferredPace: registrationAnswers.preferredPace || prev.preferredPace,
          socialPreference: registrationAnswers.socialPreference || prev.socialPreference,
          creativeVsAnalytical: registrationAnswers.creativeVsAnalytical || prev.creativeVsAnalytical,
          entrepreneurialInterest: registrationAnswers.entrepreneurialInterest ?? prev.entrepreneurialInterest,
          handsOnPreference: registrationAnswers.handsOnPreference ?? prev.handsOnPreference,
        }));

        setStudentDbLoaded(true);
      }
    } catch (err) {
      console.error('Failed to load student from DB:', err);
    }
  }, []);

  // ─── SAVE STUDENT TO DATABASE ───
  const saveStudentToDatabase = useCallback(async (profile: StudentProfile): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const gradeBand = profile.gradeBand || gradeBandFromGradeLevel(profile.gradeLevel);

      // Build registration_answers JSON with all onboarding data
      const registrationAnswers = {
        age: profile.age,
        gradeLevel: profile.gradeLevel,
        learningStyle: profile.learningStyle,
        personalityTraits: profile.personalityTraits,
        aptitudeScores: profile.aptitudeScores,
        communicationStyle: profile.communicationStyle,
        preferredPace: profile.preferredPace,
        socialPreference: profile.socialPreference,
        creativeVsAnalytical: profile.creativeVsAnalytical,
        entrepreneurialInterest: profile.entrepreneurialInterest,
        handsOnPreference: profile.handsOnPreference,
      };

      // Upsert student record
      const { data: existing } = await supabase
        .from('students')
        .select('student_id')
        .eq('user_id', user.id)
        .limit(1);

      let newStudentId: string;

      if (existing && existing.length > 0) {
        // Update existing
        newStudentId = existing[0].student_id;
        await supabase.from('students').update({
          name: profile.name,
          grade_band: gradeBand,
          registration_answers: registrationAnswers,
          motivation_style: profile.motivationStyle || 'curiosity',
          support_needs: profile.supportNeeds || null,
        }).eq('student_id', newStudentId);
      } else {
        // Insert new
        const { data: inserted, error: insertErr } = await supabase
          .from('students')
          .insert({
            user_id: user.id,
            name: profile.name,
            grade_band: gradeBand,
            registration_answers: registrationAnswers,
            motivation_style: profile.motivationStyle || 'curiosity',
            support_needs: profile.supportNeeds || null,
          })
          .select('student_id')
          .single();

        if (insertErr) throw insertErr;
        newStudentId = inserted.student_id;
      }

      setStudentId(newStudentId);

      // Save interests to student_interests table
      if (profile.interests && profile.interests.length > 0) {
        for (const topic of profile.interests) {
          await supabase.from('student_interests').upsert({
            student_id: newStudentId,
            topic: topic.toLowerCase().trim(),
            score: 7.0,
            last_seen_at: new Date().toISOString(),
          }, { onConflict: 'student_id,topic' });
        }
      }

      // Save strengths to student_strengths table
      if (profile.strengths && profile.strengths.length > 0) {
        for (const strength of profile.strengths) {
          await supabase.from('student_strengths').upsert({
            student_id: newStudentId,
            strength_name: strength.toLowerCase().trim(),
            confidence_score: 6.0,
            evidence_count: 1,
            last_demonstrated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,strength_name' });
        }
      }

      setStudentDbLoaded(true);
      return newStudentId;
    } catch (err) {
      console.error('Failed to save student to DB:', err);
      return null;
    }
  }, [user]);

  // Sync auth state with app state
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && profile) {
      setIsLoggedIn(true);
      setUserRole(profile.role as UserRole);

      // Update student profile name from auth profile
      if (profile.full_name) {
        const firstName = profile.full_name.split(' ')[0] || profile.full_name;
        setStudentProfile(prev => ({
          ...prev,
          name: firstName,
        }));
      }

      // Load student record from database
      if (user?.id) {
        setAvatarLoading(true);
        loadStudentFromDb(user.id).finally(() => setAvatarLoading(false));
      }
    } else {
      setIsLoggedIn(false);
      setUserRole('guest');
      setStudentId(null);
      setStudentDbLoaded(false);
      setAvatarSummary(null);
    }
  }, [isAuthenticated, profile, isLoading, user, loadStudentFromDb]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const protectedPages: PageType[] = ['student', 'chat', 'parent', 'school', 'settings', 'billing', 'progress', 'shop', 'leaderboard', 'compliance', 'portfolio', 'admin', 'referral', 'registration'];

  const requireAuth = (page: PageType): boolean => {
    if (!protectedPages.includes(page)) return false;
    if (isAuthenticated) return false;
    setShowLoginModal(true);
    return true;
  };

  const handleSetCurrentPage = (page: PageType) => {
    if (protectedPages.includes(page) && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (page === 'school' && profile?.role !== 'educator' && isAuthenticated) {
      // Allow all logged-in users to see school portal for now
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
        studentId,
        setStudentId,
        sidebarOpen,
        toggleSidebar,
        showLoginModal,
        setShowLoginModal,
        newsletterEmail,
        setNewsletterEmail,
        requireAuth,
        saveStudentToDatabase,
        studentDbLoaded,
        avatarSummary,
        avatarLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
