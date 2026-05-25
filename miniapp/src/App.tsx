import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import EventInfo from './pages/EventInfo';
import ScheduleHub from './pages/ScheduleHub';
import Schedule from './pages/Schedule';
import Map from './pages/Map';
import Speakers from './pages/Speakers';
import SpeakerDetail from './pages/SpeakerDetail';
import Quiz from './pages/Quiz';
import Feedback from './pages/Feedback';
import { createUserContextValue, UserContext } from './context/UserContext';
import { useMaxBridge } from './hooks/useMaxBridge';

export default function App() {
  const { userId, haptic, isReady } = useMaxBridge();

  if (!isReady) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: '#7b9cc0',
          fontSize: 15,
          background: '#0a0f1e',
        }}
      >
        Загрузка…
      </div>
    );
  }

  const userContext = createUserContextValue(userId, haptic);

  return (
    <UserContext.Provider value={userContext}>
      <HashRouter>
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
        </Routes>
      </HashRouter>
    </UserContext.Provider>
  );
}
