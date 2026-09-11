import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import LoginForm from './auth/LoginForm';
import SignUpForm from './auth/SignUpForm';
import {
  Car, MapPin, Phone, Check, MessageCircle, Search, Plus, Menu,
  BarChart3, Users, Shield, TrendingUp, Clock, Copy, Wifi, Battery,
  Signal, ChevronDown, FileText, Sparkles, Upload, ArrowDown,
  LayoutDashboard, Route, Bot, Hash, Globe, PhoneCall, Truck,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Dark-scoped token style block applied on the wrapper               */
/* ------------------------------------------------------------------ */
const darkTokens: React.CSSProperties = {
  ['--dp-bg' as string]: '#0E1311',
  ['--dp-surface' as string]: '#151C19',
  ['--dp-surface-2' as string]: '#1A2320',
  ['--dp-text' as string]: '#E6EBE8',
  ['--dp-text-secondary' as string]: '#B4BDB8',
  ['--dp-text-muted' as string]: '#818B86',
  ['--dp-border' as string]: '#25302B',
  ['--dp-accent' as string]: '#47B3A2',
  ['--dp-accent-soft' as string]: '#15302B',
  ['--dp-success' as string]: '#5FC28C',
  ['--dp-success-bg' as string]: '#152B1F',
  ['--dp-warning' as string]: '#E3AA4B',
  ['--dp-warning-bg' as string]: '#2B2010',
  ['--dp-charge' as string]: '#EE8A5B',
  ['--dp-charge-bg' as string]: '#2B1A10',
  ['--dp-danger' as string]: '#F87171',
  ['--dp-radius' as string]: '13px',
};

const V = {
  bg: 'var(--dp-bg)',
  surface: 'var(--dp-surface)',
  surface2: 'var(--dp-surface-2)',
  text: 'var(--dp-text)',
  textSec: 'var(--dp-text-secondary)',
  muted: 'var(--dp-text-muted)',
  border: 'var(--dp-border)',
  accent: 'var(--dp-accent)',
  accentSoft: 'var(--dp-accent-soft)',
  success: 'var(--dp-success)',
  successBg: 'var(--dp-success-bg)',
  warning: 'var(--dp-warning)',
  warningBg: 'var(--dp-warning-bg)',
  charge: 'var(--dp-charge)',
  chargeBg: 'var(--dp-charge-bg)',
  danger: 'var(--dp-danger)',
  radius: 'var(--dp-radius)',
  onAccent: '#08211D',
  onSuccess: '#07210F',
};

/* ------------------------------------------------------------------ */
/*  Tiny helpers                                                       */
/* ------------------------------------------------------------------ */
function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function Divider({ vertical = false }: { vertical?: boolean }) {
  if (vertical) return <span style={{ width: 1, alignSelf: 'stretch', background: V.border }} />;
  return <span style={{ height: 1, width: '100%', background: V.border, display: 'block' }} />;
}
function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color, display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: '16px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}
function SectionKicker({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: V.accent, marginBottom: 10 }}>{children}</p>;
}

/* ------------------------------------------------------------------ */
/*  Dashboard mockup sub-components                                    */
/* ------------------------------------------------------------------ */

