import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Dashboard from './pages/Dashboard.tsx'
import Home from './pages/Home.tsx'

export default function App(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
