
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
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; background-color: #f0fdf4; color: #064e3b; font-family: sans-serif; text-align: center; background-image: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
      <div style="background: white; padding: 40px; border-radius: 32px; shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); border: 1px solid #bbf7d0; max-width: 400px; width: 100%;">
        <div style="width: 64px; height: 64px; background: #10b981; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white; position: relative;">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
           <div style="position: absolute; top: -5px; right: -5px; background: #fbbf24; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>
        </div>
        <h1 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #064e3b; text-transform: uppercase; tracking-tighter: -0.05em;">Habaye Ikibazo</h1>
        <p style="margin-bottom: 1.5rem; line-height: 1.6; color: #166534;">Porogaramu ntiyabashije gutangira neza. Ibi bishobora guterwa n'uko API_KEY itarashyirwamo muri Vercel.</p>
        <button onclick="window.location.reload()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: transform 0.2s;">Ongera ugerageze (Reload)</button>
        <p style="font-size: 0.75rem; opacity: 0.6; margin-top: 24px;">ai.rw v2.1 • Research Analytics</p>
      </div>
    </div>
  `;
}
