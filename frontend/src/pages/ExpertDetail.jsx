import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Clock,
  Calendar as CalendarIcon,
  Radio,
  CheckCircle2,
  Video,
  ArrowRight,
  Sun,
  Sunrise,
  Sunset,
  AlertCircle,
} from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

const categoryColors = {
  Technology: { bg: '#e8f0fe', text: '#1967d2' },
  Finance: { bg: '#f3e8fd', text: '#7627bb' },
  Health: { bg: '#e6f4ea', text: '#137333' },
  Legal: { bg: '#fef7e0', text: '#b06000' },
  Marketing: { bg: '#fce8e6', text: '#c5221f' },
  Design: { bg: '#e0f2fe', text: '#0284c7' },
  Business: { bg: '#fef3c7', text: '#b45309' },
  Education: { bg: '#ecfdf5', text: '#047857' },
};

function groupSlotsByDate(slots = []) {
  const groups = {};
  slots.forEach((slot) => {
    if (!groups[slot.date]) groups[slot.date] = [];
    groups[slot.date].push(slot);
  });
  return groups;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

export default function ExpertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [realtimeToast, setRealtimeToast] = useState('');
  const toastTimer = useRef(null);

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const { data } = await api.get(`/experts/${id}`);
        setExpert(data.data);
        const dates = Object.keys(groupSlotsByDate(data.data.availableSlots)).sort();
        if (dates.length > 0) setSelectedDate(dates[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchExpert();
  }, [id]);

  // Real-time Socket.io listener
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !id) return;

    socket.emit('join-expert', id);

    const handleSlotBooked = ({ date, timeSlot }) => {
      setExpert((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          availableSlots: prev.availableSlots.map((slot) =>
            slot.date === date && slot.time === timeSlot ? { ...slot, isBooked: true } : slot
          ),
        };
      });

      // If user had selected this slot, deselect it
      if (selectedDate === date && selectedTime === timeSlot) {
        setSelectedTime(null);
      }

      clearTimeout(toastTimer.current);
      setRealtimeToast(`⚡ Slot at ${timeSlot} on ${formatDate(date).monthDay} was just reserved by another user!`);
      toastTimer.current = setTimeout(() => setRealtimeToast(''), 4500);
    };

    const handleSlotFreed = ({ date, timeSlot }) => {
      setExpert((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          availableSlots: prev.availableSlots.map((slot) =>
            slot.date === date && slot.time === timeSlot ? { ...slot, isBooked: false } : slot
          ),
        };
      });
      clearTimeout(toastTimer.current);
      setRealtimeToast(`✨ Slot at ${timeSlot} on ${formatDate(date).monthDay} is now open again!`);
      toastTimer.current = setTimeout(() => setRealtimeToast(''), 4500);
    };

    socket.on('slot-booked', handleSlotBooked);
    socket.on('slot-freed', handleSlotFreed);

    return () => {
      socket.off('slot-booked', handleSlotBooked);
      socket.off('slot-freed', handleSlotFreed);
      socket.emit('leave-expert', id);
      clearTimeout(toastTimer.current);
    };
  }, [id, socketRef, selectedDate, selectedTime]);

  if (loading) {
    return (
      <div className="detail-container">
        <div className="skeleton-box" style={{ width: 140, height: 20, marginBottom: 24 }} />
        <div className="skeleton-box" style={{ width: '100%', height: 260, borderRadius: 16, marginBottom: 32 }} />
        <div className="skeleton-box" style={{ width: '100%', height: 350, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="detail-container">
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
          }}
        >
          <AlertCircle size={40} color="#dc2626" style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 10px' }}>
            Expert Profile Unavailable
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            {error || 'The requested expert profile could not be found.'}
          </p>
          <Link to="/" className="btn-primary">
            Return to Browse Mentors
          </Link>
        </div>
      </div>
    );
  }

  const catStyle = categoryColors[expert.category] || { bg: '#e8f0fe', text: '#1967d2' };
  const initials = expert.name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const slotsByDate = groupSlotsByDate(expert.availableSlots || []);
  const dates = Object.keys(slotsByDate).sort();
  const currentSlots = selectedDate ? (slotsByDate[selectedDate] || []).sort((a, b) => a.time.localeCompare(b.time)) : [];
  const openSlotsCount = (expert.availableSlots || []).filter((s) => !s.isBooked).length;

  // Split into Morning, Afternoon, Evening
  const morningSlots = currentSlots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour < 12;
  });
  const afternoonSlots = currentSlots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 12 && hour < 16;
  });
  const eveningSlots = currentSlots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 16;
  });

  const isSlotSelected = Boolean(selectedDate && selectedTime);

  return (
    <div className="detail-container animate-in">
      <Link to="/" className="breadcrumb-nav">
        <ArrowLeft size={16} />
        <span>Back to all mentors</span>
      </Link>

      {/* Real-time Toast */}
      {realtimeToast && (
        <div className="realtime-toast" role="status">
          <Radio size={16} color="#34d399" />
          <span>{realtimeToast}</span>
        </div>
      )}

      {/* Expert Profile Card */}
      <section className="detail-hero-card">
        <div className="avatar-wrapper" style={{ position: 'relative' }}>
          {expert.avatar ? (
            <img
              src={expert.avatar}
              alt={expert.name}
              className="detail-avatar-large"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'grid';
              }}
            />
          ) : null}
          <div
            className="expert-avatar-fallback"
            style={{
              width: 110,
              height: 110,
              fontSize: 34,
              display: expert.avatar ? 'none' : 'grid',
            }}
          >
            {initials}
          </div>
          <div
            className="verified-dot-badge"
            style={{ width: 28, height: 28, fontSize: 14 }}
            title="Verified Mentor"
          >
            ✓
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="detail-header-row">
            <div>
              <span
                className="card-category-tag"
                style={{ background: catStyle.bg, color: catStyle.text, fontSize: 11 }}
              >
                {expert.category}
              </span>
              <h1 className="detail-name">{expert.name}</h1>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
                {expert.experience}+ Years Industry Leadership
              </div>
            </div>

            <div className="detail-price-badge">
              <span className="detail-price-num">${expert.hourlyRate}</span>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>per 60-min session</div>
            </div>
          </div>

          <div className="detail-meta-pills">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <strong style={{ color: 'var(--text-main)' }}>{expert.rating?.toFixed(1) || '4.9'}</strong>
              <span>({expert.reviewCount || 100}+ client reviews)</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534' }}>
              <Video size={15} />
              <span>1-on-1 Virtual Consultation</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} color="var(--primary)" />
              <span>Instant Confirmation</span>
            </div>
          </div>

          <p className="detail-bio-full">{expert.bio}</p>

          <div className="skills-pill-group">
            {(expert.skills || []).map((skill) => (
              <span key={skill} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Live Availability Calendar */}
      <section className="slots-container-card">
        <div className="slots-header">
          <div>
            <div className="section-kicker">INTERACTIVE SCHEDULE</div>
            <h2 className="slots-title">Select an Appointment Time</h2>
          </div>

          <div className="realtime-indicator-pill">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#1d4ed8',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(29, 78, 216, 0.2)',
              }}
            />
            <span>Live WebSocket Availability ({openSlotsCount} slots open)</span>
          </div>
        </div>

        {dates.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No slots are scheduled for this mentor right now. Please check back later.
          </p>
        ) : (
          <>
            {/* Date Carousel */}
            <div className="date-carousel-track" role="tablist" aria-label="Dates">
              {dates.map((date) => {
                const f = formatDate(date);
                const openCount = (slotsByDate[date] || []).filter((s) => !s.isBooked).length;
                const isActive = selectedDate === date;

                return (
                  <button
                    key={date}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`date-tab-card${isActive ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                  >
                    <span className="date-day-label">{f.dayName}</span>
                    <span className="date-number-label">{f.monthDay}</span>
                    <span className="date-slots-open">{openCount} open</span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots Sections */}
            {currentSlots.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No time slots found for this date.</p>
            ) : (
              <div>
                {morningSlots.length > 0 && (
                  <div className="time-group-block">
                    <div className="time-group-title">
                      <Sunrise size={15} color="var(--accent)" />
                      <span>Morning Slots</span>
                    </div>
                    <div className="time-slots-grid">
                      {morningSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.isBooked}
                            className={`time-slot-btn${slot.isBooked ? ' booked' : ''}${
                              isSelected ? ' selected' : ''
                            }`}
                            onClick={() => setSelectedTime(slot.time)}
                          >
                            <span>{slot.time}</span>
                            {slot.isBooked ? (
                              <span className="slot-booked-tag">Booked</span>
                            ) : isSelected ? (
                              <span style={{ fontSize: '9px', fontWeight: 600 }}>Selected</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {afternoonSlots.length > 0 && (
                  <div className="time-group-block">
                    <div className="time-group-title">
                      <Sun size={15} color="#eab308" />
                      <span>Afternoon Slots</span>
                    </div>
                    <div className="time-slots-grid">
                      {afternoonSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.isBooked}
                            className={`time-slot-btn${slot.isBooked ? ' booked' : ''}${
                              isSelected ? ' selected' : ''
                            }`}
                            onClick={() => setSelectedTime(slot.time)}
                          >
                            <span>{slot.time}</span>
                            {slot.isBooked ? (
                              <span className="slot-booked-tag">Booked</span>
                            ) : isSelected ? (
                              <span style={{ fontSize: '9px', fontWeight: 600 }}>Selected</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {eveningSlots.length > 0 && (
                  <div className="time-group-block">
                    <div className="time-group-title">
                      <Sunset size={15} color="#8b5cf6" />
                      <span>Evening Slots</span>
                    </div>
                    <div className="time-slots-grid">
                      {eveningSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.isBooked}
                            className={`time-slot-btn${slot.isBooked ? ' booked' : ''}${
                              isSelected ? ' selected' : ''
                            }`}
                            onClick={() => setSelectedTime(slot.time)}
                          >
                            <span>{slot.time}</span>
                            {slot.isBooked ? (
                              <span className="slot-booked-tag">Booked</span>
                            ) : isSelected ? (
                              <span style={{ fontSize: '9px', fontWeight: 600 }}>Selected</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Sticky Action Footer */}
        <div className="detail-cta-bar">
          <div className="cta-selection-summary">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'var(--primary-light)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--primary)',
              }}
            >
              <CalendarIcon size={22} />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                {isSlotSelected
                  ? `${formatDate(selectedDate).full} at ${selectedTime}`
                  : 'Please pick an open date and time slot above'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                {isSlotSelected
                  ? `60-Minute Strategy Session · Total: $${expert.hourlyRate}`
                  : `${openSlotsCount} slots available over next 14 days`}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={!isSlotSelected}
            onClick={() =>
              navigate(`/book/${expert._id}`, {
                state: { expert, date: selectedDate, timeSlot: selectedTime },
              })
            }
          >
            <span>Proceed to Reservation</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
