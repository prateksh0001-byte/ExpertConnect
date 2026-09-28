import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Star,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Layers,
  ShieldCheck,
  X,
} from 'lucide-react';
import api from '../utils/api';

const CATEGORIES = [
  'All',
  'Technology',
  'Finance',
  'Health',
  'Legal',
  'Marketing',
  'Design',
  'Business',
  'Education',
];

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

function ExpertCard({ expert, onSkillClick }) {
  const catStyle = categoryColors[expert.category] || { bg: '#edf2ec', text: '#174235' };
  const initials = expert.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <article className="expert-card animate-in">
      <div className="card-top">
        <div className="avatar-wrapper">
          {expert.avatar ? (
            <img
              src={expert.avatar}
              alt={expert.name}
              className="expert-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'grid';
              }}
            />
          ) : null}
          <div
            className="expert-avatar-fallback"
            style={{ display: expert.avatar ? 'none' : 'grid' }}
          >
            {initials}
          </div>
          <div className="verified-dot-badge" title="Verified Expert">
            ✓
          </div>
        </div>

        <div className="card-identity">
          <span
            className="card-category-tag"
            style={{ background: catStyle.bg, color: catStyle.text }}
          >
            {expert.category}
          </span>
          <h3 className="expert-card-name" title={expert.name}>
            {expert.name}
          </h3>
          <div className="card-experience-text">
            {expert.experience}+ years industry leadership
          </div>
        </div>
      </div>

      <p className="card-bio">{expert.bio}</p>

      <div className="skills-pill-group">
        {(expert.skills || []).slice(0, 4).map((skill) => (
          <button
            key={skill}
            type="button"
            className="skill-tag"
            onClick={(e) => {
              e.preventDefault();
              onSkillClick?.(skill);
            }}
            title={`Filter by ${skill}`}
          >
            {skill}
          </button>
        ))}
      </div>

      <div className="card-footer">
        <div className="rating-box">
          <Star size={15} className="star-icon" fill="#f59e0b" />
          <strong>{expert.rating?.toFixed(1) || '4.9'}</strong>
          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
            ({expert.reviewCount || 100}+)
          </span>
        </div>

        <div className="rate-box">
          <span className="rate-amount">${expert.hourlyRate}</span>
          <span className="rate-period"> / session</span>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Link
          to={`/experts/${expert._id}`}
          className="btn-primary"
          style={{ width: '100%', textDecoration: 'none' }}
        >
          <span>View Availability & Book</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="expert-card" style={{ gap: '14px' }}>
      <div style={{ display: 'flex', gap: '14px' }}>
        <div className="skeleton-box" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-box" style={{ width: '40%', height: 16 }} />
          <div className="skeleton-box" style={{ width: '70%', height: 22 }} />
        </div>
      </div>
      <div className="skeleton-box" style={{ width: '100%', height: 38 }} />
      <div style={{ display: 'flex', gap: '6px' }}>
        <div className="skeleton-box" style={{ width: 60, height: 22 }} />
        <div className="skeleton-box" style={{ width: 70, height: 22 }} />
        <div className="skeleton-box" style={{ width: 65, height: 22 }} />
      </div>
      <div className="skeleton-box" style={{ width: '100%', height: 42, marginTop: 'auto' }} />
    </div>
  );
}

