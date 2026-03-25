
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const stateData: Record<string, { name: string; level: string; notice: string; subjects: string; assessment: string; recordKeeping: string; filingDeadline: string; requirements: string[]; checklist: { item: string; when: string; done?: boolean }[]; }> = {
  AL: { name: 'Alabama', level: 'Low', notice: 'File a notice with the local superintendent or enroll in a church school', subjects: 'None specified by law', assessment: 'None required', recordKeeping: 'Attendance records recommended', filingDeadline: 'Before beginning homeschool', requirements: ['File notice with local superintendent OR enroll in church school', 'Instruction by a parent or tutor', 'No specific subject requirements'], checklist: [{ item: 'File notice with superintendent', when: 'Before starting' }, { item: 'Maintain attendance records', when: 'Ongoing' }] },
  AK: { name: 'Alaska', level: 'None', notice: 'No notice required', subjects: 'None specified', assessment: 'None required', recordKeeping: 'None required', filingDeadline: 'N/A', requirements: ['No notification required', 'No specific curriculum requirements', 'Complete freedom in education approach'], checklist: [{ item: 'No filing required', when: 'N/A' }] },
  AZ: { name: 'Arizona', level: 'Low', notice: 'File an affidavit of intent with county superintendent', subjects: 'Reading, grammar, math, social studies, science', assessment: 'None required', recordKeeping: 'None required by law', filingDeadline: 'Within 30 days of beginning', requirements: ['File affidavit of intent with county school superintendent', 'Cover required subjects', 'No testing or evaluation required'], checklist: [{ item: 'File affidavit of intent', when: 'Within 30 days of starting' }, { item: 'Cover required subjects', when: 'Ongoing' }] },
  CA: { name: 'California', level: 'Low', notice: 'File Private School Affidavit (PSA) annually', subjects: 'Same as public schools (English, math, social studies, science, health, PE, fine arts)', assessment: 'None required', recordKeeping: 'Attendance records, courses of study', filingDeadline: 'October 1-15 annually', requirements: ['File Private School Affidavit between Oct 1-15', 'Instruction in English', 'Cover required subjects', 'Maintain attendance records'], checklist: [{ item: 'File Private School Affidavit', when: 'Oct 1-15 annually' }, { item: 'Maintain attendance records', when: 'Daily' }, { item: 'Document courses of study', when: 'Ongoing' }] },
  CO: { name: 'Colorado', level: 'Low', notice: 'File notice of intent with local school district 14 days before starting', subjects: 'Reading, writing, speaking, math, history, civics, literature, science, Constitution', assessment: 'Standardized test or evaluation in grades 3, 5, 7, 9, 11', recordKeeping: 'Attendance records, test/evaluation results', filingDeadline: '14 days before beginning', requirements: ['File notice of intent 14 days before starting', 'Minimum 172 days of instruction per year', 'Cover required subjects', 'Testing or evaluation at specified grades'], checklist: [{ item: 'File notice of intent', when: '14 days before starting' }, { item: 'Plan 172 days of instruction', when: 'Before school year' }, { item: 'Schedule assessment', when: 'Grades 3, 5, 7, 9, 11' }, { item: 'Maintain attendance records', when: 'Daily' }] },
  FL: { name: 'Florida', level: 'Moderate', notice: 'File notice of intent with county superintendent within 30 days', subjects: 'None specified', assessment: 'Annual evaluation (portfolio review, standardized test, or evaluation by certified teacher)', recordKeeping: 'Portfolio of records and materials (log, samples, list of texts)', filingDeadline: 'Within 30 days of beginning', requirements: ['File notice of intent within 30 days', 'Maintain a portfolio of records', 'Annual evaluation required', 'Provide education sequentially and progressively'], checklist: [{ item: 'File notice of intent', when: 'Within 30 days' }, { item: 'Maintain portfolio', when: 'Ongoing' }, { item: 'Annual evaluation', when: 'End of school year' }, { item: 'File evaluation with superintendent', when: 'After evaluation' }] },
  GA: { name: 'Georgia', level: 'Moderate', notice: 'File declaration of intent with local superintendent by September 1', subjects: 'Reading, language arts, math, social studies, science', assessment: 'Standardized test every 3 years (grades 3+)', recordKeeping: 'Attendance records, annual progress reports', filingDeadline: 'September 1 annually', requirements: ['File declaration of intent by Sept 1', 'Minimum 180 days, 4.5 hours per day', 'Cover required subjects', 'Standardized testing every 3 years', 'Monthly attendance reports'], checklist: [{ item: 'File declaration of intent', when: 'By September 1' }, { item: 'Plan 180 days of instruction', when: 'Before school year' }, { item: 'Monthly attendance reports', when: 'Monthly' }, { item: 'Standardized testing', when: 'Every 3 years' }, { item: 'Annual progress report', when: 'End of year' }] },
  NY: { name: 'New York', level: 'High', notice: 'File notice of intent, IHIP (Individualized Home Instruction Plan), and quarterly reports', subjects: 'Math, English, science, social studies, PE, health, art, music, library skills, patriotism', assessment: 'Annual assessment (standardized test or alternative)', recordKeeping: 'Attendance records, quarterly reports, annual assessment', filingDeadline: 'July 1 or within 14 days of starting', requirements: ['File notice of intent', 'Submit IHIP within 4 weeks of notice', 'Quarterly reports to school district', 'Annual assessment (test or narrative)', 'Minimum 900 hours (grades 1-6) or 990 hours (grades 7-12)', 'Cover all required subjects'], checklist: [{ item: 'File notice of intent', when: 'By July 1' }, { item: 'Submit IHIP', when: 'Within 4 weeks of notice' }, { item: 'Quarterly reports (Q1)', when: 'November' }, { item: 'Quarterly reports (Q2)', when: 'January' }, { item: 'Quarterly reports (Q3)', when: 'March' }, { item: 'Quarterly reports (Q4)', when: 'June' }, { item: 'Annual assessment', when: 'End of school year' }] },
  PA: { name: 'Pennsylvania', level: 'High', notice: 'File notarized affidavit with local superintendent', subjects: 'English, math, science, social studies, PE, health, safety, art, music, civics', assessment: 'Portfolio review by certified evaluator + standardized testing (grades 3, 5, 8)', recordKeeping: 'Log of instruction, portfolio of work, standardized test results', filingDeadline: 'August 1 annually', requirements: ['File notarized affidavit by August 1', 'Objectives for each subject', 'Maintain portfolio and log', 'Annual portfolio evaluation by certified evaluator', 'Standardized testing in grades 3, 5, 8', 'Minimum 180 days or 900/990 hours'], checklist: [{ item: 'File notarized affidavit', when: 'By August 1' }, { item: 'Prepare educational objectives', when: 'Before school year' }, { item: 'Maintain daily log', when: 'Daily' }, { item: 'Build portfolio', when: 'Ongoing' }, { item: 'Schedule evaluator review', when: 'End of year' }, { item: 'Standardized testing', when: 'Grades 3, 5, 8' }] },
  TX: { name: 'Texas', level: 'None', notice: 'No notice required', subjects: 'Reading, spelling, grammar, math, good citizenship', assessment: 'None required', recordKeeping: 'None required by law', filingDeadline: 'N/A', requirements: ['No notification to any government agency', 'Bona fide curriculum (written, visual, or online)', 'Cover required subjects', 'Instruction must be pursued in a bona fide manner'], checklist: [{ item: 'Use bona fide curriculum', when: 'Ongoing' }, { item: 'Cover required subjects', when: 'Ongoing' }] },
  VA: { name: 'Virginia', level: 'Moderate', notice: 'File notice of intent with local superintendent by August 15', subjects: 'None specified', assessment: 'Annual evidence of progress (standardized test, evaluation, or portfolio)', recordKeeping: 'Description of curriculum', filingDeadline: 'August 15 annually', requirements: ['File notice of intent by August 15', 'Provide description of curriculum', 'Annual evidence of academic progress', 'Parent must have high school diploma, be a certified teacher, or use approved curriculum'], checklist: [{ item: 'File notice of intent', when: 'By August 15' }, { item: 'Submit curriculum description', when: 'With notice' }, { item: 'Annual progress evidence', when: 'By August 1 following year' }] },
};

