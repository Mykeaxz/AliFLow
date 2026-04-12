import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

// ── LocalStorage helpers ──────────────────────────────────────────
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const wsKey           = (p, k) => `af:${p}:${k}`;
const loadBrands      = (p) => ls.get(wsKey(p, 'brands'), []);
const saveBrands      = (p, v) => ls.set(wsKey(p, 'brands'), v);
const loadActiveBrand = (p) => ls.get(wsKey(p, 'active_brand'), null);
const saveActiveBrand = (p, v) => ls.set(wsKey(p, 'active_brand'), v);

// ── Generation options ────────────────────────────────────────────
const GEN_OPTIONS = [
  { id: 'productName',  label: 'Product Title',       desc: 'Branded name for the product' },
  { id: 'pricing',      label: 'Pricing',              desc: 'AliExpress → retail → sale price with reasoning' },
  { id: 'copy',         label: 'Full Copy',            desc: 'Subtitle, short desc, overview, materials, care' },
  { id: 'faq',          label: 'FAQ',                  desc: '5 objection-killing Q&As' },
  { id: 'imagePrompts', label: 'Lovart Image Prompts', desc: '6-shot framework + Google Shopping prompt' },
];

// ── Icons ─────────────────────────────────────────────────────────
const IcoCopy    = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 11V2h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IcoOk      = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M3 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoPlus    = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IcoEdit    = () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M10.5 2.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const IcoTrash   = () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M2 4h11M5 4V2.5h5V4M6 7v4M9 7v4M3 4l.8 9.5h7.4L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoArrow   = () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoSpark   = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1l1.5 4.5H13L9.5 8l1.5 4.5L7.5 10 4 12.5 5.5 8 2 5.5h4L7.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const IcoRegen   = () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M13 7A6 6 0 112 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M13 3v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoClock   = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoList    = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M3 4h9M3 7.5h9M3 11h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IcoGear    = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.4 3.4l.7.7M10.9 10.9l.7.7M3.4 11.6l.7-.7M10.9 4.1l.7-.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IcoSparkFill = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M7.5 1l1.5 4.5H13L9.5 8l1.5 4.5L7.5 10 4 12.5 5.5 8 2 5.5h4L7.5 1z" fill="rgba(255,255,255,.95)" stroke="rgba(255,255,255,.4)" strokeWidth=".5"/></svg>;

