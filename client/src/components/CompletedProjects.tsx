import React, { useState, useEffect } from 'react';
import { Check, MapPin, Users, ClipboardCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import DispatchLayout from './dispatch/DispatchLayout';

// Color palette for company themes
const companyColorPalette = [
  'blue',   // Primary blue
  'green',  // Primary green
  'purple', // Deep purple
  'amber',  // Warm amber
  'teal',   // Teal/cyan
  'red',    // Warm red
  'indigo', // Deep indigo
  'pink',   // Vibrant pink
  'orange', // Bright orange
  'emerald' // Rich emerald
];

const getCompanyTheme = (companyName: string, companyId?: string) => {
  // Load custom colors from localStorage
  const savedColors = localStorage.getItem('companyColors');
  const companyColors = savedColors ? JSON.parse(savedColors) : {};
  
  // If we have a saved color for this company, use it
  if (companyId && companyColors[companyId]) {
    return companyColors[companyId]; // This could be a predefined color name or a hex color
  }
  
  // Pre-defined mappings for specific companies
  const specificThemes: Record<string, string> = {
    'RideConnect': 'rideconnect', // Custom #BF3131 red
    'AlphaTransfers': 'purple',
    'EcoRides': 'emerald',
    'LuxuryTransport': 'amber',
    'SpeedyShuttle': 'red',
    'VIATOR': 'viator',         // Custom #328E6E green
    'BOOKING': 'booking'        // Custom #3D365C purple
  };
  
  // If we have a specific theme for this company, use it
  if (companyName && specificThemes[companyName]) {
    return specificThemes[companyName];
  }
  
  // Otherwise, generate a deterministic color based on the company name or ID
  if (companyId) {
    // Create a simple hash from the company ID
    const hashValue = companyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Use the hash to pick a color from the palette
    return companyColorPalette[hashValue % companyColorPalette.length];
  }
  
  // Default to green if nothing else works
  return 'green';
};

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6', green: '#22c55e', purple: '#a855f7', amber: '#f59e0b',
  teal: '#14b8a6', red: '#ef4444', indigo: '#6366f1', pink: '#ec4899',
  orange: '#f97316', emerald: '#10b981',
  viator: '#328E6E', booking: '#3D365C', rideconnect: '#BF3131',
};

function resolveColor(theme: string): string {
  if (theme.startsWith('#')) return theme;
  return COLOR_MAP[theme] || '#6b7280';
}

