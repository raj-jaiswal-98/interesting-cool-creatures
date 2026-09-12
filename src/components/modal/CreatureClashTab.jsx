import React, { useState } from 'react';
import { Swords, Trophy, Loader2, Shield, Flame, Scale, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { chromeAI } from '../../services/ai/chromeAIService';
import { CREATURE_CATALOG } from '../../data/creatureCatalog';

export function CreatureClashTab({ creature }) {
  // Filter out the active creature so it cannot fight itself
  const opponents = CREATURE_CATALOG.filter((c) => c.id !== creature.id);
  const [selectedOpponentId, setSelectedOpponentId] = useState(opponents[0]?.id);
  const [isFighting, setIsFighting] = useState(false);
  const [duelResult, setDuelResult] = useState(null);

  const opponent = opponents.find((c) => c.id === selectedOpponentId) || opponents[0];

  const handleFight = async () => {
    if (!opponent) return;
    setIsFighting(true);
    try {
      const result = await chromeAI.simulateCreatureClash(creature, opponent);
      setDuelResult(result);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // no-op
      }
    } catch (err) {
      console.warn('Duel failed:', err);
    } finally {
      setIsFighting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tab Header */}
      <div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Swords size={20} style={{ color: '#F87171' }} />
          <span>Creature Clash: Ecological Arena</span>
        </h4>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Pit {creature.commonName} against any other apex organism across Earth's history. The duel engine simulates physical mass, biome advantages, and predatory weaponry.
        </p>
      </div>

      {/* Opponent Selection Dropdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)'
      }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          Select Contender:
        </label>
        <select
          value={selectedOpponentId}
          onChange={(e) => {
            setSelectedOpponentId(e.target.value);
            setDuelResult(null);
          }}
          style={{
            flex: 1,
            background: '#0B1622',
            border: '1px solid var(--border-subtle)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-display)',
            outline: 'none',
            cursor: 'pointer'
          }}
          id="select-clash-opponent"
        >
          {opponents.map((opp) => (
            <option key={opp.id} value={opp.id}>
              {opp.commonName} ({opp.era} Era — {opp.habitat})
            </option>
          ))}
        </select>
      </div>

      {/* Head to Head Visual Matchup Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Fighter 1 (Current Creature) */}
        <div style={{
          background: 'rgba(0, 240, 255, 0.05)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img
            src={creature.photoUrl}
            alt={creature.commonName}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
          />
          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{creature.commonName}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{creature.era} Era</span>
          <div style={{ fontSize: '0.8rem', color: '#F87171', fontWeight: 700 }}>
            Threat: {creature.stats?.dangerLevel || 5}/10
          </div>
        </div>

        {/* VS Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.2rem',
            fontWeight: 900,
            color: '#F87171',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '8px 12px',
            borderRadius: '50%',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            VS
          </span>
        </div>

        {/* Fighter 2 (Challenger) */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img
            src={opponent.photoUrl}
            alt={opponent.commonName}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #F87171' }}
          />
          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{opponent.commonName}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opponent.era} Era</span>
          <div style={{ fontSize: '0.8rem', color: '#F87171', fontWeight: 700 }}>
            Threat: {opponent.stats?.dangerLevel || 5}/10
          </div>
        </div>
      </div>

      {/* Fight Trigger Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleFight}
          disabled={isFighting}
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
            color: '#FFFFFF',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            padding: '12px 28px'
          }}
          id="btn-run-clash"
        >
          {isFighting ? (
            <>
              <Loader2 size={18} className="animate-spin-slow" />
              <span>Simulating Biological Encounter...</span>
            </>
          ) : (
            <>
              <Swords size={18} />
              <span>Initiate Ecological Clash</span>
            </>
          )}
        </button>
      </div>

      {/* Duel Outcome Card */}
      {duelResult && (
        <div style={{
          background: 'rgba(5, 11, 16, 0.95)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          {/* Winner Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={24} style={{ color: '#F59E0B' }} />
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#F59E0B', letterSpacing: '0.05em' }}>
                  DECISIVE VICTOR
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  {duelResult.winner}
                </h3>
              </div>
            </div>

            <div style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#F59E0B'
            }}>
              {duelResult.winProbability}% Win Rate
            </div>
          </div>

          {/* Combat Log */}
          <div>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Simulated Combat Log:
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {duelResult.combatLog.map((logEntry, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderLeft: '3px solid #F87171',
                    padding: '10px 14px',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)'
                  }}
                >
                  {logEntry}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
            {duelResult.conclusion}
          </p>
        </div>
      )}
    </div>
  );
}
