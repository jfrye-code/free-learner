
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ContentModule {
  id: string; title: string; description: string; content: string; subject: string;
  grade_level: string | null; topic: string | null; difficulty: string;
  is_premium: boolean; is_published: boolean; image_url: string | null;
  tags: string[]; estimated_duration_minutes: number; created_at: string; updated_at: string;
}

const SUBJECTS = ['General', 'Math', 'Science', 'Reading', 'Writing', 'History', 'Art', 'Music', 'Technology', 'Social Studies', 'Physical Education'];
const GRADES = ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const AcademyManager: React.FC = () => {
  const [modules, setModules] = useState<ContentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
  const [editing, setEditing] = useState<ContentModule | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [form, setForm] = useState({
    title: '', description: '', content: '', subject: 'General', grade_level: '',
    topic: '', difficulty: 'beginner', is_premium: false, is_published: false,
    image_url: '', tags: '', estimated_duration_minutes: 15,
  });

  useEffect(() => { loadModules(); }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-modules', { body: { action: 'list-all' } });
      if (error) throw error;
      setModules(data?.modules || []);
    } catch (e: any) { showMsg(e.message, 'error'); }
    setLoading(false);
  };

  const showMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const resetForm = () => {
    setForm({ title: '', description: '', content: '', subject: 'General', grade_level: '', topic: '', difficulty: 'beginner', is_premium: false, is_published: false, image_url: '', tags: '', estimated_duration_minutes: 15 });
    setEditing(null);
  };

  const openEditor = (mod?: ContentModule) => {
    if (mod) {
      setEditing(mod);
      setForm({
        title: mod.title, description: mod.description || '', content: mod.content || '',
        subject: mod.subject, grade_level: mod.grade_level || '', topic: mod.topic || '',
        difficulty: mod.difficulty, is_premium: mod.is_premium, is_published: mod.is_published,
        image_url: mod.image_url || '', tags: (mod.tags || []).join(', '),
        estimated_duration_minutes: mod.estimated_duration_minutes || 15,
      });
    } else { resetForm(); }
    setView('editor');
  };

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) { showMsg('Title is required', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = {
        ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        grade_level: form.grade_level || null, topic: form.topic || null,
        image_url: form.image_url || null,
      };
      if (publish !== undefined) payload.is_published = publish;

      if (editing) {
        payload.action = 'update'; payload.id = editing.id;
      } else {
        payload.action = 'create';
      }

      const { data, error } = await supabase.functions.invoke('content-modules', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      showMsg(editing ? 'Module updated!' : 'Module created!', 'success');
      loadModules();
      setView('list');
      resetForm();
    } catch (e: any) { showMsg(e.message, 'error'); }
    setSaving(false);
  };

  const togglePublish = async (mod: ContentModule) => {
    try {
      const { error } = await supabase.functions.invoke('content-modules', {
        body: { action: 'toggle-publish', id: mod.id, is_published: !mod.is_published }
      });
      if (error) throw error;
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_published: !m.is_published } : m));
      showMsg(mod.is_published ? 'Unpublished' : 'Published!', 'success');
    } catch (e: any) { showMsg(e.message, 'error'); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Delete this content module?')) return;
    try {
      await supabase.functions.invoke('content-modules', { body: { action: 'delete', id } });
      setModules(prev => prev.filter(m => m.id !== id));
      showMsg('Module deleted', 'success');
    } catch (e: any) { showMsg(e.message, 'error'); }
  };

  const filteredModules = modules.filter(m => {
    if (filter === 'published') return m.is_published;
    if (filter === 'draft') return !m.is_published;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-body font-semibold text-sm text-white ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-xl text-charcoal">Content Modules</h2>
              <p className="font-body text-sm text-charcoal/40">{modules.length} modules ({modules.filter(m => m.is_published).length} published)</p>
            </div>
            <button onClick={() => openEditor()} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Module
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {(['all', 'published', 'draft'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all capitalize ${filter === f ? 'bg-teal text-white' : 'bg-gray-100 text-charcoal/50 hover:bg-gray-200'}`}>
                {f} ({f === 'all' ? modules.length : f === 'published' ? modules.filter(m => m.is_published).length : modules.filter(m => !m.is_published).length})
              </button>
            ))}
          </div>

          {filteredModules.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p className="font-heading font-bold text-charcoal mb-2">No content modules yet</p>
              <p className="font-body text-sm text-charcoal/40">Create your first learning module to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredModules.map(mod => (
                <div key={mod.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    {mod.image_url ? (
                      <img src={mod.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-heading font-bold text-sm text-charcoal truncate">{mod.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-bold ${mod.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-charcoal/40'}`}>
                          {mod.is_published ? 'Published' : 'Draft'}
                        </span>
                        {mod.is_premium && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-body text-[10px] font-bold">Premium</span>
                        )}
                      </div>
                      <p className="font-body text-xs text-charcoal/50 line-clamp-1">{mod.description}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="font-body text-[10px] text-charcoal/40">{mod.subject}</span>
                        {mod.grade_level && <span className="font-body text-[10px] text-charcoal/40">{mod.grade_level}</span>}
                        <span className="font-body text-[10px] text-charcoal/40 capitalize">{mod.difficulty}</span>
                        <span className="font-body text-[10px] text-charcoal/40">{mod.estimated_duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditing(mod); setForm({ ...form, content: mod.content || '' }); setView('preview'); }} className="p-2 hover:bg-gray-100 rounded-lg text-charcoal/30 hover:text-teal transition-all" title="Preview">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button onClick={() => openEditor(mod)} className="p-2 hover:bg-gray-100 rounded-lg text-charcoal/30 hover:text-teal transition-all" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => togglePublish(mod)} className={`p-2 rounded-lg transition-all ${mod.is_published ? 'hover:bg-amber-50 text-charcoal/30 hover:text-amber-600' : 'hover:bg-green-50 text-charcoal/30 hover:text-green-600'}`} title={mod.is_published ? 'Unpublish' : 'Publish'}>
                        {mod.is_published ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                      <button onClick={() => deleteModule(mod.id)} className="p-2 hover:bg-red-50 rounded-lg text-charcoal/30 hover:text-red-500 transition-all" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDITOR VIEW */}
      {view === 'editor' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => { setView('list'); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg text-charcoal/40 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h2 className="font-heading font-bold text-xl text-charcoal">{editing ? 'Edit Module' : 'Create Module'}</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSave(false)} disabled={saving} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-charcoal font-body text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all disabled:opacity-50">
                {saving ? 'Publishing...' : 'Save & Publish'}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Title *</label>
                    <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Introduction to Fractions" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this lesson..." rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Lesson Content (Markdown supported)</label>
                    <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your lesson content here... Use Markdown for formatting: # Heading, **bold**, *italic*, - list items" rows={16} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 resize-y font-mono" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar settings */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
                <h3 className="font-heading font-bold text-sm text-charcoal">Settings</h3>
                <div>
                  <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Subject</label>
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Grade Level</label>
                  <select value={form.grade_level} onChange={e => setForm(p => ({ ...p, grade_level: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30">
                    <option value="">All grades</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Topic</label>
                  <input type="text" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g., Algebra, Biology" className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30">
                    {DIFFICULTIES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Duration (minutes)</label>
                  <input type="number" value={form.estimated_duration_minutes} onChange={e => setForm(p => ({ ...p, estimated_duration_minutes: parseInt(e.target.value) || 15 }))} min={5} max={120} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Tags (comma separated)</label>
                  <input type="text" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g., math, fractions, numbers" className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Image URL</label>
                  <input type="url" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-body text-sm text-charcoal/70">Premium Content</span>
                  <button onClick={() => setForm(p => ({ ...p, is_premium: !p.is_premium }))} className={`w-10 h-5 rounded-full transition-all relative ${form.is_premium ? 'bg-amber-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${form.is_premium ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW VIEW */}
      {view === 'preview' && editing && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => { setView('list'); setEditing(null); }} className="p-2 hover:bg-gray-100 rounded-lg text-charcoal/40 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h2 className="font-heading font-bold text-xl text-charcoal">Preview: {editing.title}</h2>
            </div>
            <button onClick={() => openEditor(editing)} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all">
              Edit
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-3xl mx-auto">
            {editing.image_url && <img src={editing.image_url} alt="" className="w-full h-48 object-cover rounded-xl mb-6" />}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-teal-50 text-teal rounded-full font-body text-xs font-bold">{editing.subject}</span>
              {editing.grade_level && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-body text-xs font-bold">{editing.grade_level}</span>}
              <span className="px-3 py-1 bg-gray-100 text-charcoal/50 rounded-full font-body text-xs font-bold capitalize">{editing.difficulty}</span>
              {editing.is_premium && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-body text-xs font-bold">Premium</span>}
            </div>
            <h1 className="font-heading font-bold text-2xl text-charcoal mb-3">{editing.title}</h1>
            <p className="font-body text-charcoal/60 mb-6">{editing.description}</p>
            <div className="prose prose-sm max-w-none font-body text-charcoal/80 whitespace-pre-wrap">
              {editing.content || 'No content yet.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyManager;
