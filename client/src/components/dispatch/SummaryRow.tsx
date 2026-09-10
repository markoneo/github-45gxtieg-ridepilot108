import React from 'react';

interface SummaryRowProps {
  next24h: { count: number; total: number; firstPickup: string | null };
  next7d: { count: number; total: number };
  awaitingReply: number;
  noDriver: number;
  toCharge: { count: number; total: number };
  onFilterAwaitingReply: () => void;
  onFilterNoDriver: () => void;
  onFilterToCharge: () => void;
}

export default function SummaryRow({
  next24h, next7d, awaitingReply, noDriver, toCharge,
  onFilterAwaitingReply, onFilterNoDriver, onFilterToCharge,
}: SummaryRowProps) {
  return (
    <div
      className="rounded-[var(--dp-radius)] summary-grid"
      style={{ background: 'var(--dp-surface)', border: '1px solid var(--dp-border)' }}
    >
      <style>{`
        .summary-grid > .summary-inner {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
        }
        @media (max-width: 1024px) {
          .summary-grid > .summary-inner {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 640px) {
          .summary-grid > .summary-inner {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .summary-grid .summary-tile {
          padding: 16px 20px;
          position: relative;
        }
        .summary-grid .summary-tile:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 12px;
          bottom: 12px;
          width: 1px;
          background: var(--dp-border);
        }
        @media (max-width: 1024px) {
          .summary-grid .summary-tile:nth-child(3)::after {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .summary-grid .summary-tile:nth-child(even)::after {
            display: none;
          }
        }
      `}</style>

      <div className="summary-inner">
        {/* Next 24 hours */}
        <div className="summary-tile">
          <Label>Next 24 hours</Label>
          <NumRow>
            <BigNum>{next24h.count}</BigNum>
            <Secondary>{fmtEur(next24h.total)}</Secondary>
          </NumRow>
          {next24h.firstPickup && (
            <SubLine>First pickup {next24h.firstPickup}</SubLine>
          )}
        </div>

        {/* Next 7 days */}
        <div className="summary-tile">
          <Label>Next 7 days</Label>
          <NumRow>
            <BigNum>{next7d.count}</BigNum>
            <Secondary>{fmtEur(next7d.total)}</Secondary>
          </NumRow>
        </div>

        {/* Awaiting reply */}
        <button className="summary-tile text-left w-full transition-colors hover:bg-[var(--dp-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dp-accent)]" onClick={onFilterAwaitingReply}>
          <Label>Awaiting reply</Label>
          <NumRow>
            <BigNum color={awaitingReply > 0 ? 'var(--dp-warning)' : undefined}>{awaitingReply}</BigNum>
          </NumRow>
        </button>

        {/* No driver yet */}
        <button className="summary-tile text-left w-full transition-colors hover:bg-[var(--dp-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dp-accent)]" onClick={onFilterNoDriver}>
          <Label>No driver yet</Label>
          <NumRow>
            <BigNum>{noDriver}</BigNum>
          </NumRow>
        </button>

        {/* To charge */}
        <button className="summary-tile text-left w-full transition-colors hover:bg-[var(--dp-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dp-accent)]" onClick={onFilterToCharge}>
          <Label>To charge</Label>
          <NumRow>
            <BigNum color={toCharge.count > 0 ? 'var(--dp-charge)' : undefined}>{toCharge.count}</BigNum>
            {toCharge.total > 0 && <Secondary color="var(--dp-charge)">{fmtEur(toCharge.total)}</Secondary>}
          </NumRow>
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--dp-text-muted)', lineHeight: 1.2 }}>
      {children}
    </div>
  );
}

function NumRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-baseline gap-2">{children}</div>;
}

function BigNum({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="font-heading text-2xl tabular-nums leading-none" style={{ color: color || 'var(--dp-text)' }}>
      {children}
    </span>
  );
}

function Secondary({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-sm tabular-nums" style={{ color: color || 'var(--dp-text-secondary)' }}>
      {children}
    </span>
  );
}

function SubLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs mt-1" style={{ color: 'var(--dp-text-muted)' }}>
      {children}
    </div>
  );
}

function fmtEur(n: number): string {
  if (n === 0) return '€0';
  return `€${Math.round(n).toLocaleString('en')}`;
}
