import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAvatar } from '@/hooks/useStudentAvatar';
import { supabase } from '@/lib/supabase';
import { compileStudentContext, createSessionState } from '@/lib/studentContext';
import type { SessionState, StudentContext } from '@/lib/studentContext';
import { analyzeResponse, updateSessionState, computeAdaptationSignals } from '@/lib/adaptationEngine';

import type { AdaptationSignals } from '@/lib/adaptationEngine';

const OWL_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292415727_993d7b38.jpg';



interface NextChoice { label: string; description: string; }
interface PlanInfo {
  topic: string; intent: string; strategy: string; concept: string; domains: string[];
  chunk?: { total_chunks: number; current_chunk: number; chunk_focus: string; needs_followup: boolean } | null;
  personalization?: Record<string, any> | null;
  engagementAssessment?: { student_seems: string; confidence_level: string } | null;
}
interface Message {
  id: number; sender: 'student' | 'mentor'; text: string; timestamp: string;
  nextChoices?: NextChoice[]; plan?: PlanInfo; audioUrl?: string;
}

// ─── MARKDOWN RENDERER ───
const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0, i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('### ')) { elements.push(<h4 key={key++} className="font-heading font-bold text-sm text-charcoal mt-3 mb-1">{renderInline(line.slice(4))}</h4>); i++; continue; }
    if (line.startsWith('## ')) { elements.push(<h3 key={key++} className="font-heading font-bold text-base text-charcoal mt-4 mb-1">{renderInline(line.slice(3))}</h3>); i++; continue; }
    if (line.startsWith('# ')) { elements.push(<h2 key={key++} className="font-heading font-bold text-lg text-charcoal mt-4 mb-1">{renderInline(line.slice(2))}</h2>); i++; continue; }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) { items.push(lines[i].trim().replace(/^[-*]\s/, '')); i++; }
      elements.push(<ul key={key++} className="space-y-1.5 my-2">{items.map((item, idx) => (<li key={idx} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal/40 flex-shrink-0 mt-2" /><span className="leading-relaxed">{renderInline(item)}</span></li>))}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, '')); i++; }
      elements.push(<ol key={key++} className="space-y-1.5 my-2">{items.map((item, idx) => (<li key={idx} className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-teal">{idx + 1}</span></span><span className="leading-relaxed">{renderInline(item)}</span></li>))}</ol>);
      continue;
    }
    elements.push(<p key={key++} className="leading-relaxed my-1.5">{renderInline(line)}</p>); i++;
  }
  return <>{elements}</>;
};

const renderInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text, key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) parts.push(<span key={key++}>{remaining.substring(0, boldMatch.index)}</span>);
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length); continue;
    }
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) parts.push(<span key={key++}>{remaining.substring(0, italicMatch.index)}</span>);
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length); continue;
    }
    parts.push(<span key={key++}>{remaining}</span>); break;
  }
  return parts.length > 0 ? <>{parts}</> : text;
};

