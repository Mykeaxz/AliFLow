import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

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
const IcoCopy = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 11V2h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IcoOk   = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M3 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoPlus = () => <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IcoEdit = () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M10.5 2.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const IcoTrash= () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M2 4h11M5 4V2.5h5V4M6 7v4M9 7v4M3 4l.8 9.5h7.4L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoArrow= () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoSpark= () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1l1.5 4.5H13L9.5 8l1.5 4.5L7.5 10 4 12.5 5.5 8 2 5.5h4L7.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const IcoRegen= () => <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M13 7A6 6 0 112 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M13 3v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ── CopyBtn ───────────────────────────────────────────────────────
function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button className={`copy-btn${copied?' copied':''}`} onClick={copy}>
      {copied ? <IcoOk /> : <IcoCopy />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

// ── LoginScreen ───────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const go = () => { const n = name.trim(); if (n) onLogin(n); };
  return (
    <div className="login-wrap">
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc}.login-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:40px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(15,23,42,.08);text-align:center}.l-logo{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:28px}.l-dot{width:10px;height:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%}.l-name{font-size:1.3rem;font-weight:800;letter-spacing:-.03em}.l-title{font-size:1rem;font-weight:700;margin-bottom:6px}.l-sub{font-size:.84rem;color:#64748b;margin-bottom:24px}.l-input{width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.9rem;font-family:inherit;outline:none;transition:border .15s;text-align:center;margin-bottom:12px}.l-input:focus{border-color:#6366f1}.l-input::placeholder{color:#cbd5e1}.l-btn{width:100%;padding:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:9px;font-size:.9rem;font-weight:700;cursor:pointer}.l-btn:disabled{opacity:.4;cursor:not-allowed}.l-hint{font-size:.75rem;color:#cbd5e1;margin-top:14px}`}</style>
      <div className="login-card">
        <div className="l-logo"><div className="l-dot"/><div className="l-name">AliFlow</div></div>
        <div className="l-title">Enter your workspace</div>
        <div className="l-sub">Each workspace is fully separate — your brands and generations stay private to you.</div>
        <input className="l-input" placeholder="Your name or workspace…" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter' && go()} autoFocus />
        <button className="l-btn" onClick={go} disabled={!name.trim()}>Enter workspace</button>
        <div className="l-hint">Data is stored locally on this device only.</div>
      </div>
    </div>
  );
}

