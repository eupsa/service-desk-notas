import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  ClipboardCheck,
  FilePenLine,
  PanelRight,
} from 'lucide-react';
import { Button } from '../../shared/components/ui/button';

const steps = [
  { key: 'start', icon: FilePenLine },
  { key: 'ticket', icon: PanelRight },
  { key: 'copy', icon: ClipboardCheck },
] as const;

export function Onboarding() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = `${t('onboarding.welcome')} · Service Desk`;
  }, [t]);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle('dark', media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 sm:px-10 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-6 border-b border-input pb-6">
        <p className="text-lg font-semibold tracking-tight">Service Desk</p>
        <div className="w-full sm:w-52">
          <label htmlFor="onboarding-language">
            {t('onboarding.language')}
          </label>
          <select
            id="onboarding-language"
            className="min-h-11"
            value={i18n.resolvedLanguage}
            onChange={(event) => void i18n.changeLanguage(event.target.value)}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </header>

      <section
        className="pb-10 pt-10 sm:pb-14 sm:pt-16"
        aria-labelledby="welcome-heading"
      >
        <p className="mb-4 text-sm font-semibold text-primary">
          {t('onboarding.welcome')}
        </p>
        <h1
          id="welcome-heading"
          className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
        >
          {t('onboarding.title')}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
          {t('onboarding.intro')}
        </p>
        <Button asChild className="mt-7 min-h-11 whitespace-normal text-center">
          <a href="./dashboard.html">
            {t('onboarding.start')}
            <ArrowRight className="shrink-0" size={18} aria-hidden="true" />
          </a>
        </Button>
      </section>

      <section
        aria-labelledby="steps-heading"
        className="border-y border-input py-8"
      >
        <h2 id="steps-heading" className="mb-7 text-lg font-semibold">
          {t('onboarding.stepsTitle')}
        </h2>
        <ol className="grid gap-8 sm:grid-cols-3">
          {steps.map(({ key, icon: Icon }, index) => (
            <li key={key}>
              <div className="mb-3 flex items-center gap-3 text-primary">
                <Icon size={24} aria-hidden="true" />
                <span className="text-sm font-semibold" aria-hidden="true">
                  0{index + 1}
                </span>
              </div>
              <h3 className="font-semibold">{t(`onboarding.${key}Title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed">
                {t(`onboarding.${key}Text`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-8 py-8 sm:grid-cols-2 sm:gap-12">
        <section aria-labelledby="password-heading">
          <h2 id="password-heading" className="font-semibold">
            {t('onboarding.localTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {t('onboarding.localText')}
          </p>
        </section>
        <section aria-labelledby="reopen-heading">
          <h2 id="reopen-heading" className="font-semibold">
            {t('onboarding.reopenTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {t('onboarding.reopenText')}
          </p>
        </section>
      </div>
      <footer className="border-t border-input py-5 text-sm">
        {t('onboarding.privacy')}
      </footer>
    </main>
  );
}
