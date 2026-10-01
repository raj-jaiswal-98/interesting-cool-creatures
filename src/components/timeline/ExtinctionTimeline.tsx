import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, Sparkles, Globe, Loader2, Compass } from 'lucide-react';
import { TimelineNodeCard } from './TimelineNodeCard';
import { creatureResolver } from '../../services/resolver/creatureResolver';
import type { Creature } from '../../types/creature';

type SortOption = 'chronology-asc' | 'chronology-desc' | 'danger' | 'name';

interface ExtinctionTimelineProps {
  creatures: Creature[];
  onSelectCreature: (creature: Creature) => void;
  onAddCreatures?: (newCreatures: Creature[]) => void;
}

const ERAS = [
  { id: 'all', label: 'All Eras' },
  { id: 'Mesozoic', label: 'Mesozoic' },
  { id: 'Cenozoic', label: 'Cenozoic' },
  { id: 'Pleistocene', label: 'Pleistocene' },
  { id: 'Holocene', label: 'Holocene' },
  { id: 'Modern', label: 'Modern Extant' }
];

export function ExtinctionTimeline({ creatures, onSelectCreature, onAddCreatures }: ExtinctionTimelineProps) {
  const [selectedEra, setSelectedEra] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('chronology-asc');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveSearchFeedback, setLiveSearchFeedback] = useState<string | null>(null);

  const handleDiscoverLive = async () => {
    setIsDiscovering(true);
    setLiveSearchFeedback(null);
    try {
      const dynamicSpecies = await creatureResolver.fetchTrendingLiveCreatures(6);
      if (dynamicSpecies.length > 0 && onAddCreatures) {
        onAddCreatures(dynamicSpecies);
        setLiveSearchFeedback(`Discovered & ingested ${dynamicSpecies.length} real-world species live from iNaturalist!`);
      }
    } catch (err) {
      console.warn('Live discovery failed:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleLiveSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearchingLive(true);
    setLiveSearchFeedback(null);
    try {
      const found = await creatureResolver.searchLiveCreatures(q, 4);
      if (found.length > 0 && onAddCreatures) {
        onAddCreatures(found);
        setLiveSearchFeedback(`Ingested ${found.length} live records matching "${q}" from GBIF / iNaturalist / PBDB!`);
      } else {
        setLiveSearchFeedback(`No additional live species found matching "${q}".`);
      }
    } catch (err) {
      console.warn('Live search error:', err);
    } finally {
      setIsSearchingLive(false);
    }
  };

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
            {/* Live Search Form */}
            <form
              onSubmit={handleLiveSearch}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(5, 11, 16, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 6px 4px 14px',
                minWidth: '240px'
              }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search local or live species..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
              {searchQuery && (
                <button
                  type="submit"
                  disabled={isSearchingLive}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    marginLeft: '6px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Search GBIF, iNaturalist, and PBDB"
                >
                  {isSearchingLive ? (
                    <Loader2 size={12} className="animate-spin-slow" />
                  ) : (
                    <Globe size={12} />
                  )}
                  <span>Live</span>
                </button>
              )}
            </form>

            {/* Discover Live Species Button */}
            <button
              onClick={handleDiscoverLive}
              disabled={isDiscovering}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)'
              }}
              id="btn-discover-live"
            >
              {isDiscovering ? (
                <Loader2 size={15} className="animate-spin-slow" style={{ color: 'var(--accent-primary)' }} />
              ) : (
                <Compass size={15} style={{ color: 'var(--accent-primary)' }} />
              )}
              <span>{isDiscovering ? 'Ingesting Live Species...' : 'Discover Live Species'}</span>
            </button>

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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortOption)}
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

        {/* Live Search Notification Banner */}
        {liveSearchFeedback && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>{liveSearchFeedback}</span>
            </div>
            <button
              onClick={() => setLiveSearchFeedback(null)}
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '2px 6px' }}
            >
              Dismiss
            </button>
          </div>
        )}

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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {searchQuery ? `No local species found for "${searchQuery}"` : 'No organisms match your filter criteria'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '0.9rem' }}>
              {searchQuery
                ? `You can query global scientific databases (iNaturalist, GBIF, Paleobiology Database) to ingest "${searchQuery}" into your explorer dynamically.`
                : 'Try searching for a different keyword or reset your era selection.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {searchQuery && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleLiveSearch()}
                  disabled={isSearchingLive}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSearchingLive ? <Loader2 size={16} className="animate-spin-slow" /> : <Globe size={16} />}
                  <span>Search Worldwide Live Biodiversity</span>
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedEra('all');
                  setSearchQuery('');
                  setLiveSearchFeedback(null);
                }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
