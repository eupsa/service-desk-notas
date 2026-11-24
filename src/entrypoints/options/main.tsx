import { createRoot } from 'react-dom/client';
import '../../i18n';
import '../../shared/styles/globals.css';
import { App } from '../../shared/app';
createRoot(document.getElementById('root')!).render(<App page="settings" />);
