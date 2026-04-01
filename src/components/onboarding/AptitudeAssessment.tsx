import React, { useState, useEffect, useCallback } from 'react';
import { aptitudeQuestions, scoreAptitudeResults } from '@/lib/assessmentData';

interface Props {
  studentName: string;
  onComplete: (results: Record<string, number>) => void;
}

type Domain = 'reading' | 'math' | 'logic' | 'memory' | 'persistence';

const domainInfo: Record<Domain, { label: string; color: string; bgColor: string; description: string }> = {
  reading: { label: 'Reading', color: 'text-blue-600', bgColor: 'bg-blue-50', description: 'Comprehension & inference' },
  math: { label: 'Math', color: 'text-green-600', bgColor: 'bg-green-50', description: 'Reasoning & problem solving' },
  logic: { label: 'Logic', color: 'text-purple-600', bgColor: 'bg-purple-50', description: 'Patterns & deduction' },
  memory: { label: 'Memory', color: 'text-orange-600', bgColor: 'bg-orange-50', description: 'Recall & retention' },
  persistence: { label: 'Persistence', color: 'text-red-600', bgColor: 'bg-red-50', description: 'Problem-solving stamina' },
};

const domains: Domain[] = ['reading', 'math', 'logic', 'memory', 'persistence'];

const AptitudeAssessment: React.FC<Props> = ({ studentName, onComplete }) => {
  const [currentDomain, setCurrentDomain] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { questionId: string; selectedIndex: number; skipped?: boolean }[]>>({});
  const [completedDomains, setCompletedDomains] = useState<Set<string>>(new Set());

  // Memory game state
  const [memoryPhase, setMemoryPhase] = useState<'show' | 'recall' | 'done'>('show');
  const [memoryTimer, setMemoryTimer] = useState(10);
  const [memoryRecall, setMemoryRecall] = useState<string[]>([]);
  const [memoryInput, setMemoryInput] = useState('');

  const domain = domains[currentDomain];
  const domainQuestions = aptitudeQuestions[domain] || [];
  const q = domainQuestions[currentQ];
  const info = domainInfo[domain];

  // Memory timer
  useEffect(() => {
    if (domain === 'memory' && memoryPhase === 'show' && memoryTimer > 0) {
      const timer = setTimeout(() => setMemoryTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (domain === 'memory' && memoryPhase === 'show' && memoryTimer === 0) {
      setMemoryPhase('recall');
    }
  }, [domain, memoryPhase, memoryTimer]);

  const handleAnswer = (optionIndex: number) => {
    const domainAnswers = answers[domain] || [];
    const updated = [...domainAnswers];
    const existingIdx = updated.findIndex(a => a.questionId === q.id);
    if (existingIdx >= 0) {
      updated[existingIdx] = { questionId: q.id, selectedIndex: optionIndex };
    } else {
      updated.push({ questionId: q.id, selectedIndex: optionIndex });
    }
    setAnswers(prev => ({ ...prev, [domain]: updated }));

    // Auto-advance
    if (currentQ < domainQuestions.length - 1) {
      setTimeout(() => setCurrentQ(prev => prev + 1), 300);
    } else {
      // Domain complete
      setCompletedDomains(prev => new Set([...prev, domain]));
    }
  };

  const handleSkip = () => {
    const domainAnswers = answers[domain] || [];
    domainAnswers.push({ questionId: q.id, selectedIndex: -1, skipped: true });
    setAnswers(prev => ({ ...prev, [domain]: domainAnswers }));

    if (currentQ < domainQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      setCompletedDomains(prev => new Set([...prev, domain]));
    }
  };

  const handleMemorySubmit = () => {
    if (memoryInput.trim()) {
      setMemoryRecall(prev => [...prev, memoryInput.trim()]);
      setMemoryInput('');
    }
  };

  const handleMemoryDone = () => {
    // Score memory: how many items recalled correctly
    const items = q?.items || [];
    const correctCount = memoryRecall.filter(r =>
      items.some(item => item.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(item.toLowerCase()))
    ).length;
    const score = items.length > 0 ? correctCount / items.length : 0.5;

    setAnswers(prev => ({
      ...prev,
      memory: [{ questionId: q.id, selectedIndex: 0 }],
    }));
    setCompletedDomains(prev => new Set([...prev, 'memory']));
    // Store the actual score directly
    setAnswers(prev => ({
      ...prev,
      _memoryScore: [{ questionId: 'memory_score', selectedIndex: 0, skipped: false }] as any,
    }));
    // We'll handle memory scoring specially
    (window as any).__memoryScore = score;
  };

  const goToNextDomain = () => {
    if (currentDomain < domains.length - 1) {
      setCurrentDomain(prev => prev + 1);
      setCurrentQ(0);
      setMemoryPhase('show');
      setMemoryTimer(10);
      setMemoryRecall([]);
    }
  };

  const handleComplete = () => {
    const scores = scoreAptitudeResults(answers);
    // Override memory score with actual recall score
    if ((window as any).__memoryScore !== undefined) {
      scores.memory = (window as any).__memoryScore;
      delete (window as any).__memoryScore;
    }
    onComplete(scores);
  };

  const allDomainsComplete = completedDomains.size >= domains.length;
  const currentDomainComplete = completedDomains.has(domain);

  return (
    <div className="animate-fade-in">
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">
        Quick Skills Check
      </h2>
      <p className="font-body text-charcoal/60 text-center mb-1">
        A few quick questions to understand where {studentName} is starting from.
      </p>
      <p className="font-body text-xs text-teal text-center mb-6">
        This is NOT a test — it just helps us start at the right level. You can skip any question!
      </p>

      {/* Domain tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {domains.map((d, i) => {
          const dInfo = domainInfo[d];
          const isComplete = completedDomains.has(d);
          const isCurrent = i === currentDomain;
          return (
            <button
              key={d}
              onClick={() => { setCurrentDomain(i); setCurrentQ(0); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-body text-xs font-bold whitespace-nowrap transition-all ${
                isCurrent
                  ? `${dInfo.bgColor} ${dInfo.color} ring-2 ring-current/20`
                  : isComplete
                  ? 'bg-green-50 text-green-600'
                  : 'bg-gray-100 text-charcoal/40'
              }`}
            >
              {isComplete && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {dInfo.label}
            </button>
          );
        })}
      </div>

      {/* Domain content */}
      {!currentDomainComplete && q && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-bold ${info.bgColor} ${info.color}`}>
              {info.label}
            </span>
            <span className="font-body text-[10px] text-charcoal/30">{info.description}</span>
          </div>

          {/* Memory domain - special UI */}
          {domain === 'memory' ? (
            <div>
              {memoryPhase === 'show' && (
                <div>
                  <p className="font-heading font-bold text-base text-charcoal mb-4 mt-3">
                    Remember these items! They'll disappear in {memoryTimer} seconds.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {(q.items || []).map((item, i) => (
                      <div key={i} className="px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl text-center font-heading font-bold text-sm text-orange-700">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full transition-all duration-1000" style={{ width: `${(memoryTimer / 10) * 100}%` }} />
                  </div>
                  <button
                    onClick={() => setMemoryPhase('recall')}
                    className="mt-3 px-4 py-2 font-body text-xs text-charcoal/40 hover:text-charcoal transition-colors"
                  >
                    I'm ready — hide them now
                  </button>
                </div>
              )}

              {memoryPhase === 'recall' && (
                <div>
                  <p className="font-heading font-bold text-base text-charcoal mb-4 mt-3">
                    Now type as many items as you can remember:
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={memoryInput}
                      onChange={(e) => setMemoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleMemorySubmit()}
                      placeholder="Type an item and press Enter..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
                    />
                    <button
                      onClick={handleMemorySubmit}
                      className="px-4 py-3 bg-orange text-white font-body font-bold text-sm rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  {memoryRecall.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {memoryRecall.map((item, i) => (
                        <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full font-body text-xs font-semibold">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleMemoryDone}
                    className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl transition-all"
                  >
                    Done — I can't remember more
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Standard multiple choice */
            <div>
              <p className="font-heading font-bold text-base text-charcoal mb-4 mt-3 whitespace-pre-line">
                {q.question}
              </p>
              {q.subtext && (
                <p className="font-body text-xs text-charcoal/40 mb-3">{q.subtext}</p>
              )}
              <div className="space-y-2.5">
                {(q.options || []).map((opt, oi) => {
                  const domainAnswers = answers[domain] || [];
                  const currentAnswer = domainAnswers.find(a => a.questionId === q.id);
                  const isSelected = currentAnswer?.selectedIndex === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(oi)}
                      className={`w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 font-body text-sm ${
                        isSelected
                          ? `bg-gradient-to-r from-teal to-teal-dark text-white shadow-md`
                          : 'bg-cream text-charcoal/70 hover:bg-teal-50 border border-gray-200 hover:border-teal/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                          isSelected ? 'border-white/50 bg-white/20 text-white' : 'border-gray-300 text-charcoal/30'
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <span className="font-semibold">{opt.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 font-body text-xs text-charcoal/30 hover:text-charcoal/50 transition-colors"
                >
                  Skip this question
                </button>
                <span className="font-body text-xs text-charcoal/30">
                  {currentQ + 1} of {domainQuestions.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain complete message */}
      {currentDomainComplete && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="font-heading font-bold text-charcoal mb-1">{info.label} section complete!</p>
          <p className="font-body text-xs text-charcoal/40 mb-4">Great job, {studentName}!</p>
          {currentDomain < domains.length - 1 ? (
            <button
              onClick={goToNextDomain}
              className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl transition-all"
            >
              Next: {domainInfo[domains[currentDomain + 1]].label}
            </button>
          ) : null}
        </div>
      )}

      {/* Progress summary */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-charcoal/40">
            {completedDomains.size} of {domains.length} sections complete
          </span>
          <div className="flex gap-1">
            {domains.map(d => (
              <div key={d} className={`w-6 h-2 rounded-full ${completedDomains.has(d) ? 'bg-green-400' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Complete button */}
      {allDomainsComplete && (
        <div className="mt-6 text-center">
          <button
            onClick={handleComplete}
            className="px-8 py-3 bg-gradient-to-r from-teal to-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default AptitudeAssessment;
