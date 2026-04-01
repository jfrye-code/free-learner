import React, { useState } from 'react';
import { learningPrefQuestions } from '@/lib/assessmentData';

interface Props {
  studentName: string;
  onComplete: (answers: Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>) => void;
  initialAnswers?: Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>;
}

const LearningPrefsAssessment: React.FC<Props> = ({ studentName, onComplete, initialAnswers }) => {
  const [answers, setAnswers] = useState<Record<string, number>>(
    initialAnswers?.reduce((acc, a) => ({ ...acc, [a.questionId]: a.selectedOption }), {}) || {}
  );
  const [currentQ, setCurrentQ] = useState(0);

  const questions = learningPrefQuestions;
  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [q.id]: optionIndex }));
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(prev => prev + 1), 300);
    }
  };

  const handleComplete = () => {
    const result = questions.map(q => ({
      questionId: q.id,
      selectedOption: answers[q.id] ?? 0,
      traits: q.options[answers[q.id] ?? 0]?.traits || {},
    }));
    onComplete(result);
  };

  // Compute learning style preview
  const computeStylePreview = () => {
    const styles: Record<string, number> = { visual: 0, auditory: 0, kinesthetic: 0, reading_writing: 0, social_learning: 0, solo_learning: 0 };
    const counts: Record<string, number> = {};
    for (const [qId, optIdx] of Object.entries(answers)) {
      const question = questions.find(q => q.id === qId);
      if (!question) continue;
      const opt = question.options[optIdx];
      if (!opt) continue;
      for (const [trait, val] of Object.entries(opt.traits)) {
        if (trait in styles) {
          styles[trait] += val;
          counts[trait] = (counts[trait] || 0) + 1;
        }
      }
    }
    for (const key of Object.keys(styles)) {
      styles[key] = styles[key] / Math.max(counts[key] || 1, 1);
    }
    return styles;
  };

  const stylePreview = computeStylePreview();
  const styleLabels: Record<string, { label: string; color: string; icon: string }> = {
    visual: { label: 'Visual', color: 'bg-blue-500', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    auditory: { label: 'Listening', color: 'bg-purple-500', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
    kinesthetic: { label: 'Hands-On', color: 'bg-orange-500', icon: 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11' },
    reading_writing: { label: 'Reading/Writing', color: 'bg-green-500', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    social_learning: { label: 'Social', color: 'bg-pink-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    solo_learning: { label: 'Independent', color: 'bg-teal-500', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">
        How Does {studentName} Learn Best?
      </h2>
      <p className="font-body text-charcoal/60 text-center mb-1">
        Understanding learning preferences helps us teach in the way that clicks best.
      </p>
      <p className="font-body text-xs text-teal text-center mb-6">
        Pick the answer that feels most true — there are no wrong choices!
      </p>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === currentQ
                ? 'bg-orange scale-125'
                : answers[questions[i].id] !== undefined
                ? 'bg-orange/40'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Current question */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange/10 flex items-center justify-center font-heading font-bold text-sm text-orange">
            {currentQ + 1}
          </span>
          <p className="font-heading font-bold text-base text-charcoal leading-snug">
            {q.question}
          </p>
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => handleAnswer(oi)}
              className={`w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 font-body text-sm ${
                answers[q.id] === oi
                  ? 'bg-orange text-white shadow-md ring-2 ring-orange/30'
                  : 'bg-cream text-charcoal/70 hover:bg-orange-50 border border-gray-200 hover:border-orange/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  answers[q.id] === oi ? 'border-white bg-white/20' : 'border-gray-300'
                }`}>
                  {answers[q.id] === oi && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
                <span className="font-semibold">{opt.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="px-4 py-2 font-body text-sm font-semibold text-charcoal/40 hover:text-charcoal disabled:opacity-30 transition-colors"
        >
          Previous
        </button>
        <span className="font-body text-xs text-charcoal/40">
          {answeredCount} of {questions.length} answered
        </span>
        {currentQ < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
            className="px-4 py-2 font-body text-sm font-semibold text-orange hover:text-orange-dark transition-colors"
          >
            Next
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Style preview */}
      {answeredCount >= 3 && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-100">
          <p className="font-body text-xs font-semibold text-charcoal/40 mb-3 text-center">
            Learning Style Preview
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(styleLabels).map(([key, { label, color, icon }]) => {
              const val = stylePreview[key] || 0;
              return (
                <div key={key} className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icon} />
                    </svg>
                    <span className="font-body text-xs font-semibold text-charcoal/70">{label}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(5, val * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete button */}
      {allAnswered && (
        <div className="mt-6 text-center">
          <button
            onClick={handleComplete}
            className="px-8 py-3 bg-orange hover:bg-orange-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningPrefsAssessment;
