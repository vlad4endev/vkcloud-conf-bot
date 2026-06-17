import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DashboardPage from './pages/DashboardPage';
import FeedbackPage from './pages/FeedbackPage';
import LoginPage from './pages/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import QuestionsPage from './pages/QuestionsPage';
import QuizPage from './pages/QuizPage';
import SchedulePage from './pages/SchedulePage';
import SettingsPage from './pages/SettingsPage';
import PartnersPage from './pages/PartnersPage';
import SpeakersPage from './pages/SpeakersPage';
import UsersLayout from './components/UsersLayout';
import UnregisteredUsersPage from './pages/UnregisteredUsersPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename="/panel">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersLayout />}>
                <Route index element={<UsersPage />} />
                <Route path="unregistered" element={<UnregisteredUsersPage />} />
              </Route>
              <Route path="speakers" element={<SpeakersPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="questions" element={<QuestionsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
