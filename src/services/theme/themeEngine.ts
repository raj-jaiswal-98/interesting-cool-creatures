import ColorThief from 'colorthief';
import type { ThemePalette } from '../../types/creature';

/**
 * ThemeEngine extracts vibrant colors from creature photography,
 * computes harmonious contrast hexes, and dynamically updates CSS custom properties on :root.
 */
class ThemeEngine {
  defaultPalette: ThemePalette;
  currentPalette: ThemePalette;

  constructor() {
    this.defaultPalette = {
      primary: '#00F0FF',
      darkMuted: '#08131A',
      glow: 'rgba(0, 240, 255, 0.25)',
      textAccent: '#70E1FF',
      surface: 'rgba(13, 27, 36, 0.75)'
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
   * Applies pre-calculated or extracted creature palette
   */
  async applyCreatureTheme(imageUrl?: string | null, fallbackPalette?: ThemePalette): Promise<ThemePalette> {
    if (fallbackPalette) {
      this.injectVariables(fallbackPalette);
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

      const primaryHex = this.rgbToHex(dominant[0], dominant[1], dominant[2]);
      const darkTriplet = palette && palette[1] ? palette[1] : [10, 20, 30];
      const darkHex = this.rgbToHex(
        Math.min(darkTriplet[0], 35),
        Math.min(darkTriplet[1], 35),
        Math.min(darkTriplet[2], 45)
      );

      const textAccentHex = this.adjustBrightness(primaryHex, 0.4);
      const glowRgba = `rgba(${dominant[0]}, ${dominant[1]}, ${dominant[2]}, 0.28)`;
      const surfaceRgba = `rgba(${Math.min(darkTriplet[0], 25)}, ${Math.min(darkTriplet[1], 30)}, ${Math.min(darkTriplet[2], 40)}, 0.8)`;

      const newTheme: ThemePalette = {
        primary: primaryHex,
        darkMuted: darkHex,
        glow: glowRgba,
        textAccent: textAccentHex,
        surface: surfaceRgba
      };

      this.injectVariables(newTheme);
      return newTheme;
    } catch (err) {
      // Graceful fallback to fallbackPalette or defaultPalette
      if (fallbackPalette) {
        this.injectVariables(fallbackPalette);
        return fallbackPalette;
      }
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
