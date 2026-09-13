import React, { useState, useEffect } from 'react';
import { X, BookOpen, Globe, Dna, Swords } from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { OccurrenceMapTab } from './OccurrenceMapTab';
import { FutureAdaptationTab } from './FutureAdaptationTab';
import { CreatureClashTab } from './CreatureClashTab';
import { themeEngine } from '../../services/theme/themeEngine';
import type { Creature } from '../../types/creature';

type TabId = 'overview' | 'map' | 'evolution' | 'clash';

const TABS: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'map', label: 'Occurrence Map', icon: Globe },
  { id: 'evolution', label: 'Future Adaptation (AI)', icon: Dna },
  { id: 'clash', label: 'Creature Clash', icon: Swords },
];

interface CreatureModalProps {
  creature: Creature | null;
  onClose: () => void;
}

export function CreatureModal({ creature, onClose }: CreatureModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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
        className="glass-panel glow-border"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--surface-card)',
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
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-sm)',
                objectFit: 'cover',
                border: '1px solid var(--accent-primary)',
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
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            id="btn-close-modal"
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'rgba(0, 0, 0, 0.2)',
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 18px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? 'var(--accent-primary)' : 'transparent'}`,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                  outline: 'none'
                }}
                id={`tab-${tab.id}`}
              >
                <Icon size={16} />
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
          {activeTab === 'overview' && <OverviewTab creature={creature} />}
          {activeTab === 'map' && <OccurrenceMapTab creature={creature} />}
          {activeTab === 'evolution' && <FutureAdaptationTab creature={creature} />}
          {activeTab === 'clash' && <CreatureClashTab creature={creature} />}
        </div>
      </div>
    </div>
  );
}
