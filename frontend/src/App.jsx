import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import IntakePage from './pages/IntakePage';
import QueuePage from './pages/QueuePage';
import ReviewerDashboard from './pages/ReviewerDashboard';
import WhileYouWaitPage from './pages/WhileYouWaitPage';
import * as api from './api/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login({ username, password });
      localStorage.setItem('token', res.access_token);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-sahayak-dark">Reviewer Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-sahayak-teal" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:border-sahayak-teal" required />
        </div>
        <button type="submit" className="w-full py-2 bg-sahayak-teal text-white rounded hover:bg-sahayak-dark font-medium">
          Login
        </button>
      </form>
    </div>
  );
};

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <svg className="w-8 h-8 text-sahayak-teal" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span className="font-bold text-xl text-sahayak-dark tracking-tight">{t('app_title')}</span>
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link to="/" className="text-gray-600 hover:text-sahayak-teal px-3 py-2 rounded-md text-sm font-medium">{t('home')}</Link>
              <Link to="/queue" className="text-gray-600 hover:text-sahayak-teal px-3 py-2 rounded-md text-sm font-medium">{t('queue')}</Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-sahayak-teal px-3 py-2 rounded-md text-sm font-medium">{t('dashboard')}</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {i18n.language === 'en' ? 'हि' : 'EN'}
            </button>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">{t('logout')}</button>
            ) : (
              <Link to="/login" className="text-sm text-sahayak-teal font-medium hover:text-sahayak-dark">{t('login')}</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const App = () => {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />
        
        {/* Mandatory Disclaimer Banner */}
        <div className="bg-safety-red text-white text-xs font-medium py-1.5 px-4 text-center tracking-wide">
          {t('disclaimer')}
        </div>

        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<IntakePage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/dashboard" element={<ReviewerDashboard />} />
            <Route path="/while-you-wait" element={<WhileYouWaitPage />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 text-gray-300 py-6 text-center text-sm mt-auto">
          <p>{t('disclaimer')}</p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
