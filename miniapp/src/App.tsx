import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import EventInfo from './pages/EventInfo';
import ScheduleHub from './pages/ScheduleHub';
import Schedule from './pages/Schedule';
import Map from './pages/Map';
import Speakers from './pages/Speakers';
import SpeakerDetail from './pages/SpeakerDetail';
import Quiz from './pages/Quiz';
import Feedback from './pages/Feedback';
import { UserProvider } from './context/UserContext';
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}
