import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';

interface Registration {
  id: string;
  student_id: string;
  student_name: string;
  date_of_birth: string | null;
  grade_level: string | null;
  previous_school_name: string | null;
  previous_school_address: string | null;
  previous_school_phone: string | null;
  previous_school_email: string | null;
  previous_school_district: string | null;
  registration_status: string;
  registration_date: string | null;
  state_of_residence: string | null;
  county: string | null;
  homeschool_declaration_filed: boolean;
  notes: string | null;
}

interface RecordsRequest {
  id: string;
  registration_id: string | null;
  student_id: string;
  request_type: 'incoming' | 'outgoing';
  school_name: string;
  school_address: string | null;
  school_phone: string | null;
  school_email: string | null;
  school_contact_person: string | null;
  school_district: string | null;
  student_name: string;
  student_dob: string | null;
  records_requested: string[];
  status: string;
  sent_date: string | null;
  received_date: string | null;
  notes: string | null;
  parent_signature_name: string | null;
  parent_signature_date: string | null;
}

type ActiveView = 'overview' | 'register' | 'request-incoming' | 'request-outgoing' | 'history';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

const RECORD_TYPES = [
  { value: 'transcripts', label: 'Academic Transcripts', desc: 'Official grades and course history' },
  { value: 'immunization', label: 'Immunization Records', desc: 'Vaccination and health records' },
  { value: 'iep', label: 'IEP / 504 Plan', desc: 'Special education or accommodation plans' },
  { value: 'attendance', label: 'Attendance Records', desc: 'Historical attendance data' },
  { value: 'standardized_tests', label: 'Standardized Test Scores', desc: 'State and national test results' },
  { value: 'discipline', label: 'Discipline Records', desc: 'Behavioral and disciplinary history' },
  { value: 'health', label: 'Health Records', desc: 'School nurse and health screening records' },
  { value: 'other', label: 'Other Records', desc: 'Any additional records needed' },
];

