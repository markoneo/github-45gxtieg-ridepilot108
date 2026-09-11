import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Download, Copy, Check, Printer, Save, MessageCircle, X, Share2, FileImage } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toPng, toJpeg } from 'html-to-image';
import { saveAs } from 'file-saver';
import './VoucherGenerator.css';

interface VoucherGeneratorProps {
  projectId: string;
  onClose?: () => void;
  displayMode?: 'modal' | 'page';
}

export default function VoucherGenerator({ projectId, onClose, displayMode = 'modal' }: VoucherGeneratorProps) {
  const { projects, companies, drivers, carTypes } = useData();
  const [copied, setCopied] = useState(false);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const params = useParams();

  const effectiveProjectId = projectId || params.id || '';
  const project = projects.find(p => p.id === effectiveProjectId);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  if (!project) {
    return (
      <div style={{ padding: 16, background: '#FEF2F2', borderRadius: 8 }}>
        <p style={{ color: '#DC2626' }}>Project not found.</p>
      </div>
    );
  }

  const company = companies.find(c => c.id === project.company);
  const driver = drivers.find(d => d.id === project.driver);
  const carType = carTypes.find(c => c.id === project.carType);

  // Payment modelling
  const totalFare = project.price;
  const paidOnline = project.paymentStatus === 'paid' ? totalFare : 0;
  const balanceDue = totalFare - paidOnline;

  // Date formatting: "Fri 11 Sep 2026"
  const dateObj = new Date(project.date + 'T00:00:00');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${dayNames[dateObj.getDay()]} ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  // Time: strip seconds
  const formattedTime = project.time ? project.time.replace(/:\d{2}$/, '') : '';

  // Location parsing helper
  function parseLocation(loc: string): { venue: string; street: string; city: string } {
    if (!loc) return { venue: '', street: '', city: '' };
    const parts = loc.split(',').map(s => s.trim());
    if (parts.length >= 3) {
      return { venue: parts[0], street: parts[1], city: parts.slice(2).join(', ') };
    }
    if (parts.length === 2) {
      return { venue: parts[0], street: '', city: parts[1] };
    }
    return { venue: loc, street: '', city: '' };
  }

  const pickup = parseLocation(project.pickupLocation);
  const dropoff = parseLocation(project.dropoffLocation);

  const fmtEur = (n: number) => `€${n.toFixed(2)}`;

  // ── Share functions ──

  const copyToClipboard = () => {
    const text = [
      `TRANSFER VOUCHER #${project.bookingId || 'N/A'}`,
      `Date: ${formattedDate}`,
      `Time: ${formattedTime}`,
      `Client: ${project.clientName}`,
      `Phone: ${project.clientPhone}`,
      `Pickup: ${project.pickupLocation}`,
      `Dropoff: ${project.dropoffLocation}`,
      `Passengers: ${project.passengers}`,
      `Vehicle: ${carType?.name || 'Standard'}`,
      `Driver: ${driver?.name || 'TBA'}`,
      driver?.phone ? `Driver Phone: ${driver.phone}` : '',
      `Total: ${fmtEur(totalFare)}`,
      balanceDue > 0 ? `Balance due to driver: ${fmtEur(balanceDue)}` : 'Fully paid online',
      project.description ? `Notes: ${project.description}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setStatusMessage({ text: 'Copied!', type: 'success' });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => setStatusMessage({ text: 'Failed to copy', type: 'error' }));
  };

  const shareToWhatsApp = () => {
    const text = `🚗 *TRANSFER VOUCHER* #${project.bookingId || 'N/A'}

📅 *Date:* ${formattedDate}
🕐 *Time:* ${formattedTime}

👤 *Client:* ${project.clientName}
📞 *Phone:* ${project.clientPhone}

📍 *Pickup:* ${project.pickupLocation}
📍 *Dropoff:* ${project.dropoffLocation}

👥 *Passengers:* ${project.passengers}
🚙 *Vehicle:* ${carType?.name || 'Standard'}

🚗 *Driver:* ${driver?.name || 'TBA'}
${driver?.phone ? `📞 *Driver Phone:* ${driver.phone}` : ''}

💰 *Total fare:* ${fmtEur(totalFare)}
${balanceDue > 0 ? `💵 *Balance due to driver:* ${fmtEur(balanceDue)}` : '✅ *Fully paid online*'}

${project.description ? `📝 *Notes:* ${project.description}` : ''}`;

    const encoded = encodeURIComponent(text);
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const link = document.createElement('a');
      link.href = `whatsapp://send?text=${encoded}`;
      link.click();
      setTimeout(() => window.open(`https://wa.me/?text=${encoded}`, '_blank'), 1000);
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
    setStatusMessage({ text: 'Opening WhatsApp...', type: 'success' });
  };

  const printVoucher = () => window.print();

  const generateVoucherImage = async (): Promise<string | null> => {
    if (!voucherRef.current) return null;
    try {
      await new Promise(r => setTimeout(r, 100));
      const opts = {
        quality: 0.95,
        backgroundColor: '#FFFFFF',
        pixelRatio: 2,
        skipFonts: true,
      };
      return imageFormat === 'png'
        ? await toPng(voucherRef.current, opts)
        : await toJpeg(voucherRef.current, opts);
    } catch (e) {
      console.error('Image gen error:', e);
      return null;
    }
  };

  const downloadAsImage = async () => {
    try {
      setIsGeneratingImage(true);
      setStatusMessage({ text: 'Generating image...', type: 'info' });
      const url = await generateVoucherImage();
      if (!url) throw new Error('Failed');

      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          const r = await fetch(url);
          saveAs(await r.blob(), `voucher-${project.bookingId || 'transfer'}.${imageFormat}`);
          setStatusMessage({ text: 'Image saved!', type: 'success' });
        } catch {
          setImagePreview(url);
        }
      } else {
        const a = document.createElement('a');
        a.download = `voucher-${project.bookingId || 'transfer'}.${imageFormat}`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setStatusMessage({ text: 'Image downloaded!', type: 'success' });
      }
    } catch {
      setStatusMessage({ text: 'Failed to generate image', type: 'error' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadImageFromPreview = async () => {
    if (!imagePreview) return;
    try {
      const r = await fetch(imagePreview);
      saveAs(await r.blob(), `voucher-${project.bookingId || 'transfer'}.${imageFormat}`);
      setStatusMessage({ text: 'Image saved!', type: 'success' });
      setImagePreview(null);
    } catch {
      setStatusMessage({ text: 'Failed to download', type: 'error' });
    }
  };

  const shareImageFromPreview = async () => {
    if (!imagePreview || !navigator.share) return;
    try {
      const r = await fetch(imagePreview);
      const blob = await r.blob();
      const file = new File([blob], `voucher-${project.bookingId || 'transfer'}.${imageFormat}`, {
        type: imageFormat === 'png' ? 'image/png' : 'image/jpeg',
      });
      await navigator.share({ files: [file], title: `Transfer Voucher #${project.bookingId || 'N/A'}` });
      setStatusMessage({ text: 'Shared!', type: 'success' });
      setImagePreview(null);
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setStatusMessage({ text: 'Failed to share', type: 'error' });
      }
    }
  };

  return (
    <div className={displayMode === 'page' ? 'min-h-screen pt-16 pb-8 px-4' : ''} style={{ background: displayMode === 'page' ? '#F2F7F5' : undefined }}>
      {displayMode === 'page' && (
        <div style={{ maxWidth: 680, margin: '0 auto 12px', padding: '0 4px' }}>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center"
            style={{ color: '#6E837B', fontSize: 14, fontFamily: "'Barlow', sans-serif", background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      )}

      {/* Status toast */}
      {statusMessage && (
        <div
          style={{
            position: 'fixed', top: 80, right: 16, left: 16, zIndex: 50, maxWidth: 340, margin: '0 auto',
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            background: statusMessage.type === 'success' ? '#E6F4EE' : statusMessage.type === 'error' ? '#FEF2F2' : '#EFF6FF',
            color: statusMessage.type === 'success' ? '#046C4E' : statusMessage.type === 'error' ? '#DC2626' : '#2563EB',
            border: `1px solid ${statusMessage.type === 'success' ? '#D9E4DF' : statusMessage.type === 'error' ? '#FECACA' : '#BFDBFE'}`,
          }}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'inherit', display: 'inline-flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Image preview modal */}
      {imagePreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 480, width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #D9E4DF' }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#0B1A15' }}>Your Voucher</span>
              <button onClick={() => setImagePreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ background: '#F2F7F5' }}>
              <img src={imagePreview} alt="Voucher preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={downloadImageFromPreview} className="inline-flex items-center justify-center" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, background: '#046C4E', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                <Download size={16} style={{ marginRight: 8 }} /> Save to Device
              </button>
              {navigator.share && (
                <button onClick={shareImageFromPreview} className="inline-flex items-center justify-center" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, background: '#0B1A15', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  <Share2 size={16} style={{ marginRight: 8 }} /> Share
                </button>
              )}
              <button onClick={() => setImagePreview(null)} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, background: '#F2F7F5', color: '#35453F', border: '1px solid #D9E4DF', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VOUCHER SHEET ═══ */}
      <div className="voucher-sheet" ref={voucherRef}>

        {/* Controls bar */}
        <div className="v-controls v-no-print">
          <button onClick={shareToWhatsApp}>
            <MessageCircle size={15} /> WhatsApp
          </button>
          <button onClick={downloadAsImage} disabled={isGeneratingImage}>
            <Save size={15} /> {isGeneratingImage ? 'Saving...' : 'Image'}
          </button>
          <button onClick={copyToClipboard}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={printVoucher} className="v-btn-primary">
            <Printer size={15} /> Print
          </button>
        </div>

        {/* ── Masthead ── */}
        <div className="v-masthead">
          <div className="v-masthead-left">
            <div className="v-wordmark">
              RIDE<span className="v-wordmark-connect">CONNECT</span>
            </div>
            <div className="v-masthead-sub">
              {company?.name || 'Transfer Service'} &middot; {company?.phone || ''}
            </div>
          </div>
          <div className="v-masthead-right">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div className="v-status-pill">
                <span className="v-status-dot" />
                Confirmed
              </div>
              <div className="v-ref-block">
                <span className="v-label" style={{ color: 'rgba(255,255,255,.45)' }}>Booking reference</span>
                <span className="v-ref-value">{project.bookingId || 'N/A'}</span>
              </div>
            </div>
            <div className="v-qr" role="img" aria-label={`QR code for booking ${project.bookingId || 'N/A'}`}>
              <svg viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Simplified QR placeholder */}
                <rect width="21" height="21" fill="#fff"/>
                <rect x="1" y="1" width="7" height="7" rx="1" fill="#0B1A15"/>
                <rect x="2" y="2" width="5" height="5" rx=".5" fill="#fff"/>
                <rect x="3" y="3" width="3" height="3" rx=".5" fill="#0B1A15"/>
                <rect x="13" y="1" width="7" height="7" rx="1" fill="#0B1A15"/>
                <rect x="14" y="2" width="5" height="5" rx=".5" fill="#fff"/>
                <rect x="15" y="3" width="3" height="3" rx=".5" fill="#0B1A15"/>
                <rect x="1" y="13" width="7" height="7" rx="1" fill="#0B1A15"/>
                <rect x="2" y="14" width="5" height="5" rx=".5" fill="#fff"/>
                <rect x="3" y="15" width="3" height="3" rx=".5" fill="#0B1A15"/>
                <rect x="9" y="1" width="2" height="2" fill="#0B1A15"/>
                <rect x="9" y="5" width="2" height="2" fill="#0B1A15"/>
                <rect x="9" y="9" width="2" height="2" fill="#0B1A15"/>
                <rect x="11" y="9" width="2" height="2" fill="#0B1A15"/>
                <rect x="13" y="9" width="2" height="2" fill="#0B1A15"/>
                <rect x="9" y="13" width="2" height="2" fill="#0B1A15"/>
                <rect x="13" y="13" width="2" height="2" fill="#0B1A15"/>
                <rect x="15" y="11" width="2" height="2" fill="#0B1A15"/>
                <rect x="17" y="13" width="2" height="2" fill="#0B1A15"/>
                <rect x="11" y="15" width="2" height="2" fill="#0B1A15"/>
                <rect x="15" y="17" width="4" height="2" fill="#0B1A15"/>
                <rect x="17" y="15" width="2" height="2" fill="#0B1A15"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── Journey strip ── */}
        <div className="v-strip">
          <div className="v-strip-cell">
            <div className="v-label">Date</div>
            <div className="v-strip-value">{formattedDate}</div>
          </div>
          <div className="v-strip-cell">
            <div className="v-label">Pickup time</div>
            <div className="v-strip-value v-mono">{formattedTime}</div>
            <div className="v-strip-secondary">Local time</div>
          </div>
          <div className="v-strip-cell">
            <div className="v-label">Vehicle</div>
            <div className="v-strip-value">{carType?.name || 'Standard'}</div>
          </div>
          <div className="v-strip-cell">
            <div className="v-label">Passengers</div>
            <div className="v-strip-value">{project.passengers}</div>
            {carType?.name && <div className="v-strip-secondary">Up to {project.passengers} seat{project.passengers !== 1 ? 's' : ''}</div>}
          </div>
        </div>

        {/* ── Route timeline ── */}
        <div className="v-route">
          {/* Pickup */}
          <div className="v-route-leg">
            <div className="v-route-node">
              <div className="v-route-dot-pickup" />
              <div className="v-route-connector" />
            </div>
            <div className="v-route-content">
              <div className="v-route-tag">
                <span className="v-label">Pickup</span>
                <span className="v-mono" style={{ fontSize: 11, color: 'var(--v-accent)', fontWeight: 600 }}>{formattedTime}</span>
              </div>
              <div className="v-route-venue">{pickup.venue}</div>
              {pickup.street && <div className="v-route-address">{pickup.street}</div>}
              {pickup.city && <div className="v-route-city">{pickup.city}</div>}
            </div>
          </div>

          {/* Drop-off */}
          <div className="v-route-leg">
            <div className="v-route-node">
              <div className="v-route-dot-dropoff" />
            </div>
            <div className="v-route-content">
              <div className="v-route-tag">
                <span className="v-label">Drop-off</span>
              </div>
              <div className="v-route-venue">{dropoff.venue}</div>
              {dropoff.street && <div className="v-route-address">{dropoff.street}</div>}
              {dropoff.city && <div className="v-route-city">{dropoff.city}</div>}
            </div>
          </div>
        </div>

        {/* ── Passenger & Driver ── */}
        <div className="v-people">
          <div className="v-person">
            <div className="v-label">Passenger</div>
            <div className="v-person-name">{project.clientName}</div>
            {project.clientPhone && (
              <a href={`tel:${project.clientPhone}`} className="v-person-phone">{project.clientPhone}</a>
            )}
            <div className="v-person-secondary">{project.passengers} passenger{project.passengers !== 1 ? 's' : ''}</div>
          </div>
          <div className="v-person v-person-driver">
            <div className="v-label">Your driver</div>
            <div className="v-person-name">{driver?.name || 'To be assigned'}</div>
            {driver?.phone && (
              <a href={`tel:${driver.phone}`} className="v-person-phone">{driver.phone}</a>
            )}
            <div className="v-person-secondary">
              {driver?.name ? `${carType?.name || 'Vehicle'} driver` : 'Driver details will be confirmed'}
            </div>
          </div>
        </div>

        {/* ── Tear rule ── */}
        <hr className="v-tear" />

        {/* ── Payment ── */}
        <div className="v-payment">
          <div className="v-ledger">
            <div className="v-ledger-row">
              <span className="v-ledger-label">
                Total fare &mdash; {pickup.venue} to {dropoff.venue}
              </span>
              <span className="v-ledger-amount">{fmtEur(totalFare)}</span>
            </div>
            {paidOnline > 0 && (
              <div className="v-ledger-row">
                <span className="v-ledger-label v-ledger-paid">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="v-ledger-check"><path d="M20 6L9 17l-5-5"/></svg>
                  Paid online
                </span>
                <span className="v-ledger-amount" style={{ color: 'var(--v-accent)' }}>−{fmtEur(paidOnline)}</span>
              </div>
            )}
            {balanceDue > 0 && (
              <div className="v-ledger-row" style={{ fontWeight: 600 }}>
                <span className="v-ledger-label" style={{ fontWeight: 600, color: 'var(--v-ink)' }}>Balance due to driver</span>
                <span className="v-ledger-amount" style={{ color: 'var(--v-cash)' }}>{fmtEur(balanceDue)}</span>
              </div>
            )}
            {balanceDue === 0 && (
              <div className="v-ledger-row">
                <span className="v-ledger-label" style={{ fontWeight: 600, color: 'var(--v-accent)' }}>Fully paid — nothing due</span>
                <span className="v-ledger-amount" style={{ color: 'var(--v-accent)' }}>{fmtEur(0)}</span>
              </div>
            )}
          </div>

          {balanceDue > 0 ? (
            <div className="v-balance-box">
              <div className="v-label" style={{ color: 'var(--v-cash)' }}>Balance due to driver</div>
              <div className="v-balance-amount">{fmtEur(balanceDue)}</div>
              <div className="v-balance-detail">
                Pay {driver?.name || 'your driver'} directly<br />Cash or card accepted
              </div>
            </div>
          ) : (
            <div className="v-balance-box" style={{ background: 'var(--v-accent-tint)', borderColor: '#B4DBC8' }}>
              <div className="v-label" style={{ color: 'var(--v-accent)' }}>Payment status</div>
              <div className="v-balance-amount" style={{ color: 'var(--v-accent)', fontSize: 28 }}>PAID</div>
              <div className="v-balance-detail" style={{ color: 'var(--v-accent)' }}>
                No payment due at pickup
              </div>
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        {project.description && (
          <div className="v-notes">
            <div className="v-label" style={{ marginBottom: 6 }}>Notes</div>
            {project.description}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="v-footer">
          <div className="v-footer-left">
            Show this voucher to your driver.<br />
            Save to your phone or print a copy.
          </div>
          <div className="v-footer-right">
            <div className="v-label" style={{ marginBottom: 4 }}>24/7 assistance</div>
            {company?.phone ? (
              <a href={`tel:${company.phone}`}>{company.phone}</a>
            ) : (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, color: 'var(--v-accent)' }}>Contact dispatch</span>
            )}
          </div>
        </div>
      </div>

      {displayMode === 'modal' && onClose && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, background: '#F2F7F5', color: '#35453F', border: '1px solid #D9E4DF', fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