function MockSidebar() {
  const items = [
    { icon: LayoutDashboard, label: 'Dispatch', active: true, badge: '18' },
    { icon: Route, label: 'Rides' },
    { icon: Truck, label: 'Drivers' },
    { icon: Users, label: 'Clients' },
    { icon: Shield, label: 'Companies' },
    { icon: BarChart3, label: 'Reports' },
    { icon: Bot, label: 'AI Assistant' },
  ];
  const channels = [
    { label: 'Web booking', count: '42' },
    { label: 'Partner agency', count: '27' },
    { label: 'Phone', count: '13' },
  ];
  return (
    <div style={{ width: 190, background: V.surface, borderRight: `1px solid ${V.border}`, display: 'flex', flexDirection: 'column', padding: '14px 10px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 6px', marginBottom: 18 }}>
        <Car style={{ width: 18, height: 18, color: V.accent }} />
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: V.text }}>RidePilot</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => (
          <div key={it.label} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8,
            background: it.active ? V.accentSoft : 'transparent',
            color: it.active ? V.accent : V.muted, fontSize: 12.5, fontWeight: it.active ? 600 : 500,
          }}>
            <it.icon style={{ width: 14, height: 14 }} />
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.badge && <Badge bg={V.accentSoft} color={V.accent}>{it.badge}</Badge>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: V.muted, padding: '0 8px', display: 'block', marginBottom: 6 }}>Channels</span>
        {channels.map(ch => (
          <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', fontSize: 12, color: V.textSec }}>
            <Hash style={{ width: 12, height: 12, color: V.muted }} />
            <span style={{ flex: 1 }}>{ch.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: V.muted }}>{ch.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSummaryRow() {
  const cols = [
    { label: 'NEXT 24 HOURS', val: '18', sub: '€5,240' },
    { label: 'NEXT 7 DAYS', val: '82', sub: '€24,900' },
    { label: 'AWAITING REPLY', val: '24', color: V.warning },
    { label: 'NO DRIVER YET', val: '11', color: V.charge },
    { label: 'TO CHARGE', val: '29', sub: '€8,760', color: V.charge },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {cols.map((c, i) => (
        <React.Fragment key={c.label}>
          {i > 0 && <Divider vertical />}
          <div style={{ flex: '1 1 0', minWidth: 100, padding: '10px 14px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: V.muted, marginBottom: 4, textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: c.color || V.text, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{c.val}</span>
              {c.sub && <span style={{ fontSize: 11, color: V.muted }}>{c.sub}</span>}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function MockDayStrip() {
  const days = [
    { day: 'Fri', num: '11', val: '€1120', pct: 70 },
    { day: 'Sat', num: '12', val: '€1460', pct: 92 },
    { day: 'Sun', num: '13', val: '€880', pct: 55 },
    { day: 'Mon', num: '14', val: '€240', pct: 15 },
    { day: 'Tue', num: '15', val: '€1030', pct: 65 },
    { day: 'Wed', num: '16', val: '€1295', pct: 81 },
    { day: 'Thu', num: '17', val: '€1540', pct: 97 },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, padding: '10px 14px', overflowX: 'auto' }}>
      {days.map(d => (
        <div key={d.num} style={{ flex: '1 1 0', minWidth: 54, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: V.surface2 }}>
          <div style={{ fontSize: 10, color: V.muted, fontWeight: 600 }}>{d.day} {d.num}</div>
          <div style={{ height: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', margin: '4px 0' }}>
            <div style={{ width: 14, borderRadius: '4px 4px 0 0', background: V.accent, height: `${d.pct}%`, minHeight: 3 }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: V.textSec, fontFamily: 'var(--font-mono)' }}>{d.val}</div>
        </div>
      ))}
    </div>
  );
}

function MockRideCard({ time, status, statusBg, statusColor, price, from, to }: {
  time: string; status: string; statusBg: string; statusColor: string;
  price: string; from: string; to: string;
}) {
  const fromParts = from.split(', ');
  const toParts = to.split(', ');
  const fromPlace = fromParts[0];
  const fromRest = fromParts.slice(1).join(', ');
  const toPlace = toParts[0];
  const toRest = toParts.slice(1).join(', ');

  return (
    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${V.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: V.text }}>{time}</span>
        <Badge bg={statusBg} color={statusColor}>{status}</Badge>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: V.text }}>{price}</span>
      </div>
      <div style={{ position: 'relative', paddingLeft: 18 }}>
        <span style={{ position: 'absolute', left: 2, top: 4, width: 8, height: 8, borderRadius: '50%', border: `2px solid ${V.accent}` }} />
        <span style={{ position: 'absolute', left: 5, top: 14, width: 1, bottom: 18, background: V.border }} />
        <span style={{ position: 'absolute', left: 2, bottom: 4, width: 8, height: 8, borderRadius: 2, background: V.charge }} />
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: V.text }}>{fromPlace}</span>
          {fromRest && <span style={{ fontSize: 10.5, color: V.muted }}>, {fromRest}</span>}
        </div>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: V.text }}>{toPlace}</span>
          {toRest && <span style={{ fontSize: 10.5, color: V.muted }}>, {toRest}</span>}
        </div>
      </div>
    </div>
  );
}

function MockDetailPanel() {
  const rows = [
    { label: 'Driver', value: 'M. Horvat' },
    { label: 'Vehicle', value: 'VAN · 4 pax' },
    { label: 'Channel', value: 'Web booking' },
    { label: 'Payment', value: 'To charge', color: V.charge },
    { label: 'Reference', value: 'RP-100482', mono: true },
  ];
  return (
    <div style={{ width: 260, borderLeft: `1px solid ${V.border}`, background: V.surface, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${V.border}` }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: V.muted }}>Ride Detail</span>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(r => (
          <div key={r.label}>
            <div style={{ fontSize: 10, color: V.muted, marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: r.color || V.text, fontFamily: r.mono ? 'var(--font-mono)' : undefined }}>{r.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px' }}>
        <button style={{ width: '100%', padding: '8px 0', borderRadius: 8, background: V.accent, color: V.onAccent, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'default' }}>Assign driver</button>
      </div>
      <Divider />
      <div style={{ padding: '12px 14px' }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: V.muted }}>Today</span>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: V.muted }}>Rides</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: V.text, fontFamily: 'var(--font-mono)' }}>3</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: V.muted }}>Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: V.text, fontFamily: 'var(--font-mono)' }}>€1,260</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      {/* Browser frame */}
      <div style={{ background: V.surface2, borderRadius: '12px 12px 0 0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF605C' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD44' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00CA4E' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 99, padding: '4px 16px', fontSize: 11, color: V.muted }}>app.ridepilot.com/dispatch</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ display: 'flex', background: V.bg, border: `1px solid ${V.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', minHeight: 440 }}>
        <MockSidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid ${V.border}` }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: V.surface2, borderRadius: 8, padding: '6px 10px' }}>
              <Search style={{ width: 13, height: 13, color: V.muted }} />
              <span style={{ fontSize: 12, color: V.muted }}>Search rides, drivers, clients…</span>
            </div>
            <Badge bg={V.surface2} color={V.textSec}>Today</Badge>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: V.accent, color: V.onAccent, fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>
              <Plus style={{ width: 12, height: 12 }} /> New ride
            </span>
          </div>
          <MockSummaryRow />
          <Divider />
          <MockDayStrip />
          <Divider />
          <MockRideCard time="08:15" status="To charge" statusBg={V.chargeBg} statusColor={V.charge} price="€420" from="Marco Polo Airport, Venice" to="Trieste Centrale, Trieste Italy" />
          <MockRideCard time="11:30" status="Paid" statusBg={V.successBg} statusColor={V.success} price="€260" from="Ljubljana Airport, Brnik Slovenia" to="Piran Marina, Piran Slovenia" />
          <MockRideCard time="16:45" status="Paid" statusBg={V.successBg} statusColor={V.success} price="€580" from="Trieste Centrale, Trieste Italy" to="Portorož Riviera, Portorož Slovenia" />
        </div>
        <MockDetailPanel />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Phone mockup (driver app)                                          */
/* ------------------------------------------------------------------ */
function PhoneMockup() {
  return (
    <div style={{
      width: 336, maxWidth: '100%', margin: '0 auto',
      borderRadius: 46, padding: 10,
      background: 'linear-gradient(145deg, #2A2E2C, #1A1E1C)',
      boxShadow: '0 0 0 2px #38403D, inset 0 0 0 1px #0A0C0B',
      position: 'relative',
    }}>
      {/* Dynamic island */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 100, height: 28, borderRadius: 99, background: '#000', zIndex: 10 }} />
      {/* Screen */}
      <div style={{ borderRadius: 36, overflow: 'hidden', background: V.bg, position: 'relative' }}>
        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px 4px', fontSize: 12, fontWeight: 600, color: V.text }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Signal style={{ width: 12, height: 12 }} />
            <Wifi style={{ width: 13, height: 13 }} />
            <Battery style={{ width: 18, height: 11 }} />
          </div>
        </div>

        {/* Driver header */}
        <div style={{ padding: '10px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${V.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car style={{ width: 16, height: 16, color: V.accent }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: V.text }}>M. Horvat</div>
              <div style={{ fontSize: 10, color: V.muted }}>Driver portal</div>
            </div>
          </div>
          <Badge bg={V.successBg} color={V.success}><Dot color={V.success} size={5} /> On duty</Badge>
        </div>

        {/* Stat tiles 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '10px 12px' }}>
          {[
            { label: 'PENDING', val: '3', color: V.warning },
            { label: 'ACCEPTED', val: '2', color: V.accent },
            { label: 'COMPLETED', val: '12', color: V.text },
            { label: 'EARNINGS', val: '€1,240', color: V.success },
          ].map(t => (
            <div key={t.label} style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.06em', color: V.muted, textTransform: 'uppercase' }}>{t.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.color, fontFamily: 'var(--font-mono)', lineHeight: 1.3 }}>{t.val}</div>
            </div>
          ))}
        </div>

        {/* Today header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: V.text }}>Today</span>
          <Badge bg={V.accentSoft} color={V.accent}>2 trips</Badge>
        </div>

        {/* Trip card 1 */}
        <div style={{ margin: '0 12px 8px', background: V.surface, border: `1px solid ${V.border}`, borderRadius: 12, borderTop: `3px solid ${V.accent}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: V.text, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>09:00</div>
                <div style={{ fontSize: 10, color: V.muted, marginTop: 2 }}>Tuesday, Mar 4</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: V.text, fontFamily: 'var(--font-mono)' }}>€420.00</div>
                <Badge bg={V.accentSoft} color={V.accent}>Accepted</Badge>
              </div>
            </div>
            {/* Customer */}
            <div style={{ borderTop: `1px solid ${V.border}`, paddingTop: 6, marginBottom: 8, fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: V.text }}>A. Marchetti</span>
              <span style={{ color: V.muted }}> · Adriatic Transfers</span>
            </div>
            {/* Route */}
            <div style={{ position: 'relative', paddingLeft: 16, marginBottom: 8 }}>
              <span style={{ position: 'absolute', left: 0, top: 3, width: 8, height: 8, borderRadius: '50%', border: `2px solid ${V.accent}` }} />
              <span style={{ position: 'absolute', left: 3, top: 13, width: 1, bottom: 14, background: V.border }} />
              <span style={{ position: 'absolute', left: 0, bottom: 3, width: 8, height: 8, borderRadius: 2, background: V.charge }} />
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: V.text }}>Ljubljana Airport</div>
                <div style={{ fontSize: 10, color: V.muted }}>Brnik, Slovenia</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: V.text }}>Piran Marina</div>
                <div style={{ fontSize: 10, color: V.muted }}>Piran, Slovenia</div>
              </div>
            </div>
            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: V.accent, color: V.onAccent, fontSize: 11, fontWeight: 700, padding: '8px 0', borderRadius: 8 }}>
                <MapPin style={{ width: 12, height: 12 }} /> Directions
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: `1px solid ${V.border}`, color: V.text, fontSize: 11, fontWeight: 600, padding: '8px 0', borderRadius: 8 }}>
                <Phone style={{ width: 12, height: 12 }} /> Call Client
              </div>
            </div>
            {/* Phone row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: V.surface2, border: `1px solid ${V.border}`, borderRadius: 8, padding: '5px 5px 5px 10px', marginBottom: 6 }}>
              <Phone style={{ width: 10, height: 10, color: V.muted }} />
              <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11, color: V.text }}>+386 1 234 5678</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: V.successBg, color: V.success, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                <Check style={{ width: 10, height: 10 }} /> Copied
              </span>
            </div>
            {/* Meta */}
            <div style={{ fontSize: 10, color: V.textSec }}>
              4 passengers <span style={{ color: V.muted }}>·</span> VAN <span style={{ color: V.muted }}>·</span> <span style={{ color: V.success }}>Already Paid</span>
            </div>
          </div>
        </div>

        {/* Trip card 2 (peeking) */}
        <div style={{ margin: '0 12px', background: V.surface, border: `1px solid ${V.border}`, borderRadius: '12px 12px 0 0', borderTop: `3px solid ${V.warning}`, opacity: 0.5, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: V.text, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>17:30</div>
                <div style={{ fontSize: 10, color: V.muted, marginTop: 2 }}>Tuesday, Mar 4</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: V.text, fontFamily: 'var(--font-mono)' }}>€310.00</div>
                <Badge bg={V.warningBg} color={V.warning}>Pending</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px' }}>
          <div style={{ width: 100, height: 4, borderRadius: 99, background: V.muted, opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI mockup panel                                                    */
/* ------------------------------------------------------------------ */
function AIMockup() {
  const fields = [
    { label: 'Client', value: 'E. Lang' },
    { label: 'Pickup', value: 'Marco Polo Airport, Venice' },
    { label: 'Dropoff', value: 'Trieste Centrale' },
    { label: 'Date & time', value: 'Tue 4 Mar · 17:30' },
    { label: 'Passengers', value: '3 · VAN' },
    { label: 'Price', value: '€310.00', mono: true },
  ];
  return (
    <div style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 14, overflow: 'hidden', maxWidth: 400 }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles style={{ width: 15, height: 15, color: V.accent }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: V.text }}>AI Booking Assistant</span>
        </div>
        <Badge bg={V.successBg} color={V.success}>6 fields found</Badge>
      </div>
      {/* Drop zone */}
      <div style={{ margin: '12px 14px', border: `1.5px dashed ${V.border}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: V.surface2, border: `1px solid ${V.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: V.text, fontWeight: 600, marginBottom: 6 }}>
          <FileText style={{ width: 12, height: 12, color: V.muted }} />
          booking-email.png
          <span style={{ color: V.muted, fontWeight: 400 }}>148 KB</span>
        </div>
        <div style={{ fontSize: 11, color: V.muted }}>or drop a CSV of transfers</div>
      </div>
      {/* Arrow divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px 8px' }}>
        <Divider />
        <span style={{ fontSize: 10, color: V.muted, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}><ArrowDown style={{ width: 10, height: 10 }} /> extracted</span>
        <Divider />
      </div>
      {/* Fields */}
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(f => (
          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, color: V.muted }}>{f.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: V.text, fontFamily: f.mono ? 'var(--font-mono)' : undefined, textAlign: 'right' }}>{f.value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: V.accent, color: V.onAccent, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'default' }}>Add ride</button>
        <button style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'transparent', color: V.text, fontSize: 12, fontWeight: 600, border: `1px solid ${V.border}`, cursor: 'default' }}>Edit fields</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tick-list helper                                                   */
