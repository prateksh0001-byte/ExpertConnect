import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ExpertList from './pages/ExpertList';
import ExpertDetail from './pages/ExpertDetail';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';
import ConsultationRoom from './pages/ConsultationRoom';

function NotFound() {
  return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
      <div className="section-kicker">PAGE NOT FOUND</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', margin: '8px 0 16px' }}>
        This page has wandered off.
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Let's get you back to the verified professionals who can help you take your next leap.
      </p>
      <Link to="/" className="btn-primary">
        Return to Explore Mentors →
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<ExpertList />} />
              <Route path="/experts/:id" element={<ExpertDetail />} />
              <Route path="/book/:id" element={<BookingPage />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/room/:bookingId" element={<ConsultationRoom />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}
