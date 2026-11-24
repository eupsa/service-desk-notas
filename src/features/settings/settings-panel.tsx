import { useTranslation } from 'react-i18next';
import { settingsSchema, type Settings } from '../tickets/model';
import { SectionOrder } from '../form-builder/section-order';

export function SettingsPanel({
  value,
  onChange,
}: {
  value: Settings;
  onChange: (value: Settings) => void;
}) {
  const { t } = useTranslation();
  function update(key: keyof Settings, next: unknown) {
    const result = settingsSchema.safeParse({ ...value, [key]: next });
    if (result.success) onChange(result.data);
  }
  // Poucas opções curtas: radios nativos lado a lado em vez de select.
  function choice(key: keyof Settings, legend: string, options: string[]) {
    return (
      <fieldset>
        <legend>{t(legend)}</legend>
        <div className="segmented">
          {options.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name={key}
                value={option}
                checked={value[key] === option}
                onChange={() => update(key, option)}
              />
              {t(option)}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <section className="space-y-5" aria-labelledby="page-heading">
      <div>
        <label htmlFor="language">{t('language')}</label>
        <select
          id="language"
          value={value.language}
          onChange={(e) => update('language', e.target.value)}
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      {choice('theme', 'theme', ['system', 'light', 'dark'])}
      {choice('density', 'density', ['comfortable', 'compact'])}
      <hr className="border-input" />
      {choice('troubleshootingMode', 'mode', ['lines', 'text'])}
      <div>
        <label htmlFor="marker">{t('marker')}</label>
        <select
          id="marker"
          className="max-w-32"
          value={value.marker}
          onChange={(e) => update('marker', e.target.value)}
        >
          {['-', '•', '1.'].map((marker) => (
            <option key={marker}>{marker}</option>
          ))}
        </select>
      </div>
      <hr className="border-input" />
      <div>
        <h2 className="mb-1.5 text-[0.8125rem] font-medium text-secondary">
          {t('sectionOrder')}
        </h2>
        <SectionOrder
          value={value.sectionOrder}
          onChange={(next) => update('sectionOrder', next)}
        />
      </div>
    </section>
  );
}
