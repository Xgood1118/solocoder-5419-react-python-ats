import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jobApi, applicationApi, candidateApi, resumeApi, interviewApi, offerApi, hireApi } from '../api'
import { statusMap, interviewRoundMap, offerStatusMap } from '../utils/constants'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [allCandidates, setAllCandidates] = useState([])
  const [allResumes, setAllResumes] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('candidates')

  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '', phone: '', email: '', source_channel: '', resume_id: '',
  })
  const [candidateResumes, setCandidateResumes] = useState([])

  const [screenModal, setScreenModal] = useState(null)
  const [screeningResult, setScreeningResult] = useState('match')
  const [screeningNote, setScreeningNote] = useState('')

  const [interviewModal, setInterviewModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [interviewForm, setInterviewForm] = useState({
    round: 'first_tech',
    interviewer_name: '',
    scheduled_at: '',
    location: '',
    weight: 1.0,
  })

  const [scoreModal, setScoreModal] = useState(null)
  const [scoreForm, setScoreForm] = useState({
    technical_ability: 3,
    communication_skill: 3,
    cultural_fit: 3,
    potential: 3,
    stress_resistance: 3,
    overall_rating: 'neutral',
    comments: '',
  })

  const [weightedScoreModal, setWeightedScoreModal] = useState(null)

  const [offerModal, setOfferModal] = useState(false)
  const [offerForm, setOfferForm] = useState({
    base_salary: '',
    performance_bonus: '',
    year_end_bonus: '',
    level: '',
    start_date: '',
    probation_period: '3个月',
    stock_options: '',
    notes: '',
  })

  const [offerActionModal, setOfferActionModal] = useState(null)
  const [offerAction, setOfferAction] = useState('')
  const [actionNote, setActionNote] = useState('')

  const [hireModal, setHireModal] = useState(false)
  const [hireForm, setHireForm] = useState({
    start_date: '',
    department: '',
    position: '',
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      jobApi.get(id).catch(() => null),
      applicationApi.list({ job_id: id }).catch(() => []),
      candidateApi.list().catch(() => []),
    ]).then(([jobData, appData, candData]) => {
      setJob(jobData)
      setApplications(appData || [])
      setAllCandidates(candData || [])

      const candIds = (appData || []).map(a => a.candidate_id)
      const resumePromises = candIds.map(cid =>
        resumeApi.list(cid).catch(() => [])
      )
      Promise.all(resumePromises).then(resumeLists => {
        const resumeMap = {}
        resumeLists.forEach((list, idx) => {
          resumeMap[candIds[idx]] = list
        })
        setAllResumes(resumeMap)
        setLoading(false)
      })
    })
  }

  useEffect(() => {
    loadData()
  }, [id])

  const getCandidate = (cid) => allCandidates.find(c => c.id === cid) || { name: cid }
  const getResumes = (cid) => allResumes[cid] || []

  const openAddCandidate = () => {
    setNewCandidateForm({ name: '', phone: '', email: '', source_channel: '', resume_id: '' })
    setCandidateResumes([])
    setShowAddCandidate(true)
  }

  const handleCandidateChange = (e) => {
    const cid = e.target.value
    setNewCandidateForm({ ...newCandidateForm, resume_id: '' })
    if (cid && cid !== 'new') {
      resumeApi.list(cid).then(resumes => {
        setCandidateResumes(resumes)
      })
    } else {
      setCandidateResumes([])
    }
  }

  const submitAddCandidate = () => {
    const { name, phone, email, source_channel, resume_id } = newCandidateForm

    const doApply = (candidateId, resumeId) => {
      const data = {
        job_id: id,
        candidate_id: candidateId,
      }
      if (resumeId) {
        data.resume_id = resumeId
      }
      applicationApi.create(data).then(() => {
        setShowAddCandidate(false)
        loadData()
      })
    }

    if (newCandidateForm.use_existing && newCandidateForm.existing_candidate) {
      doApply(newCandidateForm.existing_candidate, resume_id)
    } else {
      if (!name) {
        alert('请填写姓名')
        return
      }
      candidateApi.create({ name, phone, email, source_channel }).then(candidate => {
        doApply(candidate.id, resume_id)
      })
    }
  }

  const handleScreen = (app) => {
    setScreenModal(app)
    setScreeningResult(app.screening_result || 'match')
    setScreeningNote(app.screening_note || '')
  }

  const submitScreening = () => {
    if (!screenModal) return
    applicationApi.screen(screenModal.id, screeningResult, screeningNote).then(() => {
      setScreenModal(null)
      loadData()
    })
  }

  const handleAddInterview = (app) => {
    setSelectedApp(app)
    setInterviewForm({
      round: 'first_tech',
      interviewer_name: '',
      scheduled_at: '',
      location: '',
      weight: 1.0,
    })
    setInterviewModal(true)
  }

  const submitInterview = () => {
    if (!selectedApp) return
    if (!interviewForm.interviewer_name || !interviewForm.scheduled_at) {
      alert('请填写面试官和面试时间')
      return
    }
    interviewApi.create({
      ...interviewForm,
      application_id: selectedApp.id,
    }).then(() => {
      setInterviewModal(false)
      loadData()
    })
  }

  const handleScore = (interview) => {
    setScoreModal(interview)
    setScoreForm({
      technical_ability: 3,
      communication_skill: 3,
      cultural_fit: 3,
      potential: 3,
      stress_resistance: 3,
      overall_rating: 'neutral',
      comments: '',
    })
  }

  const submitScore = () => {
    if (!scoreModal) return
    interviewApi.submitScore(scoreModal.id, scoreForm).then(() => {
      setScoreModal(null)
      loadData()
    })
  }

  const viewWeightedScore = (appId) => {
    interviewApi.getWeightedScore(appId).then(data => {
      setWeightedScoreModal(data)
    })
  }

  const handleInterviewPass = (app) => {
    if (!confirm('确认面试通过，进入 Offer 阶段？')) return
    applicationApi.updateStatus(app.id, 'interview_pass', '面试通过').then(() => {
      loadData()
    })
  }

  const handleInterviewFail = (app) => {
    if (!confirm('确认面试不通过？')) return
    applicationApi.updateStatus(app.id, 'interview_fail', '面试不通过').then(() => {
      loadData()
    })
  }

  const handleCreateOffer = (app) => {
    setSelectedApp(app)
    setOfferForm({
      base_salary: '',
      performance_bonus: '',
      year_end_bonus: '',
      level: '',
      start_date: '',
      probation_period: '3个月',
      stock_options: '',
      notes: '',
    })
    setOfferModal(true)
  }

  const submitOffer = () => {
    if (!selectedApp) return
    if (!offerForm.base_salary || !offerForm.level || !offerForm.start_date) {
      alert('请填写基本工资、职级、入职日期')
      return
    }
    offerApi.create({
      application_id: selectedApp.id,
      salary: {
        base_salary: offerForm.base_salary,
        performance_bonus: offerForm.performance_bonus,
        year_end_bonus: offerForm.year_end_bonus,
      },
      level: offerForm.level,
      start_date: offerForm.start_date,
      probation_period: offerForm.probation_period,
      stock_options: offerForm.stock_options,
      notes: offerForm.notes,
    }).then(() => {
      setOfferModal(false)
      loadData()
    })
  }

  const handleOfferAction = (offer, action) => {
    setOfferActionModal(offer)
    setOfferAction(action)
    setActionNote('')
  }

  const submitOfferAction = () => {
    if (!offerActionModal) return
    let promise
    switch (offerAction) {
      case 'send':
        promise = offerApi.send(offerActionModal.id)
        break
      case 'accept':
        promise = offerApi.accept(offerActionModal.id)
        break
      case 'decline':
        promise = offerApi.decline(offerActionModal.id, actionNote)
        break
      case 'lock':
        promise = offerApi.lock(offerActionModal.id)
        break
      default:
        return
    }
    promise.then(() => {
      setOfferActionModal(null)
      loadData()
    })
  }

  const handleHire = (app) => {
    setSelectedApp(app)
    setHireForm({
      start_date: '',
      department: job?.department || '',
      position: job?.title || '',
    })
    setHireModal(true)
  }

  const submitHire = () => {
    if (!selectedApp) return
    if (!hireForm.start_date) {
      alert('请填写入职日期')
      return
    }
    const offers = offerApi.list({ application_id: selectedApp.id }).catch(() => [])
    offers.then(offerList => {
      const offer = offerList[0]
      if (!offer) {
        alert('请先创建并确认 Offer')
        return
      }
      hireApi.createHire({
        candidate_id: selectedApp.candidate_id,
        job_id: id,
        offer_id: offer.id,
        start_date: hireForm.start_date,
        department: hireForm.department,
        position: hireForm.position,
      }).then(() => {
        setHireModal(false)
        loadData()
      })
    })
  }

  const getAppInterviews = (appId) => {
    return interviewApi.list({ application_id: appId }).catch(() => [])
  }

  const getAppOffers = (appId) => {
    return offerApi.list({ application_id: appId }).catch(() => [])
  }

  const canScreen = (app) => app.status === 'applied' || app.status === 'screening'
  const canInterview = (app) => ['screening_pass', 'interview_first', 'interview_second', 'interview_third', 'interview_hr'].includes(app.status)
  const canPassInterview = (app) => ['interview_first', 'interview_second', 'interview_third', 'interview_hr'].includes(app.status)
  const canFailInterview = (app) => ['screening_pass', 'interview_first', 'interview_second', 'interview_third', 'interview_hr'].includes(app.status)
  const canOffer = (app) => ['interview_pass', 'offer', 'offer_negotiating'].includes(app.status)
  const canHire = (app) => ['offer_accepted', 'hired'].includes(app.status)

  if (loading) {
    return <div className="card">加载中...</div>
  }

  if (!job) {
    return <div className="card">职位不存在</div>
  }

  const getStatusBadge = (status) => {
    const info = statusMap[status] || { label: status, class: 'badge-gray' }
    return <span className={`badge ${info.class}`}>{info.label}</span>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{job.title}</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>
            {job.department} · {job.level} · {job.location} · {job.salary_range}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={openAddCandidate}>
            + 添加候选人
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/jobs')}>返回列表</button>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'candidates' ? 'active' : ''}`} onClick={() => setActiveTab('candidates')}>
          候选人 ({applications.length})
        </div>
        <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          职位详情
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <h3 className="section-title">岗位职责</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{job.responsibilities || '暂无'}</p>
          <h3 className="section-title">任职要求</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{job.requirements || '暂无'}</p>
          <h3 className="section-title">基本信息</h3>
          <div className="form-row">
            <div><strong>状态：</strong>{job.status}</div>
            <div><strong>发布时间：</strong>{new Date(job.created_at).toLocaleString()}</div>
            {job.closed_at && <div><strong>关闭时间：</strong>{new Date(job.closed_at).toLocaleString()}</div>}
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>候选人</th>
                <th>联系方式</th>
                <th>当前状态</th>
                <th>初筛</th>
                <th>投递时间</th>
                <th style={{ width: 280 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#6b7280' }}>
                  暂无候选人，点击右上角"添加候选人"
                </td></tr>
              ) : (
                applications.map(app => {
                  const cand = getCandidate(app.candidate_id)
                  return (
                    <tr key={app.id}>
                      <td>
                        <span style={{ cursor: 'pointer', color: '#3b82f6' }}
                          onClick={() => navigate(`/candidates/${app.candidate_id}`)}>
                          {cand.name || app.candidate_id}
                        </span>
                      </td>
                      <td>
                        <div>{cand.phone || '-'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{cand.email || ''}</div>
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
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
                        {canScreen(app) && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleScreen(app)}>
                            初筛
                          </button>
                        )}
                        {canInterview(app) && (
                          <button className="btn btn-sm btn-success" style={{ marginLeft: 4 }}
                            onClick={() => handleAddInterview(app)}>
                            安排面试
                          </button>
                        )}
                        {canPassInterview(app) && (
                          <button className="btn btn-sm btn-success" style={{ marginLeft: 4 }}
                            onClick={() => handleInterviewPass(app)}>
                            面试通过
                          </button>
                        )}
                        {canFailInterview(app) && (
                          <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }}
                            onClick={() => handleInterviewFail(app)}>
                            淘汰
                          </button>
                        )}
                        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 4 }}
                          onClick={() => viewWeightedScore(app.id)}>
                          评分报告
                        </button>
                        {canOffer(app) && (
                          <button className="btn btn-sm btn-primary" style={{ marginLeft: 4 }}
                            onClick={() => handleCreateOffer(app)}>
                            Offer
                          </button>
                        )}
                        {canHire(app) && (
                          <button className="btn btn-sm btn-success" style={{ marginLeft: 4 }}
                            onClick={() => handleHire(app)}>
                            入职
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {applications.length > 0 && (
            <div style={{ marginTop: 16, color: '#6b7280', fontSize: 13 }}>
              提示：点击"初筛"进行初步筛选；初筛通过后可"安排面试"；面试通过后可发"Offer"；Offer 接受后可办理"入职"
            </div>
          )}
        </div>
      )}

      {showAddCandidate && (
        <div className="modal-overlay" onClick={() => setShowAddCandidate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加候选人到此职位</h2>
              <button className="modal-close" onClick={() => setShowAddCandidate(false)}>×</button>
            </div>

            <div className="form-group">
              <label>候选人来源</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label>
                  <input type="radio" checked={!newCandidateForm.use_existing}
                    onChange={() => setNewCandidateForm({ ...newCandidateForm, use_existing: false })} />
                  新建候选人
                </label>
                <label>
                  <input type="radio" checked={newCandidateForm.use_existing}
                    onChange={() => setNewCandidateForm({ ...newCandidateForm, use_existing: true })} />
                  从已有候选人选择
                </label>
              </div>
            </div>

            {newCandidateForm.use_existing ? (
              <>
                <div className="form-group">
                  <label>选择候选人</label>
                  <select value={newCandidateForm.existing_candidate || ''}
                    onChange={handleCandidateChange}>
                    <option value="">请选择</option>
                    {allCandidates.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.id} - {c.phone || '无电话'}</option>
                    ))}
                  </select>
                </div>
                {newCandidateForm.existing_candidate && (
                  <div className="form-group">
                    <label>选择简历</label>
                    <select value={newCandidateForm.resume_id || ''}
                      onChange={e => setNewCandidateForm({ ...newCandidateForm, resume_id: e.target.value })}>
                      <option value="">请选择简历</option>
                      {candidateResumes.map(r => (
                        <option key={r.id} value={r.id}>{r.file_name} ({r.file_type})</option>
                      ))}
                    </select>
                    {candidateResumes.length === 0 && (
                      <p style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>该候选人暂无简历，请先上传</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>姓名 *</label>
                  <input type="text" value={newCandidateForm.name}
                    onChange={e => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>手机</label>
                    <input type="text" value={newCandidateForm.phone}
                      onChange={e => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>邮箱</label>
                    <input type="email" value={newCandidateForm.email}
                      onChange={e => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>来源渠道</label>
                  <select value={newCandidateForm.source_channel || ''}
                    onChange={e => setNewCandidateForm({ ...newCandidateForm, source_channel: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="email">邮箱投递</option>
                    <option value="recruitment_platform">招聘平台</option>
                    <option value="referral">内推</option>
                  </select>
                </div>
                <p style={{ color: '#6b7280', fontSize: 12 }}>
                  提示：创建候选人后请到候选人详情页上传简历并解析
                </p>
              </>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddCandidate(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitAddCandidate}>添加</button>
            </div>
          </div>
        </div>
      )}

      {screenModal && (
        <div className="modal-overlay" onClick={() => setScreenModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>初筛评价</h2>
              <button className="modal-close" onClick={() => setScreenModal(null)}>×</button>
            </div>
            <p style={{ marginBottom: 16 }}>
              候选人：{getCandidate(screenModal.candidate_id).name || screenModal.candidate_id}
            </p>
            <div className="form-group">
              <label>初筛结果</label>
              <select value={screeningResult} onChange={e => setScreeningResult(e.target.value)}>
                <option value="match">匹配（通过初筛）</option>
                <option value="pending">待定（需要进一步考量）</option>
                <option value="not_match">不匹配（淘汰）</option>
              </select>
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea rows="3" value={screeningNote}
                onChange={e => setScreeningNote(e.target.value)}
                placeholder="初筛意见..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setScreenModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={submitScreening}>提交</button>
            </div>
          </div>
        </div>
      )}

      {interviewModal && (
        <div className="modal-overlay" onClick={() => setInterviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>安排面试</h2>
              <button className="modal-close" onClick={() => setInterviewModal(false)}>×</button>
            </div>
            <p style={{ marginBottom: 16 }}>
              候选人：{selectedApp ? getCandidate(selectedApp.candidate_id).name : ''}
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>面试轮次</label>
                <select value={interviewForm.round}
                  onChange={e => setInterviewForm({ ...interviewForm, round: e.target.value })}>
                  <option value="first_tech">一面（技术）</option>
                  <option value="second_tech">二面（技术）</option>
                  <option value="third_tech">三面（技术）</option>
                  <option value="hr">HR 面</option>
                </select>
              </div>
              <div className="form-group">
                <label>权重</label>
                <input type="number" step="0.1" min="0.1"
                  value={interviewForm.weight}
                  onChange={e => setInterviewForm({ ...interviewForm, weight: parseFloat(e.target.value) || 1 })} />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  技术面建议权重 2-3，HR 面建议权重 1
                </p>
              </div>
            </div>
            <div className="form-group">
              <label>面试官姓名 *</label>
              <input type="text" value={interviewForm.interviewer_name}
                onChange={e => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })}
                placeholder="请输入面试官姓名" />
            </div>
            <div className="form-group">
              <label>面试时间 *</label>
              <input type="datetime-local" value={interviewForm.scheduled_at}
                onChange={e => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })} />
            </div>
            <div className="form-group">
              <label>面试地点/链接</label>
              <input type="text" value={interviewForm.location}
                onChange={e => setInterviewForm({ ...interviewForm, location: e.target.value })}
                placeholder="如 会议室A / Zoom链接" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setInterviewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitInterview}>确认安排</button>
            </div>
          </div>
        </div>
      )}

      {scoreModal && (
        <div className="modal-overlay" onClick={() => setScoreModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>面试评分</h2>
              <button className="modal-close" onClick={() => setScoreModal(null)}>×</button>
            </div>
            <p style={{ marginBottom: 16 }}>
              面试官：{scoreModal.interviewer_name} · {interviewRoundMap[scoreModal.round] || scoreModal.round}
            </p>

            {['technical_ability', 'communication_skill', 'cultural_fit', 'potential', 'stress_resistance'].map(dim => (
              <div key={dim} className="form-group">
                <label>
                  {dim === 'technical_ability' ? '技术能力' :
                    dim === 'communication_skill' ? '沟通能力' :
                      dim === 'cultural_fit' ? '文化匹配' :
                        dim === 'potential' ? '潜力' : '抗压能力'}
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button"
                      className={`btn btn-sm ${scoreForm[dim] >= n ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setScoreForm({ ...scoreForm, [dim]: n })}>
                      {n}分
                    </button>
                  ))}
                  <span style={{ marginLeft: 8, color: '#6b7280' }}>当前：{scoreForm[dim]}分</span>
                </div>
              </div>
            ))}

            <div className="form-group">
              <label>总评</label>
              <select value={scoreForm.overall_rating}
                onChange={e => setScoreForm({ ...scoreForm, overall_rating: e.target.value })}>
                <option value="strong_recommend">强烈推荐</option>
                <option value="recommend">推荐</option>
                <option value="neutral">中性</option>
                <option value="not_recommend">不推荐</option>
              </select>
            </div>

            <div className="form-group">
              <label>评语</label>
              <textarea rows="3" value={scoreForm.comments}
                onChange={e => setScoreForm({ ...scoreForm, comments: e.target.value })}
                placeholder="面试评语..." />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setScoreModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={submitScore}>提交评分</button>
            </div>
          </div>
        </div>
      )}

      {weightedScoreModal && (
        <div className="modal-overlay" onClick={() => setWeightedScoreModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>综合评分报告</h2>
              <button className="modal-close" onClick={() => setWeightedScoreModal(null)}>×</button>
            </div>

            <div style={{ marginBottom: 20, padding: 16, background: '#f0f9ff', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#0369a1' }}>加权平均分</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#0369a1' }}>
                {weightedScoreModal.weighted_score || '-'}
              </div>
              <div style={{ marginTop: 8 }}>
                总评：
                <span className={`badge ${
                  weightedScoreModal.overall_rating === 'strong_recommend' ? 'badge-green' :
                    weightedScoreModal.overall_rating === 'recommend' ? 'badge-blue' :
                      weightedScoreModal.overall_rating === 'not_recommend' ? 'badge-red' : 'badge-yellow'
                }`} style={{ fontSize: 14, padding: '4px 10px' }}>
                  {weightedScoreModal.overall_rating === 'strong_recommend' ? '强烈推荐' :
                    weightedScoreModal.overall_rating === 'recommend' ? '推荐' :
                      weightedScoreModal.overall_rating === 'not_recommend' ? '不推荐' : '中性'}
                </span>
              </div>
            </div>

            <h3 className="section-title">各维度分数</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>技术能力：<strong>{weightedScoreModal.dimension_scores?.technical_ability || '-'}</strong></div>
              <div>沟通能力：<strong>{weightedScoreModal.dimension_scores?.communication_skill || '-'}</strong></div>
              <div>文化匹配：<strong>{weightedScoreModal.dimension_scores?.cultural_fit || '-'}</strong></div>
              <div>潜力：<strong>{weightedScoreModal.dimension_scores?.potential || '-'}</strong></div>
              <div>抗压能力：<strong>{weightedScoreModal.dimension_scores?.stress_resistance || '-'}</strong></div>
            </div>

            <h3 className="section-title">面试官评分明细</h3>
            {(weightedScoreModal.interviews || []).length === 0 ? (
              <p style={{ color: '#6b7280' }}>暂无面试评分</p>
            ) : (
              (weightedScoreModal.interviews || []).map((item, idx) => (
                <div key={idx} style={{ padding: 12, background: '#f9fafb', borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>{item.interviewer}</strong> · {interviewRoundMap[item.round] || item.round}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>权重：{item.weight}</div>
                  </div>
                  {item.score && (
                    <>
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        技术：{item.score.technical_ability} · 沟通：{item.score.communication_skill} ·
                        文化：{item.score.cultural_fit} · 潜力：{item.score.potential} ·
                        抗压：{item.score.stress_resistance}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13 }}>
                        总评：{
                          item.score.overall_rating === 'strong_recommend' ? '强烈推荐' :
                            item.score.overall_rating === 'recommend' ? '推荐' :
                              item.score.overall_rating === 'not_recommend' ? '不推荐' : '中性'
                        }
                      </div>
                      {item.score.comments && (
                        <div style={{ marginTop: 6, fontSize: 13, color: '#374151' }}>
                          评语：{item.score.comments}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setWeightedScoreModal(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {offerModal && (
        <div className="modal-overlay" onClick={() => setOfferModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>创建 Offer</h2>
              <button className="modal-close" onClick={() => setOfferModal(false)}>×</button>
            </div>
            <p style={{ marginBottom: 16 }}>
              候选人：{selectedApp ? getCandidate(selectedApp.candidate_id).name : ''}
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>基本工资 *</label>
                <input type="text" value={offerForm.base_salary}
                  onChange={e => setOfferForm({ ...offerForm, base_salary: e.target.value })}
                  placeholder="如 25K" />
              </div>
              <div className="form-group">
                <label>职级 *</label>
                <input type="text" value={offerForm.level}
                  onChange={e => setOfferForm({ ...offerForm, level: e.target.value })}
                  placeholder="如 P6" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>绩效奖金</label>
                <input type="text" value={offerForm.performance_bonus}
                  onChange={e => setOfferForm({ ...offerForm, performance_bonus: e.target.value })}
                  placeholder="如 3个月" />
              </div>
              <div className="form-group">
                <label>年终奖</label>
                <input type="text" value={offerForm.year_end_bonus}
                  onChange={e => setOfferForm({ ...offerForm, year_end_bonus: e.target.value })}
                  placeholder="如 2个月" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>入职日期 *</label>
                <input type="date" value={offerForm.start_date}
                  onChange={e => setOfferForm({ ...offerForm, start_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>试用期</label>
                <input type="text" value={offerForm.probation_period}
                  onChange={e => setOfferForm({ ...offerForm, probation_period: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>股票期权</label>
              <input type="text" value={offerForm.stock_options}
                onChange={e => setOfferForm({ ...offerForm, stock_options: e.target.value })} />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea rows="2" value={offerForm.notes}
                onChange={e => setOfferForm({ ...offerForm, notes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setOfferModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitOffer}>创建 Offer</button>
            </div>
          </div>
        </div>
      )}

      {hireModal && (
        <div className="modal-overlay" onClick={() => setHireModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>办理入职</h2>
              <button className="modal-close" onClick={() => setHireModal(false)}>×</button>
            </div>
            <p style={{ marginBottom: 16 }}>
              候选人：{selectedApp ? getCandidate(selectedApp.candidate_id).name : ''}
            </p>
            <div className="form-group">
              <label>入职日期 *</label>
              <input type="date" value={hireForm.start_date}
                onChange={e => setHireForm({ ...hireForm, start_date: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>部门</label>
                <input type="text" value={hireForm.department}
                  onChange={e => setHireForm({ ...hireForm, department: e.target.value })} />
              </div>
              <div className="form-group">
                <label>职位</label>
                <input type="text" value={hireForm.position}
                  onChange={e => setHireForm({ ...hireForm, position: e.target.value })} />
              </div>
            </div>
            <p style={{ color: '#6b7280', fontSize: 13 }}>
              办理入职后，候选人将自动归档到人才库
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setHireModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitHire}>确认入职</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
