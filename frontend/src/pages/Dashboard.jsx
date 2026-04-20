import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
         ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#dc2626']

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

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/analytics/stats').then(r => r.data),
    refetchInterval: 10000
  })

  const { data: dailyData } = useQuery({
    queryKey: ['daily'],
    queryFn: () => api.get('/analytics/daily').then(r => r.data)
  })

  const { data: riskData } = useQuery({
    queryKey: ['risk'],
    queryFn: () => api.get('/analytics/risk-distribution').then(r => r.data)
  })

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Tableau de bord</h1>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KPICard title="Total transactions" value={stats?.total ?? '...'} color="#3b82f6" icon="💳"/>
        <KPICard title="Anomalies détectées" value={stats?.anomalies ?? '...'} color="#ef4444" icon="🚨"/>
        <KPICard title="Taux d'anomalie" value={stats ? `${stats.anomaly_rate}%` : '...'} color="#f59e0b" icon="📊"/>
        <KPICard title="Score risque moyen" value={stats?.avg_risk_score ?? '...'} color="#10b981" icon="🎯"/>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Transactions par jour
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}/>
              <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4,4,0,0]}/>
              <Bar dataKey="anomalies" fill="#ef4444" name="Anomalies" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            Répartition par risque
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskData ?? []} dataKey="count" nameKey="segment"
                   cx="50%" cy="50%" outerRadius={90}
                   label={({ segment, percent }) => `${segment} ${(percent*100).toFixed(0)}%`}>
                {(riskData ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', color: '#f9fafb' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}