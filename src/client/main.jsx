import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Game from './components/Game.jsx';

// Monkey patch fetch to include username
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  
  // Create Headers object handling or plain object
  if (config.headers instanceof Headers) {
    config.headers.set('x-username', localStorage.getItem('username') || 'guest');
    config.headers.set('x-subreddit', 'global');
  } else {
    config.headers['x-username'] = localStorage.getItem('username') || 'guest';
    config.headers['x-subreddit'] = 'global';
  }
  
  return originalFetch(resource, config);
};

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [inputName, setInputName] = useState('');

  if (!username) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: 'white', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🧛 Vampire Siege</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#aaa' }}>Enter a pilot name to begin your siege</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (inputName.trim()) {
            localStorage.setItem('username', inputName.trim());
            setUsername(inputName.trim());
          }
        }} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={inputName} 
            onChange={e => setInputName(e.target.value)} 
            placeholder="Username"
            style={{ padding: '0.8rem 1rem', fontSize: '1.2rem', borderRadius: '8px', border: '2px solid #555', backgroundColor: '#333', color: 'white', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '0.8rem 1.5rem', fontSize: '1.2rem', borderRadius: '8px', border: 'none', backgroundColor: '#e53935', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Play</button>
        </form>
      </div>
    );
  }

  return <Game />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
