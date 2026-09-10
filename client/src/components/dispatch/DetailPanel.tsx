import React, { useEffect, useRef, useMemo } from 'react';
import {
  X, Phone, MessageCircle, CreditCard, FileText, Calendar as CalendarIcon,
  Pen, Trash2, CheckCircle, Users, Car, Clock
} from 'lucide-react';

interface DetailPanelProps {
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
  drivers: Array<{ id: string; name: string; status: string }>;
  onClose: () => void;
  onAssignDriver: (driverId: string) => void;
  onCharge: () => void;
  onVoucher: () => void;
  onCalendar: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
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

export default function DetailPanel({
  project, companyName, driverName, carTypeName, channelColor,
  drivers, onClose, onAssignDriver, onCharge, onVoucher, onCalendar,
  onEdit, onDelete, onComplete,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isPaid = project.paymentStatus === 'paid';
  const isAccepted = project.acceptance_status === 'accepted';
  const hasDriver = !!project.driver && !!driverName && driverName !== 'Unknown Driver';
  const vehicleDisplay = carTypeName || 'Standard';

  const canComplete = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const projDate = new Date(project.date + 'T00:00:00');
    return projDate <= today;
  }, [project.date]);

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

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // Prevent body scroll when panel open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const phoneHref = project.clientPhone ? `tel:${project.clientPhone}` : null;
  const whatsappHref = project.clientPhone
    ? `https://wa.me/${project.clientPhone.replace(/[^0-9+]/g, '')}`
    : null;

