import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import '../styles/tailwind.css';

const SESSION_KEY = 'wcs_splash_shown';

function Root() {
  const [showSplash, setShowSplash] = useState(
    () => sessionStorage.getItem(SESSION_KEY) !== 'true'
  );

  function handleSplashComplete() {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowSplash(false);
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <App />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);