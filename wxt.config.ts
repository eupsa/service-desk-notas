import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Service Desk',
    description:
      'Local, encrypted service desk notes and description generator.',
    permissions: [
      'clipboardWrite',
      ...(browser === 'firefox' ? [] : ['sidePanel']),
    ],
    action: { default_title: 'Service Desk' },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'service-desk@local.invalid',
              strict_min_version: '140.0',
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : { minimum_chrome_version: '116' }),
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'none'; connect-src 'none'; base-uri 'none'",
    },
  }),
  vite: () => ({ plugins: [tailwindcss()] }),
});
