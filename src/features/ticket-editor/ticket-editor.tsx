import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import {
  ticketSchema,
  recognizeTicket,
  type Settings,
  type Ticket,
  type TicketFormValues,
  collaboratorFields,
} from '../tickets/model';
import {
  generateDescription,
  generateTitle,
} from '../description-generator/generate';

export function TicketEditor({
  value,
  settings,
  onChange,
}: {
  value: Ticket;
  settings: Settings;
  onChange: (ticket: Ticket) => void;
}) {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketFormValues, unknown, Ticket>({
    resolver: zodResolver(ticketSchema),
    defaultValues: value,
  });
  const [output, setOutput] = useState('');
  const [notice, setNotice] = useState('');
  const values = useWatch({ control });
  const first = useRef(true);
  const number = values.number ?? '';
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const result = ticketSchema.safeParse(values);
    if (result.success) onChange(result.data);
  }, [values, onChange]);
  async function generate(ticket: Ticket) {
    const text = [
      generateTitle(ticket),
      generateDescription(ticket, settings, (key) => t(key)),
    ]
      .filter(Boolean)
      .join('\n\n');
    setOutput(text);
    try {
      await navigator.clipboard.writeText(text);
      setNotice('copied');
    } catch {
      setNotice('copyError');
    }
  }
  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(generate)}
      onChange={() => {
        setOutput('');
        setNotice('');
      }}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="number">{t('number')}</label>
          <input
            id="number"
            {...register('number')}
            maxLength={100}
            placeholder="INC0000000124216 / WO…"
            autoComplete="off"
          />
          {recognizeTicket(number) && (
            <p className="mt-1.5 text-xs font-medium text-primary">
              {recognizeTicket(number)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3">
          <div>
            <label htmlFor="kba">{t('kba')}</label>
            <input
              id="kba"
              {...register('kba')}
              maxLength={100}
              placeholder="KBA1000013"
            />
          </div>
          <div>
            <label htmlFor="summary">{t('summary')}</label>
            <input
              id="summary"
              {...register('summary')}
              maxLength={500}
              placeholder="Acesso SAP"
            />
          </div>
        </div>
      </div>
      <div className="border-t border-input">
        {settings.sectionOrder.map((section) => (
          <details open key={section} className="form-section">
            <summary>
              {t(section)}
              <ChevronDown
                size={18}
                className="chevron text-secondary"
                aria-hidden="true"
              />
            </summary>
            {section === 'collaborator' ? (
              <div className="grid grid-cols-2 gap-3">
                {collaboratorFields.map((field) => (
                  <div
                    key={field}
                    className={
                      ['name', 'location', 'notes'].includes(field)
                        ? 'col-span-2'
                        : 'min-w-0'
                    }
                  >
                    <label htmlFor={`collaborator-${field}`}>
                      {t(`collaboratorFields.${field}`)}
                    </label>
                    {field === 'notes' ? (
                      <textarea
                        id={`collaborator-${field}`}
                        {...register(`collaborator.${field}`)}
                        maxLength={10_000}
                        rows={3}
                      />
                    ) : (
                      <input
                        id={`collaborator-${field}`}
                        {...register(`collaborator.${field}`)}
                        type={field === 'phone' ? 'tel' : 'text'}
                        inputMode={field === 'email' ? 'email' : undefined}
                        maxLength={field === 'phone' ? 100 : 300}
                        autoComplete="off"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label htmlFor={section} className="sr-only">
                  {t(section)}
                </label>
                <textarea
                  id={section}
                  {...register(section)}
                  maxLength={30_000}
                  placeholder={t(
                    section === 'description'
                      ? 'descriptionPlaceholder'
                      : 'troubleshootingPlaceholder',
                  )}
                />
              </div>
            )}
          </details>
        ))}
      </div>
      {Object.keys(errors).length > 0 && <p role="alert">{t('formError')}</p>}
      <Button
        className="min-h-12 w-full rounded-lg text-[0.9375rem] font-semibold"
        type="submit"
      >
        <Copy size={18} aria-hidden="true" />
        {t('generate')}
      </Button>
      <p
        role="status"
        className={`flex items-center gap-1 text-xs font-medium ${notice === 'copied' ? 'text-success' : ''}`}
      >
        {notice === 'copied' && <Check size={14} aria-hidden="true" />}
        {notice && t(notice)}
      </p>
      {output && (
        <section
          aria-labelledby="preview-heading"
          className="rounded-lg border border-input bg-muted px-3.5 py-3"
        >
          <h2
            id="preview-heading"
            className="mb-2 text-[0.8125rem] font-semibold"
          >
            {t('preview')}
          </h2>
          <pre tabIndex={0}>{output}</pre>
        </section>
      )}
    </form>
  );
}
