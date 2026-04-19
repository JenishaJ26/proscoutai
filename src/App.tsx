import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ScoutDashboard from './pages/ScoutDashboard';
import ChatbotPage from './pages/ChatbotPage';
import NewsFeed from './pages/NewsFeed';
import SettingsPage from './pages/SettingsPage';
import AthleteDashboard from './pages/AthleteDashboard';
import AppLayout from './components/AppLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <ScoutDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <AppLayout>
                <LeaderboardPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/news" element={
            <ProtectedRoute>
              <AppLayout>
                <NewsFeed />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute>
              <AppLayout>
                <ChatbotPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/athlete-dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <AthleteDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
