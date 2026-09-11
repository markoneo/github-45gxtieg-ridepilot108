import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';

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
  const navigate = useNavigate();
  const { projects } = useData();

  const completed = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearCompleted = projects.filter(p => p.status === 'completed' && new Date(p.date) >= yearStart);
    const total = yearCompleted.reduce((s, p) => s + p.price, 0);
    const thisMonth = yearCompleted.filter(p => new Date(p.date) >= monthStart).length;
    return { count: yearCompleted.length, total, thisMonth };
  }, [projects]);

  return (
    <div
      className="rounded-[var(--dp-radius)] summary-grid"
      style={{ background: 'var(--dp-surface)', border: '1px solid var(--dp-border)', overflow: 'hidden' }}
    >
      <style>{`
        .summary-grid > .summary-inner {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
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
          display: flex;
          flex-direction: column;
          align-items: stretch;
          text-align: left;
        }

        /* Vertical divider on the right of every tile except the last in each row */
        /* Desktop: 6 cols – hide on 6th */
        .summary-grid .summary-tile::after {
          content: '';
          position: absolute;
          right: 0;
          top: 12px;
          bottom: 12px;
          width: 1px;
          background: var(--dp-border);
        }
        .summary-grid .summary-tile:nth-child(6)::after { display: none; }

        @media (max-width: 1024px) {
          /* 3-col: hide divider on 3rd, 6th */
          .summary-grid .summary-tile:nth-child(3)::after,
          .summary-grid .summary-tile:nth-child(6)::after { display: none; }
          /* Horizontal divider between rows (after 3rd tile) */
          .summary-grid .summary-tile:nth-child(n+4) {
            border-top: 1px solid var(--dp-border);
          }
        }
        @media (max-width: 640px) {
          /* 2-col: hide divider on every even tile */
          .summary-grid .summary-tile:nth-child(even)::after { display: none; }
          /* Horizontal divider between rows (after 2nd tile) */
          .summary-grid .summary-tile:nth-child(n+3) {
            border-top: 1px solid var(--dp-border);
          }
        }

        /* Clickable tile hover/focus: soft inset pill */
        .summary-grid button.summary-tile {
          border-radius: 0;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .summary-grid button.summary-tile::before {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 8px;
          background: transparent;
          transition: background 0.15s;
          pointer-events: none;
          z-index: 0;
        }
        .summary-grid button.summary-tile:hover::before {
          background: var(--dp-surface-2);
        }
        .summary-grid button.summary-tile:focus-visible {
          outline: none;
        }
        .summary-grid button.summary-tile:focus-visible::before {
          background: var(--dp-surface-2);
          box-shadow: inset 0 0 0 2px var(--dp-accent);
        }
        /* Ensure tile content sits above the ::before overlay */
        .summary-grid button.summary-tile > * {
          position: relative;
          z-index: 1;
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
        <button className="summary-tile text-left w-full" onClick={onFilterAwaitingReply}>
          <Label>Awaiting reply</Label>
          <NumRow>
            <BigNum color={awaitingReply > 0 ? 'var(--dp-warning)' : undefined}>{awaitingReply}</BigNum>
          </NumRow>
        </button>

        {/* No driver yet */}
        <button className="summary-tile text-left w-full" onClick={onFilterNoDriver}>
          <Label>No driver yet</Label>
          <NumRow>
            <BigNum>{noDriver}</BigNum>
          </NumRow>
        </button>

        {/* To charge */}
        <button className="summary-tile text-left w-full" onClick={onFilterToCharge}>
          <Label>To charge</Label>
          <NumRow>
            <BigNum color={toCharge.count > 0 ? 'var(--dp-charge)' : undefined}>{toCharge.count}</BigNum>
            {toCharge.total > 0 && <Secondary color="var(--dp-charge)">{fmtEur(toCharge.total)}</Secondary>}
          </NumRow>
        </button>

        {/* Completed */}
        <button className="summary-tile text-left w-full" onClick={() => navigate('/completed-projects')}>
          <Label>Completed</Label>
          <NumRow>
            <BigNum color="var(--dp-success)">{completed.count}</BigNum>
            <Secondary>{fmtEur(completed.total)}</Secondary>
          </NumRow>
          <SubLine>This month: {completed.thisMonth}</SubLine>
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
