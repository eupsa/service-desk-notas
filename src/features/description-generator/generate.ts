import {
  collaboratorFields,
  type Settings,
  type Ticket,
} from '../tickets/model';

export function generateTitle(ticket: Ticket): string {
  return [ticket.kba.trim(), ticket.summary.trim()].filter(Boolean).join(' - ');
}

export function generateDescription(
  ticket: Ticket,
  settings: Settings,
  label: (key: string) => string,
): string {
  return settings.sectionOrder
    .flatMap((section) => {
      const value =
        section === 'collaborator'
          ? collaboratorFields
              .flatMap((field) => {
                const content = ticket.collaborator[field].trim();
                return content
                  ? [`${label(`collaboratorFields.${field}`)}: ${content}`]
                  : [];
              })
              .join('\n')
          : ticket[section].trim();
      if (!value) return [];
      const text =
        section === 'troubleshooting' &&
        settings.troubleshootingMode === 'lines'
          ? value
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map(
                (line, i) =>
                  `${settings.marker === '1.' ? `${i + 1}.` : settings.marker} ${line}`,
              )
              .join('\n')
          : value;
      return [`${label(section)}\n${text}`];
    })
    .join('\n\n');
}
