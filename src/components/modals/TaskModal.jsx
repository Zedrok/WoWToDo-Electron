import { useState, useEffect, useRef } from 'react'
import { WOW_PROFESSIONS } from '../../assets/professions/index.js'
import { useLang } from '../../LangContext.jsx'

export default function TaskModal({ title, initial = null, onSubmit, onClose }) {
  const { t } = useLang()
  const [name,         setName]         = useState(initial?.name        || '')
  const [period,       setPeriod]       = useState(initial?.periodicity || 'daily')
  const [stateCount,   setStateCount]   = useState(initial?.state_count ?? 3)
  const [professionId, setProfessionId] = useState(initial?.profession_id || null)
  const [customImage,  setCustomImage]  = useState(initial?.custom_image  || null)
  const [trackProfit,  setTrackProfit]  = useState(initial?.track_profit  || false)
  const inputRef  = useRef()
  const imageRef  = useRef()

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCustomImage(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), period, stateCount, professionId, customImage, trackProfit })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">{t('taskNameLabel')}</label>
              <input
                ref={inputRef}
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('taskNamePlaceholder')}
                maxLength={60}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('periodicityLabel')}</label>
              <div className="radio-group">
                {['daily', 'weekly'].map(p => (
                  <label key={p} className="radio-option">
                    <input
                      type="radio"
                      name="period"
                      value={p}
                      checked={period === p}
                      onChange={() => setPeriod(p)}
                    />
                    <span style={{ color: period === p ? 'var(--gold)' : 'var(--fg2)' }}>
                      {t(p === 'daily' ? 'periodDaily' : 'periodWeekly')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('statesLabel')}</label>
              <div className="radio-group" style={{ flexDirection: 'column', gap: 8 }}>
                <label className="radio-option">
                  <input type="radio" name="stateCount" value={2} checked={stateCount === 2} onChange={() => setStateCount(2)} />
                  <span style={{ color: stateCount === 2 ? 'var(--gold)' : 'var(--fg2)' }}>
                    <span style={{ marginRight: 8 }}>{t('states2')}</span>
                    <span style={{ color: 'var(--fg3)', fontSize: 13 }}>{t('states2Desc')}</span>
                  </span>
                </label>
                <label className="radio-option">
                  <input type="radio" name="stateCount" value={3} checked={stateCount === 3} onChange={() => setStateCount(3)} />
                  <span style={{ color: stateCount === 3 ? 'var(--gold)' : 'var(--fg2)' }}>
                    <span style={{ marginRight: 8 }}>{t('states3')}</span>
                    <span style={{ color: 'var(--fg3)', fontSize: 13 }}>{t('states3Desc')}</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('customImageLabel')} <span style={{ color: 'var(--fg3)', fontWeight: 400 }}>{t('optional')}</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {customImage && <img src={customImage} alt="" style={{ width: 32, height: 32, borderRadius: 4, flexShrink: 0 }} />}
                <button type="button" className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => imageRef.current.click()}>
                  {customImage ? t('changeImg') : t('uploadImg')}
                </button>
                {customImage && (
                  <button type="button" className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setCustomImage(null)}>{t('removeImg')}</button>
                )}
                <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('profitLabel')}</label>
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={trackProfit}
                  onChange={e => setTrackProfit(e.target.checked)}
                />
                <span style={{ color: trackProfit ? 'var(--gold)' : 'var(--fg2)', fontSize: 12 }}>
                  {t('profitToggleDesc')}
                </span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">{t('professionLabel')} <span style={{ color: 'var(--fg3)', fontWeight: 400 }}>{t('optional')}</span></label>
              <div className="class-picker">
                {WOW_PROFESSIONS.map(prof => (
                  <button
                    key={prof.id}
                    type="button"
                    title={prof.name}
                    className={`class-btn ${professionId === prof.id ? 'selected' : ''}`}
                    onClick={() => setProfessionId(prev => prev === prof.id ? null : prof.id)}
                  >
                    <img src={prof.icon} alt={prof.name} className="class-btn-img" />
                  </button>
                ))}
              </div>
              {professionId && (
                <div className="class-selected-name">
                  {WOW_PROFESSIONS.find(p => p.id === professionId)?.name}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancelBtn')}</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{t('saveBtn')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
