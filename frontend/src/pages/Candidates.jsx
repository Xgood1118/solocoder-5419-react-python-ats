import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { candidateApi, applicationApi, resumeApi, jobApi } from '../api'
import { statusMap, sourceChannelMap } from '../utils/constants'

export default function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', source_channel: '',
  })
  const [uploadModal, setUploadModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [jobOptions, setJobOptions] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyCandidate, setApplyCandidate] = useState(null)
  const navigate = useNavigate()

  const loadCandidates = () => {
    setLoading(true)
    Promise.all([
      candidateApi.list().catch(() => []),
      jobApi.list().catch(() => []),
    ]).then(([data, jobs]) => {
      setCandidates(data || [])
      setJobOptions(jobs || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadCandidates()
  }, [])

  const handleCreate = (e) => {
    e.preventDefault()
    candidateApi.create(formData).then(() => {
      setShowModal(false)
      setFormData({ name: '', phone: '', email: '', source_channel: '' })
      loadCandidates()
    })
  }

  const handleUpload = (candidate) => {
    setSelectedCandidate(candidate)
    setSelectedFile(null)
    setUploadModal(true)
  }

  const submitUpload = () => {
    if (!selectedCandidate || !selectedFile) return
    resumeApi.upload(selectedCandidate.id, selectedFile).then((resume) => {
      return resumeApi.parse(resume.id)
    }).then(() => {
      setUploadModal(false)
      loadCandidates()
    })
  }

  const handleApply = (candidate) => {
    setApplyCandidate(candidate)
    setSelectedJob('')
    setShowApplyModal(true)
  }

  const submitApply = () => {
    if (!applyCandidate || !selectedJob) return
    resumeApi.list(applyCandidate.id).then(resumes => {
      const resume = resumes[0]
      if (!resume) {
        alert('请先上传简历')
        return
      }
      applicationApi.create({
        job_id: selectedJob,
        candidate_id: applyCandidate.id,
        resume_id: resume.id,
      }).then(() => {
        setShowApplyModal(false)
        loadCandidates()
      })
    })
  }

  return (
    <div>
      <div className="page-header">
        <h1>候选人管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 添加候选人
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>手机</th>
              <th>邮箱</th>
              <th>来源</th>
              <th>技能标签</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>加载中...</td></tr>
            ) : candidates.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center', color: '#6b7280'}}>暂无候选人</td></tr>
            ) : (
              candidates.map(c => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/candidates/${c.id}`} style={{color: '#3b82f6', textDecoration: 'none'}}>
                      {c.name || '未命名'}
                    </Link>
                  </td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>
                    {c.source_channel ? (sourceChannelMap[c.source_channel] || c.source_channel) : '-'}
                  </td>
                  <td>
                    {(c.skills || []).slice(0, 3).map((s, i) => (
                      <span key={i} className="tag">{s}</span>
                    ))}
                    {(c.skills || []).length > 3 && ` 等${c.skills.length}个`}
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleUpload(c)}>
                      上传简历
                    </button>
                    <button className="btn btn-sm btn-primary" style={{marginLeft: 4}} onClick={() => handleApply(c)}>
                      投递职位
                    </button>
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
              <h2>添加候选人</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>手机</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>来源渠道</label>
                <select
                  value={formData.source_channel}
                  onChange={e => setFormData({...formData, source_channel: e.target.value})}
                >
                  <option value="">请选择</option>
                  <option value="email">邮箱投递</option>
                  <option value="recruitment_platform">招聘平台</option>
                  <option value="referral">内推</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadModal && (
        <div className="modal-overlay" onClick={() => setUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>上传简历</h2>
              <button className="modal-close" onClick={() => setUploadModal(false)}>×</button>
            </div>
            <p style={{marginBottom: 16}}>候选人：{selectedCandidate?.name || selectedCandidate?.id}</p>
            <div className="form-group">
              <label>选择文件（支持 PDF、Word、图片）</label>
              <input
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={e => setSelectedFile(e.target.files[0])}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setUploadModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={submitUpload}
                disabled={!selectedFile}
              >
                上传并解析
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>投递到职位</h2>
              <button className="modal-close" onClick={() => setShowApplyModal(false)}>×</button>
            </div>
            <p style={{marginBottom: 16}}>候选人：{applyCandidate?.name || applyCandidate?.id}</p>
            <div className="form-group">
              <label>选择职位</label>
              <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                <option value="">请选择职位</option>
                {jobOptions.filter(j => j.status === 'open').map(j => (
                  <option key={j.id} value={j.id}>{j.title} - {j.department}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={submitApply}
                disabled={!selectedJob}
              >
                确认投递
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
