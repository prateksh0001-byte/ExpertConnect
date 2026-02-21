import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const statusConfig = {
  Pending: { bg: '#fef9c3', color: '#854d0e', border: '#fde047', icon: '⏳' },
  Confirmed: { bg: '#dcfce7', color: '#166534', border: '#86efac', icon: '✅' },
  Completed: { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc', icon: '🎓' },
  Cancelled: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: '❌' },
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function BookingCard({ booking, onStatusUpdate, index }) {
  const s = statusConfig[booking.status] || statusConfig.Pending;
  const [updating, setUpdating] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setUpdating(true);
    try {
      await onStatusUpdate(booking._id, 'Cancelled');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="animate-in" style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
      padding: '1.5rem', animationDelay: `${index * 0.05}s`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', marginBottom: 4 }}>{booking.expertName}</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>📅 {formatDate(booking.date)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>🕐 {booking.timeSlot}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
          }}>
            {s.icon} {booking.status}
          </span>
        </div>
      </div>

      <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{booking.clientName}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{booking.clientEmail}</div>
        </div>
        {booking.notes && (
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Notes</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ink-light)' }}>{booking.notes}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
          Booked {new Date(booking.createdAt).toLocaleDateString()}
        </span>
        {booking.status === 'Pending' && (
          <button onClick={handleCancel} disabled={updating} style={{
            padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.8rem',
            border: '1px solid var(--error)', color: 'var(--error)', background: '#fff',
            cursor: updating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--error)'; }}
          >
            {updating ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const fetchBookings = async (e) => {
    e?.preventDefault();
    if (!emailInput.trim() || !/^\S+@\S+\.\S+$/.test(emailInput)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    setEmail(emailInput.trim());
    try {
      const { data } = await api.get('/bookings', { params: { email: emailInput.trim() } });
      setBookings(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status } : b));
    } catch (err) {
      alert(err.message);
    }
  };

  const grouped = {
    Pending: bookings.filter(b => b.status === 'Pending'),
    Confirmed: bookings.filter(b => b.status === 'Confirmed'),
    Completed: bookings.filter(b => b.status === 'Completed'),
    Cancelled: bookings.filter(b => b.status === 'Cancelled'),
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '0.5rem' }}>My Bookings</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Enter your email to view your session bookings</p>

      {/* Email search */}
      <form onSubmit={fetchBookings} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', maxWidth: 480 }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={emailInput}
          onChange={e => { setEmailInput(e.target.value); setError(''); }}
          style={{
            flex: 1, padding: '0.75rem 1rem', border: `2px solid ${error ? 'var(--error)' : 'var(--border)'}`,
            borderRadius: 10, fontSize: '0.9rem', background: '#fff', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'}
          onBlur={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--border)'}
        />
        <button type="submit" disabled={loading} style={{
          padding: '0.75rem 1.25rem', background: 'var(--forest)', color: '#fff',
          borderRadius: 10, fontWeight: 600, fontSize: '0.875rem',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Loading...' : 'Find Bookings'}
        </button>
      </form>

      {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>⚠️ {error}</div>}

      {/* Results */}
      {!searched ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--ink-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Find your sessions</h3>
          <p style={{ fontSize: '0.875rem' }}>Enter the email you used when booking</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />)}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No bookings found</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1.5rem' }}>
            No bookings found for <strong>{email}</strong>
          </p>
          <Link to="/" style={{ display: 'inline-block', padding: '0.7rem 1.5rem', background: 'var(--forest)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem' }}>
            Browse Experts
          </Link>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
              Found <strong style={{ color: 'var(--ink)' }}>{bookings.length}</strong> booking{bookings.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--ink)' }}>{email}</strong>
            </p>
            {/* Summary pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(grouped).filter(([, arr]) => arr.length > 0).map(([status, arr]) => {
                const s = statusConfig[status];
                return (
                  <span key={status} style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {s.icon} {arr.length} {status}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map((booking, i) => (
              <BookingCard key={booking._id} booking={booking} onStatusUpdate={handleStatusUpdate} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