export default function ExpertList() {
  const location = useLocation();
  const [experts, setExperts] = useState([]);
  const [stats, setStats] = useState({
    totalExperts: 10,
    totalBookings: 240,
    avgRating: '4.9',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const debounceTimer = useRef(null);
  // pageRef keeps fetchExperts from capturing a stale page value in its closure
  const pageRef = useRef(1);
  useEffect(() => { pageRef.current = page; }, [page]);

  // Debounce search input — only fire API after 350ms of inactivity
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  // Fetch stats once
  useEffect(() => {
    api
      .get('/experts/stats')
      .then(({ data }) => {
        if (data.data) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  // Scroll to the browse section when navigated here via "Book a Session"
  useEffect(() => {
    if (location.state?.scrollToExperts) {
      // Small delay to let the page paint before scrolling
      const t = setTimeout(() => {
        document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [location.state?.scrollToExperts]);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Read page from ref so the closure is never stale
      const params = { page: pageRef.current, limit: 9, sortBy };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category !== 'All') params.category = category;
      const { data } = await api.get('/experts', { params });
      setExperts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, sortBy]); // page removed — read via pageRef

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  // Also re-fetch when page changes (page not in fetchExperts deps to avoid stale closure)
  useEffect(() => {
    fetchExperts();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClear = () => {
    clearTimeout(debounceTimer.current); // cancel any pending debounce before resetting
    setSearch('');
    setDebouncedSearch('');
    setCategory('All');
    setSortBy('rating');
    setPage(1);
  };

  const handleSkillClick = (skill) => {
    setSearch(skill);
    setCategory('All');
    setPage(1);
    document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="discovery-page">
      {/* High-Impact Hero */}
      <section className="hero-wrapper">
        <div className="hero-backdrop-glow" />
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge-tag">
              <span className="live-dot" />
              <span>Real-Time Consultation Platform</span>
            </div>

            <h1 className="hero-title">
              Unlock 1-on-1 Guidance From <em>Industry Leaders.</em>
            </h1>

            <p className="hero-subtitle">
              Book high-impact strategic advisory and deep-dive technical sessions with
              principals, partners, and founders from leading enterprises. Synchronized in
              real-time with zero scheduling conflicts.
            </p>

            <div className="hero-actions">
              <a
                href="#experts"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Sparkles size={16} />
                <span>Explore Verified Mentors</span>
              </a>
              <Link to="/my-bookings" className="btn-secondary">
                <span>Manage My Sessions</span>
              </Link>
            </div>

            <div className="hero-stats-row">
              <div className="stat-item">
                <span className="stat-num">{stats.totalExperts || 10}+</span>
                <span className="stat-label">Vetted Experts</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{stats.avgRating || '4.9'}★</span>
                <span className="stat-label">Client Rating</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">100%</span>
                <span className="stat-label">Conflict-Free</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-wrapper">
            <div className="hero-visual-card">
              <div className="visual-tag-bubble bubble-top">
                <ShieldCheck size={14} color="#166534" />
                <span>Double-Booking Protected</span>
              </div>

              <div className="visual-mentor-badge">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300"
                  alt="Dr. Sarah Chen"
                  className="visual-mentor-img"
                />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                    FEATURED THIS WEEK
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '18px',
                      color: 'var(--text-main)',
                    }}
                  >
                    Dr. Sarah Chen
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Senior AI/ML Principal · Google
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Upcoming Slot:</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Today · 14:00</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#2e7d32',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#2e7d32',
                      display: 'inline-block',
                    }}
                  />
                  <span>Live availability synchronized via WebSocket</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px',
                  color: 'var(--text-dim)',
                }}
              >
                <span>4.95 Rating (284 reviews)</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '15px',
                  }}
                >
                  $250 / session
                </span>
              </div>

              <div className="visual-tag-bubble bubble-bottom">
                <Clock size={13} color="var(--accent)" />
                <span>Instant Calendar Invite (.ICS)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Browse Section */}
      <section className="browse-section" id="experts">
        <div className="section-header">
          <div>
            <div className="section-kicker">CURATED TALENT NETWORK</div>
            <h2 className="section-title">Explore Global Mentors</h2>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '380px' }}>
            Direct booking with verified industry professionals. Select a mentor to inspect
            live schedule slots.
          </div>
        </div>

        {/* Search, Filter & Sort Panel */}
        <div className="search-filter-panel">
          <form className="search-row" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon-svg" />
              <input
                type="search"
                className="search-input-field"
                placeholder="Search by mentor name, skill (e.g. Python, Figma), or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              aria-label="Sort experts"
            >
              <option value="rating">Top Rated (Default)</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="experience">Most Experienced</option>
              <option value="reviews">Most Reviewed</option>
            </select>
          </form>

          {/* Category Pills */}
          <div className="category-tags-row">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill-btn${category === cat ? ' active' : ''}`}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Result Meta Bar */}
        <div className="results-meta-bar">
          <div>
            Showing <strong>{experts.length}</strong> of{' '}
            <strong>{pagination.total || experts.length}</strong> experts
            {category !== 'All' && <span> in <strong>{category}</strong></span>}
            {search && <span> matching "<strong>{search}</strong>"</span>}
          </div>

          {(category !== 'All' || search || sortBy !== 'rating') && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Reset all filters ×
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{error}</span>
            <button
              onClick={fetchExperts}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="expert-grid">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
            : experts.length > 0
            ? experts.map((expert) => (
                <ExpertCard
                  key={expert._id}
                  expert={expert}
                  onSkillClick={handleSkillClick}
                />
              ))
            : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#ffffff',
                  border: '1px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '24px',
                    margin: '0 0 8px',
                  }}
                >
                  No mentors match your query
                </h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '13.5px',
                    maxWidth: '400px',
                    margin: '0 auto 18px',
                  }}
                >
                  Try broadening your search term or exploring another category from the
                  filters above.
                </p>
                <button type="button" className="btn-primary" onClick={handleClear}>
                  Clear Filters & Show All
                </button>
              </div>
            )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '40px',
            }}
          >
            <button
              className="btn-secondary"
              disabled={page === 1}
              onClick={() => {
                setPage((p) => p - 1);
                document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Page <strong>{page}</strong> of <strong>{pagination.pages}</strong>
            </span>
            <button
              className="btn-secondary"
              disabled={page === pagination.pages}
              onClick={() => {
                setPage((p) => p + 1);
                document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Next →
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
