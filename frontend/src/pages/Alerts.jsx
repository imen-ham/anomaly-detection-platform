import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export default function Alerts() {
  const qc = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/?resolved=false').then(r => r.data),
    refetchInterval: 5000
  })

  const resolve = useMutation({
    mutationFn: (id) => api.patch(`/alerts/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] })
  })

  const severityStyle = (severity) => {
    const map = {
      critical: { bg: '#450a0a', color: '#f87171', label: '🔴 Critique' },
      high:     { bg: '#7f1d1d', color: '#fca5a5', label: '🟠 Élevé' },
      medium:   { bg: '#78350f', color: '#fcd34d', label: '🟡 Modéré' },
    }
    return map[severity] || map['medium']
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Alertes actives</h1>
        <span style={{ background: '#7f1d1d', color: '#fca5a5', padding: '4px 12px',
                       borderRadius: '20px', fontSize: '14px' }}>
          {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <p style={{ color: '#9ca3af' }}>Chargement...</p>
      ) : alerts.length === 0 ? (
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '40px',
                      textAlign: 'center', color: '#9ca3af' }}>
          ✅ Aucune alerte active
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map(alert => {
            const s = severityStyle(alert.severity)
            return (
              <div key={alert.id} style={{
                background: '#1f2937', borderRadius: '12px', padding: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderLeft: `4px solid ${s.color}`
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                                   background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{alert.alert_type}</span>
                  </div>
                  <p style={{ fontSize: '14px', marginBottom: '4px' }}>{alert.message}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(alert.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => resolve.mutate(alert.id)}
                  style={{
                    background: '#374151', color: '#9ca3af', border: 'none',
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}>
                  ✓ Résoudre
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}