import React, { useMemo } from 'react';
import { Users, Car } from 'lucide-react';

interface RideCardProps {
  project: {
    id: string;
    clientName: string;
    clientPhone?: string;
    date: string;
    time: string;
    pickupLocation: string;
    dropoffLocation: string;
    passengers: number;
    price: number;
    company: string;
    driver: string;
    carType: string;
    status: string;
    paymentStatus: string;
    acceptance_status?: string;
    bookingId?: string;
    description?: string;
  };
  companyName: string;
  driverName?: string;
  carTypeName?: string;
  channelColor?: string;
  linkedRide?: { id: string; date: string; type: 'return' | 'outbound' } | null;
  isDuplicate?: boolean;
  onClick: () => void;
  onAssignDriver: () => void;
}

const DRIVER_AVATAR_COLORS = [
  '#0D6B60', '#2A7F50', '#A86A12', '#3B6FA0', '#7A5C3E',
  '#5B7A3E', '#3E5B7A', '#7A3E5B', '#B84A1A', '#3E7A6A',
];

function getDriverColor(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return DRIVER_AVATAR_COLORS[hash % DRIVER_AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function splitAddress(addr: string): { place: string; rest: string } {
  if (!addr) return { place: '', rest: '' };
  const commaIdx = addr.indexOf(',');
  if (commaIdx === -1) return { place: addr, rest: '' };
  return { place: addr.slice(0, commaIdx), rest: addr.slice(commaIdx + 1).trim() };
}

export default React.memo(function RideCard({
  project, companyName, driverName, carTypeName, channelColor,
  linkedRide, isDuplicate, onClick, onAssignDriver,
}: RideCardProps) {

  const countdown = useMemo(() => {
    const now = new Date();
    const pickup = new Date(`${project.date}T${project.time || '00:00'}`);
    const diffMs = pickup.getTime() - now.getTime();
    if (diffMs <= 0 || diffMs > 48 * 60 * 60 * 1000) return null;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remH = hours % 24;
      return `in ${days}d ${remH}h`;
    }
    return `in ${hours}h ${mins}m`;
  }, [project.date, project.time]);

  const pickup = splitAddress(project.pickupLocation);
  const dropoff = splitAddress(project.dropoffLocation);
  const timeDisplay = project.time?.slice(0, 5) || '–';
  const isPaid = project.paymentStatus === 'paid';
  const hasDriver = !!project.driver && !!driverName && driverName !== 'Unknown Driver';
  const isAccepted = project.acceptance_status === 'accepted';
  const vehicleDisplay = carTypeName || 'Standard';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[var(--dp-radius)] transition-shadow duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dp-accent)] focus-visible:ring-offset-2"
      style={{
        background: 'var(--dp-surface)',
        border: '1px solid var(--dp-border)',
      }}
    >
      {/* Desktop: 5-column row */}
      <div className="hidden lg:grid lg:grid-cols-[80px_1fr_1fr_160px_100px] gap-4 p-4 items-start">
        {/* 1. Time */}
        <div className="flex flex-col items-start">
          <span className="font-heading text-[26px] leading-none tabular-nums" style={{ color: 'var(--dp-text)' }}>
            {timeDisplay}
          </span>
          {countdown && (
            <span
              className="mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}
            >
              {countdown}
            </span>
          )}
        </div>

        {/* 2. Route */}
        <div className="flex gap-3 min-w-0">
          <RouteLine />
          <div className="flex flex-col gap-3 min-w-0">
            <AddressBlock place={pickup.place} rest={pickup.rest} />
            <AddressBlock place={dropoff.place} rest={dropoff.rest} />
          </div>
        </div>

        {/* 3. Client */}
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {project.clientName || 'Anonymous'}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--dp-text-muted)' }}>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project.passengers} pax
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="w-3 h-3" />
              {vehicleDisplay}
            </span>
            {companyName && companyName !== 'Unknown' && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: channelColor || 'var(--dp-text-muted)' }} />
                {companyName}
              </span>
            )}
          </div>
          {isDuplicate && (
            <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded" style={{ background: 'var(--dp-warning-bg)', color: 'var(--dp-warning)' }}>
              Possible duplicate
            </span>
          )}
          {linkedRide && !isDuplicate && (
            <span className="inline-block mt-1 text-[11px] font-medium" style={{ color: 'var(--dp-accent)' }}>
              ⇄ {linkedRide.type === 'return' ? 'Return' : 'Outbound'} · {formatShortDate(linkedRide.date)}
            </span>
          )}
        </div>

        {/* 4. Driver */}
        <div>
          {hasDriver ? (
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                style={{ background: getDriverColor(driverName!) }}
              >
                {getInitials(driverName!)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--dp-text)' }}>{driverName}</div>
                <div className="flex items-center gap-1 text-[11px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isAccepted ? 'var(--dp-success)' : 'var(--dp-warning)' }}
                  />
                  <span style={{ color: isAccepted ? 'var(--dp-success)' : 'var(--dp-warning)' }}>
                    {isAccepted ? 'Accepted' : 'Awaiting reply'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAssignDriver(); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{
                border: '1px dashed var(--dp-border-strong)',
                color: 'var(--dp-text-muted)',
                background: 'transparent',
              }}
            >
              + Assign driver
            </button>
          )}
        </div>

        {/* 5. Price */}
        <div className="text-right">
          <span className="font-heading text-[19px] tabular-nums" style={{ color: 'var(--dp-text)' }}>
            {fmtEur(project.price)}
          </span>
          <div className="mt-1">
            <PaymentPill paid={isPaid} />
          </div>
        </div>
      </div>

      {/* Tablet (below 1180px): 2-row layout */}
      <div className="hidden md:grid lg:hidden gap-3 p-4" style={{ gridTemplateColumns: '80px 1fr auto' }}>
        {/* Row 1: time, route, price */}
        <div className="flex flex-col items-start">
          <span className="font-heading text-[24px] leading-none tabular-nums" style={{ color: 'var(--dp-text)' }}>
            {timeDisplay}
          </span>
          {countdown && (
            <span className="mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}>
              {countdown}
            </span>
          )}
        </div>
        <div className="flex gap-2 min-w-0">
          <RouteLine small />
          <div className="flex flex-col gap-2 min-w-0">
            <AddressBlock place={pickup.place} rest={pickup.rest} small />
            <AddressBlock place={dropoff.place} rest={dropoff.rest} small />
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="font-heading text-[17px] tabular-nums" style={{ color: 'var(--dp-text)' }}>{fmtEur(project.price)}</span>
          <div className="mt-1"><PaymentPill paid={isPaid} /></div>
        </div>

        {/* Row 2: client + driver */}
        <div className="col-span-3 flex items-center gap-4 pt-1" style={{ borderTop: '1px solid var(--dp-border)' }}>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold" style={{ color: 'var(--dp-text)' }}>{project.clientName || 'Anonymous'}</span>
            <span className="ml-2 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
              {project.passengers} pax · {vehicleDisplay}
            </span>
          </div>
          <div className="flex-shrink-0">
            {hasDriver ? (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: getDriverColor(driverName!) }}>
                  {getInitials(driverName!)}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--dp-text-secondary)' }}>{driverName}</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isAccepted ? 'var(--dp-success)' : 'var(--dp-warning)' }} />
              </div>
            ) : (
              <span className="text-xs px-2 py-1 rounded border border-dashed" style={{ borderColor: 'var(--dp-border-strong)', color: 'var(--dp-text-muted)' }}>
                + Assign
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile (below 640px): stacked */}
      <div className="md:hidden p-3 space-y-2.5">
        {/* Time + price row */}
        <div className="flex items-start justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-[22px] leading-none tabular-nums" style={{ color: 'var(--dp-text)' }}>
              {timeDisplay}
            </span>
            {countdown && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}>
                {countdown}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-heading text-[17px] tabular-nums" style={{ color: 'var(--dp-text)' }}>{fmtEur(project.price)}</span>
            <div className="mt-0.5"><PaymentPill paid={isPaid} /></div>
          </div>
        </div>

        {/* Route */}
        <div className="flex gap-2">
          <RouteLine small />
          <div className="flex flex-col gap-2 min-w-0">
            <AddressBlock place={pickup.place} rest={pickup.rest} small />
            <AddressBlock place={dropoff.place} rest={dropoff.rest} small />
          </div>
        </div>

        {/* Client */}
        <div className="flex items-center justify-between gap-2 pt-1.5" style={{ borderTop: '1px solid var(--dp-border)' }}>
          <div className="min-w-0">
            <span className="text-sm font-semibold" style={{ color: 'var(--dp-text)' }}>{project.clientName || 'Anonymous'}</span>
            <div className="text-xs mt-0.5" style={{ color: 'var(--dp-text-muted)' }}>
              {project.passengers} pax · {vehicleDisplay}
              {companyName && companyName !== 'Unknown' && ` · ${companyName}`}
            </div>
          </div>
          {/* Driver */}
          {hasDriver ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: getDriverColor(driverName!) }}>
                {getInitials(driverName!)}
              </div>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: isAccepted ? 'var(--dp-success)' : 'var(--dp-warning)' }} />
            </div>
          ) : (
            <span className="text-[11px] px-2 py-1 rounded border border-dashed flex-shrink-0" style={{ borderColor: 'var(--dp-border-strong)', color: 'var(--dp-text-muted)' }}>
              + Assign
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

function RouteLine({ small }: { small?: boolean }) {
  const h = small ? 'h-10' : 'h-12';
  return (
    <div className={`flex flex-col items-center flex-shrink-0 ${h} justify-between py-0.5`} style={{ width: 12 }}>
      <span
        className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
        style={{ borderColor: 'var(--dp-accent)', background: 'transparent' }}
      />
      <span className="flex-1 w-px border-l border-dashed my-0.5" style={{ borderColor: 'var(--dp-border-strong)' }} />
      <span
        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
        style={{ background: 'var(--dp-accent)' }}
      />
    </div>
  );
}

function AddressBlock({ place, rest, small }: { place: string; rest: string; small?: boolean }) {
  return (
    <div className="min-w-0">
      <div
        className={`${small ? 'text-xs' : 'text-sm'} font-semibold truncate`}
        style={{ color: 'var(--dp-text)' }}
      >
        {place || '–'}
      </div>
      {rest && (
        <div
          className={`${small ? 'text-[10px]' : 'text-xs'} leading-tight`}
          style={{ color: 'var(--dp-text-muted)', wordBreak: 'break-word' }}
        >
          {rest}
        </div>
      )}
    </div>
  );
}

function PaymentPill({ paid }: { paid: boolean }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded"
      style={{
        background: paid ? 'var(--dp-success-bg)' : 'var(--dp-charge-bg)',
        color: paid ? 'var(--dp-success)' : 'var(--dp-charge)',
      }}
    >
      {paid ? 'Paid' : 'To charge'}
    </span>
  );
}

function fmtEur(n: number): string {
  if (n == null || n === 0) return '€0';
  if (Number.isInteger(n)) return `€${n.toLocaleString('en')}`;
  return `€${n.toFixed(2)}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
