import { useState, useEffect } from 'react'
import { statsApi } from '../api'

const statusLabels = {
  applied: '已投递',
  screening: '初筛中',
  screening_pass: '初筛通过',
  screening_fail: '初筛不通过',
  screening_pending: '初筛待定',
  interview_first: '一面中',
  interview_second: '二面中',
  interview_third: '三面中',
  interview_hr: 'HR面中',
  interview_pass: '面试通过',
  interview_fail: '面试不通过',
  offer: 'Offer阶段',
  offer_accepted: 'Offer已接受',
  offer_declined: 'Offer已拒绝',
  offer_negotiating: 'Offer谈判中',
  hired: '已入职',
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [interviewers, setInterviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const currentMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    Promise.all([
      statsApi.overview().catch(() => ({
        total_jobs: 0, open_jobs: 0, total_candidates: 0,
        total_applications: 0, total_hires: 0, talent_pool_size: 0,
        application_status_counts: {},
      })),
      statsApi.monthly(currentMonth).catch(() => ({
        month: currentMonth, avg_cycle_days: 0, offer_count: 0,
        offer_accepted_count: 0, offer_acceptance_rate: 0,
        job_cycle_stats: [], interview_stats: [],
      })),
      statsApi.interviewers().catch(() => []),
    ]).then(([ov, mo, iv]) => {
      setOverview(ov)
      setMonthly(mo)
      setInterviewers(iv)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="card">加载中...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>数据看板</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{overview?.total_jobs || 0}</div>
          <div className="stat-label">总职位数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{color: '#10b981'}}>{overview?.open_jobs || 0}</div>
          <div className="stat-label">招聘中职位</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{color: '#3b82f6'}}>{overview?.total_candidates || 0}</div>
          <div className="stat-label">候选人总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{color: '#f59e0b'}}>{overview?.total_applications || 0}</div>
          <div className="stat-label">总投递数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{color: '#8b5cf6'}}>{overview?.total_hires || 0}</div>
          <div className="stat-label">已入职</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{color: '#ec4899'}}>{overview?.talent_pool_size || 0}</div>
          <div className="stat-label">人才库</div>
        </div>
      </div>

      <div className="card">
        <h2>各阶段候选人分布</h2>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
          {Object.entries(overview?.application_status_counts || {}).map(([status, count]) => (
            <div key={status} className="badge badge-blue" style={{padding: '8px 12px', fontSize: '13px'}}>
              {statusLabels[status] || status}: {count}
            </div>
          ))}
          {Object.keys(overview?.application_status_counts || {}).length === 0 && (
            <span style={{color: '#6b7280'}}>暂无数据</span>
          )}
        </div>
      </div>

      <div className="card">
        <h2>本月数据统计</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value" style={{fontSize: '24px'}}>
              {monthly?.avg_cycle_days ?? '-'} 天
            </div>
            <div className="stat-label">平均招聘周期</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{fontSize: '24px'}}>{monthly?.offer_count || 0}</div>
            <div className="stat-label">发出 Offer</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{fontSize: '24px', color: '#10b981'}}>
              {monthly?.offer_acceptance_rate ?? 0}%
            </div>
            <div className="stat-label">Offer 接受率</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>面试官工作量</h2>
        <table>
          <thead>
            <tr>
              <th>面试官</th>
              <th>面试次数</th>
              <th>各轮次</th>
            </tr>
          </thead>
          <tbody>
            {interviewers.length === 0 ? (
              <tr><td colSpan="3" style={{textAlign: 'center', color: '#6b7280'}}>暂无数据</td></tr>
            ) : (
              interviewers.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.count}</td>
                  <td>
                    {Object.entries(item.rounds || {}).map(([r, c]) => (
                      <span key={r} className="tag">{r}: {c}</span>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
