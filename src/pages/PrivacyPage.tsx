import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

const PrivacyPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const nav = (page: any) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const lastUpdated = 'March 25, 2026';

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="mb-8">
          <button onClick={() => nav('home')} className="font-body text-sm text-teal hover:underline mb-4 inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Home
          </button>
          <h1 className="font-heading font-bold text-3xl lg:text-4xl text-charcoal mb-2">Privacy Policy</h1>
          <p className="font-body text-sm text-charcoal/40">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-sm border border-gray-100 space-y-8">
          {/* Compliance badges */}
          <div className="flex flex-wrap gap-3 justify-center p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-xl border border-teal/10">
            {['COPPA Compliant', 'FERPA Aligned', 'HIPAA-Grade Security', 'SOC 2 Type II', 'GDPR Ready'].map(badge => (
              <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="font-body text-xs font-semibold text-charcoal">{badge}</span>
              </span>
            ))}
          </div>

          <div className="bg-red-50 rounded-xl p-5 border border-red-100">
            <h3 className="font-heading font-bold text-sm text-red-800 mb-2">Our Core Privacy Promise</h3>
            <ul className="space-y-1.5">
              {[
                'We NEVER sell children\'s data. Period.',
                'We NEVER use children\'s data for advertising or marketing.',
                'We NEVER share personal information with third parties for their own purposes.',
                'We collect ONLY what is necessary to provide the educational service.',
                'Parents have FULL control over their child\'s data at all times.',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span className="font-body text-sm text-red-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {[
            { title: '1. Information We Collect', content: `We collect information in three categories:

**Information You Provide:** Parent name, email address, child's first name (or alias), child's age and grade level, learning interests and preferences, aptitude assessment responses, and payment information (processed securely by our payment processor — we never store full card numbers).

**Information Generated Through Use:** Learning session data (topics, duration, progress), AI conversation logs, quiz and assessment results, achievement and badge data, and portfolio entries.

**Technical Information:** Device type and browser, IP address (anonymized after 24 hours), session duration, and feature usage analytics (aggregated, not individual).

We do NOT collect: Social Security numbers, precise geolocation, photos or videos of children, contact lists, or biometric data.` },
            { title: '2. How We Use Information', content: `We use collected information ONLY to:
- Provide personalized educational content appropriate to the child's age, grade, and interests
- Track learning progress and generate reports for parents
- Ensure child safety through content filtering and distress detection
- Improve our educational AI and curriculum mapping
- Communicate with parents about their child's progress and account
- Process payments and manage subscriptions
- Comply with legal obligations

We NEVER use children's data for: targeted advertising, behavioral profiling for commercial purposes, sale to data brokers, or any purpose unrelated to education.` },
            { title: '3. COPPA Compliance', content: `FreeLearner fully complies with the Children's Online Privacy Protection Act (COPPA):

- **Verifiable Parental Consent:** We require parental consent before collecting any personal information from children under 13. We use email-plus verification methods approved by the FTC.
- **Parental Rights:** Parents can review, modify, or delete their child's information at any time through the Parent Portal or by contacting us.
- **Data Minimization:** We collect only information reasonably necessary to provide our educational service.
- **Security:** We maintain reasonable security procedures to protect children's information.
- **No Conditioning:** We do not condition a child's participation on providing more information than is reasonably necessary.
- **Third-Party Restrictions:** We do not disclose children's information to third parties except as necessary to provide the service (e.g., our AI provider, under strict data processing agreements).` },
            { title: '4. FERPA Alignment', content: `While FERPA primarily applies to schools receiving federal funding, FreeLearner voluntarily aligns with FERPA principles:

- Parents have the right to inspect and review their child's educational records
- Parents may request amendment of records they believe are inaccurate
- We require consent before disclosing personally identifiable information from educational records
- We maintain an audit log of who accesses student data
- For Academy (institutional) accounts, we act as a "school official" with a legitimate educational interest under FERPA` },
            { title: '5. AI & Data Processing', content: `Our AI mentor processes student conversations to provide educational responses. Important details:

- AI conversations are processed in real-time and stored encrypted
- We use AI safety filters to prevent inappropriate content
- The AI is instructed to never ask for or store personal identifying information (addresses, phone numbers, school names, etc.)
- If a child shares personal information in chat, our system flags it for review and the AI redirects the conversation
- AI models are not trained on individual student data — we use aggregated, anonymized data for model improvement
- Parents can review all AI conversations in the Parent Portal
- Distress detection alerts are sent to parents via email when concerning patterns are identified` },
            { title: '6. Data Security', content: `We implement enterprise-grade security measures:

- **Encryption:** All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Access Controls:** Role-based access with principle of least privilege
- **Infrastructure:** Hosted on SOC 2 Type II certified infrastructure
- **Monitoring:** 24/7 security monitoring and intrusion detection
- **Incident Response:** Documented incident response plan with 72-hour breach notification
- **Employee Training:** All staff complete annual privacy and security training
- **Vendor Management:** All third-party vendors undergo security assessment and sign data processing agreements
- **Regular Audits:** Annual third-party security assessments` },
            { title: '7. Data Retention & Deletion', content: `- **Active accounts:** Data is retained for the duration of the account
- **Cancelled accounts:** Core educational records retained for 1 year, then permanently deleted
- **AI conversation logs:** Retained for 90 days after account cancellation, then permanently deleted
- **Payment records:** Retained as required by law (typically 7 years for tax purposes)
- **Deletion requests:** Honored within 30 days. Parents may request immediate deletion of all child data at any time
- **Account export:** Parents may export all child data in a portable format before deletion` },
            { title: '8. Parental Rights & Controls', content: `Parents have comprehensive rights over their child's data:

- **Access:** View all data collected about your child through the Parent Portal
- **Review:** Read all AI conversation logs and learning activity
- **Correct:** Update or correct any inaccurate information
- **Delete:** Request deletion of your child's data at any time
- **Export:** Download a complete copy of your child's data
- **Restrict:** Set content filters, time limits, and blocked topics
- **Revoke Consent:** Withdraw consent for data collection at any time (this will require account closure)
- **Notification Preferences:** Control what email notifications you receive` },
            { title: '9. Third-Party Services', content: `We use limited third-party services to operate FreeLearner:

- **AI Processing:** Our AI provider processes conversations under a strict data processing agreement that prohibits them from using student data for any purpose other than providing responses
- **Payment Processing:** Payment information is handled by PCI-compliant payment processors — we never see or store full card numbers
- **Email:** We use Resend for transactional emails (parent notifications, reports)
- **Hosting:** Our infrastructure is hosted on Supabase/AWS with SOC 2 certification

We do NOT use: advertising networks, social media trackers, analytics tools that track individual children, or any service that would expose children's data to commercial interests.` },
            { title: '10. Safe Video & Content Recommendations', content: `When our AI recommends external educational resources:

- Recommendations come ONLY from a pre-approved list of child-safe sources (Khan Academy, PBS LearningMedia, National Geographic Kids, TED-Ed, Smithsonian Learning Lab, NASA Kids' Club, Scratch/MIT, Code.org, CK-12, and BrainPOP)
- We NEVER link to YouTube or other user-generated content platforms where unsafe content may appear
- All recommended sources are reviewed for age-appropriateness and educational value
- Parents can disable external resource recommendations in Parental Controls` },
            { title: '11. Changes to This Policy', content: 'We will notify parents via email at least 30 days before making material changes to this Privacy Policy. If changes affect how we collect or use children\'s data, we will obtain new parental consent before implementing the changes. The "Last Updated" date at the top of this policy indicates when it was last revised.' },
            { title: '12. Contact Us', content: 'For privacy questions or to exercise your parental rights:\n\nPrivacy Officer: privacy@freelearner.org\nGeneral: support@freelearner.org\nSafety Concerns: safety@freelearner.org\n\nWe respond to all privacy inquiries within 5 business days.' },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="font-heading font-bold text-lg text-charcoal mb-3">{section.title}</h2>
              <div className="font-body text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">{section.content.replace(/\*\*(.*?)\*\*/g, '$1')}</div>
            </div>
          ))}

          <div className="border-t border-gray-100 pt-6">
            <p className="font-body text-xs text-charcoal/40 text-center">
              This Privacy Policy was last updated on {lastUpdated}. FreeLearner is committed to protecting children's privacy and complying with all applicable laws.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => nav('terms')} className="font-body text-sm text-teal hover:underline">Terms of Service</button>
              <button onClick={() => nav('safety')} className="font-body text-sm text-teal hover:underline">Safety</button>
              <button onClick={() => nav('home')} className="font-body text-sm text-teal hover:underline">Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