/* ------------------------------------------------------------------ */
function TickList({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
      {items.map(it => (
        <div key={it.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, background: V.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <Check style={{ width: 12, height: 12, color: V.accent }} />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.text }}>{it.title}</div>
            <div style={{ fontSize: 13, color: V.muted, lineHeight: 1.5 }}>{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  MAIN EXPORT                                                        */
/* ================================================================== */
export default function Hero() {
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const handleGetStarted = () => {
    if (!currentUser) {
      setShowSignUpModal(true);
    }
  };

  return (
    <div style={{ ...darkTokens, background: V.bg, color: V.text, fontFamily: 'var(--font-body)' }}>

      {/* ── 1. NAV ── */}
      <nav style={{ borderBottom: `1px solid ${V.border}`, position: 'sticky', top: 0, zIndex: 50, background: V.bg }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car style={{ width: 22, height: 22, color: V.accent }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: V.text }}>RidePilot</span>
          </div>
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
            {[
              { label: 'Home', to: '/' },
              { label: 'About', to: '/about' },
              { label: 'Pricing', to: '/pricing' },
              { label: 'Driver Portal', to: '/driver' },
            ].map(l => (
              <Link key={l.label} to={l.to} style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, color: V.textSec, textDecoration: 'none', borderRadius: 8 }}>{l.label}</Link>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowLoginModal(true)} style={{ background: 'none', border: 'none', color: V.textSec, fontSize: 13, fontWeight: 500, padding: '6px 12px', cursor: 'pointer' }}>Login</button>
            <button onClick={() => setShowSignUpModal(true)} style={{ background: V.accent, color: V.onAccent, fontSize: 13, fontWeight: 700, padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Soft accent glow */}
        <div style={{ position: 'absolute', top: -180, left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(71,179,162,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 20px 56px', position: 'relative' }}>
          {/* Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: V.surface, border: `1px solid ${V.border}`, borderRadius: 99, padding: '6px 14px 6px 10px', marginBottom: 24, fontSize: 12, color: V.textSec }}>
            <Dot color={V.success} size={7} />
            Trusted by 500+ transportation companies worldwide
          </div>
          {/* H1 */}
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.08, marginBottom: 20 }}>
            Simplify dispatching.<br />
            <span style={{ color: V.accent }}>Manage rides effortlessly.</span>
          </h1>
          {/* Lead */}
          <p style={{ fontSize: 17, lineHeight: 1.6, color: V.textSec, maxWidth: 540, marginBottom: 28 }}>
            Never miss any rides. Keep your bookings, drivers and clients perfectly organized with one transportation management platform.
          </p>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <button onClick={handleGetStarted} style={{ background: V.accent, color: V.onAccent, fontSize: 15, fontWeight: 700, padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>Get Started Free</button>
            <Link to="/driver" style={{ background: 'transparent', color: V.text, fontSize: 15, fontWeight: 600, padding: '12px 28px', borderRadius: 10, border: `1px solid ${V.border}`, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>See the Driver App</Link>
          </div>
          {/* Small line */}
          <p style={{ fontSize: 12.5, color: V.muted }}>
            <strong style={{ color: V.textSec }}>Open source</strong> platform · <strong style={{ color: V.textSec }}>PIN login</strong> for drivers · <strong style={{ color: V.textSec }}>AI booking</strong> import
          </p>
        </div>
      </section>

      {/* ── 3. DASHBOARD MOCKUP ── */}
      <section style={{ padding: '0 20px 72px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
          <div style={{ minWidth: 900 }}>
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── 4. STATS BAND ── */}
      <section style={{ background: V.surface, borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap' }}>
          {[
            { val: '99', label: 'Locations served' },
            { val: '90', label: 'Total trips' },
            { val: 'Trieste Port', label: 'Top pickup' },
            { val: 'Venice', label: 'Top dropoff' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <Divider vertical />}
              <div style={{ flex: '1 1 200px', padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: V.text, fontFamily: s.val.match(/\d/) ? 'var(--font-mono)' : undefined }}>{s.val}</div>
                <div style={{ fontSize: 13, color: V.muted, marginTop: 4 }}>{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── 5. PLATFORM SECTION ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <SectionKicker>THE PLATFORM</SectionKicker>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 36px)', color: V.text, marginBottom: 14 }}>Streamline your transportation operations</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: V.textSec, maxWidth: 600, margin: '0 auto' }}>
            RidePilot is a comprehensive, open-source platform built for small to medium-sized agencies — trip scheduling, driver management, customer tracking and financial reporting in one interface.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { icon: TrendingUp, title: 'Real-time analytics', desc: 'Revenue, trip volume and status at a glance across any date range.' },
            { icon: Users, title: 'Driver management', desc: 'A dedicated driver portal with PIN login, trip accept and decline.' },
            { icon: MapPin, title: 'Location insights', desc: 'See your busiest pickups and dropoffs and plan capacity around them.' },
            { icon: Shield, title: 'Secure & reliable', desc: 'Multi-company support, role separation and printable trip vouchers.' },
          ].map(c => (
            <div key={c.title} style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: V.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <c.icon style={{ width: 18, height: 18, color: V.accent }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: V.text, marginBottom: 6 }}>{c.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: V.muted }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. AI SECTION ── */}
      <section style={{ background: V.surface, borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 20px', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 340px' }}>
            <SectionKicker>AI BOOKING ASSISTANT</SectionKicker>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 36px)', color: V.text, marginBottom: 14 }}>Stop retyping bookings</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: V.textSec, marginBottom: 8 }}>
              Bookings arrive as email screenshots and partner spreadsheets. Drop the file in and RidePilot reads it, pulls out the details and hands you a ride ready to confirm.
            </p>
            <TickList items={[
              { title: 'Screenshots and CSV files', desc: "Upload an image of a booking email or a partner's spreadsheet export." },
              { title: 'Details extracted for you', desc: 'Client, route, date, time, passengers and price come back as structured fields.' },
              { title: 'You confirm before it saves', desc: 'Review what was read, correct anything, then add it to the board.' },
              { title: 'Several bookings at once', desc: 'A spreadsheet of transfers becomes a list of rides in one pass.' },
            ]} />
          </div>
          <div style={{ flex: '1 1 340px', display: 'flex', justifyContent: 'center' }}>
            <AIMockup />
          </div>
        </div>
      </section>

      {/* ── 7. DRIVER APP SECTION ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 20px', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 340px' }}>
          <SectionKicker>DRIVER APP</SectionKicker>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 36px)', color: V.text, marginBottom: 14 }}>Built for the phone in the car</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: V.textSec, marginBottom: 8 }}>
            Drivers see one screen: when, where from, where to, and the two buttons that matter.
          </p>
          <TickList items={[
            { title: 'Time first, not the name', desc: 'Drivers scan for when and where — so that leads the card.' },
            { title: 'Directions and call, one tap each', desc: 'The two things a driver actually does, as full-size buttons.' },
            { title: "Copy the client's number", desc: 'One tap to paste into WhatsApp, with a clear confirmation.' },
            { title: 'Light or dark, automatically', desc: "Follows the driver's own phone setting for day and night runs." },
          ]} />
        </div>
        <div style={{ flex: '1 1 340px', display: 'flex', justifyContent: 'center' }}>
          <PhoneMockup />
        </div>
      </section>

      {/* ── 8. CLOSING CTA ── */}
      <section style={{ padding: '0 20px 72px' }}>
        <div style={{
          maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: '48px 32px',
          border: `1px solid ${V.border}`, borderRadius: 18, position: 'relative', overflow: 'hidden',
          background: V.surface,
        }}>
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 400, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(71,179,162,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)', color: V.text, marginBottom: 12, position: 'relative' }}>Start dispatching with AI</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: V.textSec, maxWidth: 460, margin: '0 auto 24px', position: 'relative' }}>
            Drop in a booking and let RidePilot read it. Open source, with a driver portal your team logs into with a PIN.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <button onClick={handleGetStarted} style={{ background: V.accent, color: V.onAccent, fontSize: 15, fontWeight: 700, padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>Get Started Free</button>
            <Link to="/contact" style={{ background: 'transparent', color: V.text, fontSize: 15, fontWeight: 600, padding: '12px 28px', borderRadius: 10, border: `1px solid ${V.border}`, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MessageCircle style={{ width: 16, height: 16 }} /> Suggest Features
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${V.border}`, padding: '32px 20px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Car style={{ width: 18, height: 18, color: V.accent }} />
            <span style={{ fontSize: 13, color: V.muted }}>Transportation management for small agencies</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Home', to: '/' },
              { label: 'About', to: '/about' },
              { label: 'Pricing', to: '/pricing' },
              { label: 'Driver Portal', to: '/driver' },
            ].map(l => (
              <Link key={l.label} to={l.to} style={{ fontSize: 13, color: V.muted, textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Modals (unchanged handlers) ── */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Login">
        <LoginForm onSuccess={() => setShowLoginModal(false)} />
      </Modal>
      <Modal isOpen={showSignUpModal} onClose={() => setShowSignUpModal(false)} title="Sign Up">
        <SignUpForm onSuccess={() => setShowSignUpModal(false)} />
      </Modal>
    </div>
  );
}