  const fullDate = new Date(project.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25" />
      <div
        ref={panelRef}
        className="relative w-full max-w-[440px] h-full flex flex-col overflow-y-auto"
        style={{
          background: 'var(--dp-surface)',
          borderLeft: '1px solid var(--dp-border)',
          animation: 'slideIn 250ms ease-out',
        }}
      >
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @media (prefers-reduced-motion: reduce) {
            @keyframes slideIn { from { transform: none; } to { transform: none; } }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--dp-border)' }}>
          <div className="flex items-center gap-2">
            {project.bookingId && (
              <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--dp-surface-2)', color: 'var(--dp-text-muted)' }}>
                #{project.bookingId}
              </span>
            )}
            {companyName && companyName !== 'Unknown' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}>
                {companyName}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: 'var(--dp-text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Client & time */}
          <div>
            <h2 className="font-heading text-xl" style={{ color: 'var(--dp-text)' }}>{project.clientName || 'Anonymous'}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
              <Clock className="w-3.5 h-3.5" />
              <span className="font-heading tabular-nums">{project.time?.slice(0, 5)}</span>
              <span>·</span>
              <span>{fullDate}</span>
            </div>
            {countdown && (
              <span className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}>
                {countdown}
              </span>
            )}
          </div>

          {/* Route */}
          <div>
            <SectionLabel>Route</SectionLabel>
            <div className="flex gap-3 mt-2">
              <div className="flex flex-col items-center flex-shrink-0 py-1" style={{ width: 12 }}>
                <span className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--dp-accent)' }} />
                <span className="flex-1 w-px border-l border-dashed my-1" style={{ borderColor: 'var(--dp-border-strong)' }} />
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: 'var(--dp-accent)' }} />
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--dp-text)' }}>{project.pickupLocation || '–'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--dp-text)' }}>{project.dropoffLocation || '–'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div>
            <SectionLabel>Details</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <DetailCell icon={<Users className="w-3.5 h-3.5" />} label="Passengers" value={`${project.passengers}`} />
              <DetailCell icon={<Car className="w-3.5 h-3.5" />} label="Vehicle" value={vehicleDisplay} />
              <DetailCell
                icon={<CreditCard className="w-3.5 h-3.5" />}
                label="Price"
                value={fmtEur(project.price)}
                valueStyle={{ fontFamily: 'var(--font-heading)' }}
              />
              <DetailCell
                label="Payment"
                value={isPaid ? 'Paid' : 'To charge'}
                valueStyle={{ color: isPaid ? 'var(--dp-success)' : 'var(--dp-charge)' }}
              />
            </div>
          </div>

          {/* Notes */}
          {project.description && (
            <div>
              <SectionLabel>Notes</SectionLabel>
              <p className="text-sm mt-1" style={{ color: 'var(--dp-text-secondary)' }}>{project.description}</p>
            </div>
          )}

          {/* Driver picker */}
          <div>
            <SectionLabel>Driver</SectionLabel>
            <div className="space-y-1.5 mt-2">
              {drivers.map(d => {
                const isCurrent = d.id === project.driver;
                return (
                  <button
                    key={d.id}
                    onClick={() => onAssignDriver(d.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{
                      background: isCurrent ? 'var(--dp-accent-soft)' : 'transparent',
                      border: `1px solid ${isCurrent ? 'var(--dp-accent)' : 'var(--dp-border)'}`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                      style={{ background: getDriverColor(d.name) }}
                    >
                      {getInitials(d.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: 'var(--dp-text)' }}>{d.name}</div>
                    </div>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: isAccepted ? 'var(--dp-success)' : 'var(--dp-warning)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: isAccepted ? 'var(--dp-success)' : 'var(--dp-warning)' }} />
                        {isAccepted ? 'Accepted' : 'Awaiting'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client contact */}
          {project.clientPhone && (
            <div>
              <SectionLabel>Client</SectionLabel>
              <div className="flex gap-2 mt-2">
                {phoneHref && (
                  <a
                    href={phoneHref}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: 'var(--dp-surface-2)', border: '1px solid var(--dp-border)', color: 'var(--dp-text)' }}
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                )}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: 'var(--dp-surface-2)', border: '1px solid var(--dp-border)', color: 'var(--dp-text)' }}
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <SectionLabel>Actions</SectionLabel>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {!isPaid ? (
                <ActionBtn onClick={onCharge} icon={<CreditCard className="w-4 h-4" />} label={`Charge €${Math.round(project.price)}`} />
              ) : (
                <ActionBtn onClick={onVoucher} icon={<FileText className="w-4 h-4" />} label="Receipt" />
              )}
              <ActionBtn onClick={onVoucher} icon={<FileText className="w-4 h-4" />} label="Invoice" />
              <ActionBtn onClick={onCalendar} icon={<CalendarIcon className="w-4 h-4" />} label="Add to calendar" />
              <ActionBtn onClick={onEdit} icon={<Pen className="w-4 h-4" />} label="Edit ride" />
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--dp-danger)' }}
          >
            Delete this ride
          </button>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: '1px solid var(--dp-border)' }}>
          {canComplete ? (
            <button
              onClick={onComplete}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--dp-success)' }}
            >
              <CheckCircle className="w-4 h-4" />
              Mark ride completed
            </button>
          ) : (
            <p className="text-center text-xs" style={{ color: 'var(--dp-text-muted)' }}>
              "Mark completed" appears on the day of the ride.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dp-text-muted)' }}>
      {children}
    </div>
  );
}

function DetailCell({ icon, label, value, valueStyle }: { icon?: React.ReactNode; label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--dp-surface-2)' }}>
      <div className="flex items-center gap-1 text-[11px] mb-0.5" style={{ color: 'var(--dp-text-muted)' }}>
        {icon} {label}
      </div>
      <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--dp-text)', ...valueStyle }}>
        {value}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
      style={{ background: 'var(--dp-surface-2)', border: '1px solid var(--dp-border)', color: 'var(--dp-text)' }}
    >
      {icon} {label}
    </button>
  );
}

function fmtEur(n: number): string {
  if (n == null || n === 0) return '€0';
  if (Number.isInteger(n)) return `€${n.toLocaleString('en')}`;
  return `€${n.toFixed(2)}`;
}
