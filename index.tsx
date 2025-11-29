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
}