// ── CopyBtn ───────────────────────────────────────────────────────
function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
      {copied ? <IcoOk /> : <IcoCopy />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

// ── Global CSS ────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{color-scheme:light}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;color:#0f172a;min-height:100vh;font-size:14px;-webkit-font-smoothing:antialiased}
input,textarea,select{background:#f8fafc!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
input:focus,textarea:focus,select:focus{background:#fff!important;box-shadow:0 0 0 3px rgba(59,130,246,.1)!important}

/* ── TOPBAR ── */
.topbar{position:fixed;top:0;left:0;right:0;z-index:200;height:52px;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(15,23,42,.04);display:flex;align-items:center}
.topbar-logo-area{width:240px;flex-shrink:0;display:flex;align-items:center;padding:0 18px;border-right:1px solid #e2e8f0;height:100%;gap:9px}
.logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:1rem;color:#0f172a;letter-spacing:-.03em;text-decoration:none}
.logo-icon{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(59,130,246,.3);flex-shrink:0}
.topbar-center{flex:1;display:flex;align-items:center;padding:0 20px}
.topbar-right{margin-left:auto;padding-right:20px;display:flex;align-items:center;gap:8px;flex-shrink:0}
.btn-logout{padding:6px 14px;background:none;border:1px solid #e2e8f0;border-radius:7px;font-size:.76rem;font-weight:600;color:#94a3b8;cursor:pointer;transition:all .12s;font-family:inherit}
.btn-logout:hover{border-color:#fecaca;color:#dc2626;background:#fff5f5}

/* ── LAYOUT ── */
.layout{padding-top:52px;min-height:100vh;display:flex}
.sidebar{width:240px;flex-shrink:0;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:sticky;top:52px;height:calc(100vh - 52px);overflow-y:auto}
.sb-section{padding:16px 10px 4px}
.sb-label{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:6px;padding:0 10px}
.sb-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:9px;cursor:pointer;font-size:.8rem;font-weight:600;color:#64748b;transition:all .1s;border:none;background:none;font-family:inherit;width:100%;text-align:left}
.sb-item:hover{background:#f1f5f9;color:#334155}
.sb-item.active{background:#eff6ff;color:#1d4ed8}
.sb-item-icon{display:flex;align-items:center;justify-content:center;width:18px;flex-shrink:0}
.sb-divider{height:1px;background:#f1f5f9;margin:6px 10px}
.sb-bottom{margin-top:auto;padding:10px 10px 14px;border-top:1px solid #f1f5f9;display:flex;flex-direction:column;gap:4px}
.avatar-chip{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;cursor:default}
.avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;color:#fff;flex-shrink:0}
.avatar-name{font-size:.79rem;font-weight:600;color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.main{flex:1;padding:28px 32px 80px;min-width:0}

/* ── CARDS ── */
.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:14px;box-shadow:0 2px 12px rgba(15,23,42,.06)}
.card-title{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}
.card-title button{font-size:.74rem;font-weight:600;color:#2563eb;background:none;border:none;cursor:pointer;padding:0;font-family:inherit;text-transform:none;letter-spacing:0}

/* ── INPUTS ── */
.field-group{margin-bottom:14px}
.field-group:last-child{margin-bottom:0}
.field-label{font-size:.74rem;font-weight:600;color:#475569;margin-bottom:5px}
.field-hint{font-weight:400;color:#94a3b8;font-size:.71rem}
.field-sep{height:1px;background:#f1f5f9;margin:14px 0}
.input-text{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.875rem;font-family:inherit;color:#0f172a;outline:none;background:#f8fafc;transition:all .15s}
.input-text:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
.input-text::placeholder{color:#cbd5e1}
.input-ta{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.84rem;font-family:inherit;color:#0f172a;outline:none;resize:vertical;background:#f8fafc;transition:all .15s}
.input-ta:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
.input-ta::placeholder{color:#cbd5e1}
.input-select{width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.875rem;font-family:inherit;color:#0f172a;outline:none;background:#f8fafc;transition:all .12s}
.input-select:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,.1)}

/* ── BUTTONS ── */
.btn-primary{height:40px;padding:0 20px;border-radius:9px;border:none;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;font-family:inherit;font-size:.84rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .12s;flex-shrink:0;white-space:nowrap;box-shadow:0 2px 8px rgba(37,99,235,.3)}
.btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#1e40af,#1d4ed8);transform:translateY(-1px);box-shadow:0 4px 12px rgba(37,99,235,.38)}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
.btn-ghost{height:38px;padding:0 16px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:9px;font-size:.84rem;font-weight:600;cursor:pointer;transition:all .12s;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
.btn-ghost:hover{border-color:#cbd5e1;color:#0f172a;background:#e8edf2}
.btn-danger{padding:7px 14px;background:#fee2e2;color:#dc2626;border:1px solid #fecaca;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .12s;font-family:inherit}
.btn-danger:hover{background:#fecaca}
.btn-sm{padding:6px 12px;font-size:.78rem;font-weight:600;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;color:#475569;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .12s;font-family:inherit}
.btn-sm:hover{border-color:#cbd5e1;color:#334155;background:#f1f5f9}
.btn-sm.is-active{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}

/* ── STATUS / ALERTS ── */
.status-bar{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;font-size:.84rem;color:#1d4ed8;font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:16px}
.spin{width:14px;height:14px;border:2px solid #bfdbfe;border-top-color:#3b82f6;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.error-bar{background:#fee2e2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;font-size:.84rem;color:#dc2626;margin-bottom:16px;font-weight:600}
.warn-banner{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;font-size:.84rem;color:#1d4ed8;display:flex;align-items:center;gap:12px;margin-bottom:16px;font-weight:600}
.warn-banner-btn{margin-left:auto;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;border:none;border-radius:7px;padding:6px 14px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
.warn-banner-btn:hover{background:linear-gradient(135deg,#1e40af,#1d4ed8)}

/* ── PAGE HEADER ── */
.page-header{margin-bottom:22px}
.page-title{font-size:1.3rem;font-weight:800;letter-spacing:-.025em;color:#0f172a}
.page-sub{font-size:.84rem;color:#64748b;margin-top:4px}
.page-header-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}

/* ── GEN OPTIONS ── */
.gen-opts-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gen-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;transition:all .12s;background:#f8fafc}
.gen-opt:hover{border-color:#bfdbfe;background:#eff6ff}
.gen-opt.checked{border-color:#3b82f6;background:#eff6ff}
.gen-opt-cb{width:17px;height:17px;border:2px solid #cbd5e1;border-radius:4px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.gen-opt.checked .gen-opt-cb{background:#2563eb;border-color:#2563eb;color:#fff}
.gen-opt-label{font-size:.84rem;font-weight:700;color:#0f172a}
.gen-opt-desc{font-size:.74rem;color:#94a3b8;margin-top:1px}
.gen-row{display:flex;justify-content:flex-end;margin-top:14px}

/* ── IMAGES ── */
.images-strip{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.img-thumb{width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid #e2e8f0;cursor:pointer;transition:all .12s}
.img-thumb:hover,.img-thumb.sel{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}

/* ── RESULTS ── */
.result-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
.result-name{font-size:1.4rem;font-weight:800;letter-spacing:-.02em;color:#0f172a}
.result-pain{font-size:.87rem;color:#64748b;margin-top:5px}
.result-actions{display:flex;gap:8px;flex-shrink:0}
.result-wrap{display:flex;flex-direction:column;gap:10px}
.result-section{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,.06)}
.rs-header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.rs-title{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8}
.rs-btns{display:flex;gap:6px;align-items:center}
.rs-body{padding:16px;font-size:.875rem;line-height:1.65;color:#1e293b}
.copy-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;font-size:.74rem;font-weight:600;color:#64748b;cursor:pointer;transition:all .12s;font-family:inherit}
.copy-btn:hover{background:#e8edf2;color:#334155}
.copy-btn.copied{background:#dcfce7;border-color:#86efac;color:#16a34a}
.regen-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;font-size:.74rem;font-weight:600;color:#1d4ed8;cursor:pointer;transition:all .12s;font-family:inherit}
.regen-btn:hover{background:#dbeafe}
.regen-panel{padding:12px 16px;background:#f8fbff;border-bottom:1px solid #e2e8f0;display:flex;flex-direction:column;gap:8px}
.regen-label{font-size:.76rem;font-weight:700;color:#1d4ed8}
.regen-ta{width:100%;padding:9px 12px;border:1.5px solid #bfdbfe;border-radius:8px;font-size:.84rem;font-family:inherit;outline:none;resize:vertical;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
.regen-ta:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
.regen-ta::placeholder{color:#bfdbfe}
.regen-err{font-size:.8rem;color:#dc2626}

/* ── PRICING ── */
.price-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.price-cell{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.price-label{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px}
.price-val{font-size:1.1rem;font-weight:800;color:#0f172a}
.price-reason{grid-column:1/-1;font-size:.82rem;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}

/* ── COPY SECTIONS ── */
.cf{margin-bottom:14px}.cf:last-child{margin-bottom:0}
.cf-label{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8;margin-bottom:4px}
.cf-val{white-space:pre-line}
.copy-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px}
.faq-item{padding:10px 0;border-bottom:1px solid #f1f5f9}
.faq-item:last-child{border-bottom:none;padding-bottom:0}
.faq-q{font-weight:700;color:#0f172a;margin-bottom:3px}
.faq-a{color:#475569;font-size:.86rem}
.prompt-grid{display:flex;flex-direction:column;gap:10px}
.prompt-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:7px}
.prompt-shot{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#2563eb}
.prompt-text{font-size:.83rem;color:#334155;line-height:1.6}

/* ── BRANDS ── */
.brand-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;display:flex;align-items:flex-start;gap:14px;box-shadow:0 2px 12px rgba(15,23,42,.06);transition:all .12s;margin-bottom:10px}
.brand-card.is-active{border-color:#3b82f6;background:#f8fbff}
.bc-dot{width:10px;height:10px;background:#e2e8f0;border-radius:50%;margin-top:5px;flex-shrink:0}
.brand-card.is-active .bc-dot{background:linear-gradient(135deg,#1d4ed8,#3b82f6)}
.bc-info{flex:1}
.bc-name{font-size:.94rem;font-weight:800;color:#0f172a}
.bc-sub{font-size:.78rem;color:#64748b;margin-top:2px}
.bc-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}
.empty-state{text-align:center;padding:48px 20px;color:#94a3b8;font-size:.875rem;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 2px 12px rgba(15,23,42,.06)}

/* ── BRAND FORM ── */
.brand-form{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 2px 12px rgba(15,23,42,.06);margin-bottom:14px}
.bf-section-title{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#2563eb;padding-bottom:8px;border-bottom:1.5px solid #dbeafe;margin-top:6px}
.bf-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bf-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.bf-row{display:flex;flex-direction:column;gap:5px}
.bf-row label{font-size:.74rem;font-weight:600;color:#475569}
.bf-hint-inline{font-weight:400;color:#94a3b8;font-size:.71rem}
.bf-input{padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.875rem;font-family:inherit;color:#0f172a;outline:none;width:100%;background:#f8fafc;transition:all .12s}
.bf-input:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
.bf-input::placeholder{color:#cbd5e1}
.bf-err{background:#fee2e2;color:#dc2626;border-radius:8px;padding:10px 14px;font-size:.84rem}
.bf-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}
.bf-colors{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:4px}
.bf-color-item{display:flex;align-items:flex-start;gap:8px}
.bf-color-swatch{width:38px;height:38px;border-radius:8px;border:1.5px solid #e2e8f0;cursor:pointer;padding:2px;background:none;flex-shrink:0;margin-top:18px}
.bf-color-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-bottom:4px}
.bf-color-hex{font-size:.8rem!important;padding:6px 8px!important;font-family:monospace!important}

/* ── SETTINGS PANEL ── */
.overlay{position:fixed;inset:0;z-index:400;background:rgba(15,23,42,.35);backdrop-filter:blur(3px);display:flex;justify-content:flex-end}
.panel{width:420px;background:#fff;border-left:1px solid #e2e8f0;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(15,23,42,.1);height:100vh;overflow-y:auto}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #e2e8f0;flex-shrink:0}
.panel-title{font-size:.95rem;font-weight:800;color:#0f172a;letter-spacing:-.02em}
.panel-close{width:30px;height:30px;border-radius:7px;background:#f1f5f9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#64748b;transition:all .12s}
.panel-close:hover{background:#e2e8f0;color:#334155}
.panel-body{flex:1;padding:22px;display:flex;flex-direction:column;gap:24px}
.psec{display:flex;flex-direction:column;gap:12px}
.psec-title{font-size:.67rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8;margin-bottom:12px}
.psec-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px}
.psec-key{font-size:.78rem;font-weight:600;color:#475569}
.psec-val{font-size:.78rem;color:#64748b}
.psec-divider{height:1px;background:#f1f5f9}
.danger-zone{border:1px solid #fecaca;border-radius:10px;padding:16px;background:#fff5f5;display:flex;flex-direction:column;gap:10px}
.danger-title{font-size:.67rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:#dc2626;margin-bottom:2px}
.danger-desc{font-size:.78rem;color:#64748b}

/* ── IMAGE MODAL ── */
.img-modal{position:fixed;inset:0;background:rgba(15,23,42,.8);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
.img-modal img{max-width:100%;max-height:90vh;border-radius:10px;object-fit:contain}
.img-modal-close{position:absolute;top:20px;right:20px;background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.img-modal-close:hover{background:rgba(255,255,255,.25)}

/* ── COMING SOON ── */
.coming-soon{text-align:center;padding:60px 20px;color:#94a3b8}
.coming-soon-icon{font-size:2.5rem;margin-bottom:12px}
.coming-soon-title{font-size:1rem;font-weight:700;color:#334155;margin-bottom:6px}
.coming-soon-desc{font-size:.84rem}
`;

// ── LoginScreen ───────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const go = () => { const n = name.trim(); if (n) onLogin(n); };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{color-scheme:light}
        body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8}
        input{background:#f8fafc!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
      `}</style>
      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '40px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(15,23,42,.08)', textAlign: 'center', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(59,130,246,.3)', flexShrink: 0 }}>
            <IcoSparkFill />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-.03em', color: '#0f172a' }}>AliFlow</div>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Enter your workspace</div>
        <div style={{ fontSize: '.84rem', color: '#64748b', marginBottom: 24 }}>Each workspace is fully separate — your brands and generations stay private to you.</div>
        <input
          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: '.9rem', fontFamily: 'inherit', outline: 'none', textAlign: 'center', marginBottom: 12, color: '#0f172a', background: '#f8fafc' }}
          placeholder="Your name or workspace…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && go()}
          autoFocus
        />
        <button
          style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff', border: 'none', borderRadius: 9, fontSize: '.9rem', fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(37,99,235,.3)', opacity: name.trim() ? 1 : .4 }}
          onClick={go}
          disabled={!name.trim()}
        >
          Enter workspace
        </button>
        <div style={{ fontSize: '.75rem', color: '#cbd5e1', marginTop: 14 }}>Data is stored locally on this device only.</div>
      </div>
    </div>
  );
}

// ── BrandForm ─────────────────────────────────────────────────────
const EMPTY_BRAND = { id: '', name: '', tagline: '', niche: '', story: '', targetCustomer: '', tone: '', keyBenefits: '', alwaysEmphasise: '', copyRules: '', forbiddenWords: '', currency: 'AUD', priceMin: '', priceMax: '', priceMultiplier: '4', competitorContext: '', imageStyle: '', colorBg: '#ffffff', colorAccent: '#000000', colorText: '#000000' };

function BrandForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_BRAND);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return setErr('Brand name is required');
    if (!form.tone.trim()) return setErr('Brand tone is required');
    if (!form.targetCustomer.trim()) return setErr('Target customer is required');
    setErr('');
    onSave({ ...form, id: form.id || Date.now().toString(), name: form.name.trim() });
  };

  return (
    <div className="brand-form">
      <div className="bf-section-title">Basic Info</div>
      <div className="bf-grid2">
        <div className="bf-row"><label>Brand Name *</label><input className="bf-input" placeholder="Your brand name" value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="bf-row"><label>Tagline</label><input className="bf-input" placeholder="One-line brand promise" value={form.tagline} onChange={e => set('tagline', e.target.value)} /></div>
        <div className="bf-row"><label>Niche / Products</label><input className="bf-input" placeholder="What type of products do you sell?" value={form.niche} onChange={e => set('niche', e.target.value)} /></div>
        <div className="bf-row">
          <label>Currency</label>
          <select className="bf-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
            {['AUD', 'USD', 'EUR'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bf-row">
        <label>Brand Story <span className="bf-hint-inline">— 1-2 lines on why this brand exists. Claude weaves this into copy.</span></label>
        <textarea className="bf-input" rows={2} placeholder="e.g. We started this brand because we were tired of overpriced wellness products that don't actually work. Everything we sell is tested and priced fairly." value={form.story} onChange={e => set('story', e.target.value)} />
      </div>

      <div className="bf-section-title">Audience & Tone</div>
      <div className="bf-row">
        <label>Target Customer * <span className="bf-hint-inline">— be specific, Claude needs this to write accurately</span></label>
        <input className="bf-input" placeholder="Who exactly buys from you? Age, lifestyle, pain points, what they care about." value={form.targetCustomer} onChange={e => set('targetCustomer', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Brand Tone * <span className="bf-hint-inline">— describe how your brand sounds and what it never sounds like</span></label>
        <textarea className="bf-input" rows={2} placeholder="e.g. Warm, direct, minimal. Science-backed without being clinical. Never pushy, never use hype words, no exclamation marks." value={form.tone} onChange={e => set('tone', e.target.value)} />
      </div>

      <div className="bf-section-title">Copy Guidance</div>
      <div className="bf-row">
        <label>Key Benefits <span className="bf-hint-inline">— what makes your products better? One per line.</span></label>
        <textarea className="bf-input" rows={3} placeholder={"e.g.\nFree express shipping on all orders\n30-day no questions return policy\nAll products dermatologist tested\nNo cheap materials — we only sell what we'd use ourselves"} value={form.keyBenefits} onChange={e => set('keyBenefits', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Always Emphasise <span className="bf-hint-inline">— things Claude must always mention in copy</span></label>
        <input className="bf-input" placeholder="e.g. free shipping, money-back guarantee, fast results, limited stock" value={form.alwaysEmphasise} onChange={e => set('alwaysEmphasise', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Copy Rules <span className="bf-hint-inline">— specific writing rules, one per line</span></label>
        <textarea className="bf-input" rows={3} placeholder={"e.g.\nAlways open with the customer's problem\nUse 'you' not 'our customers'\nKeep sentences under 20 words\nNo bullet points in the overview — write in paragraphs"} value={form.copyRules} onChange={e => set('copyRules', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Forbidden Words <span className="bf-hint-inline">— words Claude must never use</span></label>
        <input className="bf-input" placeholder="e.g. amazing, revolutionary, game-changing, unleash, supercharge" value={form.forbiddenWords} onChange={e => set('forbiddenWords', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Competitor Context <span className="bf-hint-inline">— who do you compete with and how are you better?</span></label>
        <input className="bf-input" placeholder="e.g. We compete with X and Y. We're better because our products are higher quality at a lower price." value={form.competitorContext} onChange={e => set('competitorContext', e.target.value)} />
      </div>

      <div className="bf-section-title">Pricing</div>
      <div className="bf-grid3">
        <div className="bf-row"><label>Price Multiplier <span className="bf-hint-inline">× cost = retail</span></label><input className="bf-input" type="number" step="0.5" min="1" placeholder="4" value={form.priceMultiplier} onChange={e => set('priceMultiplier', e.target.value)} /></div>
        <div className="bf-row"><label>Min Retail Price</label><input className="bf-input" type="number" placeholder="e.g. 29" value={form.priceMin} onChange={e => set('priceMin', e.target.value)} /></div>
        <div className="bf-row"><label>Max Retail Price</label><input className="bf-input" type="number" placeholder="e.g. 199" value={form.priceMax} onChange={e => set('priceMax', e.target.value)} /></div>
      </div>

      <div className="bf-section-title">Visual Style & Colors</div>
      <div className="bf-row">
        <label>Image / Visual Style <span className="bf-hint-inline">— Claude uses this to write Lovart prompts</span></label>
        <textarea className="bf-input" rows={2} placeholder="e.g. Warm beige and cream tones. Soft natural light. Real people in relaxed home settings. No white studio backgrounds. No stock photo feel." value={form.imageStyle} onChange={e => set('imageStyle', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Brand Colors <span className="bf-hint-inline">— used in every Lovart image prompt for consistent visuals</span></label>
        <div className="bf-colors">
          <div className="bf-color-item">
            <input type="color" className="bf-color-swatch" value={form.colorBg} onChange={e => set('colorBg', e.target.value)} />
            <div style={{ flex: 1 }}>
              <div className="bf-color-label">Background</div>
              <input className="bf-input bf-color-hex" placeholder="#ffffff" value={form.colorBg} onChange={e => set('colorBg', e.target.value)} />
            </div>
          </div>
          <div className="bf-color-item">
            <input type="color" className="bf-color-swatch" value={form.colorAccent} onChange={e => set('colorAccent', e.target.value)} />
            <div style={{ flex: 1 }}>
              <div className="bf-color-label">Accent / Primary</div>
              <input className="bf-input bf-color-hex" placeholder="#000000" value={form.colorAccent} onChange={e => set('colorAccent', e.target.value)} />
            </div>
          </div>
          <div className="bf-color-item">
            <input type="color" className="bf-color-swatch" value={form.colorText} onChange={e => set('colorText', e.target.value)} />
            <div style={{ flex: 1 }}>
              <div className="bf-color-label">Text / Dark</div>
              <input className="bf-input bf-color-hex" placeholder="#000000" value={form.colorText} onChange={e => set('colorText', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {err && <div className="bf-err">{err}</div>}
      <div className="bf-actions">
        {onCancel && <button className="btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn-primary" onClick={save}>Save Brand</button>
      </div>
    </div>
  );
}

// ── RegenSection ──────────────────────────────────────────────────
function RegenSection({ title, children, copyText, sectionKey, productData, brand, selections, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const regen = async () => {
    if (!note.trim()) return setErr('Add a note on what to fix');
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productData, brand, selections: [sectionKey], regenNote: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Regen failed');
      onUpdate(sectionKey, data[sectionKey]);
      setOpen(false); setNote('');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="result-section">
      <div className="rs-header">
        <div className="rs-title">{title}</div>
        <div className="rs-btns">
          {copyText && <CopyBtn text={copyText} />}
          <button className="regen-btn" onClick={() => setOpen(o => !o)}>
            <IcoRegen />{open ? 'Cancel' : 'Regenerate'}
          </button>
        </div>
      </div>
      {open && (
        <div className="regen-panel">
          <div className="regen-label">What's wrong? Tell Claude what to fix:</div>
          <textarea className="regen-ta" rows={2} placeholder="e.g. Too formal, make it warmer. The FAQ doesn't address shipping time. Shot 3 prompt is too vague." value={note} onChange={e => setNote(e.target.value)} />
          {err && <div className="regen-err">{err}</div>}
          <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={regen} disabled={loading}>
            <IcoSpark />{loading ? 'Regenerating…' : 'Regenerate section'}
          </button>
        </div>
      )}
      <div className="rs-body">{children}</div>
    </div>
  );
}

// ── SettingsPanel ─────────────────────────────────────────────────
function SettingsPanel({ profile, onClose, onLogout }) {
  const clearData = () => {
    if (!confirm('This will delete all brands and generation history for this workspace. Are you sure?')) return;
    const prefix = `af:${profile}:`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    keys.forEach(k => localStorage.removeItem(k));
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">Settings</div>
          <button className="panel-close" onClick={onClose}>×</button>
        </div>
        <div className="panel-body">

          {/* Workspace */}
          <div className="psec">
            <div className="psec-title">Workspace</div>
            <div className="psec-row">
              <div className="psec-key">Current workspace</div>
              <div className="psec-val" style={{ fontWeight: 700, color: '#0f172a' }}>{profile}</div>
            </div>
            <button className="btn-danger" style={{ alignSelf: 'flex-start' }} onClick={onLogout}>Log out of workspace</button>
          </div>

          <div className="psec-divider" />

          {/* API */}
          <div className="psec">
            <div className="psec-title">API</div>
            <div className="psec-row">
              <div>
                <div className="psec-key">Claude API Key</div>
                <div className="psec-val" style={{ marginTop: 2 }}>Configured server-side — no key needed here.</div>
              </div>
              <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} />
            </div>
          </div>

          <div className="psec-divider" />

          {/* About */}
          <div className="psec">
            <div className="psec-title">About</div>
            <div className="psec-row">
              <div className="psec-key">AliFlow v1.0</div>
              <div className="psec-val">Brand Content Generator</div>
            </div>
            <div style={{ fontSize: '.78rem', color: '#94a3b8', paddingLeft: 2 }}>Powered by Claude AI. Generates product titles, pricing, copy, FAQ, and Lovart image prompts from AliExpress listings.</div>
          </div>

          <div className="psec-divider" />

          {/* Danger Zone */}
          <div className="psec">
            <div className="psec-title">Data</div>
            <div className="danger-zone">
              <div className="danger-title">Danger Zone</div>
              <div className="danger-desc">Permanently clears all brands, settings, and generation history for the workspace <strong>{profile}</strong>. This cannot be undone.</div>
              <button className="btn-danger" onClick={clearData}>Clear all workspace data</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile]             = useState(null);
  const [brands, setBrands]               = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(null);
  const [view, setView]                   = useState('generate');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand]   = useState(null);
  const [showSettings, setShowSettings]   = useState(false);

  // Generate state
  const [url, setUrl]               = useState('');
  const [notes, setNotes]           = useState('');
  const [selections, setSelections] = useState(() => GEN_OPTIONS.map(o => o.id));
  const [loading, setLoading]       = useState(false);
  const [status, setStatus]         = useState('');
  const [error, setError]           = useState('');
  const [result, setResult]         = useState(null);
  const [productData, setProductData] = useState(null);
  const [images, setImages]         = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const runIdRef = useRef(null);

  useEffect(() => { const p = ls.get('aliflow_profile', null); if (p) setProfile(p); }, []);
  useEffect(() => {
    if (!profile) return;
    const b = loadBrands(profile); setBrands(b);
    const a = loadActiveBrand(profile);
    if (a && b.find(x => x.id === a)) setActiveBrandId(a);
    else if (b.length > 0) { setActiveBrandId(b[0].id); saveActiveBrand(profile, b[0].id); }
  }, [profile]);

  const login  = (name) => { ls.set('aliflow_profile', name); setProfile(name); };
  const logout = () => { ls.set('aliflow_profile', null); setProfile(null); setBrands([]); setActiveBrandId(null); setShowSettings(false); };
  const activeBrand = brands.find(b => b.id === activeBrandId) || null;

  const saveBrand = (brand) => {
    const exists = brands.find(b => b.id === brand.id);
    const next = exists ? brands.map(b => b.id === brand.id ? brand : b) : [...brands, brand];
    setBrands(next); saveBrands(profile, next);
    setActiveBrandId(brand.id); saveActiveBrand(profile, brand.id);
    setShowBrandForm(false); setEditingBrand(null);
  };

  const deleteBrand = (id) => {
    if (!confirm('Delete this brand?')) return;
    const next = brands.filter(b => b.id !== id);
    setBrands(next); saveBrands(profile, next);
    if (activeBrandId === id) { const n = next[0]?.id || null; setActiveBrandId(n); saveActiveBrand(profile, n); }
  };

  const toggleSel = (id) => setSelections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const generate = async () => {
    if (!url.trim() || !url.includes('aliexpress.com')) return setError('Please paste a valid AliExpress product URL');
    if (!activeBrand) return setError('Set up a brand first');
    if (selections.length === 0) return setError('Select at least one thing to generate');
    setError(''); setLoading(true); setResult(null); setImages([]);
    setStatus('Starting scraper…');
    try {
      const startRes = await fetch('/api/scrape-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim() }) });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || 'Scrape start failed');
      runIdRef.current = startData.runId;
      setStatus('Scraping AliExpress product…');

      let pd = null;
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 6000));
        const poll = await fetch('/api/scrape-poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: runIdRef.current }) });
        const p = await poll.json();
        if (p.status === 'SUCCEEDED') { pd = p.data || {}; break; }
        if (p.status === 'FAILED') throw new Error('Scraper failed');
      }
      if (!pd) throw new Error('Scraper timed out');

      setImages(pd.images || []);
      setProductData({ ...pd, notes });
      setStatus('Generating with Claude…');

      const briefRes = await fetch('/api/brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productData: { ...pd, notes }, brand: activeBrand, selections }) });
      const brief = await briefRes.json();
      if (!briefRes.ok) throw new Error(brief.error || 'Generation failed');
      setResult(brief); setStatus('');
    } catch (e) { setError(e.message); setStatus(''); }
    finally { setLoading(false); }
  };

  const updateSection = (key, val) => setResult(prev => ({ ...prev, [key]: val }));
  const reset = () => { setUrl(''); setNotes(''); setResult(null); setImages([]); setError(''); setStatus(''); setProductData(null); };

  if (!profile) return <LoginScreen onLogin={login} />;

  return (
    <>
      <Head>
        <title>AliFlow — Brand Content Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{GLOBAL_CSS}</style>

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div className="topbar-logo-area">
          <div className="logo">
            <div className="logo-icon"><IcoSparkFill /></div>
            AliFlow
          </div>
        </div>
        <div className="topbar-center" />
        <div className="topbar-right">
          <button className="btn-logout" onClick={logout}>Log out</button>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div className="layout">

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          {/* WORKSPACE section */}
          <div className="sb-section">
            <div className="sb-label">Workspace</div>
            <button className={`sb-item${view === 'generate' ? ' active' : ''}`} onClick={() => setView('generate')}>
              <span className="sb-item-icon"><IcoSpark /></span>
              Generate
            </button>
            <button className={`sb-item${view === 'history' ? ' active' : ''}`} onClick={() => setView('history')}>
              <span className="sb-item-icon"><IcoClock /></span>
              History
            </button>
          </div>

          <div className="sb-divider" />

          {/* BRANDS section */}
          <div className="sb-section">
            <div className="sb-label">Brands</div>
            <button className={`sb-item${view === 'brands' ? ' active' : ''}`} onClick={() => { setView('brands'); setShowBrandForm(false); setEditingBrand(null); }}>
              <span className="sb-item-icon"><IcoList /></span>
              All Brands
            </button>
            <button className="sb-item" onClick={() => { setView('brands'); setEditingBrand(null); setShowBrandForm(true); }}>
              <span className="sb-item-icon"><IcoPlus /></span>
              New Brand
            </button>
          </div>

          {/* Bottom section */}
          <div className="sb-bottom">
            <button className={`sb-item${showSettings ? ' active' : ''}`} onClick={() => setShowSettings(true)}>
              <span className="sb-item-icon"><IcoGear /></span>
              Settings
            </button>
            <div className="sb-divider" style={{ margin: '4px 0' }} />
            <div className="avatar-chip">
              <div className="avatar">{profile[0].toUpperCase()}</div>
              <span className="avatar-name">{profile}</span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="main">

          {/* ── GENERATE VIEW ── */}
          {view === 'generate' && (
            <>
              <div className="page-header">
                <h1 className="page-title">Generate Content</h1>
                <div className="page-sub">Paste an AliExpress URL to generate branded product content with Claude AI.</div>
              </div>

              {!activeBrand && (
                <div className="warn-banner">
                  Select a brand first to start generating content.
                  <button className="warn-banner-btn" onClick={() => setView('brands')}>Go to Brands →</button>
                </div>
              )}

              {!result && (
                <>
                  {/* URL + Notes card */}
                  <div className="card">
                    <div className="card-title">Product URL</div>
                    <div className="field-group">
                      <input
                        className="input-text"
                        placeholder="https://www.aliexpress.com/item/..."
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !loading && generate()}
                        disabled={loading}
                      />
                    </div>
                    <div className="field-sep" />
                    <div className="field-group">
                      <div className="field-label">
                        Notes for Claude <span style={{ fontWeight: 400, fontSize: '.71rem', color: '#94a3b8' }}>(optional — extra context, angle, target price…)</span>
                      </div>
                      <textarea
                        className="input-ta"
                        rows={2}
                        placeholder="e.g. Push the warmth angle, target retail price AUD $49, this is for our winter collection..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* What to generate card */}
                  <div className="card">
                    <div className="card-title">
                      What to generate
                      <button onClick={() => setSelections(sel => sel.length === GEN_OPTIONS.length ? [] : GEN_OPTIONS.map(o => o.id))}>
                        {selections.length === GEN_OPTIONS.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="gen-opts-grid">
                      {GEN_OPTIONS.map(opt => (
                        <div key={opt.id} className={`gen-opt${selections.includes(opt.id) ? ' checked' : ''}`} onClick={() => toggleSel(opt.id)}>
                          <div className="gen-opt-cb">{selections.includes(opt.id) && <IcoOk />}</div>
                          <div>
                            <div className="gen-opt-label">{opt.label}</div>
                            <div className="gen-opt-desc">{opt.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="gen-row">
                      <button className="btn-primary" onClick={generate} disabled={loading || !activeBrand || selections.length === 0}>
                        <IcoSpark />{loading ? 'Generating…' : `Generate ${selections.length} section${selections.length !== 1 ? 's' : ''}`}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {status && <div className="status-bar"><div className="spin" />{status}</div>}
              {error && <div className="error-bar">{error}</div>}

              {images.length > 0 && (
                <div className="images-strip">
                  {images.map((img, i) => (
                    <img key={i} src={img} className={`img-thumb${selectedImg === img ? ' sel' : ''}`} alt="" onClick={() => setSelectedImg(img)} onError={e => e.target.style.display = 'none'} />
                  ))}
                </div>
              )}

              {result && (
                <>
                  <div className="result-top">
                    <div>
                      {result.productName && <div className="result-name">{result.productName}</div>}
                      {result.painPoint && <div className="result-pain">{result.painPoint}</div>}
                    </div>
                    <div className="result-actions">
                      <CopyBtn text={JSON.stringify(result, null, 2)} label="Copy all" />
                      <button className="btn-ghost" onClick={reset}>New product</button>
                    </div>
                  </div>

                  <div className="result-wrap">
                    {result.pricing && (
                      <RegenSection title="Pricing" sectionKey="pricing" productData={productData} brand={activeBrand} selections={selections} onUpdate={updateSection}
                        copyText={`AliExpress: ${result.pricing.aliExpressPrice}\nRetail: ${result.pricing.suggestedRetail}\nSale: ${result.pricing.suggestedSalePrice}\n${result.pricing.reasoning || ''}`}>
                        <div className="price-grid">
                          <div className="price-cell"><div className="price-label">AliExpress</div><div className="price-val">{result.pricing.aliExpressPrice}</div></div>
                          <div className="price-cell"><div className="price-label">Retail</div><div className="price-val">{result.pricing.suggestedRetail}</div></div>
                          <div className="price-cell"><div className="price-label">Sale Price</div><div className="price-val">{result.pricing.suggestedSalePrice}</div></div>
                          {result.pricing.reasoning && <div className="price-reason">{result.pricing.reasoning}</div>}
                        </div>
                      </RegenSection>
                    )}

                    {result.copy && (
                      <RegenSection title="Copy" sectionKey="copy" productData={productData} brand={activeBrand} selections={selections} onUpdate={updateSection}
                        copyText={Object.values(result.copy).join('\n\n')}>
                        {result.copy.subtitle && <div className="cf"><div className="cf-label">Subtitle</div><div style={{ fontSize: '1rem', fontWeight: 700 }}>{result.copy.subtitle}</div></div>}
                        {result.copy.shortDescription && <div className="cf"><div className="cf-label">Short Description</div><div className="cf-val">{result.copy.shortDescription}</div></div>}
                        {result.copy.overview && <div className="cf"><div className="cf-label">Overview</div><div className="cf-val">{result.copy.overview}</div></div>}
                        <div className="copy-2col">
                          {result.copy.materials && <div><div className="cf-label">Materials</div><div className="cf-val" style={{ fontSize: '.84rem' }}>{result.copy.materials}</div></div>}
                          {result.copy.care && <div><div className="cf-label">Care</div><div className="cf-val" style={{ fontSize: '.84rem' }}>{result.copy.care}</div></div>}
                        </div>
                      </RegenSection>
                    )}

                    {result.faq?.length > 0 && (
                      <RegenSection title="FAQ" sectionKey="faq" productData={productData} brand={activeBrand} selections={selections} onUpdate={updateSection}
                        copyText={result.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}>
                        {result.faq.map((f, i) => (
                          <div key={i} className="faq-item">
                            <div className="faq-q">Q: {f.q}</div>
                            <div className="faq-a">{f.a}</div>
                          </div>
                        ))}
                      </RegenSection>
                    )}

                    {result.imagePrompts && (
                      <RegenSection title="Lovart Image Prompts" sectionKey="imagePrompts" productData={productData} brand={activeBrand} selections={selections} onUpdate={updateSection}
                        copyText={Object.entries(result.imagePrompts).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n\n')}>
                        <div className="prompt-grid">
                          {Object.entries(result.imagePrompts).map(([shot, prompt]) => (
                            <div key={shot} className="prompt-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="prompt-shot">{shot.replace('shot', 'Shot ')}</div>
                                <CopyBtn text={prompt} />
                              </div>
                              <div className="prompt-text">{prompt}</div>
                            </div>
                          ))}
                        </div>
                        {result.googleShoppingPrompt && (
                          <div style={{ marginTop: 12 }}>
                            <div className="cf-label" style={{ marginBottom: 6 }}>Google Shopping Prompt</div>
                            <div className="prompt-item">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="prompt-shot">Google Shopping</div>
                                <CopyBtn text={result.googleShoppingPrompt} />
                              </div>
                              <div className="prompt-text">{result.googleShoppingPrompt}</div>
                            </div>
                          </div>
                        )}
                      </RegenSection>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── HISTORY VIEW ── */}
          {view === 'history' && (
            <>
              <div className="page-header">
                <h1 className="page-title">History</h1>
                <div className="page-sub">Your past generations will appear here.</div>
              </div>
              <div className="coming-soon">
                <div className="coming-soon-icon" style={{ fontSize: '2rem', marginBottom: 12 }}>
                  <IcoClock />
                </div>
                <div className="coming-soon-title">Coming soon</div>
                <div className="coming-soon-desc">Generation history will be saved here in a future update.</div>
              </div>
            </>
          )}

          {/* ── BRANDS VIEW ── */}
          {view === 'brands' && (
            <>
              <div className="page-header-row page-header">
                <div>
                  <h1 className="page-title">Brand Profiles</h1>
                  <div className="page-sub">Each brand has its own tone, rules and pricing. All generations are matched to the active brand.</div>
                </div>
                {!showBrandForm && (
                  <button className="btn-primary" onClick={() => { setEditingBrand(null); setShowBrandForm(true); }}>
                    <IcoPlus />New Brand
                  </button>
                )}
              </div>

              {showBrandForm && (
                <BrandForm
                  initial={editingBrand}
                  onSave={saveBrand}
                  onCancel={() => { setShowBrandForm(false); setEditingBrand(null); }}
                />
              )}

              {brands.length === 0 && !showBrandForm && (
                <div className="empty-state">
                  No brands yet.<br />Create your first brand profile to start generating content.
                </div>
              )}

              {brands.map(brand => (
                <div key={brand.id} className={`brand-card${brand.id === activeBrandId ? ' is-active' : ''}`}>
                  <div className="bc-dot" />
                  <div className="bc-info">
                    <div className="bc-name">{brand.name}</div>
                    <div className="bc-sub">{[brand.tagline, brand.niche, brand.targetCustomer].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="bc-actions">
                    {brand.id !== activeBrandId
                      ? <button className="btn-sm" onClick={() => { setActiveBrandId(brand.id); saveActiveBrand(profile, brand.id); }}><IcoArrow />Use</button>
                      : <button className="btn-sm is-active">Active</button>
                    }
                    <button className="btn-sm" onClick={() => { setEditingBrand(brand); setShowBrandForm(true); }}><IcoEdit />Edit</button>
                    <button className="btn-danger" onClick={() => deleteBrand(brand.id)}><IcoTrash /></button>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <SettingsPanel
          profile={profile}
          onClose={() => setShowSettings(false)}
          onLogout={logout}
        />
      )}

      {/* ── IMAGE MODAL ── */}
      {selectedImg && (
        <div className="img-modal" onClick={() => setSelectedImg(null)}>
          <button className="img-modal-close" onClick={() => setSelectedImg(null)}>×</button>
          <img src={selectedImg} alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
