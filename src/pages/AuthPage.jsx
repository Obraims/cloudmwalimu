import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  User,
  Calendar,
  Clock,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useTheme } from '@/context/ThemeContext';
import { APP_NAME } from '@/config/brand';

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, signInAsGuest, resetPassword, resendConfirmation, isConfigured } = useAuth();
  const { navigate } = useRouter();
  const { resolvedTheme } = useTheme();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState('1.5');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);

  // Strong password rule evaluations
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedRulesCount = Object.values(passwordRules).filter(Boolean).length;

  const getStrengthMeta = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-700', width: '0%' };
    if (passedRulesCount <= 2) return { label: 'Weak', color: 'bg-[#FF007F]', width: '25%' };
    if (passedRulesCount === 3) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (passedRulesCount === 4) return { label: 'Good', color: 'bg-[#007BA7]', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strengthMeta = getStrengthMeta();
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
        setSuccessMsg('Signed in with Google! Entering dashboard...');
        setTimeout(() => {
          navigate('dashboard');
        }, 300);
      }
    } catch (err) {
      console.error('Google auth error:', err);
      // If user closed the popup, don't show scary error
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google sign-in was canceled or failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAccess = async (emailToUse) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await signInAsGuest(emailToUse || email || 'amina.kimani@africloud.dev');
      setSuccessMsg('Entering Demo Dashboard...');
      setTimeout(() => {
        navigate('dashboard');
      }, 300);
    } catch (err) {
      console.error('Demo sign-in error:', err);
      setErrorMsg('Could not start demo session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to resend confirmation.');
      return;
    }
    setResending(true);
    try {
      await resendConfirmation(email);
      setSuccessMsg(`Confirmation email resent to ${email}. Please check your inbox or spam folder.`);
    } catch (err) {
      console.error('Resend error:', err);
      setErrorMsg(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await resetPassword(email);
      setSuccessMsg(`Password recovery instructions sent to ${email}. Check your inbox.`);
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Failed to send password recovery email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Strong password validations on sign-up
    if (mode === 'signup') {
      if (!passwordRules.length) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (!passwordRules.uppercase) {
        setErrorMsg('Password must include at least one uppercase letter (A-Z).');
        return;
      }
      if (!passwordRules.lowercase) {
        setErrorMsg('Password must include at least one lowercase letter (a-z).');
        return;
      }
      if (!passwordRules.number) {
        setErrorMsg('Password must include at least one number (0-9).');
        return;
      }
      if (!passwordRules.special) {
        setErrorMsg('Password must include at least one special character (e.g. !@#$%^&*).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your confirm password field.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate('dashboard');
      } else {
        await signUp(email, password, {
          displayName,
          examDate,
          dailyHours: Number(dailyHours),
        });
        setSuccessMsg(
          isConfigured
            ? 'Account created! Entering dashboard...'
            : 'Account ready (Demo Mode)! Entering dashboard...'
        );
        setTimeout(() => {
          navigate('dashboard');
        }, 600);
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'email_not_confirmed' || err.message?.toLowerCase().includes('email not confirmed')) {
        setIsUnconfirmed(true);
        setErrorMsg('Email not confirmed yet. You can launch the Demo Dashboard directly or resend confirmation below.');
      } else {
        setIsUnconfirmed(false);
        setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-6xl items-center justify-center px-4 pt-16 pb-16 sm:pt-20 sm:pb-20 sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center">
            <img
              src={resolvedTheme === 'light' ? '/brand/logo-full-light.svg' : '/brand/logo-full-dark.svg'}
              alt={APP_NAME}
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#101213] dark:text-[#FAF8F3] sm:text-3xl">
            {mode === 'signin' ? `Welcome back to ${APP_NAME}` : 'Create your learner account'}
          </h1>
          <p className="mt-2 text-sm text-[#5B666E] dark:text-slate-400">
            {mode === 'signin'
              ? `Log in to track your AZ-900 readiness with ${APP_NAME}.`
              : 'Sign up to master Azure fundamentals with tailored AI guidance.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bento-card border border-[#DDE3E8] bg-white dark:border-[#242424] dark:bg-[#121212] p-6 shadow-sm dark:shadow-lifted sm:p-8">
          {/* Quick Demo Dashboard Access Card */}
          <div className="mb-6 rounded-2xl border border-[#007BA7]/30 bg-[#EEF7FC] p-4 shadow-sm dark:border-[#007BA7]/40 dark:bg-gradient-to-br dark:from-[#007BA7]/20 dark:via-[#121212] dark:to-[#FF007F]/15">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#007BA7] to-[#FF007F] text-white shadow-cerulean">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#101213] dark:text-[#F8FAFC]">Instant Demo Access</h3>
                  <p className="text-xs text-[#5B666E] dark:text-slate-400">Explore AZ-900 Dashboard as Amina Kimani</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDemoAccess()}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#007BA7] hover:bg-[#005C8A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
              >
                <span>Launch Demo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-[#DDE3E8] bg-[#EEF3F6] p-1 dark:border-[#242424] dark:bg-[#181818]">
            <button
              type="button"
              onClick={() => {
                setMode('signin'); setIsUnconfirmed(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-[#007BA7] text-white shadow-sm'
                  : 'text-[#5B666E] hover:text-[#101213] dark:text-slate-400 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup'); setIsUnconfirmed(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-[#007BA7] text-white shadow-sm'
                  : 'text-[#5B666E] hover:text-[#101213] dark:text-slate-400 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 flex flex-col gap-3 rounded-xl border border-[#FF007F] bg-[#FF007F]/15 p-3.5 text-xs font-medium text-[#FF007F]"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#FF007F] mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
                {isUnconfirmed && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDemoAccess(email)}
                      className="rounded-lg bg-[#007BA7] px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-[#005C8A]"
                    >
                      Bypass & Enter Demo Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="rounded-lg border border-[#FF007F]/60 bg-[#FF007F]/20 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-[#FF007F]/30"
                    >
                      {resending ? 'Resending...' : 'Resend Confirmation Email'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#007BA7] bg-[#007BA7]/15 p-3.5 text-xs font-medium text-[#007BA7]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#007BA7]" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'forgot' ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-email-forgot"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-400"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="auth-email-forgot"
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#DDE3E8] bg-white text-[#101213] placeholder-slate-400 focus:border-[#007BA7] focus:ring-1 focus:ring-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] dark:placeholder-slate-500 py-2.5 pl-10 pr-3.5 text-sm font-medium outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007BA7] to-[#FF007F] hover:from-[#005C8A] hover:to-[#D6006B] py-3 text-sm font-bold text-white shadow-sm transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending recovery link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Recovery Link</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-bold text-[#5B666E] hover:text-[#101213] dark:text-slate-400 dark:hover:text-[#F8FAFC]"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#DDE3E8] bg-white text-[#101213] hover:bg-slate-50 shadow-sm dark:border-[#2e2e2e] dark:bg-[#181818] dark:text-[#F8FAFC] dark:hover:bg-[#202020] py-2.5 text-xs font-bold transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-70"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="w-full border-t border-[#DDE3E8] dark:border-[#242424]" />
              <span className="absolute bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-[#5B666E] dark:bg-[#121212] dark:text-slate-500">
                or continue with email
              </span>
            </div>
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-400"
                >
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Alex Kimani"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-[#DDE3E8] bg-white text-[#101213] placeholder-slate-400 focus:border-[#007BA7] focus:ring-1 focus:ring-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] dark:placeholder-slate-500 py-2.5 pl-10 pr-3.5 text-sm font-medium outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-400"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username email"
                  placeholder="learner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE3E8] bg-white text-[#101213] placeholder-slate-400 focus:border-[#007BA7] focus:ring-1 focus:ring-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] dark:placeholder-slate-500 py-2.5 pl-10 pr-3.5 text-sm font-medium outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-400"
              >
                <span>Password</span>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-semibold text-[#007BA7] hover:underline normal-case tracking-normal"
                  >
                    Forgot password?
                  </button>
                )}
                {mode === 'signup' && password && (
                  <span
                    className={`text-[10px] font-bold ${
                      passedRulesCount <= 2
                        ? 'text-[#FF007F]'
                        : passedRulesCount === 3
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    Strength: {strengthMeta.label}
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE3E8] bg-white text-[#101213] placeholder-slate-400 focus:border-[#007BA7] focus:ring-1 focus:ring-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] dark:placeholder-slate-500 py-2.5 pl-10 pr-10 text-sm font-medium outline-none transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength meter and checklist for Sign Up */}
              {mode === 'signup' && (
                <div className="mt-2.5 space-y-2 rounded-xl border border-[#DDE3E8] bg-[#F6F8FA] dark:border-[#202020] dark:bg-[#151515] p-3 text-xs">
                  {/* Strength Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#DDE3E8] dark:bg-[#242424]">
                    <div
                      className={`h-full transition-all duration-300 ${strengthMeta.color}`}
                      style={{ width: strengthMeta.width }}
                    />
                  </div>

                  <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#007BA7]" /> Password Requirements:
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-3">
                    <span
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        passwordRules.length ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {passwordRules.length ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 text-center">•</span>
                      )}
                      8+ characters
                    </span>

                    <span
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        passwordRules.uppercase ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {passwordRules.uppercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 text-center">•</span>
                      )}
                      1 uppercase (A-Z)
                    </span>

                    <span
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        passwordRules.lowercase ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {passwordRules.lowercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 text-center">•</span>
                      )}
                      1 lowercase (a-z)
                    </span>

                    <span
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        passwordRules.number ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {passwordRules.number ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 text-center">•</span>
                      )}
                      1 number (0-9)
                    </span>

                    <span
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        passwordRules.special ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {passwordRules.special ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 text-center">•</span>
                      )}
                      1 symbol (!@#$%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <label htmlFor="auth-confirm-password">Confirm Password</label>
                  {passwordsMatch && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> Passwords match
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="text-[10px] font-bold text-[#FF007F]">
                      Passwords do not match
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="auth-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-[#101213] placeholder-slate-400 outline-none transition-colors focus:ring-1 focus:ring-[#007BA7] dark:bg-[#181818] dark:text-[#F8FAFC] dark:placeholder-slate-500 ${
                      passwordsMismatch
                        ? 'border-[#FF007F] focus:border-[#FF007F]'
                        : passwordsMatch
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : 'border-[#DDE3E8] dark:border-[#242424] focus:border-[#007BA7]'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-[#F8FAFC] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label
                    htmlFor="auth-exam-date"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-400"
                  >
                    Exam Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="auth-exam-date"
                      name="examDate"
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-xl border border-[#DDE3E8] bg-white text-[#101213] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] py-2.5 pl-9 pr-2.5 text-xs font-medium outline-none focus:border-[#007BA7]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="auth-daily-hours"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#101213] dark:text-slate-400"
                  >
                    Daily Hours
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select
                      id="auth-daily-hours"
                      name="dailyHours"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(e.target.value)}
                      className="w-full rounded-xl border border-[#DDE3E8] bg-white text-[#101213] dark:border-[#242424] dark:bg-[#181818] dark:text-[#F8FAFC] py-2.5 pl-9 pr-2.5 text-xs font-medium outline-none focus:border-[#007BA7]"
                    >
                      <option value="0.5">30 mins</option>
                      <option value="1">1 hour</option>
                      <option value="1.5">1.5 hours</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007BA7] to-[#FF007F] hover:from-[#005C8A] hover:to-[#D6006B] py-3 text-sm font-bold text-white shadow-sm transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{mode === 'signin' ? 'Authenticating...' : 'Creating profile...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signin' ? 'Sign In to Dashboard' : 'Complete Setup & Enter'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#DDE3E8] pt-4 text-center text-xs text-[#5B666E] dark:border-[#242424] dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-[#007BA7]" />
            <span>
              {isConfigured
                ? 'Protected by Supabase Auth & Row Level Security'
                : 'Local Demo Mode Active (Add credentials to .env for cloud sync)'}
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="text-xs font-semibold text-[#5B666E] hover:text-[#007BA7] dark:text-slate-400 dark:hover:text-[#007BA7]"
          >
            ← Back to Home Page
          </button>
        </div>
      </div>
    </div>
  );
}
