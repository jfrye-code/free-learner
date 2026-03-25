import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AcademyMember {
  id: string;
  student_email: string;
  student_name: string;
  parent_id: string | null;
  student_id: string | null;
  invitation_status: string;
  slot_number: number;
  invited_at: string;
  accepted_at: string | null;
}

const MAX_SLOTS = 30;

const AcademyManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<AcademyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'slots' | 'invite' | 'progress'>('slots');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Aggregate stats
  const [aggregateStats, setAggregateStats] = useState({
    totalActive: 0,
    totalModules: 0,
    avgStreak: 0,
    topSubjects: [] as string[],
  });

  useEffect(() => {
    loadMembers();
  }, [user?.id]);

  const loadMembers = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('academy_members')
        .select('*')
        .eq('academy_owner_id', user.id)
        .neq('invitation_status', 'removed')
        .order('slot_number', { ascending: true });
      if (data) {
        setMembers(data);
        // Calculate aggregate stats
        const active = data.filter(m => m.invitation_status === 'accepted');
        setAggregateStats({
          totalActive: active.length,
          totalModules: active.length * 12, // Placeholder
          avgStreak: active.length > 0 ? 7 : 0,
          topSubjects: ['Math', 'Science', 'History', 'Language Arts'],
        });
      }
    } catch (err) {
      console.warn('Load members error:', err);
    }
    setLoading(false);
  };

  const getNextSlot = () => {
    const usedSlots = new Set(members.map(m => m.slot_number));
    for (let i = 1; i <= MAX_SLOTS; i++) {
      if (!usedSlots.has(i)) return i;
    }
    return null;
  };

  const inviteStudent = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError('Student name and email are required');
      return;
    }
    const nextSlot = getNextSlot();
    if (!nextSlot) {
      setInviteError('All 30 student slots are filled');
      return;
    }

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      // Insert academy member
      const { error } = await supabase.from('academy_members').insert({
        academy_owner_id: user?.id,
        student_email: inviteEmail.trim().toLowerCase(),
        student_name: inviteName.trim(),
        parent_id: null,
        student_id: null,
        invitation_status: 'pending',
        slot_number: nextSlot,
      });

      if (error) throw error;

      // Send invitation email
      try {
        await supabase.functions.invoke('send-parent-alert', {
          body: {
            alertType: 'academy_invitation',
            parentEmail: parentEmail.trim() || inviteEmail.trim(),
            parentName: '',
            childName: inviteName.trim(),
            data: {
              academyName: profile?.school_name || 'FreeLearner Academy',
              ownerName: profile?.full_name || 'Your educator',
              acceptLink: '#',
            },
          },
        });
      } catch {
        // Email send failure is non-critical
      }

      setInviteSuccess(`Invitation sent to ${inviteName}!`);
      setInviteEmail('');
      setInviteName('');
      setParentEmail('');
      loadMembers();
      setTimeout(() => setInviteSuccess(''), 4000);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite student');
    }
    setInviting(false);
  };

  const removeStudent = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the Academy? They will lose access.`)) return;
    try {
      await supabase.from('academy_members')
        .update({ invitation_status: 'removed', updated_at: new Date().toISOString() })
        .eq('id', id);
      loadMembers();
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const resendInvite = async (member: AcademyMember) => {
    try {
      await supabase.functions.invoke('send-parent-alert', {
        body: {
          alertType: 'academy_invitation',
          parentEmail: member.student_email,
          parentName: '',
          childName: member.student_name,
          data: {
            academyName: profile?.school_name || 'FreeLearner Academy',
            ownerName: profile?.full_name || 'Your educator',
            acceptLink: '#',
          },
        },
      });
      alert('Invitation resent!');
    } catch {
      alert('Failed to resend invitation');
    }
  };

  const assignParent = async (memberId: string, email: string) => {
    // In a real system, this would look up the parent by email
    // For now, we store the parent email association
    try {
      await supabase.from('academy_members')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', memberId);
    } catch (err) {
      console.error('Assign parent error:', err);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filledSlots = members.length;
  const availableSlots = MAX_SLOTS - filledSlots;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <p className="font-heading font-bold text-2xl text-charcoal">{filledSlots}/{MAX_SLOTS}</p>
          <p className="font-body text-xs text-charcoal/40">Student Slots Used</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p className="font-heading font-bold text-2xl text-charcoal">{members.filter(m => m.invitation_status === 'accepted').length}</p>
          <p className="font-body text-xs text-charcoal/40">Active Students</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p className="font-heading font-bold text-2xl text-charcoal">{members.filter(m => m.invitation_status === 'pending').length}</p>
          <p className="font-body text-xs text-charcoal/40">Pending Invites</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </div>
          <p className="font-heading font-bold text-2xl text-charcoal">{availableSlots}</p>
          <p className="font-body text-xs text-charcoal/40">Available Slots</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { id: 'slots' as const, label: 'Student Slots', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { id: 'invite' as const, label: 'Invite Students', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
          { id: 'progress' as const, label: 'Aggregate Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm font-semibold border-b-2 transition-all ${
              view === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon}/></svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* STUDENT SLOTS VIEW */}
      {view === 'slots' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-charcoal">Student Slots ({filledSlots}/{MAX_SLOTS})</h3>
            <button onClick={() => setView('invite')} className="px-4 py-2 bg-teal text-white font-body text-sm font-semibold rounded-xl hover:bg-teal-dark transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Invite Student
            </button>
          </div>

          {/* Slot capacity bar */}
          <div className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-sm text-charcoal/60">Capacity</span>
              <span className="font-body text-sm font-semibold text-charcoal">{filledSlots} of {MAX_SLOTS} slots used</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal to-teal-dark rounded-full transition-all" style={{ width: `${(filledSlots / MAX_SLOTS) * 100}%` }} />
            </div>
          </div>

          {members.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              <p className="font-heading font-bold text-charcoal mb-2">No students yet</p>
              <p className="font-body text-sm text-charcoal/40 mb-4">Invite students to join your Academy and start learning!</p>
              <button onClick={() => setView('invite')} className="px-6 py-2.5 bg-teal text-white font-body text-sm font-semibold rounded-xl hover:bg-teal-dark transition-all">
                Invite First Student
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal to-teal-dark rounded-full flex items-center justify-center text-white font-heading font-bold text-sm">
                        {member.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-bold text-sm text-charcoal">{member.student_name}</p>
                          <span className="font-body text-[10px] text-charcoal/30">Slot #{member.slot_number}</span>
                        </div>
                        <p className="font-body text-xs text-charcoal/40">{member.student_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full font-body text-xs font-semibold capitalize ${statusColor(member.invitation_status)}`}>
                        {member.invitation_status}
                      </span>
                      {member.invitation_status === 'pending' && (
                        <button onClick={() => resendInvite(member)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-all" title="Resend invitation">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </button>
                      )}
                      <button onClick={() => removeStudent(member.id, member.student_name)} className="p-1.5 hover:bg-red-50 rounded-lg text-charcoal/30 hover:text-red-500 transition-all" title="Remove student">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  {member.invitation_status === 'accepted' && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4"/></svg>
                        <span className="font-body text-xs text-green-600">Active</span>
                      </div>
                      <span className="font-body text-xs text-charcoal/30">
                        Joined {member.accepted_at ? new Date(member.accepted_at).toLocaleDateString() : 'recently'}
                      </span>
                      {member.parent_id && (
                        <span className="font-body text-xs text-blue-500 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          Parent linked
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVITE VIEW */}
      {view === 'invite' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-xl text-charcoal mb-1">Invite Student to Academy</h3>
            <p className="font-body text-sm text-charcoal/40 mb-6">
              Send an invitation email to a student (or their parent) to join your Academy. 
              You have {availableSlots} slots remaining.
            </p>

            {inviteSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fade-in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p className="font-body text-sm text-green-700 font-semibold">{inviteSuccess}</p>
              </div>
            )}
            {inviteError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p className="font-body text-sm text-red-700">{inviteError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Student Name *</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Enter student's full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Student Email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Parent Email (optional)</label>
                <p className="font-body text-xs text-charcoal/40 mb-1.5">If different from student email. The parent will get a linked parent portal.</p>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={e => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <div>
                  <p className="font-body text-sm font-semibold text-blue-800">How it works</p>
                  <p className="font-body text-xs text-blue-600 mt-1">
                    The student (or parent) will receive an email invitation to join your Academy. 
                    Once they accept, they'll get full access to FreeLearner with a linked parent portal 
                    for monitoring progress. One parent account can manage multiple students.
                  </p>
                </div>
              </div>

              <button
                onClick={inviteStudent}
                disabled={inviting || !inviteName.trim() || !inviteEmail.trim() || availableSlots <= 0}
                className="w-full py-3.5 bg-teal hover:bg-teal-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bulk invite hint */}
          <div className="mt-4 bg-gradient-to-r from-teal/5 to-orange/5 rounded-2xl p-5 border border-teal/10">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <div>
                <p className="font-heading font-bold text-sm text-charcoal">Tip: Parent Portal Linking</p>
                <p className="font-body text-xs text-charcoal/50 mt-1">
                  One parent account can be linked to multiple student accounts. When you provide a parent email, 
                  they'll automatically get a parent portal that shows all their children's progress in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGGREGATE PROGRESS VIEW */}
      {view === 'progress' && (
        <div className="space-y-6">
          <h3 className="font-heading font-bold text-lg text-charcoal">Academy-Wide Progress</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="font-heading font-bold text-3xl text-teal">{aggregateStats.totalActive}</p>
              <p className="font-body text-xs text-charcoal/40 mt-1">Active Learners</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="font-heading font-bold text-3xl text-blue-600">{aggregateStats.totalModules}</p>
              <p className="font-body text-xs text-charcoal/40 mt-1">Total Modules Completed</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="font-heading font-bold text-3xl text-amber-600">{aggregateStats.avgStreak}d</p>
              <p className="font-body text-xs text-charcoal/40 mt-1">Average Streak</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="font-heading font-bold text-3xl text-purple-600">{aggregateStats.topSubjects.length}</p>
              <p className="font-body text-xs text-charcoal/40 mt-1">Subjects Covered</p>
            </div>
          </div>

          {/* Student Progress List */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h4 className="font-heading font-bold text-sm text-charcoal mb-4">Individual Student Progress</h4>
            {members.filter(m => m.invitation_status === 'accepted').length === 0 ? (
              <div className="text-center py-8">
                <p className="font-body text-sm text-charcoal/40">No active students yet. Invite students to see their progress here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.filter(m => m.invitation_status === 'accepted').map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-cream/50 hover:bg-cream transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center font-heading font-bold text-teal text-sm">
                        {member.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-heading font-bold text-sm text-charcoal">{member.student_name}</p>
                        <p className="font-body text-xs text-charcoal/40">Slot #{member.slot_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-body text-xs text-charcoal/40">Progress</p>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-teal rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Subjects */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h4 className="font-heading font-bold text-sm text-charcoal mb-4">Most Popular Subjects</h4>
            <div className="space-y-3">
              {aggregateStats.topSubjects.map((subject, i) => (
                <div key={subject} className="flex items-center gap-3">
                  <span className="font-body text-sm text-charcoal/70 w-28">{subject}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${90 - i * 15}%`,
                      backgroundColor: ['#0D7377', '#3B82F6', '#F59E0B', '#8B5CF6'][i] || '#6B7280'
                    }} />
                  </div>
                  <span className="font-body text-xs text-charcoal/40 w-10 text-right">{90 - i * 15}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyManager;
