import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      background: 'var(--forest)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.25)',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--gold)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: 'var(--forest)',
          fontFamily: 'DM Serif Display, serif',
        }}>E</div>
        <span style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: '1.25rem',
          color: '#fff',
          letterSpacing: '-0.02em',
        }}>ExpertConnect</span>
      </Link>

      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { to: '/', label: 'Experts' },
          { to: '/my-bookings', label: 'My Bookings' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} style={{
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: pathname === to ? 'var(--gold)' : 'rgba(255,255,255,0.75)',
            background: pathname === to ? 'rgba(201,149,42,0.15)' : 'transparent',
            transition: 'all 0.2s',
          }}>{label}</Link>
        ))}
      </div>
    </nav>
  );
}
