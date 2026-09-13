import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Compass, ShieldAlert, Ruler, Scale, ArrowRight } from 'lucide-react';
import { getTimeUntilNextSpotlight } from '../../utils/seedGenerator';
import type { Creature } from '../../types/creature';

interface SpotlightHeroProps {
  creature: Creature | null;
  onSelectCreature: (creature: Creature) => void;
}

export function SpotlightHero({ creature, onSelectCreature }: SpotlightHeroProps) {
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

  return (
    <section className="spotlight-section" style={{ position: 'relative', zIndex: 1, padding: '40px 0 20px' }}>
      <div className="container">
        {/* Top bar with Daily Spotlight indicator & live timer */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: '#050B10',
              boxShadow: '0 0 15px var(--accent-primary)'
            }}>
              <Sparkles size={16} />
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--accent-primary)'
            }}>
              Creature of the Day • Daily Spotlight
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Next in: </span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
            </strong>
          </div>
        </div>

        {/* Hero Card */}
        <div className="glass-panel glow-border" style={{
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '0',
          position: 'relative',
          background: 'linear-gradient(135deg, var(--surface-card) 0%, rgba(10, 20, 30, 0.85) 100%)'
        }}>
          {/* Visual Column */}
          <div style={{
            position: 'relative',
            minHeight: '380px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.6) 100%)'
          }}>
            <img
              src={creature.photoUrl}
              alt={creature.commonName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                filter: 'brightness(0.9) contrast(1.05)',
                transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                // viewTransitionName isn't in React's CSSProperties typings yet
                ...({ viewTransitionName: 'creature-spotlight' } as React.CSSProperties)
              }}
              className="hero-creature-img"
            />
            {/* Ambient vignette */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(5, 11, 16, 0.95) 0%, rgba(5, 11, 16, 0.2) 50%, transparent 100%)',
              pointerEvents: 'none'
            }} />

            {/* Quick Status Floater */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span className={`badge ${eraClass}`}>
                {creature.era} Era
              </span>
              <span className={`badge ${isExtant ? 'badge-extant' : 'badge-extinct'}`}>
                {isExtant ? 'Living Species' : `Extinct (~${Math.abs(creature.extinctionYear!).toLocaleString()} ${creature.extinctionYear! < 0 ? 'BCE' : 'CE'})`}
              </span>
              <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--text-secondary)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <Compass size={12} style={{ marginRight: '4px' }} />
                {creature.habitat}
              </span>
            </div>
          </div>

          {/* Info Column */}
          <div style={{
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '24px'
          }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--accent-primary)',
                letterSpacing: '0.05em',
                marginBottom: '6px'
              }}>
                {creature.scientificName}
              </p>
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}>
                {creature.commonName}
              </h1>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '1.05rem',
                lineHeight: 1.65,
                marginBottom: '24px'
              }}>
                {creature.description}
              </p>

              {/* Stat Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <Ruler size={13} />
                    <span>EST. LENGTH</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {creature.stats?.lengthMeters ? `${creature.stats.lengthMeters} m` : 'Unknown'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <Scale size={13} />
                    <span>EST. WEIGHT</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {creature.stats?.weightKg != null
                      ? creature.stats.weightKg >= 1000
                        ? `${(creature.stats.weightKg / 1000).toFixed(1)} tons`
                        : `${creature.stats.weightKg} kg`
                      : 'Unknown'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <ShieldAlert size={13} style={{ color: '#F87171' }} />
                    <span>THREAT INDEX</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#F87171' }}>
                    {creature.stats?.dangerLevel || 5} / 10
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => onSelectCreature(creature)}
                id="btn-explore-spotlight"
              >
                <span>Deep-Dive Exploration</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
