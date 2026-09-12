import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Globe, Loader2, Info } from 'lucide-react';
import { fetchGBIFCoordinates } from '../../services/api/gbifService';

export function OccurrenceMapTab({ creature }) {
  const [coordinates, setCoordinates] = useState(creature.coordinates || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const canvasRef = useRef(null);

  // Fetch live GBIF coordinates if creature doesn't have many
  useEffect(() => {
    let isMounted = true;

    async function loadGBIF() {
      setIsLoading(true);
      try {
        const gbifPoints = await fetchGBIFCoordinates(creature.scientificName, 15);
        if (isMounted) {
          // Merge unique coordinates
          const combined = [...(creature.coordinates || [])];
          gbifPoints.forEach((pt) => {
            const exists = combined.some(
              (c) => Math.abs(c.lat - pt.lat) < 0.1 && Math.abs(c.lng - pt.lng) < 0.1
            );
            if (!exists) combined.push(pt);
          });
          setCoordinates(combined);
        }
      } catch (err) {
        console.warn('GBIF occurrence load failed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadGBIF();
    return () => {
      isMounted = false;
    };
  }, [creature.scientificName]);

  // Draw 2D Equirectangular World Map and Occurrence Pins
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background ocean fill
    ctx.fillStyle = '#06111B';
    ctx.fillRect(0, 0, width, height);

    // Draw Subtle Latitude & Longitude Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Meridians
    for (let x = 0; x <= width; x += width / 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Parallels
    for (let y = 0; y <= height; y += height / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Equator & Prime Meridian with slightly higher opacity
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Plot occurrence points
    coordinates.forEach((pt, idx) => {
      // Equirectangular projection
      const x = ((pt.lng + 180) / 360) * width;
      const y = ((90 - pt.lat) / 180) * height;

      const isHovered = hoveredPoint === idx || selectedPoint === idx;

      // Glow halo
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 12 : 7, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.2)';
      ctx.fill();

      // Pin core
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#FFFFFF' : 'var(--accent-primary, #00F0FF)';
      ctx.shadowBlur = isHovered ? 15 : 8;
      ctx.shadowColor = 'var(--accent-primary, #00F0FF)';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [coordinates, hoveredPoint, selectedPoint]);

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let foundIdx = null;
    coordinates.forEach((pt, idx) => {
      const x = ((pt.lng + 180) / 360) * canvas.width;
      const y = ((90 - pt.lat) / 180) * canvas.height;
      const dist = Math.hypot(mouseX - x, mouseY - y);
      if (dist < 15) {
        foundIdx = idx;
      }
    });

    setHoveredPoint(foundIdx);
  };

  const handleCanvasClick = () => {
    if (hoveredPoint !== null) {
      setSelectedPoint(hoveredPoint);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Geographic Occurrence & Fossil Distribution</span>
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-world validated specimen occurrences & fossil bed locations mapped via GBIF & paleontological records.
          </p>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
            <Loader2 size={14} className="animate-spin-slow" />
            <span>Querying GBIF...</span>
          </div>
        )}
      </div>

      {/* Interactive Map Canvas Container */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: '#06111B',
        boxShadow: 'var(--shadow-card)'
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          onClick={handleCanvasClick}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            cursor: hoveredPoint !== null ? 'pointer' : 'default'
          }}
        />

        {/* Hovered / Selected Tooltip Overlay */}
        {(hoveredPoint !== null || selectedPoint !== null) && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(5, 11, 16, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#FFFFFF',
            fontSize: '0.85rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <div style={{ fontWeight: 700 }}>
                {coordinates[hoveredPoint ?? selectedPoint]?.country || 'Geographic Specimen Site'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Lat: {coordinates[hoveredPoint ?? selectedPoint]?.lat.toFixed(2)}°, Lng: {coordinates[hoveredPoint ?? selectedPoint]?.lng.toFixed(2)}°
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List of Coordinate Occurrences */}
      <div>
        <h5 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>
          Documented Specimen Coordinates ({coordinates.length})
        </h5>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px',
          maxHeight: '180px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {coordinates.map((pt, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPoint(idx)}
              style={{
                background: selectedPoint === idx ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor: selectedPoint === idx ? 'var(--accent-primary)' : 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {pt.country || 'Marine Observation'}
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {pt.lat > 0 ? `${pt.lat}° N` : `${Math.abs(pt.lat)}° S`}, {pt.lng > 0 ? `${pt.lng}° E` : `${Math.abs(pt.lng)}° W`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