// ─── DOMAIN BADGES ───
const domainMeta: Record<string, { label: string; color: string; icon: string }> = {
  language_arts: { label: 'Language', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  math: { label: 'Math', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
  science: { label: 'Science', color: 'bg-green-50 text-green-600 border-green-200', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  social_studies: { label: 'Social Studies', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  critical_thinking: { label: 'Thinking', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  executive_function: { label: 'Planning', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
};

// ─── ENGAGEMENT INDICATOR ───
const EngagementIndicator: React.FC<{ score: number; signals: string[] }> = ({ score, signals }) => {
  const color = score > 0.7 ? 'text-green-500' : score > 0.4 ? 'text-amber-500' : 'text-red-400';
  const label = score > 0.7 ? 'Engaged' : score > 0.4 ? 'Moderate' : 'Low';
  return (
    <div className="flex items-center gap-1.5" title={`Engagement: ${(score * 100).toFixed(0)}%${signals.length > 0 ? ` | ${signals.join(', ')}` : ''}`}>
      <div className="flex gap-0.5">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
          <div key={i} className={`w-1 rounded-full transition-all ${score >= threshold ? 'bg-current' : 'bg-gray-200'} ${color}`}
            style={{ height: `${8 + i * 2}px` }} />
        ))}
      </div>
      <span className={`font-body text-[10px] font-semibold ${color}`}>{label}</span>
    </div>
  );
};

const AIChatPage: React.FC = () => {
  const { setCurrentPage, studentProfile, studentId } = useAppContext();
  const { user } = useAuth();
  const { avatar, normalized, refreshAvatar } = useStudentAvatar();
  const firstName = studentProfile.name?.split(' ')[0] || 'friend';


  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'planning' | 'responding'>('idle');
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [sessionDomains, setSessionDomains] = useState<Record<string, number>>({});
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [turnCount, setTurnCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // ─── SESSION STATE + ADAPTATION ───
  const [sessionState, setSessionState] = useState<SessionState>(createSessionState());
  const [adaptationSignals, setAdaptationSignals] = useState<AdaptationSignals | null>(null);
  const lastMessageTimestamp = useRef<number>(Date.now());
  const previousMessage = useRef<string>('');

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(
    studentProfile.communicationStyle === 'voice' || studentProfile.communicationStyle === 'both'
  );
  const [autoSpeak, setAutoSpeak] = useState(studentProfile.communicationStyle === 'voice');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Session timing
  const [sessionStartTime] = useState<number>(Date.now());
  const [breakActive, setBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const breakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSessionMinutes = useCallback(() => Math.floor((Date.now() - sessionStartTime) / 60000), [sessionStartTime]);

  // ─── COMPILE STUDENT CONTEXT (v2 — uses normalized tables) ───
  const getStudentContext = useCallback((): StudentContext => {
    // Determine timezone from browser
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Denver';

    return compileStudentContext(
      normalized,
      avatar,
      {
        student_id: studentId || 'unknown',
        preferred_name: firstName,
        grade_band: studentProfile.gradeBand || '6-8',
        timezone,
      },
      {
        subject: currentTopic || undefined,
      },
      {
        // Session metrics from current session state
        hint_usage_rate: sessionState.hintsUsed > 0 ? sessionState.hintsUsed / Math.max(1, sessionState.turnNumber) : undefined,
        retry_rate: sessionState.totalRetries > 0 ? sessionState.totalRetries / Math.max(1, sessionState.turnNumber) : undefined,
      },
    );
  }, [normalized, avatar, studentId, firstName, studentProfile.gradeBand, currentTopic, sessionState.hintsUsed, sessionState.totalRetries, sessionState.turnNumber]);


  // ─── INITIALIZATION ───
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const exploreTopic = sessionStorage.getItem('explore_topic');
    if (exploreTopic) {
      sessionStorage.removeItem('explore_topic');
      try {
        const { title, question } = JSON.parse(exploreTopic);
        const greeting: Message = {
          id: 1, sender: 'mentor',
          text: `Hey ${firstName}! I see you're curious about **${title}** — great pick. Let's figure out "${question}" together...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([greeting]);
        setTimeout(() => sendMessageWithText(question, [greeting]), 100);
        return;
      } catch (e) { /* fallback */ }
    }
    setMessages([{
      id: 1, sender: 'mentor',
      text: `Hey ${firstName}! What fascinates you today?\n\nYou can tell me about anything — a question that's been bugging you, something you saw, a random thought. I'll find a way to make it the most interesting thing you've explored all week.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Break timer
  useEffect(() => {
    if (breakActive && breakTimeLeft > 0) {
      breakTimerRef.current = setInterval(() => {
        setBreakTimeLeft(prev => {
          if (prev <= 1) {
            setBreakActive(false);
            if (breakTimerRef.current) clearInterval(breakTimerRef.current);
            setMessages(prev => [...prev, {
              id: Date.now(), sender: 'mentor',
              text: `Welcome back, ${firstName}! Your brain just got a nice reset. Want to keep going where we left off, or has something new caught your attention?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
            // Reset session state after break
            setSessionState(prev => ({ ...prev, messagesSinceBreak: 0, breaksTaken: prev.breaksTaken + 1 }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (breakTimerRef.current) clearInterval(breakTimerRef.current); };
  }, [breakActive, breakTimeLeft]);

  const startBreak = () => { setBreakActive(true); setBreakTimeLeft(15 * 60); };
  const endBreakEarly = () => {
    setBreakActive(false); setBreakTimeLeft(0);
    if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    setSessionState(prev => ({ ...prev, messagesSinceBreak: 0, breaksTaken: prev.breaksTaken + 1 }));
    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'mentor',
      text: `Back already? That's the energy of someone who's onto something good. Where were we?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };
  const formatBreakTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── VOICE ───
  const speakText = async (text: string) => {
    if (!voiceEnabled || isSpeaking) return;
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setIsSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-tts', {
        body: { text: text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/##?\s/g, '') },
      });
      if (error) throw error;
    } catch (err) { /* silent */ }
    finally { setIsSpeaking(false); }
  };

  const stopSpeaking = () => {
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setIsSpeaking(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          const b64 = await new Promise<string>((res) => { reader.onloadend = () => res((reader.result as string).split(',')[1]); reader.readAsDataURL(blob); });
          const { data, error } = await supabase.functions.invoke('voice-stt', { body: { audio: b64, mimeType: mr.mimeType } });
          if (data?.text?.trim()) { setInput(data.text.trim()); if (autoSpeak) setTimeout(() => sendMessageWithText(data.text.trim()), 300); }
          else setError("Couldn't hear that clearly. Try again?");
        } catch { setError("Voice processing failed. Try typing instead."); }
        finally { setIsTranscribing(false); }
      };
      mr.start();
      setIsRecording(true);
    } catch { setError('Could not access microphone.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }
  };

  // ─── SEND MESSAGE (MAIN PIPELINE with adaptation loop) ───
  const sendMessageWithText = async (text: string, existingMessages?: Message[]) => {
    if (!text.trim() || isThinking || breakActive) return;
    setError(null);

    const now = Date.now();
    const responseTimeMs = now - lastMessageTimestamp.current;
    lastMessageTimestamp.current = now;

    // ─── STEP 1: Analyze the student's response for engagement signals ───
    const analysis = analyzeResponse(text, responseTimeMs, previousMessage.current);
    previousMessage.current = text;

    // ─── STEP 2: Update session state with new observations ───
    const currentMinutes = getSessionMinutes();
    const updatedState = updateSessionState(
      { ...sessionState, sessionMinutes: currentMinutes },
      analysis,
      messages[messages.length - 1]?.plan || null,
    );
    setSessionState(updatedState);

    // ─── STEP 3: Compute adaptation signals from session state ───
    const avatarEp = avatar?.engagement_profile || {};
    const signals = computeAdaptationSignals(
      updatedState,
      avatarEp.boredom_threshold_minutes || 20,
      avatarEp.frustration_tolerance || 0.5,
      avatarEp.attention_span_estimate || 'moderate',
    );
    setAdaptationSignals(signals);

    // ─── STEP 4: Compile Student Context Object ───
    const studentContext = getStudentContext();

    const currentMessages = existingMessages || messages;
    const userMessage: Message = {
      id: Date.now(), sender: 'student', text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updatedMessages = [...currentMessages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsThinking(true);
    setPipelineStage('planning');

    try {
      const conversationHistory = updatedMessages.slice(-20).map(m => ({ sender: m.sender, text: m.text }));
      const planningTimer = setTimeout(() => setPipelineStage('responding'), 2000);

      // ─── STEP 5: Send everything to the AI pipeline ───
      const { data, error: fnError } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: conversationHistory,
          studentProfile: {
            name: studentProfile.name,
            age: studentProfile.age,
            gradeLevel: studentProfile.gradeLevel || String(Math.max(1, studentProfile.age - 5)),
            gradeBand: studentProfile.gradeBand,
            interests: studentProfile.interests,
            learningStyle: studentProfile.learningStyle,
            personalityTraits: studentProfile.personalityTraits,
            strengths: studentProfile.strengths,
            communicationStyle: studentProfile.communicationStyle,
          },
          studentId: studentId || undefined,
          sessionId: sessionId || undefined,
          userId: user?.id || undefined,
          sessionMinutes: currentMinutes,
          // NEW: Student Context + Session State + Adaptation Signals
          studentContext,
          sessionState: updatedState,
          adaptationSignals: signals,
        },
      });

      clearTimeout(planningTimer);
      if (fnError) throw new Error(fnError.message || 'Failed to get response');

      const responseText = data?.message || "Hmm, I got a little lost in thought there! Could you ask me that again?";
      const newSessionId = data?.sessionId;
      if (newSessionId && !sessionId) setSessionId(newSessionId);

      // ─── STEP 6: Update session state from AI response ───
      if (data?.plan) {
        if (data.plan.topic) setCurrentTopic(data.plan.topic);
        // Update teaching format success based on AI's engagement assessment
        if (data.plan.engagementAssessment && data.plan.strategy) {
          setSessionState(prev => {
            const newState = { ...prev };
            const format = data.plan.strategy;
            const ea = data.plan.engagementAssessment;
            const wasSuccessful = ea.student_seems === 'engaged' || ea.student_seems === 'curious';
            const currentSuccess = newState.teachingFormatSuccess[format] || 0.5;
            newState.teachingFormatSuccess[format] = currentSuccess * 0.7 + (wasSuccessful ? 1.0 : 0.0) * 0.3;
            return newState;
          });
        }
      }
      if (data?.turnNumber) {
        setTurnCount(data.turnNumber);
        // ─── STEP 6b: Periodic avatar refresh (every 5 turns) ───
        // Server-side mentor-chat updates avatar tables after each turn.
        // We refresh the frontend's copy periodically so the compiled
        // StudentContext stays current for subsequent turns.
        if (data.turnNumber % 5 === 0) {
          refreshAvatar().catch(() => {}); // non-blocking background refresh
        }
      }

      // Track domains
      if (data?.skillsTracked) {
        setSessionDomains(prev => {
          const merged = { ...prev };
          for (const [key, val] of Object.entries(data.skillsTracked)) {
            if (typeof val === 'number' && val > 0) merged[key] = (merged[key] || 0) + val;
          }
          return merged;
        });
      }

      const mentorMessage: Message = {
        id: Date.now() + 1, sender: 'mentor', text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        nextChoices: data?.nextChoices || [],
        plan: data?.plan || undefined,
      };
      setMessages(prev => [...prev, mentorMessage]);

      // Reset response timestamp for next message timing
      lastMessageTimestamp.current = Date.now();

      if (autoSpeak || (voiceEnabled && studentProfile.communicationStyle === 'voice')) {
        setTimeout(() => speakText(responseText), 300);
      }
    } catch (err: any) {
      setError('Mentor had a brief brain freeze. Tap send to try again!');
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'mentor',
        text: "Oops! I had a little brain freeze. Could you try that again?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsThinking(false);
      setPipelineStage('idle');
    }
  };

  const sendMessage = () => sendMessageWithText(input);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleChoiceClick = (choice: NextChoice) => { sendMessageWithText(choice.label); };

  const suggestedPrompts = [
    "Why do stars twinkle?",
    "How do video games actually work?",
    "What's the weirdest animal on Earth?",
    "Could you survive on Mars?",
    "Why does music give you chills?",
    "How did they build the pyramids?",
  ];

  const activeDomains = Object.entries(sessionDomains).filter(([, v]) => v > 0);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ─── HEADER ─── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/60 transition-colors" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <img src={OWL_IMG} alt="Mentor" className="w-10 h-10 rounded-full object-cover border-2 border-teal/20" />
            <div>
              <h2 className="font-heading font-bold text-charcoal text-sm">Mentor</h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  pipelineStage === 'planning' ? 'bg-amber-400 animate-pulse' :
                  pipelineStage === 'responding' ? 'bg-blue-400 animate-pulse' :
                  isSpeaking ? 'bg-purple-400 animate-pulse' :
                  isRecording ? 'bg-red-400 animate-pulse' : 'bg-green-400'
                }`} />
                <span className="font-body text-xs text-charcoal/40">
                  {pipelineStage === 'planning' ? 'Planning...' :
                   pipelineStage === 'responding' ? 'Composing...' :
                   isSpeaking ? 'Speaking...' :
                   isRecording ? 'Listening...' :
                   isTranscribing ? 'Processing...' :
                   breakActive ? 'Break time!' : 'Online'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Engagement indicator */}
            {turnCount > 2 && (
              <div className="hidden sm:flex">
                <EngagementIndicator 
                  score={sessionState.engagementScore} 
                  signals={adaptationSignals?.signals_detected || []} 
                />
              </div>
            )}
            {/* Domain badges */}
            {activeDomains.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-teal-50 to-indigo-50 rounded-full border border-teal/10">
                {activeDomains.slice(0, 4).map(([key]) => {
                  const d = domainMeta[key];
                  if (!d) return null;
                  return (
                    <div key={key} className={`w-5 h-5 rounded-full flex items-center justify-center ${d.color} border`} title={d.label}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={d.icon}/></svg>
                    </div>
                  );
                })}
                {activeDomains.length > 4 && <span className="text-[9px] font-bold text-charcoal/30">+{activeDomains.length - 4}</span>}
              </div>
            )}
            {/* Current topic */}
            {currentTopic && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 rounded-full border border-teal/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span className="font-body text-xs font-semibold text-teal-700 truncate max-w-[120px]">{currentTopic}</span>
              </div>
            )}
            {/* Voice toggle */}
            <button
              onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) { setAutoSpeak(false); stopSpeaking(); } }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${voiceEnabled ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-charcoal/40'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {voiceEnabled ? (<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></>) : (<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>)}
              </svg>
              <span className="font-body text-xs font-semibold hidden sm:inline">{voiceEnabled ? 'Voice' : 'Muted'}</span>
            </button>
            {/* Timer */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="font-body text-xs font-semibold text-blue-700">{getSessionMinutes()}m</span>
            </div>
            {/* Safe badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span className="font-body text-xs font-semibold text-green-700 hidden sm:inline">Safe</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BREAK OVERLAY ─── */}
      {breakActive && (
        <div className="sticky top-[65px] z-10 bg-gradient-to-r from-emerald-500 to-teal text-white px-4 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>
              <h3 className="font-heading font-bold text-xl">Break Time!</h3>
            </div>
            <p className="font-body text-sm text-white/80 mb-2">Your brain just did some serious work. Time to recharge!</p>
            <div className="inline-flex items-center bg-white/20 rounded-2xl px-8 py-4 mb-4">
              <p className="font-heading font-bold text-4xl">{formatBreakTime(breakTimeLeft)}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={endBreakEarly} className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-body font-semibold text-sm transition-all">I'm ready</button>
              <button onClick={() => setBreakTimeLeft(prev => prev + 300)} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-body text-sm transition-all">+5 min</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'student' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              {msg.sender === 'mentor' && (
                <img src={OWL_IMG} alt="Mentor" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              )}
              <div className={`max-w-[80%] ${msg.sender === 'student' ? 'ml-auto' : ''}`}>
                <div className={`px-5 py-3 rounded-2xl ${
                  msg.sender === 'mentor'
                    ? 'bg-white text-charcoal border border-gray-100 rounded-tl-md shadow-sm'
                    : 'bg-teal text-white rounded-tr-md'
                }`}>
                  {msg.sender === 'mentor' ? (
                    <div className="font-body text-sm">{renderMarkdown(msg.text)}</div>
                  ) : (
                    <p className="font-body text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                  )}
                </div>

                {/* Timestamp + domain tags + listen button */}
                <div className={`flex items-center gap-2 mt-1 flex-wrap ${msg.sender === 'student' ? 'justify-end' : ''}`}>
                  <p className="font-body text-xs text-charcoal/30">{msg.timestamp}</p>
                  {msg.plan?.domains && msg.plan.domains.length > 0 && (
                    <div className="flex items-center gap-1">
                      {msg.plan.domains.map(d => {
                        const meta = domainMeta[d];
                        return meta ? (
                          <span key={d} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${meta.color} border`}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={meta.icon}/></svg>
                            {meta.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  {/* Chunk indicator */}
                  {msg.plan?.chunk && msg.plan.chunk.total_chunks > 1 && (
                    <span className="text-[9px] font-semibold text-charcoal/30 bg-gray-50 px-1.5 py-0.5 rounded-full">
                      Part {msg.plan.chunk.current_chunk}/{msg.plan.chunk.total_chunks}
                    </span>
                  )}
                  {msg.sender === 'mentor' && voiceEnabled && messages.indexOf(msg) > 0 && (
                    <button onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)} className="p-1 rounded-full text-charcoal/30 hover:text-teal hover:bg-teal-50 transition-all">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* ─── NEXT CHOICES ─── */}
                {msg.sender === 'mentor' && msg.nextChoices && msg.nextChoices.length > 0 && messages[messages.length - 1]?.id === msg.id && !isThinking && (
                  <div className="mt-3 space-y-2">
                    <p className="font-body text-xs text-charcoal/40 font-semibold">Where to next?</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.nextChoices.map((choice, idx) => (
                        <button key={idx} onClick={() => handleChoiceClick(choice)}
                          className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-teal hover:bg-teal-50/50 transition-all shadow-sm hover:shadow-md text-left">
                          <span className="w-6 h-6 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/20 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </span>
                          <div>
                            <span className="font-body text-sm font-semibold text-charcoal group-hover:text-teal transition-colors">{choice.label}</span>
                            {choice.description && <p className="font-body text-xs text-charcoal/40 mt-0.5">{choice.description}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex gap-3 animate-fade-in">
              <img src={OWL_IMG} alt="Mentor" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              <div className="bg-white rounded-2xl rounded-tl-md px-5 py-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-teal/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-teal/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-teal/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-body text-xs text-charcoal/30">
                    {pipelineStage === 'planning' ? 'Thinking about the best way to explore this...' : 'Putting together something great...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested prompts */}
          {messages.length === 1 && !isThinking && (
            <div className="pt-4 animate-fade-in">
              <p className="font-body text-xs text-charcoal/40 mb-3 text-center">Or try one of these...</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => sendMessageWithText(prompt)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-body text-xs text-charcoal/70 hover:border-teal hover:text-teal hover:bg-teal-50/50 transition-all shadow-sm hover:shadow-md">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── ERROR BANNER ─── */}
      {error && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-center">
          <p className="font-body text-xs text-amber-700">{error}</p>
        </div>
      )}

      {/* ─── RECORDING INDICATOR ─── */}
      {isRecording && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-body text-sm text-red-700 font-semibold">Listening... Tap the mic to stop</span>
          </div>
        </div>
      )}
      {isTranscribing && (
        <div className="bg-purple-50 border-t border-purple-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
            <span className="font-body text-sm text-purple-700 font-semibold">Processing your voice...</span>
          </div>
        </div>
      )}

      {/* ─── INPUT ─── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            {voiceEnabled && (
              <button onClick={isRecording ? stopRecording : startRecording} disabled={isThinking || breakActive || isTranscribing}
                className={`px-4 py-3 rounded-xl transition-all flex items-center justify-center ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-purple-50 hover:bg-purple-100 text-purple-600'} disabled:opacity-40`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            )}
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={breakActive ? "Enjoy your break!" : isRecording ? "Listening..." : "What's on your mind?"}
              disabled={isThinking || breakActive || isRecording}
              className="flex-1 px-5 py-3 rounded-xl bg-cream border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all placeholder:text-charcoal/30 disabled:opacity-50"
            />
            <button onClick={sendMessage} disabled={!input.trim() || isThinking || breakActive}
              className="px-5 py-3 bg-teal hover:bg-teal-dark text-white rounded-xl transition-all disabled:opacity-40 flex items-center gap-2">
              {isThinking ? (
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span className="font-body text-xs text-charcoal/30">End-to-end encrypted</span>
            </div>
            <span className="text-charcoal/20">|</span>
            <span className="font-body text-xs text-charcoal/30">COPPA compliant</span>
            {turnCount > 0 && (
              <>
                <span className="text-charcoal/20">|</span>
                <span className="font-body text-xs text-charcoal/30">Turn {turnCount}</span>
              </>
            )}
            {avatar && (
              <>
                <span className="text-charcoal/20">|</span>
                <span className="font-body text-xs text-teal/50">Personalized</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
