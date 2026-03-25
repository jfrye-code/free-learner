import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  segment: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  sent_at: string | null;
  created_at: string;
}

interface Segments {
  all: number;
  parents: number;
  educators: number;
  students: number;
  active: number;
  inactive: number;
  new_users: number;
}

const SEGMENT_LABELS: Record<string, string> = {
  all: 'All Users',
  parents: 'Parents',
  educators: 'Educators',
  students: 'Students',
  active: 'Active (7 days)',
  inactive: 'Inactive (30+ days)',
  new_users: 'New Users (7 days)',
};

const EMAIL_TEMPLATES = [
  {
    name: 'Welcome Series',
    subject: 'Welcome to FreeLearner, {name}!',
    body: `<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: linear-gradient(135deg, #0D7377, #14B8A6); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
<h1 style="color: white; margin: 0; font-size: 24px;">Welcome to FreeLearner!</h1>
<p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Your learning adventure begins now</p>
</div>
<div style="padding: 32px; background: white; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
<p style="font-size: 16px; color: #1F2937;">Hi {name},</p>
<p style="color: #4B5563; line-height: 1.6;">We're thrilled to have you and {child_name} join the FreeLearner family! Here's what you can do to get started:</p>
<ul style="color: #4B5563; line-height: 2;">
<li>Set up your child's learning profile</li>
<li>Explore AI-powered lessons</li>
<li>Track progress in real-time</li>
</ul>
<a href="#" style="display: inline-block; background: #0D7377; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Get Started</a>
<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
<p style="color: #9CA3AF; font-size: 12px;">FreeLearner · AI-Powered Homeschool Platform</p>
</div></div>`,
  },
  {
    name: 'Re-engagement',
    subject: "We miss you, {name}! {child_name}'s adventure awaits",
    body: `<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: linear-gradient(135deg, #F97316, #FB923C); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
<h1 style="color: white; margin: 0; font-size: 24px;">We Miss You!</h1>
</div>
<div style="padding: 32px; background: white; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
<p style="font-size: 16px; color: #1F2937;">Hi {name},</p>
<p style="color: #4B5563; line-height: 1.6;">It's been a while since {child_name} logged into FreeLearner. We've added exciting new features and lessons!</p>
<p style="color: #4B5563;">Come back and see what's new. Use code <strong>{discount_code}</strong> for a special discount!</p>
<a href="#" style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Return to FreeLearner</a>
<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
<p style="color: #9CA3AF; font-size: 12px;">FreeLearner · AI-Powered Homeschool Platform</p>
</div></div>`,
  },
  {
    name: 'Feature Announcement',
    subject: 'New Feature: {name}, check out what we built for you!',
    body: `<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: linear-gradient(135deg, #7C3AED, #A78BFA); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
<h1 style="color: white; margin: 0; font-size: 24px;">Something New!</h1>
</div>
<div style="padding: 32px; background: white; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
<p style="font-size: 16px; color: #1F2937;">Hi {name},</p>
<p style="color: #4B5563; line-height: 1.6;">We've been working hard on new features for {child_name}'s learning experience. Here's what's new:</p>
<div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
<p style="color: #1F2937; font-weight: bold; margin: 0;">Feature highlights go here</p>
<p style="color: #6B7280; margin: 8px 0 0;">Describe the new features and benefits.</p>
</div>
<a href="#" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Try It Now</a>
<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
<p style="color: #9CA3AF; font-size: 12px;">FreeLearner · AI-Powered Homeschool Platform</p>
</div></div>`,
  },
];

const AdminCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segments | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Create form
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formSegment, setFormSegment] = useState('all');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewEmail, setPreviewEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingPreview, setSendingPreview] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, segmentsRes] = await Promise.all([
        supabase.functions.invoke('email-campaigns', { body: { action: 'list-campaigns' } }),
        supabase.functions.invoke('email-campaigns', { body: { action: 'get-segments' } }),
      ]);
      if (campaignsRes.data?.campaigns) setCampaigns(campaignsRes.data.campaigns);
      if (segmentsRes.data?.segments) setSegments(segmentsRes.data.segments);
    } catch (err) {
      console.warn('Load error:', err);
    }
    setLoading(false);
  };

  const showMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const applyTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormBody(template.body);
  };

  const handlePreview = async () => {
    try {
      const { data } = await supabase.functions.invoke('email-campaigns', {
        body: { action: 'preview', subject: formSubject, html_body: formBody, segment: formSegment },
      });
      if (data?.preview_html) {
        setPreviewHtml(data.preview_html);
        setShowPreview(true);
      }
    } catch (err) {
      showMsg('Preview failed', 'error');
    }
  };

  const handleSendPreview = async () => {
    if (!previewEmail) { showMsg('Enter a preview email', 'error'); return; }
    setSendingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-campaigns', {
        body: { action: 'send-preview', subject: formSubject, html_body: formBody, preview_email: previewEmail },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      showMsg(`Preview sent to ${previewEmail}`, 'success');
    } catch (err: any) {
      showMsg(err.message || 'Failed to send preview', 'error');
    }
    setSendingPreview(false);
  };

  const handleCreateAndSend = async () => {
    if (!formName || !formSubject || !formBody) { showMsg('Fill in all fields', 'error'); return; }
    setSending(true);
    try {
      // Create campaign
      const { data: createData, error: createErr } = await supabase.functions.invoke('email-campaigns', {
        body: { action: 'create-campaign', name: formName, subject: formSubject, html_body: formBody, segment: formSegment },
      });
      if (createErr || createData?.error) throw new Error(createData?.error || 'Create failed');

      // Send it
      const { data: sendData, error: sendErr } = await supabase.functions.invoke('email-campaigns', {
        body: { action: 'send-campaign', campaign_id: createData.campaign.id },
      });
      if (sendErr || sendData?.error) throw new Error(sendData?.error || 'Send failed');

      showMsg(`Campaign sent! ${sendData.sent} delivered, ${sendData.failed} failed`, 'success');
      setFormName(''); setFormSubject(''); setFormBody(''); setFormSegment('all');
      setView('list');
      loadData();
    } catch (err: any) {
      showMsg(err.message || 'Failed to send campaign', 'error');
    }
    setSending(false);
  };

  const handleSaveDraft = async () => {
    if (!formName || !formSubject || !formBody) { showMsg('Fill in all fields', 'error'); return; }
    try {
      const { data, error } = await supabase.functions.invoke('email-campaigns', {
        body: { action: 'create-campaign', name: formName, subject: formSubject, html_body: formBody, segment: formSegment },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      showMsg('Draft saved!', 'success');
      loadData();
      setView('list');
    } catch (err: any) {
      showMsg(err.message || 'Failed to save', 'error');
    }
  };

  const viewCampaignDetail = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    try {
      const { data } = await supabase.functions.invoke('email-campaigns', {
        body: { action: 'get-campaign-details', campaign_id: campaign.id },
      });
      if (data?.recipients) setCampaignRecipients(data.recipients);
    } catch { /* ignore */ }
    setView('detail');
  };

  const sendDraftCampaign = async (campaignId: string) => {
    if (!confirm('Send this campaign to all recipients in the segment?')) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-campaigns', {
        body: { action: 'send-campaign', campaign_id: campaignId },
      });
      if (error || data?.error) throw new Error(data?.error || 'Send failed');
      showMsg(`Sent! ${data.sent} delivered, ${data.failed} failed`, 'success');
      loadData();
    } catch (err: any) {
      showMsg(err.message || 'Failed', 'error');
    }
    setSending(false);
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await supabase.functions.invoke('email-campaigns', { body: { action: 'delete-campaign', campaign_id: id } });
      showMsg('Campaign deleted', 'success');
      loadData();
      if (view === 'detail') setView('list');
    } catch { showMsg('Delete failed', 'error'); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      sending: 'bg-amber-100 text-amber-700',
      sent: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
        <p className="font-body text-sm text-charcoal/40">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-body font-semibold text-sm ${
          messageType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{message}</div>
      )}

      {/* CAMPAIGN LIST VIEW */}
      {view === 'list' && (
        <div>
          {/* Segment overview */}
          {segments && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
                <div key={key} className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="font-heading font-bold text-2xl text-charcoal">{(segments as any)[key] || 0}</p>
                  <p className="font-body text-xs text-charcoal/40 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-lg text-charcoal">Email Campaigns ({campaigns.length})</h3>
            <button onClick={() => setView('create')} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <p className="font-heading font-bold text-charcoal mb-2">No campaigns yet</p>
              <p className="font-body text-sm text-charcoal/40">Create your first email campaign to engage your users.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-body text-sm font-bold text-charcoal truncate">{c.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold uppercase ${getStatusBadge(c.status)}`}>{c.status}</span>
                      </div>
                      <p className="font-body text-xs text-charcoal/50 truncate">{c.subject}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="font-body text-xs text-charcoal/40">Segment: {SEGMENT_LABELS[c.segment] || c.segment}</span>
                        {c.status === 'sent' && (
                          <>
                            <span className="font-body text-xs text-green-600 font-semibold">{c.sent_count} sent</span>
                            {c.failed_count > 0 && <span className="font-body text-xs text-red-500">{c.failed_count} failed</span>}
                          </>
                        )}
                        <span className="font-body text-xs text-charcoal/30">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.status === 'draft' && (
                        <button onClick={() => sendDraftCampaign(c.id)} disabled={sending} className="px-3 py-1.5 bg-teal hover:bg-teal-dark text-white font-body text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                          Send
                        </button>
                      )}
                      <button onClick={() => viewCampaignDetail(c)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-charcoal/60 font-body text-xs font-semibold rounded-lg transition-all">
                        Details
                      </button>
                      <button onClick={() => deleteCampaign(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-charcoal/30 hover:text-red-500 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE CAMPAIGN VIEW */}
      {view === 'create' && (
        <div>
          <button onClick={() => setView('list')} className="flex items-center gap-2 font-body text-sm text-charcoal/50 hover:text-charcoal mb-6 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Campaigns
          </button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Compose Campaign</h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Campaign Name</label>
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., March Newsletter" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Target Segment</label>
                    <select value={formSegment} onChange={e => setFormSegment(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30">
                      {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label} ({(segments as any)?.[key] || 0} users)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Subject Line</label>
                    <input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="e.g., Exciting news, {name}!" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                    <p className="font-body text-xs text-charcoal/30 mt-1">Merge tags: {'{name}'}, {'{child_name}'}, {'{discount_code}'}</p>
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Email Body (HTML)</label>
                    <textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={12} placeholder="<p>Hi {name},</p><p>Your message here...</p>" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 font-mono" />
                  </div>

                  {/* Preview section */}
                  <div className="flex items-center gap-3">
                    <button onClick={handlePreview} className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-body text-sm font-semibold rounded-lg transition-all">
                      Preview
                    </button>
                    <div className="flex-1 flex gap-2">
                      <input type="email" value={previewEmail} onChange={e => setPreviewEmail(e.target.value)} placeholder="Send test to email..." className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-body text-sm" />
                      <button onClick={handleSendPreview} disabled={sendingPreview} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-charcoal/60 font-body text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                        {sendingPreview ? 'Sending...' : 'Send Test'}
                      </button>
                    </div>
                  </div>

                  {showPreview && previewHtml && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                        <span className="font-body text-xs text-charcoal/50">Email Preview</span>
                        <button onClick={() => setShowPreview(false)} className="text-charcoal/30 hover:text-charcoal">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <div className="p-4 bg-white" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button onClick={handleCreateAndSend} disabled={sending || !formName || !formSubject || !formBody} className="flex-1 py-3 bg-teal hover:bg-teal-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50">
                      {sending ? 'Sending...' : 'Create & Send Now'}
                    </button>
                    <button onClick={handleSaveDraft} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-charcoal/60 font-body font-semibold rounded-xl transition-all">
                      Save Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h4 className="font-heading font-bold text-sm text-charcoal mb-3">Email Templates</h4>
                <div className="space-y-2">
                  {EMAIL_TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => applyTemplate(t)} className="w-full p-3 bg-cream hover:bg-teal-50 rounded-xl text-left transition-all border border-gray-100">
                      <p className="font-body text-sm font-semibold text-charcoal">{t.name}</p>
                      <p className="font-body text-xs text-charcoal/40 mt-1 truncate">{t.subject}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h4 className="font-heading font-bold text-sm text-charcoal mb-3">Merge Tags</h4>
                <div className="space-y-2">
                  {[
                    { tag: '{name}', desc: "Recipient's full name" },
                    { tag: '{email}', desc: "Recipient's email" },
                    { tag: '{child_name}', desc: "First child's name" },
                    { tag: '{discount_code}', desc: 'Discount code (set in campaign)' },
                  ].map(m => (
                    <div key={m.tag} className="flex items-center justify-between p-2 bg-cream rounded-lg">
                      <code className="font-mono text-xs text-teal font-bold">{m.tag}</code>
                      <span className="font-body text-[10px] text-charcoal/40">{m.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN DETAIL VIEW */}
      {view === 'detail' && selectedCampaign && (
        <div>
          <button onClick={() => setView('list')} className="flex items-center gap-2 font-body text-sm text-charcoal/50 hover:text-charcoal mb-6 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Campaigns
          </button>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-lg text-charcoal">{selectedCampaign.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold uppercase ${getStatusBadge(selectedCampaign.status)}`}>{selectedCampaign.status}</span>
                </div>
                <p className="font-body text-sm text-charcoal/50 mt-1">{selectedCampaign.subject}</p>
              </div>
              <div className="flex gap-2">
                {selectedCampaign.status === 'draft' && (
                  <button onClick={() => sendDraftCampaign(selectedCampaign.id)} disabled={sending} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                    {sending ? 'Sending...' : 'Send Now'}
                  </button>
                )}
                <button onClick={() => deleteCampaign(selectedCampaign.id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-body text-sm font-semibold rounded-lg transition-all">
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-cream rounded-xl p-3">
                <p className="font-heading font-bold text-xl text-charcoal">{selectedCampaign.total_recipients}</p>
                <p className="font-body text-xs text-charcoal/40">Recipients</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="font-heading font-bold text-xl text-green-600">{selectedCampaign.sent_count}</p>
                <p className="font-body text-xs text-charcoal/40">Delivered</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <p className="font-heading font-bold text-xl text-red-500">{selectedCampaign.failed_count}</p>
                <p className="font-body text-xs text-charcoal/40">Failed</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="font-heading font-bold text-xl text-blue-600">{SEGMENT_LABELS[selectedCampaign.segment] || selectedCampaign.segment}</p>
                <p className="font-body text-xs text-charcoal/40">Segment</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="font-heading font-bold text-xl text-purple-600">{selectedCampaign.sent_at ? new Date(selectedCampaign.sent_at).toLocaleDateString() : 'Not sent'}</p>
                <p className="font-body text-xs text-charcoal/40">Sent Date</p>
              </div>
            </div>
          </div>

          {/* Recipients */}
          {campaignRecipients.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h4 className="font-heading font-bold text-sm text-charcoal mb-4">Recipients ({campaignRecipients.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-body text-xs font-semibold text-charcoal/40 pb-3 uppercase tracking-wider">Name</th>
                      <th className="text-left font-body text-xs font-semibold text-charcoal/40 pb-3 uppercase tracking-wider">Email</th>
                      <th className="text-left font-body text-xs font-semibold text-charcoal/40 pb-3 uppercase tracking-wider">Status</th>
                      <th className="text-left font-body text-xs font-semibold text-charcoal/40 pb-3 uppercase tracking-wider">Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignRecipients.slice(0, 50).map(r => (
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="py-2 font-body text-sm text-charcoal">{r.name || '-'}</td>
                        <td className="py-2 font-body text-xs text-charcoal/60">{r.email}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                            r.status === 'sent' ? 'bg-green-50 text-green-700' :
                            r.status === 'failed' ? 'bg-red-50 text-red-600' :
                            'bg-gray-50 text-gray-500'
                          }`}>{r.status}</span>
                        </td>
                        <td className="py-2 font-body text-xs text-charcoal/40">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCampaigns;
