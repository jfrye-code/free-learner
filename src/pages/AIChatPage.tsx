import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseUrl, supabaseKey } from '@/lib/supabase';


const OWL_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292415727_993d7b38.jpg';

interface Message {
  id: number;
  sender: 'student' | 'mentor';
  text: string;
  timestamp: string;
  audioUrl?: string;
}

const welcomeMessage: Message = {
  id: 1,
  sender: 'mentor',
  text: "Hey there! I'm your buddy here at FreeLearner. What's on your mind today? You can ask me about anything — seriously, ANYTHING. I'll find a way to make it the most interesting thing you've ever explored. You can type or tap the microphone to talk to me!",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const AIChatPage: React.FC = () => {
  const { setCurrentPage, studentProfile } = useAppContext();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(
    studentProfile.communicationStyle === 'voice' || studentProfile.communicationStyle === 'both'
  );
  const [autoSpeak, setAutoSpeak] = useState(
    studentProfile.communicationStyle === 'voice'
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Session timing
  const [sessionStartTime] = useState<number>(Date.now());
  const [breakActive, setBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [breakMessage, setBreakMessage] = useState('');
  const breakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSessionMinutes = useCallback(() => {
    return Math.floor((Date.now() - sessionStartTime) / 60000);
  }, [sessionStartTime]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Break timer
  useEffect(() => {
    if (breakActive && breakTimeLeft > 0) {
      breakTimerRef.current = setInterval(() => {
        setBreakTimeLeft(prev => {
          if (prev <= 1) {
            setBreakActive(false);
            if (breakTimerRef.current) clearInterval(breakTimerRef.current);
            const returnMsg: Message = {
              id: Date.now(),
              sender: 'mentor',
              text: "Welcome back! I hope that felt good. Your brain is all refreshed and ready for more awesome stuff. So, where were we? Want to keep exploring what we were talking about, or dive into something totally new?",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, returnMsg]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    };
  }, [breakActive, breakTimeLeft]);

  const startBreak = (durationMinutes: number = 10) => {
    setBreakActive(true);
    setBreakTimeLeft(durationMinutes * 60);
    setBreakMessage("Time for a break! Get some water, move around, and come back refreshed.");
  };

  const endBreakEarly = () => {
    setBreakActive(false);
    setBreakTimeLeft(0);
    if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    const returnMsg: Message = {
      id: Date.now(),
      sender: 'mentor',
      text: "Back already? Nice! Let's keep the momentum going. What do you want to explore next?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, returnMsg]);
  };

  const formatBreakTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── VOICE: Text-to-Speech ───
  const speakText = async (text: string) => {
    if (!voiceEnabled || isSpeaking) return;
    
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsSpeaking(true);
    try {
      const response = await fetch(
        `${(supabase as any).supabaseUrl}/functions/v1/voice-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
      };
      
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // ─── VOICE: Speech-to-Text (Recording) ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        await transcribeAudio(audioBlob, mediaRecorder.mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const response = await fetch(
        `${(supabase as any).supabaseUrl}/functions/v1/voice-stt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
          },
          body: JSON.stringify({ audio: base64Audio, mimeType }),
        }
      );

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.text && data.text.trim()) {
        setInput(data.text.trim());
        // Auto-send if voice mode
        if (autoSpeak) {
          setTimeout(() => {
            sendMessageWithText(data.text.trim());
          }, 300);
        }
      } else {
        setError("I couldn't hear that clearly. Could you try again?");
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError("Couldn't transcribe your voice. Try again or type instead.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // ─── SEND MESSAGE ───
  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isTyping || breakActive) return;
    setError(null);

    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'student',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const conversationHistory = [...messages, userMessage]
        .slice(-20)
        .filter(m => m.id !== 1 || messages.length <= 1)
        .map(m => ({ sender: m.sender, text: m.text }));

      const { data, error: fnError } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: conversationHistory,
          studentProfile: {
            name: studentProfile.name,
            age: studentProfile.age,
            gradeLevel: studentProfile.gradeLevel || String(Math.max(1, studentProfile.age - 5)),
            interests: studentProfile.interests,
            grades: studentProfile.grades || [],
            learningStyle: studentProfile.learningStyle,
            personalityTraits: studentProfile.personalityTraits,
            strengths: studentProfile.strengths,
            entrepreneurialInterest: studentProfile.entrepreneurialInterest,
            handsOnPreference: studentProfile.handsOnPreference,
            socialPreference: studentProfile.socialPreference,
            creativeVsAnalytical: studentProfile.creativeVsAnalytical,
          },
          sessionId: sessionId || undefined,
          userId: user?.id || undefined,
          sessionMinutes: getSessionMinutes(),
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to get response from Mentor');
      }

      const responseText = data?.message || "Hmm, I got a little lost in thought there! Could you ask me that again?";
      const newSessionId = data?.sessionId;

      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }

      if (data?.breakSuggested) {
        setTimeout(() => {
          if (!breakActive) {
            setBreakMessage("Mentor suggested a break! Ready to take one?");
          }
        }, 2000);
      }

      const mentorMessage: Message = {
        id: messages.length + 2,
        sender: 'mentor',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, mentorMessage]);

      // Auto-speak if voice mode enabled
      if (autoSpeak || (voiceEnabled && studentProfile.communicationStyle === 'voice')) {
        setTimeout(() => speakText(responseText), 300);
      }

    } catch (err: any) {
      console.error('Chat error:', err);
      setError('Mentor had a brief brain freeze. Tap send to try again!');
      const fallbackMessage: Message = {
        id: messages.length + 2,
        sender: 'mentor',
        text: "Oops! I had a little brain freeze there. Could you try asking me that again? I promise I'll have something awesome to share!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    "Tell me something cool about space",
    "Why is the sky blue?",
    "I love Minecraft, show me something cool",
    "How do video games work?",
    "What's the weirdest animal ever?",
    "I want to learn about skateboarding",
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/60 transition-colors"
              aria-label="Back to dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <img src={OWL_IMG} alt="Mentor" className="w-10 h-10 rounded-full object-cover border-2 border-teal/20" />
            <div>
              <h2 className="font-heading font-bold text-charcoal text-sm">Mentor</h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isSpeaking ? 'bg-purple-400' : isRecording ? 'bg-red-400' : 'bg-green-400'}`} />
                <span className="font-body text-xs text-charcoal/40">
                  {isTyping ? 'Thinking...' : isSpeaking ? 'Speaking...' : isRecording ? 'Listening...' : isTranscribing ? 'Processing...' : breakActive ? 'Break time!' : 'Online'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Voice toggle */}
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) {
                  setAutoSpeak(false);
                  stopSpeaking();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                voiceEnabled ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-charcoal/40'
              }`}
              title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {voiceEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                  </>
                )}
              </svg>
              <span className="font-body text-xs font-semibold hidden sm:inline">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
            {/* Auto-speak toggle */}
            {voiceEnabled && (
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                  autoSpeak ? 'bg-teal-50 text-teal' : 'bg-gray-100 text-charcoal/40'
                }`}
                title={autoSpeak ? 'Auto-speak on' : 'Auto-speak off'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span className="font-body text-xs font-semibold hidden sm:inline">Auto</span>
              </button>
            )}
            {/* Session timer */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="font-body text-xs font-semibold text-blue-700">{getSessionMinutes()}m</span>
            </div>
            {/* Privacy indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span className="font-body text-xs font-semibold text-green-700 hidden sm:inline">Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Break Timer Overlay */}
      {breakActive && (
        <div className="sticky top-[65px] z-10 bg-gradient-to-r from-emerald-500 to-teal text-white px-4 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/>
              </svg>
              <h3 className="font-heading font-bold text-xl">Break Time!</h3>
            </div>
            <p className="font-body text-sm text-white/80 mb-4">{breakMessage}</p>
            <div className="inline-flex items-center gap-4 bg-white/20 rounded-2xl px-8 py-4 mb-4">
              <p className="font-heading font-bold text-4xl">{formatBreakTime(breakTimeLeft)}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={endBreakEarly} className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-body font-semibold text-sm transition-all">
                I'm ready to continue
              </button>
              <button onClick={() => setBreakTimeLeft(prev => prev + 300)} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-body text-sm transition-all">
                +5 more minutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Break suggestion banner */}
      {breakMessage && !breakActive && getSessionMinutes() >= 40 && (
        <div className="sticky top-[65px] z-10 bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="font-body text-sm text-amber-800 font-semibold">You've been exploring for {getSessionMinutes()} minutes! Time for a break?</span>
            <div className="flex gap-2">
              <button onClick={() => startBreak(10)} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-body font-bold text-xs rounded-lg transition-all">
                Start 10min Break
              </button>
              <button onClick={() => setBreakMessage('')} className="px-3 py-1.5 text-amber-600 hover:text-amber-800 font-body text-xs transition-all">
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'student' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              {msg.sender === 'mentor' && (
                <img src={OWL_IMG} alt="Mentor" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              )}
              <div className={`max-w-[75%] ${msg.sender === 'student' ? 'ml-auto' : ''}`}>
                <div className={`px-5 py-3 rounded-2xl ${
                  msg.sender === 'mentor'
                    ? 'bg-teal text-white rounded-tl-md'
                    : 'bg-white text-charcoal border border-gray-200 rounded-tr-md'
                }`}>
                  <p className="font-body text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 ${msg.sender === 'student' ? 'justify-end' : ''}`}>
                  <p className="font-body text-xs text-charcoal/30">{msg.timestamp}</p>
                  {/* Speak button for mentor messages */}
                  {msg.sender === 'mentor' && voiceEnabled && msg.id !== 1 && (
                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)}
                      className={`p-1 rounded-full transition-all ${
                        isSpeaking ? 'text-purple-500 bg-purple-50' : 'text-charcoal/30 hover:text-teal hover:bg-teal-50'
                      }`}
                      title={isSpeaking ? 'Stop speaking' : 'Listen to this message'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {isSpeaking ? (
                          <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                        ) : (
                          <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></>
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <img src={OWL_IMG} alt="Mentor" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              <div className="bg-teal/10 rounded-2xl rounded-tl-md px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-teal/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-teal/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-teal/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggested prompts */}
          {messages.length === 1 && !isTyping && (
            <div className="pt-4 animate-fade-in">
              <p className="font-body text-xs text-charcoal/40 mb-3 text-center">Try asking something like...</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full font-body text-xs text-charcoal/70 hover:border-teal hover:text-teal hover:bg-teal-50/50 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-center">
          <p className="font-body text-xs text-amber-700">{error}</p>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-body text-sm text-red-700 font-semibold">Listening... Tap the microphone again to stop</span>
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

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            {/* Microphone button */}
            {voiceEnabled && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTyping || breakActive || isTranscribing}
                className={`px-4 py-3 rounded-xl transition-all flex items-center justify-center ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={breakActive ? "Enjoy your break! Come back when you're ready." : isRecording ? "Listening..." : "Ask Mentor anything..."}
              disabled={isTyping || breakActive || isRecording}
              className="flex-1 px-5 py-3 rounded-xl bg-cream border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all placeholder:text-charcoal/30 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping || breakActive}
              className="px-5 py-3 bg-teal hover:bg-teal-dark text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTyping ? (
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
            <span className="font-body text-xs text-charcoal/30">No personal data stored</span>
            <span className="text-charcoal/20">|</span>
            <span className="font-body text-xs text-charcoal/30">COPPA compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
