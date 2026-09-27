import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import CreateSheet from './pages/CreateSheet.jsx';
import SheetHistory from './pages/SheetHistory.jsx';
import SheetDetail from './pages/SheetDetail.jsx';
import Instruments from './pages/Instruments.jsx';
import DueDates from './pages/DueDates.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<CreateSheet />} />
          <Route path="/history" element={<SheetHistory />} />
          <Route path="/history/:id" element={<SheetDetail />} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/due-dates" element={<DueDates />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
