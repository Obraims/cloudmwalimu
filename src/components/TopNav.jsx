import { User, LogOut, ArrowRight, Download, Sparkles, Sun, Moon } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { usePwa } from '@/context/PwaContext';
import { useTheme } from '@/context/ThemeContext';
import { APP_NAME } from '@/config/brand';

const navItems = [
  { label: 'Dashboard', route: 'dashboard' },
  { label: 'Planner', route: 'planner' },
  { label: 'Quiz', route: 'quiz' },
  { label: 'Flashcards', route: 'flashcards' },
  { label: 'AI Buddy', route: 'buddy' },
];

export function TopNav() {
  const { route, navigate } = useRouter();
  const { user, profile, signOut, signInAsGuest } = useAuth();
  const { isInstalled, installApp } = usePwa();
  const { resolvedTheme, toggle } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('auth');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#DDE3E8] bg-[#F6F8FA]/95 dark:border-[#242424] dark:bg-[#121212]/90 pt-safe-t backdrop-blur-xl transition-colors">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <button
          onClick={() => navigate(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <img
            src="/brand/logo-mark.svg"
            alt={APP_NAME}
            className="h-9 w-9 rounded-xl object-contain shadow-cerulean"
          />
          <span className="text-lg font-extrabold tracking-tight text-[#101213] dark:text-[#F8FAFC]">
            AfriCloud <span className="text-[#007BA7]">Prep</span>
          </span>
        </button>

        {user ? (
          <div className="hidden items-center gap-1.5 md:flex">
            {navItems.map((item) => {
              const isActive = route === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BA7] ${
                    isActive
                      ? 'bg-[#007BA7]/20 text-[#007BA7] dark:bg-[#007BA7]/20 dark:text-[#3bb4dd]'
                      : 'text-[#5B666E] hover:bg-[#E8EEF3] hover:text-[#101213] dark:text-slate-400 dark:hover:bg-[#181818] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="hidden items-center gap-4 text-xs font-semibold uppercase tracking-wider text-[#5B666E] dark:text-slate-400 md:flex">
            <span>AZ-900 Prep</span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-[#007BA7]">Kenyan Analogies</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggle}
            type="button"
            title={`Current mode: ${resolvedTheme}. Click to switch.`}
            aria-label="Toggle theme color mode"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DDE3E8] bg-white text-slate-700 shadow-sm transition-all hover:border-[#007BA7] hover:text-[#007BA7] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-300 dark:hover:border-[#007BA7] dark:hover:text-[#4CC3EC]"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-[#007BA7]" />
            )}
          </button>

          {/* Download / Install Web App Button */}
          {!isInstalled && (
            <button
              onClick={installApp}
              title="Install AfriCloud Prep as an App"
              aria-label="Install App"
              className="flex items-center gap-1.5 rounded-xl border border-[#007BA7]/40 bg-[#007BA7]/10 px-3 py-2 text-xs font-bold text-[#007BA7] dark:text-[#F8FAFC] dark:bg-[#007BA7]/15 transition-all hover:bg-[#007BA7] hover:text-white"
            >
              <Download className="h-3.5 w-3.5 text-[#FF007F]" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {user ? (
            <>
              <button
                onClick={() => navigate('profile')}
                title="View Profile & Settings"
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  route === 'profile'
                    ? 'border-[#007BA7] bg-[#007BA7]/20 text-[#007BA7] dark:bg-[#007BA7]/25 dark:text-[#4CC3EC] shadow-md shadow-[#007BA7]/20'
                    : 'border-[#007BA7]/40 bg-[#007BA7]/10 text-[#007BA7] hover:bg-[#007BA7]/20 dark:bg-[#007BA7]/15 dark:hover:bg-[#007BA7]/25 hover:border-[#007BA7]'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>
                  {profile?.display_name ? profile.display_name.split(' ')[0] : 'Learner'}
                </span>
              </button>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DDE3E8] bg-white text-slate-500 transition-all hover:border-[#FF007F] hover:bg-[#FF007F]/10 hover:text-[#FF007F] dark:border-[#242424] dark:bg-[#181818] dark:text-slate-400 dark:hover:border-[#FF007F] dark:hover:bg-[#FF007F]/15 dark:hover:text-[#FF007F]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (signInAsGuest) await signInAsGuest();
                  navigate('dashboard');
                }}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#007BA7]/50 bg-[#007BA7]/10 dark:bg-[#007BA7]/15 hover:bg-[#007BA7]/25 px-3.5 py-2 text-xs font-bold text-[#007BA7] transition-all hover:scale-[1.02] active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Demo Dashboard</span>
              </button>

              <button
                onClick={() => navigate('auth')}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#007BA7] to-[#FF007F] hover:from-[#005C8A] hover:to-[#D6006B] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#007BA7]/30 hover:shadow-[#FF007F]/40 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
