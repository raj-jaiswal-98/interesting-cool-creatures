import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  ExternalLink,
  Ruler,
  Scale,
  ShieldAlert,
  Award,
  Loader2,
  MapPin,
  Swords,
  Dna,
  Compass,
  Layers,
  BookOpen
} from 'lucide-react';
import { chromeAI } from '../../services/ai/chromeAIService';
import { creatureResolver } from '../../services/resolver/creatureResolver';
import { getSimplifiedDossier } from '../../utils/creatureSimplifier';
import type { Creature } from '../../types/creature';
import type { NormalizedCreature } from '../../types/normalizedCreature';
import type { TaxonomyTranslation } from '../../types/ai';

interface OverviewTabProps {
  creature: Creature;
  onSwitchTab?: (tab: 'map' | 'evolution' | 'clash') => void;
}

export function OverviewTab({ creature, onSwitchTab }: OverviewTabProps) {
  const [aiSummary, setAiSummary] = useState<TaxonomyTranslation | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [normalized, setNormalized] = useState<NormalizedCreature | null>(null);
  const [isSimplified, setIsSimplified] = useState(false);

  const dossier = getSimplifiedDossier(creature);
  const isExtant = creature.extinctionYear === null;
  const eraClass = `badge-${creature.era.toLowerCase()}`;

  useEffect(() => {
    let isMounted = true;
    creatureResolver.resolve(creature).then((data) => {
      if (isMounted) setNormalized(data);
    });
    return () => {
      isMounted = false;
    };
  }, [creature.id, creature.scientificName]);

  const handleSimplifyWithAI = async () => {
    setIsLoadingAI(true);
    try {
      const result = await chromeAI.translateTaxonomy(creature.description, creature.commonName);
      setAiSummary(result);
      setIsSimplified(true);
    } catch (err) {
      console.warn('AI summary failed:', err);
      setIsSimplified(true);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const threatColor =
    creature.stats?.dangerLevel >= 8
      ? '#FF2E63'
      : creature.stats?.dangerLevel >= 5
      ? '#FFB800'
      : '#00FF66';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: '24px',
        alignItems: 'start'
      }}
      className="modal-two-columns"
    >
      {/* ========================================================
          COLUMN 1 (LEFT): SPECIMEN PHOTOGRAPHY & TELEMETRY
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: '#090A0D',
          border: '1.5px solid var(--brutalist-border)',
          borderRadius: '8px',
          padding: '16px'
        }}
      >
        {/* Specimen Photograph Frame */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1.5px solid rgba(255, 255, 255, 0.16)',
            background: '#040507',
            boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.9), 4px 4px 0px rgba(0,0,0,0.8)'
          }}
        >
          <img
            src={creature.photoUrl}
            alt={creature.commonName}
            referrerPolicy="no-referrer"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Top Floating Badges */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 2
            }}
          >
            <span
              className={`badge ${eraClass}`}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                padding: '3px 8px',
                borderRadius: '3px',
                borderWidth: '1.5px'
              }}
            >
              {creature.era}
            </span>

            <span
              className={`badge ${isExtant ? 'badge-extant' : 'badge-extinct'}`}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                padding: '3px 8px',
                borderRadius: '3px',
                backdropFilter: 'blur(8px)'
              }}
            >
              {isExtant ? 'LIVING SPECIES' : 'EXTINCT'}
            </span>
          </div>

          {/* Bottom Bar Reference */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 2
            }}
          >
            <span
              style={{
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--text-secondary)'
              }}
            >
              SPECIMEN #{creature.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Specimen Vitals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Threat Rating Bar */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              padding: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <ShieldAlert size={13} style={{ color: threatColor }} />
                <span>THREAT RATING</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 800, color: threatColor }}>
                {creature.stats?.dangerLevel || 5} / 10
              </span>
            </div>
            {/* Visual Danger Gauge */}
            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${((creature.stats?.dangerLevel || 5) / 10) * 100}%`,
                  height: '100%',
                  background: threatColor,
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>

          {/* Rarity & Habitat Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="brutalist-data-chip" style={{ padding: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Award size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>RARITY SCORE</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {creature.stats?.rarityScore || 90}/100
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Compass size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>OBSERVATIONS</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {creature.coordinates?.length || 1} Sites
              </span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Action Buttons (Icons with Label Text) */}
        {onSwitchTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => onSwitchTab('map')}
              className="btn-subtle-brutalist"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              <MapPin size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>Explore Occurrence Map</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab('clash')}
              className="btn-subtle-brutalist"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              <Swords size={13} style={{ color: '#FFB800' }} />
              <span>Launch Creature Clash</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab('evolution')}
              className="btn-subtle-brutalist"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              <Dna size={13} style={{ color: '#A855F7' }} />
              <span>Predict Future Adaptation</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          COLUMN 2 (RIGHT): USEFUL SCIENTIFIC INFORMATION
          ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Title & Classification */}
        <div>
          <h3
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 4px'
            }}
          >
            {creature.commonName}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.95rem',
                fontStyle: 'italic',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {creature.scientificName}
            </span>

            {creature.taxonomy.class && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Class {creature.taxonomy.class}
              </span>
            )}
          </div>
        </div>

        {/* AI & Plain-English Communicator Banner with Subtle Action Button */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: isSimplified ? '1.5px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '14px',
            transition: 'border-color 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                {isSimplified ? '⚡ SIMPLIFIED COMMUNICATOR (PLAIN ENGLISH)' : '🔬 SCIENTIFIC INTELLIGENCE'}
              </span>
            </div>

            {/* Subtle Button (Icon with Label Text) */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsSimplified(!isSimplified)}
                className={`btn-subtle-brutalist ${isSimplified ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                title="Toggle plain-English breakdown"
              >
                {isSimplified ? <BookOpen size={11} /> : <Sparkles size={11} />}
                <span>{isSimplified ? 'Scientific' : 'Simplify'}</span>
              </button>

              <button
                type="button"
                onClick={handleSimplifyWithAI}
                disabled={isLoadingAI}
                className="btn-subtle-brutalist"
                style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                title="Run Gemini Nano on-device AI translation"
              >
                {isLoadingAI ? <Loader2 size={11} className="animate-spin-slow" /> : <Bot size={11} />}
                <span>{isLoadingAI ? 'Processing...' : 'AI Translate'}</span>
              </button>
            </div>
          </div>

          {/* Description Content */}
          {aiSummary ? (
            <div style={{ fontSize: '0.88rem', lineHeight: 1.55, color: '#F1F5F9' }}>
              <p style={{ margin: '0 0 6px' }}>"{aiSummary.text}"</p>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                ✓ {aiSummary.isNativeAI ? 'Generated on-device via Gemini Nano' : 'Synthesized via Natural Science Communicator'}
              </span>
            </div>
          ) : isSimplified ? (
            <div style={{ fontSize: '0.86rem', lineHeight: 1.5, color: '#F1F5F9' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-accent)', marginBottom: '4px' }}>
                {dossier.headline}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div>
                  <strong style={{ color: '#F8FAFC' }}>Superpower: </strong>
                  {dossier.superpower}
                </div>
                <div>
                  <strong style={{ color: '#F8FAFC' }}>Did you know? </strong>
                  {dossier.funFact}
                </div>
                <div>
                  <strong style={{ color: '#F8FAFC' }}>Size Scale: </strong>
                  {dossier.sizeComparison}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              {creature.description}
            </p>
          )}
        </div>

        {/* Biological Metrics Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Layers size={13} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              MORPHOMETRICS & ATTRIBUTES
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}
          >
            <div className="brutalist-data-chip" style={{ padding: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Ruler size={11} />
                <span>LENGTH / SIZE</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {creature.stats?.lengthMeters ? `${creature.stats.lengthMeters} m` : 'Variable'}
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Scale size={11} />
                <span>WEIGHT / MASS</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {creature.stats?.weightKg != null
                  ? creature.stats.weightKg >= 1000
                    ? `${(creature.stats.weightKg / 1000).toFixed(1)} tons`
                    : `${creature.stats.weightKg} kg`
                  : '< 1 g'}
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>TROPHIC DIET</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {creature.diet || 'Fauna'}
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>PRIMARY BIOME</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  fontWeight: 800,
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
        </div>

        {/* Taxonomic Hierarchy */}
        {creature.taxonomy && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                TAXONOMIC LINEAGE
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '10px 12px'
              }}
            >
              {Object.entries(creature.taxonomy).map(([rank, name]) => (
                <div key={rank}>
                  <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {rank}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Provenance & Scientific Links (Icons with Label Text) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--brutalist-border)',
            paddingTop: '12px',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {normalized && normalized.sources.length > 0 ? (
              normalized.sources.slice(0, 3).map((src, i) => (
                <a
                  key={i}
                  href={src.recordUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-subtle-brutalist"
                  style={{ textDecoration: 'none', padding: '3px 8px', fontSize: '0.68rem' }}
                >
                  <ExternalLink size={10} style={{ color: 'var(--accent-primary)' }} />
                  <span>{src.provider} Record</span>
                </a>
              ))
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Darwin Core Standard • Georeferenced Specimen
              </span>
            )}
          </div>

          {creature.wikiUrl && (
            <a
              href={creature.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-subtle-brutalist"
              style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <ExternalLink size={11} />
              <span>Wikipedia</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
