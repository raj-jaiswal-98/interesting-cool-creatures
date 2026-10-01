import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dna, Globe2, Cpu, Radio } from 'lucide-react';
import { CREATURE_CATALOG } from './data/creatureCatalog';
import { getDailySpotlightCreature } from './utils/seedGenerator';
import { themeEngine, BRUTALIST_THEMES } from './services/theme/themeEngine';
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
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'map' | 'evolution' | 'clash'>('overview');
  const [activeTheme, setActiveTheme] = useState<string>('acid');
  const [aiStatus, setAiStatus] = useState<AIAvailabilityStatus | 'checking'>('checking');
  const [streamingProgress, setStreamingProgress] = useState<{
    current: number;
    target: number;
    isStreaming: boolean;
  }>({
    current: CREATURE_CATALOG.length,
    target: 100,
    isStreaming: true
  });

  const startStreamingTo100 = () => {
    setStreamingProgress((prev) => ({ ...prev, isStreaming: true }));

    creatureResolver
      .streamUntilTargetCount(100, (batch, totalSoFar) => {
        setCatalog((prev) => {
          const existingIds = new Set(prev.map((c) => c.id.toLowerCase()));
          const existingNames = new Set(prev.map((c) => c.scientificName.toLowerCase()));
          const fresh = batch.filter(
            (c) =>
              !existingIds.has(c.id.toLowerCase()) &&
              !existingNames.has(c.scientificName.toLowerCase())
          );
          return [...prev, ...fresh];
        });
        setStreamingProgress({
          current: totalSoFar,
          target: 100,
          isStreaming: totalSoFar < 100
        });
      })
      .then((finalCatalog) => {
        setCatalog((prev) => {
          const existingIds = new Set(prev.map((c) => c.id.toLowerCase()));
          const existingNames = new Set(prev.map((c) => c.scientificName.toLowerCase()));
          const fresh = finalCatalog.filter(
            (c) =>
              !existingIds.has(c.id.toLowerCase()) &&
              !existingNames.has(c.scientificName.toLowerCase())
          );
          return [...prev, ...fresh];
        });
        setStreamingProgress((prev) => ({
          current: Math.max(prev.current, finalCatalog.length),
          target: 100,
          isStreaming: false
        }));
      })
      .catch((err) => {
        console.warn('Progressive creature streaming deferred:', err);
      })
      .finally(() => {
        setStreamingProgress((prev) => ({ ...prev, isStreaming: false }));
      });
  };

  useEffect(() => {
    // Initialize default non-blue Neo-Brutalist theme
    themeEngine.applyBrutalistTheme('acid');

    const daily = getDailySpotlightCreature(CREATURE_CATALOG);
    setSpotlightCreature(daily);

    // Check Chrome AI Availability
    chromeAI.checkAvailability().then((status) => {
      setAiStatus(status);
    });

    // Automatically stream research-grade species until we have 100 creatures
    startStreamingTo100();
  }, []);

  const [isPureLiveMode, setIsPureLiveMode] = useState<boolean>(false);

  const handleTogglePureLiveMode = async () => {
    if (!isPureLiveMode) {
      setStreamingProgress((prev) => ({ ...prev, isStreaming: true }));
      try {
        const pureLive = await creatureResolver.fetchTrendingLiveCreatures(15);
        if (pureLive.length > 0) {
          setCatalog(pureLive);
          setSpotlightCreature(pureLive[0]);
          themeEngine.applyCreatureTheme(pureLive[0].photoUrl, pureLive[0].themePalette);
          setIsPureLiveMode(true);
        }
      } catch (err) {
        console.warn('Failed to switch to pure live stream:', err);
      } finally {
        setStreamingProgress((prev) => ({ ...prev, isStreaming: false }));
      }
    } else {
      setCatalog(CREATURE_CATALOG);
      const daily = getDailySpotlightCreature(CREATURE_CATALOG);
      setSpotlightCreature(daily);
      if (daily) themeEngine.applyCreatureTheme(daily.photoUrl, daily.themePalette);
      setIsPureLiveMode(false);
      startStreamingTo100();
    }
  };

  const handleAddDynamicCreatures = (newCreatures: Creature[]) => {
    setCatalog((prev) => {
      const existingIds = new Set(prev.map((c) => c.id.toLowerCase()));
      const existingNames = new Set(prev.map((c) => c.scientificName.toLowerCase()));
      const unique = newCreatures.filter(
        (c) =>
          !existingIds.has(c.id.toLowerCase()) &&
          !existingNames.has(c.scientificName.toLowerCase())
      );
      const updated = [...prev, ...unique];
      setStreamingProgress({
        current: updated.length,
        target: 100,
        isStreaming: false
      });
      return updated;
    });
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Dynamic Habitat Canvas Particle Ecosystem */}
      {spotlightCreature && (
        <HabitatCanvas
          habitat={spotlightCreature.habitatType}
          primaryColor={spotlightCreature.themePalette?.primary || 'var(--accent-primary)'}
          glowColor={spotlightCreature.themePalette?.glow || 'var(--bg-glow)'}
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

          {/* Quick Metrics & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Brutalist Color Theme Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1.5px solid var(--brutalist-border)',
                borderRadius: '6px',
                padding: '3px 5px'
              }}
              title="Brutalist Theme Palette Switcher"
            >
              {Object.values(BRUTALIST_THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTheme(t.id);
                    themeEngine.applyBrutalistTheme(t.id);
                  }}
                  className={`btn-subtle-brutalist ${activeTheme === t.id ? 'active' : ''}`}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={`Switch to ${t.name}`}
                >
                  <span style={{ fontSize: '0.75rem' }}>{t.icon}</span>
                  <span>{t.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* 100 Species Streaming Telemetry Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: streamingProgress.isStreaming
                  ? 'rgba(0, 255, 102, 0.08)'
                  : catalog.length >= 100
                  ? 'rgba(0, 255, 102, 0.12)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: streamingProgress.isStreaming
                  ? '1.5px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                transition: 'all 0.3s ease'
              }}
              title="Global Biodiversity Stream Status"
            >
              <Globe2
                size={14}
                className={streamingProgress.isStreaming ? 'animate-spin-slow' : ''}
                style={{ color: 'var(--accent-primary)' }}
              />
              <span>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '0.84rem' }}>{catalog.length}</strong>
                <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>/</span>
                <span>100 Species</span>
                {streamingProgress.isStreaming ? (
                  <span
                    style={{
                      marginLeft: '6px',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      letterSpacing: '0.02em'
                    }}
                    className="animate-pulse"
                  >
                    (Streaming Live...)
                  </span>
                ) : catalog.length >= 100 ? (
                  <span
                    style={{
                      marginLeft: '6px',
                      color: 'var(--accent-primary)',
                      fontWeight: 700
                    }}
                  >
                    (✓ Complete)
                  </span>
                ) : null}
              </span>
            </div>

            {/* Quick Action Button to Trigger or Re-stream */}
            <button
              onClick={() => startStreamingTo100()}
              disabled={streamingProgress.isStreaming}
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: streamingProgress.isStreaming
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                background: streamingProgress.isStreaming
                  ? 'rgba(0, 255, 102, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)'
              }}
              title="Stream until at least 100 research-grade species are ingested"
            >
              <Radio
                size={14}
                className={streamingProgress.isStreaming ? 'animate-pulse' : ''}
                style={{ color: 'var(--accent-primary)' }}
              />
              <span>
                {streamingProgress.isStreaming
                  ? `Ingesting (${catalog.length}/100)...`
                  : catalog.length >= 100
                  ? 'Sync 100 Species'
                  : 'Fetch to 100'}
              </span>
            </button>

            <button
              onClick={handleTogglePureLiveMode}
              disabled={streamingProgress.isStreaming}
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: isPureLiveMode ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: isPureLiveMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)'
              }}
              title="Toggle between scientific archive and 100% dynamically fetched live organisms"
            >
              <Radio size={14} style={{ color: isPureLiveMode ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <span>{isPureLiveMode ? 'Live Feed (Active)' : 'Pure Live Feed'}</span>
            </button>

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
              <Cpu size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>{aiStatus === 'readily' ? 'Gemini Nano' : 'Procedural AI'}</span>
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
          onSelectCreature={(c: Creature, tab = 'overview') => {
            setSelectedCreature(c);
            setModalInitialTab(tab);
          }}
          onAddCreatures={handleAddDynamicCreatures}
          streamingProgress={streamingProgress}
          onStreamTo100={startStreamingTo100}
        />
      </main>

      {/* Detailed Deep-Dive Modal */}
      {selectedCreature && (
        <CreatureModal
          creature={selectedCreature}
          initialTab={modalInitialTab}
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
