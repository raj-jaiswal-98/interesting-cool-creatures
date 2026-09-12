import { describe, it, expect } from 'vitest';
import { themeEngine } from '../src/services/theme/themeEngine';

describe('ThemeEngine', () => {
  it('correctly converts RGB values to valid hex strings', () => {
    expect(themeEngine.rgbToHex(0, 240, 255)).toBe('#00f0ff');
    expect(themeEngine.rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(themeEngine.rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('adjusts brightness safely without exceeding 00 or FF', () => {
    const lighter = themeEngine.adjustBrightness('#00F0FF', 0.2);
    expect(lighter).toMatch(/^#[0-9a-f]{6}$/i);

    const darker = themeEngine.adjustBrightness('#FFFFFF', -0.5);
    expect(darker).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('injects variables and updates currentPalette when fallbackPalette is provided', async () => {
    const testPalette = {
      primary: '#FF0055',
      darkMuted: '#220011',
      glow: 'rgba(255, 0, 85, 0.25)',
      textAccent: '#FF77AA',
      surface: 'rgba(30, 0, 15, 0.8)'
    };

    const result = await themeEngine.applyCreatureTheme(null, testPalette);
    expect(result.primary).toBe('#FF0055');
    expect(themeEngine.currentPalette.primary).toBe('#FF0055');
  });
});
