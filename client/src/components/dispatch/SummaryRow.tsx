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
      className="rounded-[var(--dp-radius)] overflow-hidden"
      style={{ background: 'var(--dp-surface)', border: '1px solid var(--dp-border)' }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Next 24 hours */}
        <Cell>
          <Label>Next 24 hours</Label>
          <div className="flex items-baseline gap-2">
            <BigNum>{next24h.count}</BigNum>
            <span className="text-sm tabular-nums" style={{ color: 'var(--dp-text-secondary)' }}>
              {fmtEur(next24h.total)}
            </span>
          </div>
          {next24h.firstPickup && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--dp-text-muted)' }}>
              First pickup {next24h.firstPickup}
            </div>
          )}
        </Cell>

        <Divider />

        {/* Next 7 days */}
        <Cell>
          <Label>Next 7 days</Label>
          <div className="flex items-baseline gap-2">
            <BigNum>{next7d.count}</BigNum>
            <span className="text-sm tabular-nums" style={{ color: 'var(--dp-text-secondary)' }}>
              {fmtEur(next7d.total)}
            </span>
          </div>
        </Cell>

        <Divider />

        {/* Awaiting driver reply */}
        <CellButton onClick={onFilterAwaitingReply}>
          <Label>Awaiting reply</Label>
          <BigNum style={{ color: awaitingReply > 0 ? 'var(--dp-warning)' : undefined }}>
            {awaitingReply}
          </BigNum>
        </CellButton>

        <Divider />

        {/* Driver not chosen */}
        <CellButton onClick={onFilterNoDriver}>
          <Label>No driver yet</Label>
          <BigNum>{noDriver}</BigNum>
        </CellButton>

        <Divider />

        {/* To charge */}
        <CellButton onClick={onFilterToCharge}>
          <Label>To charge</Label>
          <div className="flex items-baseline gap-2">
            <BigNum style={{ color: toCharge.count > 0 ? 'var(--dp-charge)' : undefined }}>
              {toCharge.count}
            </BigNum>
            {toCharge.total > 0 && (
              <span className="text-sm tabular-nums" style={{ color: 'var(--dp-charge)' }}>
                {fmtEur(toCharge.total)}
              </span>
            )}
          </div>
        </CellButton>
      </div>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3 lg:px-5 lg:py-4">{children}</div>;
}

function CellButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 lg:px-5 lg:py-4 text-left w-full transition-colors hover:bg-[var(--dp-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dp-accent)]"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="hidden lg:block w-px self-stretch" style={{ background: 'var(--dp-border)' }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--dp-text-muted)' }}>
      {children}
    </div>
  );
}

function BigNum({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="font-heading text-2xl tabular-nums" style={{ color: 'var(--dp-text)', ...style }}>
      {children}
    </span>
  );
}

function fmtEur(n: number): string {
  if (n === 0) return '€0';
  return `€${Math.round(n).toLocaleString('en')}`;
}
