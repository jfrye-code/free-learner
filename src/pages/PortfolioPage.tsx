import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PortfolioData {
  id: string;
  title: string;
  bio: string;
  share_token: string;
  is_public: boolean;
  theme: string;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  project_type: string;
  file_url?: string;
  file_name?: string;
  ai_summary?: string;
  tags: string[];
  display_order: number;
  created_at: string;
}

interface CompletedPath {
  id: string;
  topic: string;
  modules: any[];
  completed_modules: number;
  total_modules: number;
  completed_at: string;
  created_at: string;
}

interface Badge {
  name: string;
  rarity: string;
  earned_at: string;
}

const PortfolioPage: React.FC = () => {
  const { studentProfile, setCurrentPage } = useAppContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [completedPaths, setCompletedPaths] = useState<CompletedPath[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'paths' | 'badges' | 'settings'>('overview');

  // Add project form
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', project_type: 'project', tags: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    if (user?.id) loadPortfolio();
  }, [user?.id]);

  const loadPortfolio = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get or create portfolio
      let { data: p } = await supabase.from('portfolios').select('*').eq('user_id', user.id).single();
      if (!p) {
        const { data: created } = await supabase.from('portfolios').insert({
          user_id: user.id,
          title: `${studentProfile.name}'s Learning Portfolio`,
        }).select().single();
        p = created;
      }
      if (p) setPortfolio(p);

      // Load projects
      const { data: projs } = await supabase.from('portfolio_projects')
        .select('*').eq('user_id', user.id).order('display_order');
      if (projs) setProjects(projs);

      // Load completed paths
      const { data: paths } = await supabase.from('learning_paths')
        .select('*').eq('user_id', user.id).not('completed_at', 'is', null)
        .order('completed_at', { ascending: false }).limit(20);
      if (paths) setCompletedPaths(paths);

      // Load earned badges
      const { data: earnedBadges } = await supabase.from('user_badges')
        .select('*, shop_catalog(name, rarity)').eq('user_id', user.id).order('earned_at', { ascending: false });
      if (earnedBadges) {
        setBadges(earnedBadges.map((b: any) => ({
          name: b.shop_catalog?.name || 'Badge',
          rarity: b.shop_catalog?.rarity || 'common',
          earned_at: b.earned_at,
        })));
      }
    } catch (err) {
      console.warn('Portfolio load error:', err);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/portfolio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('school-uploads').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('school-uploads').getPublicUrl(path);
      setUploadedFile({ url: urlData.publicUrl || path, name: file.name });
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  const addProject = async () => {
    if (!user?.id || !portfolio?.id || !newProject.title.trim()) return;
    setSaving(true);
    try {
      const { data } = await supabase.from('portfolio_projects').insert({
        portfolio_id: portfolio.id,
        user_id: user.id,
        title: newProject.title,
        description: newProject.description,
        project_type: newProject.project_type,
        file_url: uploadedFile?.url || null,
        file_name: uploadedFile?.name || null,
        tags: newProject.tags.split(',').map(t => t.trim()).filter(Boolean),
        display_order: projects.length,
      }).select().single();
      if (data) setProjects(prev => [...prev, data]);
      setNewProject({ title: '', description: '', project_type: 'project', tags: '' });
      setUploadedFile(null);
      setShowAddProject(false);
    } catch (err) {
      console.error('Add project error:', err);
    }
    setSaving(false);
  };

  const deleteProject = async (id: string) => {
    await supabase.from('portfolio_projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const togglePublic = async () => {
    if (!portfolio) return;
    const newVal = !portfolio.is_public;
    await supabase.from('portfolios').update({ is_public: newVal }).eq('id', portfolio.id);
    setPortfolio(prev => prev ? { ...prev, is_public: newVal } : prev);
  };

  const updatePortfolio = async (field: string, value: string) => {
    if (!portfolio) return;
    await supabase.from('portfolios').update({ [field]: value }).eq('id', portfolio.id);
    setPortfolio(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const copyShareLink = () => {
    if (!portfolio) return;
    const link = `${window.location.origin}?portfolio=${portfolio.share_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAISummary = async (projectId: string) => {
    setGeneratingSummary(true);
    try {
      const project = projects.find(p => p.id === projectId);
      const { data } = await supabase.functions.invoke('mentor-chat', {
        body: {
          message: `Generate a brief, professional 2-3 sentence summary of this student project for their portfolio: Title: "${project?.title}". Description: "${project?.description}". Tags: ${project?.tags?.join(', ')}. The student is in grade ${studentProfile.gradeLevel}. Write it in third person as if for a college application portfolio.`,
          studentName: studentProfile.name,
          age: studentProfile.age,
          gradeLevel: studentProfile.gradeLevel,
          interests: studentProfile.interests,
        },
      });
      if (data?.reply) {
        await supabase.from('portfolio_projects').update({ ai_summary: data.reply }).eq('id', projectId);
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ai_summary: data.reply } : p));
      }
    } catch (err) {
      console.error('AI summary error:', err);
    }
    setGeneratingSummary(false);
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !portfolio) return;

    const pathsHtml = completedPaths.map(p => `
      <div style="margin-bottom: 12px; padding: 12px; background: #f0fdfa; border-radius: 8px; border-left: 4px solid #0D7377;">
        <h4 style="margin: 0 0 4px; color: #1f2937; font-size: 14px;">${p.topic}</h4>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">${p.completed_modules}/${p.total_modules} modules completed · ${new Date(p.completed_at).toLocaleDateString()}</p>
      </div>
    `).join('');

    const projectsHtml = projects.map(p => `
      <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h4 style="margin: 0 0 4px; color: #1f2937;">${p.title}</h4>
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">${p.description}</p>
        ${p.ai_summary ? `<p style="margin: 0; color: #0D7377; font-size: 12px; font-style: italic; background: #f0fdfa; padding: 8px; border-radius: 4px;">${p.ai_summary}</p>` : ''}
        ${p.tags?.length ? `<div style="margin-top: 8px;">${p.tags.map(t => `<span style="display: inline-block; background: #e5e7eb; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 4px;">${t}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');

    const badgesHtml = badges.map(b => `
      <span style="display: inline-block; background: ${b.rarity === 'legendary' ? '#FFFBEB' : b.rarity === 'epic' ? '#F5F3FF' : b.rarity === 'rare' ? '#EFF6FF' : '#F0FDF4'}; border: 1px solid ${b.rarity === 'legendary' ? '#FCD34D' : b.rarity === 'epic' ? '#C4B5FD' : b.rarity === 'rare' ? '#93C5FD' : '#86EFAC'}; padding: 6px 14px; border-radius: 20px; font-size: 12px; margin: 3px; font-weight: 600;">${b.name}</span>
    `).join('');

    printWindow.document.write(`
      <html><head><title>${portfolio.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
        h1 { color: #0D7377; font-size: 28px; } h2 { color: #555; border-bottom: 2px solid #0D7377; padding-bottom: 8px; margin-top: 32px; }
        .stats { display: flex; gap: 16px; margin: 16px 0; }
        .stat { flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #0D7377; }
        .stat-label { font-size: 12px; color: #9ca3af; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${portfolio.title}</h1>
      <p style="color: #6b7280;">${studentProfile.name} · Grade ${studentProfile.gradeLevel} · Generated ${new Date().toLocaleDateString()}</p>
      ${portfolio.bio ? `<p style="color: #4b5563; line-height: 1.6; margin: 16px 0;">${portfolio.bio}</p>` : ''}
      
      <div class="stats">
        <div class="stat"><div class="stat-value">${completedPaths.length}</div><div class="stat-label">Paths Completed</div></div>
        <div class="stat"><div class="stat-value">${badges.length}</div><div class="stat-label">Badges Earned</div></div>
        <div class="stat"><div class="stat-value">${projects.length}</div><div class="stat-label">Projects</div></div>
        <div class="stat"><div class="stat-value">${studentProfile.streak}</div><div class="stat-label">Day Streak</div></div>
      </div>

      ${badges.length > 0 ? `<h2>Achievements & Badges</h2><div style="margin: 12px 0;">${badgesHtml}</div>` : ''}
      ${completedPaths.length > 0 ? `<h2>Completed Learning Paths</h2>${pathsHtml}` : ''}
      ${projects.length > 0 ? `<h2>Projects & Work Samples</h2>${projectsHtml}` : ''}

      <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;"/>
      <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">Generated by FreeLearner AI Learning Platform · ${new Date().toLocaleDateString()}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          <p className="font-body text-sm text-charcoal/50">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal via-teal-dark to-charcoal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-body text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <button onClick={exportPDF} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Export PDF
              </button>
              <button onClick={copyShareLink} className="px-4 py-2 bg-orange hover:bg-orange-dark text-white font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                {copied ? 'Copied!' : 'Share Link'}
              </button>
            </div>
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-2">{portfolio?.title || 'My Portfolio'}</h1>
          <p className="font-body text-white/60">{studentProfile.name} · Grade {studentProfile.gradeLevel} · Level {studentProfile.level}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Paths Completed', value: completedPaths.length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Badges Earned', value: badges.length, icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
              { label: 'Projects', value: projects.length, icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
              { label: 'Day Streak', value: studentProfile.streak, icon: 'M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <svg className="mx-auto mb-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d={s.icon}/></svg>
                <p className="font-heading font-bold text-2xl text-white">{s.value}</p>
                <p className="font-body text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'projects' as const, label: 'Projects' },
              { id: 'paths' as const, label: 'Learning Paths' },
              { id: 'badges' as const, label: 'Badges' },
              { id: 'settings' as const, label: 'Settings' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 font-body text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-3">About Me</h3>
                <p className="font-body text-sm text-charcoal/60 leading-relaxed">
                  {portfolio?.bio || `Hi! I'm ${studentProfile.name}. I love learning about ${studentProfile.interests.slice(0, 3).join(', ')} and more!`}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {studentProfile.interests.map(i => (
                    <span key={i} className="px-3 py-1 bg-teal-50 text-teal font-body text-xs font-semibold rounded-full">{i}</span>
                  ))}
                </div>
              </div>

              {/* Recent Paths */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Recent Learning Paths</h3>
                {completedPaths.length === 0 ? (
                  <p className="font-body text-sm text-charcoal/40">No completed paths yet. Keep learning!</p>
                ) : (
                  <div className="space-y-3">
                    {completedPaths.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-semibold text-charcoal truncate">{p.topic}</p>
                          <p className="font-body text-xs text-charcoal/40">{p.completed_modules}/{p.total_modules} modules · {new Date(p.completed_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Share Card */}
              <div className="bg-gradient-to-br from-teal-50 to-cream rounded-2xl p-6 border border-teal/10">
                <h3 className="font-heading font-bold text-sm text-charcoal mb-2">Share Your Portfolio</h3>
                <p className="font-body text-xs text-charcoal/50 mb-3">Generate a public link for college applications or homeschool documentation.</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-body text-xs text-charcoal/60">Public:</span>
                  <button onClick={togglePublic} className={`w-10 h-5 rounded-full transition-all relative ${portfolio?.is_public ? 'bg-teal' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${portfolio?.is_public ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <button onClick={copyShareLink} className="w-full py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all">
                  {copied ? 'Link Copied!' : 'Copy Share Link'}
                </button>
              </div>

              {/* Badges Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-sm text-charcoal mb-3">Badges ({badges.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {badges.slice(0, 8).map((b, i) => (
                    <span key={i} className={`px-3 py-1 rounded-full font-body text-xs font-semibold ${
                      b.rarity === 'legendary' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      b.rarity === 'epic' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      b.rarity === 'rare' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}>{b.name}</span>
                  ))}
                  {badges.length === 0 && <p className="font-body text-xs text-charcoal/40">No badges yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-xl text-charcoal">My Projects</h3>
              <button onClick={() => setShowAddProject(true)} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Project
              </button>
            </div>

            {/* Add Project Form */}
            {showAddProject && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-teal/20 mb-6">
                <h4 className="font-heading font-bold text-lg text-charcoal mb-4">New Project Entry</h4>
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1 block">Title</label>
                    <input type="text" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} placeholder="My Skateboard Design Project" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1 block">Description</label>
                    <textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Describe what you built, learned, or created..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-sm font-semibold text-charcoal/70 mb-1 block">Type</label>
                      <select value={newProject.project_type} onChange={e => setNewProject(p => ({ ...p, project_type: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30">
                        <option value="project">Project</option>
                        <option value="essay">Essay/Writing</option>
                        <option value="art">Art/Creative</option>
                        <option value="experiment">Experiment</option>
                        <option value="presentation">Presentation</option>
                        <option value="code">Code/Programming</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-body text-sm font-semibold text-charcoal/70 mb-1 block">Tags (comma separated)</label>
                      <input type="text" value={newProject.tags} onChange={e => setNewProject(p => ({ ...p, tags: e.target.value }))} placeholder="math, design, business" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1 block">Attach File (optional)</label>
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-cream border border-gray-200 rounded-lg font-body text-sm text-charcoal/60 hover:bg-gray-100 transition-all flex items-center gap-2">
                      {uploading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
                      {uploading ? 'Uploading...' : uploadedFile ? uploadedFile.name : 'Choose File'}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={addProject} disabled={saving || !newProject.title.trim()} className="px-6 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                      {saving ? 'Saving...' : 'Add to Portfolio'}
                    </button>
                    <button onClick={() => { setShowAddProject(false); setNewProject({ title: '', description: '', project_type: 'project', tags: '' }); setUploadedFile(null); }} className="px-6 py-2 bg-gray-100 text-charcoal/60 font-body text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Projects List */}
            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                <p className="font-heading font-bold text-charcoal mb-2">No projects yet</p>
                <p className="font-body text-sm text-charcoal/40 mb-4">Add your best work to showcase in your portfolio!</p>
                <button onClick={() => setShowAddProject(true)} className="px-6 py-2 bg-teal text-white font-body text-sm font-semibold rounded-lg">Add Your First Project</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="px-2 py-0.5 bg-teal-50 text-teal font-body text-xs font-semibold rounded-full capitalize">{p.project_type}</span>
                        <h4 className="font-heading font-bold text-charcoal mt-2">{p.title}</h4>
                      </div>
                      <button onClick={() => deleteProject(p.id)} className="p-1 hover:bg-red-50 rounded-lg text-charcoal/30 hover:text-red-500 transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                    <p className="font-body text-sm text-charcoal/60 mb-3">{p.description}</p>
                    {p.ai_summary && (
                      <div className="p-3 bg-teal-50/50 rounded-lg mb-3">
                        <p className="font-body text-xs text-teal-700 italic">{p.ai_summary}</p>
                      </div>
                    )}
                    {p.file_name && (
                      <div className="flex items-center gap-2 p-2 bg-cream rounded-lg mb-3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span className="font-body text-xs text-charcoal/60 truncate">{p.file_name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {p.tags?.map(t => <span key={t} className="px-2 py-0.5 bg-gray-100 text-charcoal/40 font-body text-[10px] rounded">{t}</span>)}
                      </div>
                      {!p.ai_summary && (
                        <button onClick={() => generateAISummary(p.id)} disabled={generatingSummary} className="font-body text-xs text-teal font-semibold hover:underline disabled:opacity-50">
                          {generatingSummary ? 'Generating...' : 'AI Summary'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PATHS TAB */}
        {activeTab === 'paths' && (
          <div>
            <h3 className="font-heading font-bold text-xl text-charcoal mb-6">Completed Learning Paths ({completedPaths.length})</h3>
            {completedPaths.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <p className="font-heading font-bold text-charcoal mb-2">No completed paths yet</p>
                <p className="font-body text-sm text-charcoal/40">Complete learning paths to add them to your portfolio!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedPaths.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-heading font-bold text-charcoal">{p.topic}</h4>
                        <p className="font-body text-xs text-charcoal/40">{p.completed_modules}/{p.total_modules} modules · Completed {new Date(p.completed_at).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-700 font-body text-xs font-bold rounded-full">Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BADGES TAB */}
        {activeTab === 'badges' && (
          <div>
            <h3 className="font-heading font-bold text-xl text-charcoal mb-6">Earned Badges ({badges.length})</h3>
            {badges.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <p className="font-heading font-bold text-charcoal mb-2">No badges yet</p>
                <p className="font-body text-sm text-charcoal/40">Keep learning to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((b, i) => (
                  <div key={i} className={`rounded-2xl p-5 text-center border ${
                    b.rarity === 'legendary' ? 'bg-amber-50 border-amber-200' :
                    b.rarity === 'epic' ? 'bg-purple-50 border-purple-200' :
                    b.rarity === 'rare' ? 'bg-blue-50 border-blue-200' :
                    'bg-teal-50 border-teal-200'
                  }`}>
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      b.rarity === 'legendary' ? 'bg-amber-200' : b.rarity === 'epic' ? 'bg-purple-200' : b.rarity === 'rare' ? 'bg-blue-200' : 'bg-teal-200'
                    }`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z M12 2a7 7 0 100 14 7 7 0 000-14z"/></svg>
                    </div>
                    <p className="font-heading font-bold text-sm text-charcoal">{b.name}</p>
                    <p className="font-body text-[10px] text-charcoal/40 capitalize mt-1">{b.rarity}</p>
                    <p className="font-body text-[10px] text-charcoal/30 mt-1">{new Date(b.earned_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Portfolio Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-1 block">Portfolio Title</label>
                  <input type="text" value={portfolio?.title || ''} onChange={e => updatePortfolio('title', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-1 block">Bio</label>
                  <textarea value={portfolio?.bio || ''} onChange={e => updatePortfolio('bio', e.target.value)} rows={4} placeholder="Tell people about yourself and your learning journey..." className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
                </div>
                <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                  <div>
                    <p className="font-body text-sm font-semibold text-charcoal">Public Portfolio</p>
                    <p className="font-body text-xs text-charcoal/40">Allow anyone with the link to view your portfolio</p>
                  </div>
                  <button onClick={togglePublic} className={`w-12 h-6 rounded-full transition-all relative ${portfolio?.is_public ? 'bg-teal' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${portfolio?.is_public ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-2">Share Link</h3>
              <p className="font-body text-xs text-charcoal/40 mb-3">Use this link for college applications, homeschool documentation, or sharing with family.</p>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={portfolio ? `${window.location.origin}?portfolio=${portfolio.share_token}` : ''} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 font-body text-xs bg-cream text-charcoal/60" />
                <button onClick={copyShareLink} className="px-4 py-2 bg-teal text-white font-body text-sm font-semibold rounded-lg">{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
