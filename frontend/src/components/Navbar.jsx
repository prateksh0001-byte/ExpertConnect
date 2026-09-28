import { Link, useLocation } from 'react-router-dom';
import { Compass, Calendar, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { pathname } = useLocation();
  const socketRef = useSocket();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    if (socket.connected) setIsConnected(true);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socketRef]);

  return (
    <header className="navbar">
      <Link className="brand" to="/" aria-label="ExpertConnect Home">
        <div className="brand-mark" aria-hidden="true">E</div>
        <div className="brand-text">
          <span className="brand-name">ExpertConnect</span>
          <span className="brand-badge">Enterprise Mentorship</span>
        </div>
      </Link>

      <div className="nav-right">
        <div className="socket-status-pill" title={isConnected ? 'Connected to live real-time sync engine' : 'Connecting to real-time engine...'}>
          <span className="socket-pulse-dot" style={{ background: isConnected ? '#2e7d32' : '#d97706' }} />
          <span>{isConnected ? 'Real-Time Sync' : 'Connecting...'}</span>
        </div>

        <nav className="nav-links" aria-label="Main Navigation">
          <Link
            className={`nav-link${pathname === '/' || pathname.startsWith('/experts/') ? ' active' : ''}`}
            to="/"
          >
            <Compass size={15} />
            <span>Browse Experts</span>
          </Link>
          <Link
            className={`nav-link${pathname === '/my-bookings' ? ' active' : ''}`}
            to="/my-bookings"
          >
            <Calendar size={15} />
            <span>My Sessions</span>
          </Link>
          <Link
            to="/"
            className="nav-link nav-link-cta"
            state={{ scrollToExperts: true }}
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' });
              }
              // On other pages: let Link navigate to '/' and ExpertList will scroll via location.state
            }}
          >
            <Sparkles size={14} />
            <span>Book a Session</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
