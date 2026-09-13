import { proceduralAI } from './proceduralSpeculationEngine';
import type {
  SpeculativeEvolutionResult,
  TaxonomyTranslation,
  CreatureClashResult,
  AIAvailabilityStatus,
  StressorKey
} from '../../types/ai';
import type { Creature } from '../../types/creature';
import type { AILanguageModelSession } from '../../types/chrome-ai';

/**
 * Unified interface for Chrome's Built-in Prompt API (Gemini Nano) with
 * transparent fallback to ProceduralSpeculationEngine when native on-device AI is absent.
 */
class ChromeAIService {
  session: AILanguageModelSession | null = null;
  availabilityStatus: AIAvailabilityStatus | null = null;
  fallbackEngine = proceduralAI;

  async checkAvailability(): Promise<AIAvailabilityStatus> {
    if (typeof window === 'undefined') return 'unavailable';

    try {
      const languageModel = window.ai?.languageModel;
      if (languageModel) {
        if (typeof languageModel.availability === 'function') {
          this.availabilityStatus = (await languageModel.availability()) as AIAvailabilityStatus;
          return this.availabilityStatus;
        }
        if (typeof languageModel.capabilities === 'function') {
          const caps = await languageModel.capabilities();
          this.availabilityStatus = caps.available as AIAvailabilityStatus;
          return this.availabilityStatus;
        }
        this.availabilityStatus = 'readily';
        return 'readily';
      }
    } catch (e) {
      console.warn('Chrome AI availability check failed:', e);
    }

    this.availabilityStatus = 'unavailable';
    return 'unavailable';
  }

  async initSession() {
    const status = await this.checkAvailability();
    if (status !== 'readily' && status !== 'after-download') {
      return null;
    }

    try {
      if (!this.session && window.ai?.languageModel) {
        this.session = await window.ai.languageModel.create({
          systemPrompt: 'You are an expert evolutionary biologist, paleontologist, and science communicator. Give engaging, scientifically rigorous answers in clear concise prose.'
        });
      }
      return this.session;
    } catch (err) {
      console.warn('Failed to instantiate Gemini Nano session, defaulting to procedural engine:', err);
      return null;
    }
  }

  async translateTaxonomy(academicText: string, creatureName: string): Promise<TaxonomyTranslation> {
    try {
      const session = await this.initSession();
      if (session) {
        const prompt = `Rewrite this scientific description of ${creatureName} into a fun, fascinating, 2-sentence summary suitable for a science museum: "${academicText}"`;
        const result = await session.prompt(prompt);
        return {
          text: result.trim(),
          isNativeAI: true
        };
      }
    } catch (err) {
      console.warn('Native AI translation failed:', err);
    }

    return {
      text: this.fallbackEngine.translateTaxonomy(academicText, creatureName),
      isNativeAI: false
    };
  }

  async generateSpeculativeEvolution(
    creatureName: string,
    habitat: string,
    stressorKey: StressorKey = 'warming'
  ): Promise<SpeculativeEvolutionResult> {
    try {
      const session = await this.initSession();
      if (session) {
        const stressorDesc = this.fallbackEngine.stressors[stressorKey] || 'climate instability';
        const prompt = `Imagine ${creatureName}, currently adapted to ${habitat}. Fast forward 10,000 years in the future under extreme ${stressorDesc}.
Respond with:
1) A 2-sentence narrative of its future descendant.
2) Three specific physical evolutionary adaptations.
Keep it scientifically grounded yet imaginative.`;

        const rawResponse = await session.prompt(prompt);
        return {
          futureScientificName: `Neo-${creatureName.replace(/\s+/g, '')} speculatis`,
          narrative: rawResponse,
          stressorApplied: stressorDesc,
          adaptations: [
            { title: 'Gemini Nano Adaptation', description: rawResponse }
          ],
          survivalRating: 88,
          isNativeAI: true
        };
      }
    } catch (err) {
      console.warn('Native AI speculative evolution failed, using procedural simulation:', err);
    }

    return this.fallbackEngine.generateSpeculativeEvolution(creatureName, habitat, stressorKey);
  }

  async simulateCreatureClash(creatureA: Creature, creatureB: Creature): Promise<CreatureClashResult> {
    try {
      const session = await this.initSession();
      if (session) {
        const prompt = `Simulate a realistic ecological duel between ${creatureA.commonName} (${creatureA.habitat}) and ${creatureB.commonName} (${creatureB.habitat}).
Briefly describe:
- Round 1: Opening encounter
- Round 2: Clash of traits
- Round 3: Decisive factor
- Declare the winner with estimated win probability percentage.`;

        const logText = await session.prompt(prompt);
        const proceduralOutcome = this.fallbackEngine.simulateCreatureClash(creatureA, creatureB);

        return {
          winner: proceduralOutcome.winner,
          winnerId: proceduralOutcome.winnerId,
          winProbability: proceduralOutcome.winProbability,
          combatLog: logText.split('\n').filter((line: string) => line.trim().length > 0),
          conclusion: `Simulated by Gemini Nano: ${proceduralOutcome.winner} leverages critical biome advantages.`,
          isNativeAI: true
        };
      }
    } catch (err) {
      console.warn('Native AI clash failed:', err);
    }

    return this.fallbackEngine.simulateCreatureClash(creatureA, creatureB);
  }

  /**
   * Destroys active AI session to reclaim memory.
   */
  destroySession(): void {
    if (this.session && typeof this.session.destroy === 'function') {
      try {
        this.session.destroy();
      } catch (e) {
        // no-op
      }
      this.session = null;
    }
  }
}

export const chromeAI = new ChromeAIService();
