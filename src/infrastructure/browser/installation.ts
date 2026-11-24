import { browser } from 'wxt/browser';

export async function handleInstalled({ reason }: { reason: string }) {
  if (reason !== 'install') return;
  await browser.tabs.create({
    url: browser.runtime.getURL('/onboarding.html'),
  });
}
