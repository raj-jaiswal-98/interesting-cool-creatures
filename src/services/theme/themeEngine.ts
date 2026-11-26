import ColorThief from 'colorthief';
import type { ThemePalette } from '../../types/creature';

export interface BrutalistThemeOption {
  id: string;
  name: string;
  icon: string;
  primary: string;
  darkMuted: string;
  glow: string;
  textAccent: string;
  surface: string;
}

export const BRUTALIST_THEMES: Record<string, BrutalistThemeOption> = {
  ember: {
    id: 'ember',
    name: 'Ember',
    icon: '🟠',
    primary: '#FC4109',
    darkMuted: '#2A1610',
    glow: 'rgba(252, 65, 9, 0.16)',
    textAccent: '#FF7A4D',
    surface: '#2A2728'
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    icon: '🟢',
    primary: '#69B488',
    darkMuted: '#16241B',
    glow: 'rgba(105, 180, 136, 0.16)',
    textAccent: '#93CFA9',
    surface: '#2A2728'
  },
  lilac: {
    id: 'lilac',
    name: 'Lilac',
    icon: '🟣',
    primary: '#CB9CF8',
    darkMuted: '#231B2B',
    glow: 'rgba(203, 156, 248, 0.16)',
    textAccent: '#DEBFFB',
    surface: '#2A2728'
  },
  mustard: {
    id: 'mustard',
    name: 'Mustard',
    icon: '🟡',
    primary: '#F8D867',
    darkMuted: '#2A2412',
    glow: 'rgba(248, 216, 103, 0.14)',
    textAccent: '#FBE597',
    surface: '#2A2728'
  }
};

/**
 * ThemeEngine manages non-blue Neo-Brutalist color palettes,
 * computes harmonious contrast hexes, and dynamically updates CSS custom properties on :root.
 */
class ThemeEngine {
  defaultPalette: ThemePalette;
  currentPalette: ThemePalette;
  activeThemeId: string;

  constructor() {
    this.activeThemeId = 'ember';
    this.defaultPalette = {
      primary: BRUTALIST_THEMES.ember.primary,
      darkMuted: BRUTALIST_THEMES.ember.darkMuted,
      glow: BRUTALIST_THEMES.ember.glow,
      textAccent: BRUTALIST_THEMES.ember.textAccent,
      surface: BRUTALIST_THEMES.ember.surface
    };
    this.currentPalette = { ...this.defaultPalette };
  }

  /**
   * Helper to convert RGB to Hex string
   */
  rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Lightens or darkens a hex color by a percentage factor (-1.0 to 1.0)
   */
  adjustBrightness(hex: string, factor: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * factor)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(255 * factor)));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(255 * factor)));
    return this.rgbToHex(r, g, b);
  }

  /**
   * Sets CSS variables on document.documentElement
   */
  injectVariables(palette: ThemePalette): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', palette.primary);
    root.style.setProperty('--accent-dark', palette.darkMuted);
    root.style.setProperty('--bg-glow', palette.glow);
    root.style.setProperty('--text-accent', palette.textAccent);
    root.style.setProperty('--surface-card', palette.surface);
    this.currentPalette = palette;
  }

  /**
   * Switches the active neo-brutalist theme across the application.
   */
  applyBrutalistTheme(themeId: string): ThemePalette {
    const theme = BRUTALIST_THEMES[themeId] || BRUTALIST_THEMES.ember;
    this.activeThemeId = theme.id;
    const palette: ThemePalette = {
      primary: theme.primary,
      darkMuted: theme.darkMuted,
      glow: theme.glow,
      textAccent: theme.textAccent,
      surface: theme.surface
    };
    this.injectVariables(palette);
    try {
      localStorage.setItem('icc_brutalist_theme', theme.id);
    } catch {
      // storage disabled
    }
    return palette;
  }

  /**
   * Applies pre-calculated or extracted creature palette without allowing blue overrides.
   */
  async applyCreatureTheme(imageUrl?: string | null, fallbackPalette?: ThemePalette): Promise<ThemePalette> {
    // If a non-blue brutalist theme is already chosen, maintain the chosen brutalist accent
    const savedTheme = BRUTALIST_THEMES[this.activeThemeId] || BRUTALIST_THEMES.ember;

    if (fallbackPalette) {
      // Check if fallbackPalette is blue/cyan (e.g. #00D2FF or #00F0FF)
      const isBlue =
        fallbackPalette.primary.toLowerCase().includes('00d2ff') ||
        fallbackPalette.primary.toLowerCase().includes('00f0ff') ||
        fallbackPalette.primary.toLowerCase().includes('00d') ||
        fallbackPalette.primary.toLowerCase().includes('38bdf8');

      const sanitized: ThemePalette = isBlue
        ? {
            primary: savedTheme.primary,
            darkMuted: savedTheme.darkMuted,
            glow: savedTheme.glow,
            textAccent: savedTheme.textAccent,
            surface: savedTheme.surface
          }
        : fallbackPalette;

      this.injectVariables(sanitized);
      return sanitized;
    }

    if (!imageUrl || typeof window === 'undefined') {
      return this.currentPalette;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        if (img.complete) return resolve();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load for theme extraction'));
      });

      const colorThief = new ColorThief();
      const dominant = colorThief.getColor(img);
      const palette = colorThief.getPalette(img, 4);

      // If dominant is heavily blue (B > R * 1.3 && B > G), override with chosen brutalist accent
      const [r, g, b] = dominant;
      const isHeavilyBlue = b > 140 && b > r * 1.2 && b > g * 1.1;

      const primaryHex = isHeavilyBlue ? savedTheme.primary : this.rgbToHex(r, g, b);
      const darkTriplet = palette && palette[1] ? palette[1] : [32, 30, 31];
      const darkHex = this.rgbToHex(
        Math.min(darkTriplet[0], 25),
        Math.min(darkTriplet[1], 25),
        Math.min(darkTriplet[2], 25)
      );

      const textAccentHex = isHeavilyBlue ? savedTheme.textAccent : this.adjustBrightness(primaryHex, 0.35);
      const glowRgba = isHeavilyBlue ? savedTheme.glow : `rgba(${r}, ${g}, ${b}, 0.22)`;
      const surfaceRgba = '#2A2728';

      const newTheme: ThemePalette = {
        primary: primaryHex,
        darkMuted: darkHex,
        glow: glowRgba,
        textAccent: textAccentHex,
        surface: surfaceRgba
      };

      this.injectVariables(newTheme);
      return newTheme;
    } catch {
      this.injectVariables(this.defaultPalette);
      return this.defaultPalette;
    }
  }

  /**
   * Reverts CSS variables to baseline default theme
   */
  resetToDefault(): void {
    this.injectVariables(this.defaultPalette);
  }
}

export const themeEngine = new ThemeEngine();
