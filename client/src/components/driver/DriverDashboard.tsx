import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MapPin, Users, Clock, DollarSign, Phone, Car, RefreshCw, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, CircleCheck as CheckCircle2, Calendar, User, Building2, ExternalLink, ArrowRight, Bell, TrendingUp, Activity, Circle as XCircle, CirclePlay as PlayCircle, CirclePause as PauseCircle, Copy, Check, Plus, X, Wallet } from 'lucide-react';
import { DriverDataProvider, useDriverData } from '../../contexts/DriverDataContext';

interface DriverDashboardProps {
  driverId: string;
  driverName: string;
  driverUuid: string;
  onLogout: () => void;
}

// Split an address at its first comma for display (place / remainder)
function splitAddress(addr: string): { place: string; rest: string } {
  if (!addr) return { place: '', rest: '' };
  const i = addr.indexOf(',');
  if (i === -1) return { place: addr, rest: '' };
  return { place: addr.slice(0, i), rest: addr.slice(i + 1).trim() };
}

// Project Card Component for Driver Portal
const DriverProjectCard = ({ project, companyName, carTypeName }: { 
  project: any; 
  companyName: string;
  carTypeName: string;
}) => {
  const { updateProjectStatus } = useDriverData();
  const [updating, setUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleStatusUpdate = async (status: 'accepted' | 'started' | 'declined') => {
    setUpdating(true);
    try {
      await updateProjectStatus(project.id, status);
    } catch (error) {
      console.error('Failed to update project status:', error);
      alert('Failed to update project status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'pending': return { background: 'var(--dp-warning-bg)', color: 'var(--dp-warning)', border: '1px solid var(--dp-warning-bg)' };
      case 'accepted': return { background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)', border: '1px solid var(--dp-accent-soft)' };
      case 'started': return { background: 'var(--dp-success-bg)', color: 'var(--dp-success)', border: '1px solid var(--dp-success-bg)' };
      case 'declined': return { background: 'var(--dp-charge-bg)', color: 'var(--dp-danger)', border: '1px solid var(--dp-charge-bg)' };
      default: return { background: 'var(--dp-surface-2)', color: 'var(--dp-text-secondary)', border: '1px solid var(--dp-border)' };
    }
  };

  const getUrgencyColor = (): string => {
    const projectDateTime = new Date(`${project.date}T${project.time}`);
    const now = new Date();
    const diffHours = (projectDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return 'var(--dp-border-strong)';
    if (diffHours <= 2) return 'var(--dp-danger)';
    if (diffHours <= 24) return 'var(--dp-warning)';
    return 'var(--dp-accent)';
  };

  const urgencyColor = getUrgencyColor();
  const displayPrice = project.driver_fee && project.driver_fee > 0 ? project.driver_fee : project.price;
  const pickup = splitAddress(project.pickup_location);
  const dropoff = splitAddress(project.dropoff_location);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="overflow-hidden transition-shadow duration-300"
      style={{
        background: 'var(--dp-surface)',
        borderRadius: 'var(--dp-radius)',
        border: '1px solid var(--dp-border)',
        borderTop: `3px solid ${urgencyColor}`,
      }}
    >
      <div style={{ padding: '16px 16px 14px' }}>

        {/* 1. HEADER ROW — time+date left, price+status right */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="tabular-nums" style={{ fontSize: 30, fontWeight: 700, lineHeight: 0.95, color: 'var(--dp-text)' }}>
              {formatTime(project.time)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--dp-text-muted)', marginTop: 4 }}>
              {formatDate(project.date)}
            </div>
          </div>
          <div className="text-right shrink-0" style={{ marginLeft: 'auto' }}>
            <div className="tabular-nums" style={{ fontSize: 19, fontWeight: 700, color: 'var(--dp-text)' }}>
              €{displayPrice.toFixed(2)}
            </div>
            <span
              className="inline-flex items-center rounded-full mt-1"
              style={{ ...getStatusStyle(project.acceptance_status), padding: '2px 9px', fontSize: 11, fontWeight: 600, lineHeight: '18px' }}
            >
              {project.acceptance_status === 'pending' && <Clock className="mr-1" style={{ width: 12, height: 12 }} />}
              {project.acceptance_status === 'accepted' && <CheckCircle className="mr-1" style={{ width: 12, height: 12 }} />}
              {project.acceptance_status === 'started' && <PlayCircle className="mr-1" style={{ width: 12, height: 12 }} />}
              {project.acceptance_status === 'declined' && <XCircle className="mr-1" style={{ width: 12, height: 12 }} />}
              {project.acceptance_status.charAt(0).toUpperCase() + project.acceptance_status.slice(1)}
            </span>
          </div>
        </div>

        {/* 2. CUSTOMER ROW */}
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5" style={{ paddingTop: 10, marginTop: 12, borderTop: '1px solid var(--dp-border)' }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--dp-text)' }}>{project.client_name}</span>
          <span style={{ fontSize: 12, color: 'var(--dp-text-muted)' }}>{companyName}</span>
        </div>

        {/* 3. ROUTE BLOCK */}
        <div className="relative" style={{ paddingLeft: 26, marginTop: 14, marginBottom: 14 }}>
          {/* Connector line */}
          <span
            className="absolute"
            style={{ left: 5, top: 12, bottom: 12, width: 1, background: 'var(--dp-border)' }}
          />

          {/* Pickup */}
          <div style={{ paddingBottom: 16 }}>
            <span
              className="absolute"
              style={{ left: 0, top: 1, width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--dp-accent)', background: 'transparent' }}
            />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--dp-text-muted)', marginBottom: 2 }}>Pickup</div>
            <button
              onClick={() => {
                const pickupUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.pickup_location)}`;
                window.open(pickupUrl, '_blank');
              }}
              className="text-left transition-opacity duration-200 hover:opacity-70"
              title="Open in Google Maps"
              style={{ display: 'block', width: '100%' }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--dp-text)', wordBreak: 'break-word' }}>{pickup.place || project.pickup_location}</div>
              {pickup.rest && <div style={{ fontSize: 12.5, color: 'var(--dp-text-muted)', wordBreak: 'break-word', marginTop: 1 }}>{pickup.rest}</div>}
            </button>
          </div>

          {/* Dropoff */}
          <div>
            <span
              className="absolute"
              style={{ left: 0, bottom: 0, width: 11, height: 11, borderRadius: 2, background: 'var(--dp-charge)' }}
            />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--dp-text-muted)', marginBottom: 2 }}>Dropoff</div>
            <button
              onClick={() => {
                const dropoffUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.dropoff_location)}`;
                window.open(dropoffUrl, '_blank');
              }}
              className="text-left transition-opacity duration-200 hover:opacity-70"
              title="Open in Google Maps"
              style={{ display: 'block', width: '100%' }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--dp-text)', wordBreak: 'break-word' }}>{dropoff.place || project.dropoff_location}</div>
              {dropoff.rest && <div style={{ fontSize: 12.5, color: 'var(--dp-text-muted)', wordBreak: 'break-word', marginTop: 1 }}>{dropoff.rest}</div>}
            </button>
          </div>
        </div>

        {/* 4. PRIMARY ACTIONS — Directions + Call */}
        <div className="grid grid-cols-2" style={{ gap: 9, marginBottom: 12 }}>
          <button
            onClick={() => {
              const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(project.pickup_location)}&destination=${encodeURIComponent(project.dropoff_location)}`;
              window.open(routeUrl, '_blank');
            }}
            className="flex items-center justify-center gap-2 transition-opacity duration-200 hover:opacity-80"
            style={{
              minHeight: 44,
              borderRadius: 10,
              background: 'var(--dp-accent)',
              color: 'var(--dp-on-accent)',
              fontSize: 13.5,
              fontWeight: 700,
            }}
            title="Get directions from pickup to dropoff"
          >
            <MapPin style={{ width: 15, height: 15 }} />
            <span>Directions</span>
          </button>
          <a
            href={`tel:${project.client_phone}`}
            className="flex items-center justify-center gap-2 transition-opacity duration-200 hover:opacity-80"
            style={{
              minHeight: 44,
              borderRadius: 10,
              border: '1px solid var(--dp-border)',
              background: 'transparent',
              color: 'var(--dp-text)',
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Phone style={{ width: 15, height: 15 }} />
            <span>Call Client</span>
          </a>
        </div>

        {/* 5. PHONE ROW (only when phone exists) */}
        {project.client_phone && (
          <div
            className="flex items-center gap-2"
            style={{
              background: 'var(--dp-surface-2)',
              border: '1px solid var(--dp-border)',
              borderRadius: 10,
              padding: '7px 7px 7px 12px',
              marginBottom: 12,
            }}
          >
            <Phone style={{ width: 14, height: 14, color: 'var(--dp-text-muted)', flexShrink: 0 }} />
            <span
              className="truncate"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--dp-text)', flex: 1, minWidth: 0 }}
            >
              {project.client_phone}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(project.client_phone || '');
                setCopiedId(project.id);
                setTimeout(() => setCopiedId(null), 2000);
              }}
              className="flex items-center gap-1.5 shrink-0 transition-colors duration-200"
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid var(--dp-border)',
                background: copiedId === project.id ? 'var(--dp-success-bg)' : 'var(--dp-surface)',
                color: copiedId === project.id ? 'var(--dp-success)' : 'var(--dp-text)',
                fontSize: 13,
                fontWeight: 600,
              }}
              title="Copy contact number"
            >
              {copiedId === project.id ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              <span>{copiedId === project.id ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* 6. META LINE */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5" style={{ fontSize: 12.5, color: 'var(--dp-text-secondary)', marginBottom: 12 }}>
          <span>{project.passengers} passenger{project.passengers !== 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--dp-border-strong)' }}>&middot;</span>
          <span>{carTypeName}</span>
          <span style={{ color: 'var(--dp-border-strong)' }}>&middot;</span>
          <span style={{ color: project.payment_status === 'paid' ? 'var(--dp-success)' : 'var(--dp-charge)' }}>
            {project.payment_status === 'paid' ? 'Already Paid' : 'Charge the Client'}
          </span>
        </div>

        {/* 7. SPECIAL INSTRUCTIONS */}
        {project.description && (
          <div
            style={{
              background: 'var(--dp-warning-bg)',
              borderLeft: '2px solid var(--dp-warning)',
              borderRadius: '0 8px 8px 0',
              padding: '10px 11px',
              marginBottom: 12,
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--dp-warning)', marginBottom: 3 }}>
              Special Instructions
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--dp-text-secondary)' }}>{project.description}</p>
          </div>
        )}

        {/* 8. ACCEPT / DECLINE (pending), START TRIP (accepted), COMPLETE (started) */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          {project.acceptance_status === 'pending' && (
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={updating}
                className="flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                style={{
                  minHeight: 44,
                  borderRadius: 10,
                  background: 'var(--dp-success)',
                  color: 'var(--dp-on-success)',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <CheckCircle style={{ width: 17, height: 17 }} />
                <span>{updating ? 'Accepting...' : 'Accept Trip'}</span>
              </button>
              <button
                onClick={() => handleStatusUpdate('declined')}
                disabled={updating}
                className="flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                style={{
                  minHeight: 44,
                  borderRadius: 10,
                  border: '1px solid color-mix(in srgb, var(--dp-danger) 40%, transparent)',
                  background: 'transparent',
                  color: 'var(--dp-danger)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <span>{updating ? 'Declining...' : 'Decline'}</span>
              </button>
            </div>
          )}

          {project.acceptance_status === 'accepted' && (
            <button
              onClick={() => handleStatusUpdate('started')}
              disabled={updating}
              className="flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style={{
                minHeight: 44,
                borderRadius: 10,
                background: 'var(--dp-accent)',
                color: 'var(--dp-on-accent)',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <PlayCircle style={{ width: 17, height: 17 }} />
              <span>{updating ? 'Starting...' : 'Start Trip'}</span>
            </button>
          )}

          {project.acceptance_status === 'started' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              disabled={updating}
              className="flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style={{
                minHeight: 44,
                borderRadius: 10,
                background: 'var(--dp-success)',
                color: 'var(--dp-on-success)',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <CheckCircle2 style={{ width: 17, height: 17 }} />
              <span>{updating ? 'Completing...' : 'Complete Trip'}</span>
            </button>
          )}
          {project.acceptance_status === 'completed' && (
            <div
              className="flex items-center justify-center gap-2"
              style={{
                minHeight: 44,
                borderRadius: 10,
                background: 'var(--dp-success-bg)',
                color: 'var(--dp-success)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 style={{ width: 17, height: 17 }} />
              <span>Trip Completed</span>
            </div>
          )}

          {project.acceptance_status === 'declined' && (
            <div
              className="flex items-center justify-center gap-2"
              style={{
                minHeight: 44,
                borderRadius: 10,
                background: 'var(--dp-charge-bg)',
                color: 'var(--dp-danger)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <XCircle style={{ width: 17, height: 17 }} />
              <span>Trip Declined</span>
            </div>
          )}
        </div>

        {/* 9. BOOKING REFERENCE */}
        {project.booking_id && (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 10.5, color: 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Booking Reference: {project.booking_id}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Dashboard Content Component
const DashboardContent = ({ driverName, onLogout }: { 
  driverName: string; 
  onLogout: () => void;
}) => {
  const { projects, companies, carTypes, payments, loading, error, refreshProjects, updateProjectStatus, addDriverPayment, retryCount, driverInfo } = useDriverData();
  const [refreshing, setRefreshing] = useState(false);
  const [showEarningsForm, setShowEarningsForm] = useState(false);
  const [paymentsExpanded, setPaymentsExpanded] = useState(false);
  const [earningsForm, setEarningsForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [submittingEarnings, setSubmittingEarnings] = useState(false);
  const [earningsError, setEarningsError] = useState('');
  const [earningsSuccess, setEarningsSuccess] = useState('');
  
  // Debug info
  useEffect(() => {
    console.log('DriverDashboard - Projects loaded:', projects.length);
    console.log('DriverDashboard - Driver info:', driverInfo);
    console.log('DriverDashboard - Loading:', loading);
    console.log('DriverDashboard - Error:', error);
  }, [projects, driverInfo, loading, error]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProjects();
    } finally {
      setRefreshing(false);
    }
  };

  // Get company name helper
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  // Get car type name helper
  const getCarTypeName = (carTypeId: string) => {
    const carType = carTypes.find(ct => ct.id === carTypeId);
    return carType?.name || 'Standard Vehicle';
  };

  // Organize projects by status and urgency
  const organizedProjects = useMemo(() => {
    const now = new Date();
    
    const categorized = {
      urgent: [] as any[],
      today: [] as any[],
      upcoming: [] as any[],
      completed: [] as any[]
    };

    projects.forEach(project => {
      if (project.status === 'completed') {
        categorized.completed.push(project);
        return;
      }

      const projectDateTime = new Date(`${project.date}T${project.time}`);
      const diffHours = (projectDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isToday = projectDateTime.toDateString() === now.toDateString();

      if (diffHours <= 2 && diffHours > 0) {
        categorized.urgent.push(project);
      } else if (isToday) {
        categorized.today.push(project);
      } else {
        categorized.upcoming.push(project);
      }
    });

    // Sort each category
    Object.keys(categorized).forEach(key => {
      categorized[key as keyof typeof categorized].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
    });

    return categorized;
  }, [projects]);

  const getDateLabel = useCallback((dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.getTime() === today.getTime();
    const isTomorrow = date.getTime() === tomorrow.getTime();

    return {
      main: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' }),
      sub: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }, []);

  const groupByDate = useCallback((items: any[]) => {
    const map = new Map<string, any[]>();
    items.forEach(p => {
      const key = p.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries());
  }, []);

  const stats = useMemo(() => {
    const pending = projects.filter(p => p.acceptance_status === 'pending').length;
    const accepted = projects.filter(p => p.acceptance_status === 'accepted').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const tripEarnings = projects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.driver_fee || p.price), 0);
    const paymentEarnings = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = tripEarnings + paymentEarnings;

    return { pending, accepted, completed, totalEarnings };
  }, [projects, payments]);

  const [earningsYear, setEarningsYear] = useState(new Date().getFullYear());

  const monthlyEarnings = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      label: new Date(earningsYear, i).toLocaleDateString('en-US', { month: 'short' }),
      fullLabel: new Date(earningsYear, i).toLocaleDateString('en-US', { month: 'long' }),
      trips: 0,
      tripEarnings: 0,
      paymentEarnings: 0,
      total: 0,
    }));

    projects
      .filter(p => p.status === 'completed')
      .forEach(p => {
        const d = new Date(p.date);
        if (d.getFullYear() === earningsYear) {
          const m = d.getMonth();
          months[m].trips += 1;
          months[m].tripEarnings += p.driver_fee || p.price;
        }
      });

    payments
      .filter(p => p.status === 'paid')
      .forEach(p => {
        const d = new Date(p.date);
        if (d.getFullYear() === earningsYear) {
          const m = d.getMonth();
          months[m].paymentEarnings += p.amount;
        }
      });

    months.forEach(m => { m.total = m.tripEarnings + m.paymentEarnings; });
    return months;
  }, [projects, payments, earningsYear]);

  const yearTotal = useMemo(() => monthlyEarnings.reduce((s, m) => s + m.total, 0), [monthlyEarnings]);
  const maxMonthly = useMemo(() => Math.max(...monthlyEarnings.map(m => m.total), 1), [monthlyEarnings]);
  const [earningsExpanded, setEarningsExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const selectedMonthTrips = useMemo(() => {
    if (selectedMonth === null) return [];
    return projects
      .filter(p => {
        const d = new Date(p.date);
        return p.status === 'completed' && d.getFullYear() === earningsYear && d.getMonth() === selectedMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projects, earningsYear, selectedMonth]);

  const selectedMonthPayments = useMemo(() => {
    if (selectedMonth === null) return [];
    return payments
      .filter(p => {
        const d = new Date(p.date);
        return p.status === 'paid' && d.getFullYear() === earningsYear && d.getMonth() === selectedMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, earningsYear, selectedMonth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--dp-bg)' }}>
        <div className="p-8 max-w-md w-full text-center" style={{ background: 'var(--dp-surface)', borderRadius: 'var(--dp-radius)', border: '1px solid var(--dp-border)' }}>
          <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ border: '4px solid var(--dp-border)', borderTopColor: 'var(--dp-accent)' }}></div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--dp-text)' }}>Loading Your Projects</h2>
          <p style={{ color: 'var(--dp-text-muted)' }}>
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Please wait while we fetch your assigned trips'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--dp-bg)' }}>
        <div className="p-8 max-w-md w-full text-center" style={{ background: 'var(--dp-surface)', borderRadius: 'var(--dp-radius)', border: '1px solid var(--dp-border)' }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--dp-danger)' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--dp-text)' }}>Unable to Load Projects</h2>
          <p className="mb-6" style={{ color: 'var(--dp-text-muted)' }}>{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors"
              style={{ background: 'var(--dp-danger)' }}
            >
              {refreshing ? 'Retrying...' : 'Try Again'}
            </button>
            <button
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--dp-surface-2)', color: 'var(--dp-text-secondary)' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--dp-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: 'var(--dp-surface)', borderBottom: '1px solid var(--dp-border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--dp-text)' }}>
                Welcome, {driverName}!
              </h1>
              <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>Your driver portal dashboard</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-lg transition-colors"
                style={{ color: refreshing ? 'var(--dp-text-muted)' : 'var(--dp-text-secondary)' }}
                title="Refresh projects"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors"
                style={{ color: 'var(--dp-danger)' }}
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pending', value: stats.pending, icon: Bell, valueColor: 'var(--dp-warning)' },
            { label: 'Accepted', value: stats.accepted, icon: CheckCircle, valueColor: 'var(--dp-accent)' },
            { label: 'Completed', value: stats.completed, icon: TrendingUp, valueColor: 'var(--dp-success)' },
            { label: 'Earnings', value: `€${stats.totalEarnings.toFixed(0)}`, icon: Wallet, valueColor: 'var(--dp-success)', hasAdd: true },
          ].map((tile) => (
            <div
              key={tile.label}
              className="p-4 flex items-start justify-between"
              style={{
                background: 'var(--dp-surface)',
                borderRadius: 'var(--dp-radius)',
                border: '1px solid var(--dp-border)',
                minHeight: 88,
              }}
            >
              <div className="flex flex-col justify-between h-full">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--dp-text-muted)' }}>{tile.label}</p>
                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: tile.valueColor }}>{tile.value}</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <tile.icon className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
                {tile.hasAdd && (
                  <button
                    onClick={() => setShowEarningsForm(true)}
                    className="flex items-center gap-0.5 text-[11px] font-semibold text-white px-2 py-1 rounded-md transition-colors"
                    style={{ background: 'var(--dp-success)' }}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {earningsSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-3 flex items-center gap-2"
              style={{
                background: 'var(--dp-success-bg)',
                color: 'var(--dp-success)',
                borderRadius: 'var(--dp-radius)',
                border: '1px solid var(--dp-success-bg)',
              }}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{earningsSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monthly Earnings Breakdown */}
        <div className="overflow-hidden" style={{ background: 'var(--dp-surface)', borderRadius: 'var(--dp-radius)', border: '1px solid var(--dp-border)' }}>
          <button
            onClick={() => { setEarningsExpanded(e => !e); if (earningsExpanded) setSelectedMonth(null); }}
            className="w-full px-5 py-4 flex items-center justify-between cursor-pointer transition-colors"
            style={{ borderBottom: '1px solid var(--dp-border)' }}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
              <div className="text-left">
                <h3 className="text-base font-semibold" style={{ color: 'var(--dp-text)' }}>Monthly Earnings</h3>
                <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>Total {earningsYear}: {'\u20AC'}{yearTotal.toFixed(2)}</p>
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 transition-transform duration-300 ${earningsExpanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--dp-text-muted)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${earningsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-5 pt-3 pb-1 flex items-center justify-center gap-2">
              <button
                onClick={() => { setEarningsYear(y => y - 1); setSelectedMonth(null); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--dp-text-muted)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-semibold min-w-[3rem] text-center" style={{ color: 'var(--dp-text-secondary)' }}>{earningsYear}</span>
              <button
                onClick={() => { setEarningsYear(y => y + 1); setSelectedMonth(null); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--dp-text-muted)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="p-5 pt-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {monthlyEarnings.map((m) => {
                  const barHeight = m.total > 0 ? Math.max((m.total / maxMonthly) * 100, 8) : 0;
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  const isCurrent = earningsYear === currentYear && m.month === currentMonth;
                  const isSelected = selectedMonth === m.month;
                  return (
                    <button
                      key={m.month}
                      onClick={() => setSelectedMonth(isSelected ? null : m.month)}
                      className="flex flex-col items-center p-2 rounded-xl transition-all duration-200"
                      style={{
                        background: isSelected ? 'var(--dp-accent-soft)' : isCurrent ? 'var(--dp-surface-2)' : 'transparent',
                        boxShadow: isSelected ? '0 0 0 2px var(--dp-accent)' : isCurrent ? '0 0 0 1px var(--dp-border)' : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'none',
                      }}
                    >
                      <span className="text-xs font-medium mb-2" style={{ color: 'var(--dp-text-muted)' }}>{m.label}</span>
                      <div className="w-full h-20 flex items-end justify-center mb-2">
                        <div
                          className="w-6 rounded-t-md transition-all duration-500"
                          style={{
                            height: `${barHeight}%`,
                            background: m.total > 0 ? 'var(--dp-accent)' : 'var(--dp-border)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: m.total > 0 ? 'var(--dp-text)' : 'var(--dp-text-muted)' }}>
                        {'\u20AC'}{m.total.toFixed(0)}
                      </span>
                      {m.trips > 0 && (
                        <span className="text-[10px] mt-0.5" style={{ color: 'var(--dp-text-muted)' }}>{m.trips} trip{m.trips !== 1 ? 's' : ''}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expanded month detail */}
            {selectedMonth !== null && (
              <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--dp-border)' }}>
                <div className="pt-4">
                  <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--dp-text)' }}>
                    {monthlyEarnings[selectedMonth].fullLabel} {earningsYear} Details
                  </h4>

                  {selectedMonthTrips.length === 0 && selectedMonthPayments.length === 0 ? (
                    <p className="text-sm py-4 text-center" style={{ color: 'var(--dp-text-muted)' }}>No earnings this month</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedMonthTrips.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--dp-text-muted)' }}>Completed Trips</p>
                          <div className="space-y-1.5">
                            {selectedMonthTrips.map((trip) => (
                              <div key={trip.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--dp-surface-2)' }}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Car className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--dp-text-muted)' }} />
                                  <div className="min-w-0">
                                    <p className="text-sm truncate" style={{ color: 'var(--dp-text)' }}>
                                      {trip.pickup_location || 'Pickup'} → {trip.dropoff_location || 'Dropoff'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                                      {new Date(trip.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                      {trip.time ? ` at ${trip.time}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-semibold shrink-0 ml-2" style={{ color: 'var(--dp-success)' }}>
                                  {'\u20AC'}{(trip.driver_fee || trip.price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedMonthPayments.length > 0 && (
                        <div className={selectedMonthTrips.length > 0 ? 'mt-3' : ''}>
                          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--dp-text-muted)' }}>Payments</p>
                          <div className="space-y-1.5">
                            {selectedMonthPayments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--dp-surface-2)' }}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Wallet className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--dp-text-muted)' }} />
                                  <div className="min-w-0">
                                    <p className="text-sm truncate" style={{ color: 'var(--dp-text)' }}>{payment.description || 'Payment'}</p>
                                    <p className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                                      {new Date(payment.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-semibold shrink-0 ml-2" style={{ color: 'var(--dp-success)' }}>
                                  {'\u20AC'}{payment.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-2" style={{ borderTop: '1px solid var(--dp-border)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--dp-text-secondary)' }}>Month Total</span>
                        <span className="text-base font-bold" style={{ color: 'var(--dp-success)' }}>
                          {'\u20AC'}{monthlyEarnings[selectedMonth].total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Categories */}
        {organizedProjects.urgent.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--dp-danger)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--dp-text)' }}>Urgent - Starting Soon!</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--dp-charge-bg)', color: 'var(--dp-danger)' }}
              >
                {organizedProjects.urgent.length} trip{organizedProjects.urgent.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {groupByDate(organizedProjects.urgent).map(([dateKey, trips]) => {
                const dl = getDateLabel(dateKey);
                return (
                  <div key={dateKey} className="space-y-3">
                    <DateStripHeader label={dl} count={trips.length} variant="urgent" />
                    <div className="grid gap-4 md:grid-cols-2">
                      {trips.map((project: any) => (
                        <DriverProjectCard key={project.id} project={project} companyName={getCompanyName(project.company_id)} carTypeName={getCarTypeName(project.car_type_id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {organizedProjects.today.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--dp-text)' }}>Today's Trips</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}
              >
                {organizedProjects.today.length} trip{organizedProjects.today.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {groupByDate(organizedProjects.today).map(([dateKey, trips]) => {
                const dl = getDateLabel(dateKey);
                return (
                  <div key={dateKey} className="space-y-3">
                    <DateStripHeader label={dl} count={trips.length} />
                    <div className="grid gap-4 md:grid-cols-2">
                      {trips.map((project: any) => (
                        <DriverProjectCard key={project.id} project={project} companyName={getCompanyName(project.company_id)} carTypeName={getCarTypeName(project.car_type_id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {organizedProjects.upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--dp-text)' }}>Upcoming Trips</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}
              >
                {organizedProjects.upcoming.length} trip{organizedProjects.upcoming.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {groupByDate(organizedProjects.upcoming).map(([dateKey, trips]) => {
                const dl = getDateLabel(dateKey);
                return (
                  <div key={dateKey} className="space-y-3">
                    <DateStripHeader label={dl} count={trips.length} />
                    <div className="grid gap-4 md:grid-cols-2">
                      {trips.map((project: any) => (
                        <DriverProjectCard key={project.id} project={project} companyName={getCompanyName(project.company_id)} carTypeName={getCarTypeName(project.car_type_id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Projects State */}
        {projects.length === 0 && (
          <div className="p-12 text-center" style={{ background: 'var(--dp-surface)', borderRadius: 'var(--dp-radius)', border: '1px solid var(--dp-border)' }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--dp-surface-2)' }}
            >
              <Car className="w-8 h-8" style={{ color: 'var(--dp-text-muted)' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--dp-text)' }}>No trips assigned yet</h3>
            <p className="mb-6" style={{ color: 'var(--dp-text-muted)' }}>
              Your dispatcher hasn't assigned any trips to you yet. Check back later or contact them directly.
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
              style={{ background: 'var(--dp-accent)' }}
            >
              {refreshing ? 'Checking...' : 'Check for New Trips'}
            </button>
          </div>
        )}

        {/* Completed Trips Summary */}
        {organizedProjects.completed.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--dp-text)' }}>Recently Completed</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--dp-surface-2)', color: 'var(--dp-text-secondary)' }}
              >
                {organizedProjects.completed.length} trip{organizedProjects.completed.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Show only last 3 completed trips */}
            <div className="grid gap-4 md:grid-cols-2">
              {organizedProjects.completed.slice(0, 3).map(project => (
                <div
                  key={project.id}
                  className="p-4 opacity-75"
                  style={{ background: 'var(--dp-surface)', borderRadius: 'var(--dp-radius)', border: '1px solid var(--dp-border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium" style={{ color: 'var(--dp-text)' }}>{project.client_name}</h4>
                    <span className="font-bold tabular-nums" style={{ color: 'var(--dp-success)' }}>€{(project.driver_fee || project.price).toFixed(2)}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>{formatDate(project.date)} at {formatTime(project.time)}</p>
                  <div className="flex items-center mt-2 gap-1">
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--dp-success)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--dp-success)' }}>Completed</span>
                  </div>
                </div>
              ))}
            </div>
            
            {organizedProjects.completed.length > 3 && (
              <div className="text-center mt-4">
                <span className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>
                  {organizedProjects.completed.length - 3} more completed trips
                </span>
              </div>
            )}
          </div>
        )}

        {/* Earnings / Payments Section */}
        <div className="overflow-hidden" style={{ background: 'var(--dp-surface)', borderRadius: 'var(--dp-radius)', border: '1px solid var(--dp-border)' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPaymentsExpanded(e => !e)}
              className="flex-1 px-5 py-4 flex items-center gap-3 cursor-pointer transition-colors"
            >
              <Wallet className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
              <div className="text-left">
                <h2 className="text-base font-semibold" style={{ color: 'var(--dp-text)' }}>Earnings & Payments</h2>
                <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>{payments.length} record{payments.length !== 1 ? 's' : ''}</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 transition-transform duration-300 ml-auto ${paymentsExpanded ? 'rotate-180' : ''}`}
                style={{ color: 'var(--dp-text-muted)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="pr-4">
              <button
                onClick={() => {
                  setShowEarningsForm(true);
                  setEarningsError('');
                  setEarningsForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
                }}
                className="flex items-center gap-1 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--dp-success)' }}
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Add Earnings Modal */}
          {showEarningsForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md p-6" style={{ background: 'var(--dp-surface)', borderRadius: 'var(--dp-radius)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--dp-text)' }}>Add Manual Earnings</h3>
                  <button onClick={() => setShowEarningsForm(false)} className="p-1 rounded-lg" style={{ color: 'var(--dp-text-muted)' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {earningsError && (
                  <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--dp-charge-bg)', color: 'var(--dp-danger)' }}>
                    {earningsError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dp-text-secondary)' }}>Amount (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={earningsForm.amount}
                      onChange={(e) => setEarningsForm({ ...earningsForm, amount: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ border: '1px solid var(--dp-border)', background: 'var(--dp-surface)', color: 'var(--dp-text)', ['--tw-ring-color' as string]: 'var(--dp-accent)' }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dp-text-secondary)' }}>Date</label>
                    <input
                      type="date"
                      value={earningsForm.date}
                      onChange={(e) => setEarningsForm({ ...earningsForm, date: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ border: '1px solid var(--dp-border)', background: 'var(--dp-surface)', color: 'var(--dp-text)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dp-text-secondary)' }}>Description</label>
                    <input
                      type="text"
                      value={earningsForm.description}
                      onChange={(e) => setEarningsForm({ ...earningsForm, description: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                      style={{ border: '1px solid var(--dp-border)', background: 'var(--dp-surface)', color: 'var(--dp-text)' }}
                      placeholder="e.g. Cash tip, Private ride"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEarningsForm(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
                    style={{ border: '1px solid var(--dp-border)', color: 'var(--dp-text-secondary)', background: 'var(--dp-surface)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const amount = parseFloat(earningsForm.amount);
                      if (!amount || amount <= 0) {
                        setEarningsError('Please enter a valid amount');
                        return;
                      }
                      if (!earningsForm.date) {
                        setEarningsError('Please select a date');
                        return;
                      }
                      setSubmittingEarnings(true);
                      setEarningsError('');
                      setEarningsSuccess('');
                      try {
                        await addDriverPayment(amount, earningsForm.date, earningsForm.description || 'Manual earnings');
                        setEarningsForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
                        setShowEarningsForm(false);
                        setEarningsSuccess('Earnings added successfully!');
                        setTimeout(() => setEarningsSuccess(''), 3000);
                      } catch (err: any) {
                        console.error('Earnings submit error:', err);
                        setEarningsError(err?.message || 'Failed to add earnings. Please try again.');
                      } finally {
                        setSubmittingEarnings(false);
                      }
                    }}
                    disabled={submittingEarnings}
                    className="flex-1 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{ background: 'var(--dp-success)' }}
                  >
                    {submittingEarnings ? 'Adding...' : 'Add Earnings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Payments List */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${paymentsExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div style={{ borderTop: '1px solid var(--dp-border)' }}>
              {payments.length > 0 ? (
                <div className="p-4 space-y-2">
                  {payments.slice(0, 10).map(payment => (
                    <div key={payment.id} className="rounded-lg px-4 py-3" style={{ background: 'var(--dp-surface-2)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm truncate" style={{ color: 'var(--dp-text)' }}>{payment.description || 'Payment'}</span>
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                              style={{
                                background: payment.source === 'driver' ? 'var(--dp-accent-soft)' : 'var(--dp-surface)',
                                color: payment.source === 'driver' ? 'var(--dp-accent)' : 'var(--dp-text-muted)',
                              }}
                            >
                              {payment.source === 'driver' ? 'Added by you' : 'From dispatcher'}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                            {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-base font-bold tabular-nums" style={{ color: 'var(--dp-success)' }}>{'\u20AC'}{payment.amount.toFixed(2)}</span>
                          <p
                            className="text-[11px] font-semibold"
                            style={{ color: payment.status === 'paid' ? 'var(--dp-success)' : 'var(--dp-warning)' }}
                          >
                            {payment.status === 'paid' ? 'Paid' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {payments.length > 10 && (
                    <div className="text-center pt-1">
                      <span className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>{payments.length - 10} more payments</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Wallet className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--dp-border-strong)' }} />
                  <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>No payment records yet. Add your earnings manually or wait for dispatcher payments.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Date strip header used by all trip categories
function DateStripHeader({ label, count, variant }: { label: { main: string; sub: string }; count: number; variant?: 'urgent' }) {
  const bg = variant === 'urgent' ? 'var(--dp-danger)' : 'var(--dp-accent)';
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ background: bg, borderRadius: 'var(--dp-radius)' }}
    >
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-white/80" />
        <div>
          <h3 className="text-base font-bold text-white leading-tight">{label.main}</h3>
          <p className="text-white/70 text-sm">{label.sub}</p>
        </div>
      </div>
      <div className="bg-white/20 px-3 py-1.5 rounded-lg text-center">
        <span className="text-lg font-bold text-white tabular-nums">{count}</span>
        <p className="text-white/70 text-[11px]">trip{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}

// Helper functions for date formatting
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (time: string) => {
  return time.substring(0, 5);
};

// Main Dashboard Component
export default function DriverDashboard({ driverId, driverName, driverUuid, onLogout }: DriverDashboardProps) {
  return (
    <DriverDataProvider driverId={driverId} driverUuid={driverUuid}>
      <DashboardContent driverName={driverName} onLogout={onLogout} />
    </DriverDataProvider>
  );
}
