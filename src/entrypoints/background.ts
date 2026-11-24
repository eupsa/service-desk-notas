import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { handleInstalled } from '../infrastructure/browser/installation';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(handleInstalled);

  if (import.meta.env.BROWSER === 'firefox') {
    browser.action.onClicked.addListener(() => {
      // Called synchronously in the user gesture, as required by Firefox.
      const firefox = browser as typeof browser & {
        sidebarAction: { open: () => Promise<void> };
      };
      void firefox.sidebarAction.open();
    });
  } else {
    void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
