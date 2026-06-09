import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { jobApi, applicationApi, candidateApi, resumeApi, interviewApi } from '../api'
import { statusMap as appStatusMap } from '../utils/constants'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('applications')
  const [screeningModal, setScreeningModal] = useState(null)
  const [screeningResult, setScreeningResult] = useState('match')
  const [screeningNote, setScreeningNote] = useState('')

  const loadData = () => {
    setLoading(true)
    Promise.all([
      jobApi.get(id).catch(() => null),
      applicationApi.list({ job_id: id }).catch(() => []),
    ]).then(([jobData, appData]) => {
      setJob(jobData)
      setApplications(appData || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleScreen = (app) => {
    setScreeningModal(app)
    setScreeningResult('match')
    setScreeningNote('')
  }

  const submitScreening = () => {
    if (!screeningModal) return
    applicationApi.screen(screeningModal.id, screeningResult, screeningNote).then(() => {
      setScreeningModal(null)
      loadData()
    })
  }

  if (loading) {
    return <div className="card">加载中...</div>
  }

  if (!job) {
    return <div className="card">职位不存在</div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{job.title}</h1>
          <p style={{color: '#6b7280', marginTop: 4}}>
            {job.department} · {job.level} · {job.location} · {job.salary_range}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/jobs')}>返回</button>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          职位信息
        </div>
        <div className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          候选人 ({applications.length})
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <h3 className="section-title">岗位职责</h3>
          <p style={{whiteSpace: 'pre-wrap'}}>{job.responsibilities || '暂无'}</p>

          <h3 className="section-title">任职要求</h3>
          <p style={{whiteSpace: 'pre-wrap'}}>{job.requirements || '暂无'}</p>

          <h3 className="section-title">基本信息</h3>
          <div className="form-row">
            <div><strong>状态：</strong>{job.status}</div>
            <div><strong>发布时间：</strong>{new Date(job.created_at).toLocaleString()}</div>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>候选人</th>
                <th>联系方式</th>
                <th>当前状态</th>
                <th>初筛结果</th>
                <th>投递时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center', color: '#6b7280'}}>暂无候选人</td></tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <Link to={`/candidates/${app.candidate_id}`} style={{color: '#3b82f6', textDecoration: 'none'}}>
                        候选人 {app.candidate_id}
                      </Link>
                    </td>
                    <td>-</td>
                    <td>
                      <span className={`badge ${appStatusMap[app.status]?.class || 'badge-gray'}`}>
                        {appStatusMap[app.status]?.label || app.status}
                      </span>
                    </td>
                    <td>
                      {app.screening_result ? (
                        <span className={`badge ${
                          app.screening_result === 'match' ? 'badge-green' :
                          app.screening_result === 'not_match' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {app.screening_result === 'match' ? '匹配' :
                           app.screening_result === 'not_match' ? '不匹配' : '待定'}
                        </span>
                      ) : '未初筛'}
                    </td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                      {app.status === 'applied' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleScreen(app)}>
                          初筛
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{marginLeft: 4}}
                        onClick={() => navigate(`/candidates/${app.candidate_id}`)}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {screeningModal && (
        <div className="modal-overlay" onClick={() => setScreeningModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>初筛评价</h2>
              <button className="modal-close" onClick={() => setScreeningModal(null)}>×</button>
            </div>
            <div className="form-group">
              <label>初筛结果</label>
              <select value={screeningResult} onChange={e => setScreeningResult(e.target.value)}>
                <option value="match">匹配</option>
                <option value="not_match">不匹配</option>
                <option value="pending">待定</option>
              </select>
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea
                rows="3"
                value={screeningNote}
                onChange={e => setScreeningNote(e.target.value)}
                placeholder="初筛意见..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setScreeningModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={submitScreening}>提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
