import { useState, useEffect, useRef } from 'react'
import { WOW_CLASSES } from '../../assets/classes/index.js'
import { useLang } from '../../LangContext.jsx'

export default function CharacterModal({ title, initial = '', initialClassId = null, hiddenTaskIds = [], tasks = [], tabs = [], onSubmit, onClose, onDelete = null }) {
  const { t } = useLang()
  const [name, setName]       = useState(initial)
  const [classId, setClassId] = useState(initialClassId)
  const [hidden, setHidden]   = useState(new Set(hiddenTaskIds))
  const inputRef = useRef()

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const toggleTask = (tid) => {
    setHidden(prev => {
      const next = new Set(prev)
      next.has(tid) ? next.delete(tid) : next.add(tid)
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !classId) return
    onSubmit({ name: name.trim(), classId, hiddenTaskIds: [...hidden] })
  }

  const renderTask = (task) => {
    const isHidden = hidden.has(task.id)
    const period = (task.periodicity || 'daily').toLowerCase()
    return (
      <label key={task.id} className={`char-task-row ${isHidden ? 'char-task-disabled' : ''}`}>
        <input type="checkbox" className="char-task-check" checked={!isHidden} onChange={() => toggleTask(task.id)} />
        <span className={`task-item-dot ${period}`} />
        <span className="char-task-name">{task.name}</span>
        <span className="task-item-period">{period[0].toUpperCase()}</span>
      </label>
    )
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
              <label className="form-label">{t('charNameLabel')}</label>
              <input
                ref={inputRef}
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('charNamePlaceholder')}
                maxLength={40}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('classLabel')}</label>
              <div className="class-picker">
                {WOW_CLASSES.map(cls => (
                  <button
                    key={cls.id}
                    type="button"
                    title={cls.name}
                    className={`class-btn ${classId === cls.id ? 'selected' : ''}`}
                    onClick={() => setClassId(cls.id)}
                  >
                    <img src={cls.icon} alt={cls.name} className="class-btn-img" />
                  </button>
                ))}
              </div>
              {classId && (
                <div className="class-selected-name">
                  {WOW_CLASSES.find(c => c.id === classId)?.name}
                </div>
              )}
            </div>
            {tasks.length > 0 && (
              <div className="form-group">
                <label className="form-label">{t('tasksLabel')}</label>
                <div className="char-task-list">
                  {tabs.length > 1
                    ? tabs.map(tab => {
                        const tabTasks = tasks.filter(t => t.tab_id === tab.id)
                        if (!tabTasks.length) return null
                        return (
                          <div key={tab.id}>
                            <div className="char-task-tab-header">{tab.name}</div>
                            {tabTasks.map(renderTask)}
                          </div>
                        )
                      })
                    : tasks.map(renderTask)
                  }
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            {onDelete && (
              <button type="button" className="btn btn-danger" onClick={onDelete} style={{ marginRight: 'auto' }}>{t('deleteBtn')}</button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancelBtn')}</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || !classId}>{t('saveBtn')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
