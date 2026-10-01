import React, { useState, useEffect } from 'react';
import { X, BookOpen, Globe, Dna, Swords } from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { OccurrenceMapTab } from './OccurrenceMapTab';
import { FutureAdaptationTab } from './FutureAdaptationTab';
import { CreatureClashTab } from './CreatureClashTab';
import { themeEngine } from '../../services/theme/themeEngine';
import { getCreaturePersonalityTags } from '../../utils/personality';
import type { Creature } from '../../types/creature';

type TabId = 'overview' | 'map' | 'evolution' | 'clash';

const TABS: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'About it', icon: BookOpen },
  { id: 'map', label: "Where it's been seen", icon: Globe },
  { id: 'evolution', label: 'Imagine', icon: Dna },
  { id: 'clash', label: 'Who wins?', icon: Swords },
];

interface CreatureModalProps {
  creature: Creature | null;
  initialTab?: TabId;
  onClose: () => void;
}

export function CreatureModal({ creature, initialTab = 'overview', onClose }: CreatureModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, creature]);

  // Trigger dynamic theme extraction on mount
  useEffect(() => {
    if (creature) {
      themeEngine.applyCreatureTheme(creature.photoUrl, creature.themePalette);
    }
  }, [creature]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!creature) return null;

  const isExtant = creature.extinctionYear === null;
  const eraClass = `badge-${creature.era.toLowerCase()}`;
  const personalityTags = getCreaturePersonalityTags(creature);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(3, 8, 13, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-creature-title"
    >
      <div
        className="brutalist-modal"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1060px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#0D0E12',
          border: '2px solid var(--brutalist-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '10px 10px 0px rgba(0, 0, 0, 0.95)',
          position: 'relative'
        }}
      >
        {/* Modal Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(to right, rgba(255,255,255,0.03) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={creature.photoUrl}
              alt={creature.commonName}
              referrerPolicy="no-referrer"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80';
              }}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '1.5px solid var(--accent-primary)',
                boxShadow: '0 0 15px var(--bg-glow)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className={`badge ${eraClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {creature.era}
                </span>
                <span className={`badge ${isExtant ? 'badge-extant' : 'badge-extinct'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {isExtant ? 'Living Species' : 'Extinct'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <h2
                  id="modal-creature-title"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}
                >
                  {creature.commonName}
                </h2>
                <span style={{
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-primary)',
                  fontStyle: 'italic'
                }}>
                  {creature.scientificName}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {personalityTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="personality-tag"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-subtle-brutalist"
            style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px', borderRadius: 'var(--radius-button)' }}
            id="btn-close-modal"
            aria-label="Close dialog"
          >
            <X size={15} />
            <span>Done</span>
          </button>
        </div>

        {/* Modal Navigation Tabs (Subtle Buttons: Icons with Label Text) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1.5px solid var(--brutalist-border)',
          padding: '10px 24px',
          background: '#090A0D',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn-subtle-brutalist ${isActive ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                id={`tab-${tab.id}`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Tab Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {activeTab === 'overview' && (
            <OverviewTab creature={creature} onSwitchTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'map' && <OccurrenceMapTab creature={creature} />}
          {activeTab === 'evolution' && <FutureAdaptationTab creature={creature} />}
          {activeTab === 'clash' && <CreatureClashTab creature={creature} />}
        </div>
      </div>
    </div>
  );
}
