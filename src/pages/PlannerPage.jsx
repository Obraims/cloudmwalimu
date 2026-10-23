import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Download,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

const DEFAULT_DAYS = [
  {
    dayNumber: 1,
    domain: 'Cloud Concepts',
    domainColor: 'text-[#007BA7] border-[#007BA7]/30 bg-[#007BA7]/10',
    title: 'Cloud Models & Shared Responsibility',
    durationMinutes: 90,
    tasks: [
      'Learn IaaS vs PaaS vs SaaS using Kenyan analogies (Matatu ownership model)',
      'Review Cloud Benefits: High Availability, Scalability, Agility, Disaster Recovery',
      'Complete 15-question Cloud Concepts Diagnostic Quiz',
    ],
  },
  {
    dayNumber: 2,
    domain: 'Cloud Concepts',
    domainColor: 'text-[#007BA7] border-[#007BA7]/30 bg-[#007BA7]/10',
    title: 'CapEx vs OpEx & Consumption-Based Pricing',
    durationMinutes: 90,
    tasks: [
      'Understand Capital Expenditure vs Operational Expenditure differences',
      'Explore Azure consumption-based model (pay only for resources used)',
      'Practice 10 flashcards on cloud pricing and shared responsibility model',
    ],
  },
  {
    dayNumber: 3,
    domain: 'Cloud Concepts',
    domainColor: 'text-[#007BA7] border-[#007BA7]/30 bg-[#007BA7]/10',
    title: 'Public, Private & Hybrid Cloud Architectures',
    durationMinutes: 90,
    tasks: [
      'Master Public Cloud vs Private Cloud vs Hybrid Cloud (and Multi-cloud concept)',
      'Review Microsoft Azure Arc for hybrid infrastructure management',
      'Complete Cloud Concepts Domain Quiz with 80%+ accuracy target',
    ],
  },
  {
    dayNumber: 4,
    domain: 'Architecture & Services',
    domainColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    title: 'Regions, Availability Zones & Region Pairs',
    durationMinutes: 90,
    tasks: [
      'Understand Azure Geographies, Regions, and South Africa North datacenter',
      'Learn Availability Zones (physically separate datacenters with independent power/cooling)',
      'Review Azure Region Pairs and cross-region replication (minimum 300 miles apart)',
    ],
  },
  {
    dayNumber: 5,
    domain: 'Architecture & Services',
    domainColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    title: 'Compute: VMs, Containers, AKS & App Services',
    durationMinutes: 90,
    tasks: [
      'Compare Azure Virtual Machines vs Azure App Services vs Azure Functions (Serverless)',
      'Understand Containers vs Virtual Machines (Docker vs Azure Kubernetes Service AKS)',
      'Review Azure Virtual Desktop (AVD) for enterprise remote workforces',
    ],
  },
  {
    dayNumber: 6,
    domain: 'Architecture & Services',
    domainColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    title: 'Networking & Connectivity Fundamentals',
    durationMinutes: 90,
    tasks: [
      'Learn Azure Virtual Network (VNet), Subnets, and Network Security Groups (NSGs)',
      'Master Public IP vs Private IP, and Azure VPN Gateway vs ExpressRoute (private connection)',
      'Practice 12 networking flashcards on Leitner Box review',
    ],
  },
  {
    dayNumber: 7,
    domain: 'Architecture & Services',
    domainColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    title: 'Azure Storage: Blob, Disk, Files & Tiers',
    durationMinutes: 90,
    tasks: [
      'Understand Azure Blob Storage (Hot, Cool, Cold, and Archive access tiers)',
      'Compare Azure Files (SMB/NFS shares) vs Azure Disk Storage (managed disks)',
      'Learn Storage Redundancy: LRS, ZRS, GRS, and GZRS',
    ],
  },
  {
    dayNumber: 8,
    domain: 'Management & Governance',
    domainColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    title: 'Subscriptions, Management Groups & Resource Groups',
    durationMinutes: 90,
    tasks: [
      'Understand Azure Resource Hierarchy: Management Groups > Subscriptions > Resource Groups > Resources',
      'Learn Resource Tags for billing metadata and organization',
      'Master Cost Management & Budgets: setting threshold alerts before exam day',
    ],
  },
  {
    dayNumber: 9,
    domain: 'Management & Governance',
    domainColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    title: 'Governance, Azure Policy & Resource Locks',
    durationMinutes: 90,
    tasks: [
      'Master Azure Policy (enforcing rules and compliance across subscriptions)',
      'Understand Resource Locks: CanNotDelete vs ReadOnly locks (protecting production databases)',
      'Review Role-Based Access Control (Azure RBAC) vs Microsoft Entra ID permissions',
    ],
  },
  {
    dayNumber: 10,
    domain: 'Management & Governance',
    domainColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    title: 'Compliance, Defender for Cloud & Azure Advisor',
    durationMinutes: 90,
    tasks: [
      'Explore Microsoft Defender for Cloud and Secure Score recommendations',
      'Review Azure Advisor 5 pillars: Cost, Security, Reliability, Performance, Operational Excellence',
      'Complete Management & Governance Domain Quiz with target >= 70%',
    ],
  },
  {
    dayNumber: 11,
    domain: 'Exam Simulation',
    domainColor: 'text-[#FF007F] border-[#FF007F]/30 bg-[#FF007F]/10',
    title: 'Full-Length Timed Mock Exam (30 Questions)',
    durationMinutes: 90,
    tasks: [
      'Simulate official AZ-900 exam conditions: 30 questions under 45-minute countdown',
      'Review every missed question and examine the explanation breakdown',
      'Ask Study Buddy (Mwalimu) to clarify tricky questions in Swahili or English',
    ],
  },
  {
    dayNumber: 12,
    domain: 'Final Polish',
    domainColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    title: 'Readiness Rule Verification & Final Review',
    durationMinutes: 60,
    tasks: [
      'Confirm Dashboard readiness check: 30+ answers, 80%+ accuracy, 70%+ per domain',
      'Clear Box 4 and Box 5 Leitner flashcards to lock in memory',
      'Rest early and get ready to earn your Microsoft Certified Fundamentals badge!',
    ],
  },
];

