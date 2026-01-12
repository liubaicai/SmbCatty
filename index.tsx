import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import { Suspense,lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './application/i18n/I18nProvider';
import { ToastProvider } from './components/ui/toast';

const LazySettingsPage = lazy(() => import('./components/SettingsPage'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Simple hash-based routing for separate windows
const getRoute = () => {
  const hash = window.location.hash;
  if (hash === '#/settings' || hash.startsWith('#/settings')) {
    return 'settings';
  }
  return 'main';
};

const root = ReactDOM.createRoot(rootElement);

const renderApp = () => {
  const route = getRoute();
  if (route === 'settings') {
    root.render(
      <I18nProvider>
        <ToastProvider>
          <Suspense fallback={null}>
            <LazySettingsPage />
          </Suspense>
        </ToastProvider>
      </I18nProvider>
    );
  } else {
    root.render(<App />);
  }
};

// Initial render
renderApp();

// Listen for hash changes
window.addEventListener('hashchange', renderApp);
