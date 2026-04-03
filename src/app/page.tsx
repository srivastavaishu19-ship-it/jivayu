'use client'

import { useEffect, useState } from 'react'

// Test user ID — in Phase 6 this comes from real login
const TEST_USER = '00000000-0000-0000-0000-000000000001'

export default function Dashboard() {
  const [medicines, setMedicines] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [healthScore, setHealthScore] = useState<number>(0)
  const [topConcern, setTopConcern] = useState('')
  const [loading, setLoading] = useState(true)
  const [predLoading, setPredLoading] = useState(false)

  // Fetch medicines on load
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch(`/api/medicines?user_id=${TEST_USER}`)
      const data = await res.json()
      setMedicines(data.medicines || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function getPredictions() {
    setPredLoading(true)
    try {
      const res = await fetch(`/api/predict?user_id=${TEST_USER}`)
      const data = await res.json()
      setPredictions(data.predictions || [])
      setHealthScore(data.overall_health_score || 0)
      setTopConcern(data.top_concern || '')
    } catch (e) {
      console.error(e)
    } finally {
      setPredLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    if (level === 'high' || level === 'critical') return '#ef4444'
    if (level === 'medium') return '#f59e0b'
    return '#22c55e'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#f0f4ff', fontFamily: 'system-ui', padding: '32px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#4ade80' }}>🌿 Jivayu</h1>
          <p style={{ color: '#8b9ab8', fontSize: '13px' }}>Your Personal Health Intelligence</p>
        </div>
        <button
          onClick={getPredictions}
          disabled={predLoading}
          style={{ background: '#4ade80', color: '#0a0f1e', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
        >
          {predLoading ? '🧠 Analysing...' : '🧠 Get AI Predictions'}
        </button>
      </div>

      {/* HEALTH SCORE */}
      {healthScore > 0 && (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '56px', fontWeight: '800', color: '#4ade80' }}>{healthScore}</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>Health Intelligence Score</div>
              <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '6px' }}>⚠️ {topConcern}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI PREDICTIONS */}
      {predictions.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#8b9ab8' }}>AI HEALTH PREDICTIONS</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {predictions.map((pred: any, i: number) => (
              <div key={i} style={{ background: '#111827', border: `1px solid ${getRiskColor(pred.risk_level)}33`, borderRadius: '14px', padding: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: getRiskColor(pred.risk_level) }}>{pred.risk_percent}%</div>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>{pred.condition}</div>
                <div style={{ fontSize: '12px', color: '#8b9ab8', marginBottom: '10px' }}>{pred.reasoning}</div>
                <div style={{ fontSize: '11px', color: '#4ade80' }}>
                  {(pred.recommendations || []).slice(0, 2).map((r: string, j: number) => (
                    <div key={j} style={{ marginBottom: '3px' }}>→ {r}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEDICINES */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#8b9ab8' }}>YOUR MEDICINES</h2>
        {loading ? (
          <div style={{ color: '#8b9ab8' }}>Loading...</div>
        ) : medicines.length === 0 ? (
          <div style={{ color: '#8b9ab8', padding: '20px', background: '#111827', borderRadius: '12px' }}>No medicines added yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {medicines.map((med: any) => (
              <div key={med.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💊</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{med.name}</div>
                <div style={{ fontSize: '12px', color: '#8b9ab8', marginBottom: '4px' }}>{med.dosage} · {med.frequency}</div>
                <div style={{ fontSize: '11px', color: '#4ade80' }}>For: {med.condition_for}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}