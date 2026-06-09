import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { hireApi } from '../api'

export default function TalentPool() {
  const [talents, setTalents] = useState([])
  const [hires, setHires] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('talent')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      hireApi.listTalentPool().catch(() => []),
      hireApi.listHires().catch(() => []),
    ]).then(([talentData, hireData]) => {
      setTalents(talentData || [])
      setHires(hireData || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>人才库</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'talent' ? 'active' : ''}`} onClick={() => setActiveTab('talent')}>
          人才库 ({talents.length})
        </div>
        <div className={`tab ${activeTab === 'hired' ? 'active' : ''}`} onClick={() => setActiveTab('hired')}>
          已入职 ({hires.length})
        </div>
      </div>

      {activeTab === 'talent' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>手机</th>
                <th>邮箱</th>
                <th>技能</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center'}}>加载中...</td></tr>
              ) : talents.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', color: '#6b7280'}}>人才库为空</td></tr>
              ) : (
                talents.map(t => (
                  <tr key={t.id}>
                    <td>{t.name || '未命名'}</td>
                    <td>{t.phone || '-'}</td>
                    <td>{t.email || '-'}</td>
                    <td>
                      {(t.skills || []).slice(0, 3).map((s, i) => (
                        <span key={i} className="tag">{s}</span>
                      ))}
                    </td>
                    <td>
                      <Link to={`/candidates/${t.id}`} className="btn btn-sm btn-secondary">
                        查看
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'hired' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>候选人ID</th>
                <th>职位</th>
                <th>部门</th>
                <th>入职日期</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center'}}>加载中...</td></tr>
              ) : hires.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', color: '#6b7280'}}>暂无入职记录</td></tr>
              ) : (
                hires.map(h => (
                  <tr key={h.id}>
                    <td>{h.candidate_id}</td>
                    <td>{h.position || '-'}</td>
                    <td>{h.department || '-'}</td>
                    <td>{h.start_date}</td>
                    <td>
                      <span className={`badge ${h.onboarding_completed ? 'badge-green' : 'badge-yellow'}`}>
                        {h.onboarding_completed ? '已完成入职' : '入职中'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
