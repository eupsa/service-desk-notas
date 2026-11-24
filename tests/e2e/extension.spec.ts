import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let context: BrowserContext;
let profile: string;
let base: string;

test.beforeEach(async () => {
  profile = await mkdtemp(path.join(tmpdir(), 'service-desk-e2e-'));
  const extension = path.resolve('.output/chrome-mv3');
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
  base = `chrome-extension://${new URL(worker.url()).host}`;
});
test('keeps focus while typing across autosaves', async () => {
  const page = await context.newPage();
  await page.goto(base + '/sidepanel.html');
  for (const label of ['Título / resumo', 'Descrição']) {
    const field = page.getByLabel(label, { exact: true });
    await field.click();
    // Digita devagar para atravessar vários ciclos de salvamento (400 ms).
    await page.keyboard.type('abcdefghij', { delay: 250 });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(/abcdefghij$/);
  }
});
test.afterEach(async () => {
  await context?.close();
  if (profile) {
    const resolved = path.resolve(profile);
    if (
      path.dirname(resolved) !== path.resolve(tmpdir()) ||
      !path.basename(resolved).startsWith('service-desk-e2e-')
    )
      throw new Error('Unexpected test profile path');
    await rm(resolved, { recursive: true, force: true });
  }
});

test('opens onboarding after installation and starts without a password', async () => {
  await expect
    .poll(
      () =>
        context
          .pages()
          .filter((page) => page.url() === base + '/onboarding.html').length,
    )
    .toBe(1);
  const page = context
    .pages()
    .find((page) => page.url() === base + '/onboarding.html')!;
  await expect(
    page.getByRole('heading', {
      name: 'Seu atendimento começa aqui.',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Abra e comece', { exact: true })).toBeVisible();
  expect(
    (await page.evaluate(() => indexedDB.databases())).some(
      (db) => db.name === 'service-desk-v1',
    ),
  ).toBe(false);
  await page
    .getByLabel('Idioma desta página', { exact: true })
    .selectOption('en-US');
  await expect(
    page.getByRole('heading', {
      name: 'Your next support ticket starts here.',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel('Page language', { exact: true }).selectOption('es');
  await expect(
    page.getByRole('heading', {
      name: 'Tu próxima atención empieza aquí.',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel('Idioma de esta página', { exact: true })
    .selectOption('pt-BR');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass('dark');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('body').evaluate((body) => {
    body.style.zoom = '2';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator('body').evaluate((body) => {
    body.style.zoom = '';
  });
  await page
    .getByRole('link', {
      name: 'Começar meu primeiro atendimento',
      exact: true,
    })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(base + '/dashboard.html');
  await expect(
    page.getByLabel('Título / resumo', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test('saves separate collaborator inputs, generates labels and synchronizes windows', async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(base + '/dashboard.html');
  await page.getByLabel('Artigo KBA', { exact: true }).fill('KBA1000013');
  await page.getByLabel('Título / resumo', { exact: true }).fill('Acesso SAP');
  await page
    .getByLabel('Descrição', { exact: true })
    .fill('Sem acesso ao sistema');
  await page
    .getByLabel('Troubleshooting', { exact: true })
    .fill('Validar login\nTestar conexão');
  await page.getByLabel('Nome completo', { exact: true }).fill('Maria Silva');
  await page.getByLabel('Login / matrícula', { exact: true }).fill('maria.s');
  await page.getByLabel('E-mail', { exact: true }).fill('maria@empresa.test');
  await page.getByLabel('Telefone / ramal', { exact: true }).fill('1234');
  await page.getByLabel('Setor', { exact: true }).fill('Financeiro');
  await page.getByLabel('Localidade', { exact: true }).fill('Salvador');
  await expect(
    page.getByText('Salvo neste navegador', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Gerar e copiar', exact: true })
    .click();
  await expect(page.locator('pre')).toContainText('KBA1000013 - Acesso SAP');
  await expect(page.locator('pre')).toContainText('Nome completo: Maria Silva');
  await expect(page.locator('pre')).toContainText('Telefone / ramal: 1234');
  await expect(page.locator('pre')).toContainText('Localidade: Salvador');
  await expect(page.locator('pre')).not.toContainText('Observações:');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue(
    'Maria Silva',
  );
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue(
    'maria@empresa.test',
  );
  await expect(page.getByLabel('Localidade', { exact: true })).toHaveValue(
    'Salvador',
  );
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Bloquear', exact: true }),
  ).toHaveCount(0);
  const second = await context.newPage();
  await second.goto(base + '/sidepanel.html');
  await expect(second.getByLabel('Nome completo', { exact: true })).toHaveValue(
    'Maria Silva',
  );
  await page
    .getByLabel('Título / resumo', { exact: true })
    .fill('Edição na aba');
  await expect(
    page.getByText('Salvo neste navegador', { exact: true }),
  ).toBeVisible();
  await expect(
    second.getByLabel('Título / resumo', { exact: true }),
  ).toHaveValue('Edição na aba');
  await Promise.all([
    page
      .getByLabel('Título / resumo', { exact: true })
      .fill('Edição concorrente A'),
    second
      .getByLabel('Título / resumo', { exact: true })
      .fill('Edição concorrente B'),
  ]);
  await expect
    .poll(
      async () =>
        (await page.getByRole('alert').count()) +
        (await second.getByRole('alert').count()),
    )
    .toBe(1);
  const loser = (await page.getByRole('alert').count()) ? page : second;
  const winner = loser === page ? second : page;
  await expect(loser.getByRole('alert')).toContainText('Outra janela alterou');
  await expect(
    loser.getByLabel('Título / resumo', { exact: true }),
  ).toHaveValue(
    loser === page ? 'Edição concorrente A' : 'Edição concorrente B',
  );
  const saved = await winner
    .getByLabel('Título / resumo', { exact: true })
    .inputValue();
  await loser
    .getByRole('button', {
      name: 'Carregar versão salva (descarta edição local)',
      exact: true,
    })
    .click();
  await expect(
    loser.getByLabel('Título / resumo', { exact: true }),
  ).toHaveValue(saved);
});

test('supports blue themes, translations and section ordering without icon backgrounds', async () => {
  const page = await context.newPage();
  await page.goto(base + '/options.html');
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('#auto-lock')).toHaveCount(0);
  await page.getByRole('radio', { name: 'Escuro', exact: true }).check();
  await expect(page.locator('html')).toHaveClass('dark');
  await page
    .getByRole('button', {
      name: 'Mover para cima: Troubleshooting',
      exact: true,
    })
    .click();
  await expect(page.locator('li').first()).toContainText('Troubleshooting');
  const icon = page.getByRole('button', { name: 'Abrir em aba', exact: true });
  await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await icon.hover();
  await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page
    .getByLabel('Idioma da interface e do texto', { exact: true })
    .selectOption('es');
  await expect(page.locator('h1')).toHaveText('Configuración');
  await page
    .getByLabel('Idioma de la interfaz y del texto', { exact: true })
    .selectOption('en-US');
  await expect(page.locator('h1')).toHaveText('Settings');
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
});

test('stays usable after inactivity and reopens directly with saved data', async () => {
  const page = await context.newPage();
  await page.goto(base + '/dashboard.html');
  await page
    .getByLabel('Título / resumo', { exact: true })
    .fill('Registro sem bloqueio');
  await expect(
    page.getByText('Salvo neste navegador', { exact: true }),
  ).toBeVisible();
  await page.clock.install();
  await page.clock.fastForward(60 * 60_000);
  await expect(page.getByLabel('Título / resumo', { exact: true })).toHaveValue(
    'Registro sem bloqueio',
  );
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Título / resumo', { exact: true })).toHaveValue(
    'Registro sem bloqueio',
  );
});