const RegistrationPage: React.FC = () => {
  const { user, profile, children: childAccounts } = useAuth();
  const { setCurrentPage } = useAppContext();
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [recordsRequests, setRecordsRequests] = useState<RecordsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Registration form
  const [regForm, setRegForm] = useState({
    student_id: '',
    student_name: '',
    date_of_birth: '',
    grade_level: '',
    previous_school_name: '',
    previous_school_address: '',
    previous_school_phone: '',
    previous_school_email: '',
    previous_school_district: '',
    state_of_residence: '',
    county: '',
    homeschool_declaration_filed: false,
    notes: '',
  });

  // Records request form
  const [reqForm, setReqForm] = useState({
    registration_id: '',
    student_id: '',
    student_name: '',
    student_dob: '',
    request_type: 'incoming' as 'incoming' | 'outgoing',
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_contact_person: '',
    school_district: '',
    records_requested: ['transcripts', 'immunization'] as string[],
    notes: '',
    parent_signature_name: '',
  });

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [regRes, reqRes] = await Promise.all([
        supabase.from('student_registrations').select('*').eq('parent_id', user.id).order('created_at', { ascending: false }),
        supabase.from('records_requests').select('*').eq('parent_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (regRes.data) setRegistrations(regRes.data);
      if (reqRes.data) setRecordsRequests(reqRes.data);
    } catch (err) {
      console.warn('Failed to fetch registration data:', err);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const childOptions = childAccounts.length > 0
    ? childAccounts.map(c => ({ id: c.child_user_id || c.id, name: c.child_name }))
    : [{ id: user?.id || '', name: profile?.full_name || 'Student' }];

  const handleRegister = async () => {
    if (!regForm.student_name.trim()) { showMsg('error', 'Student name is required.'); return; }
    if (!regForm.state_of_residence) { showMsg('error', 'State of residence is required.'); return; }
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('student_registrations').insert({
        parent_id: user.id,
        student_id: regForm.student_id || user.id,
        student_name: regForm.student_name.trim(),
        date_of_birth: regForm.date_of_birth || null,
        grade_level: regForm.grade_level || null,
        previous_school_name: regForm.previous_school_name.trim() || null,
        previous_school_address: regForm.previous_school_address.trim() || null,
        previous_school_phone: regForm.previous_school_phone.trim() || null,
        previous_school_email: regForm.previous_school_email.trim() || null,
        previous_school_district: regForm.previous_school_district.trim() || null,
        state_of_residence: regForm.state_of_residence,
        county: regForm.county.trim() || null,
        homeschool_declaration_filed: regForm.homeschool_declaration_filed,
        registration_status: 'submitted',
        registration_date: new Date().toISOString(),
        notes: regForm.notes.trim() || null,
      });

      if (error) throw error;
      showMsg('success', `${regForm.student_name} has been officially registered as a FreeLearner.AI student!`);
      setActiveView('overview');
      await fetchData();
    } catch (err: any) {
      showMsg('error', err.message || 'Registration failed.');
    }
    setSaving(false);
  };

  const handleRecordsRequest = async () => {
    if (!reqForm.student_name.trim()) { showMsg('error', 'Student name is required.'); return; }
    if (!reqForm.school_name.trim()) { showMsg('error', 'School name is required.'); return; }
    if (!reqForm.parent_signature_name.trim()) { showMsg('error', 'Parent/guardian signature is required.'); return; }
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('records_requests').insert({
        parent_id: user.id,
        student_id: reqForm.student_id || user.id,
        registration_id: reqForm.registration_id || null,
        request_type: reqForm.request_type,
        student_name: reqForm.student_name.trim(),
        student_dob: reqForm.student_dob || null,
        school_name: reqForm.school_name.trim(),
        school_address: reqForm.school_address.trim() || null,
        school_phone: reqForm.school_phone.trim() || null,
        school_email: reqForm.school_email.trim() || null,
        school_contact_person: reqForm.school_contact_person.trim() || null,
        school_district: reqForm.school_district.trim() || null,
        records_requested: reqForm.records_requested,
        status: 'pending',
        sent_date: new Date().toISOString(),
        notes: reqForm.notes.trim() || null,
        parent_signature_name: reqForm.parent_signature_name.trim(),
        parent_signature_date: new Date().toISOString(),
      });

      if (error) throw error;
      const typeLabel = reqForm.request_type === 'incoming' ? 'Records request submitted' : 'Transfer request submitted';
      showMsg('success', `${typeLabel} successfully! We'll generate the official request letter for you.`);
      setActiveView('overview');
      await fetchData();
    } catch (err: any) {
      showMsg('error', err.message || 'Request failed.');
    }
    setSaving(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' };
      case 'submitted': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' };
      case 'active': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
      case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
      case 'sent': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sent' };
      case 'received': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Received' };
      case 'completed': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' };
      case 'withdrawn': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Withdrawn' };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
    }
  };

  const generateRequestLetter = (req: RecordsRequest) => {
    const isIncoming = req.request_type === 'incoming';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html><head><title>Records ${isIncoming ? 'Request' : 'Transfer'} Letter</title>
      <style>
        body { font-family: 'Georgia', serif; max-width: 700px; margin: 0 auto; padding: 60px 40px; color: #1a1a1a; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0D7377; padding-bottom: 20px; }
        .header h1 { color: #0D7377; font-size: 20px; margin: 0; }
        .header p { color: #666; font-size: 12px; margin: 4px 0 0; }
        .date { text-align: right; margin-bottom: 30px; color: #666; }
        .to-section { margin-bottom: 30px; }
        .to-section p { margin: 2px 0; }
        .body-text { margin-bottom: 20px; }
        .records-list { margin: 15px 0; padding-left: 20px; }
        .records-list li { margin: 5px 0; }
        .signature { margin-top: 50px; }
        .signature-line { border-top: 1px solid #333; width: 300px; margin-top: 40px; padding-top: 5px; }
        .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h1>FreeLearner.AI</h1>
        <p>Official Student Records ${isIncoming ? 'Request' : 'Transfer'}</p>
      </div>
      <div class="date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div class="to-section">
        <p><strong>To:</strong> ${req.school_contact_person || 'Records Department'}</p>
        <p>${req.school_name}</p>
        ${req.school_address ? `<p>${req.school_address}</p>` : ''}
        ${req.school_district ? `<p>District: ${req.school_district}</p>` : ''}
      </div>
      <div class="body-text">
        <p>Dear ${req.school_contact_person || 'Records Administrator'},</p>
        <p>${isIncoming 
          ? `I am writing to formally request the educational records for my child, <strong>${req.student_name}</strong>${req.student_dob ? ` (Date of Birth: ${new Date(req.student_dob).toLocaleDateString()})` : ''}, who was previously enrolled at ${req.school_name}.`
          : `I am writing to authorize the transfer of educational records for my child, <strong>${req.student_name}</strong>${req.student_dob ? ` (Date of Birth: ${new Date(req.student_dob).toLocaleDateString()})` : ''}, to ${req.school_name}.`
        }</p>
        <p>${isIncoming 
          ? `${req.student_name} is now enrolled with FreeLearner.AI, an accredited online learning platform. Under the Family Educational Rights and Privacy Act (FERPA), I am requesting the following records be forwarded to us:`
          : `${req.student_name} will be enrolling at ${req.school_name}. I hereby authorize FreeLearner.AI to release the following records:`
        }</p>
        <ul class="records-list">
          ${req.records_requested.map(r => {
            const rt = RECORD_TYPES.find(t => t.value === r);
            return `<li>${rt?.label || r}</li>`;
          }).join('')}
        </ul>
        <p>Please send the records to:</p>
        <p><strong>FreeLearner.AI</strong><br/>
        Student Records Department<br/>
        Email: records@freelearner.ai</p>
        ${req.notes ? `<p><strong>Additional Notes:</strong> ${req.notes}</p>` : ''}
        <p>Thank you for your prompt attention to this matter. If you have any questions or require additional information, please do not hesitate to contact me.</p>
      </div>
      <div class="signature">
        <p>Sincerely,</p>
        <div class="signature-line">
          <p><strong>${req.parent_signature_name}</strong></p>
          <p style="font-size: 12px; color: #666;">Parent/Guardian of ${req.student_name}</p>
          <p style="font-size: 12px; color: #666;">Date: ${req.parent_signature_date ? new Date(req.parent_signature_date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div class="footer">
        <p>This letter was generated by FreeLearner.AI &middot; Official Student Records Management</p>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setCurrentPage('parent'); window.scrollTo({ top: 0 }); }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-charcoal/50 hover:text-charcoal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-2xl text-charcoal">Student Registration & Records</h1>
              <p className="font-body text-sm text-charcoal/50 mt-0.5">Officially register students and manage school records transfers</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px overflow-x-auto">
            {([
              { id: 'overview' as const, label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'register' as const, label: 'Register Student', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
              { id: 'request-incoming' as const, label: 'Request Records', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'request-outgoing' as const, label: 'Transfer Records', icon: 'M12 10v6m0 0l3-3m-3 3l-3-3m2-8H7a2 2 0 00-2 2v14a2 2 0 002 2h5.586a1 1 0 00.707-.293l5.414-5.414a1 1 0 00.293-.707V5a2 2 0 00-2-2z' },
              { id: 'history' as const, label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-body text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeView === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon}/></svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-6 ${
            message.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
          }`}>
            {message.type === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            )}
            <span className={`font-body text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</span>
          </div>
        )}

        {/* OVERVIEW */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-teal to-teal-dark rounded-2xl p-6 lg:p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/>
                  </svg>
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">Official FreeLearner.AI Registration</h2>
                  <p className="font-body text-sm text-white/70 mt-1">
                    Register your student officially with FreeLearner.AI as their primary educational institution. 
                    You can also request records from a previous school or transfer records to a new school if your student 
                    decides to enroll in a traditional institution.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveView('register')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-teal/30 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-charcoal mb-1">Register a Student</h3>
                <p className="font-body text-xs text-charcoal/50">Officially enroll your child as a FreeLearner.AI student with all required documentation.</p>
              </button>

              <button
                onClick={() => { setReqForm(prev => ({ ...prev, request_type: 'incoming' })); setActiveView('request-incoming'); }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-charcoal mb-1">Request Records</h3>
                <p className="font-body text-xs text-charcoal/50">Request your child's academic records from a previous school to transfer to FreeLearner.AI.</p>
              </button>

              <button
                onClick={() => { setReqForm(prev => ({ ...prev, request_type: 'outgoing' })); setActiveView('request-outgoing'); }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 10v6m0 0l3-3m-3 3l-3-3m2-8H7a2 2 0 00-2 2v14a2 2 0 002 2h5.586a1 1 0 00.707-.293l5.414-5.414a1 1 0 00.293-.707V5a2 2 0 00-2-2z"/>
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-charcoal mb-1">Transfer Records</h3>
                <p className="font-body text-xs text-charcoal/50">Transfer your child's FreeLearner.AI records to a traditional school for enrollment.</p>
              </button>
            </div>

            {/* Current Registrations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal">Registered Students</h3>
                <p className="font-body text-sm text-charcoal/50 mt-1">{registrations.length} student{registrations.length !== 1 ? 's' : ''} registered</p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <svg className="animate-spin mx-auto mb-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                    <p className="font-body text-sm text-charcoal/40">Loading...</p>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-teal-50 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/>
                      </svg>
                    </div>
                    <p className="font-heading font-bold text-charcoal mb-1">No students registered yet</p>
                    <p className="font-body text-sm text-charcoal/40 mb-4">Register your first student to get started.</p>
                    <button onClick={() => setActiveView('register')} className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl transition-all">
                      Register Student
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {registrations.map(reg => {
                      const badge = getStatusBadge(reg.registration_status);
                      return (
                        <div key={reg.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0">
                            {reg.student_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading font-bold text-sm text-charcoal">{reg.student_name}</h4>
                              <span className={`px-2 py-0.5 ${badge.bg} ${badge.text} rounded-full text-[10px] font-body font-bold`}>{badge.label}</span>
                              {reg.grade_level && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-body font-bold">{reg.grade_level}</span>}
                            </div>
                            <p className="font-body text-xs text-charcoal/40 mt-0.5">
                              {reg.state_of_residence && `${reg.state_of_residence} · `}
                              Registered {reg.registration_date ? new Date(reg.registration_date).toLocaleDateString() : 'N/A'}
                              {reg.previous_school_name && ` · Previously: ${reg.previous_school_name}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Records Requests */}
            {recordsRequests.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="font-heading font-bold text-lg text-charcoal">Records Requests</h3>
                </div>
                <div className="p-6 space-y-3">
                  {recordsRequests.slice(0, 5).map(req => {
                    const badge = getStatusBadge(req.status);
                    return (
                      <div key={req.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          req.request_type === 'incoming' ? 'bg-blue-50' : 'bg-purple-50'
                        }`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={req.request_type === 'incoming' ? '#3B82F6' : '#7C3AED'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-body font-bold text-sm text-charcoal">
                              {req.request_type === 'incoming' ? 'Records from' : 'Transfer to'} {req.school_name}
                            </h4>
                            <span className={`px-2 py-0.5 ${badge.bg} ${badge.text} rounded-full text-[10px] font-body font-bold`}>{badge.label}</span>
                          </div>
                          <p className="font-body text-xs text-charcoal/40 mt-0.5">
                            {req.student_name} · {req.records_requested.length} record type{req.records_requested.length !== 1 ? 's' : ''} · {new Date(req.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => generateRequestLetter(req)}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:border-teal/30 rounded-lg font-body text-xs font-semibold text-charcoal/60 hover:text-teal transition-all flex items-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                          </svg>
                          Print Letter
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REGISTER STUDENT */}
        {activeView === 'register' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-heading font-bold text-lg text-charcoal">Register Student with FreeLearner.AI</h2>
                <p className="font-body text-sm text-charcoal/50 mt-1">Complete this form to officially register your child as a FreeLearner.AI student</p>
              </div>
              <div className="p-6 space-y-5">
                {/* Student Selection */}
                {childOptions.length > 1 && (
                  <div>
                    <label className="block font-body font-semibold text-sm text-charcoal mb-2">Select Student</label>
                    <select
                      value={regForm.student_id}
                      onChange={(e) => {
                        const child = childOptions.find(c => c.id === e.target.value);
                        setRegForm(prev => ({ ...prev, student_id: e.target.value, student_name: child?.name || '' }));
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    >
                      <option value="">Select a child...</option>
                      {childOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body font-semibold text-sm text-charcoal mb-2">Student Full Name *</label>
                    <input type="text" value={regForm.student_name} onChange={(e) => setRegForm(prev => ({ ...prev, student_name: e.target.value }))}
                      placeholder="Legal full name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" />
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-sm text-charcoal mb-2">Date of Birth</label>
                    <input type="date" value={regForm.date_of_birth} onChange={(e) => setRegForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" />
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-sm text-charcoal mb-2">Grade Level</label>
                    <select value={regForm.grade_level} onChange={(e) => setRegForm(prev => ({ ...prev, grade_level: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all">
                      <option value="">Select grade</option>
                      <option value="Pre-K">Pre-K</option>
                      <option value="Kindergarten">Kindergarten</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={`Grade ${g}`}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-sm text-charcoal mb-2">State of Residence *</label>
                    <select value={regForm.state_of_residence} onChange={(e) => setRegForm(prev => ({ ...prev, state_of_residence: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all">
                      <option value="">Select state</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-body font-semibold text-sm text-charcoal mb-2">County</label>
                  <input type="text" value={regForm.county} onChange={(e) => setRegForm(prev => ({ ...prev, county: e.target.value }))}
                    placeholder="County name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" />
                </div>

                {/* Previous School Info */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="font-heading font-bold text-sm text-charcoal mb-1">Previous School (if applicable)</h3>
                  <p className="font-body text-xs text-charcoal/40 mb-4">If your child was previously enrolled in a traditional school, provide their information here.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Name</label>
                      <input type="text" value={regForm.previous_school_name} onChange={(e) => setRegForm(prev => ({ ...prev, previous_school_name: e.target.value }))}
                        placeholder="Previous school name" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School District</label>
                      <input type="text" value={regForm.previous_school_district} onChange={(e) => setRegForm(prev => ({ ...prev, previous_school_district: e.target.value }))}
                        placeholder="School district" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Phone</label>
                      <input type="tel" value={regForm.previous_school_phone} onChange={(e) => setRegForm(prev => ({ ...prev, previous_school_phone: e.target.value }))}
                        placeholder="(555) 123-4567" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Email</label>
                      <input type="email" value={regForm.previous_school_email} onChange={(e) => setRegForm(prev => ({ ...prev, previous_school_email: e.target.value }))}
                        placeholder="records@school.edu" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Address</label>
                    <input type="text" value={regForm.previous_school_address} onChange={(e) => setRegForm(prev => ({ ...prev, previous_school_address: e.target.value }))}
                      placeholder="Full school address" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                  </div>
                </div>

                {/* Homeschool Declaration */}
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <button
                    onClick={() => setRegForm(prev => ({ ...prev, homeschool_declaration_filed: !prev.homeschool_declaration_filed }))}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      regForm.homeschool_declaration_filed ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {regForm.homeschool_declaration_filed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                  <div>
                    <p className="font-body text-sm font-semibold text-amber-800">Homeschool Declaration Filed</p>
                    <p className="font-body text-xs text-amber-600">Check this if you have filed a homeschool declaration with your state (required in some states).</p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-body font-semibold text-sm text-charcoal mb-2">Additional Notes</label>
                  <textarea value={regForm.notes} onChange={(e) => setRegForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information..." rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all resize-none" />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button onClick={() => setActiveView('overview')} className="px-5 py-2.5 font-body font-semibold text-sm text-charcoal/50 hover:text-charcoal hover:bg-gray-200 rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={handleRegister} disabled={saving}
                  className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                  {saving ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REQUEST / TRANSFER RECORDS */}
        {(activeView === 'request-incoming' || activeView === 'request-outgoing') && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-heading font-bold text-lg text-charcoal">
                  {activeView === 'request-incoming' ? 'Request Records from Previous School' : 'Transfer Records to New School'}
                </h2>
                <p className="font-body text-sm text-charcoal/50 mt-1">
                  {activeView === 'request-incoming'
                    ? 'Generate an official FERPA-compliant records request letter to send to your child\'s previous school.'
                    : 'Generate an official records transfer authorization to send your child\'s FreeLearner.AI records to a traditional school.'}
                </p>
              </div>
              <div className="p-6 space-y-5">
                {/* Student Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {childOptions.length > 1 && (
                    <div className="sm:col-span-2">
                      <label className="block font-body font-semibold text-sm text-charcoal mb-2">Select Student</label>
                      <select value={reqForm.student_id}
                        onChange={(e) => {
                          const child = childOptions.find(c => c.id === e.target.value);
                          setReqForm(prev => ({ ...prev, student_id: e.target.value, student_name: child?.name || '' }));
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all">
                        <option value="">Select a child...</option>
                        {childOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block font-body font-semibold text-sm text-charcoal mb-2">Student Full Name *</label>
                    <input type="text" value={reqForm.student_name} onChange={(e) => setReqForm(prev => ({ ...prev, student_name: e.target.value }))}
                      placeholder="Legal full name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-sm text-charcoal mb-2">Student Date of Birth</label>
                    <input type="date" value={reqForm.student_dob} onChange={(e) => setReqForm(prev => ({ ...prev, student_dob: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                  </div>
                </div>

                {/* School Info */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="font-heading font-bold text-sm text-charcoal mb-3">
                    {activeView === 'request-incoming' ? 'Previous School Information' : 'Receiving School Information'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Name *</label>
                      <input type="text" value={reqForm.school_name} onChange={(e) => setReqForm(prev => ({ ...prev, school_name: e.target.value }))}
                        placeholder="School name" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Contact Person</label>
                      <input type="text" value={reqForm.school_contact_person} onChange={(e) => setReqForm(prev => ({ ...prev, school_contact_person: e.target.value }))}
                        placeholder="Registrar or records clerk name" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School District</label>
                      <input type="text" value={reqForm.school_district} onChange={(e) => setReqForm(prev => ({ ...prev, school_district: e.target.value }))}
                        placeholder="District name" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Phone</label>
                      <input type="tel" value={reqForm.school_phone} onChange={(e) => setReqForm(prev => ({ ...prev, school_phone: e.target.value }))}
                        placeholder="(555) 123-4567" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div>
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Email</label>
                      <input type="email" value={reqForm.school_email} onChange={(e) => setReqForm(prev => ({ ...prev, school_email: e.target.value }))}
                        placeholder="records@school.edu" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">School Address</label>
                      <input type="text" value={reqForm.school_address} onChange={(e) => setReqForm(prev => ({ ...prev, school_address: e.target.value }))}
                        placeholder="Full school address" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Records to Request */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="font-heading font-bold text-sm text-charcoal mb-1">Records to {activeView === 'request-incoming' ? 'Request' : 'Transfer'}</h3>
                  <p className="font-body text-xs text-charcoal/40 mb-3">Select which records you need.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {RECORD_TYPES.map(rt => (
                      <button
                        key={rt.value}
                        onClick={() => {
                          setReqForm(prev => ({
                            ...prev,
                            records_requested: prev.records_requested.includes(rt.value)
                              ? prev.records_requested.filter(r => r !== rt.value)
                              : [...prev.records_requested, rt.value]
                          }));
                        }}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          reqForm.records_requested.includes(rt.value)
                            ? 'border-teal bg-teal-50'
                            : 'border-gray-200 bg-white hover:border-teal/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            reqForm.records_requested.includes(rt.value) ? 'bg-teal border-teal' : 'border-gray-300'
                          }`}>
                            {reqForm.records_requested.includes(rt.value) && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                          <div>
                            <p className="font-body text-sm font-semibold text-charcoal">{rt.label}</p>
                            <p className="font-body text-[10px] text-charcoal/40">{rt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-body font-semibold text-sm text-charcoal mb-2">Additional Notes</label>
                  <textarea value={reqForm.notes} onChange={(e) => setReqForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions or notes..." rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all resize-none" />
                </div>

                {/* Parent Signature */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="font-heading font-bold text-sm text-charcoal mb-1">Parent/Guardian Authorization</h3>
                  <p className="font-body text-xs text-charcoal/40 mb-3">By typing your name below, you authorize this records {activeView === 'request-incoming' ? 'request' : 'transfer'} under FERPA regulations.</p>
                  <div>
                    <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Type Your Full Name as Signature *</label>
                    <input type="text" value={reqForm.parent_signature_name} onChange={(e) => setReqForm(prev => ({ ...prev, parent_signature_name: e.target.value }))}
                      placeholder="Your full legal name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-body text-sm italic focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all" />
                    <p className="font-body text-[10px] text-charcoal/30 mt-1">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button onClick={() => setActiveView('overview')} className="px-5 py-2.5 font-body font-semibold text-sm text-charcoal/50 hover:text-charcoal hover:bg-gray-200 rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={handleRecordsRequest} disabled={saving}
                  className={`px-6 py-2.5 text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 ${
                    activeView === 'request-incoming' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                  }`}>
                  {saving && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                  {saving ? 'Submitting...' : activeView === 'request-incoming' ? 'Submit Records Request' : 'Submit Transfer Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeView === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal">All Records Requests</h3>
              </div>
              <div className="p-6">
                {recordsRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="font-body text-sm text-charcoal/40">No records requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recordsRequests.map(req => {
                      const badge = getStatusBadge(req.status);
                      return (
                        <div key={req.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            req.request_type === 'incoming' ? 'bg-blue-50' : 'bg-purple-50'
                          }`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={req.request_type === 'incoming' ? '#3B82F6' : '#7C3AED'} strokeWidth="2" strokeLinecap="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                                req.request_type === 'incoming' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {req.request_type === 'incoming' ? 'Incoming' : 'Outgoing'}
                              </span>
                              <h4 className="font-body font-bold text-sm text-charcoal">{req.school_name}</h4>
                              <span className={`px-2 py-0.5 ${badge.bg} ${badge.text} rounded-full text-[10px] font-body font-bold`}>{badge.label}</span>
                            </div>
                            <p className="font-body text-xs text-charcoal/40 mt-0.5">
                              {req.student_name} · {req.records_requested.length} records · {new Date(req.created_at || '').toLocaleDateString()}
                            </p>
                          </div>
                          <button onClick={() => generateRequestLetter(req)}
                            className="px-3 py-1.5 bg-white border border-gray-200 hover:border-teal/30 rounded-lg font-body text-xs font-semibold text-charcoal/60 hover:text-teal transition-all flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                            </svg>
                            Print
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationPage;