const STORAGE_TICKS_KEY = 'africloud_planner_ticks_v1';

export function PlannerPage() {
  const { profile, updateProfile } = useAuth();
  const { navigate } = useRouter();

  const [examDate, setExamDate] = useState(() => {
    return profile?.exam_date || new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState(() => {
    return String(profile?.daily_hours || 1.5);
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  // Milestone tick-off state
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_TICKS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TICKS_KEY, JSON.stringify(completedTasks));
    } catch (e) {
      console.warn('Task save warning:', e);
    }
  }, [completedTasks]);

  const toggleTask = (taskId) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Days calculation
  const daysLeft = useMemo(() => {
    const target = new Date(examDate).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [examDate]);

  // Overall milestone progress
  const totalTasksCount = useMemo(() => {
    return DEFAULT_DAYS.reduce((acc, curr) => acc + curr.tasks.length, 0);
  }, []);

  const completedCount = useMemo(() => {
    return Object.values(completedTasks).filter(Boolean).length;
  }, [completedTasks]);

  const progressPercent = Math.round((completedCount / totalTasksCount) * 100);

  // Save profile changes
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveFeedback('');
    try {
      if (updateProfile) {
        await updateProfile({
          exam_date: examDate,
          daily_hours: Number(dailyHours),
        });
      }
      setSaveFeedback('Study settings updated successfully!');
      setTimeout(() => setSaveFeedback(''), 2500);
    } catch (err) {
      console.error('Settings update error:', err);
      setSaveFeedback('Settings saved locally.');
      setTimeout(() => setSaveFeedback(''), 2500);
    } finally {
      setSavingSettings(false);
    }
  };

  // Export to .ics calendar file
  const handleExportIcs = () => {
    const startDate = new Date();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AfriCloud Prep//AZ-900 Study Plan//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    DEFAULT_DAYS.forEach((planDay, idx) => {
      const eventDate = new Date();
      eventDate.setDate(startDate.getDate() + idx);
      eventDate.setHours(19, 0, 0, 0);

      const endDate = new Date(eventDate);
      const hoursNum = Number(dailyHours) || 1.5;
      endDate.setTime(endDate.getTime() + hoursNum * 60 * 60 * 1000);

      const formatIcsTime = (d) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const dtStamp = formatIcsTime(new Date());
      const dtStart = formatIcsTime(eventDate);
      const dtEnd = formatIcsTime(endDate);

      const taskDescriptions = planDay.tasks.map((t, i) => `${i + 1}. ${t}`).join('\\n');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:africloud-day-${planDay.dayNumber}-${Date.now()}@africloud.africa`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:AfriCloud Prep: Day ${planDay.dayNumber} - ${planDay.title}`);
      lines.push(`DESCRIPTION:Domain: ${planDay.domain}\\n\\nMilestones:\\n${taskDescriptions}\\n\\nStudy on AfriCloud Prep: https://africloud-prep.vercel.app`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    const icsContent = lines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'africloud-prep-az900-plan.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow flex items-center gap-1.5 text-xs font-bold text-[#007BA7]">
            <Sparkles className="h-3.5 w-3.5" /> Adaptive AZ-900 Study Plan
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#101213] dark:text-[#F8FAFC] sm:text-4xl">
            12-Day Study Planner
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#5B666E] dark:text-slate-400">
            A step-by-step curriculum mapped to all 3 exam domains. Tick off milestones as you study and sync your schedule with Google or Apple Calendar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportIcs}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007BA7] to-[#005C8A] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
        >
          <Download className="h-4 w-4" /> Export Calendar (.ics)
        </button>
      </div>

      {/* Top Controls Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="bento-card border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212] p-5 shadow-sm dark:shadow-lifted">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Settings</p>
          <form onSubmit={handleSaveSettings} className="mt-4 space-y-3">
            <div>
              <label htmlFor="plan-exam-date" className="mb-1 block text-xs font-semibold text-[#101213] dark:text-slate-300">
                Target Exam Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="plan-exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE3E8] bg-[#F6F8FA] py-2 pl-9 pr-3 text-xs font-medium text-[#101213] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] outline-none focus:border-[#007BA7]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="plan-daily-hours" className="mb-1 block text-xs font-semibold text-[#101213] dark:text-slate-300">
                Daily Study Commitment
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  id="plan-daily-hours"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE3E8] bg-[#F6F8FA] py-2 pl-9 pr-3 text-xs font-medium text-[#101213] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] outline-none focus:border-[#007BA7]"
                >
                  <option value="0.5">30 mins / day</option>
                  <option value="1">1 hour / day</option>
                  <option value="1.5">1.5 hours / day (Recommended)</option>
                  <option value="2">2 hours / day</option>
                  <option value="3">3 hours / day</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={savingSettings}
                className="rounded-lg bg-[#242424] px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-[#2c2c2c] hover:text-white"
              >
                {savingSettings ? 'Saving...' : 'Update Schedule'}
              </button>
              {saveFeedback && <span className="text-xs font-semibold text-emerald-400">{saveFeedback}</span>}
            </div>
          </form>
        </div>

        {/* Countdown & Total Hours Metric */}
        <div className="bento-card bento-card-cerulean flex flex-col justify-between border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212] p-5 shadow-sm dark:shadow-lifted">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#007BA7]">Exam Countdown</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#F8FAFC]">{daysLeft}</span>
              <span className="text-base font-semibold text-slate-400">{daysLeft === 1 ? 'day remaining' : 'days remaining'}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Target date: {new Date(examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="mt-4 border-t border-[#242424] pt-3">
            <p className="text-xs text-slate-400">Total Planned Study Time</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#F8FAFC]">
              <Clock className="h-4 w-4 text-[#007BA7]" />
              {(daysLeft * Number(dailyHours)).toFixed(1)} hours ({dailyHours} hrs/day)
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bento-card flex flex-col justify-between border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212] p-5 shadow-sm dark:shadow-lifted">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Curriculum Progress</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#F8FAFC]">{progressPercent}%</span>
              <span className="text-xs font-medium text-slate-400">({completedCount} of {totalTasksCount} tasks)</span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#202020]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#007BA7] to-[#FF007F] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#242424] pt-3 text-xs">
            <span className="text-slate-400">Ready to test?</span>
            <button
              type="button"
              onClick={() => navigate('quiz')}
              className="flex items-center gap-1 font-bold text-[#007BA7] hover:underline"
            >
              Start Quiz <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day by Day Plan Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#F8FAFC]">Daily Milestone Roadmap</h2>
          <span className="text-xs text-slate-400">Tick items off as you complete them</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {DEFAULT_DAYS.map((item) => {
            const allDayTasksDone = item.tasks.every((_, idx) => completedTasks[`day-${item.dayNumber}-${idx}`]);

            return (
              <motion.div
                key={item.dayNumber}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl border p-5 transition-all ${
                  allDayTasksDone
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-[#DDE3E8] bg-white hover:border-slate-300 dark:border-[#242424] dark:bg-[#121212] dark:hover:border-[#333]'
                }`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F0F4F8] text-xs font-extrabold text-[#101213] border border-[#DDE3E8] dark:bg-[#1c1c1c] dark:text-[#F8FAFC] dark:border-[#2b2b2b]">
                      D{item.dayNumber}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.domainColor}`}>
                          {item.domain}
                        </span>
                        <h3 className="text-base font-bold text-[#F8FAFC]">{item.title}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <Clock className="h-3.5 w-3.5" /> {item.durationMinutes} mins
                    </span>
                    {allDayTasksDone && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                        <Check className="h-3 w-3" /> Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Task Checklist for Day */}
                <div className="mt-4 space-y-2 border-t border-[#1c1c1c] pt-3">
                  {item.tasks.map((taskText, idx) => {
                    const taskId = `day-${item.dayNumber}-${idx}`;
                    const isDone = !!completedTasks[taskId];

                    return (
                      <div
                        key={taskId}
                        onClick={() => toggleTask(taskId)}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl p-2.5 text-xs transition-colors ${
                          isDone ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'hover:bg-[#F0F4F8] text-[#101213] dark:hover:bg-[#181818] dark:text-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={isDone ? 'Mark milestone incomplete' : 'Mark milestone complete'}
                          className="mt-0.5 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                        <span className={`leading-relaxed ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {taskText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
