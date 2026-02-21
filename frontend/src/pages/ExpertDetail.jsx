import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

const categoryColors = {
  Technology: '#2563eb', Finance: '#7c3aed', Health: '#059669',
  Legal: '#d97706', Marketing: '#db2777', Design: '#0891b2',
  Business: '#dc2626', Education: '#65a30d',
};

function groupSlotsByDate(slots) {
  const groups = {};
  slots.forEach(slot => {
    if (!groups[slot.date]) groups[slot.date] = [];
    groups[slot.date].push(slot);
  });
  return groups;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ExpertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [realtimeNotif, setRealtimeNotif] = useState('');
  const notifTimer = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/experts/${id}`);
        setExpert(data.data);
        const dates = Object.keys(groupSlotsByDate(data.data.availableSlots));
        if (dates.length > 0) setSelectedDate(dates[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Socket.io real-time updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !id) return;

    socket.emit('join-expert', id);

    const handleSlotBooked = ({ date, timeSlot }) => {
      setExpert(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          availableSlots: prev.availableSlots.map(slot =>
            slot.date === date && slot.time === timeSlot
              ? { ...slot, isBooked: true }
              : slot
          ),
        };
      });
      clearTimeout(notifTimer.current);
      setRealtimeNotif(`⚡ A slot at ${timeSlot} on ${formatDate(date)} was just booked!`);
      notifTimer.current = setTimeout(() => setRealtimeNotif(''), 4000);
    };

    const handleSlotFreed = ({ date, timeSlot }) => {
      setExpert(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          availableSlots: prev.availableSlots.map(slot =>
            slot.date === date && slot.time === timeSlot
              ? { ...slot, isBooked: false }
              : slot
          ),
        };
      });
    };

    socket.on('slot-booked', handleSlotBooked);
    socket.on('slot-freed', handleSlotFreed);

    return () => {
      socket.off('slot-booked', handleSlotBooked);
      socket.off('slot-freed', handleSlotFreed);
      socket.emit('leave-expert', id);
    };
  }, [id, socketRef]);

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '3rem auto', padding: '0 1.5rem' }}>
      <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 900, margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
      <div style={{ background: 'var(--error-pale)', border: '1px solid var(--error)', color: 'var(--error)', padding: '2rem', borderRadius: 12 }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
        <h3>Failed to load expert</h3>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>
        <Link to="/" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--forest)', textDecoration: 'underline' }}>← Back to experts</Link>
      </div>
    </div>
  );

  if (!expert) return null;

  const hue = expert.name.charCodeAt(0) * 7 % 360;
  const initials = expert.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const slotsByDate = groupSlotsByDate(expert.availableSlots);
  const dates = Object.keys(slotsByDate).sort();
  const slotsForDate = selectedDate ? slotsByDate[selectedDate] || [] : [];
  const availableCount = expert.availableSlots.filter(s => !s.isBooked).length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }} className="animate-in">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        ← Back to experts
      </Link>

      {/* Real-time notification */}
      {realtimeNotif && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fbbf24', color: '#92400e',
          padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
          animation: 'fadeIn 0.3s ease',
        }}>
          {realtimeNotif}
        </div>
      )}

      {/* Expert Header */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: `hsl(${hue}, 50%, 88%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'DM Serif Display, serif', fontSize: '1.75rem',
          color: `hsl(${hue}, 50%, 30%)`, border: `3px solid hsl(${hue}, 50%, 78%)`,
        }}>{initials}</div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontFamily: 'DM Serif Display, serif' }}>{expert.name}</h1>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', color: 'var(--forest-mid)' }}>
              ${expert.hourlyRate}<span style={{ fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: 'var(--ink-muted)', fontWeight: 400 }}>/hr</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
            <span style={{
              background: `${categoryColors[expert.category] || '#666'}18`,
              color: categoryColors[expert.category] || '#666',
              padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
            }}>{expert.category}</span>
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{expert.experience} years experience</span>
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>⭐ {expert.rating} ({expert.reviewCount} reviews)</span>
            <span style={{ color: availableCount > 0 ? 'var(--success)' : 'var(--error)', fontSize: '0.8rem', fontWeight: 500, background: availableCount > 0 ? 'var(--success-pale)' : 'var(--error-pale)', padding: '2px 10px', borderRadius: 20 }}>
              {availableCount} slots available
            </span>
          </div>

          <p style={{ color: 'var(--ink-light)', lineHeight: 1.6, fontSize: '0.9rem' }}>{expert.bio}</p>

          {expert.skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
              {expert.skills.map(skill => (
                <span key={skill} style={{ background: 'var(--cream-dark)', color: 'var(--ink-light)', padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem' }}>{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slots */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'DM Serif Display, serif' }}>Available Time Slots</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Updates in real-time
          </span>
        </div>

        {dates.length === 0 ? (
          <p style={{ color: 'var(--ink-muted)', textAlign: 'center', padding: '2rem' }}>No available dates</p>
        ) : (
          <>
            {/* Date picker */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--cream-dark)' }}>
              {dates.map(date => {
                const slots = slotsByDate[date];
                const avail = slots.filter(s => !s.isBooked).length;
                return (
                  <button key={date} onClick={() => setSelectedDate(date)} style={{
                    padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 500,
                    border: `2px solid ${selectedDate === date ? 'var(--forest)' : 'var(--border)'}`,
                    background: selectedDate === date ? 'var(--forest)' : '#fff',
                    color: selectedDate === date ? '#fff' : 'var(--ink-light)',
                    cursor: 'pointer', transition: 'all 0.18s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    opacity: avail === 0 ? 0.5 : 1,
                  }}>
                    <span>{formatDate(date)}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>{avail} free</span>
                  </button>
                );
              })}
            </div>

            {/* Time slots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.6rem' }}>
              {slotsForDate.sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
                <div key={slot.time} style={{
                  padding: '0.6rem', textAlign: 'center', borderRadius: 8,
                  border: `2px solid ${slot.isBooked ? '#e5e7eb' : 'var(--forest-mid)'}`,
                  background: slot.isBooked ? 'var(--cream-dark)' : 'var(--success-pale)',
                  color: slot.isBooked ? 'var(--ink-muted)' : 'var(--success)',
                  fontSize: '0.875rem', fontWeight: 500,
                  transition: 'all 0.25s',
                  opacity: slot.isBooked ? 0.6 : 1,
                }}>
                  {slot.time}
                  {slot.isBooked && <div style={{ fontSize: '0.65rem', marginTop: 2 }}>Booked</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Book button */}
        <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate(`/book/${expert._id}`, { state: { expert } })}
            disabled={availableCount === 0}
            style={{
              flex: 1, padding: '0.9rem', background: availableCount > 0 ? 'var(--forest)' : 'var(--cream-dark)',
              color: availableCount > 0 ? '#fff' : 'var(--ink-muted)',
              borderRadius: 12, fontWeight: 600, fontSize: '1rem',
              cursor: availableCount > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {availableCount > 0 ? `Book a Session — $${expert.hourlyRate}` : 'No Slots Available'}
          </button>
        </div>
      </div>
    </div>
  );
}
