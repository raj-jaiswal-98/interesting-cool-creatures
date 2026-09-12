import React, { useState } from 'react';
import { Dna, Sparkles, Loader2, AlertCircle, ShieldCheck, ThermometerSun, Wind, Sun, Building2 } from 'lucide-react';
import { chromeAI } from '../../services/ai/chromeAIService';

const STRESSORS = [
  {
    id: 'warming',
    label: '+4°C Global Warming',
    icon: ThermometerSun,
    desc: 'Rapid thermal climb, acidified oceans, and tropical expansion.'
  },
  {
    id: 'hypoxia',
    label: 'Oxygen Depletion (Hypoxia)',
    icon: Wind,
    desc: 'Drop in benthic dissolved O2 and high altitude air density.'
  },
  {
    id: 'radiation',
    label: 'Elevated Solar UV',
    icon: Sun,
    desc: 'Ozone thinning resulting in intense ionizing ultraviolet exposure.'
  },
  {
    id: 'urban',
    label: 'Synthetic Urban Encroachment',
    icon: Building2,
    desc: 'Dense microplastic runoff, concrete canyons, and electromagnetic noise.'
  }
];

export function FutureAdaptationTab({ creature }) {
  const [selectedStressor, setSelectedStressor] = useState('warming');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const result = await chromeAI.generateSpeculativeEvolution(
        creature.commonName,
        creature.habitat,
        selectedStressor
      );
      setSimulationResult(result);
    } catch (err) {
      console.warn('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Intro Header */}
      <div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Dna size={20} style={{ color: 'var(--accent-primary)' }} />
          <span>Speculative Evolutionary Laboratory (Chrome AI)</span>
        </h4>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Select an environmental stressor and utilize Chrome's on-device AI model to extrapolate this creature's physiological mutations 10,000+ years into the future.
        </p>
      </div>

      {/* Stressor Selector Grid */}
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>
          Choose Environmental Disruption Scenario:
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {STRESSORS.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedStressor === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedStressor(s.id)}
                style={{
                  background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                id={`stressor-${s.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Icon size={16} style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                  <strong style={{ fontSize: '0.88rem', color: isSelected ? '#FFFFFF' : 'var(--text-primary)' }}>
                    {s.label}
                  </strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trigger Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="btn btn-primary"
          style={{ padding: '12px 28px', fontSize: '1rem' }}
          id="btn-run-simulation"
        >
          {isSimulating ? (
            <>
              <Loader2 size={18} className="animate-spin-slow" />
              <span>Synthesizing Evolutionary Trajectory...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Simulate 10,000-Year Adaptation</span>
            </>
          )}
        </button>
      </div>

      {/* Simulation Results Display */}
      {simulationResult && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(13, 27, 36, 0.9) 0%, rgba(5, 11, 16, 0.95) 100%)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: '0 0 30px -10px var(--bg-glow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Header of Result */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                HYPOTHETICAL DESCENDANT MORPH
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>
                {simulationResult.futureScientificName}
              </h3>
            </div>

            {/* Survival Probability Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px'
            }}>
              <ShieldCheck size={16} style={{ color: '#34D399' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34D399' }}>
                {simulationResult.survivalRating}% Survival Viability
              </span>
            </div>
          </div>

          {/* AI Narrative */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderLeft: '3px solid var(--accent-primary)',
            padding: '14px 18px',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
          }}>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--text-primary)', margin: 0 }}>
              {simulationResult.narrative}
            </p>
          </div>

          {/* Adaptations List */}
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
              Identified Evolutionary Adaptations:
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {simulationResult.adaptations.map((adapt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '4px' }}>
                    • {adapt.title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {adapt.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engine indicator footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '12px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: simulationResult.isNativeAI ? '#10B981' : '#38BDF8'
            }} />
            <span>
              {simulationResult.isNativeAI
                ? 'Computed on-device with Gemini Nano Prompt API'
                : 'Computed via Deterministic Procedural Speciation Engine'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
