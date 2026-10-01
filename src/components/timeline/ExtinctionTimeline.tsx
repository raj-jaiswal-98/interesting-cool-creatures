import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, Sparkles, Globe, Loader2, Compass, Cpu, Zap } from 'lucide-react';
import { TimelineNodeCard } from './TimelineNodeCard';
import { AddMoreCard } from './AddMoreCard';
import { creatureResolver } from '../../services/resolver/creatureResolver';
import { useCreatureSearch } from '../../hooks/useCreatureSearch';
import { useSemanticRerank, useEmbeddingStatus } from '../../hooks/useSemanticRerank';
import type { Creature } from '../../types/creature';

type SortOption = 'chronology-asc' | 'chronology-desc' | 'danger' | 'name';

interface ExtinctionTimelineProps {
  creatures: Creature[];
  onSelectCreature: (creature: Creature, initialTab?: 'overview' | 'map' | 'evolution' | 'clash') => void;
  onAddCreatures?: (newCreatures: Creature[]) => void;
  streamingProgress?: {
    current: number;
    target: number;
    isStreaming: boolean;
  };
  onStreamToTarget?: () => void;
  onStreamTo100?: () => void;
}

export const CREATURE_CATEGORIES = [
  { id: 'all', label: 'All Biomes', icon: '✨' },
  { id: 'marine', label: 'Ocean & Deep Sea', icon: '🌊' },
  { id: 'forest', label: 'Terrestrial & Forests', icon: '🐾' },
  { id: 'aerial', label: 'Birds & Aerial', icon: '🪽' },
  { id: 'volcanic', label: 'Extreme & Desert', icon: '🌋' },
  { id: 'tundra', label: 'Polar & Tundra', icon: '❄️' },
  { id: 'ancient', label: 'Ancient Fossils', icon: '🦴' }
];

const ERAS = [
  { id: 'all', label: 'All Eras' },
  { id: 'Mesozoic', label: 'Mesozoic' },
  { id: 'Cenozoic', label: 'Cenozoic' },
  { id: 'Pleistocene', label: 'Pleistocene' },
  { id: 'Holocene', label: 'Holocene' },
  { id: 'Modern', label: 'Modern Extant' }
];

