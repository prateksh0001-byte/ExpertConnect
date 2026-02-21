import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

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
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const InputField = ({ label, error, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-light)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
    {props.as === 'textarea' ? (
      <textarea {...props} style={{
        padding: '0.7rem 0.9rem', border: `2px solid ${error ? 'var(--error)' : 'var(--border)'}`,
        borderRadius: 10, fontSize: '0.9rem', background: '#fff', resize: 'vertical', minHeight: 80,
        transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
        ...(props.style || {}),
      }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--border)'}
      />
    ) : (
      <input {...props} style={{
        padding: '0.7rem 0.9rem', border: `2px solid ${error ? 'var(--error)' : 'var(--border)'}`,
        borderRadius: 10, fontSize: '0.9rem', background: '#fff', width: '100%',
        transition: 'border-color 0.2s', ...(props.style || {}),
      }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--border)'}
      />
    )}
    {error && <span style={{ color: 'var(--error)', fontSize: '0.78rem' }}>{error}</span>}
  </div>
);

export default function BookingPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(location.state?.expert || null);
  const [loading, setLoading] = useState(!expert);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [apiError, setApiError] = useState('');

  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', date: '', timeSlot: '', notes: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!expert) {
      api.get(`/experts/${id}`).then(({ data }) => {
        setExpert(data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, expert]);

  const validate = () => {
    const errs = {};
    if (!form.clientName.trim() || form.clientName.trim().length < 2) errs.clientName = 'Full name is required (min 2 chars)';
    if (!form.clientEmail.trim() || !/^\S+@\S+\.\S+$/.test(form.clientEmail)) errs.clientEmail = 'Valid email address is required';
    if (!form.clientPhone.trim() || !/^[+]?[\d\s\-().]{7,20}$/.test(form.clientPhone)) errs.clientPhone = 'Valid phone number is required';
    if (!form.date) errs.date = 'Please select a date';
    if (!form.timeSlot) errs.timeSlot = 'Please select a time slot';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value, ...(name === 'date' ? { timeSlot: '' } : {}) }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError('');
    try {
      const { data } = await api.post('/bookings', { expertId: id, ...form });
      setSuccess(data.data);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 700, margin: '3rem auto', padding: '0 1.5rem' }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
    </div>
  );

  if (!expert) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <p>Expert not found.</p>
      <Link to="/" style={{ color: 'var(--forest)' }}>← Back</Link>
    </div>
  );

  // Success screen
  if (success) return (
    <div style={{ maxWidth: 560, margin: '3rem auto', padding: '0 1.5rem' }} className="animate-in">
      <div style={{ background: '#fff', border: '2px solid var(--success)', borderRadius: 20, padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'var(--success-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>✓</div>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.75rem', color: 'var(--success)', marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--ink-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Your session has been booked successfully</p>

        <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
          {[
            ['Expert', expert.name],
            ['Date', formatDate(success.date)],
            ['Time', success.timeSlot],
            ['Status', success.status],
            ['Email', success.clientEmail],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--ink-muted)' }}>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/my-bookings')} style={{ padding: '0.75rem 1.5rem', background: 'var(--forest)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem' }}>
            View My Bookings
          </button>
          <button onClick={() => navigate('/')} style={{ padding: '0.75rem 1.5rem', background: 'var(--cream-dark)', color: 'var(--ink)', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem' }}>
            Browse Experts
          </button>
        </div>
      </div>
    </div>
  );

  const slotsByDate = groupSlotsByDate(expert.availableSlots || []);
  const dates = Object.keys(slotsByDate).sort();
  const availableSlotsForDate = form.date
    ? (slotsByDate[form.date] || []).filter(s => !s.isBooked)
    : [];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }} className="animate-in">
      <Link to={`/experts/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        ← Back to {expert.name}
      </Link>

      {/* Expert summary */}
      <div style={{ background: 'var(--gold-pale)', border: '1px solid #e8c97020', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Serif Display, serif', color: 'var(--forest)', fontWeight: 700, fontSize: '1.1rem' }}>
          {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>Booking session with <span style={{ color: 'var(--forest-mid)' }}>{expert.name}</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{expert.category} • ${expert.hourlyRate}/hr</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', marginBottom: '1.75rem' }}>Session Details</h2>

        {apiError && (
          <div style={{ background: 'var(--error-pale)', border: '1px solid var(--error)', color: 'var(--error)', padding: '0.875rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <InputField label="Full Name *" name="clientName" type="text" placeholder="Jane Smith" value={form.clientName} onChange={handleChange} error={errors.clientName} />
            <InputField label="Email Address *" name="clientEmail" type="email" placeholder="jane@example.com" value={form.clientEmail} onChange={handleChange} error={errors.clientEmail} />
          </div>

          <InputField label="Phone Number *" name="clientPhone" type="tel" placeholder="+1 (555) 000-0000" value={form.clientPhone} onChange={handleChange} error={errors.clientPhone} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Date select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-light)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Select Date *</label>
              <select name="date" value={form.date} onChange={handleChange} style={{
                padding: '0.7rem 0.9rem', border: `2px solid ${errors.date ? 'var(--error)' : 'var(--border)'}`,
                borderRadius: 10, fontSize: '0.9rem', background: '#fff', cursor: 'pointer',
              }}>
                <option value="">Choose a date...</option>
                {dates.map(d => {
                  const avail = (slotsByDate[d] || []).filter(s => !s.isBooked).length;
                  return <option key={d} value={d} disabled={avail === 0}>{formatDate(d)} ({avail} slots)</option>;
                })}
              </select>
              {errors.date && <span style={{ color: 'var(--error)', fontSize: '0.78rem' }}>{errors.date}</span>}
            </div>

            {/* Time slot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-light)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Select Time *</label>
              <select name="timeSlot" value={form.timeSlot} onChange={handleChange} disabled={!form.date || availableSlotsForDate.length === 0} style={{
                padding: '0.7rem 0.9rem', border: `2px solid ${errors.timeSlot ? 'var(--error)' : 'var(--border)'}`,
                borderRadius: 10, fontSize: '0.9rem', background: '#fff', cursor: 'pointer',
                opacity: !form.date ? 0.5 : 1,
              }}>
                <option value="">{!form.date ? 'Select date first' : 'Choose a time...'}</option>
                {availableSlotsForDate.sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
                  <option key={slot.time} value={slot.time}>{slot.time}</option>
                ))}
              </select>
              {errors.timeSlot && <span style={{ color: 'var(--error)', fontSize: '0.78rem' }}>{errors.timeSlot}</span>}
              {form.date && availableSlotsForDate.length === 0 && (
                <span style={{ color: 'var(--error)', fontSize: '0.78rem' }}>No available slots for this date</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-light)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Session Notes (Optional)</label>
            <textarea
              name="notes"
              placeholder="What would you like to discuss? Any specific goals or questions..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
              style={{
                padding: '0.7rem 0.9rem', border: '2px solid var(--border)',
                borderRadius: 10, fontSize: '0.9rem', background: '#fff', resize: 'vertical',
                fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <button type="submit" disabled={submitting} style={{
            width: '100%', padding: '1rem', background: submitting ? 'var(--cream-dark)' : 'var(--forest)',
            color: submitting ? 'var(--ink-muted)' : '#fff', borderRadius: 12,
            fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s',
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            {submitting ? (
              <>
                <span style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--ink-muted)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Processing...
              </>
            ) : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
