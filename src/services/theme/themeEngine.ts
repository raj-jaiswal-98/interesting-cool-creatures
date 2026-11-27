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

  /** Relative luminance (WCAG) of an RGB triplet. */
  luminance([r, g, b]: number[]): number {
    const lin = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  /** Contrast ratio of a color against the ink modal surface (#262324). */
  contrastOnInk(rgb: number[]): number {
    const ink = this.luminance([38, 35, 36]);
    return (this.luminance(rgb) + 0.05) / (ink + 0.05);
  }

  rgbToHsl([r, g, b]: number[]): [number, number, number] {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
    h /= 6;
    return [h, sat, l];
  }

  hslToRgb([h, sat, l]: [number, number, number]): [number, number, number] {
    if (sat === 0) {
      const v = Math.round(l * 255);
      return [v, v, v];
    }
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)].map((v) => Math.round(v * 255)) as [number, number, number];
  }

  /**
   * Keeps a color's hue (so it still belongs to the photo) but lifts lightness
   * and saturation until it reads clearly on the dark ink UI.
   */
  makeLegible(rgb: number[], minContrast = 3): [number, number, number] {
    if (this.contrastOnInk(rgb) >= minContrast) return [rgb[0], rgb[1], rgb[2]];
    let [h, sat, l] = this.rgbToHsl(rgb);
    sat = Math.max(sat, 0.38);
    let out = this.hslToRgb([h, sat, l]);
    while (this.contrastOnInk(out) < minContrast && l < 0.85) {
      l += 0.03;
      out = this.hslToRgb([h, sat, l]);
    }
    return out;
  }

  /** Picks the photo swatch that works best as an accent: vivid, not near-black/white. */
  pickAccentSwatch(swatches: number[][]): number[] {
    let best = swatches[0];
    let bestScore = -Infinity;
    for (const sw of swatches) {
      const [, sat, l] = this.rgbToHsl(sw);
      const score = sat * 2 - Math.abs(l - 0.55) * 1.5;
      if (score > bestScore) {
        best = sw;
        bestScore = score;
      }
    }
    return best;
  }

  /** Builds a full palette from one accent triplet. */
  paletteFromAccent(rgb: number[]): ThemePalette {
    const [r, g, b] = this.makeLegible(rgb);
    const [h, sat] = this.rgbToHsl([r, g, b]);
    const dark = this.hslToRgb([h, Math.min(sat, 0.35), 0.1]);
    const text = this.hslToRgb([h, Math.min(sat, 0.7), 0.8]);
    return {
      primary: this.rgbToHex(r, g, b),
      darkMuted: this.rgbToHex(dark[0], dark[1], dark[2]),
      glow: `rgba(${r}, ${g}, ${b}, 0.2)`,
      textAccent: this.rgbToHex(text[0], text[1], text[2]),
      surface: '#2A2728'
    };
  }

  hexToRgb(hex: string): number[] | null {
    const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
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
  async applyCreatureTheme(
    imageUrl?: string | null,
    fallbackPalette?: ThemePalette,
    options: { preferPhoto?: boolean } = {}
  ): Promise<ThemePalette> {
    // If a non-blue brutalist theme is already chosen, maintain the chosen brutalist accent
    const savedTheme = BRUTALIST_THEMES[this.activeThemeId] || BRUTALIST_THEMES.ember;

    // Living species: take the accent from the photo itself so the UI blends
    // with the image, made legible on ink. Falls back to the palette below.
    if (options.preferPhoto && imageUrl && typeof window !== 'undefined') {
      const fromPhoto = await this.extractPhotoPalette(imageUrl);
      if (fromPhoto) {
        this.injectVariables(fromPhoto);
        return fromPhoto;
      }
    }

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

      // Habitat palettes carry their own tinted surfaces; keep the ink surface.
      const fallbackRgb = this.hexToRgb(sanitized.primary);
      const legible =
        fallbackRgb && this.contrastOnInk(fallbackRgb) < 3
          ? { ...this.paletteFromAccent(fallbackRgb) }
          : { ...sanitized, surface: '#2A2728' };

      this.injectVariables(legible);
      return legible;
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

  /** Reads a photo's palette and returns a legible accent palette, or null on failure (e.g. CORS). */
  async extractPhotoPalette(imageUrl: string): Promise<ThemePalette | null> {
    // Fetch as a blob: a same-origin object URL never taints the canvas, and it
    // sidesteps cached non-CORS copies of the photo that break crossOrigin <img>.
    let objectUrl: string | null = null;
    try {
      const res = await fetch(imageUrl, { mode: 'cors', cache: 'reload' });
      if (!res.ok) return null;
      objectUrl = URL.createObjectURL(await res.blob());
      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to decode for theme extraction'));
      });
      const swatches = new ColorThief().getPalette(img, 6);
      if (!swatches || !swatches.length) return null;
      return this.paletteFromAccent(this.pickAccentSwatch(swatches));
    } catch {
      return null;
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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
