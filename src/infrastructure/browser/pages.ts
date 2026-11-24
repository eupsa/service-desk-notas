import { browser } from 'wxt/browser';

export function openDashboard() {
  return browser.tabs.create({
    url: browser.runtime.getURL('/dashboard.html'),
  });
}
export function openOptions() {
  return browser.runtime.openOptionsPage();
}
