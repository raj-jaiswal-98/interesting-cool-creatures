import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowUpRight,
  Globe,
  Swords,
  Sparkles,
  BookOpen,
  MapPin
} from 'lucide-react';
import { CREATURE_CATALOG } from '../../data/creatureCatalog';
import { getSimplifiedDossier } from '../../utils/creatureSimplifier';
import type { Creature } from '../../types/creature';

interface TimelineNodeCardProps {
  creature: Creature;
  onSelect: (creature: Creature, initialTab?: 'overview' | 'map' | 'evolution' | 'clash') => void;
  isGloballySimplified?: boolean;
}

export function TimelineNodeCard({ creature, onSelect, isGloballySimplified = false }: TimelineNodeCardProps) {
  const [localSimplified, setLocalSimplified] = useState<boolean | null>(null);
  const [imgHovered, setImgHovered] = useState(false);

  const isSimplified = localSimplified !== null ? localSimplified : isGloballySimplified;

  const isExtant = creature.extinctionYear === null;
  const isDynamic = !CREATURE_CATALOG.some((c) => c.id === creature.id);
  const eraClass = `badge-${creature.era.toLowerCase()}`;
  const dossier = getSimplifiedDossier(creature);

  const handleCardClick = (tab: 'overview' | 'map' | 'evolution' | 'clash' = 'overview') => {
    onSelect(creature, tab);
  };

  const threatColor =
    creature.stats?.dangerLevel >= 8
      ? '#FF2E63'
      : creature.stats?.dangerLevel >= 5
      ? '#FFB800'
      : '#00FF66';

  return (
    <div
      className="brutalist-card"
      id={`creature-card-${creature.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '12px',
        background: 'var(--brutalist-card)',
        borderRadius: '8px',
        border: '1.5px solid var(--brutalist-border)'
      }}
    >
      {/* Corner Registration Mark */}
      <span className="brutalist-corner-tr">+</span>

      {/* ========================================================
          CENTERED SPECIMEN IMAGE (REDUCED SIZE)
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '8px 0 4px',
          cursor: 'pointer'
        }}
        onClick={() => handleCardClick('overview')}
        onMouseEnter={() => setImgHovered(true)}
        onMouseLeave={() => setImgHovered(false)}
      >
        {/* Centered Specimen Frame */}
        <div
          style={{
            position: 'relative',
            width: '135px',
            height: '135px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1.5px solid rgba(255, 255, 255, 0.16)',
            background: '#040507',
            boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.9), 3px 3px 0px rgba(0,0,0,0.7)',
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
              transform: imgHovered ? 'scale(1.08)' : 'scale(1.0)',
              filter: imgHovered ? 'contrast(1.08) brightness(1.05)' : 'contrast(1.0) brightness(0.95)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease'
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {isDynamic && (
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: 'rgba(0, 255, 102, 0.25)',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.58rem',
                fontWeight: 800,
                padding: '1px 4px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Globe size={8} className="animate-telemetry-ping" />
              <span>LIVE</span>
            </span>
          )}
        </div>

        {/* Centered Badges Row */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '10px', alignItems: 'center', justifyContent: 'center' }}>
          <span
            className={`badge ${eraClass}`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              padding: '2px 6px',
              borderRadius: '3px',
              borderWidth: '1px'
            }}
          >
            {creature.era}
          </span>

          <span
            className={`badge ${isExtant ? 'badge-extant' : 'badge-extinct'}`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              padding: '2px 6px',
              borderRadius: '3px'
            }}
          >
            {isExtant ? 'LIVING' : 'EXTINCT'}
          </span>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              border: `1px solid ${threatColor}`,
              borderRadius: '3px',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: threatColor
            }}
          >
            <ShieldAlert size={10} />
            <span>{creature.stats?.dangerLevel || 5}/10</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          CREATURE INFORMATION & SUMMARY SECTION
          ======================================================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <h3
              onClick={() => handleCardClick('overview')}
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                margin: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              {creature.commonName}
            </h3>

            <p
              style={{
                fontSize: '0.8rem',
                fontStyle: 'italic',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
                margin: '2px 0 0'
              }}
            >
              {creature.scientificName}
            </p>
          </div>

          <button
            onClick={() => handleCardClick('overview')}
            className="btn-subtle-brutalist"
            title="Inspect dossier"
            style={{ padding: '3px 6px' }}
          >
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Summary Block with Subtle Simplify Button */}
        <div
          style={{
            marginTop: '10px',
            padding: '9px 11px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: isSimplified ? '1px dashed var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '5px',
            transition: 'all 0.25s ease'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '5px',
              gap: '6px'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isSimplified ? 'var(--accent-primary)' : 'var(--text-muted)'
              }}
            >
              {isSimplified ? '⚡ SIMPLIFIED' : '🔬 DOSSIER BRIEF'}
            </span>

            {/* Subtle Button (Icon with Label Text) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLocalSimplified(!isSimplified);
              }}
              className={`btn-subtle-brutalist ${isSimplified ? 'active' : ''}`}
              style={{
                padding: '2px 6px',
                fontSize: '0.64rem',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title={isSimplified ? 'Switch to scientific view' : 'Simplify explanation into plain English'}
            >
              {isSimplified ? (
                <>
                  <BookOpen size={10} />
                  <span>Sci</span>
                </>
              ) : (
                <>
                  <Sparkles size={10} />
                  <span>Simplify</span>
                </>
              )}
            </button>
          </div>

          {/* Text Description Switcher */}
          {isSimplified ? (
            <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#F1F5F9' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-accent)', marginBottom: '2px' }}>
                {dossier.headline}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {dossier.superpower}
              </div>
            </div>
          ) : (
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
              {creature.description}
            </p>
          )}
        </div>
      </div>

      {/* ========================================================
          VITAL METRICS MATRIX (4 COMPACT BRUTALIST CHIPS)
          ======================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '5px'
        }}
      >
        <div className="brutalist-data-chip" style={{ padding: '3px 6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            SIZE
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {creature.stats?.lengthMeters ? `${creature.stats.lengthMeters}m` : 'Var'}
          </span>
        </div>

        <div className="brutalist-data-chip" style={{ padding: '3px 6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            MASS
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {creature.stats?.weightKg
              ? creature.stats.weightKg >= 1000
                ? `${(creature.stats.weightKg / 1000).toFixed(1)}t`
                : `${creature.stats.weightKg}kg`
              : '<1g'}
          </span>
        </div>

        <div className="brutalist-data-chip" style={{ padding: '3px 6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            DIET
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {creature.diet || 'Fauna'}
          </span>
        </div>

        <div className="brutalist-data-chip" style={{ padding: '3px 6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            BIOME
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={creature.habitat}
          >
            {creature.habitat.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* ========================================================
          SUBTLE BUTTONS (ICONS WITH LABEL TEXT)
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--brutalist-border)',
          paddingTop: '8px',
          gap: '4px'
        }}
      >
        <button
          type="button"
          onClick={() => handleCardClick('map')}
          className="btn-subtle-brutalist"
          title="View geographic map"
          style={{ padding: '3px 7px', fontSize: '0.66rem' }}
        >
          <MapPin size={11} />
          <span>Map</span>
        </button>

        <button
          type="button"
          onClick={() => handleCardClick('clash')}
          className="btn-subtle-brutalist"
          title="Battle simulator"
          style={{ padding: '3px 7px', fontSize: '0.66rem' }}
        >
          <Swords size={11} />
          <span>Clash</span>
        </button>

        <button
          type="button"
          onClick={() => handleCardClick('overview')}
          className="btn-subtle-brutalist active"
          title="Open full dossier"
          style={{ padding: '3px 9px', fontSize: '0.66rem' }}
        >
          <BookOpen size={11} />
          <span>Inspect</span>
        </button>
      </div>
    </div>
  );
}