export function ExtinctionTimeline({
  creatures,
  onSelectCreature,
  onAddCreatures,
  streamingProgress,
  onStreamToTarget,
  onStreamTo100
}: ExtinctionTimelineProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('chronology-asc');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveSearchFeedback, setLiveSearchFeedback] = useState<string | null>(null);
  const [isGlobalSimplified, setIsGlobalSimplified] = useState(false);

  // Hook integrating lexical + on-device semantic intent search
  const { results: lexicalCreatures, intent: searchIntent, isSearching: isSemanticSearching } = useCreatureSearch(
    creatures,
    searchQuery,
    { activeEra: selectedEra }
  );

  // Client-side neural vector re-ranking with Transformers.js MiniLM
  const searchedCreatures = useSemanticRerank(
    creatures,
    lexicalCreatures,
    searchQuery,
    selectedEra
  );

  const embeddingStatus = useEmbeddingStatus();

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

  const handleFetchCategoryBatch = async (categoryToFetch: string, count: number) => {
    setIsDiscovering(true);
    setLiveSearchFeedback(null);
    try {
      const fetched = await creatureResolver.fetchUniqueCreaturesForCategory(categoryToFetch, count, creatures);
      if (fetched.length > 0 && onAddCreatures) {
        onAddCreatures(fetched);
        const catObj = CREATURE_CATEGORIES.find((c) => c.id === categoryToFetch);
        const catLabel = catObj ? `${catObj.icon} ${catObj.label}` : categoryToFetch;
        setLiveSearchFeedback(`✨ Ingested ${fetched.length} new unique specimens live for ${catLabel}!`);
      } else {
        setLiveSearchFeedback(`All top candidates for ${categoryToFetch} are already in the museum.`);
      }
    } catch (err) {
      console.warn('Failed to fetch category batch:', err);
      setLiveSearchFeedback(`Could not fetch live specimens for ${categoryToFetch}. Please try again.`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const filteredCreatures = useMemo(() => {
    return [...searchedCreatures]
      .filter((c) => {
        // Category / Habitat Filter
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'ancient') {
            const isExtinct = c.extinctionYear !== null || c.era !== 'Modern';
            if (!isExtinct) return false;
          } else if (c.habitatType !== selectedCategory) {
            return false;
          }
        }
        // Geological Era Filter
        if (selectedEra !== 'all' && c.era.toLowerCase() !== selectedEra.toLowerCase()) {
          return false;
        }
        return true;
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
  }, [searchedCreatures, selectedCategory, selectedEra, sortBy]);


  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '40px 0 80px' }} id="timeline-catalog">
      <div className="container">
        {/* Header Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Discover Weird Life
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '650px' }}>
            Its story across Earth's eras—from ancient apex giants to bizarre deep-sea creatures alive today.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Category / Biome Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
              Category:
            </span>
            {CREATURE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#050B10' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all var(--transition-fast)',
                    outline: 'none'
                  }}
                  id={`filter-category-${cat.id.toLowerCase()}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Row: Eras + Search & Sort Controls */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {/* Era Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                Era:
              </span>
              {ERAS.map((era) => {
                const isActive = selectedEra.toLowerCase() === era.id.toLowerCase();
                return (
                  <button
                    key={era.id}
                    onClick={() => setSelectedEra(era.id)}
                    style={{
                      background: isActive ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--text-secondary)' : 'var(--border-subtle)',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
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
            {/* Live Search Form & Semantic Intent Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  placeholder="Find something weird... (press / to search)"
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

              {searchIntent && (searchIntent.semanticConcepts.length > 0 || searchIntent.habitatType || searchIntent.size) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', paddingLeft: '8px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 700 }}>AI Intent:</span>
                  {searchIntent.semanticConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.65rem',
                        background: 'rgba(0, 255, 102, 0.08)',
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--text-primary)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      #{concept}
                    </span>
                  ))}
                  {searchIntent.habitatType && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      biome: {searchIntent.habitatType}
                    </span>
                  )}
                  {searchIntent.size && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      size: {searchIntent.size}
                    </span>
                  )}
                  {searchQuery && embeddingStatus === 'ready' && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        background: 'rgba(235, 255, 0, 0.1)',
                        border: '1px solid rgba(235, 255, 0, 0.4)',
                        color: 'var(--text-primary)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title="Neural vector embeddings re-ranking query results"
                    >
                      <Zap size={9} style={{ color: '#ebff00' }} /> MiniLM RRF
                    </span>
                  )}
                </div>
              )}
            </div>


            {/* Stream Species / Ingest Button */}
            <button
              onClick={() => {
                if (onStreamToTarget) {
                  onStreamToTarget();
                } else if (onStreamTo100) {
                  onStreamTo100();
                } else {
                  handleDiscoverLive();
                }
              }}
              disabled={streamingProgress?.isStreaming || isDiscovering}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                border: streamingProgress?.isStreaming
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                background: streamingProgress?.isStreaming
                  ? 'rgba(0, 255, 102, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)'
              }}
              id="btn-discover-live"
              title={`Continuously stream research-grade specimens until ${streamingProgress?.target || 225} organisms are in the catalog`}
            >
              {streamingProgress?.isStreaming || isDiscovering ? (
                <Loader2 size={15} className="animate-spin-slow" style={{ color: 'var(--accent-primary)' }} />
              ) : (
                <Compass size={15} style={{ color: 'var(--accent-primary)' }} />
              )}
              <span>
                {streamingProgress?.isStreaming
                  ? `Ingesting (${creatures.length}/${streamingProgress.target})...`
                  : creatures.length >= (streamingProgress?.target || 225)
                  ? `✓ Goal Reached (${creatures.length})`
                  : `Stream to ${streamingProgress?.target || 225} Species`}
              </span>
            </button>

            {/* Global Simplify Toggle Button */}
            <button
              type="button"
              onClick={() => setIsGlobalSimplified(!isGlobalSimplified)}
              className={`btn-subtle-brutalist ${isGlobalSimplified ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.78rem'
              }}
              title="Toggle plain-English simplified summary across all creature cards"
              id="btn-global-simplify"
            >
              <Sparkles size={14} />
              <span>{isGlobalSimplified ? 'SIMPLIFIED (ON)' : 'SIMPLIFY ALL'}</span>
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

        {/* Results Count & Stream Telemetry */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            Showing <strong>{filteredCreatures.length}</strong> of <strong>{creatures.length}</strong> extraordinary organisms
            {streamingProgress?.isStreaming && (
              <span style={{ marginLeft: '8px', color: 'var(--accent-primary)', fontWeight: 600 }} className="animate-pulse">
                • Streaming live observations ({creatures.length} / {streamingProgress?.target || 225})...
              </span>
            )}
          </div>
          {(searchQuery || selectedCategory !== 'all' || selectedEra !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedEra('all');
              }}
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '2px 8px' }}
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Responsive Grid of Compact Centered Creature Cards + Dynamic Add More Card */}
        {filteredCreatures.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredCreatures.map((creature) => (
              <TimelineNodeCard
                key={creature.id}
                creature={creature}
                onSelect={onSelectCreature}
                isGloballySimplified={isGlobalSimplified}
              />
            ))}

            {/* Dynamic Add More Card for current category + rest of categories */}
            <AddMoreCard
              category={selectedCategory}
              categoryLabel={CREATURE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Creatures'}
              onFetchMore={handleFetchCategoryBatch}
              isFetching={isDiscovering}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{
              padding: '50px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              borderRadius: 'var(--radius-card)',
              border: '2px dashed var(--border-subtle)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>🔍</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {searchQuery
                  ? `Nothing strange here for "${searchQuery}"`
                  : `No ${CREATURE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'specimens'} in this filter yet`}
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                {searchQuery
                  ? `We couldn't find an organism matching that in the catalog. Would you like to ask the global live networks?`
                  : `Tap below to summon new unique ${CREATURE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || ''} specimens from live biodiversity networks!`}
              </p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                {searchQuery && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleLiveSearch()}
                    disabled={isSearchingLive}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-button)' }}
                  >
                    {isSearchingLive ? <Loader2 size={16} className="animate-spin-slow" /> : <Globe size={16} />}
                    <span>Search Worldwide Live</span>
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedEra('all');
                    setSearchQuery('');
                    setLiveSearchFeedback(null);
                  }}
                  style={{ borderRadius: 'var(--radius-button)' }}
                >
                  Reset filters →
                </button>
              </div>
            </div>

            {/* Always surface the Add More Card so the user can easily fetch specimens directly into empty view */}
            <div style={{ maxWidth: '340px', margin: '0 auto', width: '100%' }}>
              <AddMoreCard
                category={selectedCategory}
                categoryLabel={CREATURE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Creatures'}
                onFetchMore={handleFetchCategoryBatch}
                isFetching={isDiscovering}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
