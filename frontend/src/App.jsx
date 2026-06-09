import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Jobs from './pages/Jobs.jsx'
import JobDetail from './pages/JobDetail.jsx'
import Candidates from './pages/Candidates.jsx'
import CandidateDetail from './pages/CandidateDetail.jsx'
import Interviews from './pages/Interviews.jsx'
import Offers from './pages/Offers.jsx'
import TalentPool from './pages/TalentPool.jsx'

function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">ATS 招聘系统</div>
        <nav>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
            数据看板
          </NavLink>
          <NavLink to="/jobs" className={({isActive}) => isActive ? 'active' : ''}>
            职位管理
          </NavLink>
          <NavLink to="/candidates" className={({isActive}) => isActive ? 'active' : ''}>
            候选人管理
          </NavLink>
          <NavLink to="/interviews" className={({isActive}) => isActive ? 'active' : ''}>
            面试管理
          </NavLink>
          <NavLink to="/offers" className={({isActive}) => isActive ? 'active' : ''}>
            Offer 管理
          </NavLink>
          <NavLink to="/talent-pool" className={({isActive}) => isActive ? 'active' : ''}>
            人才库
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/talent-pool" element={<TalentPool />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