// ── BrandForm ─────────────────────────────────────────────────────
const EMPTY_BRAND = { id:'', name:'', tagline:'', niche:'', story:'', targetCustomer:'', tone:'', keyBenefits:'', alwaysEmphasise:'', copyRules:'', forbiddenWords:'', currency:'AUD', priceMin:'', priceMax:'', priceMultiplier:'4', competitorContext:'', imageStyle:'' };

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
            {['AUD','USD','EUR'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bf-row"><label>Brand Story <span className="bf-hint-inline">— 1-2 lines on why this brand exists. Claude weaves this into copy.</span></label>
        <textarea className="bf-input" rows={2} placeholder="e.g. We started this brand because we were tired of overpriced wellness products that don't actually work. Everything we sell is tested and priced fairly." value={form.story} onChange={e => set('story', e.target.value)} />
      </div>

      <div className="bf-section-title">Audience & Tone</div>
      <div className="bf-row"><label>Target Customer * <span className="bf-hint-inline">— be specific, Claude needs this to write accurately</span></label>
        <input className="bf-input" placeholder="Who exactly buys from you? Age, lifestyle, pain points, what they care about." value={form.targetCustomer} onChange={e => set('targetCustomer', e.target.value)} />
      </div>
      <div className="bf-row"><label>Brand Tone * <span className="bf-hint-inline">— describe how your brand sounds and what it never sounds like</span></label>
        <textarea className="bf-input" rows={2} placeholder="e.g. Warm, direct, minimal. Science-backed without being clinical. Never pushy, never use hype words, no exclamation marks." value={form.tone} onChange={e => set('tone', e.target.value)} />
      </div>

      <div className="bf-section-title">Copy Guidance</div>
      <div className="bf-row"><label>Key Benefits <span className="bf-hint-inline">— what makes your products better? One per line.</span></label>
        <textarea className="bf-input" rows={3} placeholder={"e.g.\nFree express shipping on all orders\n30-day no questions return policy\nAll products dermatologist tested\nNo cheap materials — we only sell what we'd use ourselves"} value={form.keyBenefits} onChange={e => set('keyBenefits', e.target.value)} />
      </div>
      <div className="bf-row"><label>Always Emphasise <span className="bf-hint-inline">— things Claude must always mention in copy</span></label>
        <input className="bf-input" placeholder="e.g. free shipping, money-back guarantee, fast results, limited stock" value={form.alwaysEmphasise} onChange={e => set('alwaysEmphasise', e.target.value)} />
      </div>
      <div className="bf-row"><label>Copy Rules <span className="bf-hint-inline">— specific writing rules, one per line</span></label>
        <textarea className="bf-input" rows={3} placeholder={"e.g.\nAlways open with the customer's problem\nUse 'you' not 'our customers'\nKeep sentences under 20 words\nNo bullet points in the overview — write in paragraphs"} value={form.copyRules} onChange={e => set('copyRules', e.target.value)} />
      </div>
      <div className="bf-row"><label>Forbidden Words <span className="bf-hint-inline">— words Claude must never use</span></label>
        <input className="bf-input" placeholder="e.g. amazing, revolutionary, game-changing, unleash, supercharge" value={form.forbiddenWords} onChange={e => set('forbiddenWords', e.target.value)} />
      </div>
      <div className="bf-row"><label>Competitor Context <span className="bf-hint-inline">— who do you compete with and how are you better?</span></label>
        <input className="bf-input" placeholder="e.g. We compete with X and Y. We're better because our products are higher quality at a lower price." value={form.competitorContext} onChange={e => set('competitorContext', e.target.value)} />
      </div>

      <div className="bf-section-title">Pricing</div>
      <div className="bf-grid3">
        <div className="bf-row"><label>Price Multiplier <span className="bf-hint-inline">× cost = retail</span></label><input className="bf-input" type="number" step="0.5" min="1" placeholder="4" value={form.priceMultiplier} onChange={e => set('priceMultiplier', e.target.value)} /></div>
        <div className="bf-row"><label>Min Retail Price</label><input className="bf-input" type="number" placeholder="e.g. 29" value={form.priceMin} onChange={e => set('priceMin', e.target.value)} /></div>
        <div className="bf-row"><label>Max Retail Price</label><input className="bf-input" type="number" placeholder="e.g. 199" value={form.priceMax} onChange={e => set('priceMax', e.target.value)} /></div>
      </div>

      <div className="bf-section-title">Image Style</div>
      <div className="bf-row"><label>Image / Visual Style <span className="bf-hint-inline">— Claude uses this to write Lovart prompts</span></label>
        <textarea className="bf-input" rows={2} placeholder="e.g. Warm beige and cream tones. Soft natural light. Real people in relaxed home settings. No white studio backgrounds. No stock photo feel." value={form.imageStyle} onChange={e => set('imageStyle', e.target.value)} />
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
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {copyText && <CopyBtn text={copyText} />}
          <button className="regen-btn" onClick={() => setOpen(o => !o)} title="Regenerate this section">
            <IcoRegen />{open ? 'Cancel' : 'Regenerate'}
          </button>
        </div>
      </div>
      {open && (
        <div className="regen-panel">
          <div className="regen-label">What's wrong? Tell Claude what to fix:</div>
          <textarea className="regen-ta" rows={2} placeholder="e.g. Too formal, make it warmer. The FAQ doesn't address shipping time. Shot 3 prompt is too vague." value={note} onChange={e => setNote(e.target.value)} />
          {err && <div className="regen-err">{err}</div>}
          <button className="btn-primary" style={{alignSelf:'flex-end'}} onClick={regen} disabled={loading}>
            <IcoSpark />{loading ? 'Regenerating…' : 'Regenerate section'}
          </button>
        </div>
      )}
      <div className="rs-body">{children}</div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile]         = useState(null);
  const [brands, setBrands]           = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(null);
  const [view, setView]               = useState('generate');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand]   = useState(null);

  const [url, setUrl]         = useState('');
  const [notes, setNotes]     = useState('');
  const [selections, setSelections] = useState(() => GEN_OPTIONS.map(o => o.id)); // all checked by default
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState('');
  const [error, setError]     = useState('');
  const [result, setResult]   = useState(null);
  const [productData, setProductData] = useState(null);
  const [images, setImages]   = useState([]);
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
  const logout = () => { ls.set('aliflow_profile', null); setProfile(null); setBrands([]); setActiveBrandId(null); };
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
      const startRes = await fetch('/api/scrape-start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: url.trim() }) });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || 'Scrape start failed');
      runIdRef.current = startData.runId;
      setStatus('Scraping AliExpress product…');

      let pd = null;
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 6000));
        const poll = await fetch('/api/scrape-poll', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ runId: runIdRef.current }) });
        const p = await poll.json();
        if (p.status === 'SUCCEEDED') { pd = p.data || {}; break; }
        if (p.status === 'FAILED') throw new Error('Scraper failed');
      }
      if (!pd) throw new Error('Scraper timed out');

      setImages(pd.images || []);
      setProductData({ ...pd, notes });
      setStatus('Generating with Claude…');

      const briefRes = await fetch('/api/brief', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productData: { ...pd, notes }, brand: activeBrand, selections }) });
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
      <Head><title>AliFlow — Brand Content Generator</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;min-height:100vh}
        .topbar{position:fixed;top:0;left:0;right:0;z-index:100;height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 24px}
        .logo{font-size:1.05rem;font-weight:800;letter-spacing:-.03em;display:flex;align-items:center;gap:7px}
        .logo-dot{width:8px;height:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%}
        .logo-sub{font-size:.72rem;font-weight:500;color:#94a3b8;margin-left:4px}
        .topbar-nav{display:flex;gap:2px;margin-left:32px}
        .tn-btn{padding:6px 14px;font-size:.8rem;font-weight:600;border-radius:7px;border:none;cursor:pointer;background:none;color:#64748b;transition:all .15s}
        .tn-btn:hover,.tn-btn.active{background:#f1f5f9;color:#0f172a}
        .topbar-right{margin-left:auto;display:flex;align-items:center;gap:8px}
        .brand-pill{padding:5px 13px;background:#f1f5f9;border-radius:20px;font-size:.78rem;font-weight:700;color:#475569;border:1.5px solid #e2e8f0;cursor:pointer;display:flex;align-items:center;gap:6px}
        .brand-pill:hover{border-color:#6366f1;color:#6366f1}
        .bp-dot{width:7px;height:7px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%}
        .ws-pill{padding:4px 10px;background:#f1f5f9;border-radius:20px;font-size:.74rem;font-weight:700;color:#64748b;border:1.5px solid #e2e8f0}
        .btn-logout{padding:5px 12px;background:none;border:1.5px solid #e2e8f0;border-radius:7px;font-size:.76rem;font-weight:600;color:#94a3b8;cursor:pointer;transition:all .15s}
        .btn-logout:hover{border-color:#fecaca;color:#dc2626}

        .page{padding-top:56px;min-height:100vh}
        .main{max-width:880px;margin:0 auto;padding:32px 20px 80px}

        .gen-hero{text-align:center;margin-bottom:28px}
        .gen-hero h1{font-size:1.6rem;font-weight:800;letter-spacing:-.03em}
        .gen-hero p{margin-top:8px;font-size:.88rem;color:#64748b}

        .warn-bar{background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;padding:13px 16px;font-size:.84rem;color:#92400e;display:flex;align-items:center;gap:10px;margin-bottom:20px}
        .warn-bar button{margin-left:auto;background:#f59e0b;color:#fff;border:none;border-radius:6px;padding:5px 14px;font-size:.78rem;font-weight:700;cursor:pointer}

        .input-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:16px;box-shadow:0 2px 10px rgba(15,23,42,.05)}
        .ic-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:8px}
        .ic-row{display:flex;gap:10px}
        .ic-row input{flex:1;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.9rem;font-family:inherit;color:#0f172a;outline:none;transition:border .15s}
        .ic-row input:focus{border-color:#6366f1}
        .ic-row input::placeholder{color:#cbd5e1}
        .ic-sep{height:1px;background:#f1f5f9;margin:16px 0}
        .ic-ta{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.84rem;font-family:inherit;color:#0f172a;outline:none;resize:vertical;transition:border .15s}
        .ic-ta:focus{border-color:#6366f1}
        .ic-ta::placeholder{color:#cbd5e1}

        /* Generation options */
        .gen-opts-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(15,23,42,.05)}
        .gen-opts-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
        .gen-opts-title button{font-size:.74rem;font-weight:600;color:#6366f1;background:none;border:none;cursor:pointer;padding:0}
        .gen-opts-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .gen-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;transition:all .15s;background:#f8fafc}
        .gen-opt.checked{border-color:#6366f1;background:#fafaff}
        .gen-opt-cb{width:17px;height:17px;border:2px solid #cbd5e1;border-radius:4px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .gen-opt.checked .gen-opt-cb{background:#6366f1;border-color:#6366f1}
        .gen-opt-label{font-size:.84rem;font-weight:700;color:#0f172a}
        .gen-opt-desc{font-size:.74rem;color:#94a3b8;margin-top:1px}
        .gen-generate-row{display:flex;justify-content:flex-end;margin-top:14px}

        /* Buttons */
        .btn-primary{padding:10px 22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:9px;font-size:.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:opacity .15s;white-space:nowrap}
        .btn-primary:hover{opacity:.9}
        .btn-primary:disabled{opacity:.45;cursor:not-allowed}
        .btn-ghost{padding:9px 18px;background:#f1f5f9;color:#475569;border:1.5px solid #e2e8f0;border-radius:9px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .15s}
        .btn-ghost:hover{border-color:#cbd5e1;color:#0f172a}
        .btn-danger{padding:7px 12px;background:#fee2e2;color:#dc2626;border:1.5px solid #fecaca;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}
        .btn-danger:hover{background:#fecaca}
        .btn-sm{padding:6px 12px;font-size:.78rem;font-weight:600;border-radius:7px;border:1.5px solid #e2e8f0;background:#f8fafc;color:#475569;cursor:pointer;display:flex;align-items:center;gap:5px}
        .btn-sm:hover{border-color:#cbd5e1;color:#0f172a}
        .btn-sm.is-active{background:#ede9fe;border-color:#c4b5fd;color:#6d28d9}

        .status-bar{background:#ede9fe;border:1.5px solid #c4b5fd;border-radius:10px;padding:13px 16px;font-size:.85rem;color:#6d28d9;font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:18px}
        .spin{width:16px;height:16px;border:2px solid #c4b5fd;border-top-color:#6d28d9;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .error-bar{background:#fee2e2;border:1.5px solid #fecaca;border-radius:10px;padding:13px 16px;font-size:.85rem;color:#dc2626;margin-bottom:18px}

        .images-strip{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
        .img-thumb{width:76px;height:76px;border-radius:8px;object-fit:cover;border:2px solid #e2e8f0;cursor:pointer;transition:border-color .15s}
        .img-thumb:hover,.img-thumb.sel{border-color:#6366f1}

        .result-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
        .result-name{font-size:1.45rem;font-weight:800;letter-spacing:-.02em}
        .result-pain{font-size:.88rem;color:#64748b;margin-top:5px}
        .result-actions{display:flex;gap:8px;flex-shrink:0}
        .result-wrap{display:flex;flex-direction:column;gap:12px}

        .result-section{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden}
        .rs-header{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
        .rs-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#64748b}
        .rs-body{padding:16px;font-size:.88rem;line-height:1.65;color:#1e293b}

        .copy-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;font-size:.74rem;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s}
        .copy-btn:hover{background:#e2e8f0;color:#0f172a}
        .copy-btn.copied{background:#dcfce7;border-color:#86efac;color:#16a34a}

        .regen-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;background:#ede9fe;border:1px solid #c4b5fd;border-radius:6px;font-size:.74rem;font-weight:600;color:#6d28d9;cursor:pointer;transition:all .15s}
        .regen-btn:hover{background:#ddd6fe}
        .regen-panel{padding:14px 16px;background:#fafaff;border-bottom:1px solid #e2e8f0;display:flex;flex-direction:column;gap:8px}
        .regen-label{font-size:.76rem;font-weight:700;color:#6d28d9}
        .regen-ta{width:100%;padding:9px 12px;border:1.5px solid #c4b5fd;border-radius:8px;font-size:.84rem;font-family:inherit;outline:none;resize:vertical;background:#fff}
        .regen-ta:focus{border-color:#6366f1}
        .regen-ta::placeholder{color:#c4b5fd}
        .regen-err{font-size:.8rem;color:#dc2626}

        .price-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
        .price-cell{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
        .price-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px}
        .price-val{font-size:1.1rem;font-weight:800;color:#0f172a}
        .price-reason{grid-column:1/-1;font-size:.82rem;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}

        .cf{margin-bottom:14px}.cf:last-child{margin-bottom:0}
        .cf-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:4px}
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

        /* Brands */
        .brands-wrap{display:flex;flex-direction:column;gap:16px}
        .section-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
        .section-title{font-size:1.1rem;font-weight:800}
        .section-sub{font-size:.84rem;color:#64748b;margin-top:3px}
        .brand-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:14px}
        .brand-card.is-active{border-color:#6366f1;background:#fafaff}
        .bc-dot{width:10px;height:10px;background:#e2e8f0;border-radius:50%;margin-top:5px;flex-shrink:0}
        .brand-card.is-active .bc-dot{background:linear-gradient(135deg,#6366f1,#8b5cf6)}
        .bc-info{flex:1}
        .bc-name{font-size:1rem;font-weight:800}
        .bc-sub{font-size:.8rem;color:#64748b;margin-top:2px}
        .bc-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}
        .empty-state{text-align:center;padding:48px 20px;color:#94a3b8;font-size:.9rem;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px}

        /* Brand form */
        .brand-form{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:14px}
        .bf-section-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6366f1;padding-bottom:6px;border-bottom:1.5px solid #ede9fe;margin-top:4px}
        .bf-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .bf-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .bf-row{display:flex;flex-direction:column;gap:5px}
        .bf-row label{font-size:.74rem;font-weight:700;color:#475569}
        .bf-hint-inline{font-weight:400;color:#94a3b8;font-size:.72rem}
        .bf-input{padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.88rem;font-family:inherit;color:#0f172a;outline:none;width:100%;transition:border .15s}
        .bf-input:focus{border-color:#6366f1}
        .bf-input::placeholder{color:#cbd5e1}
        .bf-err{background:#fee2e2;color:#dc2626;border-radius:8px;padding:10px 14px;font-size:.84rem}
        .bf-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}

        .img-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .img-modal img{max-width:100%;max-height:90vh;border-radius:10px;object-fit:contain}
        .img-modal-close{position:absolute;top:20px;right:20px;background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.3rem;cursor:pointer}
      `}</style>

      <div className="page">
        <div className="topbar">
          <div className="logo"><div className="logo-dot"/>AliFlow<span className="logo-sub">Content Generator</span></div>
          <div className="topbar-nav">
            <button className={`tn-btn${view==='generate'?' active':''}`} onClick={() => setView('generate')}>Generate</button>
            <button className={`tn-btn${view==='brands'?' active':''}`} onClick={() => setView('brands')}>Brands</button>
          </div>
          <div className="topbar-right">
            {activeBrand
              ? <div className="brand-pill" onClick={() => setView('brands')}><div className="bp-dot"/>{activeBrand.name}</div>
              : <div className="brand-pill" onClick={() => setView('brands')}>+ Add Brand</div>
            }
            <div className="ws-pill">{profile}</div>
            <button className="btn-logout" onClick={logout}>Log out</button>
          </div>
        </div>

        <div className="main">
          {/* ── GENERATE ── */}
          {view === 'generate' && (
            <>
              <div className="gen-hero">
                <h1>Turn any AliExpress product into branded content</h1>
                <p>Paste a URL, choose what to generate, get copy and Lovart prompts matched to your brand.</p>
              </div>

              {!activeBrand && (
                <div className="warn-bar">⚠️ You need a brand profile before generating.
                  <button onClick={() => setView('brands')}>Set up brand →</button>
                </div>
              )}

              {!result && (
                <>
                  {/* URL + Notes */}
                  <div className="input-card">
                    <div className="ic-label">AliExpress Product URL</div>
                    <div className="ic-row">
                      <input placeholder="https://www.aliexpress.com/item/..." value={url} onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key==='Enter' && !loading && generate()} disabled={loading} />
                    </div>
                    <div className="ic-sep"/>
                    <div className="ic-label">Notes for Claude <span style={{textTransform:'none',fontWeight:400,color:'#cbd5e1'}}>(optional — extra context, angle, target price…)</span></div>
                    <textarea className="ic-ta" rows={2} placeholder="e.g. Push the warmth angle, target retail price AUD $49, this is for our winter collection..." value={notes} onChange={e => setNotes(e.target.value)} disabled={loading} />
                  </div>

                  {/* What to generate */}
                  <div className="gen-opts-card">
                    <div className="gen-opts-title">
                      What to generate
                      <button onClick={() => setSelections(sel => sel.length === GEN_OPTIONS.length ? [] : GEN_OPTIONS.map(o => o.id))}>
                        {selections.length === GEN_OPTIONS.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="gen-opts-grid">
                      {GEN_OPTIONS.map(opt => (
                        <div key={opt.id} className={`gen-opt${selections.includes(opt.id)?' checked':''}`} onClick={() => toggleSel(opt.id)}>
                          <div className="gen-opt-cb">{selections.includes(opt.id) && <IcoOk />}</div>
                          <div>
                            <div className="gen-opt-label">{opt.label}</div>
                            <div className="gen-opt-desc">{opt.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="gen-generate-row">
                      <button className="btn-primary" onClick={generate} disabled={loading || !activeBrand || selections.length === 0}>
                        <IcoSpark />{loading ? 'Generating…' : `Generate ${selections.length} section${selections.length!==1?'s':''}`}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {status && <div className="status-bar"><div className="spin"/>{status}</div>}
              {error && <div className="error-bar">{error}</div>}

              {images.length > 0 && (
                <div className="images-strip">
                  {images.map((img,i) => <img key={i} src={img} className={`img-thumb${selectedImg===img?' sel':''}`} alt="" onClick={() => setSelectedImg(img)} onError={e => e.target.style.display='none'} />)}
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
                        copyText={`AliExpress: ${result.pricing.aliExpressPrice}\nRetail: ${result.pricing.suggestedRetail}\nSale: ${result.pricing.suggestedSalePrice}\n${result.pricing.reasoning||''}`}>
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
                        {result.copy.subtitle && <div className="cf"><div className="cf-label">Subtitle</div><div style={{fontSize:'1rem',fontWeight:700}}>{result.copy.subtitle}</div></div>}
                        {result.copy.shortDescription && <div className="cf"><div className="cf-label">Short Description</div><div className="cf-val">{result.copy.shortDescription}</div></div>}
                        {result.copy.overview && <div className="cf"><div className="cf-label">Overview</div><div className="cf-val">{result.copy.overview}</div></div>}
                        <div className="copy-2col">
                          {result.copy.materials && <div><div className="cf-label">Materials</div><div className="cf-val" style={{fontSize:'.84rem'}}>{result.copy.materials}</div></div>}
                          {result.copy.care && <div><div className="cf-label">Care</div><div className="cf-val" style={{fontSize:'.84rem'}}>{result.copy.care}</div></div>}
                        </div>
                      </RegenSection>
                    )}

                    {result.faq?.length > 0 && (
                      <RegenSection title="FAQ" sectionKey="faq" productData={productData} brand={activeBrand} selections={selections} onUpdate={updateSection}
                        copyText={result.faq.map(f=>`Q: ${f.q}\nA: ${f.a}`).join('\n\n')}>
                        {result.faq.map((f,i) => (
                          <div key={i} className="faq-item">
                            <div className="faq-q">Q: {f.q}</div>
                            <div className="faq-a">{f.a}</div>
                          </div>
                        ))}
                      </RegenSection>
                    )}

                    {result.imagePrompts && (
                      <RegenSection title="Lovart Image Prompts" sectionKey="imagePrompts" productData={productData} brand={activeBrand} selections={selections} onUpdate={updateSection}
                        copyText={Object.entries(result.imagePrompts).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join('\n\n')}>
                        <div className="prompt-grid">
                          {Object.entries(result.imagePrompts).map(([shot,prompt]) => (
                            <div key={shot} className="prompt-item">
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <div className="prompt-shot">{shot.replace('shot','Shot ')}</div>
                                <CopyBtn text={prompt} />
                              </div>
                              <div className="prompt-text">{prompt}</div>
                            </div>
                          ))}
                        </div>
                        {result.googleShoppingPrompt && (
                          <div style={{marginTop:12}}>
                            <div className="cf-label" style={{marginBottom:6}}>Google Shopping Prompt</div>
                            <div className="prompt-item">
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
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

          {/* ── BRANDS ── */}
          {view === 'brands' && (
            <div className="brands-wrap">
              <div className="section-head">
                <div>
                  <div className="section-title">Brand Profiles</div>
                  <div className="section-sub">Each brand has its own tone, rules and pricing. All generations are matched to the active brand.</div>
                </div>
                {!showBrandForm && <button className="btn-primary" onClick={() => { setEditingBrand(null); setShowBrandForm(true); }}><IcoPlus/>New Brand</button>}
              </div>

              {showBrandForm && <BrandForm initial={editingBrand} onSave={saveBrand} onCancel={() => { setShowBrandForm(false); setEditingBrand(null); }} />}

              {brands.length === 0 && !showBrandForm && <div className="empty-state">No brands yet.<br/>Create your first brand profile to start generating content.</div>}

              {brands.map(brand => (
                <div key={brand.id} className={`brand-card${brand.id===activeBrandId?' is-active':''}`}>
                  <div className="bc-dot"/>
                  <div className="bc-info">
                    <div className="bc-name">{brand.name}</div>
                    <div className="bc-sub">{[brand.tagline, brand.niche, brand.targetCustomer].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="bc-actions">
                    {brand.id !== activeBrandId
                      ? <button className="btn-sm" onClick={() => { setActiveBrandId(brand.id); saveActiveBrand(profile, brand.id); }}><IcoArrow/>Use</button>
                      : <button className="btn-sm is-active">Active</button>
                    }
                    <button className="btn-sm" onClick={() => { setEditingBrand(brand); setShowBrandForm(true); }}><IcoEdit/>Edit</button>
                    <button className="btn-danger" onClick={() => deleteBrand(brand.id)}><IcoTrash/></button>
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
