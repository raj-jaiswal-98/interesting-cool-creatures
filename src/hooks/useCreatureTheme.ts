import { useState, useEffect } from 'react';
import { themeEngine } from '../services/theme/themeEngine';
import { chromeAI } from '../services/ai/chromeAIService';
import type { Creature, ThemePalette } from '../types/creature';
import type { VisualImageAnalysis } from '../types/ai';

export interface UseCreatureThemeResult {
  palette: ThemePalette;
  visualAnalysis: VisualImageAnalysis | null;
  isAnalyzing: boolean;
}

export function useCreatureTheme(creature: Creature | null | undefined): UseCreatureThemeResult {
  const [palette, setPalette] = useState<ThemePalette>(themeEngine.currentPalette);
  const [visualAnalysis, setVisualAnalysis] = useState<VisualImageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    if (!creature) return;

    let isMounted = true;
    setIsAnalyzing(true);

    themeEngine.applyCreatureTheme(creature.photoUrl, creature.themePalette).then((applied) => {
      if (isMounted) setPalette(applied);
    });

    if (creature.photoUrl) {
      chromeAI
        .analyzeImageVisuals(creature.photoUrl)
        .then((analysis) => {
          if (isMounted) {
            setVisualAnalysis(analysis);
            setIsAnalyzing(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsAnalyzing(false);
        });
    } else {
      setIsAnalyzing(false);
    }

    return () => {
      isMounted = false;
    };
  }, [creature?.id, creature?.photoUrl]);

  return {
    palette,
    visualAnalysis,
    isAnalyzing
  };
}
