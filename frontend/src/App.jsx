import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Alerts from './pages/Alerts'
import './index.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="layout">
          <nav className="sidebar">
            <div className="logo">🔍 AnomalyGuard</div>
            <NavLink to="/" end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>📊</span> Dashboard
            </NavLink>
            <NavLink to="/transactions" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>💳</span> Transactions
            </NavLink>
            <NavLink to="/alerts" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>🚨</span> Alertes
            </NavLink>
          </nav>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/alerts" element={<Alerts />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}