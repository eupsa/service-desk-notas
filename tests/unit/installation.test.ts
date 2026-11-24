import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createTab } = vi.hoisted(() => ({
  createTab: vi.fn().mockResolvedValue({}),
}));
vi.mock('wxt/browser', () => ({
  browser: {
    tabs: { create: createTab },
    runtime: { getURL: (path: string) => `extension://test${path}` },
  },
}));
import { handleInstalled } from '../../src/infrastructure/browser/installation';

describe('installation onboarding', () => {
  beforeEach(() => {
    createTab.mockClear();
  });
  it('opens the internal welcome page on first installation', async () => {
    await handleInstalled({ reason: 'install' });
    expect(createTab).toHaveBeenCalledExactlyOnceWith({
      url: 'extension://test/onboarding.html',
    });
  });
  it.each([
    'update',
    'chrome_update',
    'browser_update',
    'shared_module_update',
  ])('does not open a tab for %s', async (reason) => {
    await handleInstalled({ reason });
    expect(createTab).not.toHaveBeenCalled();
  });
});
