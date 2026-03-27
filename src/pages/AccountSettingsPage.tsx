import React, { useState, useEffect } from 'react';
import { useAuth, NotificationPreferences, ChildAccount } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import SubscriptionManager from '@/components/SubscriptionManager';
import GuardianManager from '@/components/GuardianManager';

type SettingsTab = 'profile' | 'subscription' | 'children' | 'guardians' | 'notifications' | 'security' | 'danger';


/* ─── Guardians Tab Sub-Component ─── */
const GuardiansTabContent: React.FC<{ children: ChildAccount[] }> = ({ children: childAccounts }) => {
  const [selectedChildId, setSelectedChildId] = useState<string>(childAccounts[0]?.id || '');

  // Keep selection in sync if children list changes
  useEffect(() => {
    if (childAccounts.length > 0 && !childAccounts.find(c => c.id === selectedChildId)) {
      setSelectedChildId(childAccounts[0].id);
    }
  }, [childAccounts, selectedChildId]);

  const selectedChild = childAccounts.find(c => c.id === selectedChildId);

  if (childAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-heading font-bold text-lg text-charcoal">Guardians & Educators</h2>
            <p className="font-body text-sm text-charcoal/50 mt-1">Manage who has access to your children's learning data</p>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-charcoal mb-1">Add a child first</h3>
              <p className="font-body text-sm text-charcoal/40 max-w-sm mx-auto">
                You need to add at least one child account before you can manage guardians and educators. 
                Go to the <span className="font-semibold text-teal">Children</span> tab to add your first child.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Child Selector - shown when multiple children exist */}
      {childAccounts.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <span className="font-body font-semibold text-sm text-charcoal">Managing guardians for:</span>
            </div>
            <div className="relative flex-1 max-w-xs">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-10 bg-indigo-50 border border-indigo-200 rounded-xl font-body text-sm font-semibold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
              >
                {childAccounts.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.child_name}{child.age ? ` (Age ${child.age})` : ''}{child.grade_level ? ` - ${child.grade_level}` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick child navigation pills */}
          <div className="px-6 pb-4 flex gap-2 flex-wrap">
            {childAccounts.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all ${
                  selectedChildId === child.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-charcoal/50 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  selectedChildId === child.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-charcoal/40'
                }`}>
                  {child.child_name.charAt(0).toUpperCase()}
                </div>
                {child.child_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single child header when only one child */}
      {childAccounts.length === 1 && selectedChild && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-heading font-bold text-sm shadow-sm flex-shrink-0">
              {selectedChild.child_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="font-body font-bold text-sm text-charcoal">
                Managing guardians for {selectedChild.child_name}
              </p>
              <p className="font-body text-xs text-charcoal/40">
                {selectedChild.age ? `Age ${selectedChild.age}` : ''}{selectedChild.grade_level ? ` · ${selectedChild.grade_level}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Manager for selected child */}
      {selectedChild && (
        <GuardianManager
          key={selectedChild.id}
          studentId={selectedChild.id}
          studentName={selectedChild.child_name}
        />
      )}
    </div>
  );
};



