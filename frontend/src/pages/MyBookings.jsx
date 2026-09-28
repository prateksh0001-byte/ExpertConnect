import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock3,
  Search,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../utils/api';
import { generateICS } from '../utils/calendar';
import { useSocket } from '../context/SocketContext';

const statusConfig = {
  Pending: { className: 'status-pending', icon: Clock3, label: 'Pending Confirmation' },
  Confirmed: { className: 'status-confirmed', icon: CheckCircle, label: 'Confirmed' },
  Completed: { className: 'status-completed', icon: CheckCircle, label: 'Completed' },
  Cancelled: { className: 'status-cancelled', icon: XCircle, label: 'Cancelled' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SessionCard({ booking, onCancel }) {
  const statusMeta = statusConfig[booking.status] || statusConfig.Pending;
  const StatusIcon = statusMeta.icon;
  const [cancelling, setCancelling] = useState(false);

  const handleCancelClick = async () => {
    if (
      !window.confirm(
        `Are you sure you want to cancel your session with ${booking.expertName}? Your slot will be freed up for other clients immediately.`
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      await onCancel(booking._id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <article className="booking-session-card animate-in">
      <div className="session-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {booking.expertId?.avatar ? (
            <img
              src={booking.expertId.avatar}
              alt={booking.expertName}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="expert-avatar-fallback"
              style={{ width: 48, height: 48, fontSize: 16 }}
            >
              {booking.expertName?.slice(0, 2) || 'EC'}
            </div>
          )}

          <div>
            <h3
              style={{
                margin: '0 0 4px',
                fontFamily: 'var(--font-serif)',
                fontSize: '20px',
                color: 'var(--text-main)',
              }}
            >
              {booking.expertName}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {booking.expertId?.category || 'Expert'} · 60-Minute Consultation
            </div>
          </div>
        </div>

        <span className={`status-pill ${statusMeta.className}`}>
          <StatusIcon size={13} />
          <span>{statusMeta.label}</span>
        </span>
      </div>

      <div className="session-info-grid">
        <div className="session-info-item">
          <span className="label">Appointment Date</span>
          <span className="value">{formatDate(booking.date)}</span>
        </div>
        <div className="session-info-item">
          <span className="label">Scheduled Time</span>
          <span className="value">{booking.timeSlot} (60 min)</span>
        </div>
        <div className="session-info-item">
          <span className="label">Client Email</span>
          <span className="value">{booking.clientEmail}</span>
        </div>
        <div className="session-info-item">
          <span className="label">Phone</span>
          <span className="value">{booking.clientPhone}</span>
        </div>
      </div>

      {booking.notes && (
        <div
          style={{
            fontSize: '12.5px',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            background: 'var(--bg-main)',
            padding: '10px 14px',
            borderRadius: '6px',
          }}
        >
          <strong>Agenda:</strong> {booking.notes}
        </div>
      )}

      <div className="session-actions-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {booking.status !== 'Cancelled' && (
            <>
              <Link
                to={`/room/${booking._id}`}
                className="btn-primary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                <Video size={14} />
                <span>Join Virtual Room</span>
              </Link>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
                onClick={() =>
                  generateICS({
                    title: `Consultation with ${booking.expertName}`,
                    description: booking.notes,
                    expertName: booking.expertName,
                    date: booking.date,
                    timeSlot: booking.timeSlot,
                  })
                }
              >
                <Download size={13} />
                <span>Save to Calendar</span>
              </button>
            </>
          )}
        </div>

        <div>
          {booking.status === 'Pending' && (
            <button
              type="button"
              className="btn-secondary"
              style={{
                color: '#dc2626',
                borderColor: '#fca5a5',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              disabled={cancelling}
              onClick={handleCancelClick}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MyBookings() {
  const location = useLocation();
  const socketRef = useSocket();

  const [emailInput, setEmailInput] = useState(
    location.state?.email || localStorage.getItem('expertBooking_email') || ''
  );
  const [activeEmail, setActiveEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchBookings = useCallback(
    async (emailToSearch) => {
      const target = (emailToSearch || emailInput).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(target)) {
        setError('Please enter a valid email address.');
        return;
      }

      setLoading(true);
      setError('');
      setSearched(true);
      setActiveEmail(target);
      localStorage.setItem('expertBooking_email', target);

      // Join the user-specific socket room so status updates are targeted
      const socket = socketRef?.current;
      if (socket) {
        socket.emit('join-user-room', target);
      }

      try {
        const { data } = await api.get('/bookings', { params: { email: target } });
        setBookings(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [emailInput, socketRef]
  );

  // One-time mount effect — auto-search if we have a stored/passed email.
  // Uses a ref guard so it never re-runs when fetchBookings reference changes.
  const hasFetchedOnMount = useRef(false);
  useEffect(() => {
    if (hasFetchedOnMount.current) return;
    const initialEmail = location.state?.email || localStorage.getItem('expertBooking_email');
    if (initialEmail) {
      hasFetchedOnMount.current = true;
      fetchBookings(initialEmail);
    }
  }, [fetchBookings]); // fetchBookings listed to satisfy lint; ref guard prevents re-runs

  // Listen to socket status updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStatusChanged = ({ bookingId, status }) => {
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
      );
    };

    socket.on('booking-status-changed', handleStatusChanged);
    return () => {
      socket.off('booking-status-changed', handleStatusChanged);
    };
  }, [socketRef]);

  const handleCancel = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: 'Cancelled' });
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: 'Cancelled' } : b))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    fetchBookings(emailInput);
  };

  const filteredBookings =
    statusFilter === 'All'
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  const statusCounts = {
    All: bookings.length,
    Pending: bookings.filter((b) => b.status === 'Pending').length,
    Confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
    Completed: bookings.filter((b) => b.status === 'Completed').length,
    Cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
  };

  return (
    <div className="bookings-container animate-in">
      <div className="section-kicker">SESSION MANAGEMENT</div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '36px',
          color: 'var(--text-main)',
          margin: '4px 0 12px',
        }}
      >
        My Scheduled Sessions
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', margin: 0 }}>
        Look up your upcoming and historical consultations by your email address.
      </p>

      {/* Email Lookup Input */}
      <form onSubmit={handleLookupSubmit} className="email-lookup-bar">
        <input
          type="email"
          autoComplete="email"
          placeholder="Enter your booking email (e.g. alex@example.com)..."
          className="form-input"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            setError('');
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ whiteSpace: 'nowrap' }}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Find Sessions'}
        </button>
      </form>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!searched ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <CalendarIcon size={44} color="var(--primary)" style={{ marginBottom: '14px' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '0 0 8px' }}>
            Find Your Calendar Sessions
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto' }}>
            Enter the email address you used when booking to view live links, download calendar
            invites, or manage your schedule.
          </p>
        </div>
      ) : loading ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-box" style={{ height: 180, borderRadius: 14 }} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ fontSize: '38px', marginBottom: '12px' }}>🗓️</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '0 0 8px' }}>
            No Sessions Found for {activeEmail}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 20px' }}>
            There are no registered consultations under this email. Explore our mentor network
            to book your first session.
          </p>
          <Link to="/" className="btn-primary">
            Explore Mentors
          </Link>
        </div>
      ) : (
        <>
          {/* Status Tabs */}
          <div className="status-tabs-row">
            {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                type="button"
                className={`status-tab-btn${statusFilter === status ? ' active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                <span>{status}</span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: statusFilter === status ? 'rgba(255,255,255,0.25)' : 'var(--bg-card-subtle)',
                    fontSize: '11px',
                  }}
                >
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>

          {/* Bookings List */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => (
                <SessionCard key={b._id} booking={b} onCancel={handleCancel} />
              ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-muted)',
                  fontSize: '13.5px',
                }}
              >
                No {statusFilter.toLowerCase()} sessions found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
