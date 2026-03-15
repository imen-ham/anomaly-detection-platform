import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

function RiskBadge({ score }) {
  const s = Number(score)
  const label = s < 0.3 ? 'Faible' : s < 0.6 ? 'Modéré' : s < 0.8 ? 'Élevé' : 'Critique'
  const colors = {
    'Faible':   { bg: '#064e3b', color: '#6ee7b7' },
    'Modéré':   { bg: '#78350f', color: '#fcd34d' },
    'Élevé':    { bg: '#7f1d1d', color: '#fca5a5' },
    'Critique': { bg: '#450a0a', color: '#f87171' },
  }
  const c = colors[label]
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                   fontWeight: '500', background: c.bg, color: c.color }}>
      {label} ({s.toFixed(2)})
    </span>
  )
}

export default function Transactions() {
  const qc = useQueryClient()
  const [anomalyOnly, setAnomalyOnly] = useState(false)

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', anomalyOnly],
    queryFn: () => api.get(`/transactions/?anomaly_only=${anomalyOnly}`).then(r => r.data),
    refetchInterval: 5000
  })

  const simulate = useMutation({
    mutationFn: () => api.post('/transactions/simulate', { count: 20 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['daily'] })
      qc.invalidateQueries({ queryKey: ['risk'] })
    }
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Transactions</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={anomalyOnly} onChange={e => setAnomalyOnly(e.target.checked)}/>
            Anomalies uniquement
          </label>
          <button
            onClick={() => simulate.mutate()}
            disabled={simulate.isPending}
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              padding: '8px 18px', borderRadius: '8px', fontSize: '14px',
              cursor: simulate.isPending ? 'not-allowed' : 'pointer',
              opacity: simulate.isPending ? 0.6 : 1
            }}>
            {simulate.isPending ? '⏳ Simulation...' : '⚡ Simuler 20 transactions'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: '#9ca3af' }}>Chargement...</p>
      ) : (
        <div style={{ background: '#1f2937', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#374151' }}>
                {['Marchand', 'Montant', 'Pays', 'Score risque', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left',
                                       fontSize: '12px', color: '#9ca3af',
                                       textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderTop: '1px solid #374151' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{tx.merchant}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600' }}>
                    {Number(tx.amount).toFixed(2)} {tx.currency}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{tx.country}</td>
                  <td style={{ padding: '12px 16px' }}><RiskBadge score={tx.risk_score}/></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                      background: tx.is_anomaly ? '#7f1d1d' : '#064e3b',
                      color: tx.is_anomaly ? '#fca5a5' : '#6ee7b7'
                    }}>
                      {tx.is_anomaly ? '🚨 Suspecte' : '✅ Normale'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(tx.timestamp).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}