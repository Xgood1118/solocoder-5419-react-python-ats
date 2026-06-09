import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobApi } from '../api'

const statusMap = {
  open: { label: '招聘中', class: 'badge-green' },
  closed: { label: '已关闭', class: 'badge-gray' },
  archived: { label: '已归档', class: 'badge-red' },
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '', department: '', level: '', location: '',
    salary_range: '', responsibilities: '', requirements: '',
  })
  const navigate = useNavigate()

  const loadJobs = () => {
    setLoading(true)
    jobApi.list().then(data => {
      setJobs(data || [])
      setLoading(false)
    }).catch(() => {
      setJobs([])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    jobApi.create(formData).then(() => {
      setShowModal(false)
      setFormData({
        title: '', department: '', level: '', location: '',
        salary_range: '', responsibilities: '', requirements: '',
      })
      loadJobs()
    })
  }

  const handleClose = (id) => {
    if (confirm('确定关闭该职位？')) {
      jobApi.close(id).then(() => loadJobs())
    }
  }

  const handleArchive = (id) => {
    if (confirm('确定归档该职位？')) {
      jobApi.archive(id).then(() => loadJobs())
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>职位管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 发布职位
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>职位名称</th>
              <th>部门</th>
              <th>职级</th>
              <th>地点</th>
              <th>薪资范围</th>
              <th>状态</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{textAlign: 'center'}}>加载中...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign: 'center', color: '#6b7280'}}>暂无职位</td></tr>
            ) : (
              jobs.map(job => (
                <tr key={job.id}>
                  <td>
                    <Link to={`/jobs/${job.id}`} style={{color: '#3b82f6', textDecoration: 'none'}}>
                      {job.title}
                    </Link>
                  </td>
                  <td>{job.department}</td>
                  <td>{job.level}</td>
                  <td>{job.location}</td>
                  <td>{job.salary_range}</td>
                  <td>
                    <span className={`badge ${statusMap[job.status]?.class || 'badge-gray'}`}>
                      {statusMap[job.status]?.label || job.status}
                    </span>
                  </td>
                  <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  <td>
                    {job.status === 'open' && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/jobs/${job.id}`)}>
                          详情
                        </button>
                        <button className="btn btn-sm btn-secondary" style={{marginLeft: 4}} onClick={() => handleClose(job.id)}>
                          关闭
                        </button>
                      </>
                    )}
                    {job.status === 'closed' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleArchive(job.id)}>
                        归档
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>发布新职位</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>职位名称 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>部门 *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>职级</label>
                  <input
                    type="text"
                    value={formData.level}
                    onChange={e => setFormData({...formData, level: e.target.value})}
                    placeholder="如 P5、P6"
                  />
                </div>
                <div className="form-group">
                  <label>工作地点</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>薪资范围</label>
                <input
                  type="text"
                  value={formData.salary_range}
                  onChange={e => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="如 20k-35k"
                />
              </div>
              <div className="form-group">
                <label>岗位职责</label>
                <textarea
                  rows="4"
                  value={formData.responsibilities}
                  onChange={e => setFormData({...formData, responsibilities: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>任职要求</label>
                <textarea
                  rows="4"
                  value={formData.requirements}
                  onChange={e => setFormData({...formData, requirements: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">发布</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
