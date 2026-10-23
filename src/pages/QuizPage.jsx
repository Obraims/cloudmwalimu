import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  XCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react';
import { seedQuestions } from '@/data/seedQuestions';
import { az900Domains, az900Topics } from '@/data/az900Outline';
import { useRouter } from '@/context/RouterContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export function QuizPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const location = useLocation();

  // Parse domain query param (e.g. ?domain=1, ?domain=2, ?domain=3)
  const initialDomain = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const d = parseInt(params.get('domain'), 10);
    return [1, 2, 3].includes(d) ? d : 0;
  }, [location.search]);

  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [allPool, setAllPool] = useState(seedQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  // Load questions from Supabase if configured, otherwise fallback to seedQuestions (90 questions)
  useEffect(() => {
    async function loadQuestions() {
      if (!isSupabaseConfigured()) {
        return;
      }

      try {
        const { data, error } = await supabase.from('questions').select('*');

        if (data && data.length > 0 && !error) {
          setAllPool(
            data.map((q) => ({
              id: q.id,
              domain_id: q.domain_id,
              topic_id: q.topic_id,
              objective: q.objective,
              question: q.question,
              options: q.options,
              answerIndex: q.correct_index,
              explanation: q.explanation,
              learnUrl: q.learn_url,
            }))
          );
        }
      } catch (err) {
        console.warn('Using embedded question bank:', err);
      }
    }

    loadQuestions();
  }, []);

  // Update selected domain when URL changes
  useEffect(() => {
    setSelectedDomain(initialDomain);
  }, [initialDomain]);

  // Filter questions based on selected domain
  const questions = useMemo(() => {
    if (selectedDomain === 0) return allPool;
    return allPool.filter((q) => q.domain_id === selectedDomain);
  }, [allPool, selectedDomain]);

  const handleDomainChange = (domainId) => {
    setSelectedDomain(domainId);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
  };

  const q = questions[index] || questions[0] || seedQuestions[0];
  const isLast = index === questions.length - 1;
  const finished = index >= questions.length;

  const domainLabel =
    q?.domain_id === 1
      ? 'Cloud Concepts'
      : q?.domain_id === 2
        ? 'Azure Architecture & Services'
        : 'Azure Management & Governance';

  const topicLabel =
    az900Topics.find((t) => t.id === q?.topic_id)?.name ||
    q?.objective ||
    q?.topic_id ||
    'Core Objective';

  const choose = async (i) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    const correct = i === q.answerIndex;
    if (correct) setScore((s) => s + 1);

    if (user?.id) {
      const attemptRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        user_id: user.id,
        question_id: q.id,
        domain_id: q.domain_id || 1,
        topic_id: q.topic_id || 'general',
        selected_index: i,
        is_correct: correct,
        mode: 'practice',
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured()) {
        try {
          const localAttempts = JSON.parse(localStorage.getItem('africloud_prep_attempts') || '[]');
          localAttempts.unshift(attemptRecord);
          localStorage.setItem('africloud_prep_attempts', JSON.stringify(localAttempts));
        } catch (e) {
          console.warn('Attempt local save notice:', e);
        }
      } else {
        try {
          await supabase.from('attempts').insert([attemptRecord]);
        } catch (err) {
          console.warn('Attempt sync notice:', err);
        }
      }

      // Add to flashcards if answered incorrectly
      if (!correct) {
        const cardRecord = {
          id: `card-${Date.now()}`,
          user_id: user.id,
          question_id: q.id,
          front: q.question,
          back: `${q.options[q.answerIndex]}\n\n💡 ${q.explanation}`,
          domain: domainLabel,
          box: 1,
          next_review: new Date().toISOString(),
          source: 'missed_quiz',
        };

        if (!isSupabaseConfigured()) {
          try {
            const localCards = JSON.parse(
              localStorage.getItem('africloud_prep_flashcards') || '[]'
            );
            localCards.unshift(cardRecord);
            localStorage.setItem('africloud_prep_flashcards', JSON.stringify(localCards));
          } catch (e) {
            console.warn('Flashcard local save notice:', e);
          }
        } else {
          try {
            await supabase.from('flashcards').insert([cardRecord]);
          } catch (err) {
            console.warn('Flashcard creation notice:', err);
          }
        }
      }
    }
  };

  const next = () => {
    setIndex((n) => n + 1);
    setSelected(null);
    setRevealed(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
  };

  if (finished) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-xl px-5 py-12 text-center sm:px-6 sm:py-20">
        <div className="bento-card border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212] p-8 sm:p-10">
          <span className="eyebrow">
            {selectedDomain === 0 ? 'Full Bank Quiz Completed' : `${domainLabel} Completed`}
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#101213] dark:text-[#F8FAFC]">
            You scored {score} of {questions.length} ({pct}%)
          </h2>
          <p className="mt-3 text-sm text-[#5B666E] dark:text-slate-400">
            {pct >= 80
              ? 'Excellent! You demonstrated strong mastery of these fundamentals.'
              : 'Keep practicing! Review missed concepts in flashcards to lift your score.'}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={restart}
              className="flex items-center gap-2 rounded-xl border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#181818] px-5 py-3 text-sm font-semibold text-slate-700 dark:text-[#F8FAFC] transition-colors hover:border-[#007BA7]"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <button
              onClick={() => handleDomainChange(0)}
              className="rounded-xl border border-[#007BA7]/40 bg-[#007BA7]/10 px-5 py-3 text-sm font-bold text-[#007BA7] hover:bg-[#007BA7] hover:text-white transition-all"
            >
              Practice All 90 Questions
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className="rounded-xl bg-[#007BA7] hover:bg-[#005C8A] px-5 py-3 text-sm font-bold text-white shadow-cerulean transition-all hover:scale-[1.02] active:scale-95"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6">
      {/* Domain Practice Filter Selector */}
      <div className="mb-6 rounded-2xl border border-[#DDE3E8] bg-white p-3 dark:border-[#242424] dark:bg-[#121212] shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#101213] dark:text-[#F8FAFC]">
            <Filter className="h-3.5 w-3.5 text-[#007BA7]" />
            <span>Practice by Official Domain</span>
          </div>
          <span className="text-[11px] font-semibold text-[#5B666E] dark:text-slate-400">
            {questions.length} questions in set
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleDomainChange(0)}
            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
              selectedDomain === 0
                ? 'bg-[#007BA7] text-white shadow-sm'
                : 'border border-[#DDE3E8] bg-[#EEF3F6] text-[#5B666E] hover:border-[#007BA7] hover:text-[#101213] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All 90 Questions
          </button>
          {az900Domains.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleDomainChange(d.id)}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all truncate ${
                selectedDomain === d.id
                  ? 'bg-[#007BA7] text-white shadow-sm'
                  : 'border border-[#DDE3E8] bg-[#EEF3F6] text-[#5B666E] hover:border-[#007BA7] hover:text-[#101213] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-400 dark:hover:text-white'
              }`}
              title={d.name}
            >
              {d.id}. {d.name} ({d.questionCount})
            </button>
          ))}
        </div>
      </div>

      {/* Question Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">{domainLabel}</span>
            <span className="text-[10px] font-bold text-[#5B666E] dark:text-slate-400">
              • {topicLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5B666E] dark:text-slate-400">
            Question {index + 1} of {questions.length}
          </p>
        </div>
        <span className="rounded-full border border-[#007BA7]/40 bg-[#007BA7]/15 px-3 py-1 text-xs font-bold text-[#007BA7]">
          Score: {score}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.3 }}
          className="bento-card border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212] p-6 sm:p-8"
        >
          <h2 className="text-lg font-bold leading-relaxed text-[#101213] dark:text-[#F8FAFC] sm:text-xl">
            {q.question}
          </h2>

          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => {
              const isPicked = selected === i;
              const isAnswer = i === q.answerIndex;
              let style =
                'border-[#DDE3E8] bg-white text-[#101213] hover:border-[#007BA7] hover:bg-slate-50 dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] dark:hover:bg-[#202020]';

              if (revealed) {
                if (isAnswer) {
                  style = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950/40 dark:text-emerald-200';
                } else if (isPicked) {
                  style = 'border-[#FF007F] bg-[#FF007F]/10 text-[#FF007F] font-semibold dark:bg-[#FF007F]/15';
                } else {
                  style = 'border-[#DDE3E8] text-[#5B666E] opacity-50 dark:border-[#242424]/40 dark:text-slate-400';
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-colors ${style}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>
                  {revealed && isAnswer && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  )}
                  {revealed && isPicked && !isAnswer && (
                    <XCircle className="h-5 w-5 shrink-0 text-[#FF007F]" />
                  )}
                </button>
              );
            })}
          </div>

          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border border-[#DDE3E8] bg-[#F0F4F8] dark:border-[#242424] dark:bg-[#181818] p-4 text-sm"
            >
              <div className="flex items-center gap-2 font-bold text-[#101213] dark:text-[#F8FAFC]">
                <Sparkles className="h-4 w-4 text-[#007BA7]" />
                <span>Explanation</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#5B666E] dark:text-slate-300">{q.explanation}</p>
              {q.learnUrl && (
                <a
                  href={q.learnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#007BA7] hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Read Microsoft Learn guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </motion.div>
          )}

          {revealed && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={next}
                className="flex items-center gap-2 rounded-xl bg-[#007BA7] hover:bg-[#005C8A] px-6 py-3 text-sm font-bold text-white shadow-cerulean transition-all hover:scale-[1.02] active:scale-95"
              >
                {isLast ? 'Complete Quiz' : 'Next Question'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
