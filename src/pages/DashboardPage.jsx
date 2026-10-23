import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Target,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArcGauge } from '@/components/ArcGauge';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { calculateReadiness } from '@/lib/readiness';
import { az900Topics } from '@/data/az900Outline';

const WEEKLY_ACTIVITY = [
  { day: 'Mon', minutes: 25 },
  { day: 'Tue', minutes: 40 },
  { day: 'Wed', minutes: 30 },
  { day: 'Thu', minutes: 50 },
  { day: 'Fri', minutes: 35 },
  { day: 'Sat', minutes: 60 },
  { day: 'Sun', minutes: 20 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const DEFAULT_DOMAINS = [
  { id: 1, domain_id: 1, name: 'Cloud Concepts', weight: '25-30%', code: 'CC' },
  { id: 2, domain_id: 2, name: 'Azure Architecture & Services', weight: '35-40%', code: 'AAS' },
  { id: 3, domain_id: 3, name: 'Azure Management & Governance', weight: '30-35%', code: 'AMG' },
];

function DomainProgress({ id, name, weight, readiness, mastered, total, topicsList = [], onPractice }) {
  const [expanded, setExpanded] = useState(false);

  const cleanName =
    id === 1
      ? 'Cloud Concepts'
      : id === 2
        ? 'Azure Architecture & Services'
        : id === 3
          ? 'Azure Management & Governance'
          : name.replace(/^Describe\s+/i, '');

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#DDE3E8] bg-white p-4 dark:border-[#242424] dark:bg-[#121212] transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold leading-snug text-[#101213] dark:text-[#F8FAFC]">
            {cleanName}
          </p>
          <p className="mt-0.5 text-xs text-[#5B666E] dark:text-slate-400">Exam weight {weight}</p>
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-[#007BA7] shrink-0">{readiness}%</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#DDE3E8] dark:bg-[#242424]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF007F] to-[#D6006B] transition-all duration-500"
          style={{ width: `${readiness}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 font-semibold text-[#007BA7] hover:underline"
        >
          <span>{mastered} of {total} core topics mastered</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {onPractice && (
          <button
            type="button"
            onClick={() => onPractice(id)}
            className="rounded-lg bg-[#007BA7]/10 hover:bg-[#007BA7] hover:text-white px-2.5 py-1 text-[11px] font-bold text-[#007BA7] transition-all"
          >
            Practice
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 rounded-xl border border-[#DDE3E8] bg-[#EEF3F6] p-3 text-xs dark:border-[#242424] dark:bg-[#181818] animate-fade-up">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B666E] dark:text-slate-400">
            Core Topics ({topicsList.length})
          </p>
          <div className="space-y-1.5">
            {topicsList.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-[#DDE3E8] dark:bg-[#121212] dark:border-[#202020]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                      t.isMastered
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#DDE3E8] text-[#5B666E] dark:bg-[#242424] dark:text-slate-400'
                    }`}
                  >
                    {t.isMastered ? '✓' : '•'}
                  </span>
                  <span className="font-semibold text-[#101213] dark:text-[#F8FAFC]">
                    {t.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {t.questionCount} Qs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-[#181818]" />
        <div className="mt-3 h-8 w-64 rounded-lg bg-slate-200 dark:bg-[#181818]" />
        <div className="mt-2 h-4 w-96 rounded bg-slate-200 dark:bg-[#181818]" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bento-card md:col-span-2 h-80 border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212]" />
        <div className="bento-card h-80 border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212]" />
        <div className="bento-card md:col-span-2 h-64 border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212]" />
        <div className="bento-card h-64 border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212]" />
        <div className="bento-card md:col-span-3 h-48 border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212]" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [domains, setDomains] = useState(DEFAULT_DOMAINS);
  const [_topics, setTopics] = useState([]);
  const [studyPlanItems, setStudyPlanItems] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (!isSupabaseConfigured()) {
          const localAttempts = JSON.parse(localStorage.getItem('africloud_prep_attempts') || '[]');
          const localPlan = JSON.parse(localStorage.getItem('africloud_prep_study_plan') || 'null');
          if (isMounted) {
            setAttempts(localAttempts);
            setDomains(DEFAULT_DOMAINS);
            if (localPlan?.days) {
              const todayPlan = Array.isArray(localPlan.days)
                ? localPlan.days[0]?.tasks || localPlan.days[0]?.items || localPlan.days
                : [];
              if (todayPlan.length > 0) {
                setStudyPlanItems(
                  todayPlan.map((item, idx) => ({
                    id: item.id || `plan-${idx}`,
                    title: item.title || item.name || 'Core Domain Review',
                    domain: item.domain || 'Cloud Concepts',
                    minutes: item.minutes || item.duration || 20,
                    done: Boolean(item.done),
                  }))
                );
              }
            } else {
              setStudyPlanItems([
                {
                  id: 'p1',
                  title: 'Diagnostic Quiz across 3 domains',
                  domain: 'Cloud Concepts',
                  minutes: 15,
                  done: localAttempts.length > 0,
                },
                {
                  id: 'p2',
                  title: 'Review Availability Zones & Regions',
                  domain: 'Azure Architecture',
                  minutes: 20,
                  done: false,
                },
                {
                  id: 'p3',
                  title: 'Study Resource Groups & Locks',
                  domain: 'Azure Management',
                  minutes: 15,
                  done: false,
                },
              ]);
            }
            setLoading(false);
          }
          return;
        }

        const { data: attemptsData } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (isMounted && attemptsData) {
          setAttempts(attemptsData);
        }

        const { data: domainsData } = await supabase.from('domains').select('*').order('id');

        if (isMounted && domainsData && domainsData.length > 0) {
          setDomains(domainsData);
        }

        const { data: topicsData } = await supabase.from('topics').select('*');

        if (isMounted && topicsData) {
          setTopics(topicsData);
        }

        const { data: planData } = await supabase
          .from('study_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (isMounted && planData?.days) {
          const todayPlan = Array.isArray(planData.days)
            ? planData.days[0]?.tasks || planData.days[0]?.items || planData.days
            : [];
          if (todayPlan.length > 0) {
            setStudyPlanItems(
              todayPlan.map((item, idx) => ({
                id: item.id || `plan-${idx}`,
                title: item.title || item.name || 'Core Domain Review',
                domain: item.domain || 'Cloud Concepts',
                minutes: item.minutes || item.duration || 20,
                done: Boolean(item.done),
              }))
            );
          }
        } else if (isMounted) {
          setStudyPlanItems([
            {
              id: 'p1',
              title: 'Diagnostic Quiz across 3 domains',
              domain: 'Cloud Concepts',
              minutes: 15,
              done: attemptsData?.length > 0,
            },
            {
              id: 'p2',
              title: 'Review Availability Zones & Regions',
              domain: 'Azure Architecture',
              minutes: 20,
              done: false,
            },
            {
              id: 'p3',
              title: 'Study Resource Groups & Locks',
              domain: 'Azure Management',
              minutes: 15,
              done: false,
            },
          ]);
        }
      } catch (err) {
        console.warn('Dashboard live data fetch notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const readiness = calculateReadiness(attempts, domains);
  const readinessScore = readiness.total_answered >= 30 ? readiness.overall_accuracy : null;

  const domainEntries = Object.values(readiness.domain_readiness || {});
  let weakestDomainName = 'Governance';
  let weakestDomainAccuracy = null;
  domainEntries.forEach((d) => {
    if (d.accuracy !== null && d.accuracy !== undefined) {
      if (weakestDomainAccuracy === null || d.accuracy < weakestDomainAccuracy) {
        weakestDomainAccuracy = d.accuracy;
        weakestDomainName = d.name.replace('Describe ', '').replace('Azure ', '');
        if (weakestDomainName.includes('Management')) weakestDomainName = 'Governance';
      }
    }
  });
  const weakestDomainPassed = weakestDomainAccuracy !== null && weakestDomainAccuracy >= 70;
  const weakestDomainDisplay = weakestDomainAccuracy !== null ? `${weakestDomainAccuracy}% / 70%` : '— / 70%';

  const domainProgressList = domains.map((d) => {
    const domainId = d.id || d.domain_id;
    const r = readiness.domain_readiness[domainId];
    const domainAttempts = attempts.filter((a) => a.domain_id === domainId);
    const domainTopics = az900Topics.filter((t) => t.domain_id === domainId);
    const totalTopics = domainTopics.length || (domainId === 1 ? 3 : 4);

    const correctTopicIds = new Set(
      domainAttempts.filter((a) => a.is_correct && a.topic_id).map((a) => a.topic_id)
    );

    const mappedTopics = domainTopics.map((t) => ({
      ...t,
      isMastered: correctTopicIds.has(t.id),
    }));

    const mastered = Math.min(correctTopicIds.size, totalTopics);
    const calculatedPct = r?.accuracy !== null && r?.accuracy !== undefined ? r.accuracy : 0;

    return {
      id: domainId,
      name: d.name,
      weight: d.weight,
      readiness: calculatedPct,
      mastered,
      total: totalTopics,
      topicsList: mappedTopics,
    };
  });

  const streakDays = profile?.streak_days || 1;
  const hoursThisWeek = profile?.daily_hours
    ? `${Math.round(profile.daily_hours * 3.5)}h 15m`
    : '3h 45m';
  const totalMasteredTopics = domainProgressList.reduce((acc, curr) => acc + curr.mastered, 0);
  const totalTopicCount = domainProgressList.reduce((acc, curr) => acc + curr.total, 0) || 67;

  const nextAction = (() => {
    if (attempts.length === 0) {
      return {
        title: 'Start Diagnostic Quiz',
        minutes: 10,
        domain: 'AZ-900 Benchmark',
        route: 'quiz',
      };
    }
    const lowest = [...domainProgressList].sort((a, b) => a.readiness - b.readiness)[0];
    const incompletePlan = studyPlanItems.find((s) => !s.done);
    if (incompletePlan) {
      return {
        title: incompletePlan.title,
        minutes: incompletePlan.minutes,
        domain: incompletePlan.domain,
        route: 'flashcards',
      };
    }
    return {
      title: `Reinforce ${lowest.name}`,
      minutes: 15,
      domain: lowest.name,
      route: 'quiz',
    };
  })();

  const toggleTask = async (id) => {
    const updated = studyPlanItems.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setStudyPlanItems(updated);

    if (user?.id) {
      try {
        await supabase.from('study_plans').upsert({
          user_id: user.id,
          exam_date: profile?.exam_date || new Date().toISOString().split('T')[0],
          days: [{ tasks: updated }],
        });
      } catch (err) {
        console.warn('Could not persist study plan update:', err);
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-8">
        <span className="eyebrow">Readiness Tracker</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#101213] dark:text-[#F8FAFC] sm:text-4xl">
          Your AZ-900 readiness
        </h1>
        <p className="mt-2 max-w-lg text-[#5B666E] dark:text-slate-400">
          Updated after every quiz and review session. Aim for 80%+ before you book the exam.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Main gauge card — span 2 */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bento-card bento-card-cerulean md:col-span-2 flex flex-col transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow">Overall readiness</p>
              <h2 className="mt-1 text-xl font-bold text-[#101213] dark:text-[#F8FAFC]">
                {readiness.is_ready
                  ? 'Exam Ready! You are set to pass'
                  : readiness.gap_message || "Keep going — you're close"}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#007BA7]/40 bg-[#007BA7]/10 px-3 py-1 text-xs font-semibold text-[#007BA7]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {readiness.is_exam_ready ? 'Exam Ready' : (readiness.total_answered >= 30 ? 'In Progress' : 'Unranked')}
            </span>
          </div>

          <div className="mt-4 flex flex-1 flex-col items-center justify-center py-4">
            <ArcGauge
              value={readinessScore}
              label="Readiness"
              sublabel={readiness.total_answered >= 30 ? 'Target: 80% over last 50' : 'Min. 30 questions required'}
            />

            {/* 3-Line Readiness Checklist */}
            <div className="mt-4 w-full max-w-md space-y-2 rounded-xl border border-[#DDE3E8] bg-[#F6F8FA] dark:border-[#242424] dark:bg-[#141414] p-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#DDE3E8] dark:border-[#202020] pb-2">
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Readiness Rule Checklist
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  3 requirements
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#101213] dark:text-slate-300">
                  {readiness.total_answered >= 30 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-500 shrink-0">1</span>
                  )}
                  Questions answered (min. 30)
                </span>
                <span className={`font-mono font-bold ${readiness.total_answered >= 30 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {readiness.total_answered} / 30
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#101213] dark:text-slate-300">
                  {readiness.total_answered >= 30 && readiness.overall_accuracy >= 80 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-500 shrink-0">2</span>
                  )}
                  Overall accuracy (last 50, min. 80%)
                </span>
                <span className={`font-mono font-bold ${readiness.total_answered >= 30 && readiness.overall_accuracy >= 80 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {readiness.total_answered > 0 ? `${readiness.overall_accuracy}%` : '—'} / 80%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#101213] dark:text-slate-300">
                  {weakestDomainPassed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-500 shrink-0">3</span>
                  )}
                  Weakest domain ({weakestDomainName}, min. 70%)
                </span>
                <span className={`font-mono font-bold ${weakestDomainPassed ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {weakestDomainDisplay}
                </span>
              </div>
            </div>

            {/* Dynamic Gap Line */}
            <div className="mt-3 flex w-full max-w-md items-center gap-2 rounded-xl border border-[#007BA7]/30 bg-[#007BA7]/10 px-3.5 py-2.5 text-xs font-semibold text-[#007BA7]">
              <Target className="h-4 w-4 shrink-0 text-[#007BA7]" />
              <span>{readiness.gap_message}</span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-3 border-t border-[#DDE3E8] dark:border-[#242424] pt-5">
            <div>
              <p className="text-xs text-[#5B666E] dark:text-slate-400">Streak</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">
                <Flame className="h-4 w-4 text-orange-400" /> {streakDays} {streakDays === 1 ? 'day' : 'days'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#5B666E] dark:text-slate-400">This week</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">
                <Clock className="h-4 w-4 text-[#007BA7]" /> {hoursThisWeek}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#5B666E] dark:text-slate-400">Topics</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">
                <CheckCircle2 className="h-4 w-4 text-[#007BA7]" /> {totalMasteredTopics}/
                {totalTopicCount}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Next best action card (Cerulean + Neon Rose Mixture) */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bento-card bento-card-rose flex flex-col justify-between border-2 border-[#FF007F] shadow-sm transition-all"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF007F]">
              Next best action
            </p>
            <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-[#101213] dark:text-[#F8FAFC]">
              {nextAction.title}
            </h3>
            <div className="mt-3 flex items-center gap-2 text-sm text-[#5B666E] dark:text-slate-300">
              <Clock className="h-4 w-4 text-[#FF007F]" /> {nextAction.minutes} min ·{' '}
              {nextAction.domain}
            </div>
          </div>
          <button
            onClick={() => navigate(nextAction.route)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#D6006B] hover:from-[#D6006B] hover:to-[#B30059] px-5 py-3 text-sm font-bold text-[#FAF8F3] shadow-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            Start now <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Domain progress — span 2 */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bento-card md:col-span-2 flex flex-col gap-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-[#007BA7]" />
              <h2 className="text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">Per-domain progress</h2>
            </div>
            <span className="text-[11px] font-semibold text-[#5B666E] dark:text-slate-400 rounded-full border border-[#DDE3E8] bg-[#EEF3F6] px-2.5 py-0.5 dark:border-[#242424] dark:bg-[#181818]">
              90 practice questions across 11 core topics
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {domainProgressList.map((d) => (
              <DomainProgress key={d.id} {...d} onPractice={(domainId) => navigate(`quiz?domain=${domainId}`)} />
            ))}
          </div>
        </motion.div>

        {/* Weekly activity chart */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bento-card flex flex-col"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4.5 w-4.5 text-[#007BA7]" />
            <h2 className="text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">Study minutes</h2>
          </div>
          <p className="mt-1 text-xs text-[#5B666E] dark:text-slate-400">Last 7 days</p>
          <div className="mt-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_ACTIVITY} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: resolvedTheme === 'dark' ? '#94a3b8' : '#5B666E' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 123, 167, 0.12)' }}
                  contentStyle={{
                    backgroundColor: '#121212',
                    borderRadius: 12,
                    border: '1px solid #242424',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#007BA7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Study plan card — span 3 */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bento-card md:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-[#007BA7]" />
              <h2 className="text-lg font-bold text-[#101213] dark:text-[#F8FAFC]">Personal study plan</h2>
            </div>
            <span className="text-xs font-semibold text-[#FF007F]">
              {studyPlanItems.length} items today
            </span>
          </div>
          <ul className="divide-y divide-[#DDE3E8] dark:divide-[#242424]">
            {studyPlanItems.map((s) => (
              <li
                key={s.id}
                onClick={() => toggleTask(s.id)}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                      s.done
                        ? 'bg-gradient-to-r from-[#FF007F] to-[#D6006B] text-white'
                        : 'border-2 border-[#DDE3E8] dark:border-[#242424] text-transparent group-hover:border-[#FF007F]'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      s.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-[#101213] dark:text-[#F8FAFC]'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#5B666E] dark:text-slate-400">
                  <span className="hidden sm:inline">{s.domain}</span>
                  <span className="inline-flex items-center gap-1 text-[#007BA7]">
                    <Clock className="h-3.5 w-3.5" /> {s.minutes}m
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
