
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount the application.");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("ai.rw: Application mounted successfully.");
} catch (error) {
  console.error("ai.rw: Failed to mount application:", error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0fdf4; font-family: sans-serif; text-align: center;">
      <div style="background: white; padding: 40px; border-radius: 32px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); border: 1px solid #bbf7d0; max-width: 400px;">
        <h1 style="color: #064e3b; margin-bottom: 1rem;">Habaye Ikibazo</h1>
        <p style="color: #166534; margin-bottom: 1.5rem;">Porogaramu ntiyabashije gutangira. Nyamuneka ongera ufungure urupapuro.</p>
        <button onclick="window.location.reload()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer;">Ongera ugerageze</button>
      </div>
    </div>
  `;
}
