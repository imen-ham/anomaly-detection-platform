import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
         XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
         Legend } from 'recharts'
import api from '../api'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#dc2626', '#8b5cf6', '#06b6d4']

function KPICard({ title, value, color, icon }) {
  return (
    <div style={{
      background: '#1f2937', borderRadius: '12px', padding: '20px',
      display: 'flex', alignItems: 'center', gap: '16px',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '28px' }}>{icon}</div>
      <div>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{title}</p>
        <p style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</p>
      </div>
    </div>
  )
}

function transformAlertsBySeverity(alertsData) {
  // Groupe les alertes par sévérité et calcule le taux de résolution
  const severityMap = {
    critical: { label: '🔴 Critique', total: 0, resolved: 0 },
    high: { label: '🟠 Élevé', total: 0, resolved: 0 },
    medium: { label: '🟡 Modéré', total: 0, resolved: 0 }
  }

  alertsData.forEach(alert => {
    const severity = alert.severity?.toLowerCase() || 'medium'
    if (severityMap[severity]) {
      severityMap[severity].total += alert.total || 0
      severityMap[severity].resolved += alert.resolved || 0
    }
  })

  return Object.entries(severityMap).map(([, data]) => ({
    severity: data.label,
    total: data.total,
    resolved: data.resolved,
    resolution_rate: data.total > 0 ? (data.resolved / data.total * 100) : 0
  }))
}

export default function Analytics() {
  // KPI: Taux de Fraude Global
  const { data: fraudData } = useQuery({
    queryKey: ['fraud-detection'],
    queryFn: () => api.get('/analytics/fraud-detection').then(r => r.data),
    refetchInterval: 30000
  })

  // KPI: Utilisateurs Haut Risque
  const { data: userBehavior } = useQuery({
    queryKey: ['user-behavior'],
    queryFn: () => api.get('/analytics/user-behavior').then(r => r.data),
    refetchInterval: 30000
  })

  // KPI: Efficacité Alertes
  const { data: alertsAnalysis } = useQuery({
    queryKey: ['alerts-analysis'],
    queryFn: () => api.get('/analytics/alerts-analysis').then(r => r.data),
    refetchInterval: 30000
  })

  // Calcul: Taux de résolution des alertes
  const alertsResolutionRate = alertsAnalysis?.resolution_status ? 
    ((alertsAnalysis.resolution_status.resolved / alertsAnalysis.resolution_status.total) * 100).toFixed(1) : 
    '...'

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>📊 Exploitation Analytique</h1>

      {/* KPIs - 3 indicateurs clés */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KPICard 
          title="Taux de Fraude" 
          value={fraudData?.summary?.anomaly_rate ? `${fraudData.summary.anomaly_rate}%` : '...'} 
          color="#ef4444" 
          icon="🚨"
        />
        <KPICard 
          title="Utilisateurs Haut Risque" 
          value={userBehavior?.risk_segmentation?.high_risk_users ?? '...'} 
          color="#f59e0b" 
          icon="👤"
        />
        <KPICard 
          title="Taux de Résolution Alertes" 
          value={`${alertsResolutionRate}%`}
          color="#10b981" 
          icon="✅"
        />
      </div>

      {/* Charts - Analyse Fraude par Pays & Tendance Temporelle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Fraudes par Pays */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Fraudes par Pays (30j)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fraudData?.anomalies_by_country ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="country" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}/>
              <Bar dataKey="count" fill="#ef4444" name="Fraudes" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendance Fraudes */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Tendance Fraudes (Série Temporelle)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fraudData?.time_series ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}/>
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total transactions" />
              <Line type="monotone" dataKey="anomalies" stroke="#ef4444" name="Fraudes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts - Fraudes par Catégorie & Distribution Profils Utilisateurs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Fraudes par Catégorie */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Fraudes par Catégorie
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fraudData?.anomalies_by_category ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}/>
              <Bar dataKey="count" fill="#f59e0b" name="Fraudes" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Profils Utilisateurs */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Profils Utilisateurs par Risque
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={[
                  { name: 'Haut Risque', value: userBehavior?.risk_segmentation?.high_risk_users ?? 0 },
                  { name: 'Risque Moyen', value: userBehavior?.risk_segmentation?.medium_risk_users ?? 0 },
                  { name: 'Bas Risque', value: userBehavior?.risk_segmentation?.low_risk_users ?? 0 }
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
              >
                {[0, 1, 2].map((idx) => (
                  <Cell key={idx} fill={COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts - Distribution Alertes & Taux Résolution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Taux de Résolution par Sévérité */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Taux de Résolution par Sévérité
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transformAlertsBySeverity(alertsAnalysis?.alerts_by_type_severity ?? [])}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="severity" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}
                       formatter={(value) => `${value.toFixed(1)}%`}/>
              <Legend />
              <Bar dataKey="resolution_rate" fill="#10b981" name="% Résolution" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* État Global des Alertes */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            État Global des Alertes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={[
                  { name: 'Résolues', value: alertsAnalysis?.resolution_status?.resolved ?? 0 },
                  { name: 'Non Résolues', value: alertsAnalysis?.resolution_status?.unresolved ?? 0 }
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent*100).toFixed(0)}%)`}
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables - Données Détaillées */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Distribution Anomalies par Catégorie - Table */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Analyse par Catégorie (Détail)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', color: '#d1d5db' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#9ca3af' }}>Catégorie</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#9ca3af' }}>Fraudes</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#9ca3af' }}>Montant Moy</th>
                </tr>
              </thead>
              <tbody>
                {(fraudData?.anomalies_by_category ?? []).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '8px' }}>{row.category}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>{row.count}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${row.avg_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Efficacité Alertes - Table */}
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Performance Alertes
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', color: '#d1d5db' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#9ca3af' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#9ca3af' }}>Total</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#9ca3af' }}>Résolues</th>
                </tr>
              </thead>
              <tbody>
                {(alertsAnalysis?.alerts_by_type_severity ?? []).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '8px' }}>{row.alert_type}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{row.total}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                      {row.resolved} ({row.resolution_rate}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