export default function CompletedProjects() {
  const { projects, companies, drivers, carTypes } = useData();
  const navigate = useNavigate();
  const [groupedProjects, setGroupedProjects] = useState<{ [key: string]: any[] }>({});

  // Remember company colors to keep them consistent in the UI
  const [companyColorCache] = React.useState<Record<string, string>>({});

  const getCompanyName = (id: string) => {
    const company = companies.find(c => c.id === id);
    return company?.name || 'Unknown Company';
  };

  const getDriverName = (id: string) => {
    const driver = drivers.find(d => d.id === id);
    return driver?.name || 'Unknown Driver';
  };
  
  const getCarTypeName = (id: string) => {
    const carType = carTypes.find(c => c.id === id);
    return carType?.name || 'Standard';
  };

  const getCompanyColorTheme = (companyId: string) => {
    if (!companyColorCache[companyId]) {
      const companyName = getCompanyName(companyId);
      companyColorCache[companyId] = getCompanyTheme(companyName, companyId);
    }
    return companyColorCache[companyId];
  };

  // Group completed projects by date
  useEffect(() => {
    const completedProjects = projects
      .filter(p => p.status === 'completed')
      .sort((a, b) => {
        // Sort by date in descending order (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    const grouped = completedProjects.reduce((acc, project) => {
      const date = new Date(project.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(project);
      return acc;
    }, {} as { [key: string]: typeof completedProjects });

    setGroupedProjects(grouped);
  }, [projects]);

  return (
    <DispatchLayout pageTitle="Completed Projects">
      <div style={{ maxWidth: 1100 }} className="mx-auto">
        {Object.keys(groupedProjects).length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              background: 'var(--dp-surface)',
              border: '1px solid var(--dp-border)',
              borderRadius: 'var(--dp-radius)',
            }}
          >
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--dp-text-muted)' }} />
            <p className="text-base" style={{ color: 'var(--dp-text-muted)' }}>No completed projects yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {Object.entries(groupedProjects).map(([dateKey, dateProjects]) => (
              <React.Fragment key={dateKey}>
                {/* Sticky date header */}
                <div
                  className="sticky top-0 z-10 px-3 py-2 text-xs font-semibold flex items-center justify-between"
                  style={{
                    background: 'var(--dp-surface-2)',
                    color: 'var(--dp-text-secondary)',
                    borderBottom: '1px solid var(--dp-border)',
                  }}
                >
                  <span style={{ color: 'var(--dp-text)' }}>
                    {new Date(dateKey).toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <span style={{ color: 'var(--dp-text-muted)' }}>
                    {dateProjects.length} ride{dateProjects.length !== 1 ? 's' : ''} ·{' '}
                    <span className="font-heading tabular-nums">
                      €{Math.round(dateProjects.reduce((s: number, p: any) => s + p.price, 0))}
                    </span>
                  </span>
                </div>

                {/* Project cards */}
                <div className="space-y-2 py-2">
                  {dateProjects.map((project: any) => {
                    const colorTheme = getCompanyColorTheme(project.company);
                    const dotColor = resolveColor(colorTheme);
                    const pickup = splitAddress(project.pickupLocation);
                    const dropoff = splitAddress(project.dropoffLocation);

                    return (
                      <div
                        key={project.id}
                        className="relative overflow-hidden"
                        style={{
                          background: 'var(--dp-surface)',
                          border: '1px solid var(--dp-border)',
                          borderRadius: 'var(--dp-radius)',
                        }}
                      >
                        {/* Thin left accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0"
                          style={{ width: 3, background: dotColor }}
                        />

                        {/* Desktop row */}
                        <div className="hidden md:grid md:grid-cols-[70px_1fr_1fr_140px_90px] gap-4 p-4 pl-5 items-start">
                          {/* Time */}
                          <div>
                            <span className="font-heading text-[22px] leading-none tabular-nums" style={{ color: 'var(--dp-text)' }}>
                              {project.time.substring(0, 5)}
                            </span>
                            <div className="mt-1">
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
                                style={{ background: 'var(--dp-success-bg)', color: 'var(--dp-success)' }}
                              >
                                <Check className="w-3 h-3" />
                                Completed
                              </span>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="flex gap-3 min-w-0">
                            <RouteLine />
                            <div className="flex flex-col gap-3 min-w-0">
                              <AddressBlock place={pickup.place} rest={pickup.rest} />
                              <AddressBlock place={dropoff.place} rest={dropoff.rest} />
                            </div>
                          </div>

                          {/* Client & meta */}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--dp-text)' }}>
                              {project.clientName || 'Anonymous'}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--dp-text-muted)' }}>
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {project.passengers} pax
                              </span>
                              <span>{getCarTypeName(project.carType)}</span>
                              <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                                {getCompanyName(project.company)}
                              </span>
                            </div>
                            {project.bookingId && (
                              <div className="text-[11px] mt-1" style={{ color: 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                #{project.bookingId}
                              </div>
                            )}
                          </div>

                          {/* Driver */}
                          <div className="text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                            {getDriverName(project.driver)}
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <span className="font-heading text-[17px] tabular-nums" style={{ color: 'var(--dp-text)' }}>
                              €{project.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Mobile stacked */}
                        <div className="md:hidden p-3 pl-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="font-heading text-[20px] leading-none tabular-nums" style={{ color: 'var(--dp-text)' }}>
                                {project.time.substring(0, 5)}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--dp-success-bg)', color: 'var(--dp-success)' }}
                              >
                                <Check className="w-2.5 h-2.5" /> Done
                              </span>
                            </div>
                            <span className="font-heading text-[16px] tabular-nums" style={{ color: 'var(--dp-text)' }}>
                              €{project.price.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <RouteLine small />
                            <div className="flex flex-col gap-2 min-w-0">
                              <AddressBlock place={pickup.place} rest={pickup.rest} small />
                              <AddressBlock place={dropoff.place} rest={dropoff.rest} small />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5" style={{ borderTop: '1px solid var(--dp-border)' }}>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold" style={{ color: 'var(--dp-text)' }}>
                                {project.clientName || 'Anonymous'}
                              </span>
                              <div className="text-xs mt-0.5" style={{ color: 'var(--dp-text-muted)' }}>
                                {project.passengers} pax · {getCarTypeName(project.carType)}
                                <span className="inline-flex items-center gap-1 ml-1">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                                  {getCompanyName(project.company)}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs flex-shrink-0" style={{ color: 'var(--dp-text-secondary)' }}>
                              {getDriverName(project.driver)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </DispatchLayout>
  );
}

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
      <div className={`${small ? 'text-xs' : 'text-sm'} font-semibold truncate`} style={{ color: 'var(--dp-text)' }}>
        {place || '–'}
      </div>
      {rest && (
        <div className={`${small ? 'text-[10px]' : 'text-xs'} leading-tight`} style={{ color: 'var(--dp-text-muted)', wordBreak: 'break-word' }}>
          {rest}
        </div>
      )}
    </div>
  );
}

function splitAddress(addr: string): { place: string; rest: string } {
  if (!addr) return { place: '', rest: '' };
  const commaIdx = addr.indexOf(',');
  if (commaIdx === -1) return { place: addr, rest: '' };
  return { place: addr.slice(0, commaIdx), rest: addr.slice(commaIdx + 1).trim() };
}
