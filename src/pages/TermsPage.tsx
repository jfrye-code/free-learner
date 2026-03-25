import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

const TermsPage: React.FC = () => {
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
          <h1 className="font-heading font-bold text-3xl lg:text-4xl text-charcoal mb-2">Terms of Service</h1>
          <p className="font-body text-sm text-charcoal/40">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-sm border border-gray-100 space-y-8">
          <div className="bg-teal-50 rounded-xl p-5 border border-teal/10">
            <p className="font-body text-sm text-teal leading-relaxed">
              <strong>Important:</strong> FreeLearner is designed for children. These Terms include specific protections required by the Children's Online Privacy Protection Act (COPPA), the Family Educational Rights and Privacy Act (FERPA), and applicable state laws governing children's online education.
            </p>
          </div>

          {[
            { title: '1. Acceptance of Terms', content: 'By accessing or using FreeLearner ("Service"), you agree to be bound by these Terms of Service. If you are a parent or guardian creating an account for a child under 13, you are agreeing to these terms on behalf of your child. Only parents or legal guardians may create accounts for minors. By creating a child account, you represent that you have the legal authority to consent on behalf of the child.' },
            { title: '2. Eligibility & Parental Consent', content: 'FreeLearner is intended for use by children aged 5-18 under parental supervision. Children under 13 may not create accounts independently. A parent or legal guardian must: (a) create the account, (b) provide verifiable parental consent as required by COPPA, (c) agree to these Terms on the child\'s behalf, and (d) supervise the child\'s use of the Service. We use a parental consent verification process that complies with COPPA requirements, including email-plus verification for initial consent.' },
            { title: '3. Description of Service', content: 'FreeLearner provides AI-powered personalized educational content for homeschool students. The Service includes: AI-guided learning sessions, curriculum mapping to educational standards, progress tracking and reporting, parent monitoring dashboards, and gamified learning experiences. FreeLearner is a supplemental educational tool and does not replace accredited educational institutions. Parents remain responsible for ensuring compliance with their state\'s homeschool requirements.' },
            { title: '4. AI Usage & Limitations', content: 'Our AI mentor is designed to be educational, age-appropriate, and safe. However: (a) AI responses are generated algorithmically and may occasionally contain inaccuracies; (b) the AI is not a substitute for professional educational, medical, or psychological advice; (c) all AI interactions with children are logged and available for parent review; (d) the AI is programmed to refuse inappropriate requests, protect personal information, and redirect concerning conversations; (e) we employ content filtering, safety monitoring, and distress detection systems. Parents should regularly review their child\'s AI interactions through the Parent Portal.' },
            { title: '5. Privacy & Data Protection', content: 'Your privacy is critically important to us, especially regarding children\'s data. Our data practices are detailed in our Privacy Policy. Key commitments: We collect only the minimum data necessary to provide the Service. We never sell children\'s personal information. We never use children\'s data for advertising or marketing. All data is encrypted in transit and at rest. We comply with COPPA, FERPA, and applicable state privacy laws. Parents may access, correct, or delete their child\'s data at any time.' },
            { title: '6. Account Security', content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to: (a) use strong, unique passwords; (b) not share account access with unauthorized persons; (c) notify us immediately of any unauthorized access; (d) ensure your child does not share their login credentials. We implement industry-standard security measures including encryption, access controls, and regular security audits.' },
            { title: '7. Subscription & Billing', content: 'FreeLearner offers free and paid subscription plans. Paid plans are billed monthly or annually as selected. All paid plans include a 30-day money-back guarantee. You may cancel at any time from your Account Settings. Upon cancellation, access continues until the end of the current billing period. We reserve the right to change pricing with 30 days\' notice. Promotional codes and discounts are subject to their specific terms and conditions.' },
            { title: '8. Acceptable Use', content: 'You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to access other users\' accounts or data; (c) interfere with or disrupt the Service; (d) upload malicious content or code; (e) use the Service to harm, exploit, or endanger children; (f) attempt to circumvent safety features or content filters; (g) use automated tools to access the Service without permission; (h) misrepresent your identity or relationship to a child.' },
            { title: '9. Intellectual Property', content: 'FreeLearner and its original content, features, and functionality are owned by FreeLearner and are protected by copyright, trademark, and other intellectual property laws. User-generated content (such as portfolio entries) remains the property of the user, but you grant FreeLearner a limited license to display and store such content as necessary to provide the Service.' },
            { title: '10. Educational Records (FERPA)', content: 'FreeLearner treats student learning data as educational records. In compliance with FERPA principles: (a) parents have the right to inspect and review their child\'s educational records; (b) parents may request corrections to inaccurate records; (c) we will not disclose educational records without parental consent except as permitted by law; (d) we maintain an audit trail of data access. For Academy (institutional) accounts, the educational institution acts as the FERPA-responsible party.' },
            { title: '11. Limitation of Liability', content: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, FREELEARNER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim. This limitation does not apply to our obligations regarding children\'s privacy and safety.' },
            { title: '12. Dispute Resolution', content: 'Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the American Arbitration Association rules, except that either party may seek injunctive relief in court for violations of intellectual property rights or data privacy obligations. Class action waivers apply to the maximum extent permitted by law.' },
            { title: '13. Changes to Terms', content: 'We may update these Terms from time to time. We will notify you of material changes via email and/or a prominent notice on the Service at least 30 days before changes take effect. Continued use of the Service after changes become effective constitutes acceptance of the new Terms. If you disagree with changes, you may cancel your account.' },
            { title: '14. Contact Information', content: 'For questions about these Terms, contact us at: legal@freelearner.org. For privacy-related inquiries: privacy@freelearner.org. For safety concerns: safety@freelearner.org.' },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="font-heading font-bold text-lg text-charcoal mb-3">{section.title}</h2>
              <p className="font-body text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}

          <div className="border-t border-gray-100 pt-6">
            <p className="font-body text-xs text-charcoal/40 text-center">
              These Terms of Service were last updated on {lastUpdated}. By using FreeLearner, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => nav('privacy')} className="font-body text-sm text-teal hover:underline">Privacy Policy</button>
              <button onClick={() => nav('safety')} className="font-body text-sm text-teal hover:underline">Safety</button>
              <button onClick={() => nav('home')} className="font-body text-sm text-teal hover:underline">Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
