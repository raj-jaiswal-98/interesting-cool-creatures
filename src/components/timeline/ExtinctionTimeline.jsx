import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';
import { TimelineNodeCard } from './TimelineNodeCard';

const ERAS = [
  { id: 'all', label: 'All Eras' },
  { id: 'Mesozoic', label: 'Mesozoic' },
  { id: 'Cenozoic', label: 'Cenozoic' },
  { id: 'Pleistocene', label: 'Pleistocene' },
  { id: 'Holocene', label: 'Holocene' },
  { id: 'Modern', label: 'Modern Extant' }
];

export function ExtinctionTimeline({ creatures, onSelectCreature }) {
  const [selectedEra, setSelectedEra] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('chronology-asc');

  const filteredCreatures = useMemo(() => {
    return creatures
      .filter((c) => {
        const matchesEra = selectedEra === 'all' || c.era.toLowerCase() === selectedEra.toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          c.commonName.toLowerCase().includes(q) ||
          c.scientificName.toLowerCase().includes(q) ||
          c.habitat.toLowerCase().includes(q) ||
          (c.diet && c.diet.toLowerCase().includes(q));

        return matchesEra && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'chronology-asc') {
          const yearA = a.extinctionYear === null ? 2026 : a.extinctionYear;
          const yearB = b.extinctionYear === null ? 2026 : b.extinctionYear;
          return yearA - yearB;
        }
        if (sortBy === 'chronology-desc') {
          const yearA = a.extinctionYear === null ? 2026 : a.extinctionYear;
          const yearB = b.extinctionYear === null ? 2026 : b.extinctionYear;
          return yearB - yearA;
        }
        if (sortBy === 'danger') {
          return (b.stats?.dangerLevel || 0) - (a.stats?.dangerLevel || 0);
        }
        if (sortBy === 'name') {
          return a.commonName.localeCompare(b.commonName);
        }
        return 0;
      });
  }, [creatures, selectedEra, searchQuery, sortBy]);

  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '40px 0 80px' }} id="timeline-catalog">
      <div className="container">
        {/* Header Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Evolutionary Timeline & Catalog
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '650px' }}>
            Filter through Earth's geological epochs—from 250-million-year-old apex reptiles to bizarre modern abyssal organisms.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          marginBottom: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Era Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ERAS.map((era) => {
              const isActive = selectedEra.toLowerCase() === era.id.toLowerCase();
              return (
                <button
                  key={era.id}
                  onClick={() => setSelectedEra(era.id)}
                  style={{
                    background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#050B10' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    outline: 'none'
                  }}
                  id={`filter-era-${era.id.toLowerCase()}`}
                >
                  {era.label}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(5, 11, 16, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              minWidth: '220px'
            }}>
              <Search size={15} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search species or habitat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  width: '100%',
                  fontFamily: 'var(--font-display)'
                }}
                id="input-species-search"
              />
            </div>

            {/* Sort Select */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(5, 11, 16, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px'
            }}>
              <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
                id="select-sort-order"
              >
                <option value="chronology-asc" style={{ background: '#0B1622', color: '#FFF' }}>Chronology (Oldest First)</option>
                <option value="chronology-desc" style={{ background: '#0B1622', color: '#FFF' }}>Chronology (Newest First)</option>
                <option value="danger" style={{ background: '#0B1622', color: '#FFF' }}>Threat Level (High to Low)</option>
                <option value="name" style={{ background: '#0B1622', color: '#FFF' }}>Name (A to Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <span>Showing <strong>{filteredCreatures.length}</strong> extraordinary organisms</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '2px 8px' }}
            >
              Clear search
            </button>
          )}
        </div>

        {/* Grid of Creatures */}
        {filteredCreatures.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {filteredCreatures.map((creature) => (
              <TimelineNodeCard
                key={creature.id}
                creature={creature}
                onSelect={onSelectCreature}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Filter size={40} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No organisms match your filter criteria</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.9rem' }}>
              Try searching for a different keyword or reset your era selection.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedEra('all');
                setSearchQuery('');
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
