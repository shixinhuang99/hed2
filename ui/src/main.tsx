import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

function main() {
  const root = document.getElementById('root');

  if (!root) {
    throw new Error('no root element');
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

main();
