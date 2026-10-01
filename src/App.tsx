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
import { embeddingService } from './services/ai/embeddingService';
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
  
  // Dynamic catalog goal randomized between 200 and 250 species
  const [targetCount] = useState<number>(() => Math.floor(Math.random() * (250 - 200 + 1)) + 200);
  const [streamingProgress, setStreamingProgress] = useState<{
    current: number;
    target: number;
    isStreaming: boolean;
  }>(() => {
    const initialTarget = Math.floor(Math.random() * (250 - 200 + 1)) + 200;
    return {
      current: CREATURE_CATALOG.length,
      target: initialTarget,
      isStreaming: true
    };
  });

  const startStreamingToTarget = (customTarget?: number) => {
    const target = customTarget || streamingProgress.target || targetCount;
    setStreamingProgress((prev) => ({ ...prev, target, isStreaming: true }));

    creatureResolver
      .streamUntilTargetCount(target, (batch, totalSoFar) => {
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
        setStreamingProgress((prev) => ({
          current: totalSoFar,
          target: prev.target,
          isStreaming: totalSoFar < prev.target
        }));
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
          target: prev.target,
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

    // Automatically stream research-grade species until target (200-250) is reached
    startStreamingToTarget();

    // Idle-initialize Transformers.js background embedding worker
    const startEmbedder = () => embeddingService.init();
    const w = window as any;
    const h = typeof w.requestIdleCallback === 'function' ? w.requestIdleCallback(startEmbedder) : setTimeout(startEmbedder, 1200);

    return () => {
      if (typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(h);
      } else {
        clearTimeout(h);
      }
    };
  }, []);

  const [surpriseToast, setSurpriseToast] = useState<string | null>(null);

  const handleSurpriseMe = () => {
    if (catalog.length === 0) return;
    const randomIdx = Math.floor(Math.random() * catalog.length);
    const chosen = catalog[randomIdx];

    setSurpriseToast('Finding you a weird one...');
    setTimeout(() => {
      setSpotlightCreature(chosen);
      themeEngine.applyCreatureTheme(chosen.photoUrl, chosen.themePalette);
      setSurpriseToast(null);

      const hero = document.getElementById('spotlight-hero');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 280);
  };

  // Global hotkeys: Space -> Surprise Me, / -> Focus search, Esc -> Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleSurpriseMe();
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('input-species-search');
        if (searchInput) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [catalog]);

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
      startStreamingToTarget();
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
      setStreamingProgress((sp) => ({
        current: updated.length,
        target: Math.max(sp.target, updated.length),
        isStreaming: false
      }));
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

      {/* Playful Surprise Me Status Floating Toast */}
      {surpriseToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            border: '1.5px solid var(--accent-primary)',
            padding: '8px 20px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <span>✨</span>
          <span>{surpriseToast}</span>
        </div>
      )}

      {/* Global Navigation Header (Simplified Museum Style § 5) */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(8, 10, 14, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '14px',
          paddingBottom: '14px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo / Museum Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#050B10',
              fontWeight: 900,
              fontSize: '1rem'
            }}>
              ✦
            </span>
            <div>
              <h1 style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1
              }}>
                <span className="gradient-text">Interesting Cool Creatures</span>
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                a tiny, curious museum of weird life
              </span>
            </div>
          </div>

          {/* Clean Museum Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Surprise Me Signature Button */}
            <button
              onClick={handleSurpriseMe}
              className="btn btn-primary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 'var(--radius-button)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700
              }}
              title="Pick a random fascinating creature (Shortcut: Space)"
            >
              <span>✨ Surprise me</span>
              <kbd style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                marginLeft: '2px'
              }}>
                Space
              </kbd>
            </button>

            {/* Quick Search Jump Trigger */}
            <button
              onClick={() => {
                const search = document.getElementById('input-species-search');
                if (search) {
                  search.focus();
                  search.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: 'var(--radius-button)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Search species (Shortcut: /)"
            >
              <span>Search</span>
              <kbd style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.65rem'
              }}>
                /
              </kbd>
            </button>

            {/* Quiet Live Data Indicator (§ 40) */}
            <button
              onClick={handleTogglePureLiveMode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isPureLiveMode ? 'rgba(0, 255, 102, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.74rem',
                color: isPureLiveMode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title={isPureLiveMode ? 'Streaming live from iNaturalist & GBIF' : 'Click to stream live from GBIF & iNaturalist'}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'inline-block'
                }}
                className={streamingProgress.isStreaming ? 'animate-ping' : ''}
              />
              <span>{isPureLiveMode ? 'Live Feed' : '● Live'}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                ({catalog.length})
              </span>
            </button>

            {/* Soft Palette Switcher (Minimal) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 4px'
              }}
              title="Change theme color"
            >
              {Object.values(BRUTALIST_THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTheme(t.id);
                    themeEngine.applyBrutalistTheme(t.id);
                  }}
                  style={{
                    background: activeTheme === t.id ? t.primary : 'transparent',
                    border: 'none',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTheme === t.id ? `0 0 8px ${t.primary}` : 'none'
                  }}
                  title={t.name}
                />
              ))}
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
          onSurpriseMe={handleSurpriseMe}
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
          onStreamToTarget={startStreamingToTarget}
          onStreamTo100={startStreamingToTarget}
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
