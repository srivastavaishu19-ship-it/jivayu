'use client'

import { useEffect, useState, useRef } from 'react'

const TEST_USER = '00000000-0000-0000-0000-000000000001'

export default function Dashboard() {
  const [dark, setDark] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'medicines' | 'insights'>('home')
  const [medicines, setMedicines] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [healthScore, setHealthScore] = useState(0)
  const [topConcern, setTopConcern] = useState('')
  const [positives, setPositives] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [predLoading, setPredLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadedReport, setUploadedReport] = useState<any>(null)
  const [showAddMed, setShowAddMed] = useState(false)
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', condition_for: '', prescribed_by: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  // Theme colours
  const t = {
    bg: dark ? '#080d1a' : '#f4f6fb',
    surface: dark ? '#111827' : '#ffffff',
    surface2: dark ? '#1a2235' : '#f0f2f8',
    border: dark ? '#1f2937' : '#e2e8f0',
    text: dark ? '#f0f4ff' : '#0f172a',
    text2: dark ? '#8b9ab8' : '#64748b',
    accent: '#4ade80',
    accentPurple: '#a78bfa',
    accentCyan: '#22d3ee',
    danger: '#ef4444',
    warning: '#f59e0b',
    navBg: dark ? '#0d1424' : '#ffffff',
    cardHover: dark ? '#1f2d42' : '#f8faff',
  }

  useEffect(() => { fetchMedicines() }, [])

  async function fetchMedicines() {
    setLoading(true)
    try {
      const r = await fetch(`/api/medicines?user_id=${TEST_USER}`)
      const d = await r.json()
      setMedicines(d.medicines || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    setUploadedReport(null)
    setActiveTab('reports')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('user_id', TEST_USER)
      const r = await fetch('/api/extract-report', { method: 'POST', body: fd })
      const d = await r.json()
      if (d.success) setUploadedReport(d)
      else alert('Error: ' + d.error)
    } catch (e) { alert('Upload failed. Try again.') }
    finally { setUploadLoading(false) }
  }

  async function addMedicine() {
    if (!medForm.name.trim()) return alert('Medicine name required')
    try {
      const r = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: TEST_USER, ...medForm })
      })
      const d = await r.json()
      if (d.success) {
        setMedicines(p => [d.medicine, ...p])
        setMedForm({ name: '', dosage: '', frequency: '', condition_for: '', prescribed_by: '' })
        setShowAddMed(false)
      }
    } catch (e) { alert('Failed') }
  }

  async function getPredictions() {
    setPredLoading(true)
    setActiveTab('insights')
    try {
      const r = await fetch(`/api/predict?user_id=${TEST_USER}`)
      const d = await r.json()
      setPredictions(d.predictions || [])
      setHealthScore(d.overall_health_score || 0)
      setTopConcern(d.top_concern || '')
      setPositives(d.positive_findings || [])
    } catch (e) { console.error(e) }
    finally { setPredLoading(false) }
  }

  async function markTaken(id: string) {
    try {
      await fetch('/api/medicine-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicine_id: id, user_id: TEST_USER, status: 'taken', scheduled_time: new Date().toLocaleTimeString() })
      })
    } catch (e) { }
  }

  const riskColor = (l: string) => l === 'high' || l === 'critical' ? t.danger : l === 'medium' ? t.warning : t.accent
  const flagColor = (f: string) => f === 'normal' ? t.accent : f === 'low' ? t.warning : t.danger

  // Base styles
  const css = {
    page: `min-height:100vh;background:${t.bg};color:${t.text};font-family:'DM Sans',system-ui,sans-serif;transition:all 0.3s`,
    nav: `background:${t.navBg};border-bottom:1px solid ${t.border};padding:0 28px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)`,
    main: `max-width:1100px;margin:0 auto;padding:28px 24px`,
    card: `background:${t.surface};border:1px solid ${t.border};border-radius:16px;padding:20px;transition:all 0.2s`,
    btn: (bg: string, color: string = '#0a0f1e') => `background:${bg};color:${color};border:none;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:all 0.15s`,
    tabBtn: (active: boolean) => `background:${active ? t.surface2 : 'transparent'};color:${active ? t.text : t.text2};border:${active ? `1px solid ${t.border}` : '1px solid transparent'};border-radius:8px;padding:7px 14px;font-weight:${active ? '600' : '500'};cursor:pointer;font-size:13px;font-family:inherit;transition:all 0.15s`,
    input: `width:100%;background:${t.surface2};border:1px solid ${t.border};border-radius:10px;padding:11px 14px;color:${t.text};font-size:13px;outline:none;box-sizing:border-box;font-family:inherit`,
    label: `font-size:10px;font-weight:700;color:${t.text2};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;display:block`,
    modal: `position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(4px)`,
    modalBox: `background:${t.surface};border:1px solid ${t.border};border-radius:20px;padding:28px;width:100%;max-width:480px`,
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'all 0.3s' }}>

      {/* NAV */}
      <nav style={{ background: t.navBg, borderBottom: `1px solid ${t.border}`, padding: '0 28px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌿</span>
          <span style={{ fontSize: '20px', fontWeight: '700', color: t.accent }}>Jivayu</span>
          <span style={{ fontSize: '11px', color: t.text2, marginLeft: '4px', background: t.surface2, padding: '2px 8px', borderRadius: '20px', border: `1px solid ${t.border}` }}>Beta</span>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['home', 'reports', 'medicines', 'insights'] as const).map(tab => (
            <button key={tab} style={{ background: activeTab === tab ? t.surface2 : 'transparent', color: activeTab === tab ? t.text : t.text2, border: activeTab === tab ? `1px solid ${t.border}` : '1px solid transparent', borderRadius: '8px', padding: '7px 14px', fontWeight: activeTab === tab ? 600 : 500, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.15s' }} onClick={() => setActiveTab(tab)}>
              {tab === 'home' ? '⊞ Home' : tab === 'reports' ? '🔬 Reports' : tab === 'medicines' ? '💊 Medicines' : '🧠 Insights'}
            </button>
          ))}
        </div>

        {/* THEME TOGGLE */}
        <button
          onClick={() => setDark(!dark)}
          style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', color: t.text, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', transition: 'all 0.2s' }}
        >
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <div>
            {/* Hero */}
            <div style={{ background: dark ? 'linear-gradient(135deg, #0d1f1a, #111827)' : 'linear-gradient(135deg, #f0fdf4, #eff6ff)', border: `1px solid ${dark ? '#1a3a2a' : '#bbf7d0'}`, borderRadius: '20px', padding: '28px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: t.text2, marginBottom: '6px' }}>Welcome to Jivayu 🌿</div>
                <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Your Health, <span style={{ color: t.accent }}>Intelligently</span> Managed</div>
                <div style={{ fontSize: '13px', color: t.text2, lineHeight: '1.6' }}>Upload reports · Track medicines · Get AI-powered health predictions in Hindi & English</div>
              </div>
              {healthScore > 0 && (
                <div style={{ textAlign: 'center', background: dark ? 'rgba(74,222,128,0.08)' : 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: '16px 24px' }}>
                  <div style={{ fontSize: '52px', fontWeight: '900', color: t.accent, lineHeight: 1 }}>{healthScore}</div>
                  <div style={{ fontSize: '11px', color: t.text2, marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Health Score</div>
                </div>
              )}
            </div>

            {/* 3 Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '28px' }}>

              <div onClick={() => fileRef.current?.click()} style={{ background: t.surface, border: `1.5px dashed ${dark ? '#1a3d2a' : '#86efac'}`, borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleUpload} />
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔬</div>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Upload Lab Report</div>
                <div style={{ fontSize: '12px', color: t.text2, lineHeight: '1.5' }}>PDF or photo · Any Indian lab · Hindi or English</div>
                {uploadLoading && <div style={{ color: t.accent, fontSize: '12px', marginTop: '10px', fontWeight: '600' }}>🧠 Reading your report...</div>}
              </div>

              <div onClick={() => setShowAddMed(true)} style={{ background: t.surface, border: `1.5px dashed ${dark ? '#2d1f4d' : '#c4b5fd'}`, borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>💊</div>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>Add Medicine</div>
                <div style={{ fontSize: '12px', color: t.text2, lineHeight: '1.5' }}>Track daily medicines and adherence</div>
              </div>

              <div onClick={getPredictions} style={{ background: t.surface, border: `1.5px dashed ${dark ? '#2d2510' : '#fde68a'}`, borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧠</div>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>AI Health Predictions</div>
                <div style={{ fontSize: '12px', color: t.text2, lineHeight: '1.5' }}>{predLoading ? '⟳ Analysing your data...' : 'Get personalised risk analysis'}</div>
              </div>

            </div>

            {/* Today's medicines quick view */}
            {medicines.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: t.text2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Today's Medicines</span>
                  <button onClick={() => setActiveTab('medicines')} style={{ background: 'none', border: 'none', color: t.accent, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>See all →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {medicines.slice(0, 3).map((m: any) => (
                    <div key={m.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>💊</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: t.text2 }}>{m.dosage} · {m.frequency}</div>
                      </div>
                      <button onClick={() => markTaken(m.id)} style={{ background: 'rgba(74,222,128,0.1)', color: t.accent, border: '1px solid rgba(74,222,128,0.25)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>✓ Taken</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Alert */}
            {topConcern && (
              <div style={{ background: dark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ fontSize: '11px', color: t.warning, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>⚠️ AI Health Alert</div>
                <div style={{ fontSize: '13px', lineHeight: '1.7' }}>{topConcern}</div>
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.3px' }}>Lab Reports</h1>
                <p style={{ fontSize: '13px', color: t.text2 }}>Upload any report — AI reads, structures and explains it instantly</p>
              </div>
              <button onClick={() => fileRef.current?.click()} style={{ background: t.accent, color: '#0a0f1e', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleUpload} />
                {uploadLoading ? '🧠 Reading...' : '+ Upload Report'}
              </button>
            </div>

            {uploadLoading && (
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
                <div style={{ fontSize: '17px', fontWeight: '700', color: t.accent, marginBottom: '8px' }}>Claude is reading your report...</div>
                <div style={{ fontSize: '13px', color: t.text2 }}>Extracting parameters · Generating explanation in Hindi & English</div>
                <div style={{ marginTop: '20px', height: '4px', background: t.border, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '60%', background: `linear-gradient(90deg, ${t.accent}, ${t.accentCyan})`, borderRadius: '10px', animation: 'none' }}></div>
                </div>
              </div>
            )}

            {uploadedReport && !uploadLoading && (
              <div>
                {/* Report header */}
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '800' }}>{uploadedReport.structured?.report_name}</div>
                      <div style={{ fontSize: '12px', color: t.text2, marginTop: '3px' }}>{uploadedReport.structured?.lab_name} · Just uploaded</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ background: 'rgba(74,222,128,0.1)', color: t.accent, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(74,222,128,0.2)' }}>
                        {uploadedReport.structured?.summary?.normal_count} Normal
                      </span>
                      <span style={{ background: 'rgba(239,68,68,0.1)', color: t.danger, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {uploadedReport.structured?.summary?.abnormal_count} Abnormal
                      </span>
                    </div>
                  </div>

                  {/* Key findings */}
                  {uploadedReport.structured?.summary?.key_findings?.length > 0 && (
                    <div style={{ background: dark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '10px', color: t.danger, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Key Findings</div>
                      {uploadedReport.structured.summary.key_findings.map((f: string, i: number) => (
                        <div key={i} style={{ fontSize: '13px', color: t.text, marginBottom: '4px' }}>• {f}</div>
                      ))}
                    </div>
                  )}

                  {/* Parameters table */}
                  <div style={{ fontSize: '11px', fontWeight: '700', color: t.text2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>All Parameters</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(uploadedReport.structured?.parameters || []).map((p: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: '12px', padding: '10px 14px', background: t.surface2, borderRadius: '10px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>{p.name}</span>
                          <span style={{ fontSize: '11px', color: t.text2, marginLeft: '6px' }}>{p.unit}</span>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '700' }}>{p.value}</div>
                        <div style={{ fontSize: '11px', color: t.text2 }}>{p.reference_min}–{p.reference_max}</div>
                        <div style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: `${flagColor(p.flag)}18`, color: flagColor(p.flag), textTransform: 'uppercase', textAlign: 'center', minWidth: '64px' }}>
                          {p.flag}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* English Explanation */}
                <div style={{ background: dark ? 'rgba(34,211,238,0.04)' : 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: t.accentCyan, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>🧠 Jivayu AI — Plain English Explanation</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.8', color: t.text }}>{uploadedReport.explanation_en}</div>
                </div>

                {/* Hindi Explanation */}
                {uploadedReport.explanation_hi && (
                  <div style={{ background: dark ? 'rgba(167,139,250,0.04)' : 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '11px', color: t.accentPurple, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>🧠 हिंदी में समझें</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.9', color: t.text }}>{uploadedReport.explanation_hi}</div>
                  </div>
                )}
              </div>
            )}

            {!uploadedReport && !uploadLoading && (
              <div onClick={() => fileRef.current?.click()} style={{ background: t.surface, border: `1.5px dashed ${t.border}`, borderRadius: '20px', padding: '80px 20px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔬</div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Upload your first report</div>
                <div style={{ fontSize: '13px', color: t.text2, marginBottom: '20px' }}>PDF or photo · Thyrocare, SRL, Apollo, Dr Lal, any lab · Hindi or English</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['📄 PDF', '📷 Photo', '✍️ Handwritten', '🇮🇳 Hindi/English'].map(tag => (
                    <span key={tag} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: t.text2 }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MEDICINES TAB ── */}
        {activeTab === 'medicines' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.3px' }}>Medicine Tracker</h1>
                <p style={{ fontSize: '13px', color: t.text2 }}>{medicines.length} medicines · Track adherence daily</p>
              </div>
              <button onClick={() => setShowAddMed(true)} style={{ background: t.accentPurple, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                + Add Medicine
              </button>
            </div>

            {loading ? (
              <div style={{ color: t.text2, textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : medicines.length === 0 ? (
              <div onClick={() => setShowAddMed(true)} style={{ background: t.surface, border: `1.5px dashed ${t.border}`, borderRadius: '20px', padding: '80px 20px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>💊</div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Add your first medicine</div>
                <div style={{ fontSize: '13px', color: t.text2 }}>Track medicines, mark as taken, monitor adherence</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {medicines.map((m: any) => (
                  <div key={m.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '32px' }}>💊</span>
                      <span style={{ background: 'rgba(74,222,128,0.1)', color: t.accent, padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', border: '1px solid rgba(74,222,128,0.2)', height: 'fit-content' }}>Active</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{m.name}</div>
                    {m.dosage && <div style={{ fontSize: '12px', color: t.text2, marginBottom: '2px' }}>{m.dosage} · {m.frequency}</div>}
                    {m.condition_for && <div style={{ fontSize: '11px', color: t.accent, marginBottom: '2px' }}>For: {m.condition_for}</div>}
                    {m.prescribed_by && <div style={{ fontSize: '11px', color: t.text2, marginBottom: '14px' }}>Dr: {m.prescribed_by}</div>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => markTaken(m.id)} style={{ flex: 1, background: 'rgba(74,222,128,0.1)', color: t.accent, border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '9px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>✓ Mark Taken</button>
                      <button style={{ background: 'rgba(239,68,68,0.1)', color: t.danger, border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '9px 13px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                    </div>
                  </div>
                ))}
                <div onClick={() => setShowAddMed(true)} style={{ background: t.surface, border: `1.5px dashed ${t.border}`, borderRadius: '16px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', gap: '8px', color: t.text2 }}>
                  <div style={{ fontSize: '28px' }}>+</div>
                  <div style={{ fontSize: '13px' }}>Add medicine</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INSIGHTS TAB ── */}
        {activeTab === 'insights' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.3px' }}>AI Health Insights</h1>
                <p style={{ fontSize: '13px', color: t.text2 }}>Personalised predictions from your health data</p>
              </div>
              <button onClick={getPredictions} style={{ background: t.accent, color: '#0a0f1e', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                {predLoading ? '🧠 Analysing...' : '🧠 Refresh Predictions'}
              </button>
            </div>

            {/* Health Score Bar */}
            {healthScore > 0 && (
              <div style={{ background: dark ? 'linear-gradient(135deg, #0d1f1a, #111827)' : 'linear-gradient(135deg, #f0fdf4, #eff6ff)', border: `1px solid ${dark ? '#1a3a2a' : '#bbf7d0'}`, borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', fontWeight: '900', color: t.accent, lineHeight: 1 }}>{healthScore}</div>
                    <div style={{ fontSize: '11px', color: t.text2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Health Score</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Your Health Intelligence Score</div>
                    <div style={{ height: '8px', background: t.border, borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${healthScore}%`, background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #4ade80 100%)', borderRadius: '10px' }}></div>
                    </div>
                    {topConcern && <div style={{ fontSize: '13px', color: t.warning }}>⚠️ {topConcern}</div>}
                  </div>
                </div>
                {positives.length > 0 && (
                  <div style={{ marginTop: '16px', borderTop: `1px solid ${t.border}`, paddingTop: '14px' }}>
                    <div style={{ fontSize: '11px', color: t.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>✓ Positive Findings</div>
                    {positives.map((p: string, i: number) => <div key={i} style={{ fontSize: '12px', color: t.text2, marginBottom: '3px' }}>• {p}</div>)}
                  </div>
                )}
              </div>
            )}

            {predictions.length === 0 ? (
              <div style={{ background: t.surface, border: `1.5px dashed ${t.border}`, borderRadius: '20px', padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>🧠</div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No predictions yet</div>
                <div style={{ fontSize: '13px', color: t.text2, marginBottom: '24px' }}>Upload a lab report first, then click "Refresh Predictions"</div>
                <button onClick={getPredictions} style={{ background: t.accent, color: '#0a0f1e', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                  {predLoading ? '🧠 Analysing...' : '🧠 Get Predictions'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {predictions.map((pred: any, i: number) => (
                  <div key={i} style={{ background: t.surface, border: `1px solid ${riskColor(pred.risk_level)}33`, borderRadius: '16px', padding: '20px', borderLeft: `4px solid ${riskColor(pred.risk_level)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: riskColor(pred.risk_level), lineHeight: 1 }}>{pred.risk_percent}%</div>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', background: `${riskColor(pred.risk_level)}18`, color: riskColor(pred.risk_level), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{pred.risk_level} risk</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{pred.condition}</div>
                    <div style={{ fontSize: '12px', color: t.text2, lineHeight: '1.7', marginBottom: '14px' }}>{pred.reasoning}</div>
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '12px' }}>
                      <div style={{ fontSize: '10px', color: t.text2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>What to do</div>
                      {(pred.recommendations || []).slice(0, 2).map((r: string, j: number) => (
                        <div key={j} style={{ fontSize: '12px', color: t.text, marginBottom: '6px', paddingLeft: '10px', borderLeft: `2px solid ${riskColor(pred.risk_level)}`, lineHeight: '1.5' }}>{r}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ADD MEDICINE MODAL ── */}
      {showAddMed && (
        <div onClick={(e) => e.target === e.currentTarget && setShowAddMed(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>💊 Add Medicine</div>
              <button onClick={() => setShowAddMed(false)} style={{ background: 'none', border: 'none', color: t.text2, fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: t.text2, fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Medicine Name *</div>
                <input style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '11px 14px', color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} placeholder="e.g. Metformin 500mg" value={medForm.name} onChange={e => setMedForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: t.text2, fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dosage</div>
                  <input style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '11px 14px', color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} placeholder="500mg" value={medForm.dosage} onChange={e => setMedForm(p => ({ ...p, dosage: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: t.text2, fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Frequency</div>
                  <input style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '11px 14px', color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} placeholder="twice daily" value={medForm.frequency} onChange={e => setMedForm(p => ({ ...p, frequency: e.target.value }))} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: t.text2, fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>For Condition</div>
                <input style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '11px 14px', color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} placeholder="Blood Sugar Control" value={medForm.condition_for} onChange={e => setMedForm(p => ({ ...p, condition_for: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: t.text2, fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prescribed By</div>
                <input style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '11px 14px', color: t.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} placeholder="Dr. Sharma" value={medForm.prescribed_by} onChange={e => setMedForm(p => ({ ...p, prescribed_by: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button onClick={() => setShowAddMed(false)} style={{ flex: 1, background: t.surface2, color: t.text2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: '500' }}>Cancel</button>
                <button onClick={addMedicine} style={{ flex: 2, background: t.accentPurple, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: '700' }}>Save Medicine</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
