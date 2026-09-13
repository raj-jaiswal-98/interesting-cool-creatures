import React from 'react';
import { Compass, ShieldAlert, ArrowUpRight } from 'lucide-react';
import type { Creature } from '../../types/creature';

interface TimelineNodeCardProps {
  creature: Creature;
  onSelect: (creature: Creature) => void;
}

export function TimelineNodeCard({ creature, onSelect }: TimelineNodeCardProps) {
  const isExtant = creature.extinctionYear === null;
  const eraClass = `badge-${creature.era.toLowerCase()}`;

  const handleClick = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        onSelect(creature);
      });
    } else {
      onSelect(creature);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="glass-panel"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease'
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
        e.currentTarget.style.boxShadow = '0 12px 30px -5px var(--bg-glow)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      id={`creature-card-${creature.id}`}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '210px',
        overflow: 'hidden',
        background: '#071018'
      }}>
        <img
          src={creature.photoUrl}
          alt={creature.commonName}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => {
            e.currentTarget.style.transform = 'scale(1.0)';
          }}
        />

        {/* Top Badges */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span className={`badge ${eraClass}`}>
            {creature.era}
          </span>
          <span className={`badge ${isExtant ? 'badge-extant' : 'badge-extinct'}`} style={{ backdropFilter: 'blur(8px)' }}>
            {isExtant ? 'Living' : 'Extinct'}
          </span>
        </div>

        {/* Threat Badge */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(5, 11, 16, 0.75)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-full)',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: creature.stats?.dangerLevel >= 8 ? '#F87171' : 'var(--text-secondary)'
        }}>
          <ShieldAlert size={12} />
          <span>{creature.stats?.dangerLevel || 5}/10</span>
        </div>
      </div>

      {/* Body Info */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '4px',
                color: 'var(--text-primary)'
              }}>
                {creature.commonName}
              </h3>
              <p style={{
                fontSize: '0.85rem',
                fontStyle: 'italic',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '10px'
              }}>
                {creature.scientificName}
              </p>
            </div>
            <span style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)'
            }}>
              <ArrowUpRight size={16} />
            </span>
          </div>

          <p style={{
            fontSize: '0.88rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            {creature.description}
          </p>
        </div>

        {/* Footer Meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Compass size={13} />
            <span style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {creature.habitat}
            </span>
          </div>
          <span>{creature.diet || 'Fauna'}</span>
        </div>
      </div>
    </div>
  );
}