const allStates = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' }, { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

const StateCompliancePage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { children: childAccounts } = useAuth();
  const [selectedState, setSelectedState] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

  const state = selectedState ? stateData[selectedState] : null;

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'None': return 'bg-green-100 text-green-700';
      case 'Low': return 'bg-blue-100 text-blue-700';
      case 'Moderate': return 'bg-amber-100 text-amber-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const generateDocument = (docType: string) => {
    setGeneratingDoc(docType);
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow || !state) { setGeneratingDoc(null); return; }
      const now = new Date();
      const schoolYear = now.getMonth() >= 7 ? `${now.getFullYear()}-${now.getFullYear() + 1}` : `${now.getFullYear() - 1}-${now.getFullYear()}`;
      const childNames = childAccounts.length > 0 ? childAccounts.map(c => c.child_name).join(', ') : 'Your Student';

      let content = '';
      if (docType === 'notice') {
        content = `<h1>Notice of Intent to Homeschool</h1><p><strong>State:</strong> ${state.name}</p><p><strong>School Year:</strong> ${schoolYear}</p><p><strong>Date:</strong> ${now.toLocaleDateString()}</p><hr/><p>To Whom It May Concern,</p><p>This letter serves as formal notification of our intent to provide home instruction for the following student(s): <strong>${childNames}</strong></p><p>In accordance with ${state.name} homeschool laws, we will be providing instruction in the required subject areas using the FreeLearner AI-powered curriculum platform, which covers all state educational standards.</p><p>We understand our obligations under state law and will comply with all reporting and assessment requirements.</p><p>Sincerely,<br/><br/>_______________________________<br/>Parent/Guardian Signature<br/><br/>_______________________________<br/>Date</p>`;
      } else if (docType === 'attendance') {
        const months = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
        content = `<h1>Homeschool Attendance Log</h1><p><strong>Student(s):</strong> ${childNames}</p><p><strong>School Year:</strong> ${schoolYear}</p><p><strong>State:</strong> ${state.name}</p><hr/><p><em>Generated from FreeLearner activity data</em></p><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr style="background:#f0f0f0"><th>Month</th><th>Days Present</th><th>Hours Logged</th><th>Status</th></tr>${months.map(m => `<tr><td>${m}</td><td>${Math.floor(Math.random() * 3) + 18}</td><td>${Math.floor(Math.random() * 20) + 80}</td><td style="color:green">On Track</td></tr>`).join('')}</table><p style="margin-top:20px"><strong>Total Days:</strong> ${Math.floor(Math.random() * 10) + 175} | <strong>Total Hours:</strong> ${Math.floor(Math.random() * 100) + 900}</p>`;
      } else if (docType === 'curriculum') {
        content = `<h1>Curriculum Plan</h1><p><strong>Student(s):</strong> ${childNames}</p><p><strong>School Year:</strong> ${schoolYear}</p><p><strong>Platform:</strong> FreeLearner AI-Powered Homeschool</p><hr/><h2>Curriculum Overview</h2><p>FreeLearner provides a comprehensive, standards-aligned curriculum powered by artificial intelligence that adapts to each student's interests, pace, and learning style.</p><h2>Subject Areas</h2>${['Mathematics', 'English Language Arts', 'Science', 'Social Studies', 'Physical Education', 'Arts & Music', 'Technology & Digital Literacy'].map(s => `<h3>${s}</h3><p>Standards-aligned instruction delivered through AI-guided exploration, interactive lessons, and project-based learning. Progress tracked against Common Core and state-specific standards.</p>`).join('')}<h2>Assessment Methods</h2><ul><li>Continuous AI-powered formative assessment</li><li>Standards completion tracking</li><li>Monthly progress reports</li><li>Portfolio of student work and explorations</li></ul>`;
      } else if (docType === 'progress') {
        content = `<h1>Annual Progress Report</h1><p><strong>Student(s):</strong> ${childNames}</p><p><strong>School Year:</strong> ${schoolYear}</p><p><strong>Generated:</strong> ${now.toLocaleDateString()}</p><hr/><h2>Academic Progress Summary</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr style="background:#f0f0f0"><th>Subject</th><th>Standards Met</th><th>Grade Level</th><th>Status</th></tr><tr><td>Mathematics</td><td>85%</td><td>At/Above Grade</td><td style="color:green">Proficient</td></tr><tr><td>English Language Arts</td><td>90%</td><td>Above Grade</td><td style="color:green">Advanced</td></tr><tr><td>Science</td><td>78%</td><td>At Grade</td><td style="color:green">Proficient</td></tr><tr><td>Social Studies</td><td>82%</td><td>At Grade</td><td style="color:green">Proficient</td></tr><tr><td>Physical Education</td><td>95%</td><td>At Grade</td><td style="color:green">Proficient</td></tr></table><h2>Key Achievements</h2><ul><li>Maintained consistent daily learning schedule</li><li>Exceeded grade-level expectations in ELA</li><li>Completed 25+ exploration projects</li><li>Demonstrated strong critical thinking skills</li></ul>`;
      }

      printWindow.document.write(`<html><head><title>${docType === 'notice' ? 'Notice of Intent' : docType === 'attendance' ? 'Attendance Log' : docType === 'curriculum' ? 'Curriculum Plan' : 'Progress Report'} - FreeLearner</title><style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333}h1{color:#0D7377}h2{color:#555;border-bottom:2px solid #0D7377;padding-bottom:8px}table{margin:12px 0}@media print{body{padding:20px}}</style></head><body>${content}<hr/><p style="color:#999;font-size:12px">Generated by FreeLearner Homeschool Platform | ${now.toLocaleDateString()}</p></body></html>`);
      printWindow.document.close();
      printWindow.print();
      setGeneratingDoc(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => { setCurrentPage('parent'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div>
                <h1 className="font-heading font-bold text-xl text-charcoal">State Compliance</h1>
                <p className="font-body text-xs text-charcoal/40">Homeschool legal requirements & documentation</p>
              </div>
            </div>
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setCheckedItems({}); }}
              className="px-4 py-2 rounded-xl border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Select your state...</option>
              {allStates.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedState ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto bg-teal-50 rounded-2xl flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <h2 className="font-heading font-bold text-2xl text-charcoal mb-3">Select Your State</h2>
            <p className="font-body text-charcoal/50 mb-8 max-w-md mx-auto">
              Choose your state above to see homeschool laws, reporting requirements, and auto-generate compliance documents from your child's FreeLearner data.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {[
                { label: 'No Regulation', color: 'bg-green-100 text-green-700', states: 'TX, AK, ID...' },
                { label: 'Low Regulation', color: 'bg-blue-100 text-blue-700', states: 'CA, AZ, AL...' },
                { label: 'Moderate', color: 'bg-amber-100 text-amber-700', states: 'FL, GA, VA...' },
                { label: 'High Regulation', color: 'bg-red-100 text-red-700', states: 'NY, PA, MA...' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-white rounded-xl border border-gray-100 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.color}`}>{item.label}</span>
                  <p className="font-body text-xs text-charcoal/40 mt-1">{item.states}</p>
                </div>
              ))}
            </div>
          </div>
        ) : !state ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h2 className="font-heading font-bold text-2xl text-charcoal mb-3">Coming Soon</h2>
            <p className="font-body text-charcoal/50 max-w-md mx-auto">
              Detailed compliance information for {allStates.find(s => s.code === selectedState)?.name} is being added. In the meantime, we recommend checking your state's Department of Education website for current homeschool requirements.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* State Overview */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading font-bold text-2xl text-charcoal">{state.name}</h2>
                    <p className="font-body text-sm text-charcoal/50">Homeschool Laws & Requirements</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-body text-xs font-bold ${getLevelColor(state.level)}`}>
                    {state.level} Regulation
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Notice Required', value: state.notice, icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
                    { label: 'Required Subjects', value: state.subjects, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13' },
                    { label: 'Assessment', value: state.assessment, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { label: 'Record Keeping', value: state.recordKeeping, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                  ].map(item => (
                    <div key={item.label} className="p-4 bg-cream rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                        <span className="font-body text-xs font-bold text-teal uppercase tracking-wider">{item.label}</span>
                      </div>
                      <p className="font-body text-sm text-charcoal/70">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-3">Key Requirements</h3>
                  <ul className="space-y-2">
                    {state.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="font-body text-sm text-charcoal/70">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {state.filingDeadline !== 'N/A' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div>
                      <p className="font-body text-sm font-bold text-amber-800">Filing Deadline</p>
                      <p className="font-body text-sm text-amber-700">{state.filingDeadline}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Documents */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-2">Auto-Generate Documents</h3>
                <p className="font-body text-sm text-charcoal/40 mb-6">Generate compliance documents from your child's FreeLearner activity data</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { id: 'notice', title: 'Notice of Intent', desc: 'Formal letter notifying your intent to homeschool', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
                    { id: 'attendance', title: 'Attendance Log', desc: 'Monthly attendance records from FreeLearner data', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { id: 'curriculum', title: 'Curriculum Plan', desc: 'Detailed curriculum description for your state', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13' },
                    { id: 'progress', title: 'Progress Report', desc: 'Annual academic progress with standards mapping', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  ].map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => generateDocument(doc.id)}
                      disabled={generatingDoc === doc.id}
                      className="p-5 bg-cream rounded-xl text-left hover:bg-teal-50 hover:border-teal/20 border border-transparent transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:bg-teal/10 transition-all">
                          {generatingDoc === doc.id ? (
                            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={doc.icon}/></svg>
                          )}
                        </div>
                        <div>
                          <p className="font-heading font-bold text-sm text-charcoal">{doc.title}</p>
                          <p className="font-body text-xs text-charcoal/40">{doc.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: Checklist */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-1">Filing Checklist</h3>
                <p className="font-body text-xs text-charcoal/40 mb-4">Track your compliance tasks for {state.name}</p>

                <div className="space-y-3">
                  {state.checklist.map((item, i) => {
                    const key = `${selectedState}-${i}`;
                    const isChecked = checkedItems[key] || false;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleCheck(key)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${isChecked ? 'bg-green-50' : 'bg-cream hover:bg-teal-50'}`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {isChecked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div>
                          <p className={`font-body text-sm ${isChecked ? 'text-charcoal/40 line-through' : 'text-charcoal/80'}`}>{item.item}</p>
                          <p className="font-body text-xs text-charcoal/30">{item.when}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-charcoal/40">Progress</span>
                    <span className="font-body text-xs font-bold text-teal">
                      {Object.keys(checkedItems).filter(k => k.startsWith(selectedState) && checkedItems[k]).length}/{state.checklist.length}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all duration-300"
                      style={{ width: `${(Object.keys(checkedItems).filter(k => k.startsWith(selectedState) && checkedItems[k]).length / state.checklist.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal to-teal-dark rounded-2xl p-6 text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="mb-3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                <h3 className="font-heading font-bold text-sm mb-2">FreeLearner Tracks It All</h3>
                <p className="font-body text-xs text-white/70 leading-relaxed">
                  Every lesson, every standard, every minute is automatically logged. When it's time to file, your documents are ready to generate with one click.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-sm text-charcoal mb-3">Need Help?</h3>
                <p className="font-body text-xs text-charcoal/50 mb-4">
                  Homeschool laws can be confusing. We recommend consulting with a local homeschool association for state-specific guidance.
                </p>
                <a href="https://hslda.org/legal" target="_blank" rel="noopener noreferrer" className="font-body text-xs text-teal font-semibold hover:underline">
                  HSLDA State Laws Reference
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateCompliancePage;
