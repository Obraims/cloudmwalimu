import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { defaultFlashcards } from '@/data/seedQuestions';
import { advanceCard } from '@/lib/leitner';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export function FlashcardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());

  useEffect(() => {
    async function loadFlashcards() {
      if (user?.id) {
        if (!isSupabaseConfigured()) {
          try {
            const localCards = JSON.parse(
              localStorage.getItem('africloud_prep_flashcards') || '[]'
            );
            if (localCards && localCards.length > 0) {
              setCards([...localCards, ...defaultFlashcards]);
              return;
            }
          } catch (e) {
            console.warn('Local flashcards load notice:', e);
          }
        } else {
          try {
            const { data } = await supabase.from('flashcards').select('*').eq('user_id', user.id);

            if (data && data.length > 0) {
              setCards(data);
              return;
            }
          } catch (e) {
            console.warn('Flashcard fetch notice:', e);
          }
        }
      }
      setCards(defaultFlashcards);
    }

    loadFlashcards();
  }, [user]);

  const cardList = cards.length > 0 ? cards : defaultFlashcards;
  const card = cardList[index] || cardList[0];

  const go = useCallback(
    (dir) => {
      setFlipped(false);
      setIndex((n) => (n + dir + cardList.length) % cardList.length);
    },
    [cardList.length]
  );

  const syncCardUpdate = useCallback(
    async (crd, updated) => {
      if (!user?.id) return;
      if (!isSupabaseConfigured()) {
        try {
          const localCards = JSON.parse(localStorage.getItem('africloud_prep_flashcards') || '[]');
          const updatedLocal = localCards.map((c) => (c.id === crd.id ? updated : c));
          localStorage.setItem('africloud_prep_flashcards', JSON.stringify(updatedLocal));
        } catch (e) {
          console.warn('Local flashcard update notice:', e);
        }
      } else if (crd.user_id) {
        try {
          await supabase
            .from('flashcards')
            .update({
              box: updated.box,
              next_review: updated.next_review,
              updated_at: new Date().toISOString(),
            })
            .eq('id', crd.id);
        } catch (e) {
          console.warn('Card sync notice:', e);
        }
      }
    },
    [user?.id]
  );

  const handleAnswer = useCallback(
    async (correct) => {
      if (!card) return;
      const updated = advanceCard(card, correct);
      const newCards = cardList.map((c) => (c.id === card.id ? updated : c));
      setCards(newCards);

      if (correct) {
        setKnown((s) => new Set(s).add(card.id));
      }

      await syncCardUpdate(card, updated);
      go(1);
    },
    [card, cardList, go, syncCardUpdate]
  );

  const markKnown = useCallback(() => handleAnswer(true), [handleAnswer]);
  const markRetry = useCallback(() => handleAnswer(false), [handleAnswer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        go(1);
      } else if (e.key === 'ArrowLeft') {
        go(-1);
      } else if (e.key === '1') {
        markRetry();
      } else if (e.key === '2') {
        markKnown();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [go, markKnown, markRetry]);

  if (!card) return null;

  return (
    <div className="mx-auto max-w-xl px-5 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="eyebrow">{card.domain || 'Cloud Concepts'}</span>
          <p className="mt-1 text-xs text-[#5B666E] dark:text-slate-400">
            Card {index + 1} of {cardList.length} Box {card.box || 1}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF007F]">
          <span>Known: {known.size}</span>
        </div>
      </div>

      {/* Flip Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="group relative h-80 w-full cursor-pointer perspective-1000"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bento-card border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212] relative flex h-full w-full flex-col justify-between p-8 text-center preserve-3d shadow-lifted"
        >
          {!flipped ? (
            <div className="flex h-full flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#007BA7]">
                Question
              </span>
              <p className="my-auto text-lg font-bold leading-relaxed text-[#101213] dark:text-[#F8FAFC] sm:text-xl">
                {card.front}
              </p>
              <p className="text-xs text-[#5B666E] dark:text-slate-500">Click or press Space to reveal answer</p>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-between [transform:rotateY(180deg)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF007F]">
                Answer & Explanation
              </span>
              <p className="my-auto text-sm leading-relaxed text-[#101213] dark:text-[#F8FAFC] sm:text-base whitespace-pre-line">
                {card.back}
              </p>
              <p className="text-xs text-[#5B666E] dark:text-slate-500">Press 1 for Retry, 2 for Got it</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DDE3E8] bg-white text-slate-700 hover:border-[#007BA7] hover:text-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-300 dark:hover:border-[#007BA7] dark:hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center justify-center gap-3">
          <button
            onClick={markRetry}
            className="flex-1 rounded-xl border border-[#FF007F] bg-rose-50 text-rose-700 dark:bg-[#FF007F]/15 dark:text-[#FF007F] py-3 text-xs font-bold transition-all hover:bg-[#FF007F] hover:text-white"
          >
            Review Soon (1)
          </button>
          <button
            onClick={markKnown}
            className="flex-1 rounded-xl bg-[#007BA7] hover:bg-[#005C8A] py-3 text-xs font-bold text-white shadow-cerulean transition-all hover:scale-[1.02] active:scale-95"
          >
            Got It! (2)
          </button>
        </div>

        <button
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DDE3E8] bg-white text-slate-700 hover:border-[#007BA7] hover:text-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-300 dark:hover:border-[#007BA7] dark:hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
