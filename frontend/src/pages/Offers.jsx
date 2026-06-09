import { useState, useEffect } from 'react'
import { offerApi, applicationApi, candidateApi, jobApi } from '../api'
import { offerStatusMap } from '../utils/constants'

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [applications, setApplications] = useState([])
  const [formData, setFormData] = useState({
    application_id: '',
    base_salary: '',
    performance_bonus: '',
    year_end_bonus: '',
    level: '',
    start_date: '',
    probation_period: '3个月',
    stock_options: '',
    notes: '',
  })
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [actionModal, setActionModal] = useState(null)
  const [counterData, setCounterData] = useState({
    base_salary: '',
    performance_bonus: '',
    year_end_bonus: '',
    notes: '',
  })
  const [declineReason, setDeclineReason] = useState('')

  const loadOffers = () => {
    setLoading(true)
    Promise.all([
      offerApi.list().catch(() => []),
      applicationApi.list().catch(() => []),
    ]).then(([offerData, appData]) => {
      setOffers(offerData || [])
      setApplications(appData || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadOffers()
  }, [])

  const filteredOffers = offers.filter(o => {
    if (filter === 'all') return true
    return o.status === filter
  })

  const getAppInfo = (appId) => {
    return applications.find(a => a.id === appId) || {}
  }

  const handleCreate = () => {
    setFormData({
      application_id: '',
      base_salary: '',
      performance_bonus: '',
      year_end_bonus: '',
      level: '',
      start_date: '',
      probation_period: '3个月',
      stock_options: '',
      notes: '',
    })
    setShowModal(true)
  }

  const submitCreate = () => {
    if (!formData.application_id || !formData.base_salary || !formData.level || !formData.start_date) {
      alert('请填写必填项')
      return
    }
    offerApi.create({
      application_id: formData.application_id,
      salary: {
        base_salary: formData.base_salary,
        performance_bonus: formData.performance_bonus,
        year_end_bonus: formData.year_end_bonus,
      },
      level: formData.level,
      start_date: formData.start_date,
      probation_period: formData.probation_period,
      stock_options: formData.stock_options,
      notes: formData.notes,
    }).then(() => {
      setShowModal(false)
      loadOffers()
    })
  }

  const handleAction = (offer, action) => {
    setSelectedOffer(offer)
    setActionModal(action)
    if (action === 'counter') {
      setCounterData({
        base_salary: offer.salary?.base_salary || '',
        performance_bonus: offer.salary?.performance_bonus || '',
        year_end_bonus: offer.salary?.year_end_bonus || '',
        notes: '',
      })
    }
    if (action === 'decline') {
      setDeclineReason('')
    }
  }

  const submitAction = () => {
    if (!selectedOffer || !actionModal) return

    let promise
    switch (actionModal) {
      case 'send':
        promise = offerApi.send(selectedOffer.id)
        break
      case 'accept':
        promise = offerApi.accept(selectedOffer.id)
        break
      case 'decline':
        promise = offerApi.decline(selectedOffer.id, declineReason)
        break
      case 'counter':
        promise = offerApi.counter(selectedOffer.id, {
          salary: {
            base_salary: counterData.base_salary,
            performance_bonus: counterData.performance_bonus,
            year_end_bonus: counterData.year_end_bonus,
          },
          notes: counterData.notes,
        })
        break
      case 'accept_counter':
        promise = offerApi.acceptCounter(selectedOffer.id)
        break
      case 'reject_counter':
        promise = offerApi.rejectCounter(selectedOffer.id)
        break
      case 'lock':
        promise = offerApi.lock(selectedOffer.id)
        break
      default:
        return
    }

    promise.then(() => {
      setActionModal(null)
      setSelectedOffer(null)
      loadOffers()
    })
  }

  const renderActions = (offer) => {
    const actions = []
    if (offer.status === 'draft') {
      actions.push(<button key="send" className="btn btn-sm btn-primary" onClick={() => handleAction(offer, 'send')}>发送</button>)
    }
    if (offer.status === 'sent') {
      actions.push(<button key="accept" className="btn btn-sm btn-success" onClick={() => handleAction(offer, 'accept')}>接受</button>)
      actions.push(<button key="decline" className="btn btn-sm btn-danger" style={{marginLeft: 4}} onClick={() => handleAction(offer, 'decline')}>拒绝</button>)
      actions.push(<button key="counter" className="btn btn-sm btn-secondary" style={{marginLeft: 4}} onClick={() => handleAction(offer, 'counter')}>还价</button>)
    }
    if (offer.status === 'counter_offer') {
      actions.push(<button key="accept_counter" className="btn btn-sm btn-success" onClick={() => handleAction(offer, 'accept_counter')}>接受还价</button>)
      actions.push(<button key="reject_counter" className="btn btn-sm btn-danger" style={{marginLeft: 4}} onClick={() => handleAction(offer, 'reject_counter')}>拒绝还价</button>)
    }
    if (offer.status === 'accepted') {
      actions.push(<button key="lock" className="btn btn-sm btn-primary" onClick={() => handleAction(offer, 'lock')}>锁定</button>)
    }
    return actions
  }

  return (
    <div>
      <div className="page-header">
        <h1>Offer 管理</h1>
        <button className="btn btn-primary" onClick={handleCreate}>+ 创建 Offer</button>
      </div>

      <div className="card">
        <div className="tabs" style={{marginBottom: 16}}>
          <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            全部 ({offers.length})
          </div>
          <div className={`tab ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>
            草稿
          </div>
          <div className={`tab ${filter === 'sent' ? 'active' : ''}`} onClick={() => setFilter('sent')}>
            已发送
          </div>
          <div className={`tab ${filter === 'accepted' ? 'active' : ''}`} onClick={() => setFilter('accepted')}>
            已接受
          </div>
          <div className={`tab ${filter === 'locked' ? 'active' : ''}`} onClick={() => setFilter('locked')}>
            已锁定
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>申请ID</th>
              <th>薪资</th>
              <th>职级</th>
              <th>入职日期</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>加载中...</td></tr>
            ) : filteredOffers.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center', color: '#6b7280'}}>暂无 Offer</td></tr>
            ) : (
              filteredOffers.map(offer => (
                <tr key={offer.id}>
                  <td>{offer.application_id}</td>
                  <td>
                    {offer.salary?.base_salary || '-'}
                    {offer.salary?.performance_bonus && ` + ${offer.salary.performance_bonus}绩效`}
                  </td>
                  <td>{offer.level}</td>
                  <td>{offer.start_date}</td>
                  <td>
                    <span className={`badge ${offerStatusMap[offer.status]?.class || 'badge-gray'}`}>
                      {offerStatusMap[offer.status]?.label || offer.status}
                    </span>
                  </td>
                  <td>{new Date(offer.created_at).toLocaleDateString()}</td>
                  <td>{renderActions(offer)}</td>
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
              <h2>创建 Offer</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>关联申请 *</label>
              <select value={formData.application_id} onChange={e => setFormData({...formData, application_id: e.target.value})}>
                <option value="">请选择申请</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>{app.id}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>基本工资 *</label>
                <input type="text" value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: e.target.value})} placeholder="如 25K" />
              </div>
              <div className="form-group">
                <label>绩效奖金</label>
                <input type="text" value={formData.performance_bonus} onChange={e => setFormData({...formData, performance_bonus: e.target.value})} placeholder="如 3个月" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>年终奖</label>
                <input type="text" value={formData.year_end_bonus} onChange={e => setFormData({...formData, year_end_bonus: e.target.value})} placeholder="如 2个月" />
              </div>
              <div className="form-group">
                <label>职级 *</label>
                <input type="text" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} placeholder="如 P6" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>入职日期 *</label>
                <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>试用期</label>
                <input type="text" value={formData.probation_period} onChange={e => setFormData({...formData, probation_period: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>股票期权</label>
              <input type="text" value={formData.stock_options} onChange={e => setFormData({...formData, stock_options: e.target.value})} />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitCreate}>创建</button>
            </div>
          </div>
        </div>
      )}

      {actionModal && selectedOffer && (
        <div className="modal-overlay" onClick={() => { setActionModal(null); setSelectedOffer(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {actionModal === 'send' && '发送 Offer'}
                {actionModal === 'accept' && '接受 Offer'}
                {actionModal === 'decline' && '拒绝 Offer'}
                {actionModal === 'counter' && '候选人还价'}
                {actionModal === 'accept_counter' && '接受还价'}
                {actionModal === 'reject_counter' && '拒绝还价'}
                {actionModal === 'lock' && '锁定 Offer'}
              </h2>
              <button className="modal-close" onClick={() => { setActionModal(null); setSelectedOffer(null) }}>×</button>
            </div>

            {actionModal === 'decline' && (
              <div className="form-group">
                <label>拒绝原因</label>
                <textarea rows="3" value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="请输入拒绝原因..." />
              </div>
            )}

            {actionModal === 'counter' && (
              <>
                <div className="form-group">
                  <label>期望基本工资</label>
                  <input type="text" value={counterData.base_salary} onChange={e => setCounterData({...counterData, base_salary: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>期望绩效奖金</label>
                    <input type="text" value={counterData.performance_bonus} onChange={e => setCounterData({...counterData, performance_bonus: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>期望年终奖</label>
                    <input type="text" value={counterData.year_end_bonus} onChange={e => setCounterData({...counterData, year_end_bonus: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>备注说明</label>
                  <textarea rows="2" value={counterData.notes} onChange={e => setCounterData({...counterData, notes: e.target.value})} />
                </div>
              </>
            )}

            {(actionModal === 'send' || actionModal === 'accept' || actionModal === 'accept_counter' || actionModal === 'reject_counter' || actionModal === 'lock') && (
              <p>确定执行此操作吗？</p>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setActionModal(null); setSelectedOffer(null) }}>取消</button>
              <button className="btn btn-primary" onClick={submitAction}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
