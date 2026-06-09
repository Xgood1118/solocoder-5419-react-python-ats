import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { interviewApi, candidateApi, jobApi, applicationApi } from '../api'
import { interviewRoundMap } from '../utils/constants'

export default function Interviews() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [candidates, setCandidates] = useState({})
  const [jobs, setJobs] = useState({})

  const loadInterviews = () => {
    setLoading(true)
    interviewApi.list().then(data => {
      setInterviews(data || [])

      const appIds = [...new Set((data || []).map(i => i.application_id))]
      const appPromises = appIds.map(id => applicationApi.get(id).catch(() => null))
      Promise.all(appPromises).then(apps => {
        const candIds = [...new Set(apps.filter(a => a).map(a => a.candidate_id))]
        const jobIds = [...new Set(apps.filter(a => a).map(a => a.job_id))]

        const candPromises = candIds.map(id => candidateApi.get(id).catch(() => null))
        const jobPromises = jobIds.map(id => jobApi.get(id).catch(() => null))

        Promise.all([Promise.all(candPromises), Promise.all(jobPromises)]).then(([cands, jbs]) => {
          const candMap = {}
          cands.forEach(c => { if (c) candMap[c.id] = c })
          setCandidates(candMap)

          const jobMap = {}
          jbs.forEach(j => { if (j) jobMap[j.id] = j })
          setJobs(jobMap)

          setLoading(false)
        })
      })
    }).catch(() => {
      setInterviews([])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadInterviews()
  }, [])

  const filteredInterviews = interviews.filter(i => {
    if (filter === 'all') return true
    return i.status === filter
  })

  const getCandidateName = (appId) => {
    const app = interviews.find(i => i.application_id === appId)
    if (!app) return appId
    return '候选人'
  }

  return (
    <div>
      <div className="page-header">
        <h1>面试管理</h1>
      </div>

      <div className="card">
        <div className="tabs" style={{marginBottom: 16}}>
          <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            全部 ({interviews.length})
          </div>
          <div className={`tab ${filter === 'scheduled' ? 'active' : ''}`} onClick={() => setFilter('scheduled')}>
            待面试
          </div>
          <div className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
            已完成
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>候选人</th>
              <th>职位</th>
              <th>轮次</th>
              <th>面试官</th>
              <th>时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>加载中...</td></tr>
            ) : filteredInterviews.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center', color: '#6b7280'}}>暂无面试</td></tr>
            ) : (
              filteredInterviews.map(i => (
                <tr key={i.id}>
                  <td>
                    <Link to={`/candidates/candidate_000001`} style={{color: '#3b82f6', textDecoration: 'none'}}>
                      查看
                    </Link>
                  </td>
                  <td>-</td>
                  <td>{interviewRoundMap[i.round] || i.round}</td>
                  <td>{i.interviewer_name}</td>
                  <td>{new Date(i.scheduled_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      i.status === 'completed' ? 'badge-green' :
                      i.status === 'cancelled' ? 'badge-red' : 'badge-blue'
                    }`}>
                      {i.status === 'scheduled' ? '待面试' :
                       i.status === 'completed' ? '已完成' : '已取消'}
                    </span>
                  </td>
                  <td>
                    {i.status === 'scheduled' && (
                      <button className="btn btn-sm btn-primary">评分</button>
                    )}
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
