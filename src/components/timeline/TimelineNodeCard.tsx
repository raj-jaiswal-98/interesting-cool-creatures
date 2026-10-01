import React, { useState } from 'react';
import {
  ArrowRight,
  MapPin,
  Swords
} from 'lucide-react';
import { getCreaturePersonalityTags, getCreatureTinyFact } from '../../utils/personality';
import { formatCreatureLength, formatCreatureWeight } from '../../utils/formatters';
import type { Creature } from '../../types/creature';

interface TimelineNodeCardProps {
  creature: Creature;
  onSelect: (creature: Creature, initialTab?: 'overview' | 'map' | 'evolution' | 'clash') => void;
  isGloballySimplified?: boolean;
}

export function TimelineNodeCard({ creature, onSelect }: TimelineNodeCardProps) {
  const [imgHovered, setImgHovered] = useState(false);

  const eraClass = `badge-${creature.era.toLowerCase()}`;
  const personalityTags = getCreaturePersonalityTags(creature);
  const tinyFact = getCreatureTinyFact(creature);

  const handleCardClick = (tab: 'overview' | 'map' | 'evolution' | 'clash' = 'overview') => {
    onSelect(creature, tab);
  };

  return (
    <div
      className="brutalist-card"
      id={`creature-card-${creature.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '12px',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      {/* Specimen Image Frame (§ 21, 29) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={() => handleCardClick('overview')}
        onMouseEnter={() => setImgHovered(true)}
        onMouseLeave={() => setImgHovered(false)}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '160px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: '#040507',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={creature.photoUrl}
            alt={creature.commonName}
            referrerPolicy="no-referrer"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: imgHovered ? 'scale(1.06)' : 'scale(1.0)',
              filter: imgHovered ? 'contrast(1.06) brightness(1.03)' : 'contrast(1.0) brightness(0.95)',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease'
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80';
            }}
          />

          <span
            className={`badge ${eraClass}`}
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              fontSize: '0.65rem',
              backdropFilter: 'blur(4px)',
              padding: '2px 8px'
            }}
          >
            {creature.era}
          </span>
        </div>
      </div>

      {/* Title & Identifiers */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 2px 0',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            onClick={() => handleCardClick('overview')}
          >
            {creature.commonName}
          </h3>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            margin: '0 0 8px 0',
            fontStyle: 'italic'
          }}
        >
          {creature.scientificName}
        </p>

        {/* Personality Tags (§ 9) */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {personalityTags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.66rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Tiny Fact Hook (§ 10, § 29) */}
        <p
          style={{
            fontSize: '0.8rem',
            lineHeight: 1.45,
            color: 'var(--text-secondary)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {tinyFact}
        </p>
      </div>

      {/* Compact Vital Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          padding: '6px 0',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            LENGTH
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCreatureLength(creature.stats?.lengthMeters, true)}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            WEIGHT
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCreatureWeight(creature.stats?.weightKg, true)}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            THREAT
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: '#F87171' }}>
            {creature.stats?.dangerLevel || 5}/10
          </span>
        </div>
      </div>

      {/* Card Actions: Verb-First "Meet it" (§ 7, § 29) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          marginTop: 'auto'
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => handleCardClick('map')}
            className="btn btn-ghost"
            title="See sightings on map"
            style={{ padding: '5px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-button)' }}
          >
            <MapPin size={12} style={{ color: 'var(--accent-primary)' }} />
          </button>

          <button
            type="button"
            onClick={() => handleCardClick('clash')}
            className="btn btn-ghost"
            title="Battle duel"
            style={{ padding: '5px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-button)' }}
          >
            <Swords size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleCardClick('overview')}
          className="btn btn-primary"
          style={{
            padding: '6px 14px',
            fontSize: '0.78rem',
            borderRadius: 'var(--radius-button)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>Meet it</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
