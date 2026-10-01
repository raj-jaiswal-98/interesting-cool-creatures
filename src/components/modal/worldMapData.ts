/**
 * Equirectangular World Continents & Landmass Polygons
 * Provides authentic geographic continental boundaries for canvas/SVG rendering.
 * Coordinates are formatted as [longitude, latitude] pairs.
 */

export interface LandPolygon {
  name: string;
  points: [number, number][]; // [lng, lat]
}

export const WORLD_CONTINENTS: LandPolygon[] = [
  // North America (Mainland)
  {
    name: 'North America',
    points: [
      [-168, 65], [-162, 70], [-150, 71], [-130, 69], [-115, 68], [-95, 70], [-80, 65],
      [-65, 60], [-55, 52], [-65, 44], [-75, 38], [-80, 25], [-81, 25], [-85, 30],
      [-90, 30], [-97, 26], [-97, 20], [-87, 13], [-83, 9], [-77, 8], [-80, 9],
      [-85, 14], [-96, 16], [-105, 22], [-110, 30], [-117, 32], [-124, 40], [-124, 48],
      [-135, 57], [-150, 60], [-160, 56], [-166, 60], [-168, 65]
    ]
  },
  // South America
  {
    name: 'South America',
    points: [
      [-77, 8], [-72, 11], [-61, 10], [-50, 0], [-35, -5], [-37, -12], [-41, -21],
      [-48, -28], [-53, -33], [-60, -38], [-65, -43], [-66, -53], [-74, -53], [-74, -45],
      [-72, -37], [-70, -28], [-77, -12], [-81, -5], [-80, 2], [-77, 8]
    ]
  },
  // Eurasia (Europe + Asia)
  {
    name: 'Eurasia',
    points: [
      [-9, 36], [-9, 43], [0, 46], [5, 53], [9, 57], [18, 59], [25, 71], [40, 68],
      [60, 70], [80, 73], [105, 77], [130, 72], [160, 70], [170, 66], [180, 65],
      [170, 60], [160, 55], [140, 48], [130, 42], [122, 37], [118, 25], [108, 20],
      [104, 10], [100, 4], [98, 10], [90, 22], [80, 16], [77, 8], [72, 20], [68, 24],
      [60, 25], [56, 26], [50, 14], [44, 13], [35, 30], [36, 36], [28, 41], [22, 40],
      [15, 38], [15, 41], [10, 44], [3, 42], [-5, 36], [-9, 36]
    ]
  },
  // Africa
  {
    name: 'Africa',
    points: [
      [-6, 36], [10, 37], [25, 32], [32, 31], [35, 27], [43, 13], [51, 11], [45, 0],
      [40, -10], [35, -24], [32, -28], [28, -33], [18, -34], [15, -29], [12, -18],
      [9, 2], [3, 6], [-5, 5], [-12, 8], [-17, 15], [-17, 21], [-13, 28], [-6, 36]
    ]
  },
  // Australia
  {
    name: 'Australia',
    points: [
      [114, -22], [114, -34], [120, -34], [130, -32], [138, -35], [148, -39], [153, -28],
      [145, -15], [142, -11], [136, -12], [130, -14], [122, -17], [114, -22]
    ]
  },
  // Greenland
  {
    name: 'Greenland',
    points: [
      [-44, 60], [-35, 65], [-25, 75], [-20, 81], [-35, 83], [-55, 82], [-65, 76],
      [-55, 69], [-50, 62], [-44, 60]
    ]
  },
  // Great Britain & Ireland
  {
    name: 'British Isles',
    points: [
      [-5, 50], [1, 51], [1, 53], [-1, 56], [-4, 58], [-6, 55], [-4, 52], [-5, 50]
    ]
  },
  // Japan (Honshu/Hokkaido)
  {
    name: 'Japan',
    points: [
      [131, 33], [136, 35], [141, 41], [145, 44], [141, 45], [139, 41], [133, 35], [131, 33]
    ]
  },
  // Madagascar
  {
    name: 'Madagascar',
    points: [
      [49, -12], [50, -16], [47, -25], [44, -25], [44, -18], [47, -13], [49, -12]
    ]
  },
  // Antarctica (Coastline)
  {
    name: 'Antarctica',
    points: [
      [-180, -78], [-140, -76], [-100, -73], [-65, -64], [-55, -73], [-20, -72],
      [20, -70], [60, -67], [100, -66], [140, -66], [170, -72], [180, -78],
      [180, -85], [-180, -85], [-180, -78]
    ]
  }
];

/**
 * Converts [lng, lat] coordinate into equirectangular canvas (x, y) coordinates
 */
export function projectEquirectangular(lng: number, lat: number, width: number, height: number): [number, number] {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

/**
 * Draws the complete world map with landmasses, glowing coastlines, and coordinates onto a Canvas context
 */
export function renderWorldMapCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor = '#00F0FF'
) {
  // 1. Ocean Background Fill with subtle atmospheric radial gradient
  const oceanGrad = ctx.createRadialGradient(width / 2, height / 2, width / 8, width / 2, height / 2, width / 1.5);
  oceanGrad.addColorStop(0, '#071624');
  oceanGrad.addColorStop(1, '#030B12');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Latitude & Longitude Graticule Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;

  // Meridians (every 30 degrees)
  for (let lng = -180; lng <= 180; lng += 30) {
    const [x] = projectEquirectangular(lng, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Parallels (every 30 degrees)
  for (let lat = -90; lat <= 90; lat += 30) {
    const [, y] = projectEquirectangular(0, lat, width, height);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Equator & Prime Meridian highlight
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
  ctx.lineWidth = 1.2;
  const [, eqY] = projectEquirectangular(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(width, eqY);
  ctx.stroke();

  const [pmX] = projectEquirectangular(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(pmX, 0);
  ctx.lineTo(pmX, height);
  ctx.stroke();

  // 3. Draw Continents with glowing borders and sleek land styling
  ctx.save();
  for (const land of WORLD_CONTINENTS) {
    if (land.points.length < 3) continue;

    ctx.beginPath();
    const [startX, startY] = projectEquirectangular(land.points[0][0], land.points[0][1], width, height);
    ctx.moveTo(startX, startY);

    for (let i = 1; i < land.points.length; i++) {
      const [ptX, ptY] = projectEquirectangular(land.points[i][0], land.points[i][1], width, height);
      ctx.lineTo(ptX, ptY);
    }
    ctx.closePath();

    // Continental landmass fill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.085)';
    ctx.fill();

    // Coastline stroke
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Subtle internal coastal aura
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}
