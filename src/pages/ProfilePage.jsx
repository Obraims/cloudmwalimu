import { useState, useEffect, useMemo } from 'react';
import {
  User,
  Mail,
  Calendar,
  Target,
  Flame,
  ArrowLeft,
  Save,
  CheckCircle2,
  Shield,
  RotateCcw,
  LogOut,
  Download,
  AlertCircle,
  BookOpen,
  Award,
  Sun,
  Moon,
  Laptop,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export function ProfilePage() {
  const { profile, updateProfile, user, signOut, isConfigured } = useAuth();
  const { navigate } = useRouter();
  const { theme, setTheme } = useTheme();

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState('1.5');
  const [targetScore, setTargetScore] = useState('80');
  const [focusDomain, setFocusDomain] = useState('all');
  const [studyTime, setStudyTime] = useState('evening');
  const [buddyLanguage, setBuddyLanguage] = useState(() => localStorage.getItem('africloud_buddy_lang') || 'English');

  // Baseline state to compute dirty state
  const [initialState, setInitialState] = useState({
    displayName: '',
    examDate: '',
    dailyHours: '1.5',
    targetScore: '80',
    focusDomain: 'all',
    studyTime: 'evening',
  });

  // Action / UI State
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sync state from profile on mount or when profile updates
  useEffect(() => {
    if (profile) {
      const name = profile.display_name || user?.user_metadata?.display_name || 'Learner';
      const date = profile.exam_date || '2026-11-15';
      const hours = String(profile.daily_hours || 1.5);
      const score = String(profile.target_score || 80);
      const domain = profile.focus_domain || 'all';
      const time = profile.study_time || 'evening';
      const bLang = profile.buddy_language || localStorage.getItem('africloud_buddy_lang') || 'English';

      setDisplayName(name);
      setExamDate(date);
      setDailyHours(hours);
      setTargetScore(score);
      setFocusDomain(domain);
      setStudyTime(time);
      setBuddyLanguage(bLang);

      setInitialState({
        displayName: name,
        examDate: date,
        dailyHours: hours,
        targetScore: score,
        focusDomain: domain,
        studyTime: time,
      });
    }
  }, [profile, user]);

  // Dirty state: true when any field differs from the initial saved profile
  const isDirty = useMemo(() => {
    return (
      displayName.trim() !== initialState.displayName ||
      examDate !== initialState.examDate ||
      dailyHours !== initialState.dailyHours ||
      targetScore !== initialState.targetScore ||
      focusDomain !== initialState.focusDomain ||
      studyTime !== initialState.studyTime ||
      buddyLanguage !== initialState.buddyLanguage
    );
  }, [displayName, examDate, dailyHours, targetScore, focusDomain, studyTime, buddyLanguage, initialState]);

  // Requirement 1: Calculate Days to Exam using Local Calendar Dates
  // Set both dates to local midnight, then diff in days. Today to 7 Nov is not off by one.
  const daysRemaining = useMemo(() => {
    if (!examDate) return 0;
    const parts = examDate.split('-');
    if (parts.length !== 3) return 0;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    const target = new Date(y, m, d);
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }, [examDate]);

  // Requirement 2: Show the selected exam date written out (e.g. "Sat, 7 Nov 2026")
  const writtenDate = useMemo(() => {
    if (!examDate) return '';
    const parts = examDate.split('-');
    if (parts.length !== 3) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    const target = new Date(y, m, d);
    return target.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [examDate]);

  // Handle Quick Date Presets (e.g. +7 days, +12 days)
  const setPresetDate = (daysFromToday) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setExamDate(`${year}-${month}-${day}`);
  };

  // Requirement 4: Save Changes with loading state, finally block, and persistence
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!isDirty || saving) return;

    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const updates = {
        display_name: displayName.trim(),
        exam_date: examDate,
        daily_hours: Number(dailyHours),
        target_score: Number(targetScore),
        focus_domain: focusDomain,
        study_time: studyTime,
      };

      await updateProfile(updates);

      // Update baseline initial state so button disables until next edit
      setInitialState({
        displayName: displayName.trim(),
        examDate,
        dailyHours,
        targetScore,
        focusDomain,
        studyTime,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err?.message || 'Could not save profile changes. Please try again.');
    } finally {
      // Requirement 4: Always clear loading state in a finally block
      setSaving(false);
    }
  };

  // Cancel edits and restore initial values
  const handleCancel = () => {
    setDisplayName(initialState.displayName);
    setExamDate(initialState.examDate);
    setDailyHours(initialState.dailyHours);
    setTargetScore(initialState.targetScore);
    setFocusDomain(initialState.focusDomain);
    setStudyTime(initialState.studyTime);
    setBuddyLanguage(initialState.buddyLanguage);
    setErrorMessage('');
  };

  // Requirement 3: Reset Practice with confirmation requiring typing RESET
  // Clears both local and cloud (Supabase) practice data
  const handleExecuteReset = async () => {
    if (resetInput !== 'RESET') return;
    setResetting(true);

    try {
      // 1. Clear Local Storage data
      localStorage.removeItem('africloud_prep_attempts');
      localStorage.removeItem('africloud_prep_flashcards');
      localStorage.removeItem('africloud_prep_planner_ticks');
      localStorage.removeItem('africloud_prep_study_plan');

      // 2. Clear Cloud (Supabase) data if configured and logged in
      if (isSupabaseConfigured() && user?.id) {
        await Promise.allSettled([
          supabase.from('quiz_attempts').delete().eq('user_id', user.id),
          supabase.from('flashcards').delete().eq('user_id', user.id),
          supabase.from('study_plans').delete().eq('user_id', user.id),
        ]);
      }

      setShowResetModal(false);
      setResetInput('');
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to reset practice data:', err);
    } finally {
      setResetting(false);
    }
  };

  // Export User Progress Data as JSON
  const handleExportData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile,
        attempts: JSON.parse(localStorage.getItem('africloud_prep_attempts') || '[]'),
        flashcards: JSON.parse(localStorage.getItem('africloud_prep_flashcards') || '[]'),
        plannerTicks: JSON.parse(localStorage.getItem('africloud_prep_planner_ticks') || '{}'),
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `africloud-prep-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Initials for avatar
  const initials = (displayName || 'L')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Consistent Selected Option Chip Style (Requirement 6: Cerulean blue across all chips)
  const getChipStyle = (isSelected) => {
    return isSelected
      ? 'border-[#007BA7] bg-[#007BA7]/15 text-[#007BA7] dark:text-[#4CC3EC] shadow-sm font-bold'
      : 'border-[#DDE3E8] bg-white text-[#5B666E] hover:border-slate-300 dark:border-[#242424] dark:bg-[#181818] dark:text-slate-400 dark:hover:border-slate-700';
  };

  return (
    <div className="min-h-screen pb-32 transition-colors">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('dashboard')}
            className="group flex items-center gap-2 text-xs font-semibold text-[#5B666E] transition-colors hover:text-[#007BA7] dark:text-slate-400 dark:hover:text-[#4CC3EC]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              {isConfigured ? 'Cloud Synced' : 'Local Active Session'}
            </span>
          </div>
        </div>

        {/* Hero Identity Banner */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-[#DDE3E8] bg-gradient-to-br from-white via-[#F0F4F8] to-white p-6 shadow-md dark:border-[#242424] dark:bg-gradient-to-br dark:from-[#121212] dark:via-[#101923] dark:to-[#121212] dark:shadow-2xl sm:p-8 transition-colors">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#007BA7]/10 dark:bg-[#007BA7]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#FF007F]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar Circle */}
              <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#007BA7] to-[#FF007F] p-0.5 shadow-lg shadow-[#007BA7]/20">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#F0F4F8] dark:bg-[#0F141C] text-2xl font-black text-[#007BA7] dark:text-white">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-[#121212] bg-[#007BA7] text-white">
                  <Award className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Name & Quick Chips */}
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#101213] dark:text-[#FAF8F3] sm:text-3xl">
                    {displayName || 'Learner'}
                  </h1>
                  <span className="rounded-md border border-[#007BA7]/40 bg-[#007BA7]/15 px-2 py-0.5 text-[10px] font-bold text-[#007BA7] dark:text-[#4CC3EC]">
                    AZ-900
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5B666E] dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{profile?.email || user?.email || 'learner@africloud.dev'}</span>
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <Flame className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    <span>{profile?.streak_days || 3}-Day Streak</span>
                  </span>
                  <span className="flex items-center gap-1 rounded-lg border border-[#007BA7]/30 bg-[#007BA7]/10 px-2.5 py-1 text-xs font-semibold text-[#007BA7] dark:text-[#4CC3EC]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{daysRemaining >= 0 ? `${daysRemaining} Days to Exam` : 'Exam Date Passed'}</span>
                  </span>
                  <span className="flex items-center gap-1 rounded-lg border border-[#007BA7]/30 bg-[#007BA7]/10 px-2.5 py-1 text-xs font-semibold text-[#007BA7] dark:text-[#4CC3EC]">
                    <Target className="h-3.5 w-3.5" />
                    <span>Target: {targetScore}%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action in Hero */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                type="button"
                onClick={() => navigate('planner')}
                className="flex items-center gap-2 rounded-xl border border-[#DDE3E8] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-[#007BA7] hover:bg-[#007BA7]/10 dark:border-[#242424] dark:bg-[#181818] dark:text-slate-200 dark:hover:border-[#007BA7] dark:hover:bg-[#007BA7]/10"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#007BA7]" />
                <span>12-Day Study Plan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Exam Date & Readiness Targets */}
          <div className="rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-sm dark:border-[#242424] dark:bg-[#121212] dark:shadow-xl sm:p-8 transition-colors">
            <div className="mb-6 flex items-center gap-3 border-b border-[#DDE3E8] pb-4 dark:border-[#242424]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007BA7]/10 text-[#007BA7] dark:bg-[#007BA7]/15">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#101213] dark:text-slate-100 sm:text-lg">
                  Exam & Readiness Goals
                </h2>
                <p className="text-xs text-[#5B666E] dark:text-slate-400">
                  Calibrates your countdown, diagnostic thresholds, and adaptive study pace
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Exam Date Picker & Written Date Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                    Target Exam Date
                  </label>
                  {/* Requirement 2: Written date next to field */}
                  {writtenDate && (
                    <span className="rounded-lg bg-[#007BA7]/10 px-2.5 py-0.5 text-xs font-bold text-[#007BA7] dark:text-[#4CC3EC]">
                      {writtenDate}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-xl border border-[#DDE3E8] bg-[#F6F8FA] px-4 py-3 text-sm font-semibold text-[#101213] transition-all focus:border-[#007BA7] focus:outline-none focus:ring-1 focus:ring-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-white"
                  />
                </div>

                {/* Requirement 1: Countdown info banner */}
                <div className="flex items-center justify-between text-[11px] text-[#5B666E] dark:text-slate-400 pt-0.5">
                  <span>
                    {daysRemaining > 0
                      ? `⏳ ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining until exam`
                      : daysRemaining === 0
                      ? '🎯 Exam day is today!'
                      : `⚠️ Date passed ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago`}
                  </span>
                </div>

                {/* Quick Date Presets (Requirement 6: Cerulean blue chips) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] text-slate-500">Presets:</span>
                  {[
                    { label: '+7 Days', days: 7 },
                    { label: '+12 Days', days: 12 },
                    { label: '+30 Days', days: 30 },
                    { label: '+60 Days', days: 60 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setPresetDate(preset.days)}
                      className="rounded-lg border border-[#DDE3E8] bg-[#F6F8FA] px-2.5 py-1 text-[11px] font-semibold text-[#5B666E] hover:border-[#007BA7] hover:text-[#007BA7] dark:border-[#242424] dark:bg-[#161616] dark:text-slate-400 dark:hover:border-[#007BA7] dark:hover:text-[#4CC3EC] transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Passing Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                    Target Pass Score
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Official pass: 70% (700/1000)
                  </span>
                </div>

                {/* Requirement 6: Cerulean blue chips for all options */}
                <div className="grid grid-cols-4 gap-2">
                  {['75', '80', '85', '90'].map((score) => {
                    const isSelected = targetScore === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setTargetScore(score)}
                        className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs transition-all ${getChipStyle(
                          isSelected
                        )}`}
                      >
                        <span className="text-sm font-black">{score}%</span>
                        <span className="text-[9px] font-medium opacity-80">
                          {score === '80' ? 'Optimal' : score === '90' ? 'Mastery' : 'Pass'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#5B666E] dark:text-slate-500">
                  Readiness Tracker locks Exam-Ready until your diagnostic score reaches this threshold.
                </p>
              </div>

              {/* Daily Study Commitment (Requirement 6: Cerulean blue chips) */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                    Daily Study Commitment
                  </label>
                  <span className="text-[11px] font-bold text-[#007BA7] dark:text-[#4CC3EC]">
                    {dailyHours} hours / day
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { val: '0.5', label: '30 min', sub: 'Casual' },
                    { val: '1.0', label: '1.0 hr', sub: 'Steady' },
                    { val: '1.5', label: '1.5 hrs', sub: 'Recommended' },
                    { val: '2.0', label: '2.0 hrs', sub: 'Accelerated' },
                    { val: '3.0', label: '3.0 hrs', sub: 'Intensive' },
                  ].map((item) => {
                    const isSelected = dailyHours === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setDailyHours(item.val)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs transition-all ${getChipStyle(
                          isSelected
                        )}`}
                      >
                        <span className="text-sm font-black">{item.label}</span>
                        <span className="text-[10px] opacity-80">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Preferences & Theme */}
          <div className="rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-sm dark:border-[#242424] dark:bg-[#121212] dark:shadow-xl sm:p-8 transition-colors">
            <div className="mb-6 flex items-center gap-3 border-b border-[#DDE3E8] pb-4 dark:border-[#242424]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007BA7]/10 text-[#007BA7] dark:bg-[#007BA7]/15">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#101213] dark:text-slate-100 sm:text-lg">
                  Personal Preferences & Appearance
                </h2>
                <p className="text-xs text-[#5B666E] dark:text-slate-400">
                  Customization, study routine, and display theme
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Amina Kimani"
                  className="w-full rounded-xl border border-[#DDE3E8] bg-[#F6F8FA] px-4 py-3 text-sm font-semibold text-[#101213] placeholder-slate-400 transition-all focus:border-[#007BA7] focus:outline-none focus:ring-1 focus:ring-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-white dark:placeholder-slate-600"
                />
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                  Account Email (Read-Only)
                </label>
                <input
                  type="email"
                  value={profile?.email || user?.email || 'learner@africloud.dev'}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-[#DDE3E8] bg-[#F0F4F8] px-4 py-3 text-sm font-semibold text-slate-500 dark:border-[#242424] dark:bg-[#151515] dark:text-slate-500"
                />
              </div>

              {/* Theme Preference Setting (Light, Dark, System) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                    Interface Theme
                  </label>
                  <span className="text-[11px] text-[#5B666E] dark:text-slate-500 capitalize">
                    Active: {theme}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Laptop },
                  ].map((t) => {
                    const isSelected = theme === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs transition-all ${getChipStyle(
                          isSelected
                        )}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Study Routine */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                  Study Routine
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'Morning' },
                    { id: 'afternoon', label: 'Midday' },
                    { id: 'evening', label: 'Evening' },
                  ].map((routine) => {
                    const isSelected = studyTime === routine.id;
                    return (
                      <button
                        key={routine.id}
                        type="button"
                        onClick={() => setStudyTime(routine.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs transition-all ${getChipStyle(
                          isSelected
                        )}`}
                      >
                        <span>{routine.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Study Buddy Default Language */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                    Buddy Language
                  </label>
                  <span className="text-[11px] text-[#5B666E] dark:text-slate-500">
                    Default: {buddyLanguage}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'English', label: 'English', code: 'EN' },
                    { id: 'Kiswahili', label: 'Kiswahili', code: 'SW' },
                    { id: 'Sheng', label: 'Sheng', code: 'SH' },
                  ].map((item) => {
                    const isSelected = buddyLanguage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBuddyLanguage(item.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs transition-all ${getChipStyle(
                          isSelected
                        )}`}
                      >
                        <span className="font-bold text-[10px] opacity-75">{item.code}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weakest Area Priority */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-300">
                  Primary Focus Domain
                </label>
                <select
                  value={focusDomain}
                  onChange={(e) => setFocusDomain(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE3E8] bg-[#F6F8FA] px-4 py-3 text-sm font-semibold text-[#101213] transition-all focus:border-[#007BA7] focus:outline-none focus:ring-1 focus:ring-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-white"
                >
                  <option value="all">Balanced (All AZ-900 Domains)</option>
                  <option value="Cloud Concepts">Cloud Concepts (25-30%)</option>
                  <option value="Azure Architecture">Azure Architecture & Services (35-40%)</option>
                  <option value="Governance & Management">Azure Management & Governance (30-35%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Data Management & Actions */}
          <div className="rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-sm dark:border-[#242424] dark:bg-[#121212] dark:shadow-xl sm:p-8 transition-colors">
            <div className="mb-6 flex items-center gap-3 border-b border-[#DDE3E8] pb-4 dark:border-[#242424]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#101213] dark:text-slate-100 sm:text-lg">
                  Data & Account Controls
                </h2>
                <p className="text-xs text-[#5B666E] dark:text-slate-400">
                  Backup your progress, manage local cache, or reset diagnostic attempts
                </p>
              </div>
            </div>

            {/* Export Progress */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#101213] dark:text-slate-200">
                  Export Study Progress
                </h3>
                <p className="text-xs text-[#5B666E] dark:text-slate-500">
                  Download a JSON backup of your quiz history, Leitner flashcard boxes, and study plan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#DDE3E8] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:border-[#007BA7] hover:bg-[#007BA7]/10 hover:text-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-200 dark:hover:border-[#007BA7] dark:hover:bg-[#007BA7]/15 dark:hover:text-[#4CC3EC] transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Export Progress</span>
              </button>
            </div>

            <hr className="my-5 border-[#DDE3E8] dark:border-[#242424]" />

            {/* Reset Practice History (Requirement 3) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
                  Reset Practice Data
                </h3>
                <p className="text-xs text-[#5B666E] dark:text-slate-500">
                  Clears local browser and Supabase quiz attempts, flashcard Leitner boxes, and study planner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetInput('');
                  setShowResetModal(true);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:border-red-500 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-900/30 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Practice Data...</span>
              </button>
            </div>

            <hr className="my-5 border-[#DDE3E8] dark:border-[#242424]" />

            {/* Sign Out */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#101213] dark:text-slate-200">Sign Out</h3>
                <p className="text-xs text-[#5B666E] dark:text-slate-500">
                  Safely disconnect your session from this browser.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate('auth');
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#DDE3E8] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:border-red-500/40 hover:bg-red-50 hover:text-red-600 dark:border-[#242424] dark:bg-[#181818] dark:text-slate-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/50 bg-red-500/15 p-4 text-xs font-bold text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/50 bg-amber-500/15 p-4 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>Practice data has been completely reset across local storage and cloud database.</span>
            </div>
          )}

          {/* Requirement 4: Sticky Save Changes / Cancel Bar at the bottom of the viewport */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#DDE3E8] bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-[#242424] dark:bg-[#121212]/95 transition-colors">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={!isDirty || saving}
                  className="rounded-xl border border-[#DDE3E8] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-black dark:border-[#242424] dark:bg-[#181818] dark:text-slate-300 dark:hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel Changes
                </button>
                <button
                  type="button"
                  onClick={() => navigate('dashboard')}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-[#5B666E] hover:text-[#101213] dark:text-slate-400 dark:hover:text-white transition-all"
                >
                  Return to Dashboard
                </button>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-up">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Changes Saved Successfully!</span>
                  </span>
                )}

                <button
                  type="submit"
                  disabled={!isDirty || saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#007BA7] to-[#FF007F] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#007BA7]/30 transition-all hover:scale-[1.02] hover:shadow-[#FF007F]/40 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{isDirty ? 'Save Changes' : 'Saved'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Requirement 3: Reset Confirmation Modal requiring typing 'RESET' */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up">
            <div className="w-full max-w-md rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-2xl dark:border-[#242424] dark:bg-[#141414]">
              <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-4 dark:border-[#242424]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
                    <RotateCcw className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-bold text-[#101213] dark:text-white">
                    Confirm Practice Reset
                  </h3>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-[#5B666E] dark:text-slate-300 leading-relaxed">
                  This action will <strong>permanently erase</strong> all your recorded quiz attempts,
                  accuracy scores, Leitner flashcard progression, and adaptive study plan across both
                  <strong> local browser cache</strong> and <strong>cloud Supabase database</strong>.
                </p>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  To confirm, type <span className="font-mono font-bold tracking-wider underline">RESET</span> below:
                </p>
                <input
                  type="text"
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="Type RESET"
                  className="w-full rounded-xl border border-red-300 bg-red-50/50 px-4 py-2.5 font-mono text-sm font-bold text-red-700 placeholder-red-300 focus:border-red-500 focus:outline-none dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-xl border border-[#DDE3E8] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-[#242424] dark:bg-[#181818] dark:text-slate-300 dark:hover:bg-[#222]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resetInput !== 'RESET' || resetting}
                  onClick={handleExecuteReset}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resetting ? (
                    <span>Resetting...</span>
                  ) : (
                    <span>Erase Everything</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
