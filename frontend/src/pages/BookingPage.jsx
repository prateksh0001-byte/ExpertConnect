import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  User,
  Mail,
  Phone,
  FileText,
  AlertTriangle,
  Download,
  Video,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import api from '../utils/api';
import { generateICS } from '../utils/calendar';

function groupSlotsByDate(slots = []) {
  const groups = {};
  slots.forEach((slot) => {
    if (!groups[slot.date]) groups[slot.date] = [];
    groups[slot.date].push(slot);
  });
  return groups;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BookingPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [expert, setExpert] = useState(location.state?.expert || null);
  const [loading, setLoading] = useState(!expert);
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [apiError, setApiError] = useState('');

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: localStorage.getItem('expertBooking_email') || '',
    clientPhone: '',
    date: location.state?.date || '',
    timeSlot: location.state?.timeSlot || '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!expert) {
      // Initial load — expert not in navigation state, fetch it
      api
        .get(`/experts/${id}`)
        .then(({ data }) => {
          setExpert(data.data);
          setLoading(false);
        })
        .catch((err) => {
          setApiError(err.message);
          setLoading(false);
        });
    } else {
      // Expert came from navigation state — re-fetch in background to get
      // fresh slot availability (slots may have been booked since ExpertDetail loaded)
      setLoading(false);
      api
        .get(`/experts/${id}`)
        .then(({ data }) => setExpert(data.data))
        .catch(() => {}); // silent — we already have the expert data to show the form
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const errs = {};
    if (!form.clientName.trim() || form.clientName.trim().length < 2) {
      errs.clientName = 'Full name is required (minimum 2 characters)';
    }
    if (!form.clientEmail.trim() || !/^\S+@\S+\.\S+$/.test(form.clientEmail)) {
      errs.clientEmail = 'Please provide a valid email address';
    }
    if (!form.clientPhone.trim() || !/^[+]?[\d\s\-().]{7,20}$/.test(form.clientPhone)) {
      errs.clientPhone = 'Valid contact number required (e.g. +1 555 123 4567)';
    }
    if (!form.date) {
      errs.date = 'Appointment date is required';
    }
    if (!form.timeSlot) {
      errs.timeSlot = 'Time slot is required';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'date' ? { timeSlot: '' } : {}),
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      const { data } = await api.post('/bookings', {
        expertId: id,
        ...form,
      });

      // Save email for quick lookup in MyBookings
      localStorage.setItem('expertBooking_email', form.clientEmail);
      setSuccessBooking(data.data);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-page-container">
        <div className="skeleton-box" style={{ width: 140, height: 20, marginBottom: 24 }} />
        <div className="skeleton-box" style={{ width: '100%', height: 420, borderRadius: 16 }} />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="booking-page-container">
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 12px' }}>
            Mentor Not Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            The requested expert profile is no longer available.
          </p>
          <Link to="/" className="btn-primary">
            Browse All Mentors
          </Link>
        </div>
      </div>
    );
  }

  // Success Confirmation Screen
  if (successBooking) {
    return (
      <div className="booking-page-container animate-in" style={{ maxWidth: '820px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xl)',
            padding: '48px 36px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#166534',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={40} />
          </div>

          <div className="section-kicker">CONFIRMATION # {successBooking._id.slice(-6).toUpperCase()}</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '36px',
              color: 'var(--text-main)',
              margin: '6px 0 12px',
            }}
          >
            Your Session is Confirmed!
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '15px',
              maxWidth: '540px',
              margin: '0 auto 32px',
            }}
          >
            We have locked your reservation with <strong>{expert.name}</strong>. A confirmation
            email and calendar invite have been queued for <strong>{successBooking.clientEmail}</strong>.
          </p>

          {/* Booking Voucher */}
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'left',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <span className="session-info-item label">Expert</span>
                <span className="session-info-item value">{expert.name}</span>
              </div>
              <div>
                <span className="session-info-item label">Date</span>
                <span className="session-info-item value">{formatDate(successBooking.date)}</span>
              </div>
              <div>
                <span className="session-info-item label">Time</span>
                <span className="session-info-item value">{successBooking.timeSlot} (60 min)</span>
              </div>
              <div>
                <span className="session-info-item label">Attendee</span>
                <span className="session-info-item value">{successBooking.clientName}</span>
              </div>
            </div>

            {successBooking.notes && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <span className="session-info-item label">Session Agenda</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {successBooking.notes}
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                generateICS({
                  title: `Consultation with ${expert.name}`,
                  description: successBooking.notes,
                  expertName: expert.name,
                  date: successBooking.date,
                  timeSlot: successBooking.timeSlot,
                })
              }
            >
              <Download size={15} />
              <span>Download Calendar (.ICS)</span>
            </button>

            <Link
              to={`/room/${successBooking._id}`}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Video size={16} color="var(--primary)" />
              <span>Join Consultation Room</span>
            </Link>

            <Link
              to="/my-bookings"
              className="btn-secondary"
            >
              <span>View in My Sessions</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const slotsByDate = groupSlotsByDate(expert.availableSlots || []);
  const dates = Object.keys(slotsByDate).sort();
  const availableSlotsForDate = form.date
    ? (slotsByDate[form.date] || []).filter((s) => !s.isBooked)
    : [];

  return (
    <div className="booking-page-container animate-in">
      <Link to={`/experts/${id}`} className="breadcrumb-nav">
        <ArrowLeft size={16} />
        <span>Back to {expert.name}'s Profile</span>
      </Link>

      <div className="booking-layout-grid">
        {/* Left Form */}
        <section className="booking-form-card">
          <div className="section-kicker">STEP 2 OF 2 · RESERVATION DETAILS</div>
          <h1 className="form-title">Complete Your Reservation</h1>
          <p className="form-subtitle">
            Provide your details to guarantee atomic slot reservation with {expert.name}.
          </p>

          {apiError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 18px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <AlertTriangle size={18} />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="clientName">
                  Your Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="clientName"
                    name="clientName"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Alex Morgan"
                    className={`form-input${errors.clientName ? ' has-error' : ''}`}
                    value={form.clientName}
                    onChange={handleChange}
                  />
                </div>
                {errors.clientName && (
                  <span className="field-error-msg">{errors.clientName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="clientEmail">
                  Email Address *
                </label>
                <input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@enterprise.com"
                  className={`form-input${errors.clientEmail ? ' has-error' : ''}`}
                  value={form.clientEmail}
                  onChange={handleChange}
                />
                {errors.clientEmail && (
                  <span className="field-error-msg">{errors.clientEmail}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="clientPhone">
                Phone Number (with country code) *
              </label>
              <input
                id="clientPhone"
                name="clientPhone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 (555) 234-5678"
                className={`form-input${errors.clientPhone ? ' has-error' : ''}`}
                value={form.clientPhone}
                onChange={handleChange}
              />
              {errors.clientPhone && (
                <span className="field-error-msg">{errors.clientPhone}</span>
              )}
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="date">
                  Selected Date *
                </label>
                <select
                  id="date"
                  name="date"
                  className={`form-select${errors.date ? ' has-error' : ''}`}
                  value={form.date}
                  onChange={handleChange}
                >
                  <option value="">Select appointment date...</option>
                  {dates.map((d) => {
                    const avail = (slotsByDate[d] || []).filter((s) => !s.isBooked).length;
                    return (
                      <option key={d} value={d} disabled={avail === 0}>
                        {formatDate(d)} ({avail} slots open)
                      </option>
                    );
                  })}
                </select>
                {errors.date && <span className="field-error-msg">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="timeSlot">
                  Selected Time Slot *
                </label>
                <select
                  id="timeSlot"
                  name="timeSlot"
                  className={`form-select${errors.timeSlot ? ' has-error' : ''}`}
                  value={form.timeSlot}
                  onChange={handleChange}
                  disabled={!form.date || availableSlotsForDate.length === 0}
                >
                  <option value="">
                    {!form.date
                      ? 'First choose a date'
                      : availableSlotsForDate.length === 0
                      ? 'No available slots on this date'
                      : 'Choose time slot...'}
                  </option>
                  {availableSlotsForDate
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((slot) => (
                      <option key={slot.time} value={slot.time}>
                        {slot.time}
                      </option>
                    ))}
                </select>
                {errors.timeSlot && (
                  <span className="field-error-msg">{errors.timeSlot}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                Session Focus / Key Questions (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="form-textarea"
                placeholder="Share any background, questions, or specific topics you would like to prioritize..."
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '12px', padding: '15px' }}
              disabled={submitting}
            >
              {submitting ? (
                <span>Locking in your reservation...</span>
              ) : (
                <>
                  <span>Confirm Reservation · ${expert.hourlyRate}.00</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Summary Card */}
        <aside className="booking-summary-card">
          <div className="section-kicker">SUMMARY RECEIPT</div>

          <div className="summary-mentor-header">
            {expert.avatar ? (
              <img
                src={expert.avatar}
                alt={expert.name}
                style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="expert-avatar-fallback"
                style={{ width: 54, height: 54, fontSize: 18 }}
              >
                {expert.name.slice(0, 2)}
              </div>
            )}

            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700 }}>
                {expert.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {expert.category} Specialist
              </div>
            </div>
          </div>

          <div className="summary-receipt-line">
            <span>Date</span>
            <strong>{form.date ? formatDate(form.date) : 'Pending selection'}</strong>
          </div>

          <div className="summary-receipt-line">
            <span>Time</span>
            <strong>{form.timeSlot ? `${form.timeSlot} (60 min)` : 'Pending selection'}</strong>
          </div>

          <div className="summary-receipt-line">
            <span>60-Min Consultation</span>
            <span>${expert.hourlyRate}.00</span>
          </div>

          <div className="summary-receipt-line">
            <span>Platform Fee</span>
            <span style={{ color: '#166534', fontWeight: 600 }}>$0.00 (Waived)</span>
          </div>

          <div className="summary-receipt-line total-line">
            <span>Total Due</span>
            <span className="summary-total-price">${expert.hourlyRate}.00</span>
          </div>

          <div className="trust-guarantee-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--primary)" />
              <span>Atomic slot lock prevents conflicts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={16} color="var(--accent)" />
              <span>Instant calendar file download included</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={16} color="#0284c7" />
              <span>HD Video Room link provided instantly</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
