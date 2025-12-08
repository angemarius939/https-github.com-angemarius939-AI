import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting application mount...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Application mounted successfully.");
} catch (error) {
  console.error("Failed to mount application:", error);
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; background-color: #fef2f2; color: #7f1d1d; font-family: sans-serif; text-align: center;">
      <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Habaye Ikibazo</h1>
      <p style="margin-bottom: 0.5rem;">Porogaramu ntiyabashije gutangira.</p>
      <p style="font-size: 0.875rem; opacity: 0.8;">Nyamuneka ongera ugerageze (Refresh) cyangwa uvugishe ushinzwe tekinike.</p>
    </div>
  `;
}