const AccountSettingsPage: React.FC = () => {
  const { profile, children, updateProfile, createChildAccount, updateChildAccount, deleteChildAccount, changePassword, deleteAccount, signOut } = useAuth();
  const { setCurrentPage } = useAppContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_updates: true,
    learning_reports: true,
    safety_alerts: true,
    product_news: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Child account form state
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [childForm, setChildForm] = useState({
    child_name: '',
    age: '',
    grade_level: '',
    interests: '',
  });
  const [childSaving, setChildSaving] = useState(false);
  const [childError, setChildError] = useState('');
  const [childSuccess, setChildSuccess] = useState('');
  const [showDeleteChildConfirm, setShowDeleteChildConfirm] = useState<string | null>(null);

  // Initialize form from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setSchoolName(profile.school_name || '');
      if (profile.notification_preferences) {
        setNotifications(profile.notification_preferences);
      }
    }
  }, [profile]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);

    const updates: any = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    };

    if (profile?.role === 'educator') {
      updates.school_name = schoolName.trim() || null;
    }

    const { error } = await updateProfile(updates);
    setProfileSaving(false);

    if (error) {
      setProfileError(error);
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleNotificationSave = async () => {
    setNotifSaving(true);
    setNotifSuccess(false);

    const { error } = await updateProfile({ notification_preferences: notifications } as any);
    setNotifSaving(false);

    if (!error) {
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    const { error } = await changePassword(newPassword);
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    setDeleteError('');

    const { error } = await deleteAccount();

    if (error) {
      setDeleteError(error);
      setDeleting(false);
    } else {
      // Account deleted, redirect to home
      await signOut();
      setCurrentPage('home');
      window.scrollTo({ top: 0 });
    }
  };

  const resetChildForm = () => {
    setChildForm({ child_name: '', age: '', grade_level: '', interests: '' });
    setEditingChild(null);
    setShowAddChild(false);
    setChildError('');
    setChildSuccess('');
  };

  const handleAddChild = async () => {
    setChildError('');
    setChildSuccess('');

    if (!childForm.child_name.trim()) {
      setChildError('Please enter the child\'s name.');
      return;
    }
    if (!childForm.age || parseInt(childForm.age) < 3 || parseInt(childForm.age) > 18) {
      setChildError('Please enter a valid age (3-18).');
      return;
    }

    setChildSaving(true);

    const interests = childForm.interests
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);

    const { error } = await createChildAccount(
      childForm.child_name.trim(),
      parseInt(childForm.age),
      childForm.grade_level.trim(),
      interests
    );

    setChildSaving(false);

    if (error) {
      setChildError(error);
    } else {
      setChildSuccess('Child account added successfully!');
      resetChildForm();
      setTimeout(() => setChildSuccess(''), 3000);
    }
  };

  const handleEditChild = (child: ChildAccount) => {
    setEditingChild(child.id);
    setChildForm({
      child_name: child.child_name,
      age: child.age?.toString() || '',
      grade_level: child.grade_level || '',
      interests: child.interests?.join(', ') || '',
    });
    setShowAddChild(true);
    setChildError('');
    setChildSuccess('');
  };

  const handleUpdateChild = async () => {
    if (!editingChild) return;
    setChildError('');
    setChildSuccess('');

    if (!childForm.child_name.trim()) {
      setChildError('Please enter the child\'s name.');
      return;
    }

    setChildSaving(true);

    const interests = childForm.interests
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);

    const { error } = await updateChildAccount(editingChild, {
      child_name: childForm.child_name.trim(),
      age: childForm.age ? parseInt(childForm.age) : null,
      grade_level: childForm.grade_level.trim() || null,
      interests,
    });

    setChildSaving(false);

    if (error) {
      setChildError(error);
    } else {
      setChildSuccess('Child account updated successfully!');
      resetChildForm();
      setTimeout(() => setChildSuccess(''), 3000);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    setChildSaving(true);
    const { error } = await deleteChildAccount(childId);
    setChildSaving(false);
    setShowDeleteChildConfirm(null);

    if (error) {
      setChildError(error);
    } else {
      setChildSuccess('Child account removed.');
      setTimeout(() => setChildSuccess(''), 3000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; show: boolean }[] = [
    {
      id: 'profile',
      label: 'Profile',
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'subscription',
      label: 'Subscription',
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      id: 'children',
      label: 'Children',
      show: profile?.role === 'parent',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'guardians',
      label: 'Guardians',
      show: profile?.role === 'parent',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {


      id: 'notifications',
      label: 'Notifications',
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      id: 'danger',
      label: 'Account',
      show: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ];

  const filteredTabs = tabs.filter(t => t.show);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const dest = profile?.role === 'parent' ? 'parent' : profile?.role === 'educator' ? 'school' : 'student';
                setCurrentPage(dest as any);
                window.scrollTo({ top: 0 });
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-charcoal/50 hover:text-charcoal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-2xl text-charcoal">Account Settings</h1>
              <p className="font-body text-sm text-charcoal/50 mt-0.5">Manage your profile, preferences, and security</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-white font-heading font-bold text-lg shadow-md">
                {getInitials(profile?.full_name || profile?.email || 'U')}
              </div>
              <div>
                <p className="font-body font-bold text-sm text-charcoal">{profile?.full_name || 'User'}</p>
                <p className="font-body text-xs text-charcoal/40">{profile?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {filteredTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-teal text-white shadow-md'
                      : tab.id === 'danger'
                      ? 'text-charcoal/50 hover:text-red-500 hover:bg-red-50'
                      : 'text-charcoal/50 hover:text-charcoal hover:bg-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-heading font-bold text-lg text-charcoal">Personal Information</h2>
                    <p className="font-body text-sm text-charcoal/50 mt-1">Update your personal details and contact information</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Avatar section */}
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-white font-heading font-bold text-2xl shadow-lg">
                        {getInitials(fullName || profile?.email || 'U')}
                      </div>
                      <div>
                        <p className="font-body font-bold text-sm text-charcoal">Profile Photo</p>
                        <p className="font-body text-xs text-charcoal/40 mt-0.5">Your initials are displayed as your avatar</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-body font-bold ${
                            profile?.role === 'parent' ? 'bg-blue-100 text-blue-700' :
                            profile?.role === 'educator' ? 'bg-orange/10 text-orange' :
                            'bg-teal-50 text-teal'
                          }`}>
                            {profile?.role === 'parent' ? 'Parent Account' : profile?.role === 'educator' ? 'Educator Account' : 'Student Account'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Full Name */}
                    <div>
                      <label className="block font-body font-semibold text-sm text-charcoal mb-2">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="block font-body font-semibold text-sm text-charcoal mb-2">Email Address</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-body text-sm text-charcoal/50 cursor-not-allowed"
                        />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="font-body text-xs font-bold text-green-600">Verified</span>
                        </div>
                      </div>
                      <p className="font-body text-xs text-charcoal/30 mt-1.5">Email cannot be changed. Contact support if you need to update it.</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block font-body font-semibold text-sm text-charcoal mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                      />
                      <p className="font-body text-xs text-charcoal/30 mt-1.5">Optional. Used for account recovery and important alerts.</p>
                    </div>

                    {/* School Name (Educator only) */}
                    {profile?.role === 'educator' && (
                      <div>
                        <label className="block font-body font-semibold text-sm text-charcoal mb-2">School / Organization Name</label>
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="Enter your school or organization name"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                        />
                      </div>
                    )}

                    {/* Member since */}
                    <div className="flex items-center gap-2 pt-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-charcoal/30">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="font-body text-xs text-charcoal/30">
                        Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>

                    {/* Error / Success */}
                    {profileError && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span className="font-body text-sm text-red-600">{profileError}</span>
                      </div>
                    )}

                    {profileSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="font-body text-sm text-green-600">Profile updated successfully!</span>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setFullName(profile?.full_name || '');
                        setPhone(profile?.phone || '');
                        setSchoolName(profile?.school_name || '');
                      }}
                      className="px-5 py-2.5 font-body font-semibold text-sm text-charcoal/50 hover:text-charcoal hover:bg-gray-200 rounded-xl transition-all"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {profileSaving && (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                      )}
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <SubscriptionManager />
            )}

            {/* Children Tab (Parent only) */}
            {activeTab === 'children' && profile?.role === 'parent' && (

              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-heading font-bold text-lg text-charcoal">Linked Children</h2>
                      <p className="font-body text-sm text-charcoal/50 mt-1">Manage your children's learning accounts</p>
                    </div>
                    {!showAddChild && (
                      <button
                        onClick={() => { resetChildForm(); setShowAddChild(true); }}
                        className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Child
                      </button>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Success / Error messages */}
                    {childSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl mb-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="font-body text-sm text-green-600">{childSuccess}</span>
                      </div>
                    )}
                    {childError && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl mb-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span className="font-body text-sm text-red-600">{childError}</span>
                      </div>
                    )}

                    {/* Add / Edit Child Form */}
                    {showAddChild && (
                      <div className="bg-teal-50/50 border border-teal/10 rounded-xl p-5 mb-6">
                        <h3 className="font-heading font-bold text-sm text-charcoal mb-4">
                          {editingChild ? 'Edit Child Account' : 'Add New Child'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Child's Name *</label>
                            <input
                              type="text"
                              value={childForm.child_name}
                              onChange={(e) => setChildForm(prev => ({ ...prev, child_name: e.target.value }))}
                              placeholder="e.g., Alex"
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                            />
                          </div>
                          <div>
                            <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Age *</label>
                            <input
                              type="number"
                              value={childForm.age}
                              onChange={(e) => setChildForm(prev => ({ ...prev, age: e.target.value }))}
                              placeholder="e.g., 10"
                              min="3"
                              max="18"
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                            />
                          </div>
                          <div>
                            <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Grade Level</label>
                            <select
                              value={childForm.grade_level}
                              onChange={(e) => setChildForm(prev => ({ ...prev, grade_level: e.target.value }))}
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                            >
                              <option value="">Select grade</option>
                              <option value="Pre-K">Pre-K</option>
                              <option value="Kindergarten">Kindergarten</option>
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                                <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Interests</label>
                            <input
                              type="text"
                              value={childForm.interests}
                              onChange={(e) => setChildForm(prev => ({ ...prev, interests: e.target.value }))}
                              placeholder="e.g., Space, Dinosaurs, Art"
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                            />
                            <p className="font-body text-xs text-charcoal/30 mt-1">Separate with commas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={editingChild ? handleUpdateChild : handleAddChild}
                            disabled={childSaving}
                            className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {childSaving && (
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                              </svg>
                            )}
                            {editingChild ? 'Update Child' : 'Add Child'}
                          </button>
                          <button
                            onClick={resetChildForm}
                            className="px-5 py-2.5 font-body font-semibold text-sm text-charcoal/50 hover:text-charcoal hover:bg-gray-100 rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Children list */}
                    {children.length === 0 && !showAddChild ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" /><line x1="20" y1="8" x2="20" y2="14" />
                          </svg>
                        </div>
                        <h3 className="font-heading font-bold text-charcoal mb-1">No children linked yet</h3>
                        <p className="font-body text-sm text-charcoal/40 mb-4">Add your child's profile to personalize their learning experience</p>
                        <button
                          onClick={() => { resetChildForm(); setShowAddChild(true); }}
                          className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-sm transition-all"
                        >
                          Add Your First Child
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {children.map((child) => (
                          <div key={child.id} className="relative bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-teal/20 transition-all group">
                            {/* Delete confirmation overlay */}
                            {showDeleteChildConfirm === child.id && (
                              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 p-4">
                                <div className="text-center">
                                  <p className="font-body font-bold text-sm text-charcoal mb-1">Remove {child.child_name}?</p>
                                  <p className="font-body text-xs text-charcoal/50 mb-3">This will remove their profile and learning data.</p>
                                  <div className="flex items-center gap-2 justify-center">
                                    <button
                                      onClick={() => handleDeleteChild(child.id)}
                                      disabled={childSaving}
                                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-body font-bold text-xs rounded-lg transition-all"
                                    >
                                      Remove
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteChildConfirm(null)}
                                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-charcoal/60 font-body font-semibold text-xs rounded-lg transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-heading font-bold text-sm shadow-sm flex-shrink-0">
                                {getInitials(child.child_name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-heading font-bold text-sm text-charcoal">{child.child_name}</h4>
                                  {child.age && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-body font-bold">
                                      Age {child.age}
                                    </span>
                                  )}
                                  {child.grade_level && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-body font-bold">
                                      {child.grade_level}
                                    </span>
                                  )}
                                </div>
                                {child.interests && child.interests.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {child.interests.map((interest, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal rounded text-xs font-body">
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditChild(child)}
                                  className="p-2 rounded-lg hover:bg-white text-charcoal/40 hover:text-teal transition-all"
                                  title="Edit"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setShowDeleteChildConfirm(child.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 text-charcoal/40 hover:text-red-500 transition-all"
                                  title="Remove"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Guardians Tab (Parent only) */}
            {activeTab === 'guardians' && profile?.role === 'parent' && (
              <GuardiansTabContent children={children} />
            )}


            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-heading font-bold text-lg text-charcoal">Notification Preferences</h2>
                    <p className="font-body text-sm text-charcoal/50 mt-1">Choose what updates you'd like to receive</p>
                  </div>

                  <div className="p-6 space-y-1">
                    {[
                      {
                        key: 'email_updates' as const,
                        title: 'Email Updates',
                        desc: 'Receive important account updates and announcements via email',
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                          </svg>
                        ),
                      },
                      {
                        key: 'learning_reports' as const,
                        title: 'Learning Reports',
                        desc: 'Weekly summaries of learning progress and achievements',
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                          </svg>
                        ),
                      },
                      {
                        key: 'safety_alerts' as const,
                        title: 'Safety Alerts',
                        desc: 'Notifications about safety-related events and flagged content',
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        ),
                      },
                      {
                        key: 'product_news' as const,
                        title: 'Product News',
                        desc: 'New features, tips, and educational content from FreeLearner',

                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        ),
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-bold text-sm text-charcoal">{item.title}</p>
                          <p className="font-body text-xs text-charcoal/40 mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                            notifications[item.key] ? 'bg-teal' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                            notifications[item.key] ? 'left-[22px]' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    ))}

                    {notifSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl mt-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="font-body text-sm text-green-600">Notification preferences saved!</span>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                    <button
                      onClick={handleNotificationSave}
                      disabled={notifSaving}
                      className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {notifSaving && (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                      )}
                      {notifSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-heading font-bold text-lg text-charcoal">Change Password</h2>
                    <p className="font-body text-sm text-charcoal/50 mt-1">Update your password to keep your account secure</p>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block font-body font-semibold text-sm text-charcoal mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                      />
                      {/* Password strength indicator */}
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => {
                              const strength =
                                newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 4 :
                                newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 3 :
                                newPassword.length >= 6 ? 2 : 1;
                              return (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded-full transition-all ${
                                    level <= strength
                                      ? strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-yellow-400' : strength === 3 ? 'bg-blue-400' : 'bg-green-400'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <p className="font-body text-xs text-charcoal/30 mt-1">
                            {newPassword.length < 6 ? 'Too short' :
                             newPassword.length < 8 ? 'Fair' :
                             newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 'Very strong' :
                             newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'Strong' : 'Good'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-body font-semibold text-sm text-charcoal mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                            : confirmPassword && confirmPassword === newPassword
                            ? 'border-green-300 focus:border-green-400 focus:ring-green-200'
                            : 'border-gray-200 focus:border-teal'
                        }`}
                      />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="font-body text-xs text-red-500 mt-1">Passwords don't match</p>
                      )}
                      {confirmPassword && confirmPassword === newPassword && (
                        <p className="font-body text-xs text-green-500 mt-1">Passwords match</p>
                      )}
                    </div>

                    {passwordError && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span className="font-body text-sm text-red-600">{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="font-body text-sm text-green-600">Password changed successfully!</span>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordSaving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {passwordSaving && (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                      )}
                      {passwordSaving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Active Sessions info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-heading font-bold text-lg text-charcoal">Session Information</h2>
                    <p className="font-body text-sm text-charcoal/50 mt-1">Your current login session details</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-body font-bold text-sm text-green-700">Current Session</p>
                        <p className="font-body text-xs text-green-600/70 mt-0.5">
                          Signed in as {profile?.email} &middot; Active now
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="font-body text-xs font-bold text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                {/* Sign out all devices */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-heading font-bold text-lg text-charcoal">Sign Out</h2>
                    <p className="font-body text-sm text-charcoal/50 mt-1">Sign out of your account on this device</p>
                  </div>
                  <div className="p-6">
                    <button
                      onClick={async () => {
                        await signOut();
                        setCurrentPage('home');
                        window.scrollTo({ top: 0 });
                      }}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-charcoal font-body font-bold text-sm rounded-xl transition-all flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-lg text-red-700">Delete Account</h2>
                        <p className="font-body text-sm text-red-500/70 mt-0.5">Permanently delete your account and all associated data</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="bg-red-50 rounded-xl p-4 mb-5 border border-red-100">
                      <p className="font-body text-sm text-red-700 font-semibold mb-2">This action is irreversible. Deleting your account will:</p>
                      <ul className="space-y-1.5">
                        {[
                          'Permanently remove your profile and personal data',
                          'Delete all linked child accounts and their learning data',
                          'Remove all chat history and AI conversation logs',
                          'Cancel any active subscriptions',
                          'Remove all uploaded documents and records',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 flex-shrink-0">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span className="font-body text-xs text-red-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-body font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete My Account
                      </button>
                    ) : (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                        <p className="font-body font-bold text-sm text-red-700 mb-3">
                          To confirm, type <span className="font-mono bg-red-100 px-2 py-0.5 rounded">DELETE</span> below:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl font-body text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all mb-4"
                          autoComplete="off"
                        />

                        {deleteError && (
                          <div className="flex items-center gap-2 px-4 py-3 bg-red-100 border border-red-200 rounded-xl mb-4">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span className="font-body text-sm text-red-600">{deleteError}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== 'DELETE' || deleting}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-body font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {deleting && (
                              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                              </svg>
                            )}
                            {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                          </button>
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(''); }}
                            className="px-5 py-2.5 font-body font-semibold text-sm text-charcoal/50 hover:text-charcoal hover:bg-gray-100 rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
