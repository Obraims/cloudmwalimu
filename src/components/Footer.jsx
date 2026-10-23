import { useRouter } from '@/context/RouterContext';
import { useTheme } from '@/context/ThemeContext';
import { APP_NAME, APP_TAGLINE, APP_DISCLAIMER } from '@/config/brand';

const footerLinks = [
  { label: 'Dashboard', route: 'dashboard' },
  { label: 'Planner', route: 'planner' },
  { label: 'Quiz', route: 'quiz' },
  { label: 'Flashcards', route: 'flashcards' },
  { label: 'AI Study Buddy', route: 'buddy' },
];

export function Footer() {
  const { navigate } = useRouter();
  const { resolvedTheme } = useTheme();

  return (
    <footer className="border-t border-[#DDE3E8] bg-[#F6F8FA] dark:border-[#242424] dark:bg-[#050505] transition-colors">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img
                src={resolvedTheme === 'light' ? '/brand/logo-full-light.svg' : '/brand/logo-full-dark.svg'}
                alt={APP_NAME}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#5B666E] dark:text-slate-400">
              {APP_TAGLINE} An AI-guided path to the Microsoft Azure Fundamentals (AZ-900) exam with
              authentic Kenyan analogies.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="eyebrow mb-3">Navigate</p>
              <ul className="space-y-2">
                {footerLinks.map((l) => (
                  <li key={l.route}>
                    <button
                      onClick={() => navigate(l.route)}
                      className="text-sm font-medium text-[#5B666E] transition-colors hover:text-[#007BA7] dark:text-slate-400 dark:hover:text-[#4CC3EC]"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-9 border-t border-[#DDE3E8] pt-5 dark:border-[#242424]">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
            {APP_DISCLAIMER}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            &copy; {new Date().getFullYear()} {APP_NAME}. For learning purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
