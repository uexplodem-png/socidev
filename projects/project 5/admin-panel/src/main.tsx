import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Apply theme from localStorage on initial load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Initialize the msw worker
async function enableMocking() {
  // Check if MSW is disabled via environment variable
  if (import.meta.env.MODE !== 'development' || import.meta.env.VITE_DISABLE_MSW === 'true') {
    return;
  }

  const { worker } = await import('./lib/msw/browser');
  return worker.start();
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});