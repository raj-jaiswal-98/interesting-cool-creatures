import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dna, Globe2, Cpu, Radio } from 'lucide-react';
import { CREATURE_CATALOG } from './data/creatureCatalog';
import { getDailySpotlightCreature } from './utils/seedGenerator';
import { themeEngine } from './services/theme/themeEngine';
import { HabitatCanvas } from './components/hero/HabitatCanvas';
import { SpotlightHero } from './components/hero/SpotlightHero';
import { ExtinctionTimeline } from './components/timeline/ExtinctionTimeline';
import { CreatureModal } from './components/modal/CreatureModal';
import { chromeAI } from './services/ai/chromeAIService';
import { creatureResolver } from './services/resolver/creatureResolver';
import type { Creature } from './types/creature';
import type { AIAvailabilityStatus } from './types/ai';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes
      retry: 1
    }
  }
});

export function AppContent() {
  const [catalog, setCatalog] = useState<Creature[]>(CREATURE_CATALOG);
  const [spotlightCreature, setSpotlightCreature] = useState<Creature | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [aiStatus, setAiStatus] = useState<AIAvailabilityStatus | 'checking'>('checking');
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [liveAddedCount, setLiveAddedCount] = useState<number>(0);

  useEffect(() => {
    const daily = getDailySpotlightCreature(CREATURE_CATALOG);
    setSpotlightCreature(daily);

    if (daily) {
      themeEngine.applyCreatureTheme(daily.photoUrl, daily.themePalette);
    }

    // Check Chrome AI Availability
    chromeAI.checkAvailability().then((status) => {
      setAiStatus(status);
    });

    // Ingest dynamic research-grade organisms live from iNaturalist & GBIF
    setIsLiveSyncing(true);
    creatureResolver
      .fetchTrendingLiveCreatures(8)
      .then((liveCreatures) => {
        if (liveCreatures.length > 0) {
          setCatalog((prev) => {
            const existingIds = new Set(prev.map((c) => c.id.toLowerCase()));
            const unique = liveCreatures.filter((c) => !existingIds.has(c.id.toLowerCase()));
            setLiveAddedCount(unique.length);
            return [...prev, ...unique];
          });
        }
      })
      .catch((err) => {
        console.warn('Initial live species sync deferred:', err);
      })
      .finally(() => {
        setIsLiveSyncing(false);
      });
  }, []);

  const [isPureLiveMode, setIsPureLiveMode] = useState<boolean>(false);

  const handleTogglePureLiveMode = async () => {
    if (!isPureLiveMode) {
      setIsLiveSyncing(true);
      try {
        const pureLive = await creatureResolver.fetchTrendingLiveCreatures(12);
        if (pureLive.length > 0) {
          setCatalog(pureLive);
          setSpotlightCreature(pureLive[0]);
          themeEngine.applyCreatureTheme(pureLive[0].photoUrl, pureLive[0].themePalette);
          setIsPureLiveMode(true);
          setLiveAddedCount(pureLive.length);
        }
      } catch (err) {
        console.warn('Failed to switch to pure live stream:', err);
      } finally {
        setIsLiveSyncing(false);
      }
    } else {
      setCatalog(CREATURE_CATALOG);
      const daily = getDailySpotlightCreature(CREATURE_CATALOG);
      setSpotlightCreature(daily);
      if (daily) themeEngine.applyCreatureTheme(daily.photoUrl, daily.themePalette);
      setIsPureLiveMode(false);
      setLiveAddedCount(0);
    }
  };

  const handleAddDynamicCreatures = (newCreatures: Creature[]) => {
    setCatalog((prev) => {
      const existingIds = new Set(prev.map((c) => c.id.toLowerCase()));
      const unique = newCreatures.filter((c) => !existingIds.has(c.id.toLowerCase()));
      setLiveAddedCount((count) => count + unique.length);
      return [...prev, ...unique];
    });
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Dynamic Habitat Canvas Particle Ecosystem */}
      {spotlightCreature && (
        <HabitatCanvas
          habitat={spotlightCreature.habitatType}
          primaryColor={spotlightCreature.themePalette?.primary || '#00F0FF'}
          glowColor={spotlightCreature.themePalette?.glow || 'rgba(0, 240, 255, 0.25)'}
        />
      )}

      {/* Global Navigation Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5, 11, 16, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Logo / Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              display: 'inline-flex',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #A855F7 100%)',
              color: '#050B10',
              boxShadow: '0 0 20px var(--bg-glow)'
            }}>
              <Dna size={22} />
            </span>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1
              }}>
                <span className="gradient-text">Interesting Cool Creatures</span>
              </h1>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Earth's Extraordinary Extant & Extinct Biodiversity
              </span>
            </div>
          </div>

          {/* Quick Metrics & AI Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              <Globe2 size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>
                {catalog.length} Species{' '}
                {isPureLiveMode ? (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                    (100% Live Stream)
                  </span>
                ) : liveAddedCount > 0 ? (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                    (+{liveAddedCount} Live Synced)
                  </span>
                ) : (
                  'Cataloged'
                )}
              </span>
            </div>

            <button
              onClick={handleTogglePureLiveMode}
              disabled={isLiveSyncing}
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: isPureLiveMode ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: isPureLiveMode ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)'
              }}
              title="Toggle between scientific archive and 100% dynamically fetched live organisms"
            >
              <Radio size={14} style={{ color: isPureLiveMode ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <span>{isPureLiveMode ? 'Mode: 100% Live Stream' : 'Switch to Pure Live Feed'}</span>
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isLiveSyncing ? 'rgba(0, 240, 255, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${isLiveSyncing ? 'rgba(0, 240, 255, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              color: isLiveSyncing ? '#38BDF8' : '#34D399'
            }}>
              <Radio size={14} className={isLiveSyncing ? 'animate-pulse' : ''} />
              <span>{isLiveSyncing ? 'Syncing Live Biodiversity...' : 'Live Stream Active'}</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: aiStatus === 'readily' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
              border: `1px solid ${aiStatus === 'readily' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              color: aiStatus === 'readily' ? '#34D399' : '#38BDF8'
            }}>
              <Cpu size={14} />
              <span>{aiStatus === 'readily' ? 'Gemini Nano Active' : 'Procedural AI Online'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Sections */}
      <main>
        {/* Spotlight Hero Section */}
        <SpotlightHero
          creature={spotlightCreature}
          onSelectCreature={(c: Creature) => setSelectedCreature(c)}
        />

        {/* Evolutionary Timeline & Filterable Catalog */}
        <ExtinctionTimeline
          creatures={catalog}
          onSelectCreature={(c: Creature) => setSelectedCreature(c)}
          onAddCreatures={handleAddDynamicCreatures}
        />
      </main>

      {/* Detailed Deep-Dive Modal */}
      {selectedCreature && (
        <CreatureModal
          creature={selectedCreature}
          onClose={() => {
            setSelectedCreature(null);
            // Re-apply daily spotlight theme when closing
            if (spotlightCreature) {
              themeEngine.applyCreatureTheme(spotlightCreature.photoUrl, spotlightCreature.themePalette);
            }
          }}
        />
      )}

      {/* Global Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(5, 11, 16, 0.95)',
        padding: '40px 0',
        marginTop: '60px'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>
              Interesting Cool Creatures
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Synthesizing biodiversity telemetry from GBIF, iNaturalist, EOL, NOAA FishWatch, and Chrome Built-in AI.
            </p>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Client-Side Architecture • Built with Vite, React & Canvas 2D
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
