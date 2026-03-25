import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'parent' | 'educator' | 'student';
  pageName: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, pageName }) => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const { setShowLoginModal, setCurrentPage } = useAppContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center animate-pulse">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p className="font-body text-sm text-charcoal/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal/10 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 className="font-heading font-bold text-2xl text-charcoal mb-2">
              Sign in to access {pageName}
            </h2>
            <p className="font-body text-sm text-charcoal/50 mb-6">
              You need to be signed in to view this page. Create a free account or sign in to continue.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                Sign In / Create Account
              </button>
              <button
                onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-charcoal/70 font-body font-semibold text-sm rounded-xl transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>

          {/* Feature preview */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: '🎓', label: 'AI Tutoring' },
              { icon: '📊', label: 'Progress Tracking' },
              { icon: '🛡️', label: 'Safe & Secure' },
            ].map((feature, i) => (
              <div key={i} className="bg-white/80 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{feature.icon}</div>
                <p className="font-body text-xs text-charcoal/50">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && profile?.role !== requiredRole) {
    // Show a softer message for wrong role
    const roleLabels: Record<string, string> = {
      parent: 'Parent',
      educator: 'Educator',
      student: 'Student',
    };

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h2 className="font-heading font-bold text-2xl text-charcoal mb-2">
              Access Restricted
            </h2>
            <p className="font-body text-sm text-charcoal/50 mb-6">
              This page is for <strong>{roleLabels[requiredRole] || requiredRole}</strong> accounts.
              You're signed in as a <strong>{roleLabels[profile?.role || ''] || profile?.role}</strong>.
            </p>

            <button
              onClick={() => {
                const homePage = profile?.role === 'student' ? 'student' : profile?.role === 'parent' ? 'parent' : profile?.role === 'educator' ? 'school' : 'home';
                setCurrentPage(homePage as any);
                window.scrollTo({ top: 0 });
              }}
              className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              Go to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
