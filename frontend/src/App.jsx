import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import IntakePage from './pages/IntakePage';
import QueuePage from './pages/QueuePage';
import ReviewerDashboard from './pages/ReviewerDashboard';
import WhileYouWaitPage from './pages/WhileYouWaitPage';
import AuthPage from './pages/AuthPage';
import GovHeader from './components/GovHeader';
import GovFooter from './components/GovFooter';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole] = useState(localStorage.getItem('sahayak_role') || null);

  const handleLogout = () => {
    localStorage.removeItem('sahayak_token');
    localStorage.removeItem('sahayak_role');
    localStorage.removeItem('token');
    setUserRole(null);
  };

  const handleLoginSuccess = (role) => {
    setUserRole(role);
  };

  return (
    <BrowserRouter>
      {/* 1. Animated Indian Government Health Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-200 selection:text-teal-900">
        {/* 2. Official National Healthcare Portal Header */}
        <GovHeader userRole={userRole} onLogout={handleLogout} />

        {/* 3. Main Application Content */}
        <main className="flex-1 w-full">
          <Routes>
            {/* Landing Page is the Home Screen */}
            <Route path="/" element={<LandingPage />} />

            {/* Direct Patient Triage — NO LOGIN REQUIRED */}
            <Route path="/triage" element={<IntakePage />} />
            <Route path="/intake" element={<Navigate to="/triage" replace />} />

            {/* Staff Authentication (Registration First, then Login) */}
            <Route
              path="/login"
              element={<AuthPage onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="/auth" element={<Navigate to="/login" replace />} />

            {/* Queue & Reviewer Dashboard */}
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/dashboard" element={<ReviewerDashboard />} />

            {/* Health Literacy Corner */}
            <Route path="/while-you-wait" element={<WhileYouWaitPage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* 4. Official Government Footer */}
        <GovFooter />
      </div>
    </BrowserRouter>
  );
}
