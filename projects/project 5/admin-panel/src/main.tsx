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
  // MSW is currently disabled - using real backend API
  // Uncomment to enable MSW for mocking:
  // const { worker } = await import('./lib/msw/browser');
  // return worker.start();
  return Promise.resolve();
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}).catch(error => {
  console.error('Failed to initialize app:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Failed to initialize application</h1>
      <p>Error: ${error.message}</p>
      <p>Please check the console for more details.</p>
    </div>
  `;
});