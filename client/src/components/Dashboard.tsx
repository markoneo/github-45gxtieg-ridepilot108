import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import VoucherGenerator from './VoucherGenerator';
import Modal from './Modal';
import LocationAnalytics from './LocationAnalytics';
import DispatchLayout, { getChannelColor } from './dispatch/DispatchLayout';
import type { ChannelItem } from './dispatch/DispatchLayout';
import SummaryRow from './dispatch/SummaryRow';
import DayStrip from './dispatch/DayStrip';
import DispatchToolbar from './dispatch/DispatchToolbar';
import type { FilterType, ViewMode } from './dispatch/DispatchToolbar';
import RideCard from './dispatch/RideCard';
import DetailPanel from './dispatch/DetailPanel';
import DispatchTable from './dispatch/DispatchTable';
import { exportProjectsToCSV } from '../utils/exportUtils';
import { generateICS, downloadICS } from '../utils/icsUtils';
import { Download, AlertTriangle, Calendar, Plus } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { accountStatus } = useAuth();
  const { projects, companies, drivers, carTypes, updateProject, deleteProject, loading, error, refreshData } = useData();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showAllRides, setShowAllRides] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherProjectId, setVoucherProjectId] = useState<string | null>(null);

  // Helpers
  const getCompanyName = useCallback((id: string) => companies.find(c => c.id === id)?.name || 'Unknown', [companies]);
  const getDriverName = useCallback((id: string) => drivers.find(d => d.id === id)?.name || 'Unknown Driver', [drivers]);
  const getCarTypeName = useCallback((id: string) => carTypes.find(c => c.id === id)?.name || 'Standard', [carTypes]);

  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);

  // Channels from companies
  const channels: ChannelItem[] = useMemo(() => {
    const map = new Map<string, number>();
    activeProjects.forEach(p => { if (p.company) map.set(p.company, (map.get(p.company) || 0) + 1); });
    return companies.filter(c => map.has(c.id)).map((c, i) => ({
      id: c.id, name: c.name, color: getChannelColor(i), count: map.get(c.id) || 0,
    }));
  }, [companies, activeProjects]);

  // Summary
  const summaryData = useMemo(() => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 3600_000);
    const in7d = new Date(now.getTime() + 7 * 24 * 3600_000);
    let n24 = 0, t24 = 0, first: string | null = null;
    let n7 = 0, t7 = 0, awaiting = 0, noDrv = 0, chgN = 0, chgT = 0;

    activeProjects.forEach(p => {
      const dt = new Date(`${p.date}T${p.time || '00:00'}`);
      if (dt >= now && dt <= in24h) { n24++; t24 += p.price || 0; const t = p.time?.slice(0, 5) || ''; if (!first || t < first) first = t; }
      if (dt >= now && dt <= in7d) { n7++; t7 += p.price || 0; }
      if (p.driver && (p as any).acceptance_status !== 'accepted') awaiting++;
      if (!p.driver) noDrv++;
      if (p.paymentStatus === 'charge') { chgN++; chgT += p.price || 0; }
    });
    return {
      next24h: { count: n24, total: t24, firstPickup: first },
      next7d: { count: n7, total: t7 },
      awaitingReply: awaiting, noDriver: noDrv,
      toCharge: { count: chgN, total: chgT },
    };
  }, [activeProjects]);

  // Filter counts
  const filterCounts = useMemo(() => {
    let aw = 0, nd = 0, tc = 0, pd = 0;
    activeProjects.forEach(p => {
      if (p.driver && (p as any).acceptance_status !== 'accepted') aw++;
      if (!p.driver) nd++;
      if (p.paymentStatus === 'charge') tc++;
      if (p.paymentStatus === 'paid') pd++;
    });
    return { all: activeProjects.length, awaiting_reply: aw, no_driver: nd, to_charge: tc, paid: pd };
  }, [activeProjects]);

  // Linked rides (same client, different date) and duplicates (same client+date+time)
  const { linkedMap, duplicateSet } = useMemo(() => {
    const byClient = new Map<string, typeof activeProjects>();
    activeProjects.forEach(p => {
      if (!p.clientName) return;
      const key = p.clientName.toLowerCase();
      if (!byClient.has(key)) byClient.set(key, []);
      byClient.get(key)!.push(p);
    });
    const linked = new Map<string, { id: string; date: string; type: 'return' | 'outbound' }>();
    const dupes = new Set<string>();
    byClient.forEach(group => {
      if (group.length < 2) return;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (group[i].date === group[j].date && group[i].time === group[j].time) {
            dupes.add(group[i].id);
            dupes.add(group[j].id);
          } else {
            const aDate = group[i].date, bDate = group[j].date;
            if (aDate < bDate) {
              linked.set(group[i].id, { id: group[j].id, date: bDate, type: 'return' });
              linked.set(group[j].id, { id: group[i].id, date: aDate, type: 'outbound' });
            } else {
              linked.set(group[i].id, { id: group[j].id, date: bDate, type: 'outbound' });
              linked.set(group[j].id, { id: group[i].id, date: aDate, type: 'return' });
            }
          }
        }
      }
    });
    return { linkedMap: linked, duplicateSet: dupes };
  }, [activeProjects]);

  // Filter & sort
  const filteredProjects = useMemo(() => {
    let result = [...activeProjects];
    if (activeChannel) result = result.filter(p => p.company === activeChannel);
    if (activeFilter === 'awaiting_reply') result = result.filter(p => p.driver && (p as any).acceptance_status !== 'accepted');
    else if (activeFilter === 'no_driver') result = result.filter(p => !p.driver);
    else if (activeFilter === 'to_charge') result = result.filter(p => p.paymentStatus === 'charge');
    else if (activeFilter === 'paid') result = result.filter(p => p.paymentStatus === 'paid');
    if (selectedDriver === '__none__') result = result.filter(p => !p.driver);
    else if (selectedDriver) result = result.filter(p => p.driver === selectedDriver);
    if (selectedDay) result = result.filter(p => p.date === selectedDay);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.clientName?.toLowerCase().includes(q) || p.pickupLocation?.toLowerCase().includes(q) ||
        p.dropoffLocation?.toLowerCase().includes(q) || p.bookingId?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));
    return result;
  }, [activeProjects, activeChannel, activeFilter, selectedDriver, selectedDay, searchQuery]);

  // 14-day limit
  const displayProjects = useMemo(() => {
    if (showAllRides || searchQuery.trim() || selectedDay) return filteredProjects;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() + 14);
    const cutoffStr = fmtDate(cutoff);
    return filteredProjects.filter(p => p.date <= cutoffStr);
  }, [filteredProjects, showAllRides, searchQuery, selectedDay]);

  const laterRidesCount = filteredProjects.length - displayProjects.length;

  // Group by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, typeof displayProjects>();
    displayProjects.forEach(p => { if (!map.has(p.date)) map.set(p.date, []); map.get(p.date)!.push(p); });
    const groups: Array<{ date: string; projects: typeof displayProjects }> = [];
    map.forEach((projs, date) => groups.push({ date, projects: projs }));
    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [displayProjects]);

  // Table-ready groups
  const tableGroups = useMemo(() =>
    groupedByDate.map(g => {
      const { label, isToday } = getDayLabel(g.date);
      const total = g.projects.reduce((s, p) => s + (p.price || 0), 0);
      const toCharge = g.projects.filter(p => p.paymentStatus === 'charge').length;
      return { date: g.date, label, isToday, count: g.projects.length, total, toCharge, projects: g.projects };
    }), [groupedByDate]);

  // ── Handlers ──
  const handleManualRefresh = useCallback(async () => {
    try { setIsRefreshing(true); await refreshData(); } catch { } finally { setIsRefreshing(false); }
  }, [refreshData]);

  const handleAssignDriver = useCallback((projectId: string, driverId: string) => {
    updateProject(projectId, { driver: driverId } as any).catch(() => alert('Failed to assign driver.'));
  }, [updateProject]);

  const handleComplete = useCallback((id: string) => {
    if (window.confirm('Mark this ride as completed?')) {
      updateProject(id, { status: 'completed' }).catch(() => alert('Failed to complete the trip.'));
      setDetailId(null);
    }
  }, [updateProject]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this ride?')) {
      deleteProject(id);
      setDetailId(null);
    }
  }, [deleteProject]);

  const handleCalendar = useCallback((id: string) => {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    const ics = generateICS({
      company: getCompanyName(p.company), pickupDate: p.date, pickupTime: p.time,
      pickupLocation: p.pickupLocation, dropoffLocation: p.dropoffLocation,
      assignedDriver: p.driver ? getDriverName(p.driver) : undefined,
      passengers: p.passengers, description: p.description, bookingId: p.bookingId,
    });
    downloadICS(ics, `ridepilot-${p.bookingId || id}.ics`);
  }, [projects, getCompanyName, getDriverName]);

  const handleExportDate = useCallback((date: string) => {
    const rows = projects.filter(p => p.status === 'active' && p.date === date).map(p => ({
      bookingId: p.bookingId, pickupLocation: p.pickupLocation, dropoffLocation: p.dropoffLocation,
      time: p.time, date: p.date, clientName: p.clientName, carType: getCarTypeName(p.carType),
      passengers: p.passengers, driverAssigned: getDriverName(p.driver), price: p.price,
      paymentStatus: p.paymentStatus, company: getCompanyName(p.company),
    }));
    if (!rows.length) { alert(`No active rides for ${date}`); return; }
    exportProjectsToCSV(rows, `active-projects-${date}.csv`);
  }, [projects, getCompanyName, getDriverName, getCarTypeName]);

  const handleSummaryFilter = useCallback((f: FilterType) => setActiveFilter(prev => prev === f ? 'all' : f), []);

  const clearAllFilters = useCallback(() => {
    setActiveFilter('all'); setActiveChannel(null); setSelectedDay(null); setSelectedDriver(null); setSearchQuery('');
  }, []);

  const hasActiveFilters = activeFilter !== 'all' || activeChannel || selectedDay || selectedDriver || searchQuery;

  // Detail panel project
  const detailProject = detailId ? projects.find(p => p.id === detailId) : null;

  return (
    <DispatchLayout
      channels={channels}
      activeChannel={activeChannel}
      onChannelSelect={setActiveChannel}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      rideCount={activeProjects.length}
      onRefresh={handleManualRefresh}
      isRefreshing={isRefreshing}
    >
      {accountStatus === 'suspended' && (
        <div className="mb-4 px-4 py-3 rounded-[var(--dp-radius)] text-sm text-white font-medium flex items-center gap-2" style={{ background: 'var(--dp-danger)' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Your account is temporarily suspended. Contact support at ridepilot.info@gmail.com
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[var(--dp-radius)] text-sm flex items-center gap-2" style={{ background: 'var(--dp-charge-bg)', color: 'var(--dp-charge)' }}>
          {error}
          <button onClick={handleManualRefresh} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <SummaryRow
        next24h={summaryData.next24h} next7d={summaryData.next7d}
        awaitingReply={summaryData.awaitingReply} noDriver={summaryData.noDriver}
        toCharge={summaryData.toCharge}
        onFilterAwaitingReply={() => handleSummaryFilter('awaiting_reply')}
        onFilterNoDriver={() => handleSummaryFilter('no_driver')}
        onFilterToCharge={() => handleSummaryFilter('to_charge')}
      />

      <div className="mt-4">
        <DayStrip projects={activeProjects as any} selectedDay={selectedDay} onDaySelect={setSelectedDay} />
      </div>

      <div className="mt-4">
        <DispatchToolbar
          activeFilter={activeFilter} onFilterChange={setActiveFilter}
          viewMode={viewMode} onViewModeChange={setViewMode}
          counts={filterCounts} drivers={drivers}
          selectedDriver={selectedDriver} onDriverChange={setSelectedDriver}
          channels={companies} selectedChannel={activeChannel} onChannelChange={setActiveChannel}
        />
      </div>

      <div className="mt-4">
        {loading && (
          <div className="w-full space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[var(--dp-radius)] h-28 animate-pulse" style={{ background: 'var(--dp-surface)' }} />
            ))}
          </div>
        )}

        {!loading && viewMode === 'map' && <LocationAnalytics />}

        {!loading && viewMode !== 'map' && displayProjects.length === 0 && (
          <div className="text-center py-16 rounded-[var(--dp-radius)]" style={{ background: 'var(--dp-surface)', border: '1px solid var(--dp-border)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--dp-text-muted)' }} />
            <p className="text-base font-medium" style={{ color: 'var(--dp-text-secondary)' }}>
              {hasActiveFilters ? 'No rides match these filters' : 'No rides yet'}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearAllFilters} className="mt-3 text-sm font-medium px-4 py-2 rounded-lg" style={{ color: 'var(--dp-accent)', background: 'var(--dp-accent-soft)' }}>
                Clear filters
              </button>
            ) : (
              <button onClick={() => navigate('/new-project')} className="mt-3 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: 'var(--dp-accent)' }}>
                <Plus className="w-4 h-4" /> Create your first ride
              </button>
            )}
          </div>
        )}

        {/* Cards view */}
        {!loading && viewMode === 'cards' && displayProjects.length > 0 && (
          <div className="space-y-0">
            {groupedByDate.map(({ date, projects: dayProjects }) => {
              const { label, isToday } = getDayLabel(date);
              const total = dayProjects.reduce((s, p) => s + (p.price || 0), 0);
              const toCharge = dayProjects.filter(p => p.paymentStatus === 'charge').length;
              return (
                <section key={date} className="relative">
                  <DayHeader date={date} label={label} isToday={isToday} count={dayProjects.length} total={total} toCharge={toCharge} onExport={() => handleExportDate(date)} />
                  <div className="space-y-2 pb-4">
                    {dayProjects.map(p => (
                      <RideCard
                        key={p.id}
                        project={p as any}
                        companyName={getCompanyName(p.company)}
                        driverName={p.driver ? getDriverName(p.driver) : undefined}
                        carTypeName={getCarTypeName(p.carType)}
                        channelColor={channels.find(c => c.id === p.company)?.color}
                        linkedRide={linkedMap.get(p.id) || null}
                        isDuplicate={duplicateSet.has(p.id)}
                        onClick={() => setDetailId(p.id)}
                        onAssignDriver={() => setDetailId(p.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            {laterRidesCount > 0 && !showAllRides && (
              <div className="text-center py-4">
                <button onClick={() => setShowAllRides(true)} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: 'var(--dp-accent)', background: 'var(--dp-accent-soft)' }}>
                  Show {laterRidesCount} later ride{laterRidesCount !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table view */}
        {!loading && viewMode === 'table' && displayProjects.length > 0 && (
          <>
            <DispatchTable
              groups={tableGroups}
              getCompanyName={getCompanyName}
              getDriverName={getDriverName}
              getCarTypeName={getCarTypeName}
              onRowClick={(id) => setDetailId(id)}
              onAssignDriver={(id) => setDetailId(id)}
            />
            {laterRidesCount > 0 && !showAllRides && (
              <div className="text-center py-4">
                <button onClick={() => setShowAllRides(true)} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: 'var(--dp-accent)', background: 'var(--dp-accent-soft)' }}>
                  Show {laterRidesCount} later ride{laterRidesCount !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail panel */}
      {detailProject && (
        <DetailPanel
          project={detailProject as any}
          companyName={getCompanyName(detailProject.company)}
          driverName={detailProject.driver ? getDriverName(detailProject.driver) : undefined}
          carTypeName={getCarTypeName(detailProject.carType)}
          channelColor={channels.find(c => c.id === detailProject.company)?.color}
          drivers={drivers}
          onClose={() => setDetailId(null)}
          onAssignDriver={(driverId) => handleAssignDriver(detailProject.id, driverId)}
          onCharge={() => { setVoucherProjectId(detailProject.id); setShowVoucherModal(true); }}
          onVoucher={() => { setVoucherProjectId(detailProject.id); setShowVoucherModal(true); }}
          onCalendar={() => handleCalendar(detailProject.id)}
          onEdit={() => { setDetailId(null); navigate(`/edit-project/${detailProject.id}`); }}
          onDelete={() => handleDelete(detailProject.id)}
          onComplete={() => handleComplete(detailProject.id)}
        />
      )}

      {showVoucherModal && voucherProjectId && (
        <Modal isOpen={showVoucherModal} onClose={() => setShowVoucherModal(false)} title="Transfer Voucher" size="large">
          <VoucherGenerator projectId={voucherProjectId} onClose={() => setShowVoucherModal(false)} />
        </Modal>
      )}
    </DispatchLayout>
  );
}

function DayHeader({ date, label, isToday, count, total, toCharge, onExport }: {
  date: string; label: string; isToday: boolean; count: number; total: number; toCharge: number; onExport: () => void;
}) {
  return (
    <div className="sticky z-20 flex items-center justify-between px-1 py-2" style={{ top: 0, background: 'var(--dp-bg)', borderBottom: '1px solid var(--dp-border)' }}>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold" style={{ color: isToday ? 'var(--dp-accent)' : 'var(--dp-text)' }}>{label}</span>
        {!isToday && (
          <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
            {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
        <span>{count} ride{count !== 1 ? 's' : ''}</span>
        <span className="tabular-nums font-heading">€{Math.round(total)}</span>
        {toCharge > 0 && <span style={{ color: 'var(--dp-charge)' }}>{toCharge} to charge</span>}
        <button onClick={onExport} className="p-1 rounded hover:opacity-70" title="Export this day">
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function getDayLabel(dateStr: string): { label: string; isToday: boolean } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = fmtDate(today);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (dateStr === todayStr) return { label: 'Today', isToday: true };
  if (dateStr === fmtDate(tomorrow)) return { label: 'Tomorrow', isToday: false };
  const d = new Date(dateStr + 'T00:00:00');
  return { label: `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`, isToday: false };
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
