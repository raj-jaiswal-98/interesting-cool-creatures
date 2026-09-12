import { proceduralAI } from './proceduralSpeculationEngine.js';

/**
 * ChromeAIService provides a unified interface for Chrome Built-in Prompt API (Gemini Nano)
 * with transparent fallback to ProceduralSpeculationEngine when native on-device AI is absent.
 */
class ChromeAIService {
  constructor() {
    this.session = null;
    this.availabilityStatus = null;
    this.fallbackEngine = proceduralAI;
  }

  /**
   * Checks whether Chrome Built-in AI is accessible on this machine/browser.
   * @returns {Promise<'readily' | 'after-download' | 'unavailable'>}
   */
  async checkAvailability() {
    if (typeof window === 'undefined') return 'unavailable';

    try {
      if (window.ai && window.ai.languageModel) {
        if (typeof window.ai.languageModel.availability === 'function') {
          this.availabilityStatus = await window.ai.languageModel.availability();
          return this.availabilityStatus;
        }
        if (typeof window.ai.languageModel.capabilities === 'function') {
          const caps = await window.ai.languageModel.capabilities();
          this.availabilityStatus = caps.available;
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

  /**
   * Initializes or gets the active Gemini Nano prompt session.
   */
  async initSession(mode = 'creative') {
    const status = await this.checkAvailability();
    if (status !== 'readily' && status !== 'after-download') {
      return null;
    }

    try {
      if (!this.session) {
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

  /**
   * Translates dense academic taxonomy into engaging prose.
   */
  async translateTaxonomy(academicText, creatureName) {
    try {
      const session = await this.initSession('precise');
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

    // Procedural fallback
    return {
      text: this.fallbackEngine.translateTaxonomy(academicText, creatureName),
      isNativeAI: false
    };
  }

  /**
   * Generates speculative future evolutionary adaptations under environmental stressors.
   */
  async generateSpeculativeEvolution(creatureName, habitat, stressorKey = 'warming') {
    try {
      const session = await this.initSession('creative');
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

  /**
   * Simulates an evolutionary combat clash between two organisms.
   */
  async simulateCreatureClash(creatureA, creatureB) {
    try {
      const session = await this.initSession('creative');
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
          combatLog: logText.split('\n').filter(line => line.trim().length > 0),
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
  destroySession() {
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
