import React, { useEffect, useRef } from 'react';
import { HabitatParticleEngine } from './HabitatParticleEngine';
import type { HabitatType } from '../../types/creature';

interface HabitatCanvasProps {
  habitat?: HabitatType;
  primaryColor?: string;
  glowColor?: string;
}

export function HabitatCanvas({ habitat = 'marine', primaryColor = '#00F0FF', glowColor = 'rgba(0, 240, 255, 0.25)' }: HabitatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HabitatParticleEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new HabitatParticleEngine(
      canvasRef.current,
      habitat,
      primaryColor,
      glowColor
    );
    engineRef.current = engine;
    engine.start();

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Update habitat / colors when props change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setHabitat(habitat, primaryColor, glowColor);
    }
  }, [habitat, primaryColor, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
}
