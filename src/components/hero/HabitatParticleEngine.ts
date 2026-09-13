/**
 * High performance HTML5 Canvas 2D particle simulation.
 * Renders atmospheric environmental effects reflecting creature biomes:
 * - marine: bioluminescent rising orbs & plankton drift
 * - volcanic: rising fiery embers & ash flakes
 * - forest: floating primeval spores & pollen
 * - tundra: descending crystalline ice dust
 * - aerial: swift horizontal wind streaks
 */

import type { HabitatType } from '../../types/creature';

class Particle {
  habitat!: HabitatType;
  width!: number;
  height!: number;
  x!: number;
  y!: number;
  size!: number;
  opacity!: number;
  baseOpacity!: number;
  pulse!: number;
  pulseSpeed!: number;
  vx!: number;
  vy!: number;

  constructor(width: number, height: number, habitat: HabitatType = 'marine') {
    this.reset(width, height, habitat, true);
  }

  reset(width: number, height: number, habitat: HabitatType, initial = false): void {
    this.habitat = habitat;
    this.width = width;
    this.height = height;

    if (initial) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
    } else {
      // Spawn at boundary depending on habitat physics
      if (habitat === 'marine' || habitat === 'volcanic') {
        this.x = Math.random() * width;
        this.y = height + 10;
      } else if (habitat === 'tundra') {
        this.x = Math.random() * width;
        this.y = -10;
      } else {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }
    }

    this.size = Math.random() * 3 + 1.2;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.baseOpacity = this.opacity;
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.02 + Math.random() * 0.03;

    switch (habitat) {
      case 'volcanic':
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = -(Math.random() * 2 + 0.8);
        this.size = Math.random() * 3.5 + 1.5;
        break;
      case 'tundra':
        this.vx = Math.random() * 1.5 + 0.5;
        this.vy = Math.random() * 1.8 + 0.6;
        break;
      case 'aerial':
        this.vx = Math.random() * 3 + 1.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2.5 + 0.8;
        break;
      case 'forest':
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.size = Math.random() * 2.2 + 1.0;
        break;
      case 'marine':
      default:
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = -(Math.random() * 0.9 + 0.3);
        this.size = Math.random() * 3.8 + 1.2;
        break;
    }
  }

  update(width: number, height: number): void {
    this.x += this.vx;
    this.y += this.vy;
    this.pulse += this.pulseSpeed;
    this.opacity = this.baseOpacity + Math.sin(this.pulse) * 0.15;

    if (this.y < -20 || this.y > height + 20 || this.x < -20 || this.x > width + 20) {
      this.reset(width, height, this.habitat, false);
    }
  }

  draw(ctx: CanvasRenderingContext2D, primaryColor: string): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1, this.opacity));
    ctx.fillStyle = primaryColor;
    ctx.shadowBlur = this.size * 3;
    ctx.shadowColor = primaryColor;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class HabitatParticleEngine {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  habitat: HabitatType;
  primaryColor: string;
  glowColor: string;
  particles: Particle[];
  animationFrameId: number | null;
  isRunning: boolean;
  logicalWidth?: number;
  logicalHeight?: number;

  constructor(
    canvas: HTMLCanvasElement,
    habitat: HabitatType = 'marine',
    primaryColor = '#00F0FF',
    glowColor = 'rgba(0, 240, 255, 0.25)'
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.habitat = habitat;
    this.primaryColor = primaryColor;
    this.glowColor = glowColor;
    this.particles = [];
    this.animationFrameId = null;
    this.isRunning = false;

    this.init();
  }

  init(): void {
    this.resize();
    const count = Math.min(80, Math.floor((this.canvas!.width * this.canvas!.height) / 14000));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(this.canvas!.width, this.canvas!.height, this.habitat));
    }
  }

  resize(): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;
  }

  setHabitat(habitat: HabitatType, primaryColor?: string, glowColor?: string): void {
    this.habitat = habitat || 'marine';
    if (primaryColor) this.primaryColor = primaryColor;
    if (glowColor) this.glowColor = glowColor;

    // Reset particles to adopt new habitat physics
    this.particles.forEach(p => p.reset(this.logicalWidth || 800, this.logicalHeight || 600, this.habitat, true));
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const render = () => {
      if (!this.isRunning || !this.ctx) return;
      const width = this.logicalWidth || 800;
      const height = this.logicalHeight || 600;

      this.ctx.clearRect(0, 0, width, height);

      // Render ambient background radial gradient
      const gradient = this.ctx.createRadialGradient(
        width * 0.5, height * 0.4, 10,
        width * 0.5, height * 0.4, width * 0.6
      );
      gradient.addColorStop(0, this.glowColor);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.update(width, height);
        p.draw(this.ctx, this.primaryColor);
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy(): void {
    this.stop();
    this.particles = [];
    this.ctx = null;
    this.canvas = null;
  }
}
