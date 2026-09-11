import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Car, Users, CreditCard, BarChart2, FileText, Settings,
  LogOut, Search, Plus, RefreshCw, Bell, X, Menu, ChevronDown, Bot,
  Gauge, Building2, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface ChannelItem {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface DispatchLayoutProps {
  children: React.ReactNode;
  channels?: ChannelItem[];
  activeChannel?: string | null;
  onChannelSelect?: (id: string | null) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  rideCount?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  pageTitle?: string;
}

const CHANNEL_COLORS = [
  '#0D6B60', '#2A7F50', '#A86A12', '#B84A1A', '#3B6FA0',
  '#7A5C3E', '#5B7A3E', '#3E5B7A', '#7A3E5B', '#3E7A6A',
];

function getChannelColor(index: number): string {
  return CHANNEL_COLORS[index % CHANNEL_COLORS.length];
}

const NAV_ITEMS = [
  { id: 'dispatch', label: 'Dispatch', icon: Car, path: '/dashboard' },
  { id: 'completed', label: 'Completed Projects', icon: ClipboardCheck, path: '/completed-projects' },
  { id: 'drivers', label: 'Drivers', icon: Users, path: '/settings/drivers' },
  { id: 'statistics', label: 'Statistics', icon: BarChart2, path: '/statistics' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/financial-report' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, path: '/ai-assistant' },
];

const SETTINGS_SUB_ITEMS = [
  { id: 'settings-capacity', label: 'Project Capacity', icon: Gauge, path: '/settings/general' },
  { id: 'settings-companies', label: 'Companies', icon: Building2, path: '/settings/companies' },
  { id: 'settings-car-types', label: 'Car Types', icon: Car, path: '/settings/car-types' },
  { id: 'settings-drivers', label: 'Drivers', icon: Users, path: '/settings/drivers' },
  { id: 'settings-payments', label: 'Payments', icon: CreditCard, path: '/settings/payments' },
  { id: 'settings-notifications', label: 'Notifications', icon: Bell, path: '/settings/notifications' },
];

export default function DispatchLayout({
  children,
  channels,
  activeChannel,
  onChannelSelect,
  searchQuery,
  onSearchChange,
  rideCount,
  onRefresh,
  isRefreshing,
  pageTitle,
}: DispatchLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings'));
  const [now, setNow] = useState(new Date());
  const searchRef = useRef<HTMLInputElement>(null);

  const hasDispatchProps = channels !== undefined && onChannelSelect !== undefined && onSearchChange !== undefined;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setSidebarOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch { navigate('/'); }
  };

  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const allChannelsCount = channels ? channels.reduce((s, c) => s + c.count, 0) : 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--dp-bg)', color: 'var(--dp-text)', fontFamily: 'var(--font-body)' }}>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-transform duration-250 ease-out
          lg:sticky lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--dp-sidebar-w)',
          background: 'var(--dp-surface)',
          borderRight: '1px solid var(--dp-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0" style={{ borderBottom: '1px solid var(--dp-border)' }}>
          <Car className="w-6 h-6" style={{ color: 'var(--dp-accent)' }} />
          <span className="font-heading text-lg tracking-tight" style={{ color: 'var(--dp-text)' }}>RidePilot</span>
          <button className="ml-auto lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              if (!item.path) return null;
              const Icon = item.icon;
              const isActive = item.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.path!); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: isActive ? 'var(--dp-accent-soft)' : 'transparent',
                    color: isActive ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                  {item.id === 'dispatch' && (
                    <span
                      className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}
                    >
                      {rideCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Settings accordion */}
            {(() => {
              const isAnySettingsActive = location.pathname.startsWith('/settings');
              return (
                <div>
                  <button
                    onClick={() => setSettingsOpen(prev => !prev)}
                    aria-expanded={settingsOpen}
                    aria-controls="settings-submenu"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: isAnySettingsActive && !settingsOpen ? 'var(--dp-accent-soft)' : 'transparent',
                      color: isAnySettingsActive ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                    }}
                  >
                    <Settings className="w-[18px] h-[18px]" />
                    <span>Settings</span>
                    <ChevronDown
                      className="w-4 h-4 ml-auto transition-transform duration-200"
                      style={{
                        transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--dp-text-muted)',
                      }}
                    />
                  </button>
                  <div
                    id="settings-submenu"
                    className="overflow-hidden transition-all duration-200"
                    style={{
                      maxHeight: settingsOpen ? `${SETTINGS_SUB_ITEMS.length * 44}px` : '0px',
                      opacity: settingsOpen ? 1 : 0,
                    }}
                  >
                    <div className="relative ml-[15px] pl-[18px] mt-0.5 space-y-0.5" style={{ borderLeft: '1px solid var(--dp-border)' }}>
                      {SETTINGS_SUB_ITEMS.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = location.pathname.startsWith(sub.path);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => { navigate(sub.path); setSidebarOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                            style={{
                              minHeight: 40,
                              background: isSubActive ? 'var(--dp-accent-soft)' : 'transparent',
                              color: isSubActive ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                            }}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Channels (only when dispatch props provided) */}
          {hasDispatchProps && channels && channels.length > 0 && (
          <div className="mt-6">
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dp-text-muted)' }}>
              Channels
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => onChannelSelect!(null)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: activeChannel === null ? 'var(--dp-accent-soft)' : 'transparent',
                  color: activeChannel === null ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                  fontWeight: activeChannel === null ? 500 : 400,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--dp-text-muted)' }} />
                <span>All channels</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                  {allChannelsCount}
                </span>
              </button>
              {channels.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => onChannelSelect!(activeChannel === ch.id ? null : ch.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: activeChannel === ch.id ? 'var(--dp-accent-soft)' : 'transparent',
                    color: activeChannel === ch.id ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                    fontWeight: activeChannel === ch.id ? 500 : 400,
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ch.color || getChannelColor(i) }} />
                  <span className="truncate">{ch.name}</span>
                  <span className="ml-auto text-xs flex-shrink-0" style={{ color: 'var(--dp-text-muted)' }}>
                    {ch.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}
        </nav>

        {/* User block */}
        <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid var(--dp-border)' }}>
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}
            >
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--dp-text)' }}>
                {currentUser?.email?.split('@')[0] || 'User'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--dp-text-muted)' }}
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30"
          style={{
            height: 'var(--dp-topbar-h)',
            background: 'var(--dp-surface)',
            borderBottom: '1px solid var(--dp-border)',
          }}
        >
          {/* Mobile menu toggle */}
          <button className="lg:hidden p-1.5 -ml-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" style={{ color: 'var(--dp-text-secondary)' }} />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Car className="w-5 h-5" style={{ color: 'var(--dp-accent)' }} />
            <span className="font-heading text-base">RidePilot</span>
          </div>

          {/* Title + date */}
          <div className="hidden lg:flex items-baseline gap-3">
            <h1 className="font-heading text-xl" style={{ color: 'var(--dp-text)' }}>{pageTitle || 'Dispatch'}</h1>
            {!pageTitle && (
            <span className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>
              {dateStr} · {timeStr}
            </span>
            )}
          </div>

          {/* Search (only when dispatch props provided) */}
          {hasDispatchProps ? (
          <div className="flex-1 max-w-md ml-auto lg:ml-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
              <input
                ref={searchRef}
                type="text"
                placeholder='Search client, place, booking #   press "/"'
                value={searchQuery}
                onChange={(e) => onSearchChange!(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-colors"
                style={{
                  background: 'var(--dp-surface-2)',
                  border: '1px solid var(--dp-border)',
                  color: 'var(--dp-text)',
                }}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5"
                  onClick={() => onSearchChange!('')}
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--dp-text-muted)' }} />
                </button>
              )}
            </div>
          </div>
          ) : <div className="flex-1" />}

          {/* Actions (only when dispatch props provided) */}
          {hasDispatchProps && (
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--dp-text-muted)' }}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/new-project')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--dp-accent)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New ride</span>
            </button>
          </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          {children}
        </main>
      </div>
    </div>
  );
}

export { getChannelColor };
export type { ChannelItem };
