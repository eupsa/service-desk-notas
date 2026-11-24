import { createRoot } from 'react-dom/client';
import '../../i18n';
import '../../shared/styles/globals.css';
import { Onboarding } from '../../features/onboarding/onboarding';

createRoot(document.getElementById('root')!).render(<Onboarding />);
