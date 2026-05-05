import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';

const SREMetricsCard = ({ title, value, unit, status, description, source }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: getStatusColor(status) }}
        />
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-slate-400 text-sm">{unit}</span>
      </div>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      {source && <p className="text-xs text-slate-600 mt-2">📊 Source: {source}</p>}
    </div>
  );
};

const BudgetProgressBar = ({ consumed, remaining, percentage }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-400">Budget d'Erreurs</span>
        <span className="text-sm font-semibold text-white">{percentage.toFixed(1)}% restant</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600">
        <div
          className={`h-full transition-all ${
            percentage > 30 ? 'bg-green-500' : percentage > 10 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${100 - percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Consommé: {consumed.toFixed(2)} min</span>
        <span>Restant: {remaining.toFixed(2)} min</span>
      </div>
    </div>
  );
};

export default function SREAnalytics() {
  const { data: sreMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['sre-metrics'],
    queryFn: () => api.get('/analytics/sre/metrics').then(res => res.data),
    refetchInterval: 30000,
  });

  const { data: budgetTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['sre-budget-trend'],
    queryFn: () => api.get('/analytics/sre/daily-budget-trend').then(res => res.data),
    refetchInterval: 60000,
  });

  const { data: alertRules, isLoading: alertsLoading } = useQuery({
    queryKey: ['sre-alert-rules'],
    queryFn: () => api.get('/analytics/sre/alert-rules').then(res => res.data),
    refetchInterval: 60000,
  });

  if (metricsLoading || trendLoading || alertsLoading) {
    return <div className="text-center py-8 text-slate-400">Chargement des métriques SRE...</div>;
  }

  const metrics = sreMetrics?.current_metrics || {};
  const sloTargets = sreMetrics?.slo_targets || {};
  const sloCompliance = sreMetrics?.slo_compliance || {};
  const errorBudget = sreMetrics?.error_budget || {};
  const slaStatus = sreMetrics?.sla_summary?.current_status || '';
  const dailyData = budgetTrend?.daily_trend || [];
  const alerts = alertRules?.alert_rules || [];

  const complianceChartData = [
    { name: 'Disponibilité', value: sloCompliance.availability_compliant ? 100 : 0, target: 100 },
    { name: 'Latence', value: sloCompliance.latency_compliant ? 100 : 0, target: 100 },
    { name: 'Taux d\'erreurs', value: sloCompliance.error_rate_compliant ? 100 : 0, target: 100 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Gouvernance SRE</h1>
          <p className="text-slate-400">Objectifs de Niveau de Service (SLO), Accords de Niveau de Service (SLA) et Budget d'Erreurs</p>
        </div>

        {/* Current Status Badge */}
        <div className="mb-8 flex gap-4">
          <div
            className={`px-6 py-3 rounded-lg font-semibold text-white text-lg ${
              slaStatus === 'On Track'
                ? 'bg-green-600'
                : slaStatus === 'At Risk'
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
          >
            Statut: {slaStatus === 'On Track' ? 'Sur la bonne voie' : slaStatus === 'At Risk' ? 'À risque' : 'Critique'}
          </div>
          <div className="px-6 py-3 rounded-lg bg-slate-700 text-white font-semibold">
            Santé: {errorBudget.health_status?.toUpperCase() === 'HEALTHY' ? 'SAIN' : errorBudget.health_status?.toUpperCase() === 'WARNING' ? 'ATTENTION' : 'CRITIQUE' || 'INCONNU'}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SREMetricsCard
            title="Disponibilité"
            value={metrics.availability?.toFixed(2)}
            unit="%"
            status={sloCompliance.availability_compliant ? 'healthy' : 'critical'}
            description={`Cible: ${sloTargets.availability}%`}
            source="Prometheus"
          />
          <SREMetricsCard
            title="Taux d'erreurs"
            value={metrics.error_rate?.toFixed(3)}
            unit="%"
            status={sloCompliance.error_rate_compliant ? 'healthy' : 'critical'}
            description={`Cible: < ${sloTargets.error_rate}%`}
            source="Prometheus"
          />
          <SREMetricsCard
            title="Latence P95"
            value={metrics.latency_p95_ms?.toFixed(0)}
            unit="ms"
            status={sloCompliance.latency_compliant ? 'healthy' : 'warning'}
            description={`Cible: < ${sloTargets.latency_p95_ms}ms`}
            source="Prometheus"
          />
          <SREMetricsCard
            title="Requêtes/min"
            value={metrics.requests_per_minute?.toFixed(1)}
            unit="req/min"
            status="healthy"
            description="Débit actuel"
            source="Prometheus"
          />
        </div>

        {/* Error Budget Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Error Budget Gauge */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">📊 Budget d'Erreurs ({errorBudget.period})</h2>
            <BudgetProgressBar
              consumed={errorBudget.consumed_minutes}
              remaining={errorBudget.remaining_minutes}
              percentage={errorBudget.remaining_percentage}
            />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs">Budget Total</p>
                <p className="text-white font-semibold">{errorBudget.total_budget_minutes?.toFixed(0)} min</p>
              </div>
              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs">Taux de Consommation</p>
                <p className="text-white font-semibold">{errorBudget.burn_rate?.toFixed(2)}x</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">📊 Source: Calcul interne basé Prometheus</p>
          </div>

          {/* SLO Compliance */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">✅ Conformité SLO</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={complianceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="value" fill="#10b981" name="Conformité %" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-600 mt-3">📊 Source: Prometheus</p>
          </div>
        </div>

        {/* Daily Budget Trend */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📈 Tendance du Budget (7 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="consumed"
                stroke="#ef4444"
                strokeWidth={2}
                name="Consommé (min)"
              />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="#10b981"
                strokeWidth={2}
                name="Restant (min)"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-600 mt-3">📊 Source: Calcul interne</p>
        </div>

        {/* SLA Targets */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-white mb-4">🎯 Cibles SLA</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700 rounded p-4 border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">SLA Disponibilité</p>
              <p className="text-2xl font-bold text-white">{sreMetrics?.sla_summary?.availability_sla}</p>
            </div>
            <div className="bg-slate-700 rounded p-4 border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">SLA Latence (P95)</p>
              <p className="text-2xl font-bold text-white">{sreMetrics?.sla_summary?.latency_sla}</p>
            </div>
            <div className="bg-slate-700 rounded p-4 border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">SLA Taux d'erreurs</p>
              <p className="text-2xl font-bold text-white">{sreMetrics?.sla_summary?.error_rate_sla}</p>
            </div>
          </div>
        </div>

        {/* Alert Rules */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">🚨 Règles d'Alerte SRE</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400">Nom de l'alerte</th>
                  <th className="text-left py-3 px-4 text-slate-400">Seuil</th>
                  <th className="text-left py-3 px-4 text-slate-400">Sévérité</th>
                  <th className="text-left py-3 px-4 text-slate-400">Statut</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, idx) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">{getAlertNameFR(alert.name)}</td>
                    <td className="py-3 px-4 text-slate-400">{alert.threshold}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.severity === 'critical'
                            ? 'bg-red-900 text-red-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}
                      >
                        {alert.severity === 'critical' ? 'CRITIQUE' : 'ATTENTION'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <span className="text-slate-400">Actif</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-600 mt-3">📊 Source: Prometheus AlertManager</p>
        </div>
      </div>
    </div>
  );
}

function getAlertNameFR(name) {
  const translations = {
    'High Error Rate': 'Taux d\'erreurs élevé',
    'High Latency': 'Latence élevée',
    'Low Uptime': 'Disponibilité faible',
    'Error Budget Critical': 'Budget d\'erreurs critique',
    'Error Budget Low': 'Budget d\'erreurs faible',
  };
  return translations[name] || name;
}
