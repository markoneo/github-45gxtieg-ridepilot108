import React, { useMemo } from 'react';

interface DayData {
  date: string; // YYYY-MM-DD
  weekday: string;
  dayNum: number;
  isToday: boolean;
  accepted: number;
  awaitingReply: number;
  noDriver: number;
  total: number;
  revenue: number;
}

interface DayStripProps {
  projects: Array<{
    date: string;
    driver: string;
    price: number;
    acceptance_status?: string;
  }>;
  selectedDay: string | null;
  onDaySelect: (date: string | null) => void;
}

export default function DayStrip({ projects, selectedDay, onDaySelect }: DayStripProps) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = fmtDate(today);

    const result: DayData[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = fmtDate(d);
      const dayProjects = projects.filter(p => p.date === dateStr);

      let accepted = 0, awaitingReply = 0, noDriver = 0;
      dayProjects.forEach(p => {
        if (!p.driver) {
          noDriver++;
        } else if (p.acceptance_status === 'accepted') {
          accepted++;
        } else {
          awaitingReply++;
        }
      });

      result.push({
        date: dateStr,
        weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        accepted,
        awaitingReply,
        noDriver,
        total: dayProjects.length,
        revenue: dayProjects.reduce((s, p) => s + (p.price || 0), 0),
      });
    }
    return result;
  }, [projects]);

  const maxCount = Math.max(1, ...days.map(d => d.total));

  return (
    <div
      className="rounded-[var(--dp-radius)] overflow-hidden"
      style={{ background: 'var(--dp-surface)', border: '1px solid var(--dp-border)' }}
    >
      <div className="overflow-x-auto">
        <div className="flex min-w-[700px]">
          {days.map((day) => {
            const isSelected = selectedDay === day.date;
            const barH = day.total > 0 ? Math.max(4, (day.total / maxCount) * 48) : 0;
            const acceptedH = day.total > 0 ? (day.accepted / day.total) * barH : 0;
            const awaitingH = day.total > 0 ? (day.awaitingReply / day.total) * barH : 0;
            const noDriverH = barH - acceptedH - awaitingH;

            return (
              <button
                key={day.date}
                onClick={() => onDaySelect(isSelected ? null : day.date)}
                className="flex-1 flex flex-col items-center py-3 px-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dp-accent)]"
                style={{
                  background: isSelected ? 'var(--dp-accent-soft)' : 'transparent',
                  borderRight: '1px solid var(--dp-border)',
                }}
              >
                {/* Weekday */}
                <span
                  className="text-[11px] font-medium"
                  style={{ color: day.isToday ? 'var(--dp-accent)' : 'var(--dp-text-muted)' }}
                >
                  {day.weekday}
                </span>
                {/* Day number */}
                <span
                  className="text-sm font-semibold mt-0.5"
                  style={{ color: day.isToday ? 'var(--dp-accent)' : 'var(--dp-text)' }}
                >
                  {day.dayNum}
                </span>

                {/* Stacked bar */}
                <div className="w-3 mt-2 mb-2 flex flex-col-reverse rounded-sm overflow-hidden" style={{ height: 48 }}>
                  {day.total > 0 ? (
                    <>
                      <div style={{ height: acceptedH, background: 'var(--dp-accent)' }} />
                      <div style={{ height: awaitingH, background: 'var(--dp-accent)', opacity: 0.4 }} />
                      <div
                        style={{
                          height: noDriverH,
                          background: 'var(--dp-text-muted)',
                          opacity: 0.3,
                        }}
                      />
                    </>
                  ) : (
                    <div className="w-full h-1 rounded self-end" style={{ background: 'var(--dp-border)' }} />
                  )}
                </div>

                {/* Count */}
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: day.total > 0 ? 'var(--dp-text)' : 'var(--dp-text-muted)' }}
                >
                  {day.total}
                </span>
                {/* Revenue */}
                <span
                  className="text-[10px] tabular-nums mt-0.5"
                  style={{ color: 'var(--dp-text-muted)' }}
                >
                  {day.revenue > 0 ? `€${Math.round(day.revenue)}` : '–'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-4 px-4 py-2 text-[10px]"
        style={{ borderTop: '1px solid var(--dp-border)', color: 'var(--dp-text-muted)' }}
      >
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: 'var(--dp-accent)' }} />
          Accepted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: 'var(--dp-accent)', opacity: 0.4 }} />
          Awaiting reply
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: 'var(--dp-text-muted)', opacity: 0.3 }} />
          No driver
        </span>
      </div>
    </div>
  );
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
