import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import { AdminProvider } from './context/AdminContext';
import { UserProvider } from './context/UserContext';
import AdminContentHub from './pages/admin/AdminContentHub';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminHub from './pages/admin/AdminHub';
import AdminMore from './pages/admin/AdminMore';
import AdminNotify from './pages/admin/AdminNotify';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminQuiz from './pages/admin/AdminQuiz';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSpeakers from './pages/admin/AdminSpeakers';
import AdminUsers from './pages/admin/AdminUsers';
import EventInfo from './pages/EventInfo';
import Feedback from './pages/Feedback';
import Map from './pages/Map';
import Quiz from './pages/Quiz';
import Schedule from './pages/Schedule';
import ScheduleHub from './pages/ScheduleHub';
import SpeakerDetail from './pages/SpeakerDetail';
import Speakers from './pages/Speakers';
import { useWebAppReady } from './hooks/useWebAppReady';

function AppRoutes() {
  useWebAppReady();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<EventInfo />} />
          <Route path="/schedule-hub" element={<ScheduleHub />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/map" element={<Map />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/speakers/:id" element={<SpeakerDetail />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/feedback" element={<Feedback />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminHub />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/content" element={<AdminContentHub />} />
            <Route path="/admin/more" element={<AdminMore />} />
            <Route path="/admin/speakers" element={<AdminSpeakers />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/quiz" element={<AdminQuiz />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/admin/notify" element={<AdminNotify />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AdminProvider>
        <AppRoutes />
      </AdminProvider>
    </UserProvider>
  );
}
