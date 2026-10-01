import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Compass, ShieldAlert, Ruler, Scale, ArrowRight, Shuffle } from 'lucide-react';
import { getTimeUntilNextSpotlight } from '../../utils/seedGenerator';
import { getCreaturePersonalityTags, getCreatureTinyFact } from '../../utils/personality';
import { formatCreatureLength, formatCreatureWeight } from '../../utils/formatters';
import type { Creature } from '../../types/creature';

interface SpotlightHeroProps {
  creature: Creature | null;
  onSelectCreature: (creature: Creature) => void;
  onSurpriseMe?: () => void;
}

export function SpotlightHero({ creature, onSelectCreature, onSurpriseMe }: SpotlightHeroProps) {
  const [countdown, setCountdown] = useState(getTimeUntilNextSpotlight());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNextSpotlight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!creature) return null;

  const eraClass = `badge-${creature.era.toLowerCase()}`;
  const isExtant = creature.extinctionYear === null;
  const personalityTags = getCreaturePersonalityTags(creature);
  const tinyFact = getCreatureTinyFact(creature);

  return (
    <section
      id="spotlight-hero"
      className="spotlight-section"
      style={{ position: 'relative', zIndex: 1, padding: '36px 0 20px' }}
    >
      <div className="container">
        {/* Top bar with Daily Spotlight indicator & live timer */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: '#050B10'
            }}>
              <Sparkles size={14} />
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--text-primary)'
            }}>
              Today's Discovery
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Next in: </span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
            </strong>
          </div>
        </div>

        {/* Soft-Brutalist Hero Card (§ 8, 28) */}
        <div className="glass-panel" style={{
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '0',
          position: 'relative',
          borderRadius: 'var(--radius-card)',
          border: '1.5px solid var(--border-subtle)',
          background: 'linear-gradient(135deg, var(--surface-card) 0%, rgba(13, 17, 23, 0.95) 100%)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          {/* Visual Column */}
          <div style={{
            position: 'relative',
            minHeight: '380px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 100%)'
          }}>
            <img
              src={creature.photoUrl}
              alt={creature.commonName}
              referrerPolicy="no-referrer"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                filter: 'brightness(0.92) contrast(1.04)',
                transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                ...({ viewTransitionName: 'creature-spotlight' } as React.CSSProperties)
              }}
              className="hero-creature-img"
            />
            {/* Ambient vignette */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(8, 10, 14, 0.9) 0%, rgba(8, 10, 14, 0.15) 50%, transparent 100%)',
              pointerEvents: 'none'
            }} />

            {/* Personality Tags Floater (§ 9) */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              {personalityTags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(8, 10, 14, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#F8FAFC',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 600
                  }}
                >
                  {tag}
                </span>
              ))}
              <span className={`badge ${eraClass}`} style={{ fontSize: '0.72rem' }}>
                {creature.era}
              </span>
            </div>
          </div>

          {/* Info Column */}
          <div style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px'
          }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                marginBottom: '4px',
                fontStyle: 'italic'
              }}>
                {creature.scientificName}
              </p>
              <h1 style={{
                fontSize: 'clamp(2rem, 3.6vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '14px',
                letterSpacing: '-0.02em'
              }}>
                {creature.commonName}
              </h1>

              {/* The "Tiny Fact" Highlight Pattern (§ 10) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderLeft: '3px solid var(--accent-primary)',
                padding: '12px 16px',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px'
                }}>
                  A tiny fact
                </div>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.94rem',
                  lineHeight: 1.55,
                  margin: 0
                }}>
                  {tinyFact}
                </p>
              </div>

              {/* Simplified Stat Chips */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '2px' }}>
                    <Ruler size={12} />
                    <span>LENGTH</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {formatCreatureLength(creature.stats?.lengthMeters, true)}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '2px' }}>
                    <Scale size={12} />
                    <span>WEIGHT</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {formatCreatureWeight(creature.stats?.weightKg, true)}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '2px' }}>
                    <ShieldAlert size={12} style={{ color: '#F87171' }} />
                    <span>THREAT</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F87171' }}>
                    {creature.stats?.dangerLevel || 5} / 10
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar: Verb-First "Meet it" and "Surprise me" (§ 7, § 44) */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => onSelectCreature(creature)}
                id="btn-meet-creature"
                style={{
                  fontSize: '0.92rem',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-button)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Meet it</span>
                <ArrowRight size={17} />
              </button>

              {onSurpriseMe && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onSurpriseMe}
                  style={{
                    fontSize: '0.85rem',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-button)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Discover another creature (Space)"
                >
                  <Shuffle size={14} />
                  <span>Surprise me</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

