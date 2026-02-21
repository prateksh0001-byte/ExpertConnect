import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const CATEGORIES = ['All', 'Technology', 'Finance', 'Health', 'Legal', 'Marketing', 'Design', 'Business', 'Education'];

const categoryColors = {
  Technology: '#2563eb', Finance: '#7c3aed', Health: '#059669',
  Legal: '#d97706', Marketing: '#db2777', Design: '#0891b2',
  Business: '#dc2626', Education: '#65a30d',
};

function ExpertCard({ expert, index }) {
  const initials = expert.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const hue = expert.name.charCodeAt(0) * 7 % 360;

  return (
    <Link to={`/experts/${expert._id}`} style={{ textDecoration: 'none' }}>
      <div className="animate-in" style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        animationDelay: `${index * 0.05}s`,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.borderColor = 'var(--gold)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: `hsl(${hue}, 50%, 88%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Serif Display, serif',
            fontSize: '1.1rem', color: `hsl(${hue}, 50%, 30%)`,
            fontWeight: 700, border: `2px solid hsl(${hue}, 50%, 80%)`,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontFamily: 'DM Serif Display, serif', marginBottom: 2 }}>{expert.name}</h3>
            <span style={{
              display: 'inline-block',
              background: `${categoryColors[expert.category] || '#666'}18`,
              color: categoryColors[expert.category] || '#666',
              padding: '2px 10px', borderRadius: 20,
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em',
            }}>{expert.category}</span>
          </div>
        </div>

        <p style={{
          fontSize: '0.82rem', color: 'var(--ink-muted)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{expert.bio}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--cream-dark)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              <strong style={{ color: 'var(--ink)' }}>{expert.experience}y</strong> exp
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              ⭐ <strong style={{ color: 'var(--ink)' }}>{expert.rating}</strong>
              <span style={{ fontSize: '0.7rem' }}> ({expert.reviewCount})</span>
            </span>
          </div>
          <span style={{
            fontFamily: 'DM Serif Display, serif',
            color: 'var(--forest-mid)', fontSize: '1rem',
          }}>${expert.hourlyRate}<span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontFamily: 'DM Sans, sans-serif' }}>/hr</span></span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '35%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 14, width: '80%' }} />
    </div>
  );
}

export default function ExpertList() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [searchInput, setSearchInput] = useState('');

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 8 };
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const { data } = await api.get('/experts', { params });
      setExperts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '0.5rem', color: 'var(--ink)' }}>
          Book a Session with<br />
          <span style={{ color: 'var(--gold)' }}>Top-Tier Experts</span>
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '1rem' }}>
          {pagination.total || '...'} verified experts across multiple domains
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', maxWidth: 520 }}>
        <input
          type="text"
          placeholder="Search by name or skill..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{
            flex: 1, padding: '0.7rem 1rem', border: '2px solid var(--border)',
            borderRadius: 10, fontSize: '0.9rem', background: '#fff',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button type="submit" style={{
          padding: '0.7rem 1.25rem', background: 'var(--forest)', color: '#fff',
          borderRadius: 10, fontWeight: 600, fontSize: '0.875rem',
          transition: 'background 0.2s',
        }}>Search</button>
        {(search || searchInput) && (
          <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
            style={{ padding: '0.7rem 1rem', background: 'var(--cream-dark)', color: 'var(--ink-muted)', borderRadius: 10, fontSize: '0.875rem' }}>
            Clear
          </button>
        )}
      </form>

      {/* Categories */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => handleCategory(cat)} style={{
            padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500,
            border: `2px solid ${category === cat ? 'var(--forest)' : 'var(--border)'}`,
            background: category === cat ? 'var(--forest)' : '#fff',
            color: category === cat ? '#fff' : 'var(--ink-light)',
            transition: 'all 0.2s', cursor: 'pointer',
          }}>{cat}</button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--error-pale)', border: '1px solid var(--error)', color: 'var(--error)', padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          ⚠️ {error}
          <button onClick={fetchExperts} style={{ marginLeft: 'auto', background: 'var(--error)', color: '#fff', padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem' }}>Retry</button>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {loading
          ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : experts.length === 0
          ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3>No experts found</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Try adjusting your search or filters</p>
            </div>
          )
          : experts.map((expert, i) => <ExpertCard key={expert._id} expert={expert} index={i} />)
        }
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)',
              background: page === 1 ? 'var(--cream-dark)' : '#fff', color: page === 1 ? 'var(--ink-muted)' : 'var(--ink)',
              cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
            }}>← Prev</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
              background: p === page ? 'var(--forest)' : '#fff',
              color: p === page ? '#fff' : 'var(--ink)', fontWeight: p === page ? 600 : 400,
              cursor: 'pointer', fontSize: '0.875rem',
            }}>{p}</button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)',
              background: page === pagination.pages ? 'var(--cream-dark)' : '#fff',
              color: page === pagination.pages ? 'var(--ink-muted)' : 'var(--ink)',
              cursor: page === pagination.pages ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
            }}>Next →</button>
        </div>
      )}
    </div>
  );
}
