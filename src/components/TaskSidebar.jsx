import { useRef, useState } from 'react'
import { WOW_PROFESSIONS } from '../assets/professions/index.js'
import { useLang } from '../LangContext.jsx'

const PROFESSION_MAP = Object.fromEntries(WOW_PROFESSIONS.map(p => [p.id, p]))

export default function TaskSidebar({ tasks, selectedTaskId, onSelectTask, onAdd, onEdit, onDelete, onReorder }) {
  const { t } = useLang()
  const dragId = useRef(null)
  const [overId, setOverId] = useState(null)

  const handleDragStart = (e, id) => { dragId.current = id; e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver  = (e, id) => { e.preventDefault(); if (dragId.current && dragId.current !== id) setOverId(id) }
  const handleDrop      = (e, id) => {
    e.preventDefault()
    if (!dragId.current || dragId.current === id) return
    const ids  = tasks.map(t => t.id)
    const from = ids.indexOf(dragId.current); const to = ids.indexOf(id)
    ids.splice(from, 1); ids.splice(to, 0, dragId.current)
    dragId.current = null; setOverId(null)
    onReorder(ids)
  }
  const handleDragEnd = () => { dragId.current = null; setOverId(null) }

  return (
    <div className="task-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{t('tasksTitle')}</span>
        <button className="btn-icon" onClick={onAdd} title={t('addTaskTooltip')}>＋</button>
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
              className={`task-item ${selectedTaskId === task.id ? 'selected' : ''} ${overId === task.id ? 'drag-over' : ''}`}
              draggable
              onClick={() => onSelectTask(task.id)}
              onDoubleClick={() => onEdit(task.id)}
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

      <div className="sidebar-actions">
        <button className="btn btn-gold"      style={{ fontSize: '11px', padding: '4px 10px' }} onClick={onAdd}>{t('newTaskBtn')}</button>
        <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => onEdit(selectedTaskId)}>{t('editBtn')}</button>
        <button className="btn btn-danger"    style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => onDelete(selectedTaskId)}>{t('deleteBtn')}</button>
      </div>
    </div>
  )
}
