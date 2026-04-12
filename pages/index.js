import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

// ─── localStorage helpers ───────────────────────────────────────
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const loadBrands = () => ls.get('aliflow_brands', []);
const saveBrands = (v) => ls.set('aliflow_brands', v);
const loadActiveBrand = () => ls.get('aliflow_active_brand', null);
const saveActiveBrand = (v) => ls.set('aliflow_active_brand', v);

// ─── Icons ──────────────────────────────────────────────────────
const IcoCopy = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
    <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 11V2h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
    <path d="M3 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
    <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
    <path d="M10.5 2.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
    <path d="M2 4h11M5 4V2.5h5V4M6 7v4M9 7v4M3 4l.8 9.5h7.4L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
    <path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoSpark = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7.5 1l1.5 4.5H13L9.5 8l1.5 4.5L7.5 10 4 12.5 5.5 8 2 5.5h4L7.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);

// ─── CopyBtn ────────────────────────────────────────────────────
function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy} title="Copy to clipboard">
      {copied ? <IcoCheck /> : <IcoCopy />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

// ─── BrandForm ──────────────────────────────────────────────────
function BrandForm({ initial, onSave, onCancel }) {
  const empty = { id:'', name:'', tagline:'', niche:'', tone:'', targetCustomer:'', copyRules:'', forbiddenWords:'', priceMultiplier:'4', imageStyle:'' };
  const [form, setForm] = useState(initial || empty);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return setErr('Brand name is required');
    if (!form.tone.trim()) return setErr('Brand tone is required');
    setErr('');
    onSave({ ...form, id: form.id || Date.now().toString(), name: form.name.trim() });
  };

  return (
    <div className="brand-form">
      <div className="bf-grid">
        <div className="bf-row">
          <label>Brand Name *</label>
          <input className="bf-input" placeholder="e.g. Kopflo" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="bf-row">
          <label>Tagline</label>
          <input className="bf-input" placeholder="e.g. Sleep Smarter" value={form.tagline} onChange={e => set('tagline', e.target.value)} />
        </div>
        <div className="bf-row">
          <label>Niche / Products</label>
          <input className="bf-input" placeholder="e.g. sleep & wellness" value={form.niche} onChange={e => set('niche', e.target.value)} />
        </div>
        <div className="bf-row">
          <label>Price Multiplier</label>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <input className="bf-input" style={{width:70}} type="number" step="0.5" min="1" value={form.priceMultiplier} onChange={e => set('priceMultiplier', e.target.value)} />
            <span className="bf-hint">× AliExpress = retail price</span>
          </div>
        </div>
      </div>
      <div className="bf-row">
        <label>Target Customer *</label>
        <input className="bf-input" placeholder="e.g. busy professionals 25-40 who struggle to sleep" value={form.targetCustomer} onChange={e => set('targetCustomer', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Brand Tone *</label>
        <textarea className="bf-input" rows={2} placeholder="e.g. calm, premium, science-backed. Never pushy or gimmicky." value={form.tone} onChange={e => set('tone', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Copy Rules</label>
        <textarea className="bf-input" rows={3} placeholder={"e.g.\nAlways lead with the problem\nUse 'you' not 'our customers'\nNo exclamation marks"} value={form.copyRules} onChange={e => set('copyRules', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Forbidden Words</label>
        <input className="bf-input" placeholder="e.g. amazing, revolutionary, game-changing" value={form.forbiddenWords} onChange={e => set('forbiddenWords', e.target.value)} />
      </div>
      <div className="bf-row">
        <label>Image Style</label>
        <textarea className="bf-input" rows={2} placeholder="e.g. warm beige tones, soft shadows, real people, no white backgrounds" value={form.imageStyle} onChange={e => set('imageStyle', e.target.value)} />
      </div>
      {err && <div className="bf-err">{err}</div>}
      <div className="bf-actions">
        {onCancel && <button className="btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn-primary" onClick={save}>Save Brand</button>
      </div>
    </div>
  );
}

// ─── Result Section ──────────────────────────────────────────────
function Section({ title, children, copyText }) {
  return (
    <div className="result-section">
      <div className="rs-header">
        <div className="rs-title">{title}</div>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      <div className="rs-body">{children}</div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────
export default function App() {
  const [brands, setBrands] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(null);
  const [view, setView] = useState('generate');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const runIdRef = useRef(null);

  useEffect(() => {
    const b = loadBrands();
    setBrands(b);
    const a = loadActiveBrand();
    if (a && b.find(x => x.id === a)) setActiveBrandId(a);
    else if (b.length > 0) { setActiveBrandId(b[0].id); saveActiveBrand(b[0].id); }
  }, []);

  const activeBrand = brands.find(b => b.id === activeBrandId) || null;

  const saveBrand = (brand) => {
    const exists = brands.find(b => b.id === brand.id);
    const next = exists ? brands.map(b => b.id === brand.id ? brand : b) : [...brands, brand];
    setBrands(next); saveBrands(next);
    setActiveBrandId(brand.id); saveActiveBrand(brand.id);
    setShowBrandForm(false); setEditingBrand(null);
  };

  const deleteBrand = (id) => {
    if (!confirm('Delete this brand?')) return;
    const next = brands.filter(b => b.id !== id);
    setBrands(next); saveBrands(next);
    if (activeBrandId === id) { const n = next[0]?.id || null; setActiveBrandId(n); saveActiveBrand(n); }
  };

  const generate = async () => {
    if (!url.trim() || !url.includes('aliexpress.com')) return setError('Please paste a valid AliExpress product URL');
    if (!activeBrand) return setError('Set up a brand first');
    setError(''); setLoading(true); setResult(null); setImages([]);
    setStatus('Starting scraper…');
    try {
      const startRes = await fetch('/api/scrape-start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: url.trim() }) });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || 'Scrape start failed');
      runIdRef.current = startData.runId;
      setStatus('Scraping AliExpress product…');

      let productData = null;
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 6000));
        const pollRes = await fetch('/api/scrape-poll', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ runId: runIdRef.current }) });
        const poll = await pollRes.json();
        if (poll.status === 'SUCCEEDED') { productData = poll.data || {}; break; }
        if (poll.status === 'FAILED') throw new Error('Scraper failed');
      }
      if (!productData) throw new Error('Scraper timed out');

      setImages(productData.images || []);
      setStatus('Generating brand brief with Claude…');

      const briefRes = await fetch('/api/brief', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productData: { ...productData, notes }, brand: activeBrand }) });
      const brief = await briefRes.json();
      if (!briefRes.ok) throw new Error(brief.error || 'Brief generation failed');

      setResult(brief); setStatus('');
    } catch (err) {
      setError(err.message); setStatus('');
    } finally { setLoading(false); }
  };

  const reset = () => { setUrl(''); setNotes(''); setResult(null); setImages([]); setError(''); setStatus(''); };

  return (
    <>
      <Head>
        <title>AliFlow — Brand Content Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;min-height:100vh}

        .topbar{position:fixed;top:0;left:0;right:0;z-index:100;height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 24px;gap:0}
        .logo{font-size:1.05rem;font-weight:800;letter-spacing:-.03em;color:#0f172a;display:flex;align-items:center;gap:7px}
        .logo-dot{width:8px;height:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%}
        .logo-sub{font-size:.72rem;font-weight:500;color:#94a3b8;margin-left:4px}
        .topbar-nav{display:flex;gap:2px;margin-left:32px}
        .tn-btn{padding:6px 14px;font-size:.8rem;font-weight:600;border-radius:7px;border:none;cursor:pointer;background:none;color:#64748b;transition:all .15s}
        .tn-btn:hover{background:#f1f5f9;color:#0f172a}
        .tn-btn.active{background:#f1f5f9;color:#0f172a}
        .topbar-right{margin-left:auto;display:flex;align-items:center;gap:10px}
        .brand-pill{padding:5px 14px;background:#f1f5f9;border-radius:20px;font-size:.78rem;font-weight:700;color:#475569;border:1.5px solid #e2e8f0;cursor:pointer;display:flex;align-items:center;gap:6px}
        .brand-pill:hover{border-color:#6366f1;color:#6366f1}
        .bp-dot{width:7px;height:7px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%}

        .page{padding-top:56px;min-height:100vh}
        .main{max-width:860px;margin:0 auto;padding:32px 20px 80px}

        .gen-hero{text-align:center;margin-bottom:32px}
        .gen-hero h1{font-size:1.7rem;font-weight:800;letter-spacing:-.03em}
        .gen-hero p{margin-top:8px;font-size:.9rem;color:#64748b}

        .warn-bar{background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:14px 18px;font-size:.84rem;color:#92400e;display:flex;align-items:center;gap:10px;margin-bottom:24px}
        .warn-bar button{margin-left:auto;background:#f59e0b;color:#fff;border:none;border-radius:6px;padding:5px 14px;font-size:.78rem;font-weight:700;cursor:pointer}

        .input-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:20px;box-shadow:0 2px 10px rgba(15,23,42,.05)}
        .ic-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:8px}
        .ic-row{display:flex;gap:10px}
        .ic-row input{flex:1;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.9rem;font-family:inherit;color:#0f172a;outline:none;transition:border .15s}
        .ic-row input:focus{border-color:#6366f1}
        .ic-row input::placeholder{color:#cbd5e1}
        .ic-sep{height:1px;background:#f1f5f9;margin:16px 0}
        textarea.bf-input,textarea.ic-ta{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.84rem;font-family:inherit;color:#0f172a;outline:none;resize:vertical;transition:border .15s}
        textarea.bf-input:focus,textarea.ic-ta:focus{border-color:#6366f1}
        textarea.bf-input::placeholder,textarea.ic-ta::placeholder{color:#cbd5e1}

        .btn-primary{padding:10px 22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:9px;font-size:.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:opacity .15s;white-space:nowrap}
        .btn-primary:hover{opacity:.9}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .btn-ghost{padding:9px 18px;background:#f1f5f9;color:#475569;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .15s}
        .btn-ghost:hover{border-color:#cbd5e1;color:#0f172a}
        .btn-danger{padding:7px 12px;background:#fee2e2;color:#dc2626;border:1.5px solid #fecaca;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}
        .btn-danger:hover{background:#fecaca}
        .btn-sm{padding:6px 12px;font-size:.78rem;font-weight:600;border-radius:7px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#475569;cursor:pointer;display:flex;align-items:center;gap:5px}
        .btn-sm:hover{border-color:#cbd5e1;color:#0f172a}
        .btn-sm.is-active{background:#ede9fe;border-color:#c4b5fd;color:#6d28d9}

        .status-bar{background:#ede9fe;border:1.5px solid #c4b5fd;border-radius:10px;padding:14px 18px;font-size:.85rem;color:#6d28d9;font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:20px}
        .spin{width:16px;height:16px;border:2px solid #c4b5fd;border-top-color:#6d28d9;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .error-bar{background:#fee2e2;border:1.5px solid #fecaca;border-radius:10px;padding:14px 18px;font-size:.85rem;color:#dc2626;margin-bottom:20px}

        .images-strip{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
        .img-thumb{width:80px;height:80px;border-radius:8px;object-fit:cover;border:2px solid #e2e8f0;cursor:pointer;transition:border-color .15s}
        .img-thumb:hover,.img-thumb.sel{border-color:#6366f1}

        .result-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px}
        .result-name{font-size:1.5rem;font-weight:800;letter-spacing:-.02em}
        .result-pain{font-size:.9rem;color:#64748b;margin-top:5px}
        .result-actions{display:flex;gap:8px;flex-shrink:0}
        .result-wrap{display:flex;flex-direction:column;gap:14px}

        .result-section{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden}
        .rs-header{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
        .rs-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#64748b}
        .rs-body{padding:16px;font-size:.88rem;line-height:1.65;color:#1e293b}

        .copy-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;font-size:.74rem;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s}
        .copy-btn:hover{background:#e2e8f0;color:#0f172a}
        .copy-btn.copied{background:#dcfce7;border-color:#86efac;color:#16a34a}

        .price-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
        .price-cell{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
        .price-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px}
        .price-val{font-size:1.1rem;font-weight:800;color:#0f172a}
        .price-reason{grid-column:1/-1;font-size:.82rem;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}

        .copy-field{margin-bottom:14px}
        .copy-field:last-child{margin-bottom:0}
        .cf-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:5px}
        .cf-val{white-space:pre-line}
        .copy-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px}

        .faq-item{padding:10px 0;border-bottom:1px solid #f1f5f9}
        .faq-item:last-child{border-bottom:none;padding-bottom:0}
        .faq-q{font-weight:700;color:#0f172a;margin-bottom:3px}
        .faq-a{color:#475569;font-size:.86rem}

        .prompt-grid{display:flex;flex-direction:column;gap:10px}
        .prompt-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:7px}
        .prompt-shot{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6366f1}
        .prompt-text{font-size:.83rem;color:#334155;line-height:1.6}

        .brands-wrap{display:flex;flex-direction:column;gap:16px}
        .section-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
        .section-title{font-size:1.1rem;font-weight:800}
        .section-sub{font-size:.84rem;color:#64748b;margin-top:3px}
        .brand-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:14px}
        .brand-card.is-active{border-color:#6366f1;background:#fafaff}
        .bc-dot{width:10px;height:10px;background:#e2e8f0;border-radius:50%;margin-top:5px;flex-shrink:0}
        .brand-card.is-active .bc-dot{background:linear-gradient(135deg,#6366f1,#8b5cf6)}
        .bc-info{flex:1}
        .bc-name{font-size:1rem;font-weight:800;color:#0f172a}
        .bc-sub{font-size:.8rem;color:#64748b;margin-top:2px}
        .bc-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}

        .brand-form{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:14px}
        .bf-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .bf-row{display:flex;flex-direction:column;gap:5px}
        .bf-row label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
        .bf-input{padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.88rem;font-family:inherit;color:#0f172a;outline:none;width:100%;transition:border .15s}
        .bf-input:focus{border-color:#6366f1}
        .bf-input::placeholder{color:#cbd5e1}
        .bf-hint{font-size:.78rem;color:#94a3b8}
        .bf-err{background:#fee2e2;color:#dc2626;border-radius:8px;padding:10px 14px;font-size:.84rem}
        .bf-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}

        .empty-state{text-align:center;padding:48px 20px;color:#94a3b8;font-size:.9rem;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px}

        .img-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .img-modal img{max-width:100%;max-height:90vh;border-radius:10px;object-fit:contain}
        .img-modal-close{position:absolute;top:20px;right:20px;background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.3rem;cursor:pointer;line-height:1}
      `}</style>

      <div className="page">
        <div className="topbar">
          <div className="logo">
            <div className="logo-dot" />
            AliFlow
            <span className="logo-sub">Content Generator</span>
          </div>
          <div className="topbar-nav">
            <button className={`tn-btn${view==='generate'?' active':''}`} onClick={() => setView('generate')}>Generate</button>
            <button className={`tn-btn${view==='brands'?' active':''}`} onClick={() => setView('brands')}>Brands</button>
          </div>
          <div className="topbar-right">
            {activeBrand
              ? <div className="brand-pill" onClick={() => setView('brands')}><div className="bp-dot" />{activeBrand.name}</div>
              : <div className="brand-pill" onClick={() => setView('brands')}>+ Add Brand</div>
            }
          </div>
        </div>

        <div className="main">
          {/* ── GENERATE ── */}
          {view === 'generate' && (
            <>
              <div className="gen-hero">
                <h1>Turn any AliExpress product into branded content</h1>
                <p>Paste a URL → get copy, pricing, FAQ and Lovart image prompts matched to your brand.</p>
              </div>

              {!activeBrand && (
                <div className="warn-bar">
                  ⚠️ You need a brand profile before generating.
                  <button onClick={() => setView('brands')}>Set up brand →</button>
                </div>
              )}

              {!result && (
                <div className="input-card">
                  <div className="ic-label">AliExpress Product URL</div>
                  <div className="ic-row">
                    <input
                      placeholder="https://www.aliexpress.com/item/..."
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && !loading && generate()}
                      disabled={loading}
                    />
                    <button className="btn-primary" onClick={generate} disabled={loading || !activeBrand}>
                      <IcoSpark />{loading ? 'Generating…' : 'Generate'}
                    </button>
                  </div>
                  <div className="ic-sep" />
                  <div className="ic-label">Notes for Claude (optional)</div>
                  <textarea
                    className="ic-ta"
                    rows={3}
                    placeholder="e.g. Push the warmth angle, target price AUD $49, winter collection..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              {status && <div className="status-bar"><div className="spin" />{status}</div>}
              {error && <div className="error-bar">{error}</div>}

              {images.length > 0 && (
                <div className="images-strip">
                  {images.map((img,i) => (
                    <img key={i} src={img} className={`img-thumb${selectedImg===img?' sel':''}`}
                      alt="" onClick={() => setSelectedImg(img)}
                      onError={e => e.target.style.display='none'} />
                  ))}
                </div>
              )}

              {result && (
                <>
                  <div className="result-top">
                    <div>
                      <div className="result-name">{result.productName}</div>
                      {result.painPoint && <div className="result-pain">{result.painPoint}</div>}
                    </div>
                    <div className="result-actions">
                      <CopyBtn text={JSON.stringify(result, null, 2)} label="Copy all" />
                      <button className="btn-ghost" onClick={reset}>New product</button>
                    </div>
                  </div>

                  <div className="result-wrap">
                    {result.pricing && (
                      <Section title="Pricing">
                        <div className="price-grid">
                          <div className="price-cell"><div className="price-label">AliExpress</div><div className="price-val">{result.pricing.aliExpressPrice}</div></div>
                          <div className="price-cell"><div className="price-label">Retail</div><div className="price-val">{result.pricing.suggestedRetail}</div></div>
                          <div className="price-cell"><div className="price-label">Sale Price</div><div className="price-val">{result.pricing.suggestedSalePrice}</div></div>
                          {result.pricing.reasoning && <div className="price-reason">{result.pricing.reasoning}</div>}
                        </div>
                      </Section>
                    )}

                    {result.copy && (
                      <Section title="Copy" copyText={Object.values(result.copy).join('\n\n')}>
                        {result.copy.subtitle && <div className="copy-field"><div className="cf-label">Subtitle</div><div style={{fontSize:'1rem',fontWeight:700,color:'#0f172a'}}>{result.copy.subtitle}</div></div>}
                        {result.copy.shortDescription && <div className="copy-field"><div className="cf-label">Short Description</div><div className="cf-val">{result.copy.shortDescription}</div></div>}
                        {result.copy.overview && <div className="copy-field"><div className="cf-label">Overview</div><div className="cf-val">{result.copy.overview}</div></div>}
                        <div className="copy-2col">
                          {result.copy.materials && <div><div className="cf-label">Materials</div><div className="cf-val" style={{fontSize:'.84rem'}}>{result.copy.materials}</div></div>}
                          {result.copy.care && <div><div className="cf-label">Care</div><div className="cf-val" style={{fontSize:'.84rem'}}>{result.copy.care}</div></div>}
                        </div>
                      </Section>
                    )}

                    {result.faq?.length > 0 && (
                      <Section title="FAQ" copyText={result.faq.map(f=>`Q: ${f.q}\nA: ${f.a}`).join('\n\n')}>
                        {result.faq.map((f,i) => (
                          <div key={i} className="faq-item">
                            <div className="faq-q">Q: {f.q}</div>
                            <div className="faq-a">{f.a}</div>
                          </div>
                        ))}
                      </Section>
                    )}

                    {result.imagePrompts && (
                      <Section title="Lovart Image Prompts" copyText={Object.entries(result.imagePrompts).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join('\n\n')}>
                        <div className="prompt-grid">
                          {Object.entries(result.imagePrompts).map(([shot, prompt]) => (
                            <div key={shot} className="prompt-item">
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <div className="prompt-shot">{shot.replace('shot','Shot ')}</div>
                                <CopyBtn text={prompt} />
                              </div>
                              <div className="prompt-text">{prompt}</div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {result.googleShoppingPrompt && (
                      <Section title="Google Shopping Image Prompt" copyText={result.googleShoppingPrompt}>
                        <div className="prompt-text">{result.googleShoppingPrompt}</div>
                      </Section>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── BRANDS ── */}
          {view === 'brands' && (
            <div className="brands-wrap">
              <div className="section-head">
                <div>
                  <div className="section-title">Brand Profiles</div>
                  <div className="section-sub">Each brand has its own tone, rules and pricing. Switch between brands to generate for different stores.</div>
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
                <div key={brand.id} className={`brand-card${brand.id===activeBrandId?' is-active':''}`}>
                  <div className="bc-dot" />
                  <div className="bc-info">
                    <div className="bc-name">{brand.name}</div>
                    <div className="bc-sub">{[brand.tagline, brand.niche, brand.targetCustomer].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="bc-actions">
                    {brand.id !== activeBrandId
                      ? <button className="btn-sm" onClick={() => { setActiveBrandId(brand.id); saveActiveBrand(brand.id); }}><IcoArrow />Use</button>
                      : <button className="btn-sm is-active">Active</button>
                    }
                    <button className="btn-sm" onClick={() => { setEditingBrand(brand); setShowBrandForm(true); }}><IcoEdit />Edit</button>
                    <button className="btn-danger" onClick={() => deleteBrand(brand.id)}><IcoTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedImg && (
        <div className="img-modal" onClick={() => setSelectedImg(null)}>
          <button className="img-modal-close" onClick={() => setSelectedImg(null)}>×</button>
          <img src={selectedImg} alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
