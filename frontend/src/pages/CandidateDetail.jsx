import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { candidateApi, applicationApi, resumeApi, interviewApi, jobApi } from '../api'
import { statusMap, interviewRoundMap } from '../utils/constants'

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [applications, setApplications] = useState([])
  const [resumes, setResumes] = useState([])
  const [interviews, setInterviews] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('basic')
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
  const [weightedScore, setWeightedScore] = useState(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      candidateApi.get(id).catch(() => null),
      candidateApi.getApplications(id).catch(() => []),
      resumeApi.list(id).catch(() => []),
      jobApi.list().catch(() => []),
    ]).then(([cand, apps, res, jbs]) => {
      setCandidate(cand)
      setApplications(apps || [])
      setResumes(res || [])
      setJobs(jbs || [])

      const allInterviews = []
      const interviewPromises = (apps || []).map(app =>
        interviewApi.list({ application_id: app.id }).catch(() => [])
      )
      Promise.all(interviewPromises).then(results => {
        results.forEach((list, idx) => {
          list.forEach(i => {
            allInterviews.push({ ...i, job_id: apps[idx].job_id })
          })
        })
        setInterviews(allInterviews)
        setLoading(false)
      })
    })
  }

  useEffect(() => {
    loadData()
  }, [id])

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId)
    return job ? job.title : jobId
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
    if (!selectedApp || !interviewForm.interviewer_name || !interviewForm.scheduled_at) {
      alert('请填写完整信息')
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

  const loadWeightedScore = (appId) => {
    interviewApi.getWeightedScore(appId).then(data => {
      setWeightedScore(data)
    })
  }

  if (loading) {
    return <div className="card">加载中...</div>
  }

  if (!candidate) {
    return <div className="card">候选人不存在</div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{candidate.name || '未命名候选人'}</h1>
          <p style={{color: '#6b7280', marginTop: 4}}>
            {candidate.phone || '无电话'} · {candidate.email || '无邮箱'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/candidates')}>返回</button>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
          基本信息
        </div>
        <div className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          投递记录 ({applications.length})
        </div>
        <div className={`tab ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => setActiveTab('resume')}>
          简历 ({resumes.length})
        </div>
        <div className={`tab ${activeTab === 'interviews' ? 'active' : ''}`} onClick={() => setActiveTab('interviews')}>
          面试 ({interviews.length})
        </div>
      </div>

      {activeTab === 'basic' && (
        <div className="card">
          <h3 className="section-title">联系方式</h3>
          <div className="form-row">
            <div><strong>姓名：</strong>{candidate.name || '-'}</div>
            <div><strong>手机：</strong>{candidate.phone || '-'}</div>
            <div><strong>邮箱：</strong>{candidate.email || '-'}</div>
            <div><strong>来源：</strong>{candidate.source_channel || '-'}</div>
          </div>

          <h3 className="section-title">教育背景</h3>
          {(candidate.education || []).length === 0 ? (
            <p style={{color: '#6b7280'}}>暂无</p>
          ) : (
            candidate.education.map((edu, i) => (
              <div key={i} style={{marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 6}}>
                <div><strong>{edu.school}</strong> · {edu.major}</div>
                <div style={{color: '#6b7280', fontSize: 13}}>
                  {edu.degree} · {edu.start_date} ~ {edu.end_date}
                </div>
              </div>
            ))
          )}

          <h3 className="section-title">工作经历</h3>
          {(candidate.work_experience || []).length === 0 ? (
            <p style={{color: '#6b7280'}}>暂无</p>
          ) : (
            candidate.work_experience.map((work, i) => (
              <div key={i} style={{marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 6}}>
                <div><strong>{work.company}</strong> · {work.position}</div>
                <div style={{color: '#6b7280', fontSize: 13}}>
                  {work.start_date} ~ {work.end_date}
                </div>
                {work.description && (
                  <div style={{marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 14}}>
                    {work.description}
                  </div>
                )}
              </div>
            ))
          )}

          <h3 className="section-title">项目经历</h3>
          {(candidate.project_experience || []).length === 0 ? (
            <p style={{color: '#6b7280'}}>暂无</p>
          ) : (
            candidate.project_experience.map((proj, i) => (
              <div key={i} style={{marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 6}}>
                <div><strong>{proj.name}</strong></div>
                <div style={{color: '#6b7280', fontSize: 13}}>
                  {proj.start_date} ~ {proj.end_date}
                </div>
                {proj.tech_stack && (
                  <div style={{marginTop: 6}}>
                    技术栈：<span className="tag">{proj.tech_stack}</span>
                  </div>
                )}
                {proj.responsibilities && (
                  <div style={{marginTop: 6, whiteSpace: 'pre-wrap', fontSize: 14}}>
                    {proj.responsibilities}
                  </div>
                )}
              </div>
            ))
          )}

          <h3 className="section-title">技能标签</h3>
          <div>
            {(candidate.skills || []).length === 0 ? (
              <span style={{color: '#6b7280'}}>暂无</span>
            ) : (
              candidate.skills.map((s, i) => <span key={i} className="tag">{s}</span>)
            )}
          </div>

          <h3 className="section-title">自我评价</h3>
          <p style={{whiteSpace: 'pre-wrap'}}>{candidate.self_evaluation || '暂无'}</p>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>职位</th>
                <th>当前状态</th>
                <th>初筛结果</th>
                <th>投递时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', color: '#6b7280'}}>暂无投递记录</td></tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <Link to={`/jobs/${app.job_id}`} style={{color: '#3b82f6', textDecoration: 'none'}}>
                        {getJobTitle(app.job_id)}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${statusMap[app.status]?.class || 'badge-gray'}`}>
                        {statusMap[app.status]?.label || app.status}
                      </span>
                    </td>
                    <td>
                      {app.screening_result || '未初筛'}
                    </td>
                    <td>{new Date(app.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleAddInterview(app)}>
                        安排面试
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{marginLeft: 4}}
                        onClick={() => loadWeightedScore(app.id)}
                      >
                        查看评分
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {weightedScore && (
            <div className="modal-overlay" onClick={() => setWeightedScore(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>综合评分</h2>
                  <button className="modal-close" onClick={() => setWeightedScore(null)}>×</button>
                </div>
                <div style={{marginBottom: 20}}>
                  <strong>加权平均分：</strong>
                  <span style={{fontSize: 24, fontWeight: 'bold', color: '#3b82f6', marginLeft: 8}}>
                    {weightedScore.weighted_score || '-'}
                  </span>
                  <span style={{marginLeft: 16}}>
                    总评：<span className={`badge ${
                      weightedScore.overall_rating === 'strong_recommend' ? 'badge-green' :
                      weightedScore.overall_rating === 'recommend' ? 'badge-blue' :
                      weightedScore.overall_rating === 'not_recommend' ? 'badge-red' : 'badge-yellow'
                    }`}>
                      {weightedScore.overall_rating === 'strong_recommend' ? '强烈推荐' :
                       weightedScore.overall_rating === 'recommend' ? '推荐' :
                       weightedScore.overall_rating === 'not_recommend' ? '不推荐' : '中性'}
                    </span>
                  </span>
                </div>

                <h3 className="section-title">各维度分数</h3>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20}}>
                  <div>技术能力：<strong>{weightedScore.dimension_scores?.technical_ability || '-'}</strong></div>
                  <div>沟通能力：<strong>{weightedScore.dimension_scores?.communication_skill || '-'}</strong></div>
                  <div>文化匹配：<strong>{weightedScore.dimension_scores?.cultural_fit || '-'}</strong></div>
                  <div>潜力：<strong>{weightedScore.dimension_scores?.potential || '-'}</strong></div>
                  <div>抗压能力：<strong>{weightedScore.dimension_scores?.stress_resistance || '-'}</strong></div>
                </div>

                <h3 className="section-title">面试官评分明细</h3>
                {(weightedScore.interviews || []).map((item, idx) => (
                  <div key={idx} style={{padding: 12, background: '#f9fafb', borderRadius: 6, marginBottom: 10}}>
                    <div><strong>{item.interviewer}</strong> · {interviewRoundMap[item.round] || item.round}</div>
                    <div style={{color: '#6b7280', fontSize: 13}}>权重：{item.weight}</div>
                    {item.score && (
                      <div style={{marginTop: 8, fontSize: 13}}>
                        技术：{item.score.technical_ability} · 沟通：{item.score.communication_skill} ·
                        文化：{item.score.cultural_fit} · 潜力：{item.score.potential} ·
                        抗压：{item.score.stress_resistance}
                      </div>
                    )}
                    {item.score?.comments && (
                      <div style={{marginTop: 6, fontSize: 13, color: '#374151'}}>
                        评语：{item.score.comments}
                      </div>
                    )}
                  </div>
                ))}

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setWeightedScore(null)}>关闭</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'resume' && (
        <div className="card">
          {resumes.length === 0 ? (
            <p style={{color: '#6b7280'}}>暂无简历</p>
          ) : (
            resumes.map(r => (
              <div key={r.id} style={{padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <strong>{r.file_name}</strong>
                    <span className="badge badge-blue" style={{marginLeft: 8}}>{r.file_type}</span>
                  </div>
                  {r.parsed ? (
                    <span className="badge badge-green">已解析</span>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => {
                      resumeApi.parse(r.id).then(() => loadData())
                    }}>解析</button>
                  )}
                </div>
                {r.parsed_result && (
                  <div style={{marginTop: 12, fontSize: 13}}>
                    <div>姓名：{r.parsed_result.name || '-'}</div>
                    <div>手机：{r.parsed_result.phone || '-'}</div>
                    <div>邮箱：{r.parsed_result.email || '-'}</div>
                    <div>技能：{(r.parsed_result.skills || []).slice(0, 5).map((s, i) => (
                      <span key={i} className="tag">{s}</span>
                    ))}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>职位</th>
                <th>轮次</th>
                <th>面试官</th>
                <th>时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center', color: '#6b7280'}}>暂无面试安排</td></tr>
              ) : (
                interviews.map(i => (
                  <tr key={i.id}>
                    <td>{getJobTitle(i.job_id)}</td>
                    <td>{interviewRoundMap[i.round] || i.round}</td>
                    <td>{i.interviewer_name}</td>
                    <td>{new Date(i.scheduled_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${i.status === 'completed' ? 'badge-green' : i.status === 'cancelled' ? 'badge-red' : 'badge-blue'}`}>
                        {i.status === 'scheduled' ? '已安排' : i.status === 'completed' ? '已完成' : '已取消'}
                      </span>
                    </td>
                    <td>
                      {i.status === 'scheduled' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleScore(i)}>
                          评分
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {interviewModal && (
        <div className="modal-overlay" onClick={() => setInterviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>安排面试</h2>
              <button className="modal-close" onClick={() => setInterviewModal(false)}>×</button>
            </div>
            <p style={{marginBottom: 16}}>职位：{selectedApp ? getJobTitle(selectedApp.job_id) : ''}</p>
            <div className="form-row">
              <div className="form-group">
                <label>面试轮次</label>
                <select value={interviewForm.round} onChange={e => setInterviewForm({...interviewForm, round: e.target.value})}>
                  <option value="first_tech">一面（技术）</option>
                  <option value="second_tech">二面（技术）</option>
                  <option value="third_tech">三面（技术）</option>
                  <option value="hr">HR面</option>
                </select>
              </div>
              <div className="form-group">
                <label>权重</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={interviewForm.weight}
                  onChange={e => setInterviewForm({...interviewForm, weight: parseFloat(e.target.value) || 1})}
                />
              </div>
            </div>
            <div className="form-group">
              <label>面试官姓名</label>
              <input
                type="text"
                value={interviewForm.interviewer_name}
                onChange={e => setInterviewForm({...interviewForm, interviewer_name: e.target.value})}
                placeholder="请输入面试官姓名"
              />
            </div>
            <div className="form-group">
              <label>面试时间</label>
              <input
                type="datetime-local"
                value={interviewForm.scheduled_at}
                onChange={e => setInterviewForm({...interviewForm, scheduled_at: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>面试地点/链接</label>
              <input
                type="text"
                value={interviewForm.location}
                onChange={e => setInterviewForm({...interviewForm, location: e.target.value})}
                placeholder="如 会议室A / Zoom链接"
              />
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
            <p style={{marginBottom: 16}}>
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
                <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`btn btn-sm ${scoreForm[dim] >= n ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setScoreForm({...scoreForm, [dim]: n})}
                    >
                      {n}分
                    </button>
                  ))}
                  <span style={{marginLeft: 8, color: '#6b7280'}}>当前：{scoreForm[dim]}分</span>
                </div>
              </div>
            ))}

            <div className="form-group">
              <label>总评</label>
              <select value={scoreForm.overall_rating} onChange={e => setScoreForm({...scoreForm, overall_rating: e.target.value})}>
                <option value="strong_recommend">强烈推荐</option>
                <option value="recommend">推荐</option>
                <option value="neutral">中性</option>
                <option value="not_recommend">不推荐</option>
              </select>
            </div>

            <div className="form-group">
              <label>评语</label>
              <textarea
                rows="3"
                value={scoreForm.comments}
                onChange={e => setScoreForm({...scoreForm, comments: e.target.value})}
                placeholder="面试评语..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setScoreModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={submitScore}>提交评分</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
