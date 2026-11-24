import { describe, expect, it } from 'vitest';
import {
  generateDescription,
  generateTitle,
} from '../../src/features/description-generator/generate';
import {
  newWorkspace,
  recognizeTicket,
  type Section,
} from '../../src/features/tickets/model';
import pt from '../../src/i18n/locales/pt-BR.json';
import en from '../../src/i18n/locales/en-US.json';
import es from '../../src/i18n/locales/es.json';

const label = (key: string) =>
  key.startsWith('collaboratorFields.')
    ? pt.collaboratorFields[
        key.split('.')[1] as keyof typeof pt.collaboratorFields
      ]
    : pt[key as Section];
describe('ticket output', () => {
  it('omits empty sections and excludes ticket identifiers from the description', () => {
    const { ticket, settings } = newWorkspace();
    ticket.number = 'INC0000000124216';
    ticket.kba = 'KBA1000013';
    ticket.summary = 'Acesso SAP';
    ticket.description = 'Sem acesso';
    expect(generateTitle(ticket)).toBe('KBA1000013 - Acesso SAP');
    expect(generateDescription(ticket, settings, label)).toBe(
      'Descrição\nSem acesso',
    );
  });
  it('numbers nonempty lines, supports free text and respects ordering', () => {
    const { ticket, settings } = newWorkspace();
    ticket.troubleshooting = ' Passo A\n\n Passo B ';
    ticket.description = 'Problema';
    settings.marker = '1.';
    settings.sectionOrder = ['troubleshooting', 'collaborator', 'description'];
    expect(generateDescription(ticket, settings, (key) => key)).toBe(
      'troubleshooting\n1. Passo A\n2. Passo B\n\ndescription\nProblema',
    );
    settings.troubleshootingMode = 'text';
    expect(generateDescription(ticket, settings, (key) => key)).toContain(
      'Passo A\n\n Passo B',
    );
  });
  it('formats separate collaborator inputs and omits empty fields', () => {
    const { ticket, settings } = newWorkspace();
    ticket.collaborator.name = 'Maria';
    ticket.collaborator.login = 'maria.s';
    ticket.collaborator.phone = '1234';
    ticket.collaborator.location = 'Salvador';
    expect(generateDescription(ticket, settings, label)).toBe(
      'Dados do colaborador\nNome completo: Maria\nLogin / matrícula: maria.s\nTelefone / ramal: 1234\nLocalidade: Salvador',
    );
  });
  it('recognizes INC and WO without imposing digit counts', () => {
    expect(recognizeTicket('INC0000000124216')).toBe('INC');
    expect(recognizeTicket('wo123')).toBe('WO');
    expect(recognizeTicket('123')).toBeUndefined();
  });
  it('keeps all translations aligned', () => {
    for (const language of [en, es]) {
      expect(Object.keys(language).sort()).toEqual(Object.keys(pt).sort());
      expect(Object.keys(language.onboarding).sort()).toEqual(
        Object.keys(pt.onboarding).sort(),
      );
      expect(Object.keys(language.collaboratorFields).sort()).toEqual(
        Object.keys(pt.collaboratorFields).sort(),
      );
    }
    expect(
      generateTitle({ ...newWorkspace().ticket, summary: 'Sem KBA' }),
    ).toBe('Sem KBA');
  });
});
