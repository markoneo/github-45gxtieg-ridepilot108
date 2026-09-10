import React from 'react';

interface Project {
  id: string;
  clientName: string;
  date: string;
  time: string;
  pickupLocation: string;
  dropoffLocation: string;
  passengers: number;
  price: number;
  company: string;
  driver: string;
  carType: string;
  paymentStatus: string;
  acceptance_status?: string;
  bookingId?: string;
}

interface DispatchTableProps {
  groups: Array<{
    date: string;
    label: string;
    isToday: boolean;
    count: number;
    total: number;
    toCharge: number;
    projects: Project[];
  }>;
  getCompanyName: (id: string) => string;
  getDriverName: (id: string) => string;
  getCarTypeName: (id: string) => string;
  onRowClick: (id: string) => void;
  onAssignDriver: (id: string) => void;
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

export default function DispatchTable({
  groups, getCompanyName, getDriverName, getCarTypeName,
  onRowClick, onAssignDriver,
}: DispatchTableProps) {
  return (
    <div
      className="rounded-[var(--dp-radius)] overflow-hidden"
      style={{ background: 'var(--dp-surface)', border: '1px solid var(--dp-border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 900 }}>
          <thead>
            <tr style={{ background: 'var(--dp-surface-2)', borderBottom: '1px solid var(--dp-border)' }}>
              {['Time', 'Client', 'From', 'To', 'Pax · Vehicle', 'Driver', 'Channel', 'Price', 'Payment', 'Booking #'].map(h => (
                <th
                  key={h}
                  className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-left whitespace-nowrap ${h === 'Price' ? 'text-right' : ''}`}
                  style={{ color: 'var(--dp-text-muted)', position: 'sticky', top: 0, background: 'var(--dp-surface-2)', zIndex: 5 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <React.Fragment key={group.date}>
                {/* Day separator */}
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-2 text-xs font-semibold"
                    style={{ background: 'var(--dp-surface-2)', color: 'var(--dp-text-secondary)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: group.isToday ? 'var(--dp-accent)' : 'var(--dp-text)' }}>
                        {group.label}
                      </span>
                      <span style={{ color: 'var(--dp-text-muted)' }}>
                        {group.count} ride{group.count !== 1 ? 's' : ''} · <span className="font-heading tabular-nums">€{Math.round(group.total)}</span>
                        {group.toCharge > 0 && (
                          <span style={{ color: 'var(--dp-charge)' }}> · {group.toCharge} to charge</span>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
                {group.projects.map(p => {
                  const dName = getDriverName(p.driver);
                  const hasDriver = !!p.driver && dName !== 'Unknown Driver';
                  const isAccepted = p.acceptance_status === 'accepted';
                  const isPaid = p.paymentStatus === 'paid';
                  const pickup = truncAddr(p.pickupLocation);
                  const dropoff = truncAddr(p.dropoffLocation);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onRowClick(p.id)}
                      className="cursor-pointer transition-colors hover:bg-[var(--dp-surface-2)] focus-within:bg-[var(--dp-surface-2)]"
                      style={{ borderBottom: '1px solid var(--dp-border)' }}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') onRowClick(p.id); }}
                    >
                      {/* Time */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-heading tabular-nums text-sm" style={{ color: 'var(--dp-text)' }}>
                          {p.time?.slice(0, 5) || '–'}
                        </span>
                      </td>
                      {/* Client */}
                      <td className="px-3 py-2.5">
                        <span className="font-medium" style={{ color: 'var(--dp-text)' }}>{p.clientName || 'Anonymous'}</span>
                      </td>
                      {/* From */}
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <span className="truncate block text-xs" style={{ color: 'var(--dp-text-secondary)' }} title={p.pickupLocation}>
                          {pickup}
                        </span>
                      </td>
                      {/* To */}
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <span className="truncate block text-xs" style={{ color: 'var(--dp-text-secondary)' }} title={p.dropoffLocation}>
                          {dropoff}
                        </span>
                      </td>
                      {/* Pax · Vehicle */}
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                        {p.passengers} · {getCarTypeName(p.carType)}
                      </td>
                      {/* Driver */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {hasDriver ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                              style={{ background: getDriverColor(dName) }}
                            >
                              {getInitials(dName)}
                            </div>
                            <span className="text-xs" style={{ color: 'var(--dp-text-secondary)' }}>{dName}</span>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isAccepted ? 'var(--dp-success)' : 'var(--dp-warning)' }} />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAssignDriver(p.id); }}
                            className="text-[11px] px-2 py-0.5 rounded border border-dashed"
                            style={{ borderColor: 'var(--dp-border-strong)', color: 'var(--dp-text-muted)' }}
                          >
                            Assign
                          </button>
                        )}
                      </td>
                      {/* Channel */}
                      <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                        {getCompanyName(p.company) !== 'Unknown' ? getCompanyName(p.company) : '–'}
                      </td>
                      {/* Price */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <span className="font-heading tabular-nums text-sm" style={{ color: 'var(--dp-text)' }}>
                          €{Number.isInteger(p.price) ? p.price : p.price?.toFixed(2)}
                        </span>
                      </td>
                      {/* Payment */}
                      <td className="px-3 py-2.5">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                          style={{
                            background: isPaid ? 'var(--dp-success-bg)' : 'var(--dp-charge-bg)',
                            color: isPaid ? 'var(--dp-success)' : 'var(--dp-charge)',
                          }}
                        >
                          {isPaid ? 'Paid' : 'To charge'}
                        </span>
                      </td>
                      {/* Booking # */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-mono text-[11px]" style={{ color: 'var(--dp-text-muted)' }}>
                          {p.bookingId ? `#${p.bookingId}` : '–'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function truncAddr(addr: string): string {
  if (!addr) return '–';
  const commaIdx = addr.indexOf(',');
  return commaIdx > 0 ? addr.slice(0, commaIdx) : addr;
}
