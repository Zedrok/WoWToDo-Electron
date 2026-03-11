import { useState, useRef, useEffect } from 'react'
import { WOW_PROFESSIONS } from '../assets/professions/index.js'
import { useLang } from '../LangContext.jsx'

const PROFESSION_MAP = Object.fromEntries(WOW_PROFESSIONS.map(p => [p.id, p]))

function InlineForm({ initial, onSubmit, onCancel, onDelete }) {
  const { t } = useLang()
  const [name,         setName]         = useState(initial?.name         || '')
  const [period,       setPeriod]       = useState(initial?.periodicity  || 'daily')
  const [stateCount,   setStateCount]   = useState(initial?.state_count  ?? 3)
  const [professionId, setProfessionId] = useState(initial?.profession_id || null)
  const [customImage,  setCustomImage]  = useState(initial?.custom_image  || null)
  const [trackProfit,  setTrackProfit]  = useState(initial?.track_profit  || false)
  const [profitDisplay, setProfitDisplay] = useState(initial?.profit_display || 'both')
  const inputRef = useRef()
  const imageRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCustomImage(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit({ name: name.trim(), period, stateCount, professionId, customImage, trackProfit, profitDisplay }) }}
      className="task-panel-form"
    >
      <div className="task-panel-form-body">
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
                <input type="radio" name="tp-period" value={p} checked={period === p} onChange={() => setPeriod(p)} />
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
              <input type="radio" name="tp-states" value={2} checked={stateCount === 2} onChange={() => setStateCount(2)} />
              <span style={{ color: stateCount === 2 ? 'var(--gold)' : 'var(--fg2)' }}>
                <span style={{ marginRight: 8 }}>{t('states2')}</span>
                <span style={{ color: 'var(--fg3)', fontSize: 13 }}>{t('states2Desc')}</span>
              </span>
            </label>
            <label className="radio-option">
              <input type="radio" name="tp-states" value={3} checked={stateCount === 3} onChange={() => setStateCount(3)} />
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
            <input type="checkbox" checked={trackProfit} onChange={e => setTrackProfit(e.target.checked)} />
            <span style={{ color: trackProfit ? 'var(--gold)' : 'var(--fg2)', fontSize: 12 }}>{t('profitToggleDesc')}</span>
          </label>
          {trackProfit && period === 'daily' && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(197,153,83,0.08)', borderRadius: 4, border: '1px solid rgba(197,153,83,0.2)' }}>
              <label style={{ fontSize: 11, color: 'var(--fg3)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('profitDisplayLabel')}</label>
              <div className="radio-group" style={{ flexDirection: 'column', gap: 4 }}>
                {[['daily', 'profitDisplayDaily'], ['weekly', 'profitDisplayWeekly'], ['both', 'profitDisplayBoth']].map(([val, key]) => (
                  <label key={val} className="radio-option" style={{ fontSize: 12 }}>
                    <input type="radio" name="tp-pdisplay" value={val} checked={profitDisplay === val} onChange={() => setProfitDisplay(val)} />
                    <span style={{ color: profitDisplay === val ? 'var(--gold)' : 'var(--fg2)' }}>{t(key)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
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
          {professionId && <div className="class-selected-name">{WOW_PROFESSIONS.find(p => p.id === professionId)?.name}</div>}
        </div>
      </div>

      <div className="task-panel-form-footer">
        {onDelete && (
          <button type="button" className="btn btn-danger" style={{ fontSize: 11 }} onClick={onDelete}>
            {t('deleteBtn')}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button type="button" className="btn btn-secondary" style={{ fontSize: 11 }} onClick={onCancel}>{t('cancelBtn')}</button>
        <button type="submit" className="btn btn-primary" style={{ fontSize: 11 }} disabled={!name.trim()}>{t('saveBtn')}</button>
      </div>
    </form>
  )
}

export default function TaskPanel({ tasks, onClose, onAdd, onEdit, onDelete, onReorder }) {
  const { t } = useLang()
  const [selectedId, setSelectedId] = useState(null)
  const dragId = useRef(null)
  const [overId, setOverId] = useState(null)

  const selectedTask = (selectedId && selectedId !== 'new')
    ? tasks.find(task => task.id === selectedId)
    : null

  // Auto-clear selection if task was deleted externally
  useEffect(() => {
    if (selectedId && selectedId !== 'new' && !tasks.find(task => task.id === selectedId)) {
      setSelectedId(null)
    }
  }, [tasks, selectedId])

  const handleDragStart = (e, id) => { dragId.current = id; e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver  = (e, id) => { e.preventDefault(); if (dragId.current && dragId.current !== id) setOverId(id) }
  const handleDrop      = (e, id) => {
    e.preventDefault()
    if (!dragId.current || dragId.current === id) return
    const ids  = tasks.map(t => t.id)
    const from = ids.indexOf(dragId.current)
    const to   = ids.indexOf(id)
    ids.splice(from, 1)
    ids.splice(to, 0, dragId.current)
    dragId.current = null
    setOverId(null)
    onReorder(ids)
  }
  const handleDragEnd = () => { dragId.current = null; setOverId(null) }

  const handleFormSubmit = async (result) => {
    if (selectedId === 'new') {
      await onAdd(result)
    } else {
      await onEdit(selectedId, result)
    }
    setSelectedId(null)
  }

  const isFormOpen = selectedId !== null

  return (
    <div className="panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="task-panel">

        {/* ── Left: Task List ── */}
        <div className="task-panel-list">
          <div className="panel-header">
            <span className="sidebar-title">{t('tasksTitle')}</span>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>

          <div className="task-list">
            {tasks.length === 0 && (
              <div style={{ padding: '20px 14px', color: 'var(--fg3)', fontSize: '11px', textAlign: 'center' }}>
                {t('noTasksYet').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
              </div>
            )}
            {tasks.map(task => {
              const period = (task.periodicity || 'daily').toLowerCase()
              return (
                <div
                  key={task.id}
                  className={`task-item ${selectedId === task.id ? 'selected' : ''} ${overId === task.id ? 'drag-over' : ''}`}
                  draggable
                  onClick={() => setSelectedId(prev => prev === task.id ? null : task.id)}
                  onDragStart={e => handleDragStart(e, task.id)}
                  onDragOver={e => handleDragOver(e, task.id)}
                  onDrop={e => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="drag-handle">⠿</span>
                  {task.custom_image
                    ? <img src={task.custom_image} alt="" className="task-prof-icon-sm" />
                    : (task.profession_id && PROFESSION_MAP[task.profession_id])
                      ? <img src={PROFESSION_MAP[task.profession_id].icon} alt={PROFESSION_MAP[task.profession_id].name} className="task-prof-icon-sm" title={PROFESSION_MAP[task.profession_id].name} />
                      : <span className={`task-item-dot ${period}`} />
                  }
                  <span className="task-item-name" title={task.name}>{task.name}</span>
                  <span className="task-item-period">{period[0].toUpperCase()}</span>
                </div>
              )
            })}
          </div>

          <div className="panel-list-footer">
            <button
              className={`btn ${selectedId === 'new' ? 'btn-gold' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '5px 10px', width: '100%' }}
              onClick={() => setSelectedId('new')}
            >
              {t('newTaskBtn')}
            </button>
          </div>
        </div>

        {/* ── Right: Inline Form ── */}
        {isFormOpen && (
          <div className="task-panel-right">
            <div className="panel-header">
              <span className="sidebar-title">
                {selectedId === 'new' ? t('newTaskTitle') : t('editTaskTitle')}
              </span>
            </div>
            <InlineForm
              key={selectedId}
              initial={selectedTask}
              onSubmit={handleFormSubmit}
              onCancel={() => setSelectedId(null)}
              onDelete={selectedId !== 'new' ? () => onDelete(selectedId) : null}
            />
          </div>
        )}

      </div>
    </div>
  )
}
