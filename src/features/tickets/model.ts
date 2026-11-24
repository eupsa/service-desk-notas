import { z } from 'zod';

const baseTicketSchema = z.object({
  number: z.string().max(100),
  kba: z.string().max(100),
  summary: z.string().max(500),
  description: z.string().max(30_000),
  troubleshooting: z.string().max(30_000),
});
export const collaboratorSchema = z.object({
  name: z.string().max(300),
  login: z.string().max(300),
  email: z.string().max(300),
  phone: z.string().max(100),
  department: z.string().max(300),
  location: z.string().max(300).default(''),
  notes: z.string().max(10_000),
});
export type Collaborator = z.infer<typeof collaboratorSchema>;
export const collaboratorFields = [
  'name',
  'login',
  'email',
  'phone',
  'department',
  'location',
  'notes',
] as const;
export const emptyCollaborator: Collaborator = {
  name: '',
  login: '',
  email: '',
  phone: '',
  department: '',
  location: '',
  notes: '',
};
export const ticketSchema = baseTicketSchema.extend({
  collaborator: collaboratorSchema,
});
export type Ticket = z.infer<typeof ticketSchema>;
export type TicketFormValues = z.input<typeof ticketSchema>;
export const emptyTicket: Ticket = {
  number: '',
  kba: '',
  summary: '',
  description: '',
  troubleshooting: '',
  collaborator: { ...emptyCollaborator },
};
export const sectionSchema = z.enum([
  'description',
  'troubleshooting',
  'collaborator',
]);
export type Section = z.infer<typeof sectionSchema>;
export const settingsSchema = z.object({
  language: z.enum(['pt-BR', 'en-US', 'es']),
  troubleshootingMode: z.enum(['lines', 'text']),
  marker: z.enum(['-', '•', '1.']),
  theme: z.enum(['system', 'light', 'dark']),
  density: z.enum(['comfortable', 'compact']),
  sectionOrder: z
    .array(sectionSchema)
    .length(3)
    .refine((value) => new Set(value).size === 3),
});
export type Settings = z.infer<typeof settingsSchema>;
export const defaultSettings: Settings = {
  language: 'pt-BR',
  troubleshootingMode: 'lines',
  marker: '-',
  theme: 'system',
  density: 'comfortable',
  sectionOrder: ['description', 'troubleshooting', 'collaborator'],
};
export const workspaceSchema = z.object({
  version: z.literal(2),
  ticket: ticketSchema,
  settings: settingsSchema,
});
export type Workspace = z.infer<typeof workspaceSchema>;
export const newWorkspace = (): Workspace => ({
  version: 2,
  ticket: { ...emptyTicket, collaborator: { ...emptyCollaborator } },
  settings: {
    ...defaultSettings,
    sectionOrder: [...defaultSettings.sectionOrder],
  },
});
// Previous schema remains available for recovery and rollback.
export const legacyWorkspaceSchema = z.object({
  version: z.literal(1),
  ticket: baseTicketSchema.extend({ collaborator: z.string().max(10_000) }),
  settings: settingsSchema.extend({
    autoLockMinutes: z.number().int().min(1).max(60),
  }),
});
export type LegacyWorkspace = z.infer<typeof legacyWorkspaceSchema>;
export const newLegacyWorkspace = (): LegacyWorkspace => ({
  version: 1,
  ticket: { ...emptyTicket, collaborator: '' },
  settings: { ...newWorkspace().settings, autoLockMinutes: 5 },
});
export function migrateLegacy(value: LegacyWorkspace): Workspace {
  const legacy = legacyWorkspaceSchema.parse(value);
  return workspaceSchema.parse({
    version: 2,
    ticket: {
      ...legacy.ticket,
      collaborator: { ...emptyCollaborator, notes: legacy.ticket.collaborator },
    },
    settings: legacy.settings,
  });
}
export function isEmptyTicket(ticket: Ticket): boolean {
  return [
    ticket.number,
    ticket.kba,
    ticket.summary,
    ticket.description,
    ticket.troubleshooting,
    ...Object.values(ticket.collaborator),
  ].every((value) => !value.trim());
}
export function recognizeTicket(number: string): 'INC' | 'WO' | undefined {
  return /^(INC|WO)\d+$/i.exec(number.trim())?.[1]?.toUpperCase() as
    'INC' | 'WO' | undefined;
}
