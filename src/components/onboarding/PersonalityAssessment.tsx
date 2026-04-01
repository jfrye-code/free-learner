import React, { useState } from 'react';
import { personalityQuestions, PersonalityQuestion } from '@/lib/assessmentData';

interface Props {
  studentName: string;
  onComplete: (answers: Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>) => void;
  initialAnswers?: Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>;
}

const PersonalityAssessment: React.FC<Props> = ({ studentName, onComplete, initialAnswers }) => {
  const [answers, setAnswers] = useState<Record<string, number>>(
    initialAnswers?.reduce((acc, a) => ({ ...acc, [a.questionId]: a.selectedOption }), {}) || {}
  );
  const [currentQ, setCurrentQ] = useState(0);

  const questions = personalityQuestions;
  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [q.id]: optionIndex }));
    // Auto-advance after a short delay
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

  // Big Five trait visualization
  const computeTraitPreview = () => {
    const traits: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const [qId, optIdx] of Object.entries(answers)) {
      const question = questions.find(q => q.id === qId);
      if (!question) continue;
      const opt = question.options[optIdx];
      if (!opt) continue;
      for (const [trait, val] of Object.entries(opt.traits)) {
        traits[trait] = (traits[trait] || 0) + val;
        counts[trait] = (counts[trait] || 0) + 1;
      }
    }
    // Normalize
    for (const key of Object.keys(traits)) {
      traits[key] = traits[key] / (counts[key] || 1);
    }
    return traits;
  };

  const traitPreview = computeTraitPreview();
  const bigFiveLabels: Record<string, { label: string; color: string; emoji: string }> = {
    openness: { label: 'Curiosity', color: 'bg-purple-500', emoji: '' },
    conscientiousness: { label: 'Organization', color: 'bg-blue-500', emoji: '' },
    extraversion: { label: 'Social Energy', color: 'bg-orange-500', emoji: '' },
    agreeableness: { label: 'Empathy', color: 'bg-green-500', emoji: '' },
    persistence_trait: { label: 'Persistence', color: 'bg-red-500', emoji: '' },
    creativity_orientation: { label: 'Creativity', color: 'bg-pink-500', emoji: '' },
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-charcoal text-center mb-2">
        Who is {studentName}?
      </h2>
      <p className="font-body text-charcoal/60 text-center mb-1">
        These scenarios help us understand {studentName}'s personality so our AI can match their style.
      </p>
      <p className="font-body text-xs text-teal text-center mb-6">
        No wrong answers — just pick what feels most natural!
      </p>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === currentQ
                ? 'bg-teal scale-125'
                : answers[questions[i].id] !== undefined
                ? 'bg-teal/40'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Current question */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center font-heading font-bold text-sm text-teal">
            {currentQ + 1}
          </span>
          <p className="font-heading font-bold text-base text-charcoal leading-snug">
            {q.scenario}
          </p>
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => handleAnswer(oi)}
              className={`w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 font-body text-sm ${
                answers[q.id] === oi
                  ? 'bg-teal text-white shadow-md ring-2 ring-teal/30'
                  : 'bg-cream text-charcoal/70 hover:bg-teal-50 border border-gray-200 hover:border-teal/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  answers[q.id] === oi ? 'border-white bg-white/20' : 'border-gray-300'
                }`}>
                  {answers[q.id] === oi && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
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
            className="px-4 py-2 font-body text-sm font-semibold text-teal hover:text-teal-dark transition-colors"
          >
            Next
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Trait preview (shows after 3+ answers) */}
      {answeredCount >= 3 && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-100">
          <p className="font-body text-xs font-semibold text-charcoal/40 mb-3 text-center">
            Personality Profile Preview
          </p>
          <div className="space-y-2">
            {Object.entries(bigFiveLabels).map(([key, { label, color }]) => {
              const val = traitPreview[key] || 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="font-body text-xs text-charcoal/60 w-24 text-right">{label}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(5, val * 100)}%` }}
                    />
                  </div>
                  <span className="font-body text-xs text-charcoal/40 w-8">{(val * 10).toFixed(0)}</span>
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
            className="px-8 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalityAssessment;
