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
  Compass,
  Layers,
  BookOpen,
  FileText
} from 'lucide-react';
import { chromeAI } from '../../services/ai/chromeAIService';
import { creatureResolver } from '../../services/resolver/creatureResolver';
import { getSimplifiedDossier } from '../../utils/creatureSimplifier';
import {
  getCreatureFamilySummary,
  getCreatureHumanScale,
  getCreaturePersonalityTags
} from '../../utils/personality';
import {
  formatCreatureLength,
  formatCreatureWeight,
  formatDangerLevel,
  formatExtinctionYear
} from '../../utils/formatters';
import type { Creature } from '../../types/creature';
import type { NormalizedCreature } from '../../types/normalizedCreature';
import type { TaxonomyTranslation } from '../../types/ai';

interface OverviewTabProps {
  creature: Creature;
  onSwitchTab?: (tab: 'map' | 'evolution' | 'clash') => void;
}

export function OverviewTab({ creature }: OverviewTabProps) {
  const [aiSummary, setAiSummary] = useState<TaxonomyTranslation | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [normalized, setNormalized] = useState<NormalizedCreature | null>(null);
  const [storyMode, setStoryMode] = useState<'story' | 'science' | 'ai'>('story');
  const [activeCuriousPrompt, setActiveCuriousPrompt] = useState<string | null>(null);
  const [curiousAnswer, setCuriousAnswer] = useState<string | null>(null);
  const [isLoadingCurious, setIsLoadingCurious] = useState(false);

  const dossier = getSimplifiedDossier(creature);
  const humanScale = getCreatureHumanScale(creature);
  const personalityTags = getCreaturePersonalityTags(creature);
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

  const handleCuriousPrompt = async (promptQuestion: string) => {
    setActiveCuriousPrompt(promptQuestion);
    setIsLoadingCurious(true);
    setCuriousAnswer(null);
    try {
      const res = await chromeAI.prompt(
        `In 2 short, fun, plain-English sentences for a curious museum visitor, answer: "${promptQuestion}" for the creature ${creature.commonName} (${creature.scientificName}, ${creature.description}).`
      );
      setCuriousAnswer(res);
    } catch {
      if (promptQuestion.toLowerCase().includes('weird')) {
        setCuriousAnswer(dossier.funFact || `${creature.commonName} has strange evolutionary adaptations suited for life in ${creature.habitat}.`);
      } else if (promptQuestion.toLowerCase().includes('survive')) {
        setCuriousAnswer(`It feeds on ${creature.diet.toLowerCase()} and relies on its standout adaptation: ${dossier.superpower.toLowerCase()}.`);
      } else {
        setCuriousAnswer(`${dossier.superpower}. It thrived in the ${creature.era} era!`);
      }
    } finally {
      setIsLoadingCurious(false);
    }
  };

  const handleSimplifyWithAI = async () => {
    setIsLoadingAI(true);
    try {
      const result = await chromeAI.translateTaxonomy(creature.description, creature.commonName);
      setAiSummary(result);
      setStoryMode('ai');
    } catch (err) {
      console.warn('AI summary failed:', err);
      setStoryMode('ai');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSelectMode = (mode: 'story' | 'science' | 'ai') => {
    setStoryMode(mode);
    if (mode === 'ai' && !aiSummary && !isLoadingAI) {
      handleSimplifyWithAI();
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
        gridTemplateColumns: 'minmax(280px, 330px) 1fr',
        gap: '24px',
        alignItems: 'start'
      }}
      className="modal-two-columns"
    >
      {/* ========================================================
          COLUMN 1 (LEFT): CINEMATIC SPECIMEN PLAQUE & SCALE
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: '#090A0D',
          border: '1.5px solid var(--brutalist-border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        {/* Specimen Photograph Frame */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '260px',
            borderRadius: '12px',
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
              objectFit: 'cover',
              transition: 'transform 0.4s ease'
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
                borderRadius: 'var(--radius-button)',
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
                borderRadius: 'var(--radius-button)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {isExtant ? 'LIVING SPECIES' : `EXTINCT • ${formatExtinctionYear(creature.extinctionYear, true)}`}
            </span>
          </div>

          {/* Bottom Floating Personality Chips */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              zIndex: 2
            }}
          >
            {personalityTags.map((tag, idx) => (
              <span
                key={idx}
                className="personality-tag"
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  background: 'rgba(5, 11, 16, 0.85)',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Specimen Vitals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Threat Rating Bar */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <ShieldAlert size={13} style={{ color: formatDangerLevel(creature.stats?.dangerLevel).color }} />
                <span>THREAT: {formatDangerLevel(creature.stats?.dangerLevel).label.toUpperCase()}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 800, color: formatDangerLevel(creature.stats?.dangerLevel).color }}>
                {creature.stats?.dangerLevel || 5} / 10
              </span>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${((creature.stats?.dangerLevel || 5) / 10) * 100}%`,
                  height: '100%',
                  background: formatDangerLevel(creature.stats?.dangerLevel).color,
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>

          {/* Rarity & Observation Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="brutalist-data-chip" style={{ padding: '8px 10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Award size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>RARITY SCORE</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {creature.stats?.rarityScore || 90}/100
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px 10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Compass size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>SIGHTINGS</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {creature.coordinates?.length || 1} Sites
              </span>
            </div>
          </div>

          {/* Human Scale Comparison Bar */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span>{humanScale.icon}</span>
                <span>HUMAN SCALE</span>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {humanScale.label}
              </span>
            </div>

            {/* Proportional visual bar */}
            <div style={{
              position: 'relative',
              height: '18px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              margin: '8px 0 6px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div
                style={{
                  width: `${Math.round(humanScale.visualRatio * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.25) 0%, var(--accent-primary) 100%)',
                  borderRadius: '5px',
                  transition: 'width 0.4s ease'
                }}
              />
              <div style={{
                position: 'absolute',
                left: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#FFFFFF',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}>
                <span>🧍 1.8m Human</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {humanScale.subtext}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          COLUMN 2 (RIGHT): STORY-FIRST PLAQUE & EXPLORATION
          ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Title & Humanized Lineage */}
        <div>
          <h3
            style={{
              fontSize: '1.65rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 4px'
            }}
          >
            {creature.commonName}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
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
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Class {creature.taxonomy.class}
              </span>
            )}
          </div>

          <div style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            display: 'inline-block'
          }}>
            {getCreatureFamilySummary(creature)}
          </div>
        </div>

        {/* Story-First Museum Plaque with Mode Switcher */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: storyMode === 'story'
              ? '1.5px solid var(--accent-primary)'
              : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
            transition: 'border-color 0.2s ease',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Plaque Header & Mode Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                letterSpacing: '0.04em'
              }}>
                {storyMode === 'story'
                  ? '✨ Field Dossier (Plain English)'
                  : storyMode === 'science'
                  ? '🔬 Original Scientific Text'
                  : '🤖 AI Synthesized Plaque'}
              </span>
            </div>

            {/* Mode Selector Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleSelectMode('story')}
                className={`btn-subtle-brutalist ${storyMode === 'story' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-button)' }}
                title="Read accessible field dossier"
              >
                <BookOpen size={11} />
                <span>Story</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('science')}
                className={`btn-subtle-brutalist ${storyMode === 'science' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-button)' }}
                title="View original academic taxonomy"
              >
                <FileText size={11} />
                <span>Science</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('ai')}
                disabled={isLoadingAI}
                className={`btn-subtle-brutalist ${storyMode === 'ai' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-button)' }}
                title="Generate fresh on-device museum plaque"
              >
                {isLoadingAI ? <Loader2 size={11} className="animate-spin-slow" /> : <Bot size={11} />}
                <span>{isLoadingAI ? 'Thinking...' : 'AI Plaque'}</span>
              </button>
            </div>
          </div>

          {/* Plaque Body */}
          {storyMode === 'story' ? (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.55, color: '#F1F5F9' }}>
              {/* Bold Headline Quote */}
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--accent-primary)',
                marginBottom: '10px',
                lineHeight: 1.4,
                fontStyle: 'italic'
              }}>
                "{dossier.headline}"
              </div>

              {/* Story Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚡</span>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Superpower: </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{dossier.superpower}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>💡</span>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Did you know? </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{dossier.funFact}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>📏</span>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Real scale: </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{dossier.sizeComparison}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : storyMode === 'science' ? (
            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0 0 8px' }}>{creature.description}</p>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Source: Primary biological record & peer-reviewed paleontology archives.
              </span>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.55, color: '#F1F5F9' }}>
              {aiSummary ? (
                <>
                  <p style={{ margin: '0 0 8px', fontStyle: 'italic' }}>"{aiSummary.text}"</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    ✓ {aiSummary.isNativeAI ? 'Generated on-device via Gemini Nano' : 'Synthesized via Natural Science Communicator'}
                  </span>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', padding: '10px 0' }}>
                  <Loader2 size={16} className="animate-spin-slow" />
                  <span>Synthesizing concise museum plaque on-device...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive "Curious?" Pill Dock */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-card)',
          padding: '14px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.95rem' }}>✨</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Curious?
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click to ask on-device AI
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: '🤔 Why is it weird?', q: 'Why is this creature weird or unusual?' },
              { label: '🛡️ How does it survive?', q: 'How does it survive and find food?' },
              { label: "👀 What's its strangest trick?", q: "What is its single strangest defense or biological trick?" }
            ].map((chip, idx) => {
              const isActive = activeCuriousPrompt === chip.q;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCuriousPrompt(chip.q)}
                  disabled={isLoadingCurious}
                  className="btn-subtle-brutalist"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-button)',
                    background: isActive ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {(isLoadingCurious || curiousAnswer) && (
            <div style={{
              marginTop: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.22)',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              color: 'var(--text-primary)'
            }}>
              {isLoadingCurious ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                  <Loader2 size={14} className="animate-spin-slow" />
                  <span>Consulting on-device AI...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', lineHeight: 1 }}>💬</span>
                  <div style={{ color: '#F1F5F9' }}>{curiousAnswer}</div>
                </div>
              )}
            </div>
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
            <div className="brutalist-data-chip" style={{ padding: '8px 10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Ruler size={11} />
                <span>LENGTH / SIZE</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCreatureLength(creature.stats?.lengthMeters, false)}
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px 10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
                <Scale size={11} />
                <span>WEIGHT / MASS</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCreatureWeight(creature.stats?.weightKg, false)}
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px 10px', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>TROPHIC DIET</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {creature.diet || 'Fauna'}
              </span>
            </div>

            <div className="brutalist-data-chip" style={{ padding: '8px 10px', borderRadius: '8px' }}>
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

        {/* Taxonomic Hierarchy - Progressive Disclosure */}
        {creature.taxonomy && (
          <details
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 14px'
            }}
          >
            <summary style={{
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              outline: 'none',
              userSelect: 'none'
            }}>
              ▸ Detailed Scientific Taxonomy (Darwin Core)
            </summary>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '6px',
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
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
          </details>
        )}

        {/* Data Provenance & Scientific Links */}
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
                  style={{ textDecoration: 'none', padding: '3px 8px', fontSize: '0.68rem', borderRadius: 'var(--radius-button)' }}
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
              style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-button)' }}
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

