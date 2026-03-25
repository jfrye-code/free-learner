import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AcademyManager from '@/components/AcademyManager';


interface StudentRecord {
  id: string;
  school_name: string;
  student_first_name: string;
  student_last_name: string;
  date_of_birth: string;
  grade_level: string;
  enrollment_status: string;
  primary_language: string;
  country: string;
  special_needs: string;
  notes: string;
  created_at: string;
}

interface StudentGradeRecord {
  id: string;
  student_record_id: string;
  subject: string;
  grade_letter: string;
  grade_percentage: number;
  term: string;
  school_year: string;
  teacher_name: string;
  comments: string;
}

interface UploadRecord {
  id: string;
  school_name: string;
  file_name: string;
  upload_type: string;
  records_count: number;
  status: string;
  uploaded_by: string;
  created_at: string;
}

type TabType = 'overview' | 'students' | 'upload' | 'records' | 'add-student' | 'academy';


const UPLOAD_TYPES = [
  { value: 'transcript', label: 'Transcript', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { value: 'report_card', label: 'Report Card', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { value: 'iep', label: 'IEP / Special Ed', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { value: 'assessment', label: 'Assessment', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { value: 'enrollment_form', label: 'Enrollment Form', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { value: 'other', label: 'Other Document', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
];

const GRADE_LEVELS = ['Pre-K', 'Kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const SUBJECTS = ['Mathematics', 'English Language Arts', 'Science', 'Social Studies', 'History', 'Geography', 'Physical Education', 'Art', 'Music', 'Technology', 'Foreign Language', 'Health'];

const SchoolPortal: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [grades, setGrades] = useState<StudentGradeRecord[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const schoolName = profile?.school_name || 'My School';

  // Upload state
  const [uploadType, setUploadType] = useState('transcript');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add student form state
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    grade_level: '6th',
    language: 'English',
    country: 'United States',
    special_needs: '',
    notes: '',
  });
  const [addingStudent, setAddingStudent] = useState(false);
  const [studentAdded, setStudentAdded] = useState(false);

  // Add grades state
  const [selectedStudentForGrades, setSelectedStudentForGrades] = useState<string>('');
  const [newGrade, setNewGrade] = useState({
    subject: 'Mathematics',
    grade_letter: 'B',
    grade_percentage: 85,
    term: 'Fall 2025',
    school_year: '2025-2026',
    teacher_name: '',
    comments: '',
  });
  const [addingGrade, setAddingGrade] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, gradesRes, uploadsRes] = await Promise.all([
        supabase.from('student_records').select('*').order('created_at', { ascending: false }),
        supabase.from('student_grades').select('*').order('created_at', { ascending: false }),
        supabase.from('school_uploads').select('*').order('created_at', { ascending: false }),
      ]);
      if (studentsRes.data) setStudents(studentsRes.data);
      if (gradesRes.data) setGrades(gradesRes.data);
      if (uploadsRes.data) setUploads(uploadsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadSuccess(false);

    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { error: storageError } = await supabase.storage
        .from('school-uploads')
        .upload(fileName, selectedFile);

      if (storageError) {
        console.warn('Storage upload warning:', storageError);
      }

      const { error: dbError } = await supabase.from('school_uploads').insert({
        school_name: schoolName,
        file_name: selectedFile.name,
        upload_type: uploadType,
        records_count: 0,
        status: 'processing',
        uploaded_by: 'School Admin',
      });

      if (dbError) throw dbError;

      setUploadSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();

      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  // Handle add student
  const handleAddStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name) return;
    setAddingStudent(true);
    setStudentAdded(false);

    try {
      const { error } = await supabase.from('student_records').insert({
        school_name: schoolName,
        student_first_name: newStudent.first_name,
        student_last_name: newStudent.last_name,
        date_of_birth: newStudent.dob || null,
        grade_level: newStudent.grade_level,
        enrollment_status: 'pending',
        primary_language: newStudent.language,
        country: newStudent.country,
        special_needs: newStudent.special_needs || null,
        notes: newStudent.notes || null,
      });

      if (error) throw error;

      setStudentAdded(true);
      setNewStudent({ first_name: '', last_name: '', dob: '', grade_level: '6th', language: 'English', country: 'United States', special_needs: '', notes: '' });
      fetchData();
      setTimeout(() => setStudentAdded(false), 4000);
    } catch (err) {
      console.error('Add student error:', err);
    }
    setAddingStudent(false);
  };

  // Handle add grade
  const handleAddGrade = async () => {
    if (!selectedStudentForGrades) return;
    setAddingGrade(true);

    try {
      const { error } = await supabase.from('student_grades').insert({
        student_record_id: selectedStudentForGrades,
        subject: newGrade.subject,
        grade_letter: newGrade.grade_letter,
        grade_percentage: newGrade.grade_percentage,
        term: newGrade.term,
        school_year: newGrade.school_year,
        teacher_name: newGrade.teacher_name || null,
        comments: newGrade.comments || null,
      });

      if (error) throw error;
      fetchData();
      setNewGrade({ ...newGrade, comments: '', teacher_name: '' });
    } catch (err) {
      console.error('Add grade error:', err);
    }
    setAddingGrade(false);
  };

  // Handle enrollment status change
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await supabase.from('student_records').update({ enrollment_status: status, updated_at: new Date().toISOString() }).eq('id', id);
      fetchData();
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      case 'graduated': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const gradeColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 80) return 'text-blue-600';
    if (pct >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'academy', label: 'Academy', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'add-student', label: 'Enroll Student', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { id: 'upload', label: 'Upload Records', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { id: 'records', label: 'Upload History', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];


  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal to-teal-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div>
                <h1 className="font-heading font-bold text-xl text-white">School Portal</h1>
                <p className="font-body text-xs text-white/60">{schoolName} · Student Records Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="font-body text-xs text-white/80">FERPA Compliant</span>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-body text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-white border-white'
                    : 'text-white/50 border-transparent hover:text-white/80 hover:border-white/30'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon}/></svg>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p className="font-body text-sm text-charcoal/40">Loading school data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Students', value: students.length, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'bg-teal-50 text-teal' },
                    { label: 'Active Enrollments', value: students.filter(s => s.enrollment_status === 'active').length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-green-50 text-green-600' },
                    { label: 'Pending Review', value: students.filter(s => s.enrollment_status === 'pending').length, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-amber-50 text-amber-600' },
                    { label: 'Documents Uploaded', value: uploads.length, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', color: 'bg-blue-50 text-blue-600' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon}/></svg>
                      </div>
                      <p className="font-heading font-bold text-2xl text-charcoal">{stat.value}</p>
                      <p className="font-body text-xs text-charcoal/40">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Quick Actions</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button onClick={() => setActiveTab('add-student')} className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-teal/30 hover:border-teal hover:bg-teal-50/50 transition-all text-left">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                      </div>
                      <div>
                        <p className="font-heading font-bold text-sm text-charcoal">Enroll New Student</p>
                        <p className="font-body text-xs text-charcoal/40">Add a student to FreeLearner</p>
                      </div>
                    </button>
                    <button onClick={() => setActiveTab('upload')} className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-orange/30 hover:border-orange hover:bg-orange/5 transition-all text-left">
                      <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      </div>
                      <div>
                        <p className="font-heading font-bold text-sm text-charcoal">Upload Records</p>
                        <p className="font-body text-xs text-charcoal/40">Transcripts, report cards, IEPs</p>
                      </div>
                    </button>
                    <button onClick={() => setActiveTab('students')} className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-left">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                      </div>
                      <div>
                        <p className="font-heading font-bold text-sm text-charcoal">View All Students</p>
                        <p className="font-body text-xs text-charcoal/40">Manage grades & enrollment</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Students */}
                {students.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Recent Enrollments</h3>
                    <div className="space-y-3">
                      {students.slice(0, 5).map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-cream/50 hover:bg-cream transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center font-heading font-bold text-teal text-sm">
                              {s.student_first_name[0]}{s.student_last_name[0]}
                            </div>
                            <div>
                              <p className="font-heading font-bold text-sm text-charcoal">{s.student_first_name} {s.student_last_name}</p>
                              <p className="font-body text-xs text-charcoal/40">Grade {s.grade_level} · {s.primary_language}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full font-body text-xs font-semibold capitalize ${statusColor(s.enrollment_status)}`}>
                            {s.enrollment_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* How It Works */}
                <div className="bg-gradient-to-br from-teal/5 to-orange/5 rounded-2xl p-6 border border-teal/10">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-2">How School Integration Works</h3>
                  <p className="font-body text-sm text-charcoal/60 mb-6">Upload student records so FreeLearner can personalize the experience to each student's specific needs.</p>
                  <div className="grid sm:grid-cols-4 gap-4">
                    {[
                      { step: '1', title: 'Enroll Students', desc: 'Add student profiles with basic information' },
                      { step: '2', title: 'Upload Records', desc: 'Upload transcripts, report cards, and assessments' },
                      { step: '3', title: 'AI Analyzes', desc: 'Our AI reviews records to identify strengths & gaps' },
                      { step: '4', title: 'Personalized Adventures', desc: 'Students get tailored content based on their needs' },
                    ].map((item) => (
                      <div key={item.step} className="text-center">
                        <div className="w-10 h-10 bg-teal rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="font-heading font-bold text-white text-sm">{item.step}</span>
                        </div>
                        <p className="font-heading font-bold text-sm text-charcoal mb-1">{item.title}</p>
                        <p className="font-body text-xs text-charcoal/50">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS TAB */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-bold text-xl text-charcoal">All Students ({students.length})</h2>
                  <button onClick={() => setActiveTab('add-student')} className="px-4 py-2 bg-teal text-white font-body text-sm font-semibold rounded-xl hover:bg-teal-dark transition-all flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Student
                  </button>
                </div>

                {students.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                    <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    <p className="font-heading font-bold text-charcoal mb-2">No students enrolled yet</p>
                    <p className="font-body text-sm text-charcoal/40 mb-4">Start by adding your first student to FreeLearner.</p>
                    <button onClick={() => setActiveTab('add-student')} className="px-6 py-2.5 bg-teal text-white font-body text-sm font-semibold rounded-xl hover:bg-teal-dark transition-all">
                      Enroll First Student
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => {
                      const studentGrades = grades.filter(g => g.student_record_id === student.id);
                      const avgGrade = studentGrades.length > 0
                        ? Math.round(studentGrades.reduce((sum, g) => sum + g.grade_percentage, 0) / studentGrades.length)
                        : null;

                      return (
                        <div key={student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-teal to-teal-dark rounded-full flex items-center justify-center font-heading font-bold text-white">
                                  {student.student_first_name[0]}{student.student_last_name[0]}
                                </div>
                                <div>
                                  <h3 className="font-heading font-bold text-charcoal">{student.student_first_name} {student.student_last_name}</h3>
                                  <p className="font-body text-xs text-charcoal/40">
                                    Grade {student.grade_level} · {student.primary_language} · {student.country}
                                    {student.date_of_birth && ` · DOB: ${new Date(student.date_of_birth).toLocaleDateString()}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={student.enrollment_status}
                                  onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                  className={`px-3 py-1.5 rounded-full font-body text-xs font-semibold border-0 cursor-pointer ${statusColor(student.enrollment_status)}`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="graduated">Graduated</option>
                                </select>
                              </div>
                            </div>

                            {student.special_needs && (
                              <div className="mb-3 px-3 py-2 bg-purple-50 rounded-lg">
                                <p className="font-body text-xs text-purple-700">
                                  <span className="font-semibold">Special Considerations:</span> {student.special_needs}
                                </p>
                              </div>
                            )}

                            {/* Grades */}
                            {studentGrades.length > 0 && (
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-body text-xs font-semibold text-charcoal/60">Academic Records</p>
                                  {avgGrade !== null && (
                                    <p className={`font-body text-xs font-bold ${gradeColor(avgGrade)}`}>
                                      Avg: {avgGrade}%
                                    </p>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {studentGrades.map((g) => (
                                    <div key={g.id} className="px-3 py-2 bg-cream rounded-lg">
                                      <p className="font-body text-xs text-charcoal/60">{g.subject}</p>
                                      <div className="flex items-center gap-2">
                                        <span className={`font-heading font-bold text-sm ${gradeColor(g.grade_percentage)}`}>{g.grade_letter}</span>
                                        <span className="font-body text-xs text-charcoal/40">{g.grade_percentage}%</span>
                                      </div>
                                      <p className="font-body text-[10px] text-charcoal/30">{g.term} · {g.school_year}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Add Grade inline */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => setSelectedStudentForGrades(selectedStudentForGrades === student.id ? '' : student.id)}
                                className="font-body text-xs text-teal font-semibold hover:underline flex items-center gap-1"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                {selectedStudentForGrades === student.id ? 'Hide Grade Form' : 'Add Grade Record'}
                              </button>

                              {selectedStudentForGrades === student.id && (
                                <div className="mt-3 p-4 bg-cream rounded-xl animate-fade-in">
                                  <div className="grid sm:grid-cols-3 gap-3 mb-3">
                                    <div>
                                      <label className="font-body text-xs text-charcoal/60 mb-1 block">Subject</label>
                                      <select value={newGrade.subject} onChange={e => setNewGrade({...newGrade, subject: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30">
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="font-body text-xs text-charcoal/60 mb-1 block">Letter Grade</label>
                                      <select value={newGrade.grade_letter} onChange={e => setNewGrade({...newGrade, grade_letter: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30">
                                        {['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F'].map(g => <option key={g} value={g}>{g}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="font-body text-xs text-charcoal/60 mb-1 block">Percentage</label>
                                      <input type="number" min="0" max="100" value={newGrade.grade_percentage} onChange={e => setNewGrade({...newGrade, grade_percentage: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30" />
                                    </div>
                                  </div>
                                  <div className="grid sm:grid-cols-3 gap-3 mb-3">
                                    <div>
                                      <label className="font-body text-xs text-charcoal/60 mb-1 block">Term</label>
                                      <input type="text" value={newGrade.term} onChange={e => setNewGrade({...newGrade, term: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30" placeholder="e.g. Fall 2025" />
                                    </div>
                                    <div>
                                      <label className="font-body text-xs text-charcoal/60 mb-1 block">School Year</label>
                                      <input type="text" value={newGrade.school_year} onChange={e => setNewGrade({...newGrade, school_year: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30" placeholder="e.g. 2025-2026" />
                                    </div>
                                    <div>
                                      <label className="font-body text-xs text-charcoal/60 mb-1 block">Teacher</label>
                                      <input type="text" value={newGrade.teacher_name} onChange={e => setNewGrade({...newGrade, teacher_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30" placeholder="Optional" />
                                    </div>
                                  </div>
                                  <button
                                    onClick={handleAddGrade}
                                    disabled={addingGrade}
                                    className="px-4 py-2 bg-teal text-white font-body text-sm font-semibold rounded-lg hover:bg-teal-dark transition-all disabled:opacity-50"
                                  >
                                    {addingGrade ? 'Saving...' : 'Save Grade'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ADD STUDENT TAB */}
            {activeTab === 'add-student' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="font-heading font-bold text-xl text-charcoal mb-1">Enroll New Student</h2>
                  <p className="font-body text-sm text-charcoal/40 mb-6">Add a student to FreeLearner so we can personalize their experience.</p>

                  {studentAdded && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fade-in">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p className="font-body text-sm text-green-700 font-semibold">Student enrolled successfully! They can now start exploring.</p>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">First Name *</label>
                        <input type="text" value={newStudent.first_name} onChange={e => setNewStudent({...newStudent, first_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" placeholder="Enter first name" />
                      </div>
                      <div>
                        <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Last Name *</label>
                        <input type="text" value={newStudent.last_name} onChange={e => setNewStudent({...newStudent, last_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" placeholder="Enter last name" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Date of Birth</label>
                        <input type="date" value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" />
                      </div>
                      <div>
                        <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Grade Level *</label>
                        <select value={newStudent.grade_level} onChange={e => setNewStudent({...newStudent, grade_level: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all">
                          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Primary Language</label>
                        <select value={newStudent.language} onChange={e => setNewStudent({...newStudent, language: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all">
                          {['English', 'Spanish', 'French', 'Mandarin', 'Arabic', 'Hindi', 'Portuguese', 'Japanese', 'Korean', 'German', 'Other'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Country</label>
                        <select value={newStudent.country} onChange={e => setNewStudent({...newStudent, country: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all">
                          {['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Mexico', 'Brazil', 'Germany', 'France', 'Japan', 'South Korea', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Special Needs / Accommodations</label>
                      <textarea value={newStudent.special_needs} onChange={e => setNewStudent({...newStudent, special_needs: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all resize-none" placeholder="IEP, 504 plan, learning differences, etc. (optional)" />
                    </div>

                    <div>
                      <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Additional Notes</label>
                      <textarea value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all resize-none" placeholder="Interests, behavioral notes, previous school info, etc. (optional)" />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAddStudent}
                        disabled={addingStudent || !newStudent.first_name || !newStudent.last_name}
                        className="w-full py-3.5 bg-teal hover:bg-teal-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {addingStudent ? (
                          <>
                            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                            Enrolling...
                          </>
                        ) : 'Enroll Student'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD TAB */}
            {activeTab === 'upload' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h2 className="font-heading font-bold text-xl text-charcoal mb-1">Upload Student Records</h2>
                  <p className="font-body text-sm text-charcoal/40 mb-6">Upload transcripts, report cards, IEPs, and other documents. Our AI will analyze them to personalize each student's experience.</p>

                  {uploadSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fade-in">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p className="font-body text-sm text-green-700 font-semibold">Document uploaded successfully! Processing will begin shortly.</p>
                    </div>
                  )}

                  {/* Document Type Selection */}
                  <div className="mb-6">
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Document Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {UPLOAD_TYPES.map(type => (
                        <button
                          key={type.value}
                          onClick={() => setUploadType(type.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2 ${
                            uploadType === type.value
                              ? 'border-teal bg-teal-50'
                              : 'border-gray-200 hover:border-teal/30'
                          }`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={uploadType === type.value ? '#0D7377' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={type.icon}/></svg>
                          <span className={`font-body text-xs font-semibold ${uploadType === type.value ? 'text-teal' : 'text-charcoal/60'}`}>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                      dragOver ? 'border-teal bg-teal-50' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-teal/50 hover:bg-cream'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
                    />
                    {selectedFile ? (
                      <>
                        <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p className="font-heading font-bold text-charcoal mb-1">{selectedFile.name}</p>
                        <p className="font-body text-xs text-charcoal/40">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change file</p>
                      </>
                    ) : (
                      <>
                        <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                        <p className="font-heading font-bold text-charcoal mb-1">Drop files here or click to browse</p>
                        <p className="font-body text-xs text-charcoal/40">Supports PDF, CSV, Excel, Word, and images · Max 50MB</p>
                      </>
                    )}
                  </div>

                  {selectedFile && (
                    <button
                      onClick={handleFileUpload}
                      disabled={uploading}
                      className="mt-4 w-full py-3.5 bg-teal hover:bg-teal-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          Upload Document
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <div>
                      <p className="font-heading font-bold text-sm text-charcoal mb-1">Your Data is Secure</p>
                      <p className="font-body text-xs text-charcoal/50">All uploaded documents are encrypted at rest and in transit. We comply with FERPA, COPPA, and GDPR. Student records are only used to personalize their experience and are never shared with third parties.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD HISTORY TAB */}
            {activeTab === 'records' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-xl text-charcoal">Upload History ({uploads.length})</h2>

                {uploads.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                    <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <p className="font-heading font-bold text-charcoal mb-2">No uploads yet</p>
                    <p className="font-body text-sm text-charcoal/40 mb-4">Upload student records to get started.</p>
                    <button onClick={() => setActiveTab('upload')} className="px-6 py-2.5 bg-teal text-white font-body text-sm font-semibold rounded-xl hover:bg-teal-dark transition-all">
                      Upload First Document
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-5 py-3 font-body text-xs font-semibold text-charcoal/40 uppercase tracking-wider">File</th>
                            <th className="text-left px-5 py-3 font-body text-xs font-semibold text-charcoal/40 uppercase tracking-wider">Type</th>
                            <th className="text-left px-5 py-3 font-body text-xs font-semibold text-charcoal/40 uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3 font-body text-xs font-semibold text-charcoal/40 uppercase tracking-wider">Uploaded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploads.map((upload) => (
                            <tr key={upload.id} className="border-b border-gray-50 hover:bg-cream/50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                  </div>
                                  <div>
                                    <p className="font-body text-sm font-semibold text-charcoal">{upload.file_name}</p>
                                    <p className="font-body text-xs text-charcoal/40">by {upload.uploaded_by}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-body text-xs text-charcoal/60 capitalize">{upload.upload_type.replace('_', ' ')}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`px-2.5 py-1 rounded-full font-body text-xs font-semibold capitalize ${
                                  upload.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  upload.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                  upload.status === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {upload.status === 'processing' ? 'Processing...' : upload.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-body text-xs text-charcoal/40">{new Date(upload.created_at).toLocaleDateString()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SchoolPortal;
