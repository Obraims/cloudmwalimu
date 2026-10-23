import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Bot, BrainCircuit, Sparkles, Timer } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useTheme } from '@/context/ThemeContext';
import { APP_NAME } from '@/config/brand';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const officialDomains = [
  { id: 1, name: 'Cloud Concepts', weight: '25-30%', readiness: 85 },
  { id: 2, name: 'Azure Architecture & Services', weight: '35-40%', readiness: 72 },
  { id: 3, name: 'Azure Management & Governance', weight: '30-35%', readiness: 68 },
];

function MiniGauge({ value }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-[#DDE3E8] dark:stroke-[#242424] transition-colors" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="#007BA7"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tracking-tight text-[#101213] dark:text-[#F8FAFC]">{value}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5B666E] dark:text-slate-400">
          Readiness
        </span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { navigate } = useRouter();
  const { resolvedTheme } = useTheme();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-20">
      {/* Hero */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div variants={fadeUp} className="mb-6 flex justify-center">
          <img
            src={resolvedTheme === 'light' ? '/brand/logo-full-light.svg' : '/brand/logo-full-dark.svg'}
            alt={APP_NAME}
            className="h-14 sm:h-18 w-auto object-contain"
          />
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#007BA7]/40 bg-[#007BA7]/15 px-3.5 py-1.5 text-xs font-semibold text-[#007BA7]"
        >
          <Sparkles className="h-3.5 w-3.5" /> Unofficial AZ-900 prep for African learners
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-4xl font-extrabold tracking-tight text-[#101213] dark:text-[#F8FAFC] sm:text-6xl"
        >
          Study smart. <br />
          <span className="bg-gradient-to-r from-[#007BA7] via-[#00A3E0] to-[#FF007F] bg-clip-text text-transparent">
            Know when you're ready.
          </span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-6 text-base text-slate-300 sm:text-lg">
          Stop guessing your exam readiness. {APP_NAME} connects smart diagnostic quizzes,
          spaced-repetition flashcards, and an AI Study Buddy explaining Azure concepts through
          authentic Kenyan analogies.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#007BA7] to-[#FF007F] hover:from-[#005C8A] hover:to-[#D6006B] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#007BA7]/30 hover:shadow-[#FF007F]/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('auth')}
            className="rounded-xl border border-[#FF007F] bg-transparent px-5 py-3.5 text-sm font-semibold text-[#FF007F] transition-all hover:bg-[#FF007F] hover:text-white"
          >
            Create Free Account
          </button>
        </motion.div>
      </motion.div>

      {/* Bento Grid */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
        className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Card 1: Live Readiness */}
        <motion.div
          variants={fadeUp}
          className="bento-card bento-card-cerulean flex flex-col justify-between sm:col-span-2 lg:col-span-1 transition-all hover:scale-[1.008]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow">Real-time signal</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007BA7]/20 text-[#007BA7]">
                <BarChart3 className="h-4 w-4" />
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">Exam Readiness Gauge</h3>
            <p className="mt-1 text-sm text-[#5B666E] dark:text-slate-400">
              Deterministic readiness algorithm based on the official Microsoft Learn skills
              weights.
            </p>
          </div>
          <div className="my-6 flex flex-col items-center justify-center">
            <span className="mb-2 rounded-full border border-[#DDE3E8] bg-[#EEF3F6] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5B666E] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-400">
              Sample preview
            </span>
            <MiniGauge value={74} />
          </div>
          <div className="rounded-xl border border-[#DDE3E8] bg-[#EEF3F6] dark:border-[#242424] dark:bg-[#181818] p-3 text-xs text-[#101213] dark:text-slate-300 transition-colors">
            <span className="font-bold text-[#FF007F]">Next best action:</span> Raise Governance by
            9% to unlock exam-ready.
          </div>
        </motion.div>

        {/* Card 2: AI Study Buddy */}
        <motion.div
          variants={fadeUp}
          className="bento-card bento-card-rose flex flex-col justify-between sm:col-span-2 transition-all hover:scale-[1.008]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow-rose">Local analogies</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF007F]/20 text-[#FF007F]">
                <Bot className="h-4 w-4" />
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">AI Study Buddy</h3>
            <p className="mt-1 text-sm text-[#5B666E] dark:text-slate-400">
              Cloud concepts explained with Kenyan real-life examples - M-Pesa agents, matatus,
              SACCO keys, and county by-laws.
            </p>
          </div>

          <div className="my-4 space-y-2.5 rounded-xl border border-[#DDE3E8] bg-[#EEF3F6] dark:border-[#242424] dark:bg-[#181818] p-4 transition-colors">
            <div className="flex items-start gap-2.5">
              <span className="rounded-md bg-[#007BA7] px-2 py-0.5 text-[11px] font-bold text-white shrink-0">
                SW
              </span>
              <p className="text-xs font-semibold text-[#101213] dark:text-[#F8FAFC] leading-relaxed">
                "Availability Zone ni kama maduka tofauti ya wakala wa M-Pesa mtaani: moja likikosa
                stima, lingine mtaa wa pili linaendelea kuhudumia."
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="rounded-md bg-[#FF007F] px-2 py-0.5 text-[11px] font-bold text-white shrink-0">
                SH
              </span>
              <p className="text-xs font-semibold text-[#101213] dark:text-[#F8FAFC] leading-relaxed">
                "Azure Policy ni kama by-laws za county - lazima kila gari ipitie inspection ndio
                ishikwe na kanjo."
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('buddy')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#007BA7] hover:text-[#0095CC] hover:underline"
          >
            Chat with Study Buddy <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        {/* Card 3: Domain Breakdown */}
        <motion.div
          variants={fadeUp}
          className="bento-card flex flex-col justify-between sm:col-span-2"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="eyebrow">Skills measured</span>
                <span className="rounded-full border border-[#DDE3E8] bg-[#EEF3F6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5B666E] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-400">
                  Sample preview
                </span>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007BA7]/20 text-[#007BA7]">
                <BrainCircuit className="h-4 w-4" />
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">Three Official Domains</h3>
            <p className="mt-1 text-sm text-[#5B666E] dark:text-slate-400">
              90 practice questions aligned to the official Microsoft Learn outline.
            </p>
          </div>

          <div className="my-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {officialDomains.map((d) => (
              <div key={d.id} className="rounded-xl border border-[#DDE3E8] bg-[#EEF3F6] dark:border-[#242424] dark:bg-[#181818] p-3 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#5B666E] dark:text-slate-400">{d.weight}</span>
                  <span className="text-xs font-extrabold text-[#007BA7]">{d.readiness}%</span>
                </div>
                <p className="mt-1 text-xs font-bold text-[#101213] dark:text-[#F8FAFC] line-clamp-1">{d.name}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DDE3E8] dark:bg-[#242424]">
                  <div
                    className="h-full rounded-full bg-[#007BA7]"
                    style={{ width: `${d.readiness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('quiz')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#007BA7] hover:text-[#0095CC] hover:underline"
          >
            Practice questions <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        {/* Card 4: Leitner Spaced Repetition */}
        <motion.div
          variants={fadeUp}
          className="bento-card flex flex-col justify-between sm:col-span-1"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow-rose">Spaced repetition</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF007F]/20 text-[#FF007F]">
                <Timer className="h-4 w-4" />
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">Leitner Flashcard Coach</h3>
            <p className="mt-1 text-sm text-[#5B666E] dark:text-slate-400">
              5-box spaced repetition. Any missed quiz question automatically turns into a review
              card.
            </p>
          </div>

          <div className="my-4 flex items-center justify-between rounded-xl border border-[#DDE3E8] bg-[#EEF3F6] dark:border-[#242424] dark:bg-[#181818] p-3 text-xs transition-colors">
            <span className="font-semibold text-[#101213] dark:text-slate-300">Due today:</span>
            <span className="rounded-md bg-[#FF007F] px-2 py-0.5 font-bold text-white shadow-neonRose">
              Review Queue
            </span>
          </div>

          <button
            onClick={() => navigate('flashcards')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#007BA7] hover:text-[#0095CC] hover:underline"
          >
            Review cards <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
