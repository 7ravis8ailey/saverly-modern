import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('=== SAVERLY DEBUG START ===');

try {
  console.log('1. Imports completed successfully');
  
  console.log('2. Finding root element...');
  const rootElement = document.getElementById('root');
  console.log('3. Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  console.log('4. Creating React root...');
  const root = createRoot(rootElement);
  console.log('5. Root created successfully');
  
  console.log('6. Rendering app...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('7. App rendered successfully!');
  
} catch (error: any) {
  console.error('=== SAVERLY ERROR ===', error);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: monospace;">
      <h1>Error Loading Saverly</h1>
      <pre>${error.message}</pre>
      <pre>${error.stack}</pre>
    </div>
  `;
}

console.log('=== SAVERLY DEBUG END ===');