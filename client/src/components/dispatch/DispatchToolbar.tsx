import React from 'react';
import { Grid3x3 as Grid3X3, List, Map } from 'lucide-react';

export type FilterType = 'all' | 'awaiting_reply' | 'no_driver' | 'to_charge' | 'paid';
export type ViewMode = 'cards' | 'table' | 'map';

interface DispatchToolbarProps {
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  counts: {
    all: number;
    awaiting_reply: number;
    no_driver: number;
    to_charge: number;
    paid: number;
  };
  drivers: Array<{ id: string; name: string }>;
  selectedDriver: string | null;
  onDriverChange: (id: string | null) => void;
  channels: Array<{ id: string; name: string }>;
  selectedChannel: string | null;
  onChannelChange: (id: string | null) => void;
}

const FILTER_DEFS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All rides' },
  { key: 'awaiting_reply', label: 'Awaiting driver' },
  { key: 'no_driver', label: 'No driver' },
  { key: 'to_charge', label: 'To charge' },
  { key: 'paid', label: 'Paid' },
];

export default function DispatchToolbar({
  activeFilter, onFilterChange,
  viewMode, onViewModeChange,
  counts,
  drivers, selectedDriver, onDriverChange,
  channels, selectedChannel, onChannelChange,
}: DispatchToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_DEFS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          const count = counts[key];
          return (
            <button
              key={key}
              onClick={() => onFilterChange(isActive && key !== 'all' ? 'all' : key)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dp-accent)]"
              style={{
                background: isActive ? 'var(--dp-accent-soft)' : 'var(--dp-surface)',
                color: isActive ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                border: `1px solid ${isActive ? 'var(--dp-accent)' : 'var(--dp-border)'}`,
              }}
            >
              {label}
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: isActive ? 'var(--dp-accent)' : 'var(--dp-surface-2)',
                  color: isActive ? 'white' : 'var(--dp-text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Driver dropdown */}
      <select
        value={selectedDriver || ''}
        onChange={(e) => onDriverChange(e.target.value || null)}
        className="text-sm py-1.5 px-2.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dp-accent)]"
        style={{
          background: 'var(--dp-surface)',
          border: '1px solid var(--dp-border)',
          color: 'var(--dp-text-secondary)',
        }}
      >
        <option value="">All drivers</option>
        <option value="__none__">Not chosen yet</option>
        {drivers.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      {/* Channel dropdown */}
      <select
        value={selectedChannel || ''}
        onChange={(e) => onChannelChange(e.target.value || null)}
        className="text-sm py-1.5 px-2.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dp-accent)]"
        style={{
          background: 'var(--dp-surface)',
          border: '1px solid var(--dp-border)',
          color: 'var(--dp-text-secondary)',
        }}
      >
        <option value="">All channels</option>
        {channels.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* View mode toggle */}
      <div
        className="flex items-center rounded-lg p-0.5 gap-0.5"
        style={{ background: 'var(--dp-surface-2)', border: '1px solid var(--dp-border)' }}
      >
        {([
          { mode: 'cards' as ViewMode, icon: Grid3X3, label: 'Cards' },
          { mode: 'table' as ViewMode, icon: List, label: 'Table' },
          { mode: 'map' as ViewMode, icon: Map, label: 'Map' },
        ]).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dp-accent)]"
            style={{
              background: viewMode === mode ? 'var(--dp-surface)' : 'transparent',
              color: viewMode === mode ? 'var(--dp-accent)' : 'var(--dp-text-muted)',
              boxShadow: viewMode === mode ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
            title={label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
