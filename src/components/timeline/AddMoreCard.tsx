import React, { useState } from 'react';
import { PlusCircle, Loader2, Sparkles, Compass, Globe } from 'lucide-react';

interface AddMoreCardProps {
  category: string;
  categoryLabel: string;
  onFetchMore: (category: string, count: number) => Promise<void>;
  isFetching?: boolean;
}

export function AddMoreCard({
  category,
  categoryLabel,
  onFetchMore,
  isFetching = false
}: AddMoreCardProps) {
  const [localLoading, setLocalLoading] = useState(false);
  const [fetchingTarget, setFetchingTarget] = useState<string | null>(null);
  const [lastFetchedCount, setLastFetchedCount] = useState<number | null>(null);

  // Generates a random integer between 5 and 10
  const getRandomBatchSize = () => Math.floor(Math.random() * (10 - 5 + 1)) + 5;

  const handleFetchCurrentCategory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFetching || localLoading) return;

    const count = getRandomBatchSize();
    setLastFetchedCount(count);
    setFetchingTarget(categoryLabel);
    setLocalLoading(true);
    try {
      await onFetchMore(category, count);
    } finally {
      setLocalLoading(false);
      setFetchingTarget(null);
    }
  };

  const handleFetchRestOfCategories = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFetching || localLoading) return;

    const count = getRandomBatchSize();
    setLastFetchedCount(count);
    setFetchingTarget('All Biomes');
    setLocalLoading(true);
    try {
      await onFetchMore('all', count);
    } finally {
      setLocalLoading(false);
      setFetchingTarget(null);
    }
  };

  const isLoading = isFetching || localLoading;

  return (
    <div
      className="brutalist-card"
      id="card-add-more-creatures"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        gap: '16px',
        background: 'linear-gradient(145deg, rgba(10, 18, 28, 0.75) 0%, rgba(6, 11, 17, 0.9) 100%)',
        borderRadius: 'var(--radius-card)',
        border: '2px dashed var(--accent-primary)',
        boxShadow: '0 8px 30px rgba(0, 255, 102, 0.08)',
        minHeight: '340px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Top Banner Tag */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 255, 102, 0.12)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            <Sparkles size={11} />
            <span>rand(5, 10) Live Batch</span>
          </span>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dynamic Stream
          </span>
        </div>

        {/* Big Centered Icon Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 255, 102, 0.08)',
            border: '1px solid rgba(0, 255, 102, 0.25)',
            margin: '8px auto 16px',
            color: 'var(--accent-primary)',
            boxShadow: '0 0 20px rgba(0, 255, 102, 0.15)'
          }}
        >
          {isLoading ? (
            <Loader2 size={32} className="animate-spin-slow" />
          ) : (
            <PlusCircle size={32} />
          )}
        </div>

        {/* Card Title & Explanatory Text */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '6px', letterSpacing: '-0.01em' }}>
            {category === 'all'
              ? 'Summon More Creatures'
              : `Summon More ${categoryLabel}`}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            {isLoading
              ? `Querying global biodiversity networks for ${lastFetchedCount || '5–10'} unique ${fetchingTarget || categoryLabel} organisms...`
              : `Fetch a random batch of 5 to 10 verified, research-grade species matching ${categoryLabel} or expand the rest of the collection.`}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        {/* Main Category Fetch Button */}
        <button
          onClick={handleFetchCurrentCategory}
          disabled={isLoading}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            fontWeight: 800,
            borderRadius: 'var(--radius-button)',
            width: '100%',
            boxShadow: '0 4px 14px rgba(0, 255, 102, 0.2)'
          }}
          id={`btn-fetch-more-${category.toLowerCase()}`}
          title={`Fetch rand(5,10) new unique ${categoryLabel} creatures`}
        >
          {isLoading && fetchingTarget === categoryLabel ? (
            <>
              <Loader2 size={16} className="animate-spin-slow" />
              <span>Fetching {lastFetchedCount || '5–10'} Species...</span>
            </>
          ) : (
            <>
              <Compass size={16} />
              <span>+ Fetch 5–10 More {category === 'all' ? '' : categoryLabel}</span>
            </>
          )}
        </button>

        {/* Secondary: Fetch for Rest of Categories */}
        {category !== 'all' && (
          <button
            onClick={handleFetchRestOfCategories}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 12px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-button)',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)'
            }}
            id="btn-fetch-more-rest"
            title="Fetch rand(5,10) creatures across all remaining biomes and eras"
          >
            {isLoading && fetchingTarget === 'All Biomes' ? (
              <>
                <Loader2 size={13} className="animate-spin-slow" />
                <span>Fetching across Biomes...</span>
              </>
            ) : (
              <>
                <Globe size={13} />
                <span>+ Fetch 5–10 for Rest of Categories</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
